const router = require('express').Router();
const CoursesController = require('../controllers/courses.controller');
const {
    adminOnly,
    teacherOrAdmin,
    verifyToken
} = require('../middleware/auth.middleware');

// Admin only routes
router.get('/', adminOnly, CoursesController.getAll);
router.post('/', adminOnly, CoursesController.create);
router.put('/:id', adminOnly, CoursesController.update);
router.delete('/:id', adminOnly, CoursesController.delete);

// Course enrollment routes (Admin only)
router.post('/enroll', adminOnly, CoursesController.enrollStudent);
router.post('/unenroll', adminOnly, CoursesController.unenrollStudent);
router.get('/:courseId/enrollments', teacherOrAdmin, CoursesController.getEnrollments);
router.get('/:courseId/students', teacherOrAdmin, CoursesController.getCourseStudents);

// Teacher and Admin routes
router.get('/teacher/:teacherId?', teacherOrAdmin, CoursesController.getByTeacher);
router.get('/teacher/:teacherId/students', teacherOrAdmin, CoursesController.getStudentsByTeacher);

// Grading rules routes
router.get('/:courseId/grading-rules', teacherOrAdmin, CoursesController.getGradingRules);
router.put('/:courseId/grading-rules', teacherOrAdmin, CoursesController.updateGradingRules);

// Protected routes
router.get('/:id', verifyToken, CoursesController.getById);

module.exports = router;