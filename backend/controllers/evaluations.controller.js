const Evaluation = require('../models/evaluation.model');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

const EvaluationsController = {
  // Create new evaluation
  create: (req, res) => {
    console.log('Evaluation create request body:', req.body);
    console.log('User from token:', req.user);
    
    const { student_id, course_id, subject, evaluation_type, score, feedback } = req.body;
    const teacher_id = req.user.id;

    // Convert score to number if it's a string
    const numericScore = Number(score);

    if (!student_id || !course_id || !subject || !evaluation_type || score === undefined || score === null || score === '') {
      console.log('Validation failed - missing fields:', {
        student_id, course_id, subject, evaluation_type, score, numericScore
      });
      return res.status(400).json({ error: 'All required fields must be provided' });
    }

    if (isNaN(numericScore) || numericScore < 0 || numericScore > 100) {
      console.log('Validation failed - invalid score:', { score, numericScore });
      return res.status(400).json({ error: 'Score must be between 0 and 100' });
    }

    if (!['exam', 'homework', 'participation', 'project', 'quiz'].includes(evaluation_type)) {
      console.log('Validation failed - invalid evaluation type:', evaluation_type);
      return res.status(400).json({ error: 'Invalid evaluation type' });
    }

    const evaluationData = {
      student_id,
      teacher_id,
      course_id,
      subject,
      evaluation_type,
      score: numericScore,
      feedback: feedback || ''
    };

    console.log('Creating evaluation with data:', evaluationData);

    Evaluation.create(evaluationData, (err, evaluationId) => {
      if (err) {
        console.log('Database error creating evaluation:', err);
        return res.status(500).json({ error: 'Failed to create evaluation' });
      }

      console.log('Evaluation created successfully with ID:', evaluationId);
      res.status(201).json({
        message: 'Evaluation created successfully',
        evaluationId
      });
    });
  },

  // Get evaluations by student (for student dashboard)
  getByStudent: (req, res) => {
    const studentId = req.user.role === 'student' ? req.user.id : req.params.studentId;

    Evaluation.getByStudentId(studentId, (err, evaluations) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(evaluations);
    });
  },

  // Get evaluations by teacher (for teacher dashboard)
  getByTeacher: (req, res) => {
    const teacherId = req.user.role === 'teacher' ? req.user.id : req.params.teacherId;

    Evaluation.getByTeacherId(teacherId, (err, evaluations) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(evaluations);
    });
  },

  // Get all evaluations (for admin)
  getAll: (req, res) => {
    Evaluation.getAll((err, evaluations) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(evaluations);
    });
  },

  // Get evaluation by ID
  getById: (req, res) => {
    const { id } = req.params;

    Evaluation.getById(id, (err, evaluation) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!evaluation) {
        return res.status(404).json({ error: 'Evaluation not found' });
      }

      res.json(evaluation);
    });
  },

  // Update evaluation
  update: (req, res) => {
    const { id } = req.params;
    const { subject, evaluation_type, score, feedback } = req.body;

    if (!subject || !evaluation_type || score === undefined) {
      return res.status(400).json({ error: 'Subject, evaluation type, and score are required' });
    }

    if (score < 0 || score > 100) {
      return res.status(400).json({ error: 'Score must be between 0 and 100' });
    }

    const evaluationData = {
      subject,
      evaluation_type,
      score: parseInt(score),
      feedback: feedback || ''
    };

    Evaluation.update(id, evaluationData, (err) => {
      if (err) {
        return res.status(500).json({ error: 'Update failed' });
      }

      res.json({ message: 'Evaluation updated successfully' });
    });
  },

  // Delete evaluation
  delete: (req, res) => {
    const { id } = req.params;

    Evaluation.delete(id, (err) => {
      if (err) {
        return res.status(500).json({ error: 'Delete failed' });
      }

      res.json({ message: 'Evaluation deleted successfully' });
    });
  },

  // Get statistics
  getStats: (req, res) => {
    Evaluation.getStats((err, stats) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(stats);
    });
  },

  // Get course grades for a student
  getCourseGrades: (req, res) => {
    const studentId = req.user.role === 'student' ? req.user.id : req.params.studentId;

    Evaluation.getCourseGrades(studentId, (err, grades) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      // Calculate final grades for each course
      const coursesWithGrades = grades.map(course => {
        const weights = {
          participation: course.participation_weight || 0,
          homework: course.homework_weight || 0,
          exam: course.exam_weight || 0,
          project: course.project_weight || 0,
          quiz: course.quiz_weight || 0
        };

        const scores = {
          participation: course.avg_participation || 0,
          homework: course.avg_homework || 0,
          exam: course.avg_exam || 0,
          project: course.avg_project || 0,
          quiz: course.avg_quiz || 0
        };

        let finalGrade = 0;
        let totalWeight = 0;

        Object.keys(weights).forEach(type => {
          if (weights[type] > 0 && scores[type] !== null) {
            finalGrade += (weights[type] / 100) * scores[type];
            totalWeight += weights[type];
          }
        });

        // Normalize if total weight is not 100%
        if (totalWeight > 0 && totalWeight !== 100) {
          finalGrade = (finalGrade / totalWeight) * 100;
        }

        return {
          ...course,
          final_grade: Math.round(finalGrade * 100) / 100,
          weights: weights,
          averages: scores
        };
      });

      res.json(coursesWithGrades);
    });
  },

  // Calculate final grade for a specific course
  calculateFinalGrade: (req, res) => {
    const { studentId, courseId } = req.params;

    Evaluation.calculateFinalGrade(studentId, courseId, (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(result);
    });
  },

  // Generate PDF report
  generatePDFReport: (req, res) => {
    const { studentId, teacherId, type } = req.query;

    let query;
    if (type === 'student' && studentId) {
      query = () => Evaluation.getByStudentId(studentId, generatePDF);
    } else if (type === 'teacher' && teacherId) {
      query = () => Evaluation.getByTeacherId(teacherId, generatePDF);
    } else {
      query = () => Evaluation.getAll(generatePDF);
    }

    function generatePDF(err, evaluations) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      const doc = new PDFDocument();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="evaluation-report.pdf"');

      doc.pipe(res);

      // Title
      doc.fontSize(20).text('Evaluation Report', 100, 100);
      doc.moveDown();

      // Report data
      evaluations.forEach((evaluation, index) => {
        doc.fontSize(12)
           .text(`${index + 1}. ${evaluation.student_name || 'Student'} - ${evaluation.subject}`)
           .text(`   Teacher: ${evaluation.teacher_name || 'Teacher'}`)
           .text(`   Course: ${evaluation.course_name || 'Course'}`)
           .text(`   Type: ${evaluation.evaluation_type}`)
           .text(`   Score: ${evaluation.score}/100`)
           .text(`   Feedback: ${evaluation.feedback || 'No feedback'}`)
           .text(`   Date: ${evaluation.date_created}`)
           .moveDown();
      });

      doc.end();
    }

    query();
  }
};

module.exports = EvaluationsController;
