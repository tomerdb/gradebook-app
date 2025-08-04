const db = require('./db');

const Course = {
  // Get all courses
  getAll: (callback) => {
    db.all(`
      SELECT c.*, u.name as teacher_name, u.email as teacher_email
      FROM courses c
      LEFT JOIN users u ON c.teacher_id = u.id
      ORDER BY c.name
    `, callback);
  },

  // Get courses by teacher
  getByTeacher: (teacherId, callback) => {
    db.all(`
      SELECT c.*, u.name as teacher_name
      FROM courses c
      LEFT JOIN users u ON c.teacher_id = u.id
      WHERE c.teacher_id = ?
      ORDER BY c.name
    `, [teacherId], callback);
  },

  // Get course by ID
  getById: (id, callback) => {
    db.get(`
      SELECT c.*, u.name as teacher_name, u.email as teacher_email
      FROM courses c
      LEFT JOIN users u ON c.teacher_id = u.id
      WHERE c.id = ?
    `, [id], callback);
  },

  // Create new course
  create: (courseData, callback) => {
    const {
      name,
      description,
      teacher_id
    } = courseData;
    db.run(
      'INSERT INTO courses (name, description, teacher_id) VALUES (?, ?, ?)',
      [name, description, teacher_id],
      function (err) {
        if (err) return callback(err);

        // Create default grading rules for the new course
        db.run(
          'INSERT INTO course_grading_rules (course_id) VALUES (?)',
          [this.lastID],
          (ruleErr) => {
            callback(ruleErr, this.lastID);
          }
        );
      }
    );
  },

  // Update course
  update: (id, courseData, callback) => {
    const {
      name,
      description,
      teacher_id
    } = courseData;
    db.run(
      'UPDATE courses SET name = ?, description = ?, teacher_id = ? WHERE id = ?',
      [name, description, teacher_id, id],
      callback
    );
  },

  // Delete course
  delete: (id, callback) => {
    db.run('DELETE FROM courses WHERE id = ?', [id], callback);
  },

  // Get course enrollments
  getEnrollments: (courseId, callback) => {
    db.all(`
      SELECT ce.*, s.name as student_name, s.email as student_email
      FROM course_enrollments ce
      JOIN users s ON ce.student_id = s.id
      WHERE ce.course_id = ?
      ORDER BY s.name
    `, [courseId], callback);
  },

  // Get students enrolled in a course (for evaluation purposes)
  getCourseStudents: (courseId, callback) => {
    db.all(`
      SELECT s.id, s.name, s.email
      FROM course_enrollments ce
      JOIN users s ON ce.student_id = s.id
      WHERE ce.course_id = ? AND s.role = 'student'
      ORDER BY s.name
    `, [courseId], callback);
  },

  // Enroll student in course
  enrollStudent: (studentId, courseId, callback) => {
    db.run(
      'INSERT OR IGNORE INTO course_enrollments (student_id, course_id) VALUES (?, ?)',
      [studentId, courseId],
      callback
    );
  },

  // Unenroll student from course
  unenrollStudent: (studentId, courseId, callback) => {
    db.run(
      'DELETE FROM course_enrollments WHERE student_id = ? AND course_id = ?',
      [studentId, courseId],
      callback
    );
  },

  // Get grading rules for course
  getGradingRules: (courseId, callback) => {
    db.get(`
      SELECT * FROM course_grading_rules WHERE course_id = ?
    `, [courseId], callback);
  },

  // Update grading rules for course
  updateGradingRules: (courseId, rules, callback) => {
    const {
      participation_weight,
      homework_weight,
      exam_weight,
      project_weight,
      quiz_weight
    } = rules;
    db.run(`
      UPDATE course_grading_rules 
      SET participation_weight = ?, homework_weight = ?, exam_weight = ?, 
          project_weight = ?, quiz_weight = ?, updated_at = CURRENT_TIMESTAMP
      WHERE course_id = ?
    `, [participation_weight, homework_weight, exam_weight, project_weight, quiz_weight, courseId], callback);
  },

  // Get students enrolled in teacher's courses
  getStudentsByTeacher: (teacherId, callback) => {
    db.all(`
      SELECT DISTINCT s.id, s.name, s.email, c.name as course_name, c.id as course_id
      FROM users s
      JOIN course_enrollments ce ON s.id = ce.student_id
      JOIN courses c ON ce.course_id = c.id
      WHERE c.teacher_id = ? AND s.role = 'student'
      ORDER BY c.name, s.name
    `, [teacherId], callback);
  }
};

module.exports = Course;