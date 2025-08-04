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
    
    // Get all students connected to this teacher through evaluations OR course enrollments
    const allStudentsQuery = `
      SELECT DISTINCT u.id, u.name, u.email,
        CASE 
          WHEN c.course_names IS NOT NULL THEN c.course_names
          WHEN e.has_evals > 0 THEN 'Has Evaluations'
          ELSE 'No Course Info'
        END as course_names,
        COALESCE(c.course_count, e.eval_count, 0) as course_count
      FROM users u
      LEFT JOIN (
        SELECT ce.student_id, 
               string_agg(DISTINCT courses.name, ', ') as course_names,
               COUNT(DISTINCT courses.id) as course_count
        FROM course_enrollments ce
        JOIN courses ON ce.course_id = courses.id
        WHERE courses.teacher_id = $1
        GROUP BY ce.student_id
      ) c ON u.id = c.student_id
      LEFT JOIN (
        SELECT e.student_id,
               COUNT(e.id) as eval_count,
               1 as has_evals
        FROM evaluations e
        WHERE e.teacher_id = $1
        GROUP BY e.student_id
      ) e ON u.id = e.student_id
      WHERE u.role = 'student' 
        AND (c.student_id IS NOT NULL OR e.student_id IS NOT NULL)
      ORDER BY u.name
    `;
    
    console.log('📋 Executing comprehensive student query...');
    console.log('📋 Teacher ID:', teacherId);
    
    db.all(allStudentsQuery, [teacherId], (err, students) => {
      if (err) {
        console.error('❌ Database error:', err);
        console.error('❌ Error details:', err.message);
        return callback(err, []);
      }
      
      console.log('✅ Query executed successfully');
      console.log('✅ Found', students.length, 'students');
      console.log('📊 Students data:', JSON.stringify(students, null, 2));
      
      callback(null, students);
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
