import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import db from '../db.js';

const router = Router();

/**
 * Auth Routes
 * ---------------------------------------------------------
 * Handling logins and registration. 
 * Senior dev note: We use JWTs for stateless auth. 
 */

// Login Route
router.post('/login', async (req, res) => {
  const { matric_number, password } = req.body;

  if (!matric_number || !password) {
    return res.status(400).json({ message: 'Matric number and password please!' });
  }

  try {
    console.log('🔍 Attempting login for matric:', matric_number);
    
    // 1. Find user in DB
    const [rows] = await db.query('SELECT * FROM students WHERE matric_number = ?', [matric_number]);
    console.log('📊 DB Result rows count:', rows.length);
    
    const user = rows[0];

    if (!user) {
      console.log('⚠️ User not found in DB');
      return res.status(401).json({ message: 'Invalid credentials. Double check that matric number!' });
    }

    // 2. Check password
    console.log('🔑 Checking password hash...');
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('❌ Password mismatch');
      return res.status(401).json({ message: 'Invalid credentials. Wrong password, buddy.' });
    }

    // 3. Generate JWT
    console.log('🎟️ Generating token...');
    const token = jwt.sign(
      { id: user.id, matric: user.matric_number, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    console.log('✅ Login successful for:', user.full_name);
    res.json({
      status: 'success',
      token,
      user: {
        id: user.id,
        name: user.full_name,
        matric_number: user.matric_number,
        level: user.level,
        role: user.role
      }
    });
  } catch (error) {
    console.error('🔥 CRITICAL LOGIN ERROR:', error.message);
    res.status(500).json({ message: 'Server error during login: ' + error.message });
  }
});


export default router;
