import { Router } from 'express';
import axios from 'axios';
import protect from '../middleware/auth.middleware.js';
import isAdmin from '../middleware/admin.middleware.js';

const router = Router();
const ID_SYSTEM_API = 'https://nacosid.tmb.it.com/api.php';
const API_KEY = process.env.ID_SYSTEM_API_KEY || 'NACOS_LASUSTECH_SECURE_API_KEY';

// Protect all admin routes
router.use(protect, isAdmin);

/**
 * Admin Management Routes (Proxy Mode)
 * ---------------------------------------------------------
 * These routes manage students and payments via the central system.
 */

// Get System Stats
router.get('/stats', async (req, res) => {
  try {
    const response = await axios.get(`${ID_SYSTEM_API}?action=get_admin_stats`, {
      headers: { 'X-API-KEY': API_KEY }
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching admin stats from central system.' });
  }
});

// Get Student List
router.get('/students', async (req, res) => {
  try {
    const response = await axios.get(`${ID_SYSTEM_API}?action=get_all_students`, {
      headers: { 'X-API-KEY': API_KEY }
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching student list.' });
  }
});

// Manual Dues Update
router.put('/students/:id/dues', async (req, res) => {
  const { status } = req.body;
  try {
    const response = await axios.post(`${ID_SYSTEM_API}?action=update_dues_status`, {
      id: req.params.id,
      status
    }, {
      headers: { 'X-API-KEY': API_KEY }
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ message: 'Error updating dues status.' });
  }
});

// Get All Payments (Global Tracking)
router.get('/payments', async (req, res) => {
  try {
    const response = await axios.get(`${ID_SYSTEM_API}?action=get_all_payments`, {
      headers: { 'X-API-KEY': API_KEY }
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching global payment history.' });
  }
});

// Manage Contact Messages (If handled by central system)
router.get('/messages', async (req, res) => {
  try {
    const response = await axios.get(`${ID_SYSTEM_API}?action=get_messages`, {
      headers: { 'X-API-KEY': API_KEY }
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching contact messages.' });
  }
});

export default router;
