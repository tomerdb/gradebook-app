const Course = require('../models/course.model');

const CoursesController = {
  // Get all courses (Admin only)
  getAll: (req, res) => {
    Course.getAll((err, courses) => {
      if (err) {
        return res.status(500).json({
          error: 'Database error'
        });
      }
      res.json(courses);
    });
  },

  // Get courses by teacher
  getByTeacher: (req, res) => {
    const teacherId = req.user.role === 'teacher' ? req.user.id : req.params.teacherId;

    Course.getByTeacher(teacherId, (err, courses) => {
      if (err) {
        return res.status(500).json({
          error: 'Database error'
        });
      }
      res.json(courses);
    });
  },

  // Get course by ID
  getById: (req, res) => {
    const {
      id
    } = req.params;

    Course.getById(id, (err, course) => {
      if (err) {
        return res.status(500).json({
          error: 'Database error'
        });
      }

      if (!course) {
        return res.status(404).json({
          error: 'Course not found'
        });
      }

      res.json(course);
    });
  },

  // Create new course (Admin only)
  create: (req, res) => {
    const {
      name,
      description,
      teacher_id
    } = req.body;

    if (!name || !teacher_id) {
      return res.status(400).json({
        error: 'Course name and teacher are required'
      });
    }

    Course.create({
      name,
      description,
      teacher_id
    }, (err, courseId) => {
      if (err) {
        return res.status(500).json({
          error: 'Course creation failed'
        });
      }

      res.status(201).json({
        message: 'Course created successfully',
        courseId
      });
    });
  },

  // Update course (Admin only)
  update: (req, res) => {
    const {
      id
    } = req.params;
    const {
      name,
      description,
      teacher_id
    } = req.body;

    if (!name || !teacher_id) {
      return res.status(400).json({
        error: 'Course name and teacher are required'
      });
    }

    Course.update(id, {
      name,
      description,
      teacher_id
    }, (err) => {
      if (err) {
        return res.status(500).json({
          error: 'Update failed'
        });
      }

      res.json({
        message: 'Course updated successfully'
      });
    });
  },

  // Delete course (Admin only)
  delete: (req, res) => {
    const {
      id
    } = req.params;

    Course.delete(id, (err) => {
      if (err) {
        return res.status(500).json({
          error: 'Delete failed'
        });
      }

      res.json({
        message: 'Course deleted successfully'
      });
    });
  },

  // Get course enrollments
  getEnrollments: (req, res) => {
    const {
      courseId
    } = req.params;

    Course.getEnrollments(courseId, (err, enrollments) => {
      if (err) {
        return res.status(500).json({
          error: 'Database error'
        });
      }
      res.json(enrollments);
    });
  },

  // Get students enrolled in a specific course
  getCourseStudents: (req, res) => {
    const {
      courseId
    } = req.params;

    Course.getCourseStudents(courseId, (err, students) => {
      if (err) {
        return res.status(500).json({
          error: 'Database error'
        });
      }
      res.json(students);
    });
  },

  // Get available students (not enrolled in a specific course)
  getAvailableStudents: (req, res) => {
    const {
      courseId
    } = req.params;

    Course.getAvailableStudents(courseId, (err, students) => {
      if (err) {
        return res.status(500).json({
          error: 'Database error'
        });
      }
      res.json(students);
    });
  },

  // Enroll student in course (Admin only)
  enrollStudent: (req, res) => {
    const {
      studentId,
      courseId
    } = req.body;

    if (!studentId || !courseId) {
      return res.status(400).json({
        error: 'Student ID and Course ID are required'
      });
    }

    Course.enrollStudent(studentId, courseId, (err) => {
      if (err) {
        return res.status(500).json({
          error: 'Enrollment failed'
        });
      }
      res.json({
        message: 'Student enrolled successfully'
      });
    });
  },

  // Unenroll student from course (Admin only)
  unenrollStudent: (req, res) => {
    const {
      studentId,
      courseId
    } = req.body;

    if (!studentId || !courseId) {
      return res.status(400).json({
        error: 'Student ID and Course ID are required'
      });
    }

    Course.unenrollStudent(studentId, courseId, (err) => {
      if (err) {
        return res.status(500).json({
          error: 'Unenrollment failed'
        });
      }
      res.json({
        message: 'Student unenrolled successfully'
      });
    });
  },

  // Get grading rules for course
  getGradingRules: (req, res) => {
    const {
      courseId
    } = req.params;

    Course.getGradingRules(courseId, (err, rules) => {
      if (err) {
        return res.status(500).json({
          error: 'Database error'
        });
      }

      // Return default rules if none found
      if (!rules) {
        rules = {
          course_id: courseId,
          participation_weight: 20,
          homework_weight: 40,
          exam_weight: 40,
          project_weight: 0,
          quiz_weight: 0
        };
      }

      res.json(rules);
    });
  },

  // Update grading rules for course (Teacher or Admin)
  updateGradingRules: (req, res) => {
    const {
      courseId
    } = req.params;
    const {
      participation_weight,
      homework_weight,
      exam_weight,
      project_weight,
      quiz_weight
    } = req.body;

    // Validate weights sum to 100
    const totalWeight = (participation_weight || 0) + (homework_weight || 0) +
      (exam_weight || 0) + (project_weight || 0) + (quiz_weight || 0);

    if (totalWeight !== 100) {
      return res.status(400).json({
        error: 'Grading weights must sum to 100%'
      });
    }

    Course.updateGradingRules(courseId, {
      participation_weight,
      homework_weight,
      exam_weight,
      project_weight,
      quiz_weight
    }, (err) => {
      if (err) {
        return res.status(500).json({
          error: 'Update failed'
        });
      }

      res.json({
        message: 'Grading rules updated successfully'
      });
    });
  },

  // Get students enrolled in teacher's courses
  getStudentsByTeacher: (req, res) => {
    const teacherId = req.user.role === 'teacher' ? req.user.id : req.params.teacherId;

    Course.getStudentsByTeacher(teacherId, (err, students) => {
      if (err) {
        return res.status(500).json({
          error: 'Database error'
        });
      }
      res.json(students);
    });
  }
};

module.exports = CoursesController;