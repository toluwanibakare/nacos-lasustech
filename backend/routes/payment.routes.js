import { Router } from 'express';
import KorapayService from '../services/korapay.service.js';
import protect from '../middleware/auth.middleware.js';
import emailService from '../services/email.service.js';
import { centralGet, centralPost, identityBody, identityParams, sendCentralError } from '../services/central.service.js';

const router = Router();

/**
 * Payment Routes
 * ---------------------------------------------------------
 * Money flow via Korapay, recorded by the central PHP API.
 *  - The amount is always decided here from the admin-set fees. The browser
 *    never supplies it.
 *  - A payment is only marked successful after Korapay itself confirms it.
 */

// Legacy ID replacement fee (kept so the current dashboard button keeps working).
const REPLACEMENT_FEE = 500;

const DISPLAY_TYPE = {
  dues: 'NACOS Session Dues',
  id_card: 'ID Card',
  id_replacement: 'ID Card Replacement',
  hoc_item: 'Course Material',
};

const LEGACY_TYPE = { nacos_dues: 'dues' };

const isKorapaySuccess = (v) =>
  (v?.status === true || v?.status === 'success') && ['success', 'captured'].includes(v?.data?.status);

const referenceFor = (user, type) => {
  const who = user.account_type === 'fresher' ? `F${user.id}` : String(user.matric).replace(/[^A-Za-z0-9]/g, '');
  return `NACOS-${type.toUpperCase()}-${who}-${Date.now()}`;
};

// Kick off a donation (Public - no protect middleware)
router.post('/donate', async (req, res) => {
  const { email, amount, full_name } = req.body;

  try {
    const reference = `DONATE-${Date.now()}`;
    const paymentData = await KorapayService.initializeTransaction({
      email,
      amount,
      reference,
      full_name: full_name || 'Anonymous Donor',
      metadata: { type: 'donation' }
    });

    res.json(paymentData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Kick off a payment
router.post('/initialize', protect, async (req, res) => {
  const type = LEGACY_TYPE[req.body.payment_type] || req.body.payment_type;
  if (!['dues', 'id_card', 'id_replacement', 'hoc_item'].includes(type)) {
    res.status(400).json({ message: 'Unsupported payment type.' });
    return;
  }

  try {
    const [fees, payments] = await Promise.all([centralGet('get_fees'), centralGet('payments', identityParams(req.user))]);

    let amount;
    let hocItemId = null;
    if (type === 'dues') {
      if (req.user.account_type !== 'fresher') {
        const me = await centralGet('hoc_profile', { matric: req.user.matric });
        if (me.dues_exempt) {
          res.status(409).json({ message: 'Executives, the HOC and the Assistant HOC do not pay dues.' });
          return;
        }
      }
      amount = Number(fees.dues);
      const paid = payments.some((p) => p.payment_type === 'dues' && p.status === 'success' && p.session === fees.session);
      if (paid) {
        res.status(409).json({ message: `Your dues for ${fees.session} are already paid.` });
        return;
      }
    } else if (type === 'id_card') {
      amount = Number(req.user.account_type === 'fresher' ? fees.id_card_fresher : fees.id_card_stalite);
      const idStatus = await centralGet('id_card_status', identityParams(req.user));
      if (!idStatus.request) {
        res.status(409).json({ message: 'Complete your ID card application first.' });
        return;
      }
      if (idStatus.request.status !== 'awaiting_payment') {
        res.status(409).json({ message: 'Your ID card fee is already paid.' });
        return;
      }
    } else if (type === 'hoc_item') {
      const item = await centralGet('hoc_item_get', { id: req.body.hoc_item_id });
      if (item.status !== 'active') {
        res.status(409).json({ message: 'This item is no longer available.' });
        return;
      }
      if (!(Number(item.price) > 0)) {
        res.status(400).json({ message: 'This material is free. Download it from your Course Materials.' });
        return;
      }
      // Freshers are 100L; students' level and department come from the database, not the token.
      let level = '100';
      let department = null;
      if (req.user.account_type === 'fresher') {
        department = (await centralGet('fresher_profile', { fresher_id: req.user.id })).profile.department;
      } else {
        const me = await centralGet('hoc_profile', { matric: req.user.matric });
        level = me.level;
        department = me.department;
      }
      if (item.level !== level || (item.department && item.department !== department)) {
        res.status(403).json({ message: 'This item is not for your class.' });
        return;
      }
      if (payments.some((p) => p.hoc_item_id === item.id && p.status === 'success')) {
        res.status(409).json({ message: 'You have already paid for this item.' });
        return;
      }
      amount = item.price;
      hocItemId = item.id;
    } else {
      amount = REPLACEMENT_FEE;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      res.status(500).json({ message: 'Fee is not configured. Please contact the admin.' });
      return;
    }

    const reference = referenceFor(req.user, type);
    const email = req.user.email || req.body.email || `${req.user.matric}@lasustech.edu.ng`;

    // Record the pending payment first; if that fails, nothing is charged.
    await centralPost('log_payment_pending', { ...identityBody(req.user), amount, reference, payment_type: type, hoc_item_id: hocItemId });

    const paymentData = await KorapayService.initializeTransaction({
      email,
      amount,
      reference,
      full_name: req.user.name,
      metadata: { account_type: req.user.account_type || 'student', userId: req.user.id, matric: req.user.matric, type },
    });

    res.json({
      ...paymentData,
      data: { ...paymentData.data, authorization_url: paymentData.data.checkout_url },
    });
  } catch (error) {
    if (error.response) {
      sendCentralError(res, error, 'Could not start the payment.');
      return;
    }
    res.status(500).json({ message: error.message });
  }
});

/**
 * Confirms with Korapay, then records success centrally. Safe to call twice:
 * the central API ignores a payment that is already marked successful, and
 * receipts are only emailed the first time.
 */
const confirmAndRecord = async (reference, notify) => {
  const verification = await KorapayService.verifyTransaction(reference);
  if (!isKorapaySuccess(verification)) return { verification, recorded: false };

  const result = await centralPost('log_payment_success', { reference, amount: verification.data.amount });
  if (!result.already) await notify(verification.data);
  return { verification, recorded: true };
};

// Verify the payment
router.get('/verify/:reference', protect, async (req, res) => {
  const { reference } = req.params;

  try {
    const payments = await centralGet('payments', identityParams(req.user));
    const mine = payments.find((p) => p.reference === reference);
    if (!mine) {
      res.status(404).json({ message: 'Payment not found.' });
      return;
    }

    const { verification } = await confirmAndRecord(reference, async (data) => {
      const displayType = DISPLAY_TYPE[mine.payment_type] || 'NACOS Payment';
      if (req.user.email) {
        emailService.sendPaymentReceipt(req.user.email, req.user.name, {
          amount: data.amount,
          reference,
          type: displayType,
        }).catch((err) => console.error('Receipt Error:', err));
      }
      emailService.sendPaymentNotificationToAdmin(
        { amount: data.amount, reference, type: displayType },
        { full_name: req.user.name, matric_number: req.user.matric || `Fresher #${req.user.id}` },
      ).catch((err) => console.error('Admin Payment Notification Error:', err));
    });

    res.json(verification);
  } catch (error) {
    if (error.response) {
      sendCentralError(res, error, 'Could not record the payment.');
      return;
    }
    res.status(500).json({ message: error.message });
  }
});

// Korapay Webhook
// The request body is NOT trusted: we re-check the transaction with Korapay
// ourselves, so a forged webhook cannot mark anything as paid.
router.post('/webhook', async (req, res) => {
  const { event, data } = req.body || {};

  // Only our own payments (NACOS-...). Donations have no account to credit, and a
  // different product sharing this Korapay account must never be recorded here.
  if (event === 'charge.success' && String(data?.reference || '').startsWith('NACOS-')) {
    try {
      await confirmAndRecord(data.reference, async (verified) => {
        const customer = verified.customer || data.customer || {};
        const displayType = DISPLAY_TYPE[verified.metadata?.type || data.metadata?.type] || 'NACOS Payment';
        if (customer.email) {
          emailService.sendPaymentReceipt(customer.email, customer.name || 'Student', {
            amount: verified.amount,
            reference: data.reference,
            type: displayType,
          }).catch((err) => console.error('Webhook Receipt Error:', err));
        }
        emailService.sendPaymentNotificationToAdmin(
          { amount: verified.amount, reference: data.reference, type: displayType },
          { full_name: customer.name || 'Student', matric_number: verified.metadata?.matric || data.metadata?.matric || 'Unknown' },
        ).catch((err) => console.error('Webhook Admin Notification Error:', err));
      });
      console.log(`✅ Webhook processed: ${data.reference}`);
    } catch (error) {
      console.error('❌ Webhook Error:', error.message);
    }
  }

  res.status(200).send('Webhook Received');
});

export default router;
