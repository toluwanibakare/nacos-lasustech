import bcrypt from 'bcryptjs';
import db from './db.js';

/**
 * Seeding Script
 * ---------------------------------------------------------
 * This will insert a test user into your database so we can
 * verify the login works perfectly.
 */
const seed = async () => {
  try {
    // Clean up old test user first
    await db.query('DELETE FROM students WHERE matric_number = ?', ['230303010052']);
    
    const password = 'password123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const testUser = {
      full_name: 'Test Student',
      matric_number: '230303010052',
      password: hashedPassword,
      level: '400L',
      attendance_percentage: 84,
      resources_count: 12,
      dues_status: 'Pending',
      id_card_status: 'Not Registered'
    };

    // Insert user
    const [result] = await db.query(
      'INSERT INTO students (full_name, matric_number, password, level, attendance_percentage, resources_count, dues_status, id_card_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [testUser.full_name, testUser.matric_number, testUser.password, testUser.level, testUser.attendance_percentage, testUser.resources_count, testUser.dues_status, testUser.id_card_status]
    );

    const studentId = result.insertId;

    // Insert dummy activities
    await db.query(
      'INSERT INTO activities (student_id, type, status) VALUES (?, ?, ?), (?, ?, ?), (?, ?, ?)',
      [
        studentId, 'Profile Update', 'Done',
        studentId, 'Dues Initialization', 'Incomplete',
        studentId, 'Chapter Meeting', 'Attended'
      ]
    );

    // Seed Executives
    await db.query('DELETE FROM executives');
    await db.query(`
      INSERT INTO executives (name, post, level, image_url, description) VALUES 
      ('Lady Vice-President', 'Vice President', '400L', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2', 'Dedicated to student welfare.'),
      ('Gen Secretary', 'General Secretary', '300L', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d', 'Ensuring effective administration.')
    `);

    // Seed Events
    await db.query('DELETE FROM events');
    await db.query(`
      INSERT INTO events (title, description, event_date, location, image_url) VALUES 
      ('Tech Summit 2026', 'Annual tech conference for all students.', '2026-06-15', 'Main Auditorium', 'https://images.unsplash.com/photo-1540575861501-7ad05823c95b'),
      ('Code Hackathon', '48-hour coding challenge.', '2026-07-20', 'Computer Lab 1', 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d')
    `);

    // Seed Blogs
    await db.query('DELETE FROM blogs');
    await db.query(`
      INSERT INTO blogs (title, excerpt, content, image_url, category) VALUES 
      ('The Future of AI in Education', 'How AI is changing the way we learn.', 'Full content about AI here...', 'https://images.unsplash.com/photo-1677442136019-21780ecad995', 'Technology'),
      ('Chapter Highlights: April 2026', 'A look back at our recent activities.', 'Full content about chapter here...', 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4', 'Community')
    `);



    // Seed Admin User
    const adminPassword = await bcrypt.hash('adminpassword', salt);
    await db.query('DELETE FROM students WHERE matric_number = ?', ['admin']);
    await db.query(
      'INSERT INTO students (full_name, matric_number, password, level, role) VALUES (?, ?, ?, ?, ?)',
      ['NACOS Admin', 'admin', adminPassword, '400L', 'admin']
    );

    console.log('✅ Seeding successful! Test and Admin users created.');
    console.log('------------------------------------------');
    console.log('Test User Matric: 230303010052 | Pwd: password123');
    console.log('Admin User Matric: admin | Pwd: adminpassword');
    console.log('------------------------------------------');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    console.log('Make sure you have run setup.sql first to create the tables!');
    process.exit(1);
  }
};

seed();
