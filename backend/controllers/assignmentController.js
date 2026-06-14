const { pool } = require('../config/database');

// Instructor: create assignment
const createAssignment = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, description, due_date, max_score } = req.body;

    const [course] = await pool.execute(
      'SELECT id FROM courses WHERE id = ? AND instructor_id = ?',
      [courseId, req.user.id]
    );
    if (!course.length) return res.status(404).json({ message: 'Course not found' });

    const [result] = await pool.execute(
      'INSERT INTO assignments (course_id, title, description, due_date, max_score) VALUES (?, ?, ?, ?, ?)',
      [courseId, title, description, due_date, max_score || 100]
    );

    // Notify enrolled students
    const [students] = await pool.execute(
      'SELECT student_id FROM enrollments WHERE course_id = ?',
      [courseId]
    );

    const notifValues = students.map((s) => [
      s.student_id,
      'New Assignment',
      `A new assignment "${title}" has been added. Due: ${new Date(due_date).toLocaleDateString()}`,
      'assignment',
    ]);

    if (notifValues.length) {
      await pool.query(
        'INSERT INTO notifications (user_id, title, message, type) VALUES ?',
        [notifValues]
      );
    }

    res.status(201).json({ message: 'Assignment created', assignmentId: result.insertId });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get assignments for a course
const getCourseAssignments = async (req, res) => {
  try {
    const { courseId } = req.params;

    let query = 'SELECT * FROM assignments WHERE course_id = ? ORDER BY due_date ASC';
    const [assignments] = await pool.execute(query, [courseId]);

    // For students: add submission status
    if (req.user.role === 'student') {
      for (const asgn of assignments) {
        const [sub] = await pool.execute(
          'SELECT * FROM submissions WHERE assignment_id = ? AND student_id = ?',
          [asgn.id, req.user.id]
        );
        asgn.submission = sub[0] || null;
      }
    }

    // For instructors: add submission count
    if (req.user.role === 'instructor') {
      for (const asgn of assignments) {
        const [count] = await pool.execute(
          'SELECT COUNT(*) as total, SUM(CASE WHEN status = "graded" THEN 1 ELSE 0 END) as graded FROM submissions WHERE assignment_id = ?',
          [asgn.id]
        );
        asgn.submission_count = count[0].total;
        asgn.graded_count = count[0].graded;
      }
    }

    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Student: submit assignment
const submitAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { text_content } = req.body;
    const file_url = req.file ? `/${req.file.path.replace(/\\/g, '/')}` : null;

    const [asgn] = await pool.execute(
      'SELECT * FROM assignments WHERE id = ?',
      [assignmentId]
    );
    if (!asgn.length) return res.status(404).json({ message: 'Assignment not found' });

    // Check enrollment
    const [enrolled] = await pool.execute(
      'SELECT id FROM enrollments WHERE student_id = ? AND course_id = ?',
      [req.user.id, asgn[0].course_id]
    );
    if (!enrolled.length) return res.status(403).json({ message: 'Not enrolled in this course' });

    const [existing] = await pool.execute(
      'SELECT id FROM submissions WHERE assignment_id = ? AND student_id = ?',
      [assignmentId, req.user.id]
    );

    if (existing.length) {
      await pool.execute(
        'UPDATE submissions SET file_url = ?, text_content = ?, submitted_at = NOW(), status = "submitted" WHERE assignment_id = ? AND student_id = ?',
        [file_url, text_content, assignmentId, req.user.id]
      );
    } else {
      await pool.execute(
        'INSERT INTO submissions (assignment_id, student_id, file_url, text_content) VALUES (?, ?, ?, ?)',
        [assignmentId, req.user.id, file_url, text_content]
      );
    }

    res.json({ message: 'Assignment submitted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Instructor: get all submissions for an assignment
const getSubmissions = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const [asgn] = await pool.execute(
      `SELECT a.* FROM assignments a
       JOIN courses c ON a.course_id = c.id
       WHERE a.id = ? AND c.instructor_id = ?`,
      [assignmentId, req.user.id]
    );
    if (!asgn.length) return res.status(404).json({ message: 'Assignment not found' });

    const [submissions] = await pool.execute(
      `SELECT s.*, u.name as student_name, u.email as student_email, u.avatar as student_avatar
       FROM submissions s
       JOIN users u ON s.student_id = u.id
       WHERE s.assignment_id = ?
       ORDER BY s.submitted_at DESC`,
      [assignmentId]
    );

    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Instructor: grade submission
const gradeSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { score, feedback } = req.body;

    const [sub] = await pool.execute(
      `SELECT s.*, a.course_id, a.max_score, a.title as assignment_title
       FROM submissions s
       JOIN assignments a ON s.assignment_id = a.id
       JOIN courses c ON a.course_id = c.id
       WHERE s.id = ? AND c.instructor_id = ?`,
      [submissionId, req.user.id]
    );
    if (!sub.length) return res.status(404).json({ message: 'Submission not found' });

    await pool.execute(
      'UPDATE submissions SET score = ?, feedback = ?, graded_at = NOW(), status = "graded" WHERE id = ?',
      [score, feedback, submissionId]
    );

    // Notify student
    await pool.execute(
      'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
      [
        sub[0].student_id,
        'Assignment Graded',
        `Your submission for "${sub[0].assignment_title}" has been graded. Score: ${score}/${sub[0].max_score}`,
        'grade',
      ]
    );

    res.json({ message: 'Submission graded' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update assignment
const updateAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, due_date, max_score } = req.body;

    const [asgn] = await pool.execute(
      `SELECT a.id FROM assignments a
       JOIN courses c ON a.course_id = c.id
       WHERE a.id = ? AND c.instructor_id = ?`,
      [id, req.user.id]
    );
    if (!asgn.length) return res.status(404).json({ message: 'Assignment not found' });

    await pool.execute(
      'UPDATE assignments SET title = ?, description = ?, due_date = ?, max_score = ? WHERE id = ?',
      [title, description, due_date, max_score, id]
    );

    res.json({ message: 'Assignment updated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete assignment
const deleteAssignment = async (req, res) => {
  try {
    const { id } = req.params;

    const [asgn] = await pool.execute(
      `SELECT a.id FROM assignments a
       JOIN courses c ON a.course_id = c.id
       WHERE a.id = ? AND c.instructor_id = ?`,
      [id, req.user.id]
    );
    if (!asgn.length) return res.status(404).json({ message: 'Assignment not found' });

    await pool.execute('DELETE FROM assignments WHERE id = ?', [id]);
    res.json({ message: 'Assignment deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createAssignment, getCourseAssignments, submitAssignment,
  getSubmissions, gradeSubmission, updateAssignment, deleteAssignment,
};
