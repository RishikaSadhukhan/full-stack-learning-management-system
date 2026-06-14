const { pool } = require('../config/database');

// Create course
const createCourse = async (req, res) => {
  try {
    const { title, description, category, level } = req.body;
    const thumbnail = req.file ? `/${req.file.path.replace(/\\/g, '/')}` : null;

    const [result] = await pool.execute(
      'INSERT INTO courses (title, description, thumbnail, instructor_id, category, level) VALUES (?, ?, ?, ?, ?, ?)',
      [title, description, thumbnail, req.user.id, category, level || 'beginner']
    );

    res.status(201).json({ message: 'Course created', courseId: result.insertId });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all published courses (for students to browse)
const getAllCourses = async (req, res) => {
  try {
    const { search, category, level } = req.query;
    let query = `
      SELECT c.*, u.name as instructor_name,
        (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id) as student_count,
        (SELECT COUNT(*) FROM modules m WHERE m.course_id = c.id) as module_count
      FROM courses c
      JOIN users u ON c.instructor_id = u.id
      WHERE c.is_published = TRUE
    `;
    const params = [];

    if (search) { query += ' AND (c.title LIKE ? OR c.description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    if (category) { query += ' AND c.category = ?'; params.push(category); }
    if (level) { query += ' AND c.level = ?'; params.push(level); }

    query += ' ORDER BY c.created_at DESC';

    const [courses] = await pool.execute(query, params);
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get instructor's own courses
const getInstructorCourses = async (req, res) => {
  try {
    const [courses] = await pool.execute(
      `SELECT c.*,
        (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id) as student_count,
        (SELECT COUNT(*) FROM modules m WHERE m.course_id = c.id) as module_count
       FROM courses c WHERE c.instructor_id = ? ORDER BY c.created_at DESC`,
      [req.user.id]
    );
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get single course with modules and lessons
const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;

    const [courses] = await pool.execute(
      `SELECT c.*, u.name as instructor_name, u.bio as instructor_bio, u.avatar as instructor_avatar
       FROM courses c JOIN users u ON c.instructor_id = u.id WHERE c.id = ?`,
      [id]
    );

    if (!courses.length) return res.status(404).json({ message: 'Course not found' });

    const course = courses[0];

    // Check access: published or own course
    if (!course.is_published && course.instructor_id !== req.user.id) {
      return res.status(403).json({ message: 'Course not available' });
    }

    const [modules] = await pool.execute(
      'SELECT * FROM modules WHERE course_id = ? ORDER BY order_index',
      [id]
    );

    for (const mod of modules) {
      const [lessons] = await pool.execute(
        'SELECT * FROM lessons WHERE module_id = ? ORDER BY order_index',
        [mod.id]
      );
      mod.lessons = lessons;
    }

    course.modules = modules;

    // Enrollment status for students
    if (req.user.role === 'student') {
      const [enrollment] = await pool.execute(
        'SELECT id FROM enrollments WHERE student_id = ? AND course_id = ?',
        [req.user.id, id]
      );
      course.isEnrolled = enrollment.length > 0;
    }

    res.json(course);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update course
const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category, level, is_published } = req.body;
    const thumbnail = req.file ? `/${req.file.path.replace(/\\/g, '/')}` : undefined;

    const [existing] = await pool.execute(
      'SELECT id, title, is_published FROM courses WHERE id = ? AND instructor_id = ?',
      [id, req.user.id]
    );
    if (!existing.length) return res.status(404).json({ message: 'Course not found' });

    const updates = [];
    const values = [];
    if (title) { updates.push('title = ?'); values.push(title); }
    if (description !== undefined) { updates.push('description = ?'); values.push(description); }
    if (category) { updates.push('category = ?'); values.push(category); }
    if (level) { updates.push('level = ?'); values.push(level); }
    if (is_published !== undefined) { updates.push('is_published = ?'); values.push(is_published); }
    if (thumbnail) { updates.push('thumbnail = ?'); values.push(thumbnail); }

    if (updates.length) {
      values.push(id);
      await pool.execute(`UPDATE courses SET ${updates.join(', ')} WHERE id = ?`, values);
    }

    // Notify enrolled students when course is newly published
    const courseTitle = title || existing[0].title;
    const wasPublished = existing[0].is_published;
    const isNowPublished = is_published === true || is_published === 'true' || is_published === 1 || is_published === '1';

    if (!wasPublished && isNowPublished) {
      const [students] = await pool.execute(
        'SELECT student_id FROM enrollments WHERE course_id = ?',
        [id]
      );
      if (students.length) {
        const notifValues = students.map(s => [
          s.student_id,
          'Course Published',
          `"${courseTitle}" is now live and ready for learning!`,
          'course',
        ]);
        await pool.query(
          'INSERT INTO notifications (user_id, title, message, type) VALUES ?',
          [notifValues]
        );
      }
    }

    res.json({ message: 'Course updated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete course
const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await pool.execute(
      'SELECT id FROM courses WHERE id = ? AND instructor_id = ?',
      [id, req.user.id]
    );
    if (!existing.length) return res.status(404).json({ message: 'Course not found' });

    await pool.execute('DELETE FROM courses WHERE id = ?', [id]);
    res.json({ message: 'Course deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Enroll student in course
const enrollCourse = async (req, res) => {
  try {
    const { id } = req.params;

    const [course] = await pool.execute(
      'SELECT id FROM courses WHERE id = ? AND is_published = TRUE',
      [id]
    );
    if (!course.length) return res.status(404).json({ message: 'Course not found' });

    const [existing] = await pool.execute(
      'SELECT id FROM enrollments WHERE student_id = ? AND course_id = ?',
      [req.user.id, id]
    );
    if (existing.length) return res.status(400).json({ message: 'Already enrolled' });

    await pool.execute(
      'INSERT INTO enrollments (student_id, course_id) VALUES (?, ?)',
      [req.user.id, id]
    );

    res.json({ message: 'Enrolled successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get student's enrolled courses
const getEnrolledCourses = async (req, res) => {
  try {
    const [courses] = await pool.execute(
      `SELECT c.*, u.name as instructor_name, e.enrolled_at,
        (SELECT COUNT(*) FROM modules m WHERE m.course_id = c.id) as total_modules
       FROM enrollments e
       JOIN courses c ON e.course_id = c.id
       JOIN users u ON c.instructor_id = u.id
       WHERE e.student_id = ?
       ORDER BY e.enrolled_at DESC`,
      [req.user.id]
    );
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createCourse, getAllCourses, getInstructorCourses,
  getCourseById, updateCourse, deleteCourse,
  enrollCourse, getEnrolledCourses,
};
