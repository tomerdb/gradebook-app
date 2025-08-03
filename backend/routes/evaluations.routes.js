const router = require('express').Router();
const EvaluationsController = require('../controllers/evaluations.controller');
const { teacherOnly, studentOnly, adminOnly, verifyToken, teacherOrAdmin } = require('../middleware/auth.middleware');

// Teacher only routes
router.post('/', teacherOnly, EvaluationsController.create);
router.get('/teacher/:teacherId?', teacherOnly, EvaluationsController.getByTeacher);
router.put('/:id', teacherOnly, EvaluationsController.update);
router.delete('/:id', teacherOrAdmin, EvaluationsController.delete);

// Student routes
router.get('/student/:studentId?', verifyToken, EvaluationsController.getByStudent);
router.get('/course-grades/:studentId?', verifyToken, EvaluationsController.getCourseGrades);
router.get('/final-grade/:studentId/:courseId', verifyToken, EvaluationsController.calculateFinalGrade);

// Admin routes
router.get('/', adminOnly, EvaluationsController.getAll);
router.get('/stats', adminOnly, EvaluationsController.getStats);

// Report routes (accessible by relevant roles) - PDF only, no CSV
router.get('/reports/pdf', verifyToken, EvaluationsController.generatePDFReport);

// Get specific evaluation
router.get('/:id', verifyToken, EvaluationsController.getById);

module.exports = router;
