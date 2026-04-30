import { Router } from 'express';
import db from '../db.js';
import protect from '../middleware/auth.middleware.js';
import isAdmin from '../middleware/admin.middleware.js';

const router = Router();

// Protect all admin routes
router.use(protect, isAdmin);

/**
 * Admin Management Routes
 * ---------------------------------------------------------
 * Full CRUD for content management.
 */

// --- EXECUTIVES ---
router.post('/executives', async (req, res) => {
  const { name, post, level, image_url, description } = req.body;
  try {
    await db.query('INSERT INTO executives (name, post, level, image_url, description) VALUES (?, ?, ?, ?, ?)', 
      [name, post, level, image_url, description]);
    res.json({ message: 'Executive added successfully!' });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

router.delete('/executives/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM executives WHERE id = ?', [req.params.id]);
    res.json({ message: 'Executive removed!' });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// --- EVENTS ---
router.post('/events', async (req, res) => {
  const { title, description, event_date, location, image_url } = req.body;
  try {
    await db.query('INSERT INTO events (title, description, event_date, location, image_url) VALUES (?, ?, ?, ?, ?)', 
      [title, description, event_date, location, image_url]);
    res.json({ message: 'Event created!' });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// --- BLOGS ---
router.post('/blogs', async (req, res) => {
  const { title, excerpt, content, image_url, category } = req.body;
  try {
    await db.query('INSERT INTO blogs (title, excerpt, content, image_url, category) VALUES (?, ?, ?, ?, ?)', 
      [title, excerpt, content, image_url, category]);
    res.json({ message: 'Blog post published!' });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// --- SYSTEM STATS ---
router.get('/stats', async (req, res) => {
  try {
    const [students] = await db.query('SELECT COUNT(*) as count FROM students');
    const [duesPaid] = await db.query("SELECT COUNT(*) as count FROM students WHERE dues_status = 'Paid'");
    const [totalRevenue] = await db.query('SELECT SUM(amount) as total FROM payments WHERE status = "success"');
    const [pendingIDs] = await db.query("SELECT COUNT(*) as count FROM id_card_requests WHERE status = 'Pending'");

    res.json({
      totalStudents: students[0].count,
      paidStudents: duesPaid[0].count,
      revenue: totalRevenue[0].total || 0,
      pendingIDCards: pendingIDs[0].count
    });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// --- STUDENT MANAGEMENT ---
router.get('/students', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, full_name, matric_number, level, dues_status, id_card_status FROM students');
    res.json(rows);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

router.put('/students/:id/dues', async (req, res) => {
  const { status } = req.body; // 'Paid' or 'Pending'
  try {
    await db.query('UPDATE students SET dues_status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ message: 'Student dues status updated!' });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// --- PAYMENT TRACKING ---
router.get('/payments', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.*, s.full_name, s.matric_number 
      FROM payments p 
      JOIN students s ON p.student_id = s.id 
      ORDER BY p.created_at DESC
    `);
    res.json(rows);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// --- EXISTING CONTENT ROUTES ---
// ... existing post/delete routes for executives, events, blogs ...

export default router;
