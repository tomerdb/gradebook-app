const db = require('./db');

const Evaluation = {
  // Create new evaluation
  create: (evaluationData, callback) => {
    const { student_id, teacher_id, course_id, subject, evaluation_type, score, feedback } = evaluationData;
    db.run(
      'INSERT INTO evaluations (student_id, teacher_id, course_id, subject, evaluation_type, score, feedback) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [student_id, teacher_id, course_id, subject, evaluation_type, score, feedback],
      function(err) {
        callback(err, this ? this.lastID : null);
      }
    );
  },

  // Get evaluations by student ID
  getByStudentId: (studentId, callback) => {
    db.all(`
      SELECT e.*, u.name as teacher_name, c.name as course_name
      FROM evaluations e
      JOIN users u ON e.teacher_id = u.id
      JOIN courses c ON e.course_id = c.id
      WHERE e.student_id = ?
      ORDER BY e.date_created DESC
    `, [studentId], callback);
  },

  // Get evaluations by teacher ID
  getByTeacherId: (teacherId, callback) => {
    db.all(`
      SELECT e.*, u.name as student_name, c.name as course_name
      FROM evaluations e
      JOIN users u ON e.student_id = u.id
      JOIN courses c ON e.course_id = c.id
      WHERE e.teacher_id = ?
      ORDER BY e.date_created DESC
    `, [teacherId], callback);
  },

  // Get evaluations by course ID
  getByCourseId: (courseId, callback) => {
    db.all(`
      SELECT e.*, 
             s.name as student_name, 
             t.name as teacher_name, 
             c.name as course_name
      FROM evaluations e
      JOIN users s ON e.student_id = s.id
      JOIN users t ON e.teacher_id = t.id
      JOIN courses c ON e.course_id = c.id
      WHERE e.course_id = ?
      ORDER BY e.date_created DESC
    `, [courseId], callback);
  },

  // Get all evaluations (for admin)
  getAll: (callback) => {
    db.all(`
      SELECT e.*, 
             s.name as student_name, 
             t.name as teacher_name, 
             c.name as course_name
      FROM evaluations e
      JOIN users s ON e.student_id = s.id
      JOIN users t ON e.teacher_id = t.id
      JOIN courses c ON e.course_id = c.id
      ORDER BY e.date_created DESC
    `, callback);
  },

  // Get evaluation by ID
  getById: (id, callback) => {
    db.get(`
      SELECT e.*, 
             s.name as student_name, 
             t.name as teacher_name, 
             c.name as course_name
      FROM evaluations e
      JOIN users s ON e.student_id = s.id
      JOIN users t ON e.teacher_id = t.id
      JOIN courses c ON e.course_id = c.id
      WHERE e.id = ?
    `, [id], callback);
  },

  // Update evaluation
  update: (id, evaluationData, callback) => {
    const { subject, evaluation_type, score, feedback } = evaluationData;
    db.run(
      'UPDATE evaluations SET subject = ?, evaluation_type = ?, score = ?, feedback = ? WHERE id = ?',
      [subject, evaluation_type, score, feedback, id],
      callback
    );
  },

  // Delete evaluation
  delete: (id, callback) => {
    db.run('DELETE FROM evaluations WHERE id = ?', [id], callback);
  },

  // Get statistics
  getStats: (callback) => {
    db.get(`
      SELECT 
        COUNT(*) as total_evaluations,
        AVG(score) as average_score,
        COUNT(DISTINCT student_id) as total_students,
        COUNT(DISTINCT teacher_id) as total_teachers
      FROM evaluations
    `, callback);
  },

  // Get course-based grade summary for a student
  getCourseGrades: (studentId, callback) => {
    db.all(`
      SELECT 
        c.id as course_id,
        c.name as course_name,
        c.description as course_description,
        t.name as teacher_name,
        s.name as student_name,
        cgr.participation_weight,
        cgr.homework_weight,
        cgr.exam_weight,
        cgr.project_weight,
        cgr.quiz_weight,
        AVG(CASE WHEN e.evaluation_type = 'participation' THEN e.score END) as avg_participation,
        AVG(CASE WHEN e.evaluation_type = 'homework' THEN e.score END) as avg_homework,
        AVG(CASE WHEN e.evaluation_type = 'exam' THEN e.score END) as avg_exam,
        AVG(CASE WHEN e.evaluation_type = 'project' THEN e.score END) as avg_project,
        AVG(CASE WHEN e.evaluation_type = 'quiz' THEN e.score END) as avg_quiz,
        COUNT(e.id) as total_evaluations
      FROM course_enrollments ce
      JOIN courses c ON ce.course_id = c.id
      JOIN users t ON c.teacher_id = t.id
      JOIN users s ON ce.student_id = s.id
      LEFT JOIN course_grading_rules cgr ON c.id = cgr.course_id
      LEFT JOIN evaluations e ON c.id = e.course_id AND e.student_id = ce.student_id
      WHERE ce.student_id = ?
      GROUP BY c.id, c.name, c.description, t.name, s.name, cgr.participation_weight, cgr.homework_weight, cgr.exam_weight, cgr.project_weight, cgr.quiz_weight
      ORDER BY c.name
    `, [studentId], callback);
  },

  // Calculate final grade for a student in a course
  calculateFinalGrade: (studentId, courseId, callback) => {
    db.get(`
      SELECT 
        cgr.participation_weight,
        cgr.homework_weight,
        cgr.exam_weight,
        cgr.project_weight,
        cgr.quiz_weight,
        AVG(CASE WHEN e.evaluation_type = 'participation' THEN e.score END) as avg_participation,
        AVG(CASE WHEN e.evaluation_type = 'homework' THEN e.score END) as avg_homework,
        AVG(CASE WHEN e.evaluation_type = 'exam' THEN e.score END) as avg_exam,
        AVG(CASE WHEN e.evaluation_type = 'project' THEN e.score END) as avg_project,
        AVG(CASE WHEN e.evaluation_type = 'quiz' THEN e.score END) as avg_quiz
      FROM course_grading_rules cgr
      LEFT JOIN evaluations e ON cgr.course_id = e.course_id AND e.student_id = ?
      WHERE cgr.course_id = ?
      GROUP BY cgr.participation_weight, cgr.homework_weight, cgr.exam_weight, cgr.project_weight, cgr.quiz_weight
    `, [studentId, courseId], (err, result) => {
      if (err) {
        return callback(err, null);
      }

      if (!result) {
        return callback(null, { finalGrade: 0, breakdown: {} });
      }

      // Calculate weighted final grade
      const weights = {
        participation: result.participation_weight || 0,
        homework: result.homework_weight || 0,
        exam: result.exam_weight || 0,
        project: result.project_weight || 0,
        quiz: result.quiz_weight || 0
      };

      const scores = {
        participation: result.avg_participation || 0,
        homework: result.avg_homework || 0,
        exam: result.avg_exam || 0,
        project: result.avg_project || 0,
        quiz: result.avg_quiz || 0
      };

      let finalGrade = 0;
      let totalWeight = 0;
      const breakdown = {};

      Object.keys(weights).forEach(type => {
        if (weights[type] > 0 && scores[type] !== null) {
          const contribution = (weights[type] / 100) * scores[type];
          finalGrade += contribution;
          totalWeight += weights[type];
          breakdown[type] = {
            weight: weights[type],
            average: scores[type],
            contribution: contribution
          };
        }
      });

      // Normalize if total weight is not 100%
      if (totalWeight > 0 && totalWeight !== 100) {
        finalGrade = (finalGrade / totalWeight) * 100;
      }

      callback(null, {
        finalGrade: Math.round(finalGrade * 100) / 100,
        breakdown: breakdown,
        totalWeight: totalWeight
      });
    });
  }
};

module.exports = Evaluation;
