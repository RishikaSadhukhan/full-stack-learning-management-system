const { pool } = require('../config/database');

// Update video progress
const updateVideoProgress = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { watched_duration, total_duration, last_position } = req.body;

    const completion_percentage = total_duration > 0
      ? Math.min(100, (watched_duration / total_duration) * 100)
      : 0;

    const is_completed = completion_percentage >= 90;

    await pool.execute(
      `INSERT INTO video_progress (student_id, lesson_id, watched_duration, total_duration, completion_percentage, last_position, is_completed)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         watched_duration = GREATEST(watched_duration, VALUES(watched_duration)),
         total_duration = VALUES(total_duration),
         completion_percentage = VALUES(completion_percentage),
         last_position = VALUES(last_position),
         is_completed = VALUES(is_completed)`,
      [req.user.id, lessonId, watched_duration, total_duration, completion_percentage, last_position, is_completed]
    );

    res.json({ message: 'Progress updated', completion_percentage, is_completed });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get course progress for a student
const getCourseProgress = async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user.id;

    // Total lessons
    const [totalLessons] = await pool.execute(
      `SELECT COUNT(*) as count FROM lessons l
       JOIN modules m ON l.module_id = m.id
       WHERE m.course_id = ?`,
      [courseId]
    );

    // Completed lessons
    const [completedLessons] = await pool.execute(
      `SELECT COUNT(*) as count FROM video_progress vp
       JOIN lessons l ON vp.lesson_id = l.id
       JOIN modules m ON l.module_id = m.id
       WHERE m.course_id = ? AND vp.student_id = ? AND vp.is_completed = TRUE`,
      [courseId, studentId]
    );

    // Assignment stats
    const [totalAssignments] = await pool.execute(
      'SELECT COUNT(*) as count FROM assignments WHERE course_id = ?',
      [courseId]
    );

    const [completedAssignments] = await pool.execute(
      `SELECT COUNT(*) as count FROM submissions s
       JOIN assignments a ON s.assignment_id = a.id
       WHERE a.course_id = ? AND s.student_id = ?`,
      [courseId, studentId]
    );

    const total = totalLessons[0].count;
    const completed = completedLessons[0].count;
    const videoProgress = total > 0 ? (completed / total) * 100 : 0;

    const totalAsgn = totalAssignments[0].count;
    const completedAsgn = completedAssignments[0].count;
    const assignmentProgress = totalAsgn > 0 ? (completedAsgn / totalAsgn) * 100 : 0;

    // Overall progress weighted: 70% video, 30% assignments
    const overallProgress = totalAsgn > 0
      ? videoProgress * 0.7 + assignmentProgress * 0.3
      : videoProgress;

    res.json({
      videoProgress: Math.round(videoProgress),
      assignmentProgress: Math.round(assignmentProgress),
      overallProgress: Math.round(overallProgress),
      totalLessons: total,
      completedLessons: completed,
      totalAssignments: totalAsgn,
      completedAssignments: completedAsgn,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get lesson progress for student
const getLessonProgress = async (req, res) => {
  try {
    const { courseId } = req.params;

    const [progress] = await pool.execute(
      `SELECT vp.* FROM video_progress vp
       JOIN lessons l ON vp.lesson_id = l.id
       JOIN modules m ON l.module_id = m.id
       WHERE m.course_id = ? AND vp.student_id = ?`,
      [courseId, req.user.id]
    );

    const progressMap = {};
    progress.forEach((p) => { progressMap[p.lesson_id] = p; });
    res.json(progressMap);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Instructor: get all students' progress for a course
const getCourseAnalytics = async (req, res) => {
  try {
    const { courseId } = req.params;

    // Verify instructor owns the course
    const [course] = await pool.execute(
      'SELECT id FROM courses WHERE id = ? AND instructor_id = ?',
      [courseId, req.user.id]
    );
    if (!course.length) return res.status(404).json({ message: 'Course not found' });

    const [students] = await pool.execute(
      `SELECT u.id, u.name, u.email, u.avatar, e.enrolled_at,
        (SELECT COUNT(*) FROM video_progress vp
         JOIN lessons l ON vp.lesson_id = l.id
         JOIN modules m ON l.module_id = m.id
         WHERE m.course_id = ? AND vp.student_id = u.id AND vp.is_completed = TRUE) as completed_lessons,
        (SELECT COUNT(*) FROM lessons l2
         JOIN modules m2 ON l2.module_id = m2.id
         WHERE m2.course_id = ?) as total_lessons,
        (SELECT COUNT(*) FROM submissions s
         JOIN assignments a ON s.assignment_id = a.id
         WHERE a.course_id = ? AND s.student_id = u.id) as submitted_assignments,
        (SELECT AVG(s2.score) FROM submissions s2
         JOIN assignments a2 ON s2.assignment_id = a2.id
         WHERE a2.course_id = ? AND s2.student_id = u.id AND s2.score IS NOT NULL) as avg_grade
       FROM enrollments e
       JOIN users u ON e.student_id = u.id
       WHERE e.course_id = ?`,
      [courseId, courseId, courseId, courseId, courseId]
    );

    res.json(students);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { updateVideoProgress, getCourseProgress, getLessonProgress, getCourseAnalytics };
