import { Router } from 'express';
import db from '../db.js';
import protect from '../middleware/auth.middleware.js';

const router = Router();

/**
 * ID Card Service Route
 * ---------------------------------------------------------
 * Handling student ID card requests. 
 */
router.post('/id-card/request', protect, async (req, res) => {
  const { 
    passport_url, 
    full_name, 
    matric_number, 
    blood_group, 
    birthday, 
    emergency_contact 
  } = req.body;

  // Quick validation - don't want empty cards!
  if (!passport_url || !full_name || !matric_number) {
    return res.status(400).json({ message: 'Missing required fields for ID card request.' });
  }

  try {
    // We'll save this to a new table. (I'll add this to setup.sql too)
    await db.query(
      'INSERT INTO id_card_requests (student_id, passport_url, full_name, matric_number, blood_group, birthday, emergency_contact) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, passport_url, full_name, matric_number, blood_group, birthday, emergency_contact]
    );

    res.json({
      status: 'success',
      message: 'ID Card request submitted successfully! We will review it soon.'
    });
  } catch (error) {
    console.error('❌ ID Card Request Error:', error);
    res.status(500).json({ message: 'Error submitting ID card request.' });
  }
});

export default router;
