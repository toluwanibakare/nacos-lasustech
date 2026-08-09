import { Router } from 'express';
import protect from '../middleware/auth.middleware.js';
import axios from 'axios';

const router = Router();
const ID_SYSTEM_API = 'https://nacosid.tmb.it.com/api.php';
const API_KEY = process.env.ID_SYSTEM_API_KEY || 'NACOS_LASUSTECH_SECURE_API_KEY';

/**
 * ID Card Service Route
 * ---------------------------------------------------------
 * Proxying ID card requests to the Central System.
 */
router.post('/id-card/request', protect, async (req, res) => {
  const { 
    passport_url, 
    full_name, 
    matric_number, 
    blood_group, 
    birthday, 
    emergency_contact,
    level 
  } = req.body;

  if (!passport_url || !full_name || !matric_number) {
    return res.status(400).json({ message: 'Missing required fields (Passport, Name, or Matric).' });
  }

  try {
    const params = new URLSearchParams();
    params.append('action', 'id_card_request');
    params.append('api_key', API_KEY);
    params.append('matric_number', matric_number);
    params.append('full_name', full_name);
    params.append('level', level || '100L');
    params.append('passport_url', passport_url);
    params.append('blood_group', blood_group || '');
    params.append('birthday', birthday || '');
    params.append('emergency_contact', emergency_contact || '');

    const response = await axios.post(`${ID_SYSTEM_API}?action=id_card_request`, params.toString(), {
      headers: { 
        'X-API-KEY': API_KEY,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('❌ ID Card Request Error:', error.response?.data || error.message);
    res.status(500).json({ message: 'Error submitting ID card request to Central System.' });
  }
});

/**
 * Fetch ID Card Status from External System
 */
router.get('/id-card/status', protect, async (req, res) => {
  try {
    const response = await axios.get(`${ID_SYSTEM_API}?action=id_card_status&matric=${req.user.matric}`, {
      headers: { 'X-API-KEY': API_KEY }
    });

    res.json(response.data);
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return res.json({ status: 'Not Registered', message: 'No ID request found.' });
    }
    
    console.error('⚠️ External ID Status Fetch Failed:', error.message);
    res.status(500).json({ message: 'Could not fetch ID status from Central System.' });
  }
});

export default router;
