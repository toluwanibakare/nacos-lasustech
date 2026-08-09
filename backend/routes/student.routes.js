import { Router } from 'express';
import axios from 'axios';
import FormData from 'form-data';
import protect from '../middleware/auth.middleware.js';
import upload from '../middleware/upload.middleware.js';
import { getAcademicSettings, getStudentFlagByMatric } from '../services/admin.service.js';

const router = Router();
const ID_SYSTEM_API = 'https://nacosid.tmb.it.com/api.php';
const API_KEY = process.env.ID_SYSTEM_API_KEY || 'NACOS_LASUSTECH_SECURE_API_KEY';

router.get('/dashboard', protect, async (req, res) => {
  try {
    const [response, adminNotice, academicSettings] = await Promise.all([
      axios.get(`${ID_SYSTEM_API}?action=dashboard&matric=${req.user.matric}`, {
        headers: { 'X-API-KEY': API_KEY },
      }),
      getStudentFlagByMatric(req.user.matric),
      getAcademicSettings(),
    ]);

    res.json({
      ...response.data,
      adminNotice,
      academicSettings,
    });
  } catch (error) {
    console.error('Dashboard proxy error:', error.response?.data || error.message);
    res.status(500).json({ message: 'Error fetching dashboard data from Central System.' });
  }
});

router.put('/profile-image', protect, upload.single('image'), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ message: 'No image uploaded!' });
    return;
  }

  try {
    const formData = new FormData();
    formData.append('image', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });
    formData.append('matric_number', req.user.matric);

    const response = await axios.post(`${ID_SYSTEM_API}?action=update_image`, formData, {
      headers: { ...formData.getHeaders(), 'X-API-KEY': API_KEY },
    });

    res.json(response.data);
  } catch (error) {
    console.error('Image sync error:', error.response?.data || error.message);
    res.status(500).json({ message: 'Error syncing image to Central System.' });
  }
});

router.put('/profile', protect, async (req, res) => {
  const { full_name, level, email, whatsapp_number, gender, birthday } = req.body;

  if (!whatsapp_number) {
    res.status(400).json({ message: 'WhatsApp number is compulsory!' });
    return;
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
      api_key: API_KEY,
    };

    const response = await axios.post(`${ID_SYSTEM_API}?action=update_profile`, profileData, {
      headers: {
        'X-API-KEY': API_KEY,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    const isSuccess = response.data.status === 'success' || response.data.id || response.data.matric_no;

    if (isSuccess) {
      res.json(response.data);
      return;
    }

    throw new Error(response.data.message || 'Update failed');
  } catch (error) {
    console.error('Profile proxy error:', error.response?.data || error.message);
    res.status(500).json({
      message: 'Error updating profile on Central System.',
      details: error.response?.data || error.message,
    });
  }
});

router.get('/payments', protect, async (req, res) => {
  try {
    const response = await axios.get(`${ID_SYSTEM_API}?action=payments&matric=${req.user.matric}`, {
      headers: { 'X-API-KEY': API_KEY },
    });
    res.json(response.data || []);
  } catch (error) {
    console.error('Payments fetch error:', error.message);
    res.json([]);
  }
});

export default router;
