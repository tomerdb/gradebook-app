const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
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
});

module.exports = db;
