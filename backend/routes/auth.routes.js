import { Router } from 'express';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import protect from '../middleware/auth.middleware.js';

const router = Router();
const ID_SYSTEM_API = 'https://nacosid.tmb.it.com/api.php';
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
  console.log(`📡 Login attempt for: ${trimmedMatric}`);

  try {
    const loginData = {
      matric_number: trimmedMatric,
      password: password
    };

    const response = await axios.post(`${ID_SYSTEM_API}?action=login`, loginData, {
      headers: { 
        'X-API-KEY': API_KEY,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    const isSuccess = response.data.status === 'success' || response.data.id || response.data.matric_no;

    if (isSuccess) {
      const user = response.data.user || response.data;
      const matric = user.matric_number || user.matric_no || user.matric || matric_number;
      const role = user.post || user.role || user.position || user.rank || 'student';
      
      const token = jwt.sign(
        { id: user.id, matric: matric, name: user.full_name || user.name, email: user.email },
        process.env.JWT_SECRET || 'nacos_secret_2025',
        { expiresIn: '30d' }
      );

      res.json({
        status: 'success',
        token,
        user: {
          id: user.id,
          name: user.full_name || user.name,
          matric: matric,
          email: user.email,
          profile_image: user.profile_image || user.image_path || user.image_url,
          role: role,
          post: role
        }
      });
    } else {
      console.log('⚠️ Login Failed Response:', response.data);
      res.status(401).json({ message: response.data.message || 'Invalid credentials' });
    }
  } catch (error) {
    console.error('❌ External Auth Error Details:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      res.status(error.response.status).json(error.response.data);
    } else {
      console.error('Message:', error.message);
      res.status(500).json({ 
        message: 'Central system unreachable.', 
        details: error.message,
        tip: 'Check if https://nacosid.tmb.it.com/api.php is online.'
      });
    }
  }
});

import nodemailer from 'nodemailer';

// Configure Nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Forgot Password Proxy
router.post('/forgot-password', async (req, res) => {
  const { matric_number, email: providedEmail } = req.body;

  try {
    const response = await axios.post(`${ID_SYSTEM_API}?action=request_otp`, {
      matric_number,
      email: providedEmail
    }, {
      headers: { 'X-API-KEY': API_KEY }
    });

    const { status, email, otp, error } = response.data;

    if (status === 'success' && otp) {
      // Send the email
      const mailOptions = {
        from: `"NACOS LASUSTECH" <${process.env.SMTP_USER}>`,
        to: email,
        subject: "Password Reset Verification Code",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
            <h2 style="color: #1e3a8a; text-align: center;">Identity Verification</h2>
            <p>Hello,</p>
            <p>You requested to reset your password for the NACOS LASUSTECH Student Portal. Please use the verification code below to proceed:</p>
            <div style="background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1e3a8a; border-radius: 8px; margin: 20px 0;">
              ${otp}
            </div>
            <p style="font-size: 14px; color: #6b7280;">This code will expire in 15 minutes. If you did not request this, please ignore this email or contact support.</p>
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
            <p style="text-align: center; font-size: 12px; color: #9ca3af;">&copy; ${new Date().getFullYear()} NACOS LASUSTECH Chapter. All rights reserved.</p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      res.json({ status: 'success', message: 'OTP sent successfully to your registered email.' });
    } else {
      res.status(400).json({ message: error || 'Verification failed.' });
    }
  } catch (error) {
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
      new_password
    }, {
      headers: { 'X-API-KEY': API_KEY }
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
      otp
    }, {
      headers: { 'X-API-KEY': API_KEY }
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
      new_password
    }, {
      headers: { 'X-API-KEY': API_KEY }
    });

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ message: 'Error updating password on central system.' });
  }
});

export default router;
