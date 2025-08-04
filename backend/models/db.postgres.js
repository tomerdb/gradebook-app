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

// Initialize database tables and data
async function initializeDatabase() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Create users table
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

    // Create courses table
    await client.query(`
      CREATE TABLE IF NOT EXISTS courses (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        teacher_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create course_grading_rules table
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

    // Create course_enrollments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS course_enrollments (
        id SERIAL PRIMARY KEY,
        student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
        enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(student_id, course_id)
      )
    `);

    // Create evaluations table
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

    // Check if data already exists (to prevent duplicate inserts)
    const { rows: existingUsers } = await client.query('SELECT COUNT(*) as count FROM users');
    
    if (parseInt(existingUsers[0].count) === 0) {
      console.log('Initializing database with sample data...');
      
      // Hash passwords
      const adminPassword = await bcrypt.hash('admin123', 10);
      const johnPassword = await bcrypt.hash('john123', 10);
      const studentPassword = await bcrypt.hash('student123', 10);
      const yuvalPassword = await bcrypt.hash('yuval123', 10);
      const tomerPassword = await bcrypt.hash('tomer123', 10);

      // Insert sample users
      await client.query(`
        INSERT INTO users (id, name, email, password, role) VALUES
        (1, 'Admin User', 'admin@gradebook.com', $1, 'admin'),
        (2, 'John Teacher', 'john@gradebook.com', $2, 'teacher'),
        (3, 'Student User', 'student@gradebook.com', $3, 'student'),
        (4, 'yuval', 'yuval@gradebook.com', $4, 'student'),
        (5, 'tomer', 'tomer@gradebook.com', $5, 'teacher')
      `, [adminPassword, johnPassword, studentPassword, yuvalPassword, tomerPassword]);

      // Reset sequence to start from 6
      await client.query('ALTER SEQUENCE users_id_seq RESTART WITH 6');

      // Insert sample courses
      await client.query(`
        INSERT INTO courses (id, name, description, teacher_id) VALUES
        (1, 'Mathematics', 'Basic Mathematics Course', 2),
        (2, 'Science', 'General Science Course', 2),
        (3, 'AnimeDiscussion', 'Anime Discussion Course', 5)
      `);

      // Reset sequence
      await client.query('ALTER SEQUENCE courses_id_seq RESTART WITH 4');

      // Insert default grading rules for courses
      await client.query(`
        INSERT INTO course_grading_rules (course_id, participation_weight, homework_weight, exam_weight, project_weight, quiz_weight) VALUES
        (1, 20, 40, 40, 0, 0),
        (2, 15, 35, 50, 0, 0),
        (3, 20, 20, 40, 0, 20)
      `);

      // Insert sample enrollments
      await client.query(`
        INSERT INTO course_enrollments (student_id, course_id) VALUES
        (3, 1), (3, 2), (4, 1), (4, 2), (4, 3)
      `);

      // Insert sample evaluations
      await client.query(`
        INSERT INTO evaluations (id, student_id, teacher_id, course_id, student_name, teacher_name, course_name, subject, evaluation_type, score, feedback, date_created) VALUES
        (1, 4, 2, 1, 'yuval', 'John Teacher', 'Mathematics', 'Final exam', 'exam', 99, 'Excellent work!', '2025-08-03 13:45:00'),
        (2, 4, 5, 3, 'yuval', 'tomer', 'AnimeDiscussion', 'Mathematics Quiz', 'quiz', 95, 'Great performance!', '2025-08-03 14:46:57'),
        (3, 4, 2, 1, 'yuval', 'John Teacher', 'Mathematics', 'Class Participation', 'participation', 92, 'Active participation in discussions', '2025-08-03 13:44:42'),
        (4, 4, 2, 1, 'yuval', 'John Teacher', 'Mathematics', 'Homework Assignment 1', 'homework', 85, 'Good work on homework', '2025-08-02 10:30:00')
      `);

      // Reset sequence
      await client.query('ALTER SEQUENCE evaluations_id_seq RESTART WITH 5');

      console.log('✅ Database initialized with sample data');
    } else {
      console.log('✅ Database already contains data, skipping initialization');
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error initializing database:', err);
    throw err;
  } finally {
    client.release();
  }
}

// Wrapper functions to match SQLite interface
const db = {
  // Query method that matches sqlite3 interface
  all: (sql, params, callback) => {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    
    pool.query(sql, params, (err, result) => {
      if (err) {
        return callback(err);
      }
      callback(null, result.rows);
    });
  },

  get: (sql, params, callback) => {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    
    pool.query(sql, params, (err, result) => {
      if (err) {
        return callback(err);
      }
      callback(null, result.rows[0] || null);
    });
  },

  run: (sql, params, callback) => {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    
    // Convert SQLite INSERT syntax to PostgreSQL for RETURNING id
    if (sql.includes('INSERT INTO') && !sql.includes('RETURNING')) {
      sql = sql + ' RETURNING id';
    }
    
    pool.query(sql, params, (err, result) => {
      if (err && callback) {
        return callback(err);
      }
      
      // Create a context object similar to sqlite3's this context
      const context = {
        lastID: result && result.rows && result.rows[0] ? result.rows[0].id : null,
        changes: result ? result.rowCount : 0
      };
      
      if (callback) {
        callback.call(context, err);
      }
    });
  },

  serialize: (callback) => {
    // PostgreSQL doesn't need serialize, just call the callback
    if (callback) callback();
  },

  close: (callback) => {
    pool.end(callback);
  }
};

// Initialize database when module is loaded
initializeDatabase().catch(console.error);

module.exports = db;
