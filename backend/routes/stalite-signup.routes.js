import { Router } from 'express';
import jwt from 'jsonwebtoken';
import FormData from 'form-data';
import upload from '../middleware/upload.middleware.js';
import { centralForm, sendCentralError } from '../services/central.service.js';

const router = Router();

/**
 * Stalite registration
 * ---------------------------------------------------------
 * A student with no record registers for the ID card: details and photo, then they pay.
 * Only what is on the card is asked (name, matric number, level, department, photo); there is no email
 * code and no password (the default password applies until they update their profile). The PHP API creates the account as "pending payment" and
 * activates it when the ID card fee is paid; until then they cannot sign in. Registering
 * returns a short registration token that can only be used to pay the ID card fee.
 */

const FIELDS = ['full_name', 'matric_number', 'level', 'department', 'photo_zoom', 'photo_cx', 'photo_cy'];

router.post('/register', upload.single('image'), async (req, res) => {
  try {
    const form = new FormData();
    FIELDS.forEach((key) => {
      if (req.body[key] !== undefined && req.body[key] !== null) form.append(key, String(req.body[key]));
    });
    if (req.file) {
      form.append('image', req.file.buffer, { filename: req.file.originalname, contentType: req.file.mimetype });
    }
    const student = await centralForm('stalite_register', form);
    const token = jwt.sign(
      { id: student.id, account_type: 'student', matric: student.matric_no, name: student.full_name, scope: 'signup' },
      process.env.JWT_SECRET || 'nacos_secret_2025',
      { expiresIn: '3h' },
    );
    res.json({ status: 'success', token, matric: student.matric_no });
  } catch (error) {
    console.error('Stalite register error:', error.response?.data?.message || error.message);
    sendCentralError(res, error, 'Could not save your registration.');
  }
});

export default router;
