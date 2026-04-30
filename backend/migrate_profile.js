import db from './db.js';

const run = async () => {
  try {
    console.log('Adding profile_image column...');
    await db.query(`
      ALTER TABLE students 
      ADD COLUMN profile_image VARCHAR(255) DEFAULT NULL
    `);
    console.log('✅ Column added successfully.');
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('Column already exists, ignoring.');
    } else {
      console.error('Error adding column:', error.message);
    }
  } finally {
    process.exit(0);
  }
};

run();
