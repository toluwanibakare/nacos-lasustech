import { Router } from 'express';
import PaystackService from '../services/paystack.service.js';
import db from '../db.js';
import protect from '../middleware/auth.middleware.js';

const router = Router();

/**
 * Payment Routes
 * ---------------------------------------------------------
 * Handling the money flow here. 
 */

// Kick off a payment
router.post('/initialize', protect, async (req, res) => {
  const { email, amount } = req.body;

  try {
    const paymentData = await PaystackService.initializeTransaction({
      email,
      amount,
      metadata: { studentId: req.user.id }
    });

    // Save transaction to DB as 'pending'
    await db.query(
      'INSERT INTO payments (student_id, amount, reference, status) VALUES (?, ?, ?, ?)',
      [req.user.id, amount, paymentData.data.reference, 'pending']
    );

    res.json(paymentData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Verify the payment
router.get('/verify/:reference', protect, async (req, res) => {
  const { reference } = req.params;

  try {
    const verificationData = await PaystackService.verifyTransaction(reference);
    
    if (verificationData.data.status === 'success') {
      // 1. Update Payment Status
      await db.query('UPDATE payments SET status = "success" WHERE reference = ?', [reference]);

      // 2. Mark Student as "Paid"
      await db.query('UPDATE students SET dues_status = "Paid" WHERE id = ?', [req.user.id]);
      
      console.log(`✅ Payment success for student ${req.user.id}`);
    }

    res.json(verificationData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


export default router;
