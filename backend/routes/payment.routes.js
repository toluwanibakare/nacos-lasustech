import { Router } from 'express';
import axios from 'axios';
import KorapayService from '../services/korapay.service.js';
import protect from '../middleware/auth.middleware.js';
import emailService from '../services/email.service.js';

const router = Router();
const ID_SYSTEM_API = 'https://nacosid.tmb.it.com/api.php';
const API_KEY = process.env.ID_SYSTEM_API_KEY || 'NACOS_LASUSTECH_SECURE_API_KEY';

/**
 * Payment Routes (Proxy Mode)
 * ---------------------------------------------------------
 * Handling the money flow via Korapay and syncing to Central System. 
 */

// Kick off a payment
router.post('/initialize', protect, async (req, res) => {
  const { email, amount, payment_type } = req.body;

  try {
    const reference = `NACOS-${req.user.matric}-${Date.now()}`;
    const paymentData = await KorapayService.initializeTransaction({
      email,
      amount,
      reference,
      full_name: req.user.name,
      metadata: { studentId: req.user.id, matric: req.user.matric, type: payment_type || 'dues' }
    });

    // Notify central system of pending payment
    try {
      await axios.post(`${ID_SYSTEM_API}?action=log_payment_pending`, {
        matric_number: req.user.matric,
        amount,
        reference,
        payment_type: payment_type || 'dues'
      }, {
        headers: { 'X-API-KEY': API_KEY }
      });
    } catch (apiErr) {
      console.warn('⚠️ Could not log pending payment to central system:', apiErr.message);
    }

    // Map Korapay response
    const formattedData = {
      ...paymentData,
      data: {
        ...paymentData.data,
        authorization_url: paymentData.data.checkout_url
      }
    };

    res.json(formattedData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Verify the payment
router.get('/verify/:reference', protect, async (req, res) => {
  const { reference } = req.params;

  try {
    const verificationData = await KorapayService.verifyTransaction(reference);
    
    if (verificationData.status === 'success' && (verificationData.data.status === 'success' || verificationData.data.status === 'captured')) {
      // Sync Success to Central System
      try {
        await axios.post(`${ID_SYSTEM_API}?action=log_payment_success`, {
          matric_number: req.user.matric,
          reference,
          amount: verificationData.data.amount
        }, {
          headers: { 'X-API-KEY': API_KEY }
        });
      } catch (apiErr) {
        console.error('❌ Failed to sync payment success to central system:', apiErr.message);
      }

      // Send Emails
      const displayType = verificationData.data.metadata?.type === 'id_replacement' ? 'ID Card Replacement' : 'NACOS Session Dues';
      
      emailService.sendPaymentReceipt(req.user.email, req.user.name, {
        amount: verificationData.data.amount,
        reference: reference,
        type: displayType,
      }).catch(err => console.error('Receipt Error:', err));

      emailService.sendPaymentNotificationToAdmin({
        amount: verificationData.data.amount,
        reference: reference,
        type: displayType,
      }, {
        full_name: req.user.name,
        matric_number: req.user.matric
      }).catch(err => console.error('Admin Payment Notification Error:', err));

      console.log(`✅ Payment success synced for student ${req.user.matric}`);
    }

    res.json(verificationData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Korapay Webhook
router.post('/webhook', async (req, res) => {
  const { event, data } = req.body;
  
  if (event === 'charge.success') {
    const reference = data.reference;
    const matric = data.metadata?.matric;
    
    try {
      // Sync to Central System
      await axios.post(`${ID_SYSTEM_API}?action=log_payment_success`, {
        matric_number: matric,
        reference,
        amount: data.amount,
        is_webhook: true
      }, {
        headers: { 'X-API-KEY': API_KEY }
      });

      // Send Emails
      const [email, name] = [data.customer?.email, data.customer?.name];
      const displayType = data.metadata?.type === 'id_replacement' ? 'ID Card Replacement' : 'NACOS Session Dues';

      if (email) {
        emailService.sendPaymentReceipt(email, name || 'Student', {
          amount: data.amount,
          reference: reference,
          type: displayType,
        }).catch(err => console.error('Webhook Receipt Error:', err));
      }

      emailService.sendPaymentNotificationToAdmin({
        amount: data.amount,
        reference: reference,
        type: displayType,
      }, {
        full_name: name || 'Student',
        matric_number: matric || 'Unknown'
      }).catch(err => console.error('Webhook Admin Notification Error:', err));

      console.log(`✅ Webhook: Payment success synced for ${matric}`);
    } catch (error) {
      console.error('❌ Webhook Sync Error:', error.message);
    }
  }

  res.status(200).send('Webhook Received');
});

export default router;
