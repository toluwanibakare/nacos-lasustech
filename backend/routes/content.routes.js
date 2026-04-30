import { Router } from 'express';
import db from '../db.js';

const router = Router();

/**
 * Content Routes
 * ---------------------------------------------------------
 * These are public. Everyone can see who the execs are.
 */

// Get Executives
router.get('/executives', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM executives ORDER BY id ASC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching executives.' });
  }
});

// Get Events
router.get('/events', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM events WHERE event_date >= CURDATE() ORDER BY event_date ASC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching events.' });
  }
});

// Get Blogs
router.get('/blogs', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM blogs ORDER BY published_at DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching blogs.' });
  }
});

export default router;
