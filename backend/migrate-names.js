// Migration script to populate name fields in existing evaluations
const db = require('./models/db');

console.log('Starting migration to add and populate name fields...');

// Function to add columns safely
function addColumnSafely(columnName, callback) {
    db.run(`ALTER TABLE evaluations ADD COLUMN ${columnName} TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
            console.error(`Error adding ${columnName} column:`, err.message);
            callback(err);
        } else {
            console.log(`${columnName} column added or already exists`);
            callback(null);
        }
    });
}

// Add all three columns
addColumnSafely('student_name', (err1) => {
    if (err1) return;

    addColumnSafely('teacher_name', (err2) => {
        if (err2) return;

        addColumnSafely('course_name', (err3) => {
            if (err3) return;

            // Now populate the fields
            setTimeout(() => {
                populateNameFields();
            }, 500);
        });
    });
});

function populateNameFields() {
    console.log('Populating name fields for existing evaluations...');

    db.all(`
    SELECT e.id, e.student_id, e.teacher_id, e.course_id,
           s.name as current_student_name,
           t.name as current_teacher_name,
           c.name as current_course_name
    FROM evaluations e
    LEFT JOIN users s ON e.student_id = s.id
    LEFT JOIN users t ON e.teacher_id = t.id
    LEFT JOIN courses c ON e.course_id = c.id
  `, (err, evaluations) => {
        if (err) {
            console.error('Error fetching evaluations:', err);
            return;
        }

        console.log(`Found ${evaluations.length} evaluations to update`);

        let updateCount = 0;
        evaluations.forEach((evaluation) => {
            const studentName = evaluation.current_student_name || 'Unknown Student';
            const teacherName = evaluation.current_teacher_name || 'Unknown Teacher';
            const courseName = evaluation.current_course_name || 'Unknown Course';

            db.run(`
        UPDATE evaluations 
        SET student_name = ?, teacher_name = ?, course_name = ?
        WHERE id = ?
      `, [studentName, teacherName, courseName, evaluation.id], (err) => {
                if (err) {
                    console.error(`Error updating evaluation ${evaluation.id}:`, err);
                } else {
                    updateCount++;
                    console.log(`Updated evaluation ${evaluation.id}: ${studentName} - ${teacherName} - ${courseName}`);

                    if (updateCount === evaluations.length) {
                        console.log('Migration completed successfully!');
                        process.exit(0);
                    }
                }
            });
        });

        if (evaluations.length === 0) {
            console.log('No evaluations found. Migration completed!');
            process.exit(0);
        }
    });
}