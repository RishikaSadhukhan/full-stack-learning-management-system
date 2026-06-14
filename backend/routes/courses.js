const express = require('express');
const router = express.Router();
const {
  createCourse, getAllCourses, getInstructorCourses,
  getCourseById, updateCourse, deleteCourse,
  enrollCourse, getEnrolledCourses,
} = require('../controllers/courseController');
const { protect, isInstructor, isStudent } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', protect, getAllCourses);
router.post('/', protect, isInstructor, upload.single('thumbnail'), createCourse);
router.get('/my-courses', protect, isInstructor, getInstructorCourses);
router.get('/enrolled', protect, isStudent, getEnrolledCourses);
router.get('/:id', protect, getCourseById);
router.put('/:id', protect, isInstructor, upload.single('thumbnail'), updateCourse);
router.delete('/:id', protect, isInstructor, deleteCourse);
router.post('/:id/enroll', protect, isStudent, enrollCourse);

module.exports = router;
