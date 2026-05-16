import { Router } from 'express';
import axios from 'axios';
import emailService from '../services/email.service.js';

const router = Router();
const ID_SYSTEM_API = 'https://nacosid.tmb.it.com/api.php';
const API_KEY = process.env.ID_SYSTEM_API_KEY || 'NACOS_LASUSTECH_SECURE_API_KEY';

/**
 * Contact/Support Routes
 * ---------------------------------------------------------
 * Proxying contact messages to the central system and sending emails.
 */
router.post('/submit', async (req, res) => {
  const { full_name, email, subject, message } = req.body;

  if (!full_name || !email || !message) {
    return res.status(400).json({ message: 'Please fill in all required fields!' });
  }

  try {
    // 1. Log to Central System
    try {
      const params = new URLSearchParams();
      params.append('action', 'submit_contact');
      params.append('api_key', API_KEY);
      params.append('full_name', full_name);
      params.append('email', email);
      params.append('subject', subject || 'No Subject');
      params.append('message', message);

      await axios.post(`${ID_SYSTEM_API}?action=submit_contact`, params.toString(), {
        headers: { 
          'X-API-KEY': API_KEY,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
    } catch (apiErr) {
      console.warn('⚠️ Could not log contact message to central system:', apiErr.message);
    }

    // 2. Send emails
    emailService.sendContactConfirmation(email, full_name).catch(err => console.error('Email Error:', err));
    emailService.sendContactNotificationToAdmin({ full_name, email, subject, message }).catch(err => console.error('Admin Email Error:', err));

    res.json({
      status: 'success',
      message: 'Your message has been received. We will get back to you soon.'
    });
  } catch (error) {
    console.error('❌ Contact Submit Error:', error.message);
    res.status(500).json({ message: 'Error processing your message. Please try again later.' });
  }
});

export default router;
