import { Router } from 'express';
import db from '../db.js';
import protect from '../middleware/auth.middleware.js';

const router = Router();

/**
 * Student Routes
 * ---------------------------------------------------------
 * These are protected. Only logged-in students can get here.
 */

// Get Profile
router.get('/profile', protect, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, full_name, matric_number, level, dues_status, wallet_balance, profile_image FROM students WHERE id = ?',
      [req.user.id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found!' });
    }

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile.' });
  }
});

// Get Dashboard Overview
router.get('/dashboard', protect, async (req, res) => {
  try {
    // 1. Get student stats
    const [studentRows] = await db.query(
      'SELECT full_name, level, dues_status, id_card_status, wallet_balance, attendance_percentage, resources_count, profile_image, matric_number FROM students WHERE id = ?',
      [req.user.id]
    );

    if (studentRows.length === 0) {
      return res.status(404).json({ message: 'User not found!' });
    }

    // 2. Get recent activities
    const [activityRows] = await db.query(
      'SELECT type, status, activity_date FROM activities WHERE student_id = ? ORDER BY activity_date DESC LIMIT 5',
      [req.user.id]
    );

    res.json({
      profile: studentRows[0],
      activities: activityRows
    });
  } catch (error) {
    console.error('❌ Dashboard Fetch Error:', error);
    res.status(500).json({ message: 'Error fetching dashboard data.' });
  }
});

import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import upload from '../middleware/upload.middleware.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Update Profile Picture
router.put('/profile-image', protect, upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No image uploaded!' });
  }

  try {
    const uploadsDir = path.join(__dirname, '..', 'uploads', 'profiles');
    // Ensure directory exists
    await fs.mkdir(uploadsDir, { recursive: true });

    const filename = `student-${req.user.id}-${Date.now()}.webp`;
    const filepath = path.join(uploadsDir, filename);

    // Process and compress image with Sharp
    await sharp(req.file.buffer)
      .resize(500, 500, { fit: 'cover' })
      .webp({ quality: 80 })
      .toFile(filepath);

    const imageUrl = `/uploads/profiles/${filename}`;

    // Save URL to database
    await db.query('UPDATE students SET profile_image = ? WHERE id = ?', [imageUrl, req.user.id]);

    res.json({ message: 'Profile picture updated successfully!', imageUrl });
  } catch (error) {
    console.error('❌ Upload Error:', error);
    res.status(500).json({ message: 'Error processing image.' });
  }
});

// Update Profile
router.put('/profile', protect, async (req, res) => {
  const { full_name, level, email } = req.body;

  
  try {
    await db.query(
      'UPDATE students SET full_name = ?, level = ?, email = ? WHERE id = ?',
      [full_name, level, email, req.user.id]
    );
    res.json({ message: 'Profile updated successfully! Lookin\' good.' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile.' });
  }
});


// Get my payments
router.get('/payments', protect, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM payments WHERE student_id = ? ORDER BY created_at DESC', [req.user.id]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching payments.' });
  }
});

export default router;
