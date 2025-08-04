const User = require('../models/user.model');
const bcrypt = require('bcryptjs');

const UsersController = {
  // Get all users (Admin only)
  getAll: (req, res) => {
    User.getAll((err, users) => {
      if (err) {
        return res.status(500).json({
          error: 'Database error'
        });
      }
      res.json(users);
    });
  },

  // Get user by ID
  getById: (req, res) => {
    const {
      id
    } = req.params;

    User.getById(id, (err, user) => {
      if (err) {
        return res.status(500).json({
          error: 'Database error'
        });
      }

      if (!user) {
        return res.status(404).json({
          error: 'User not found'
        });
      }

      res.json(user);
    });
  },

  // Create new user
  create: (req, res) => {
    const {
      name,
      email,
      password,
      role
    } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        error: 'All fields are required'
      });
    }

    if (!['admin', 'teacher', 'student'].includes(role)) {
      return res.status(400).json({
        error: 'Invalid role'
      });
    }

    // Check if user already exists
    User.getByEmail(email, (err, existingUser) => {
      if (err) {
        return res.status(500).json({
          error: 'Database error'
        });
      }

      if (existingUser) {
        return res.status(409).json({
          error: 'User already exists'
        });
      }

      // Hash password
      bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
          return res.status(500).json({
            error: 'Password hashing failed'
          });
        }

        // Create user
        User.create({
          name,
          email,
          password: hashedPassword,
          role
        }, (err, userId) => {
          if (err) {
            return res.status(500).json({
              error: 'User creation failed'
            });
          }

          res.status(201).json({
            message: 'User created successfully',
            userId
          });
        });
      });
    });
  },

  // Update user
  update: (req, res) => {
    const {
      id
    } = req.params;
    const {
      name,
      email,
      role
    } = req.body;

    if (!name || !email || !role) {
      return res.status(400).json({
        error: 'Name, email, and role are required'
      });
    }

    if (!['admin', 'teacher', 'student'].includes(role)) {
      return res.status(400).json({
        error: 'Invalid role'
      });
    }

    User.update(id, {
      name,
      email,
      role
    }, (err) => {
      if (err) {
        return res.status(500).json({
          error: 'Update failed'
        });
      }

      res.json({
        message: 'User updated successfully'
      });
    });
  },

  // Delete user
  delete: (req, res) => {
    const {
      id
    } = req.params;

    User.delete(id, (err) => {
      if (err) {
        return res.status(500).json({
          error: 'Delete failed'
        });
      }

      res.json({
        message: 'User deleted successfully'
      });
    });
  },

  // Get students by teacher
  getStudentsByTeacher: (req, res) => {
    const teacherId = req.user.role === 'teacher' ? req.user.id : req.params.teacherId;
    console.log('🔍 getStudentsByTeacher called for teacherId:', teacherId);

    User.getStudentsByTeacher(teacherId, (err, students) => {
      if (err) {
        console.error('❌ Error in getStudentsByTeacher:', err);
        return res.status(500).json({
          error: 'Database error'
        });
      }
      console.log('✅ Found students for teacher:', students.length, 'students');
      console.log('Students data:', students);
      res.json(students);
    });
  },

  // Get all teachers
  getTeachers: (req, res) => {
    User.getTeachers((err, teachers) => {
      if (err) {
        return res.status(500).json({
          error: 'Database error'
        });
      }
      res.json(teachers);
    });
  },

  // Get all students
  getStudents: (req, res) => {
    User.getStudents((err, students) => {
      if (err) {
        return res.status(500).json({
          error: 'Database error'
        });
      }
      res.json(students);
    });
  },

  // Assign student to teacher (create class assignment)
  assignStudentToTeacher: (req, res) => {
    const {
      studentId,
      teacherId
    } = req.body;

    if (!studentId || !teacherId) {
      return res.status(400).json({
        error: 'Student ID and Teacher ID are required'
      });
    }

    User.assignStudentToTeacher(studentId, teacherId, (err) => {
      if (err) {
        return res.status(500).json({
          error: 'Assignment failed'
        });
      }
      res.json({
        message: 'Student assigned to teacher successfully'
      });
    });
  },

  // Unassign student from teacher
  unassignStudentFromTeacher: (req, res) => {
    const {
      studentId,
      teacherId
    } = req.body;

    if (!studentId || !teacherId) {
      return res.status(400).json({
        error: 'Student ID and Teacher ID are required'
      });
    }

    User.unassignStudentFromTeacher(studentId, teacherId, (err) => {
      if (err) {
        return res.status(500).json({
          error: 'Unassignment failed'
        });
      }
      res.json({
        message: 'Student unassigned from teacher successfully'
      });
    });
  },

  // Get teacher assignments (which students are assigned to which teacher)
  getTeacherAssignments: (req, res) => {
    User.getTeacherAssignments((err, assignments) => {
      if (err) {
        return res.status(500).json({
          error: 'Database error'
        });
      }
      res.json(assignments);
    });
  }
};

module.exports = UsersController;