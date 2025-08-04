const Evaluation = require('../models/evaluation.model');
const db = require('../models/db');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

const EvaluationsController = {
  // Create new evaluation
  create: (req, res) => {
    console.log('Evaluation create request body:', req.body);
    console.log('User from token:', req.user);

    const {
      student_id,
      course_id,
      subject,
      evaluation_type,
      score,
      feedback
    } = req.body;
    const teacher_id = req.user.id;

    // Convert score to number if it's a string
    const numericScore = Number(score);

    if (!student_id || !course_id || !subject || !evaluation_type || score === undefined || score === null || score === '') {
      console.log('Validation failed - missing fields:', {
        student_id,
        course_id,
        subject,
        evaluation_type,
        score,
        numericScore
      });
      return res.status(400).json({
        error: 'All required fields must be provided'
      });
    }

    if (isNaN(numericScore) || numericScore < 0 || numericScore > 100) {
      console.log('Validation failed - invalid score:', {
        score,
        numericScore
      });
      return res.status(400).json({
        error: 'Score must be between 0 and 100'
      });
    }

    if (!['exam', 'homework', 'participation', 'project', 'quiz'].includes(evaluation_type)) {
      console.log('Validation failed - invalid evaluation type:', evaluation_type);
      return res.status(400).json({
        error: 'Invalid evaluation type'
      });
    }

    // Fetch names to store them permanently
    const db = require('../models/db');

    db.get(`
      SELECT 
        s.name as student_name,
        t.name as teacher_name,
        c.name as course_name
      FROM users s, users t, courses c
      WHERE s.id = ? AND t.id = ? AND c.id = ?
    `, [student_id, teacher_id, course_id], (err, names) => {
      if (err) {
        console.log('Error fetching names:', err);
        return res.status(500).json({
          error: 'Failed to fetch user/course names'
        });
      }

      if (!names) {
        return res.status(400).json({
          error: 'Invalid student, teacher, or course ID'
        });
      }

      const evaluationData = {
        student_id,
        teacher_id,
        course_id,
        student_name: names.student_name,
        teacher_name: names.teacher_name,
        course_name: names.course_name,
        subject,
        evaluation_type,
        score: numericScore,
        feedback: feedback || ''
      };

      console.log('Creating evaluation with data:', evaluationData);

      Evaluation.create(evaluationData, (err, evaluationId) => {
        if (err) {
          console.log('Database error creating evaluation:', err);
          return res.status(500).json({
            error: 'Failed to create evaluation'
          });
        }

        console.log('Evaluation created successfully with ID:', evaluationId);
        res.status(201).json({
          message: 'Evaluation created successfully',
          evaluationId
        });
      });
    });
  },

  // Get evaluations by student (for student dashboard)
  getByStudent: (req, res) => {
    const studentId = req.user.role === 'student' ? req.user.id : req.params.studentId;

    Evaluation.getByStudentId(studentId, (err, evaluations) => {
      if (err) {
        return res.status(500).json({
          error: 'Database error'
        });
      }
      res.json(evaluations);
    });
  },

  // Get evaluations by teacher (for teacher dashboard)
  getByTeacher: (req, res) => {
    const teacherId = req.user.role === 'teacher' ? req.user.id : req.params.teacherId;

    Evaluation.getByTeacherId(teacherId, (err, evaluations) => {
      if (err) {
        return res.status(500).json({
          error: 'Database error'
        });
      }
      res.json(evaluations);
    });
  },

  // Get all evaluations (for admin)
  getAll: (req, res) => {
    Evaluation.getAll((err, evaluations) => {
      if (err) {
        return res.status(500).json({
          error: 'Database error'
        });
      }
      res.json(evaluations);
    });
  },

  // Get evaluation by ID
  getById: (req, res) => {
    const {
      id
    } = req.params;

    Evaluation.getById(id, (err, evaluation) => {
      if (err) {
        return res.status(500).json({
          error: 'Database error'
        });
      }

      if (!evaluation) {
        return res.status(404).json({
          error: 'Evaluation not found'
        });
      }

      res.json(evaluation);
    });
  },

  // Update evaluation
  update: (req, res) => {
    const {
      id
    } = req.params;
    const {
      subject,
      evaluation_type,
      score,
      feedback
    } = req.body;

    if (!subject || !evaluation_type || score === undefined) {
      return res.status(400).json({
        error: 'Subject, evaluation type, and score are required'
      });
    }

    if (score < 0 || score > 100) {
      return res.status(400).json({
        error: 'Score must be between 0 and 100'
      });
    }

    const evaluationData = {
      subject,
      evaluation_type,
      score: parseInt(score),
      feedback: feedback || ''
    };

    Evaluation.update(id, evaluationData, (err) => {
      if (err) {
        return res.status(500).json({
          error: 'Update failed'
        });
      }

      res.json({
        message: 'Evaluation updated successfully'
      });
    });
  },

  // Delete evaluation
  delete: (req, res) => {
    const {
      id
    } = req.params;

    Evaluation.delete(id, (err) => {
      if (err) {
        return res.status(500).json({
          error: 'Delete failed'
        });
      }

      res.json({
        message: 'Evaluation deleted successfully'
      });
    });
  },

  // Get statistics
  getStats: (req, res) => {
    Evaluation.getStats((err, stats) => {
      if (err) {
        return res.status(500).json({
          error: 'Database error'
        });
      }
      res.json(stats);
    });
  },

  // Get course grades for a student
  getCourseGrades: (req, res) => {
    const studentId = req.user.role === 'student' ? req.user.id : req.params.studentId;
    
    console.log('getCourseGrades called for student ID:', studentId);

    Evaluation.getCourseGrades(studentId, (err, grades) => {
      if (err) {
        console.error('Error fetching course grades:', err);
        return res.status(500).json({
          error: 'Database error'
        });
      }

      console.log('Raw course grades from DB:', JSON.stringify(grades, null, 2));

      // Calculate final grades for each course
      const coursesWithGrades = grades.map(course => {
        console.log('Processing course:', course.course_name);
        
        const weights = {
          participation: course.participation_weight || 0,
          homework: course.homework_weight || 0,
          exam: course.exam_weight || 0,
          project: course.project_weight || 0,
          quiz: course.quiz_weight || 0
        };

        const scores = {
          participation: course.avg_participation,
          homework: course.avg_homework,
          exam: course.avg_exam,
          project: course.avg_project,
          quiz: course.avg_quiz
        };

        console.log('Weights for', course.course_name, ':', weights);
        console.log('Scores for', course.course_name, ':', scores);

        let finalGrade = 0;
        let totalWeight = 0;

        Object.keys(weights).forEach(type => {
          if (weights[type] > 0 && scores[type] !== null && scores[type] !== undefined) {
            const contribution = (weights[type] / 100) * scores[type];
            console.log(`${type}: weight=${weights[type]}%, score=${scores[type]}, contribution=${contribution}`);
            finalGrade += contribution;
            totalWeight += weights[type];
          }
        });

        console.log(`Final grade before normalization: ${finalGrade}, total weight: ${totalWeight}`);

        // Normalize if total weight is not 100%
        if (totalWeight > 0 && totalWeight !== 100) {
          finalGrade = (finalGrade / totalWeight) * 100;
          console.log(`Final grade after normalization: ${finalGrade}`);
        }

        const result = {
          ...course,
          final_grade: Math.round(finalGrade * 100) / 100,
          weights: weights,
          averages: {
            participation: course.avg_participation,
            homework: course.avg_homework,
            exam: course.avg_exam,
            project: course.avg_project,
            quiz: course.avg_quiz
          }
        };

        console.log('Final result for', course.course_name, ':', result.final_grade);
        return result;
      });

      console.log('All courses with grades:', coursesWithGrades.map(c => ({name: c.course_name, grade: c.final_grade})));
      res.json(coursesWithGrades);
    });
  },

  // Calculate final grade for a specific course
  calculateFinalGrade: (req, res) => {
    const {
      studentId,
      courseId
    } = req.params;

    Evaluation.calculateFinalGrade(studentId, courseId, (err, result) => {
      if (err) {
        return res.status(500).json({
          error: 'Database error'
        });
      }
      res.json(result);
    });
  },

  // Generate PDF report
  generatePDFReport: (req, res) => {
    const {
      studentId,
      teacherId,
      type
    } = req.query;

    if (type === 'student' && studentId) {
      // For student reports, generate a course-based gradesheet
      Evaluation.getCourseGrades(studentId, (err, grades) => {
        if (err) {
          return res.status(500).json({
            error: 'Database error'
          });
        }

        // Calculate final grades for each course (same logic as getCourseGrades)
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
            final_grade: Math.round(finalGrade * 100) / 100
          };
        });

        // Generate student gradesheet PDF
        generateStudentGradesheetPDF(res, coursesWithGrades, studentId);
      });
    } else {
      // For other reports, use the original logic
      let query;
      if (type === 'teacher' && teacherId) {
        query = () => Evaluation.getByTeacherId(teacherId, generatePDF);
      } else {
        query = () => Evaluation.getAll(generatePDF);
      }

      function generatePDF(err, evaluations) {
        if (err) {
          return res.status(500).json({
            error: 'Database error'
          });
        }

        const doc = new PDFDocument({
          margin: 50
        });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="evaluation-report.pdf"');

        doc.pipe(res);

        // Title
        doc.fontSize(20).text('Evaluation Report', {
          align: 'center'
        });
        doc.moveDown();
        doc.fontSize(12).text(`Date: ${new Date().toLocaleDateString()}`, {
          align: 'left'
        });
        doc.moveDown();

        if (evaluations.length === 0) {
          doc.text('No evaluations found.', {
            align: 'center'
          });
          doc.end();
          return;
        }

        // Table headers
        const tableTop = doc.y;
        const studentCol = 50;
        const teacherCol = 120;
        const courseCol = 190;
        const subjectCol = 260;
        const typeCol = 330;
        const scoreCol = 400;
        const dateCol = 460;
        const maxCol = 520;

        // Draw table header
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('Student', studentCol, tableTop);
        doc.text('Teacher', teacherCol, tableTop);
        doc.text('Course', courseCol, tableTop);
        doc.text('Subject', subjectCol, tableTop);
        doc.text('Type', typeCol, tableTop);
        doc.text('Score', scoreCol, tableTop);
        doc.text('Date', dateCol, tableTop);

        // Draw header underline
        doc.moveTo(studentCol, tableTop + 12)
          .lineTo(maxCol, tableTop + 12)
          .stroke();

        let currentY = tableTop + 20;

        // Table rows
        doc.font('Helvetica').fontSize(8);
        evaluations.forEach((evaluation, index) => {
          if (currentY > 700) { // New page if needed
            doc.addPage();
            currentY = 50;
          }

          doc.text((evaluation.student_name || 'Student').substring(0, 12), studentCol, currentY, {
            width: 65
          });
          doc.text((evaluation.teacher_name || 'Teacher').substring(0, 12), teacherCol, currentY, {
            width: 65
          });
          doc.text((evaluation.course_name || 'Course').substring(0, 12), courseCol, currentY, {
            width: 65
          });
          doc.text((evaluation.subject || '').substring(0, 12), subjectCol, currentY, {
            width: 65
          });
          doc.text((evaluation.evaluation_type || '').substring(0, 8), typeCol, currentY, {
            width: 65
          });
          doc.text(`${evaluation.score}/100`, scoreCol, currentY, {
            width: 55
          });
          doc.text(new Date(evaluation.date_created).toLocaleDateString(), dateCol, currentY, {
            width: 55
          });

          currentY += 15;

          // Add a light line between rows
          if (index < evaluations.length - 1) {
            doc.strokeColor('#E0E0E0')
              .moveTo(studentCol, currentY - 5)
              .lineTo(maxCol, currentY - 5)
              .stroke()
              .strokeColor('#000000');
          }
        });

        doc.end();
      }

      query();
    }
  },

  // Generate CSV report
  generateCSVReport: (req, res) => {
    const {
      type,
      teacherId,
      studentId
    } = req.query;

    function query() {
      let sql;
      let params = [];

      if (type === 'student') {
        sql = `
          SELECT 
            e.id,
            u_student.name as student_name,
            u_teacher.name as teacher_name,
            c.name as course_name,
            e.subject,
            e.evaluation_type,
            e.score,
            e.feedback,
            e.date_created
          FROM evaluations e
          JOIN users u_student ON e.student_id = u_student.id
          JOIN users u_teacher ON e.teacher_id = u_teacher.id
          JOIN courses c ON e.course_id = c.id
          WHERE e.student_id = ?
          ORDER BY e.date_created DESC
        `;
        params = [studentId];
      } else if (type === 'teacher') {
        sql = `
          SELECT 
            e.id,
            u_student.name as student_name,
            u_teacher.name as teacher_name,
            c.name as course_name,
            e.subject,
            e.evaluation_type,
            e.score,
            e.feedback,
            e.date_created
          FROM evaluations e
          JOIN users u_student ON e.student_id = u_student.id
          JOIN users u_teacher ON e.teacher_id = u_teacher.id
          JOIN courses c ON e.course_id = c.id
          WHERE e.teacher_id = ?
          ORDER BY e.date_created DESC
        `;
        params = [teacherId];
      } else {
        sql = `
          SELECT 
            e.id,
            COALESCE(u_student.name, 'Unknown Student') as student_name,
            COALESCE(u_teacher.name, 'Unknown Teacher') as teacher_name,
            COALESCE(c.name, 'Unknown Course') as course_name,
            e.subject,
            e.evaluation_type,
            e.score,
            e.feedback,
            e.date_created
          FROM evaluations e
          LEFT JOIN users u_student ON e.student_id = u_student.id
          LEFT JOIN users u_teacher ON e.teacher_id = u_teacher.id
          LEFT JOIN courses c ON e.course_id = c.id
          ORDER BY e.date_created DESC
        `;
      }

      db.all(sql, params, generateCSV);
    }

    function generateCSV(err, evaluations) {
      if (err) {
        return res.status(500).json({
          error: 'Database error'
        });
      }

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="evaluation-report.csv"');

      // CSV headers
      const headers = ['Student', 'Teacher', 'Course', 'Subject', 'Type', 'Score', 'Feedback', 'Date'];
      let csvContent = headers.join(',') + '\n';

      // CSV rows
      evaluations.forEach(evaluation => {
        const row = [
          `"${evaluation.student_name || 'Student'}"`,
          `"${evaluation.teacher_name || 'Teacher'}"`,
          `"${evaluation.course_name || 'Course'}"`,
          `"${evaluation.subject || ''}"`,
          `"${evaluation.evaluation_type || ''}"`,
          `"${evaluation.score}/100"`,
          `"${(evaluation.feedback || 'No feedback').replace(/"/g, '""')}"`,
          `"${evaluation.date_created || ''}"`
        ];
        csvContent += row.join(',') + '\n';
      });

      res.send(csvContent);
    }

    query();
  },

  // Generate filtered PDF report from frontend data
  generateFilteredPDFReport: (req, res) => {
    const {
      data,
      token
    } = req.body;

    try {
      const filteredData = JSON.parse(data);
      const {
        evaluations,
        title,
        type
      } = filteredData;

      const doc = new PDFDocument({
        margin: 50
      });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="filtered-evaluation-report.pdf"');

      doc.pipe(res);

      // Title
      doc.fontSize(20).text(title || 'Filtered Evaluation Report', {
        align: 'center'
      });
      doc.moveDown();
      doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, {
        align: 'left'
      });
      doc.text(`Total Evaluations: ${evaluations.length}`, {
        align: 'left'
      });
      doc.moveDown();

      if (evaluations.length === 0) {
        doc.text('No evaluations found.', {
          align: 'center'
        });
        doc.end();
        return;
      }

      // Table headers
      const tableTop = doc.y;
      const studentCol = 50;
      const teacherCol = type === 'filtered-teacher' ? null : 120;
      const courseCol = type === 'filtered-teacher' ? 120 : 190;
      const subjectCol = type === 'filtered-teacher' ? 190 : 260;
      const typeCol = type === 'filtered-teacher' ? 260 : 330;
      const scoreCol = type === 'filtered-teacher' ? 330 : 400;
      const dateCol = type === 'filtered-teacher' ? 400 : 460;
      const maxCol = 520;

      // Draw table header
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('Student', studentCol, tableTop);
      if (type !== 'filtered-teacher') {
        doc.text('Teacher', teacherCol, tableTop);
      }
      doc.text('Course', courseCol, tableTop);
      doc.text('Subject', subjectCol, tableTop);
      doc.text('Type', typeCol, tableTop);
      doc.text('Score', scoreCol, tableTop);
      doc.text('Date', dateCol, tableTop);

      // Draw header underline
      doc.moveTo(studentCol, tableTop + 12)
        .lineTo(maxCol, tableTop + 12)
        .stroke();

      let currentY = tableTop + 20;

      // Table rows
      doc.font('Helvetica').fontSize(8);
      evaluations.forEach((evaluation, index) => {
        if (currentY > 700) { // New page if needed
          doc.addPage();
          currentY = 50;
        }

        doc.text((evaluation.student_name || 'Student').substring(0, 12), studentCol, currentY, {
          width: 65
        });
        if (type !== 'filtered-teacher') {
          doc.text((evaluation.teacher_name || 'Teacher').substring(0, 12), teacherCol, currentY, {
            width: 65
          });
        }
        doc.text((evaluation.course_name || 'Course').substring(0, 12), courseCol, currentY, {
          width: 65
        });
        doc.text((evaluation.subject || '').substring(0, 12), subjectCol, currentY, {
          width: 65
        });
        doc.text((evaluation.evaluation_type || '').substring(0, 8), typeCol, currentY, {
          width: 65
        });
        doc.text(`${evaluation.score}/100`, scoreCol, currentY, {
          width: 55
        });
        doc.text(new Date(evaluation.date_created).toLocaleDateString(), dateCol, currentY, {
          width: 55
        });

        currentY += 15;

        // Add a light line between rows
        if (index < evaluations.length - 1) {
          doc.strokeColor('#E0E0E0')
            .moveTo(studentCol, currentY - 5)
            .lineTo(maxCol, currentY - 5)
            .stroke()
            .strokeColor('#000000');
        }
      });

      doc.end();
    } catch (error) {
      console.error('Error generating filtered PDF:', error);
      res.status(500).json({
        error: 'Failed to generate PDF'
      });
    }
  }
};

// Helper function to generate student gradesheet PDF
function generateStudentGradesheetPDF(res, courses, studentId) {
  const doc = new PDFDocument({
    margin: 50
  });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="student-gradesheet.pdf"');

  doc.pipe(res);

  // Title
  doc.fontSize(20).text('Student Gradesheet', {
    align: 'center'
  });
  doc.moveDown();

  // Get student name from first course (if available)
  const studentName = courses.length > 0 ? courses[0].student_name : 'Student';
  doc.fontSize(14).text(`Student: ${studentName}`, {
    align: 'left'
  });
  doc.fontSize(12).text(`Date: ${new Date().toLocaleDateString()}`, {
    align: 'left'
  });
  doc.moveDown();

  if (courses.length === 0) {
    doc.text('No courses enrolled.', {
      align: 'center'
    });
    doc.end();
    return;
  }

  // Table headers
  const tableTop = doc.y;
  const courseCol = 50;
  const teacherCol = 250;
  const gradeCol = 450;
  const maxCol = 520;

  // Draw table header
  doc.fontSize(12).font('Helvetica-Bold');
  doc.text('Course', courseCol, tableTop);
  doc.text('Teacher', teacherCol, tableTop);
  doc.text('Grade', gradeCol, tableTop);

  // Draw header underline
  doc.moveTo(courseCol, tableTop + 15)
    .lineTo(maxCol, tableTop + 15)
    .stroke();

  let currentY = tableTop + 25;

  // Table rows
  doc.font('Helvetica');
  let totalGrade = 0;
  courses.forEach((course, index) => {
    doc.text(course.course_name || 'Unknown Course', courseCol, currentY, {
      width: 190
    });
    doc.text(course.teacher_name || 'Unknown Teacher', teacherCol, currentY, {
      width: 190
    });
    doc.text(course.final_grade ? `${course.final_grade.toFixed(1)}%` : 'N/A', gradeCol, currentY);

    totalGrade += course.final_grade || 0;
    currentY += 20;

    // Add a light line between rows
    if (index < courses.length - 1) {
      doc.strokeColor('#E0E0E0')
        .moveTo(courseCol, currentY - 5)
        .lineTo(maxCol, currentY - 5)
        .stroke()
        .strokeColor('#000000');
    }
  });

  // Add some space before GPA
  currentY += 10;

  // Draw bottom line
  doc.moveTo(courseCol, currentY)
    .lineTo(maxCol, currentY)
    .stroke();

  currentY += 15;

  // Calculate and display GPA
  const gpa = courses.length > 0 ? (totalGrade / courses.length) : 0;
  doc.fontSize(14).font('Helvetica-Bold');
  doc.text(`Overall GPA: ${gpa.toFixed(2)}%`, courseCol, currentY);

  // Add grading scale
  currentY += 30;
  doc.fontSize(10).font('Helvetica');
  doc.text('Grading Scale:', courseCol, currentY);
  currentY += 15;
  doc.text('90-100%: Excellent    80-89%: Good    70-79%: Average    Below 70%: Needs Improvement', courseCol, currentY);

  doc.end();
}

module.exports = EvaluationsController;