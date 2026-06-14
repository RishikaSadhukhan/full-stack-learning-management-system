const express = require('express');
const router = express.Router();
const {
  updateVideoProgress, getCourseProgress,
  getLessonProgress, getCourseAnalytics,
} = require('../controllers/progressController');
const { protect, isStudent, isInstructor } = require('../middleware/auth');

router.post('/lessons/:lessonId/progress', protect, isStudent, updateVideoProgress);
router.get('/courses/:courseId/progress', protect, isStudent, getCourseProgress);
router.get('/courses/:courseId/lesson-progress', protect, isStudent, getLessonProgress);
router.get('/courses/:courseId/analytics', protect, isInstructor, getCourseAnalytics);

module.exports = router;
