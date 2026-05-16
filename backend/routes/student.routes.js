import { Router } from 'express';
import axios from 'axios';
import protect from '../middleware/auth.middleware.js';
import upload from '../middleware/upload.middleware.js';
import FormData from 'form-data';

const router = Router();
const ID_SYSTEM_API = 'https://nacosid.tmb.it.com/api.php';
const API_KEY = process.env.ID_SYSTEM_API_KEY || 'NACOS_LASUSTECH_SECURE_API_KEY';

/**
 * Student Routes (Pure Proxy Mode)
 * ---------------------------------------------------------
 * These routes communicate directly with the central PHP system.
 */

// Get Dashboard Overview
router.get('/dashboard', protect, async (req, res) => {
  console.log(`📡 Fetching Dashboard for: ${req.user.matric}`);
  try {
    const response = await axios.get(`${ID_SYSTEM_API}?action=dashboard&matric=${req.user.matric}`, {
      headers: { 'X-API-KEY': API_KEY }
    });
    console.log('✅ Dashboard Data Received:', JSON.stringify(response.data).substring(0, 200) + '...');
    res.json(response.data);
  } catch (error) {
    console.error('❌ Dashboard Proxy Error:', error.response?.data || error.message);
    res.status(500).json({ message: 'Error fetching dashboard data from Central System.' });
  }
});

// Update Profile Picture
router.put('/profile-image', protect, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No image uploaded!' });

  console.log(`📡 Uploading Image for: ${req.user.matric}`);
  try {
    const formData = new FormData();
    formData.append('image', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });
    formData.append('matric_number', req.user.matric);

    const response = await axios.post(`${ID_SYSTEM_API}?action=update_image`, formData, {
      headers: { ...formData.getHeaders(), 'X-API-KEY': API_KEY }
    });

    console.log('✅ Image Update Response:', response.data);
    res.json(response.data);
  } catch (error) {
    console.error('❌ Image Sync Error:', error.response?.data || error.message);
    res.status(500).json({ message: 'Error syncing image to Central System.' });
  }
});

// Update Profile
router.put('/profile', protect, async (req, res) => {
  console.log(`📡 Updating Profile (JSON) for: ${req.user.matric}`);
  const { full_name, level, email, whatsapp_number, gender, birthday } = req.body;

  if (!whatsapp_number) {
    return res.status(400).json({ message: 'WhatsApp number is compulsory!' });
  }

  try {
    const profileData = {
      action: 'update_profile',
      matric_number: req.user.matric,
      matric_no: req.user.matric,
      full_name,
      level,
      email,
      whatsapp_number,
      gender,
      birthday: birthday || null,
      api_key: API_KEY
    };

    const response = await axios.post(`${ID_SYSTEM_API}?action=update_profile`, profileData, {
      headers: { 
        'X-API-KEY': API_KEY,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    const isSuccess = response.data.status === 'success' || response.data.id || response.data.matric_no;
    console.log('✅ Profile Update Response:', response.data);

    if (isSuccess) {
      res.json(response.data);
    } else {
      throw new Error(response.data.message || 'Update failed');
    }
  } catch (error) {
    console.error('❌ Profile Proxy Error Details:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data));
    } else {
      console.error('Message:', error.message);
    }
    res.status(500).json({ 
      message: 'Error updating profile on Central System.',
      details: error.response?.data || error.message 
    });
  }
});

// Get Payment History
router.get('/payments', protect, async (req, res) => {
  try {
    const response = await axios.get(`${ID_SYSTEM_API}?action=payments&matric=${req.user.matric}`, {
      headers: { 'X-API-KEY': API_KEY }
    });
    res.json(response.data || []);
  } catch (error) {
    console.error('❌ Payments Fetch Error:', error.message);
    res.json([]); 
  }
});

export default router;
