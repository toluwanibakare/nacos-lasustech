import { Router } from 'express';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import protect from '../middleware/auth.middleware.js';
import emailService from '../services/email.service.js';

const router = Router();
const ID_SYSTEM_API = process.env.CENTRAL_API_URL || 'https://nacosid.tmb.it.com/api.php';
const API_KEY = process.env.ID_SYSTEM_API_KEY || 'NACOS_LASUSTECH_SECURE_API_KEY';

/**
 * Auth Routes (Proxy Mode)
 * ---------------------------------------------------------
 * These routes act as a secure bridge to the central PHP system.
 */

// Login Proxy
router.post('/login', async (req, res) => {
  const { matric_number, password } = req.body;
  const trimmedMatric = matric_number ? matric_number.trim() : '';
  console.log(`Login attempt for: ${trimmedMatric}`);

  try {
    const response = await axios.post(`${ID_SYSTEM_API}?action=login`, {
      matric_number: trimmedMatric,
      password,
    }, {
      headers: {
        'X-API-KEY': API_KEY,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    const isSuccess = response.data.status === 'success' || response.data.id || response.data.matric_no;

    if (isSuccess) {
      const user = response.data.user || response.data;
      const matric = user.matric_number || user.matric_no || user.matric || matric_number;
      const role = user.post || user.role || user.position || user.rank || 'student';

      const token = jwt.sign(
        { id: user.id, account_type: 'student', matric, name: user.full_name || user.name, email: user.email, role },
        process.env.JWT_SECRET || 'nacos_secret_2025',
        { expiresIn: '30d' }
      );

      res.json({
        status: 'success',
        token,
        user: {
          id: user.id,
          account_type: 'student',
          name: user.full_name || user.name,
          matric,
          email: user.email,
          profile_image: user.profile_image || user.image_path || user.image_url,
          role,
          post: role,
        },
      });
    } else {
      console.log('Login Failed Response:', response.data);
      res.status(401).json({ message: response.data.message || 'Invalid credentials' });
    }
  } catch (error) {
    console.error('External Auth Error:', error.message);
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({
        message: 'Central system unreachable.',
        details: error.message,
      });
    }
  }
});

// Forgot Password Proxy
router.post('/forgot-password', async (req, res) => {
  const { matric_number, email: providedEmail } = req.body;
  console.log(`Password reset requested for: ${matric_number}`);

  try {
    const response = await axios.post(`${ID_SYSTEM_API}?action=request_otp`, {
      matric_number,
      email: providedEmail,
    }, {
      headers: { 'X-API-KEY': API_KEY },
      timeout: 15000,
    });

    const { status, email, otp, error } = response.data;
    console.log(`Central system response: ${status}`);

    if (status === 'success' && otp) {
      console.log(`Attempting to send OTP to: ${email}`);

      try {
        await emailService.sendOtp(email, 'there', otp);
        console.log(`OTP Email sent successfully to ${email}`);
        res.json({ status: 'success', message: 'OTP sent successfully to your registered email.' });
      } catch (mailError) {
        console.error('SMTP Error:', mailError.message);
        res.status(500).json({
          message: 'Error sending verification email. Our mail server might be down.',
          details: emailService.friendlyMailError(mailError),
        });
      }
    } else {
      console.log(`OTP Request Failed: ${error}`);
      res.status(400).json({ message: error || 'Verification failed.' });
    }
  } catch (error) {
    console.error('Forgot Password Error:', error.message);
    const status = error.response?.status || 500;
    const message = error.response?.data?.error || error.response?.data?.message || 'Error processing password reset.';
    res.status(status).json({ message });
  }
});

// Reset Password Proxy (Used with OTP)
router.post('/reset-password', async (req, res) => {
  const { matric_number, otp, new_password } = req.body;

  try {
    const response = await axios.post(`${ID_SYSTEM_API}?action=reset_password`, {
      matric_number,
      otp,
      new_password,
    }, {
      headers: { 'X-API-KEY': API_KEY },
    });

    res.json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.error || error.response?.data?.message || 'Error resetting password.';
    res.status(status).json({ message });
  }
});

// Verify OTP Proxy
router.post('/verify-otp', async (req, res) => {
  const { matric_number, otp } = req.body;

  try {
    const response = await axios.post(`${ID_SYSTEM_API}?action=verify_otp`, {
      matric_number,
      otp,
    }, {
      headers: { 'X-API-KEY': API_KEY },
    });

    res.json(response.data);
  } catch (error) {
    const status = error.response?.status || 400;
    const message = error.response?.data?.error || error.response?.data?.message || 'Invalid or expired OTP.';
    res.status(status).json({ message });
  }
});

// Change Password Proxy (Authenticated)
router.post('/change-password', protect, async (req, res) => {
  const { current_password, new_password } = req.body;

  try {
    const response = await axios.post(`${ID_SYSTEM_API}?action=change_password`, {
      matric_number: req.user.matric,
      current_password,
      new_password,
    }, {
      headers: { 'X-API-KEY': API_KEY },
    });

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ message: 'Error updating password on central system.' });
  }
});

export default router;
