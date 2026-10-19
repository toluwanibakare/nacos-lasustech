import { Router } from 'express';
import crypto from 'node:crypto';
import { ipBackstop } from '../middleware/rate-limits.js';
import KorapayService from '../services/korapay.service.js';
import protect, { protectOrSignup } from '../middleware/auth.middleware.js';
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
  bundle: 'Session Dues and ID Card',
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
router.post('/initialize', protectOrSignup, async (req, res) => {
  const type = LEGACY_TYPE[req.body.payment_type] || req.body.payment_type;
  const signup = req.user.scope === 'signup';
  if (signup && !['id_card', 'bundle'].includes(type)) {
    res.status(403).json({ message: 'Pay your ID card fee to finish registering.' });
    return;
  }
  if (!['dues', 'id_card', 'id_replacement', 'hoc_item', 'bundle'].includes(type)) {
    res.status(400).json({ message: 'Unsupported payment type.' });
    return;
  }

  try {
    const [fees, payments] = await Promise.all([centralGet('get_fees'), centralGet('payments', identityParams(req.user))]);

    let amount;
    let hocItemId = null;
    let bundle = null;
    if (type === 'bundle') {
      // Dues and the ID card fee in one charge (still recorded as two payments).
      if (req.user.account_type !== 'fresher') {
        const me = await centralGet('hoc_profile', { matric: req.user.matric });
        if (me.dues_exempt) {
          res.status(409).json({ message: 'You do not pay dues. Pay only your ID card fee.' });
          return;
        }
      }
      if (payments.some((p) => p.payment_type === 'dues' && p.status === 'success' && p.session === fees.session)) {
        res.status(409).json({ message: `Your dues for ${fees.session} are already paid. Pay only your ID card fee.` });
        return;
      }
      const idStatus = await centralGet('id_card_status', identityParams(req.user));
      if (!idStatus.request) {
        res.status(409).json({ message: 'Complete your ID card application first.' });
        return;
      }
      if (idStatus.request.status !== 'awaiting_payment') {
        res.status(409).json({ message: 'Your ID card fee is already paid. Pay only your dues.' });
        return;
      }
      const duesAmount = Number(fees.dues);
      const cardAmount = Number(req.user.account_type === 'fresher' ? fees.id_card_fresher : fees.id_card_stalite);
      if (!(duesAmount > 0) || !(cardAmount > 0)) {
        res.status(500).json({ message: 'Fee is not configured. Please contact the admin.' });
        return;
      }
      bundle = { dues_amount: duesAmount, id_card_amount: cardAmount };
      amount = duesAmount + cardAmount;
    } else if (type === 'dues') {
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
    await centralPost('log_payment_pending', { ...identityBody(req.user), amount, reference, payment_type: type, hoc_item_id: hocItemId, ...bundle });

    const paymentData = await KorapayService.initializeTransaction({
      email,
      amount,
      reference,
      full_name: req.user.name,
      redirectPath: signup ? '/register-id-card' : undefined,
      metadata: { account_type: req.user.account_type || 'student', userId: req.user.id, matric: req.user.matric, type, email_on_file: !!req.user.email },
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
router.get('/verify/:reference', protectOrSignup, async (req, res) => {
  const { reference } = req.params;

  try {
    const payments = await centralGet('payments', identityParams(req.user));
    const rows = payments.filter((p) => p.reference === reference || p.charge_reference === reference);
    const mine = rows.length > 1 ? { ...rows[0], payment_type: 'bundle' } : rows[0];
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
        // No receipt email when the member has no email on file (Korapay was given a placeholder address).
        if (customer.email && (verified.metadata?.email_on_file ?? data.metadata?.email_on_file) !== false) {
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

/**
 * Receipts
 * ---------------------------------------------------------
 * Dues and the ID card go together: a dues or ID card receipt is only released once BOTH are
 * cleared (dues paid or exempt, ID card paid). Someone who has paid dues cannot print the dues
 * receipt until their ID card is paid too. Other payments (course materials) are free of this.
 */
const TIED_TYPES = ['dues', 'id_card'];

const clearanceFor = async (user) => {
  const idStatus = await centralGet('id_card_status', identityParams(user));
  const hasApplication = !!idStatus.request;
  const duesCleared = !!idStatus.dues_cleared;
  const idCleared = hasApplication && idStatus.request.status !== 'awaiting_payment';
  return { tied: true, hasApplication, duesCleared, idCleared, duesExempt: !!idStatus.dues_exempt };
};

const lockedReason = (c) => {
  if (c.duesCleared && c.idCleared) return null;
  if (!c.duesCleared && !c.idCleared) return 'Pay your dues and your ID card fee to unlock this receipt.';
  if (c.duesCleared) {
    return c.hasApplication
      ? 'Pay your ID card fee to unlock this receipt.'
      : 'Apply for your ID card and pay the fee in the ID Card tab to unlock this receipt.';
  }
  return 'Pay your dues to unlock this receipt.';
};

router.get('/receipt-status', protect, async (req, res) => {
  try {
    const c = await clearanceFor(req.user);
    res.json({ ...c, locked_reason: lockedReason(c) });
  } catch (error) {
    sendCentralError(res, error, 'Could not check your receipts.');
  }
});

/**
 * Receipt codes (the QR on the PDF). A code names the payments the receipt covers and carries a
 * signature, so a code cannot be guessed or edited: R<id>-<id>-<signature>.
 */
const receiptSecret = () => `receipt:${process.env.JWT_SECRET || 'nacos_secret_2025'}`;
const signIds = (ids) => crypto.createHmac('sha256', receiptSecret()).update(ids.join(',')).digest('hex').slice(0, 10).toUpperCase();
const makeReceiptCode = (ids) => `R${ids.join('-')}-${signIds(ids)}`;
const parseReceiptCode = (code) => {
  const m = /^R(\d+(?:-\d+){0,5})-([A-F0-9]{10})$/.exec(String(code || '').toUpperCase());
  if (!m) return null;
  const ids = m[1].split('-').map(Number);
  const expected = Buffer.from(signIds(ids));
  const given = Buffer.from(m[2]);
  return expected.length === given.length && crypto.timingSafeEqual(expected, given) ? ids : null;
};
const maskMatric = (m) => (m && m.length > 6 ? `${m.slice(0, 4)}${'*'.repeat(m.length - 6)}${m.slice(-2)}` : m || null);
const itemOf = (p) => ({ label: DISPLAY_TYPE[p.payment_type] || 'NACOS Payment', amount: Number(p.amount) });

router.get('/receipt/:reference', protect, async (req, res) => {
  try {
    const [payments, c, fees] = await Promise.all([centralGet('payments', identityParams(req.user)), clearanceFor(req.user), centralGet('get_fees')]);
    const payment = payments.find((p) => p.reference === req.params.reference || p.charge_reference === req.params.reference);
    if (!payment) {
      res.status(404).json({ message: 'Payment not found.' });
      return;
    }
    if (payment.status !== 'success') {
      res.status(409).json({ message: 'This payment was not completed, so there is no receipt.' });
      return;
    }

    let rows;
    if (TIED_TYPES.includes(payment.payment_type)) {
      const reason = lockedReason(c);
      if (reason) {
        res.status(403).json({ message: reason, locked: true });
        return;
      }
      // Dues and the ID card are one receipt: a single document covers both.
      const ok = (p) => p.status === 'success';
      const dues = payments.find((p) => ok(p) && p.payment_type === 'dues' && p.session === (payment.payment_type === 'dues' ? payment.session : fees.session));
      const card = payments.find((p) => ok(p) && p.payment_type === 'id_card');
      rows = [dues, card].filter(Boolean);
      if (!rows.length) rows = [payment];
    } else {
      rows = payments.filter((p) => p.status === 'success' && p.charge_reference === payment.charge_reference);
    }

    const ids = rows.map((p) => Number(p.id)).sort((a, b) => a - b);
    const code = makeReceiptCode(ids);
    const portal = (process.env.FRONTEND_URL || 'https://www.nacoslasustech.org.ng').replace(/\/$/, '');
    const items = rows.map(itemOf);
    res.json({
      receipt_no: `NACOS-R-${ids.join('-')}`,
      code,
      verify_url: `${portal}/verify/${code}`,
      references: [...new Set(rows.map((p) => p.charge_reference || p.reference))],
      date: rows.map((p) => p.created_at).filter(Boolean).sort().pop() || null,
      session: payment.session,
      name: req.user.name,
      matric: req.user.account_type === 'fresher' ? null : req.user.matric,
      account_type: req.user.account_type || 'student',
      exempt_from_dues: c.duesExempt && !rows.some((p) => p.payment_type === 'dues'),
      items,
      total: items.reduce((sum, i) => sum + i.amount, 0),
    });
  } catch (error) {
    sendCentralError(res, error, 'Could not load the receipt.');
  }
});

/** Public: what a receipt QR code opens. Confirms the receipt is genuine and shows what it covers. */
router.get('/verify-receipt/:code', ipBackstop(60), async (req, res) => {
  const ids = parseReceiptCode(req.params.code);
  if (!ids) {
    res.json({ valid: false, message: 'This receipt code is not valid. It may have been altered or mistyped.' });
    return;
  }
  try {
    const rows = await centralGet('receipt_lookup', { ids: ids.join(',') });
    const samePerson = rows.length > 0 && rows.every((r) => String(r.student_id) === String(rows[0].student_id) && String(r.fresher_id) === String(rows[0].fresher_id));
    if (rows.length !== ids.length || !samePerson || rows.some((r) => r.status !== 'success')) {
      res.json({ valid: false, message: 'No matching completed payment was found for this receipt.' });
      return;
    }
    const items = rows.map(itemOf);
    res.json({
      valid: true,
      receipt_no: `NACOS-R-${ids.join('-')}`,
      name: rows[0].full_name,
      matric: maskMatric(rows[0].matric_no),
      account_type: rows[0].account_type,
      session: rows[0].session,
      date: rows.map((r) => r.created_at).filter(Boolean).sort().pop() || null,
      items,
      total: items.reduce((sum, i) => sum + i.amount, 0),
    });
  } catch (error) {
    res.status(502).json({ valid: false, message: 'We could not check this receipt right now. Please try again.' });
  }
});

export default router;
