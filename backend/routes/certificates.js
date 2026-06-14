const express = require('express');
const router = express.Router();
const { issueCertificate, getStudentCertificates, downloadCertificate, issueInstructorCertificate, getInstructorCourseCompletions } = require('../controllers/certificateController');
const { protect, isStudent, isInstructor } = require('../middleware/auth');

// Student routes
router.post('/courses/:courseId/certificate', protect, isStudent, issueCertificate);
router.get('/certificates', protect, isStudent, getStudentCertificates);
router.get('/certificates/:certId/download', protect, isStudent, downloadCertificate);

// Instructor routes
router.get('/instructor/completions', protect, isInstructor, getInstructorCourseCompletions);
router.post('/instructor/courses/:courseId/students/:studentId/certificate', protect, isInstructor, issueInstructorCertificate);

module.exports = router;

