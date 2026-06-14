const { pool } = require('../config/database');

// Create module
const createModule = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, description, order_index } = req.body;

    const [course] = await pool.execute(
      'SELECT title FROM courses WHERE id = ? AND instructor_id = ?',
      [courseId, req.user.id]
    );
    if (!course.length) return res.status(404).json({ message: 'Course not found' });

    const [result] = await pool.execute(
      'INSERT INTO modules (course_id, title, description, order_index) VALUES (?, ?, ?, ?)',
      [courseId, title, description, order_index || 0]
    );

    // Notify all enrolled students about the new module
    const [students] = await pool.execute(
      'SELECT student_id FROM enrollments WHERE course_id = ?',
      [courseId]
    );
    if (students.length) {
      const notifValues = students.map(s => [
        s.student_id,
        'New Module Added',
        `A new module "${title}" has been added to "${course[0].title}".`,
        'course',
      ]);
      await pool.query(
        'INSERT INTO notifications (user_id, title, message, type) VALUES ?',
        [notifValues]
      );
    }

    res.status(201).json({ message: 'Module created', moduleId: result.insertId });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update module
const updateModule = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, order_index } = req.body;

    const [mod] = await pool.execute(
      `SELECT m.id FROM modules m
       JOIN courses c ON m.course_id = c.id
       WHERE m.id = ? AND c.instructor_id = ?`,
      [id, req.user.id]
    );
    if (!mod.length) return res.status(404).json({ message: 'Module not found' });

    await pool.execute(
      'UPDATE modules SET title = ?, description = ?, order_index = ? WHERE id = ?',
      [title, description, order_index || 0, id]
    );

    res.json({ message: 'Module updated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete module
const deleteModule = async (req, res) => {
  try {
    const { id } = req.params;

    const [mod] = await pool.execute(
      `SELECT m.id FROM modules m
       JOIN courses c ON m.course_id = c.id
       WHERE m.id = ? AND c.instructor_id = ?`,
      [id, req.user.id]
    );
    if (!mod.length) return res.status(404).json({ message: 'Module not found' });

    await pool.execute('DELETE FROM modules WHERE id = ?', [id]);
    res.json({ message: 'Module deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create lesson
const createLesson = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const { title, content, video_duration, order_index, is_preview } = req.body;
    const video_url = req.file ? `/${req.file.path.replace(/\\/g, '/')}` : null;

    // FormData always sends values as strings, so is_preview arrives as "true" or "false".
    // Using `is_preview || false` would evaluate "false" as truthy (non-empty string),
    // causing MySQL strict mode to reject the literal string "false" for a BOOLEAN column.
    const isPreviewInt = (is_preview === 'true' || is_preview === true) ? 1 : 0;

    const [mod] = await pool.execute(
      `SELECT m.id, m.course_id, c.title as course_title FROM modules m
       JOIN courses c ON m.course_id = c.id
       WHERE m.id = ? AND c.instructor_id = ?`,
      [moduleId, req.user.id]
    );
    if (!mod.length) return res.status(404).json({ message: 'Module not found' });

    const [result] = await pool.execute(
      'INSERT INTO lessons (module_id, title, content, video_url, video_duration, order_index, is_preview) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [moduleId, title, content, video_url, parseInt(video_duration) || 0, parseInt(order_index) || 0, isPreviewInt]
    );

    // Notify all enrolled students about the new lesson
    const courseId = mod[0].course_id;
    const [students] = await pool.execute(
      'SELECT student_id FROM enrollments WHERE course_id = ?',
      [courseId]
    );
    if (students.length) {
      const notifValues = students.map(s => [
        s.student_id,
        'New Lesson Added',
        `A new lesson "${title}" has been added to "${mod[0].course_title}".`,
        'course',
      ]);
      await pool.query(
        'INSERT INTO notifications (user_id, title, message, type) VALUES ?',
        [notifValues]
      );
    }

    res.status(201).json({ message: 'Lesson created', lessonId: result.insertId });
  } catch (error) {
    console.error('createLesson error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update lesson
const updateLesson = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, video_duration, order_index, is_preview } = req.body;
    const video_url = req.file ? `/${req.file.path.replace(/\\/g, '/')}` : undefined;

    // Same fix: convert is_preview string from FormData to a proper integer for MySQL.
    const isPreviewInt = (is_preview === 'true' || is_preview === true) ? 1 : 0;

    const [lesson] = await pool.execute(
      `SELECT l.id FROM lessons l
       JOIN modules m ON l.module_id = m.id
       JOIN courses c ON m.course_id = c.id
       WHERE l.id = ? AND c.instructor_id = ?`,
      [id, req.user.id]
    );
    if (!lesson.length) return res.status(404).json({ message: 'Lesson not found' });

    const updates = ['title = ?', 'content = ?', 'video_duration = ?', 'order_index = ?', 'is_preview = ?'];
    const values = [title, content, parseInt(video_duration) || 0, parseInt(order_index) || 0, isPreviewInt];

    if (video_url) { updates.push('video_url = ?'); values.push(video_url); }
    values.push(id);

    await pool.execute(`UPDATE lessons SET ${updates.join(', ')} WHERE id = ?`, values);

    res.json({ message: 'Lesson updated' });
  } catch (error) {
    console.error('updateLesson error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete lesson
const deleteLesson = async (req, res) => {
  try {
    const { id } = req.params;

    const [lesson] = await pool.execute(
      `SELECT l.id FROM lessons l
       JOIN modules m ON l.module_id = m.id
       JOIN courses c ON m.course_id = c.id
       WHERE l.id = ? AND c.instructor_id = ?`,
      [id, req.user.id]
    );
    if (!lesson.length) return res.status(404).json({ message: 'Lesson not found' });

    await pool.execute('DELETE FROM lessons WHERE id = ?', [id]);
    res.json({ message: 'Lesson deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { createModule, updateModule, deleteModule, createLesson, updateLesson, deleteLesson };
