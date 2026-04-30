import { Router } from 'express';
import db from '../db.js';

const router = Router();

/**
 * Contact/Support Routes
 * ---------------------------------------------------------
 * Saving messages from the contact form. 
 */
router.post('/submit', async (req, res) => {
  const { full_name, email, subject, message } = req.body;

  if (!full_name || !email || !message) {
    return res.status(400).json({ message: 'Please fill in all required fields!' });
  }

  try {
    await db.query(
      'INSERT INTO contact_messages (full_name, email, subject, message) VALUES (?, ?, ?, ?)',
      [full_name, email, subject, message]
    );

    res.json({
      status: 'success',
      message: 'Your message has been received. We will get back to you soon.'
    });
  } catch (error) {
    console.error('❌ Contact Submit Error:', error);
    res.status(500).json({ message: 'Error submitting your message. Please try again later.' });
  }
});

export default router;
