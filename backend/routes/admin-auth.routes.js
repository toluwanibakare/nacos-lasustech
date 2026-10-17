import { Router } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { centralGet, centralPost } from '../services/central.service.js';
import { ADMIN_PAGES } from '../middleware/admin-permissions.middleware.js';

const router = Router();

// No fallback credentials: if these are not set in the environment, admin login is disabled.
const getAdminConfig = () => ({
  username: process.env.ADMIN_USERNAME,
  password: process.env.ADMIN_PASSWORD,
  displayName: process.env.ADMIN_DISPLAY_NAME || 'NACOS Admin',
});

const safeEqual = (a, b) => {
  const left = crypto.createHash('sha256').update(String(a)).digest();
  const right = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(left, right);
};

const sign = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET || 'nacos_secret_2025', { expiresIn: '12h' });

/**
 * Admin sign-in.
 *  - Super admin: the username and password set in the backend environment.
 *  - Sub-admin: a student the super admin has given admin access to. They sign
 *    in with their matric number and their own portal password, and can only
 *    use the pages they were given.
 */
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const admin = getAdminConfig();

  if (!admin.username || !admin.password) {
    res.status(503).json({ message: 'Admin login is not configured on this server.' });
    return;
  }

  if (!username || !password) {
    res.status(400).json({ message: 'Username and password are required.' });
    return;
  }

  // ── Super admin ────────────────────────────────────────────────────────────
  if (safeEqual(username, admin.username)) {
    if (!safeEqual(password, admin.password)) {
      res.status(401).json({ message: 'Invalid admin credentials.' });
      return;
    }
    const user = {
      id: 'admin-console',
      name: admin.displayName,
      username: admin.username,
      role: 'admin',
      super: true,
      permissions: ADMIN_PAGES,
    };
    res.json({
      status: 'success',
      token: sign({ id: user.id, name: user.name, username: user.username, role: 'admin', admin_kind: 'super' }),
      user,
    });
    return;
  }

  // ── Sub-admin (a student with admin access) ───────────────────────────────
  try {
    const student = await centralPost('login', { matric_number: String(username).trim(), password });

    if (!student.has_password) {
      res.status(403).json({
        message: 'Set your own portal password first (use "Forgot password" on the member login), then sign in here again.',
      });
      return;
    }

    const access = await centralGet('admin_access_get', { matric: student.matric_no });
    if (!access.permissions?.length) {
      res.status(403).json({ message: 'You do not have admin access.' });
      return;
    }

    const user = {
      id: `sub-admin-${student.id}`,
      name: student.full_name,
      username: student.matric_no,
      role: 'admin',
      super: false,
      permissions: access.permissions,
    };
    res.json({
      status: 'success',
      token: sign({ id: user.id, name: user.name, username: user.username, matric: student.matric_no, role: 'admin', admin_kind: 'sub' }),
      user,
    });
  } catch (error) {
    if (error.response?.status === 403) {
      res.status(403).json({ message: error.response.data?.message || 'You do not have admin access.' });
      return;
    }
    if (error.response) {
      res.status(401).json({ message: 'Invalid admin credentials.' });
      return;
    }
    res.status(502).json({ message: 'Could not reach the central system. Try again.' });
  }
});

export default router;
