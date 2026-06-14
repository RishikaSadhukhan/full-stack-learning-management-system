const express = require('express');
const router = express.Router();
const {
  createModule, updateModule, deleteModule,
  createLesson, updateLesson, deleteLesson,
} = require('../controllers/moduleController');
const { protect, isInstructor } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Module routes
router.post('/courses/:courseId/modules', protect, isInstructor, createModule);
router.put('/modules/:id', protect, isInstructor, updateModule);
router.delete('/modules/:id', protect, isInstructor, deleteModule);

// Lesson routes
router.post('/modules/:moduleId/lessons', protect, isInstructor, upload.single('video'), createLesson);
router.put('/lessons/:id', protect, isInstructor, upload.single('video'), updateLesson);
router.delete('/lessons/:id', protect, isInstructor, deleteLesson);

module.exports = router;
