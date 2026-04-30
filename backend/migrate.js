import db from './db.js';

const migrate = async () => {
  try {
    console.log('🔄 Running Migrations...');

    // Add new columns to students if they don't exist
    const [columns] = await db.query('SHOW COLUMNS FROM students');
    const columnNames = columns.map(c => c.Field);

    if (!columnNames.includes('id_card_status')) {
      await db.query("ALTER TABLE students ADD COLUMN id_card_status ENUM('Not Registered', 'Pending', 'Ready', 'Collected') DEFAULT 'Not Registered'");
      console.log('➕ Added id_card_status');
    }
    if (!columnNames.includes('attendance_percentage')) {
      await db.query("ALTER TABLE students ADD COLUMN attendance_percentage INT DEFAULT 0");
      console.log('➕ Added attendance_percentage');
    }
    if (!columnNames.includes('resources_count')) {
      await db.query("ALTER TABLE students ADD COLUMN resources_count INT DEFAULT 0");
      console.log('➕ Added resources_count');
    }

    // Create activities table if it doesn't exist
    await db.query(`
      CREATE TABLE IF NOT EXISTS activities (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT,
        type VARCHAR(100) NOT NULL,
        status VARCHAR(50),
        activity_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id)
      )
    `);
    console.log('➕ Ensured activities table exists');

    console.log('✅ Migration complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
};

migrate();
