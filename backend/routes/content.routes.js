import { Router } from 'express';
import axios from 'axios';

const router = Router();

/**
 * Content Routes via External API
 */

// Get Executives
router.get('/executives', async (req, res) => {
  try {
    const response = await axios.get('https://nacosid.tmb.it.com/api.php?action=executives', {
      headers: { 'X-API-KEY': process.env.ID_SYSTEM_API_KEY || 'NACOS_LASUSTECH_SECURE_API_KEY' }
    });
    res.json(response.data || []);
  } catch (error) {
    console.error('❌ External Executives Fetch Error:', error.message);
    res.json([]);
  }
});

// Get Events
router.get('/events', async (req, res) => {
  try {
    const response = await axios.get('https://nacosid.tmb.it.com/api.php?action=events', {
      headers: { 'X-API-KEY': process.env.ID_SYSTEM_API_KEY || 'NACOS_LASUSTECH_SECURE_API_KEY' }
    });
    res.json(response.data || []);
  } catch (error) {
    console.error('❌ External Events Fetch Error:', error.message);
    res.json([]);
  }
});

// Get Blogs
router.get('/blogs', async (req, res) => {
  try {
    const response = await axios.get('https://nacosid.tmb.it.com/api.php?action=blogs', {
      headers: { 'X-API-KEY': process.env.ID_SYSTEM_API_KEY || 'NACOS_LASUSTECH_SECURE_API_KEY' }
    });
    res.json(response.data || []);
  } catch (error) {
    console.error('❌ External Blogs Fetch Error:', error.message);
    res.json([]);
  }
});

export default router;
