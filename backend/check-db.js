const db = require('./models/db');

console.log('🔍 Checking local SQLite database...');

// Check users
db.all('SELECT id, name, email, role FROM users', (err, users) => {
    if (err) {
        console.error('❌ Error getting users:', err);
        return;
    }

    console.log('\n=== USERS ===');
    if (users.length === 0) {
        console.log('❌ No users found in database');
    } else {
        users.forEach(user => {
            console.log(`✅ ID: ${user.id}, Name: ${user.name}, Email: ${user.email}, Role: ${user.role}`);
        });
    }

    // Check courses
    db.all('SELECT id, name, teacher_id FROM courses', (err, courses) => {
        if (err) {
            console.error('❌ Error getting courses:', err);
        } else {
            console.log('\n=== COURSES ===');
            if (courses.length === 0) {
                console.log('❌ No courses found in database');
            } else {
                courses.forEach(course => {
                    console.log(`✅ ID: ${course.id}, Name: ${course.name}, Teacher ID: ${course.teacher_id}`);
                });
            }
        }

        // Check evaluations
        db.all('SELECT id, student_id, teacher_id, subject FROM evaluations LIMIT 10', (err, evals) => {
            if (err) {
                console.error('❌ Error getting evaluations:', err);
            } else {
                console.log('\n=== EVALUATIONS (first 10) ===');
                if (evals.length === 0) {
                    console.log('❌ No evaluations found in database');
                } else {
                    evals.forEach(eval => {
                        console.log(`✅ ID: ${eval.id}, Student: ${eval.student_id}, Teacher: ${eval.teacher_id}, Subject: ${eval.subject}`);
                    });
                }
            }

            // Check course enrollments
            db.all('SELECT student_id, course_id FROM course_enrollments', (err, enrollments) => {
                if (err) {
                    console.error('❌ Error getting course enrollments:', err);
                } else {
                    console.log('\n=== COURSE ENROLLMENTS ===');
                    if (enrollments.length === 0) {
                        console.log('❌ No course enrollments found in database');
                    } else {
                        enrollments.forEach(enrollment => {
                            console.log(`✅ Student ID: ${enrollment.student_id}, Course ID: ${enrollment.course_id}`);
                        });
                    }
                }

                console.log('\n🏁 Database check complete!');
                process.exit(0);
            });
        });
    });
});