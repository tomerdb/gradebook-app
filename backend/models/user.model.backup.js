const db = require('./db');

const User = {
  // Get all users
  getAll: (callback) => {
    db.all('SELECT id, name, email, role, created_at FROM users', callback);
  },

  // Get user by ID
  getById: (id, callback) => {
    db.get('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [id], callback);
  },

  // Get user by email (for login)
  getByEmail: (email, callback) => {
    console.log('🔍 User.getByEmail called with email:', email);
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
      if (err) {
        console.error('❌ Database error in User.getByEmail:', err);
      } else if (user) {
        console.log('✅ User found in database:', user.email, 'ID:', user.id);
      } else {
        console.log('❌ No user found with email:', email);
      }
      callback(err, user);
    });
  },

  // Create new user
  create: (userData, callback) => {
    const {
      name,
      email,
      password,
      role
    } = userData;
    db.run(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, password, role],
      function (err) {
        callback(err, this ? this.lastID : null);
      }
    );
  },

  // Update user
  update: (id, userData, callback) => {
    const {
      name,
      email,
      role
    } = userData;
    db.run(
      'UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?',
      [name, email, role, id],
      callback
    );
  },

  // Delete user
  delete: (id, callback) => {
    db.run('DELETE FROM users WHERE id = ?', [id], callback);
  },

  // Get students by teacher
  getStudentsByTeacher: (teacherId, callback) => {
    console.log('🔍 User.getStudentsByTeacher called with teacherId:', teacherId);
    
    // Try to find students who have evaluations created by this teacher
    const evaluationQuery = `
      SELECT DISTINCT u.id, u.name, u.email,
        'Has Evaluations' as course_names,
        COUNT(DISTINCT e.id) as course_count
      FROM users u
      JOIN evaluations e ON u.id = e.student_id
      WHERE e.teacher_id = ? AND u.role = 'student'
      GROUP BY u.id, u.name, u.email
    `;
    
    console.log('📋 Trying evaluation-based query first...');
    db.all(evaluationQuery, [teacherId], (err, evalStudents) => {
      if (err) {
        console.error('❌ Database error in evaluation query:', err);
        return callback(err, []);
      }
      
      console.log('✅ Evaluation query returned:', evalStudents.length, 'students');
      
      if (evalStudents.length > 0) {
        console.log('📊 Evaluation-based students:', evalStudents);
        return callback(null, evalStudents);
      }
      
      // If no students found via evaluations, try course-based query
      console.log('📋 No evaluations found, trying course-based query...');
      const courseQuery = `
      SELECT DISTINCT u.id, u.name, u.email, 
        GROUP_CONCAT(c.name, ', ') as course_names,
        COUNT(c.id) as course_count
      FROM users u
      JOIN course_enrollments ce ON u.id = ce.student_id
      JOIN courses c ON ce.course_id = c.id
      WHERE c.teacher_id = ? AND u.role = 'student'
      GROUP BY u.id, u.name, u.email
    `;
    
    console.log('📋 Trying course-based query first...');
    db.all(courseQuery, [teacherId], (err, courseStudents) => {
      if (err) {
        console.error('❌ Database error in course query:', err);
        return callback(err, []);
      }
      
      console.log('✅ Course query returned:', courseStudents.length, 'students');
      
      if (courseStudents.length > 0) {
        console.log('� Course-based students:', courseStudents);
        return callback(null, courseStudents);
      }
      
      // If no students found via courses, try class-based assignment
      console.log('�📋 No course enrollments found, trying class-based assignments...');
      const classQuery = `
        SELECT DISTINCT u.id, u.name, u.email,
          'Direct Assignment' as course_names,
          0 as course_count
        FROM users u
        JOIN student_classes sc ON u.id = sc.student_id
        JOIN classes c ON sc.class_id = c.id
        WHERE c.teacher_id = ? AND u.role = 'student'
      `;
      
      db.all(classQuery, [teacherId], (err, classStudents) => {
        if (err) {
          console.error('❌ Database error in class query:', err);
          return callback(err, []);
        }
        
        console.log('✅ Class query returned:', classStudents.length, 'students');
        console.log('📊 Class-based students:', classStudents);
        callback(null, classStudents);
      });
    });
  },

  // Get teachers
  getTeachers: (callback) => {
    db.all('SELECT id, name, email FROM users WHERE role = "teacher"', callback);
  },

  // Get students
  getStudents: (callback) => {
    db.all('SELECT id, name, email FROM users WHERE role = "student"', callback);
  },

  // Assign student to teacher (create a default class if needed)
  assignStudentToTeacher: (studentId, teacherId, callback) => {
    // First, get or create a default class for the teacher
    db.get('SELECT id FROM classes WHERE teacher_id = ? AND name = ?',
      [teacherId, 'Default Class'], (err, classRow) => {
        if (err) return callback(err);

        if (classRow) {
          // Class exists, add student to it
          db.run('INSERT OR IGNORE INTO student_classes (student_id, class_id) VALUES (?, ?)',
            [studentId, classRow.id], callback);
        } else {
          // Create default class first, then add student
          db.run('INSERT INTO classes (name, description, teacher_id) VALUES (?, ?, ?)',
            ['Default Class', 'Default class for teacher assignments', teacherId],
            function (err) {
              if (err) return callback(err);

              db.run('INSERT INTO student_classes (student_id, class_id) VALUES (?, ?)',
                [studentId, this.lastID], callback);
            });
        }
      });
  },

  // Unassign student from teacher
  unassignStudentFromTeacher: (studentId, teacherId, callback) => {
    db.run(`DELETE FROM student_classes 
            WHERE student_id = ? AND class_id IN 
            (SELECT id FROM classes WHERE teacher_id = ?)`,
      [studentId, teacherId], callback);
  },

  // Get teacher assignments
  getTeacherAssignments: (callback) => {
    db.all(`
      SELECT 
        t.id as teacher_id,
        t.name as teacher_name,
        s.id as student_id,
        s.name as student_name,
        s.email as student_email,
        c.name as class_name
      FROM users t
      LEFT JOIN classes c ON t.id = c.teacher_id
      LEFT JOIN student_classes sc ON c.id = sc.class_id
      LEFT JOIN users s ON sc.student_id = s.id AND s.role = 'student'
      WHERE t.role = 'teacher'
      ORDER BY t.name, s.name
    `, callback);
  }
};

module.exports = User;