import { Router } from 'express';
import emailService from '../services/email.service.js';
import { centralPost } from '../services/central.service.js';

const router = Router();

const KINDS = ['message', 'suggestion', 'complaint'];

/**
 * Contact form, suggestion box and complaint box
 * ---------------------------------------------------------
 * Stored by the central API (contact_messages). An anonymous submission carries
 * no name and no email, gets no confirmation email, and nothing about the sender
 * is logged here. The route is public: any sign-in token on the request is ignored.
 */
router.post('/submit', async (req, res) => {
  const kind = KINDS.includes(req.body?.kind) ? req.body.kind : 'message';
  const anonymous = req.body?.is_anonymous === true || req.body?.is_anonymous === 'true';
  const message = String(req.body?.message || '').trim();
  const full_name = anonymous ? '' : String(req.body?.full_name || '').trim();
  const email = anonymous ? '' : String(req.body?.email || '').trim();
  const subject = String(req.body?.subject || '').trim().slice(0, 200);

  if (message.length < 5) {
    return res.status(400).json({ message: 'Please write a little more.' });
  }
  if (message.length > 3000) {
    return res.status(400).json({ message: 'Please keep it under 3000 characters.' });
  }
  if (!anonymous && (!full_name || !email)) {
    return res.status(400).json({ message: 'Please fill in all required fields!' });
  }

  try {
    await centralPost('submit_contact', { kind, is_anonymous: anonymous, full_name, email, subject, message });
  } catch (err) {
    // Say so: the sender must know it was not saved (nobody can follow up an anonymous note).
    console.error('Contact store error:', err.response?.data?.message || err.message);
    return res.status(502).json({ message: 'We could not save your message right now. Please try again in a moment.' });
  }

  if (!anonymous) {
    emailService.sendContactConfirmation(email, full_name).catch((err) => console.error('Email Error:', err));
  }
  emailService
    .sendContactNotificationToAdmin({ kind, anonymous, full_name, email, subject, message })
    .catch((err) => console.error('Admin Email Error:', err));

  const thanks = {
    message: 'Your message has been received. We will get back to you soon.',
    suggestion: 'Thank you. Your suggestion has been sent to the executives.',
    complaint: 'Thank you. Your complaint has been sent to the executives.',
  };
  res.json({ status: 'success', message: thanks[kind] });
});

export default router;
