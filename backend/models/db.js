// Environment-based database configuration
if (process.env.DATABASE_URL) {
  // Production: Use PostgreSQL
  console.log('🐘 Using PostgreSQL database');
  console.log('📍 DATABASE_URL found:', process.env.DATABASE_URL ? 'Yes' : 'No');
  
  const { Pool } = require('pg');
  const bcrypt = require('bcryptjs');

  // Create PostgreSQL connection pool
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  // Test the connection
  pool.connect((err, client, release) => {
    if (err) {
      console.error('Error connecting to PostgreSQL:', err);
      return;
    }
    console.log('✅ Connected to PostgreSQL database');
    release();
  });

  // Initialize PostgreSQL database
  async function initializeDatabase() {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Create tables
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          role VARCHAR(50) NOT NULL DEFAULT 'student',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS courses (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          teacher_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS course_grading_rules (
          id SERIAL PRIMARY KEY,
          course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
          participation_weight INTEGER DEFAULT 20,
          homework_weight INTEGER DEFAULT 40,
          exam_weight INTEGER DEFAULT 40,
          project_weight INTEGER DEFAULT 0,
          quiz_weight INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS course_enrollments (
          id SERIAL PRIMARY KEY,
          student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
          enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(student_id, course_id)
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS evaluations (
          id SERIAL PRIMARY KEY,
          student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          teacher_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
          student_name VARCHAR(255),
          teacher_name VARCHAR(255),
          course_name VARCHAR(255),
          subject VARCHAR(255) NOT NULL,
          evaluation_type VARCHAR(50) NOT NULL,
          score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
          feedback TEXT,
          date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Check if data exists
      const { rows: existingUsers } = await client.query('SELECT COUNT(*) as count FROM users');
      
      if (parseInt(existingUsers[0].count) === 0) {
        console.log('Initializing PostgreSQL database with sample data...');
        
        // Hash passwords
        const adminPassword = await bcrypt.hash('admin123', 10);
        const johnPassword = await bcrypt.hash('john123', 10);
        const studentPassword = await bcrypt.hash('student123', 10);
        const yuvalPassword = await bcrypt.hash('yuval123', 10);
        const tomerPassword = await bcrypt.hash('tomer123', 10);

        // Insert sample data
        await client.query(`
          INSERT INTO users (id, name, email, password, role) VALUES
          (1, 'Admin User', 'admin@gradebook.com', $1, 'admin'),
          (2, 'John Teacher', 'john@gradebook.com', $2, 'teacher'),
          (3, 'Student User', 'student@gradebook.com', $3, 'student'),
          (4, 'yuval', 'yuval@gradebook.com', $4, 'student'),
          (5, 'tomer', 'tomer@gradebook.com', $5, 'teacher')
        `, [adminPassword, johnPassword, studentPassword, yuvalPassword, tomerPassword]);

        await client.query('ALTER SEQUENCE users_id_seq RESTART WITH 6');

        await client.query(`
          INSERT INTO courses (id, name, description, teacher_id) VALUES
          (1, 'Mathematics', 'Basic Mathematics Course', 2),
          (2, 'Science', 'General Science Course', 2),
          (3, 'AnimeDiscussion', 'Anime Discussion Course', 5)
        `);

        await client.query('ALTER SEQUENCE courses_id_seq RESTART WITH 4');

        await client.query(`
          INSERT INTO course_grading_rules (course_id, participation_weight, homework_weight, exam_weight, project_weight, quiz_weight) VALUES
          (1, 20, 40, 40, 0, 0),
          (2, 15, 35, 50, 0, 0),
          (3, 20, 20, 40, 0, 20)
        `);

        await client.query(`
          INSERT INTO course_enrollments (student_id, course_id) VALUES
          (3, 1), (3, 2), (4, 1), (4, 2), (4, 3)
        `);

        await client.query(`
          INSERT INTO evaluations (id, student_id, teacher_id, course_id, student_name, teacher_name, course_name, subject, evaluation_type, score, feedback, date_created) VALUES
          (1, 4, 2, 1, 'yuval', 'John Teacher', 'Mathematics', 'Final exam', 'exam', 99, 'Excellent work!', '2025-08-03 13:45:00'),
          (2, 4, 5, 3, 'yuval', 'tomer', 'AnimeDiscussion', 'Mathematics Quiz', 'quiz', 95, 'Great performance!', '2025-08-03 14:46:57'),
          (3, 4, 2, 1, 'yuval', 'John Teacher', 'Mathematics', 'Class Participation', 'participation', 92, 'Active participation in discussions', '2025-08-03 13:44:42'),
          (4, 4, 2, 1, 'yuval', 'John Teacher', 'Mathematics', 'Homework Assignment 1', 'homework', 85, 'Good work on homework', '2025-08-02 10:30:00')
        `);

        await client.query('ALTER SEQUENCE evaluations_id_seq RESTART WITH 5');

        console.log('✅ PostgreSQL database initialized with sample data');
      } else {
        console.log('✅ PostgreSQL database already contains data');
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('❌ Error initializing PostgreSQL database:', err);
      throw err;
    } finally {
      client.release();
    }
  }

  // Initialize database
  initializeDatabase().catch(console.error);

  // Wrapper functions to match SQLite interface
  const db = {
    all: (sql, params, callback) => {
      if (typeof params === 'function') {
        callback = params;
        params = [];
      }
      
      pool.query(sql, params, (err, result) => {
        if (err) return callback(err);
        callback(null, result.rows);
      });
    },

    get: (sql, params, callback) => {
      if (typeof params === 'function') {
        callback = params;
        params = [];
      }
      
      pool.query(sql, params, (err, result) => {
        if (err) return callback(err);
        callback(null, result.rows[0] || null);
      });
    },

    run: (sql, params, callback) => {
      if (typeof params === 'function') {
        callback = params;
        params = [];
      }
      
      // Add RETURNING id for INSERT statements
      if (sql.includes('INSERT INTO') && !sql.includes('RETURNING')) {
        sql = sql + ' RETURNING id';
      }
      
      pool.query(sql, params, (err, result) => {
        if (err && callback) return callback(err);
        
        const context = {
          lastID: result && result.rows && result.rows[0] ? result.rows[0].id : null,
          changes: result ? result.rowCount : 0
        };
        
        if (callback) callback.call(context, err);
      });
    },

    serialize: (callback) => {
      if (callback) callback();
    },

    close: (callback) => {
      pool.end(callback);
    }
  };

  module.exports = db;

} else {
  // Development: Use SQLite
  console.log('📁 Using SQLite database');
  console.log('📍 DATABASE_URL found:', process.env.DATABASE_URL ? 'Yes' : 'No');
  console.log('📍 NODE_ENV:', process.env.NODE_ENV);
  
  const sqlite3 = require('sqlite3').verbose();
  const bcrypt = require('bcryptjs');
  const path = require('path');

  const dbPath = path.join(__dirname, '..', 'gradingapp.db');
  const db = new sqlite3.Database(dbPath);

db.serialize(() => {
        // Users table
        db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'teacher', 'student')),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

        // Classes table (now called Courses)
        db.run(`CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    teacher_id INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES users(id)
  )`);

        // Course grading rules table
        db.run(`CREATE TABLE IF NOT EXISTS course_grading_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER,
    participation_weight INTEGER DEFAULT 20,
    homework_weight INTEGER DEFAULT 40,
    exam_weight INTEGER DEFAULT 40,
    project_weight INTEGER DEFAULT 0,
    quiz_weight INTEGER DEFAULT 0,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id),
    UNIQUE(course_id)
  )`);

        // Student-Course enrollment table
        db.run(`CREATE TABLE IF NOT EXISTS course_enrollments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER,
    course_id INTEGER,
    enrolled_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (course_id) REFERENCES courses(id),
    UNIQUE(student_id, course_id)
  )`);

        // Evaluations table (updated to use courses)
        db.run(`CREATE TABLE IF NOT EXISTS evaluations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    teacher_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    student_name TEXT,
    teacher_name TEXT,
    course_name TEXT,
    subject TEXT NOT NULL,
    evaluation_type TEXT NOT NULL CHECK(evaluation_type IN ('exam', 'homework', 'participation', 'project', 'quiz')),
    score INTEGER NOT NULL CHECK(score >= 0 AND score <= 100),
    feedback TEXT,
    date_created TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (teacher_id) REFERENCES users(id),
    FOREIGN KEY (course_id) REFERENCES courses(id)
  )`);

        // Insert default admin user if not exists
        const adminPassword = bcrypt.hashSync('admin123', 10);
        db.run(`INSERT OR IGNORE INTO users (name, email, password, role) 
          VALUES ('Admin User', 'admin@gradebook.com', ?, 'admin')`, [adminPassword]);

        // Insert sample teacher if not exists
        const teacherPassword = bcrypt.hashSync('teacher123', 10);
        db.run(`INSERT OR IGNORE INTO users (name, email, password, role) 
          VALUES ('John Teacher', 'teacher@gradebook.com', ?, 'teacher')`, [teacherPassword]);

        // Insert sample student if not exists
        const studentPassword = bcrypt.hashSync('student123', 10);
        db.run(`INSERT OR IGNORE INTO users (name, email, password, role) 
          VALUES ('Jane Student', 'student@gradebook.com', ?, 'student')`, [studentPassword]);

        // Insert another sample student (yuval)
        const yuvalPassword = bcrypt.hashSync('yuval123', 10);
        db.run(`INSERT OR IGNORE INTO users (name, email, password, role) 
          VALUES ('yuval', 'yuval@gradebook.com', ?, 'student')`, [yuvalPassword]);

        // Insert another teacher (tomer)
        const tomerPassword = bcrypt.hashSync('tomer123', 10);
        db.run(`INSERT OR IGNORE INTO users (name, email, password, role) 
          VALUES ('tomer', 'tomer@gradebook.com', ?, 'teacher')`, [tomerPassword]);

        // Insert sample courses
        db.run(`INSERT OR IGNORE INTO courses (id, name, description, teacher_id) 
          VALUES (1, 'Mathematics', 'Basic Mathematics Course', 2)`);

        db.run(`INSERT OR IGNORE INTO courses (id, name, description, teacher_id) 
          VALUES (2, 'Science', 'General Science Course', 2)`);

        db.run(`INSERT OR IGNORE INTO courses (id, name, description, teacher_id) 
          VALUES (3, 'AnimeDiscussion', 'Anime Discussion Course', 5)`);

        // Insert default grading rules for courses
        db.run(`INSERT OR IGNORE INTO course_grading_rules (course_id, participation_weight, homework_weight, exam_weight) 
          VALUES (1, 20, 40, 40)`);

        db.run(`INSERT OR IGNORE INTO course_grading_rules (course_id, participation_weight, homework_weight, exam_weight) 
          VALUES (2, 15, 35, 50)`);

        db.run(`INSERT OR IGNORE INTO course_grading_rules (course_id, participation_weight, homework_weight, exam_weight, quiz_weight) 
          VALUES (3, 20, 20, 40, 20)`);

        // Insert sample enrollments (enroll student ID 3 in both courses, and yuval ID 4 in all courses)
        db.run(`INSERT OR IGNORE INTO course_enrollments (student_id, course_id) 
          VALUES (3, 1)`);

        db.run(`INSERT OR IGNORE INTO course_enrollments (student_id, course_id) 
          VALUES (3, 2)`);

        db.run(`INSERT OR IGNORE INTO course_enrollments (student_id, course_id) 
          VALUES (4, 1)`);

        db.run(`INSERT OR IGNORE INTO course_enrollments (student_id, course_id) 
          VALUES (4, 2)`);

        db.run(`INSERT OR IGNORE INTO course_enrollments (student_id, course_id) 
          VALUES (4, 3)`);

        // Insert sample evaluations
        db.run(`INSERT OR IGNORE INTO evaluations (id, student_id, teacher_id, course_id, student_name, teacher_name, course_name, subject, evaluation_type, score, feedback, date_created) 
          VALUES (1, 4, 2, 1, 'yuval', 'John Teacher', 'Mathematics', 'Final exam', 'exam', 99, 'Excellent work!', '2025-08-03 13:45:00')`);

        db.run(`INSERT OR IGNORE INTO evaluations (id, student_id, teacher_id, course_id, student_name, teacher_name, course_name, subject, evaluation_type, score, feedback, date_created) 
          VALUES (2, 4, 5, 3, 'yuval', 'tomer', 'AnimeDiscussion', 'Mathematics Quiz', 'quiz', 95, 'Great performance!', '2025-08-03 14:46:57')`);

        db.run(`INSERT OR IGNORE INTO evaluations (id, student_id, teacher_id, course_id, student_name, teacher_name, course_name, subject, evaluation_type, score, feedback, date_created) 
          VALUES (3, 4, 2, 1, 'yuval', 'John Teacher', 'Mathematics', 'Class Participation', 'participation', 92, 'Active participation in discussions', '2025-08-03 13:44:42')`);

        // Add a homework evaluation for Mathematics course to complete the grading
        db.run(`INSERT OR IGNORE INTO evaluations (id, student_id, teacher_id, course_id, student_name, teacher_name, course_name, subject, evaluation_type, score, feedback, date_created) 
          VALUES (4, 4, 2, 1, 'yuval', 'John Teacher', 'Mathematics', 'Homework Assignment 1', 'homework', 85, 'Good work on homework', '2025-08-02 10:30:00')`);

        // Update existing data to fix inconsistencies
        db.run(`UPDATE course_grading_rules SET quiz_weight = 20, homework_weight = 20 WHERE course_id = 3`);
        db.run(`UPDATE evaluations SET student_name = 'yuval', teacher_name = 'tomer', course_name = 'AnimeDiscussion' WHERE id = 2`);
        db.run(`UPDATE evaluations SET student_name = 'yuval' WHERE student_id = 4`);
        db.run(`UPDATE evaluations SET score = 99 WHERE id = 1`);
});

  module.exports = db;
}