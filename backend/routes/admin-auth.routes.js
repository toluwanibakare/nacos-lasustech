import { Router } from 'express';
import jwt from 'jsonwebtoken';

const router = Router();

const getAdminConfig = () => ({
  username: process.env.ADMIN_USERNAME || 'admin',
  password: process.env.ADMIN_PASSWORD || 'admin123',
  displayName: process.env.ADMIN_DISPLAY_NAME || 'NACOS Admin',
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const admin = getAdminConfig();

  if (!username || !password) {
    res.status(400).json({ message: 'Username and password are required.' });
    return;
  }

  if (username !== admin.username || password !== admin.password) {
    res.status(401).json({ message: 'Invalid admin credentials.' });
    return;
  }

  const token = jwt.sign(
    {
      id: 'admin-console',
      name: admin.displayName,
      username: admin.username,
      role: 'admin',
    },
    process.env.JWT_SECRET || 'nacos_secret_2025',
    { expiresIn: '12h' },
  );

  res.json({
    status: 'success',
    token,
    user: {
      id: 'admin-console',
      name: admin.displayName,
      username: admin.username,
      role: 'admin',
    },
  });
});

export default router;
