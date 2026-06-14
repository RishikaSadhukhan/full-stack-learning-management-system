const express = require('express');
const router = express.Router();
const {
  createAssignment, getCourseAssignments, submitAssignment,
  getSubmissions, gradeSubmission, updateAssignment, deleteAssignment,
} = require('../controllers/assignmentController');
const { protect, isInstructor, isStudent } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/courses/:courseId/assignments', protect, isInstructor, createAssignment);
router.get('/courses/:courseId/assignments', protect, getCourseAssignments);
router.put('/assignments/:id', protect, isInstructor, updateAssignment);
router.delete('/assignments/:id', protect, isInstructor, deleteAssignment);
router.post('/assignments/:assignmentId/submit', protect, isStudent, upload.single('file'), submitAssignment);
router.get('/assignments/:assignmentId/submissions', protect, isInstructor, getSubmissions);
router.put('/submissions/:submissionId/grade', protect, isInstructor, gradeSubmission);

module.exports = router;
