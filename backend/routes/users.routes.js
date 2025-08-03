const router = require('express').Router();
const UsersController = require('../controllers/users.controller');
const { adminOnly, teacherOrAdmin, verifyToken } = require('../middleware/auth.middleware');

// Admin only routes
router.get('/', adminOnly, UsersController.getAll);
router.post('/', adminOnly, UsersController.create);
router.put('/:id', adminOnly, UsersController.update);
router.delete('/:id', adminOnly, UsersController.delete);

// Teacher-Student assignment routes (Admin only)
router.post('/assign', adminOnly, UsersController.assignStudentToTeacher);
router.post('/unassign', adminOnly, UsersController.unassignStudentFromTeacher);
router.get('/assignments', adminOnly, UsersController.getTeacherAssignments);

// Teacher and Admin routes
router.get('/teachers', teacherOrAdmin, UsersController.getTeachers);
router.get('/students', teacherOrAdmin, UsersController.getStudents);
router.get('/students/teacher/:teacherId?', teacherOrAdmin, UsersController.getStudentsByTeacher);

// Protected routes
router.get('/:id', verifyToken, UsersController.getById);

module.exports = router;
