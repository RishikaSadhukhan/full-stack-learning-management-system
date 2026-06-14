const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Check eligibility and issue certificate
const issueCertificate = async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user.id;

    // Check enrollment
    const [enrollment] = await pool.execute(
      'SELECT id FROM enrollments WHERE student_id = ? AND course_id = ?',
      [studentId, courseId]
    );
    if (!enrollment.length) return res.status(403).json({ message: 'Not enrolled' });

    // Check video progress (>= 90% lessons completed)
    const [totalLessons] = await pool.execute(
      `SELECT COUNT(*) as count FROM lessons l JOIN modules m ON l.module_id = m.id WHERE m.course_id = ?`,
      [courseId]
    );

    const [completedLessons] = await pool.execute(
      `SELECT COUNT(*) as count FROM video_progress vp
       JOIN lessons l ON vp.lesson_id = l.id JOIN modules m ON l.module_id = m.id
       WHERE m.course_id = ? AND vp.student_id = ? AND vp.is_completed = TRUE`,
      [courseId, studentId]
    );

    const videoCompletion = totalLessons[0].count > 0
      ? (completedLessons[0].count / totalLessons[0].count) * 100
      : 0;

    if (videoCompletion < 90) {
      return res.status(400).json({
        message: 'Complete at least 90% of lessons to get certificate',
        videoCompletion: Math.round(videoCompletion),
      });
    }

    // Check existing certificate
    const [existing] = await pool.execute(
      'SELECT * FROM certificates WHERE student_id = ? AND course_id = ?',
      [studentId, courseId]
    );

    if (existing.length) {
      return res.json({ message: 'Certificate already issued', certificate: existing[0] });
    }

    // Issue new certificate
    const certId = 'CERT-' + uuidv4().toUpperCase().slice(0, 8);
    await pool.execute(
      'INSERT INTO certificates (student_id, course_id, certificate_id) VALUES (?, ?, ?)',
      [studentId, courseId, certId]
    );

    // Mark enrollment as completed
    await pool.execute(
      'UPDATE enrollments SET completed_at = NOW() WHERE student_id = ? AND course_id = ?',
      [studentId, courseId]
    );

    // Notify student
    const [courseRow] = await pool.execute('SELECT title FROM courses WHERE id = ?', [courseId]);
    await pool.execute(
      'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
      [
        studentId,
        'Certificate Issued!',
        `Congratulations! Your certificate for "${courseRow[0].title}" is ready to download.`,
        'certificate',
      ]
    );

    const [cert] = await pool.execute('SELECT * FROM certificates WHERE certificate_id = ?', [certId]);
    res.json({ message: 'Certificate issued!', certificate: cert[0] });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get student certificates
const getStudentCertificates = async (req, res) => {
  try {
    const [certs] = await pool.execute(
      `SELECT cert.*, c.title as course_title, u.name as instructor_name
       FROM certificates cert
       JOIN courses c ON cert.course_id = c.id
       JOIN users u ON c.instructor_id = u.id
       WHERE cert.student_id = ?
       ORDER BY cert.issued_at DESC`,
      [req.user.id]
    );
    res.json(certs);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Download certificate as PDF
const downloadCertificate = async (req, res) => {
  try {
    const { certId } = req.params;

    const [rows] = await pool.execute(
      `SELECT cert.*, c.title as course_title, u.name as instructor_name,
              s.name as student_name
       FROM certificates cert
       JOIN courses c ON cert.course_id = c.id
       JOIN users u ON c.instructor_id = u.id
       JOIN users s ON cert.student_id = s.id
       WHERE cert.certificate_id = ? AND cert.student_id = ?`,
      [certId, req.user.id]
    );

    if (!rows.length) return res.status(404).json({ message: 'Certificate not found' });

    const cert = rows[0];
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="certificate-${certId}.pdf"`);

    doc.pipe(res);

    // Background
    doc.rect(0, 0, doc.page.width, doc.page.height).fill('#0f172a');

    // Border
    doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40)
      .lineWidth(3).stroke('#6366f1');

    doc.rect(30, 30, doc.page.width - 60, doc.page.height - 60)
      .lineWidth(1).stroke('#818cf8');

    // Title
    doc.fillColor('#818cf8').fontSize(14).font('Helvetica')
      .text('EDUTRACK LEARNING PLATFORM', 0, 60, { align: 'center' });

    doc.fillColor('#ffffff').fontSize(36).font('Helvetica-Bold')
      .text('CERTIFICATE OF COMPLETION', 0, 90, { align: 'center' });

    // Divider
    doc.moveTo(150, 145).lineTo(doc.page.width - 150, 145)
      .lineWidth(1).stroke('#6366f1');

    doc.fillColor('#94a3b8').fontSize(13).font('Helvetica')
      .text('This is to certify that', 0, 165, { align: 'center' });

    // Student name
    doc.fillColor('#6366f1').fontSize(30).font('Helvetica-Bold')
      .text(cert.student_name, 0, 190, { align: 'center' });

    doc.fillColor('#94a3b8').fontSize(13).font('Helvetica')
      .text('has successfully completed the course', 0, 235, { align: 'center' });

    // Course name
    doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold')
      .text(cert.course_title, 0, 260, { align: 'center' });

    doc.fillColor('#94a3b8').fontSize(12).font('Helvetica')
      .text(`Instructed by ${cert.instructor_name}`, 0, 300, { align: 'center' });

    // Divider
    doc.moveTo(150, 325).lineTo(doc.page.width - 150, 325)
      .lineWidth(1).stroke('#6366f1');

    // Footer info
    const completionDate = new Date(cert.issued_at).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });

    doc.fillColor('#94a3b8').fontSize(11)
      .text(`Date of Completion: ${completionDate}`, 100, 345)
      .text(`Certificate ID: ${cert.certificate_id}`, 100, 362);

    doc.end();
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


// Instructor: issue certificate for a specific student in their course
const issueInstructorCertificate = async (req, res) => {
  try {
    const { courseId, studentId } = req.params;

    // Verify this course belongs to the requesting instructor
    const [course] = await pool.execute(
      'SELECT title FROM courses WHERE id = ? AND instructor_id = ?',
      [courseId, req.user.id]
    );
    if (!course.length) return res.status(404).json({ message: 'Course not found' });

    // Verify student is enrolled
    const [enrollment] = await pool.execute(
      'SELECT id FROM enrollments WHERE student_id = ? AND course_id = ?',
      [studentId, courseId]
    );
    if (!enrollment.length) return res.status(403).json({ message: 'Student not enrolled in this course' });

    // Check video completion (>= 90%)
    const [totalLessons] = await pool.execute(
      `SELECT COUNT(*) as count FROM lessons l JOIN modules m ON l.module_id = m.id WHERE m.course_id = ?`,
      [courseId]
    );
    const [completedLessons] = await pool.execute(
      `SELECT COUNT(*) as count FROM video_progress vp
       JOIN lessons l ON vp.lesson_id = l.id JOIN modules m ON l.module_id = m.id
       WHERE m.course_id = ? AND vp.student_id = ? AND vp.is_completed = TRUE`,
      [courseId, studentId]
    );

    const videoCompletion = totalLessons[0].count > 0
      ? (completedLessons[0].count / totalLessons[0].count) * 100
      : 0;

    if (videoCompletion < 90) {
      return res.status(400).json({
        message: 'Student has not completed at least 90% of lessons',
        videoCompletion: Math.round(videoCompletion),
      });
    }

    // Check if already issued
    const [existing] = await pool.execute(
      'SELECT * FROM certificates WHERE student_id = ? AND course_id = ?',
      [studentId, courseId]
    );
    if (existing.length) {
      return res.json({ message: 'Certificate already issued', certificate: existing[0] });
    }

    // Issue certificate
    const certId = 'CERT-' + uuidv4().toUpperCase().slice(0, 8);
    await pool.execute(
      'INSERT INTO certificates (student_id, course_id, certificate_id) VALUES (?, ?, ?)',
      [studentId, courseId, certId]
    );

    // Mark enrollment as completed
    await pool.execute(
      'UPDATE enrollments SET completed_at = NOW() WHERE student_id = ? AND course_id = ?',
      [studentId, courseId]
    );

    // Notify student
    await pool.execute(
      'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
      [
        studentId,
        'Certificate Issued!',
        `Congratulations! Your certificate for "${course[0].title}" has been issued by your instructor.`,
        'certificate',
      ]
    );

    const [cert] = await pool.execute('SELECT * FROM certificates WHERE certificate_id = ?', [certId]);
    res.json({ message: 'Certificate issued!', certificate: cert[0] });
  } catch (error) {
    console.error('issueInstructorCertificate error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all student completions for instructor's courses (for dashboard panel)
const getInstructorCourseCompletions = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT
         c.id as course_id, c.title as course_title,
         u.id as student_id, u.name as student_name, u.email as student_email,
         COALESCE(cert.certificate_id, NULL) as certificate_id,
         COALESCE(cert.issued_at, NULL) as cert_issued_at,
         ROUND(
           (SELECT COUNT(*) FROM video_progress vp2
            JOIN lessons l2 ON vp2.lesson_id = l2.id
            JOIN modules m2 ON l2.module_id = m2.id
            WHERE m2.course_id = c.id AND vp2.student_id = u.id AND vp2.is_completed = TRUE)
           /
           GREATEST((SELECT COUNT(*) FROM lessons l3 JOIN modules m3 ON l3.module_id = m3.id WHERE m3.course_id = c.id), 1)
           * 100
         , 1) as video_completion
       FROM enrollments e
       JOIN courses c ON e.course_id = c.id
       JOIN users u ON e.student_id = u.id
       LEFT JOIN certificates cert ON cert.student_id = u.id AND cert.course_id = c.id
       WHERE c.instructor_id = ?
       HAVING video_completion >= 90
       ORDER BY c.title, u.name`,
      [req.user.id]
    );
    res.json(rows);
  } catch (error) {
    console.error('getInstructorCourseCompletions error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { issueCertificate, getStudentCertificates, downloadCertificate, issueInstructorCertificate, getInstructorCourseCompletions };

