import { Router } from 'express';
import jwt from 'jsonwebtoken';
import protect from '../middleware/auth.middleware.js';
import emailService from '../services/email.service.js';
import { centralGet, centralPost, identityParams, sendCentralError } from '../services/central.service.js';

const router = Router();

/**
 * Fresher Routes
 * ---------------------------------------------------------
 * New 100L students have no matric number yet. They register with name, email
 * and password, verify the email with a code, and then sign in here. The PHP
 * API owns the accounts; Node only emails the codes and issues the token.
 */

const sendCode = async (res, data, fallbackMessage) => {
  // The PHP API returns the OTP to us so we can email it; it never goes to the browser.
  if (data?.status === 'success' && data.otp) {
    try {
      await emailService.sendVerificationCode(data.email, data.full_name || 'there', data.otp);
    } catch (mailError) {
      console.error('Verification email error:', mailError.message);
      res.status(500).json({ message: 'Could not send the verification email. Please use "Resend code".' });
      return;
    }
  }
  res.json({ status: 'success', message: fallbackMessage });
};

router.post('/register', async (req, res) => {
  const { full_name, email, password, department } = req.body;
  try {
    const data = await centralPost('fresher_register', { full_name, email, password, department });
    await sendCode(res, data, 'We sent a verification code to your email.');
  } catch (error) {
    sendCentralError(res, error, 'Could not create your account.');
  }
});

router.post('/resend', async (req, res) => {
  try {
    const data = await centralPost('fresher_resend', { email: req.body.email });
    await sendCode(res, data, 'We sent a new verification code to your email.');
  } catch (error) {
    sendCentralError(res, error, 'Could not resend the code.');
  }
});

router.post('/verify', async (req, res) => {
  try {
    const data = await centralPost('fresher_verify', { email: req.body.email, otp: req.body.otp });
    res.json(data);
  } catch (error) {
    sendCentralError(res, error, 'Invalid or expired code.');
  }
});

router.post('/login', async (req, res) => {
  try {
    const fresher = await centralPost('fresher_login', { email: req.body.email, password: req.body.password });

    const token = jwt.sign(
      { id: fresher.id, account_type: 'fresher', name: fresher.full_name, email: fresher.email, role: 'fresher' },
      process.env.JWT_SECRET || 'nacos_secret_2025',
      { expiresIn: '30d' },
    );

    res.json({
      status: 'success',
      token,
      user: {
        id: fresher.id,
        name: fresher.full_name,
        email: fresher.email,
        department: fresher.department,
        profile_image: fresher.image_path,
        account_type: 'fresher',
        level: '100',
        role: 'fresher',
        post: 'Fresher',
      },
    });
  } catch (error) {
    sendCentralError(res, error, 'Invalid email or password.');
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const data = await centralPost('fresher_forgot', { email: req.body.email });
    if (data?.otp) {
      emailService.sendOtp(data.email, data.full_name || 'there', data.otp).catch((err) => console.error('Reset email error:', err.message));
    }
    // Same answer whether or not the account exists.
    res.json({ status: 'success', message: 'If that email has an account, a reset code is on its way.' });
  } catch (error) {
    sendCentralError(res, error, 'Could not process the request.');
  }
});

router.post('/reset-password', async (req, res) => {
  const { email, otp, new_password } = req.body;
  try {
    res.json(await centralPost('fresher_reset', { email, otp, new_password }));
  } catch (error) {
    sendCentralError(res, error, 'Invalid or expired code.');
  }
});

/** Everything the fresher dashboard needs in one call. */
router.get('/me', protect, async (req, res) => {
  if (req.user.account_type !== 'fresher') {
    res.status(403).json({ message: 'Fresher accounts only.' });
    return;
  }
  try {
    const [profile, fees, payments, idCard] = await Promise.all([
      centralGet('fresher_profile', { fresher_id: req.user.id }),
      centralGet('get_fees'),
      centralGet('payments', identityParams(req.user)),
      centralGet('id_card_status', identityParams(req.user)),
    ]);
    res.json({ ...profile, fees, payments, idCard });
  } catch (error) {
    sendCentralError(res, error, 'Could not load your account.');
  }
});

export default router;
