import { Router } from 'express';
import FormData from 'form-data';
import protect from '../middleware/auth.middleware.js';
import isHoc from '../middleware/hoc.middleware.js';
import materialUpload from '../middleware/materials-upload.middleware.js';
import { centralForm, centralGet, centralPost, centralPublicUrl, identityParams, sendCentralError } from '../services/central.service.js';
import { createCampaign, sendCampaignBatch, startCampaignInBackground } from '../services/campaign.service.js';

const router = Router();

/**
 * HOC Routes
 * ---------------------------------------------------------
 * An HOC / Assistant HOC manages course materials for their OWN level and department only.
 *  - Free library files: notes, PDF, past questions. A file is uploaded and everyone in the class can download it.
 *  - Paid items: manual, workbook, textbook. No file; students pay on the portal, then collect it from the HOC,
 *    who marks each payment as received.
 * New materials are announced to the class by email, sent by the server in the background.
 */

const FREE_KINDS = ['notes', 'pdf', 'past_questions'];
const PAID_KINDS = ['manual', 'workbook', 'textbook'];
const KIND_LABEL = {
  notes: 'Notes', pdf: 'PDF', past_questions: 'Past questions',
  manual: 'Manual', workbook: 'Workbook', textbook: 'Textbook',
};

const handle = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (error) {
    if (error.response) {
      sendCentralError(res, error, 'Request failed.');
      return;
    }
    console.error('HOC route error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

const naira = (value) => `₦${Number(value).toLocaleString()}`;

/** Items leave the server with a ready-to-open link instead of an internal file path. */
const withFileUrl = (item) => {
  const { file_path: filePath, ...rest } = item;
  return { ...rest, file_url: filePath ? `${centralPublicUrl()}/${filePath}` : null };
};

// ── Any signed-in member (student or fresher): materials for my own level and department ──
router.get('/my-items', protect, handle(async (req, res) => {
  let level = '100';
  if (req.user.account_type !== 'fresher') {
    level = (await centralGet('hoc_profile', { matric: req.user.matric })).level;
  }
  if (!['100', '200', '300', '400'].includes(level)) {
    res.json([]);
    return;
  }
  const items = await centralGet('hoc_items_list', { level, ...identityParams(req.user) });
  res.json(items.map(withFileUrl));
}));

// ── HOC only ─────────────────────────────────────────────────────────────────
router.use(protect, isHoc);

router.get('/me', (req, res) => res.json(req.hoc));

// An HOC works only on their own level and their own department. Both come from their record in
// the database, never from the request, so nothing the browser sends can change them.
router.get('/items', handle(async (req, res) => {
  const items = await centralGet('hoc_items_list', {
    level: req.hoc.level,
    include_archived: 1,
    ...(req.hoc.department ? { department: req.hoc.department } : {}),
  });
  res.json(items.map(withFileUrl));
}));

/** Loads an item and makes sure it belongs to this HOC's own level and department. */
const ownItem = async (req, res) => {
  const item = await centralGet('hoc_item_get', { id: req.params.id });
  const sameLevel = item.level === req.hoc.level;
  const sameDepartment = !item.department || !req.hoc.department || item.department === req.hoc.department;
  if (!sameLevel || !sameDepartment) {
    res.status(403).json({ message: 'You can only manage items for your own level and department.' });
    return null;
  }
  return item;
};

/** Checks the form fields; returns an error message or null. */
const checkFields = ({ kind, title, price }, hasFile, isNew) => {
  if (![...FREE_KINDS, ...PAID_KINDS].includes(kind)) return 'Choose what kind of material this is.';
  if (!String(title || '').trim()) return 'Enter a title.';
  if (PAID_KINDS.includes(kind) && !(Number(price) > 0)) return 'Enter a price above zero.';
  if (FREE_KINDS.includes(kind) && isNew && !hasFile) return 'Upload the file for this material.';
  return null;
};

/** Sends an uploaded file to the central server, which stores it and re-checks its type. */
const storeFile = async (file, level) => {
  const form = new FormData();
  form.append('level', level);
  form.append('file', file.buffer, { filename: file.originalname, contentType: file.mimetype });
  return centralForm('hoc_file_upload', form);
};

/** Emails the class (their level and department only), sent by the server in the background. */
const announce = async (req, item) => {
  const label = KIND_LABEL[item.kind] || 'material';
  const free = FREE_KINDS.includes(item.kind);
  const portal = (process.env.FRONTEND_URL || '').replace(/\/$/, '');
  const where = `${item.level} Level${item.department ? `, ${item.department}` : ''}`;
  const name = `${item.title}${item.course_code ? ` (${item.course_code})` : ''}`;
  const audience = item.department
    ? { type: 'level_department', level: item.level, department: item.department }
    : { type: 'level', level: item.level };

  const subject = free ? `New ${label.toLowerCase()} uploaded: ${item.title}` : `New course material uploaded: ${item.title}`;
  const body = free
    ? `Hello {{name}},\n\nNew ${label.toLowerCase()} has been uploaded for your class (${where}):\n\n${name}\n\n` +
      `It is free. Log in to the NACOS portal${portal ? ` (${portal})` : ''}, open the Course Materials tab and download it from the library.`
    : `Hello {{name}},\n\nA new course material has been uploaded for your class (${where}):\n\n${name}\n${label}. Price: ${naira(item.price)}\n\n` +
      `Please log in to the NACOS portal${portal ? ` (${portal})` : ''}, open the Course Materials tab on your dashboard, and make payment to get access to the course material. ` +
      `After paying, collect it from your HOC.`;

  try {
    const campaign = await createCampaign({ subject, body, audience, sentBy: `HOC ${req.hoc.level}L: ${req.hoc.full_name}` });
    startCampaignInBackground(campaign.id);
    return { id: campaign.id, with_email: campaign.with_email, warning: campaign.warning };
  } catch (error) {
    // Nobody in the class has an email: the item is still created.
    console.warn('HOC announcement not created:', error.response?.data?.message || error.message);
    return null;
  }
};

router.post('/items', materialUpload, handle(async (req, res) => {
  const { kind, title, course_code, description, price } = req.body;
  const problem = checkFields(req.body, Boolean(req.file), true);
  if (problem) {
    res.status(400).json({ message: problem });
    return;
  }

  const free = FREE_KINDS.includes(kind);
  const file = free ? await storeFile(req.file, req.hoc.level) : {};
  const item = await centralPost('hoc_item_save', {
    kind, title, course_code, description,
    price: free ? 0 : price,
    ...file,
    level: req.hoc.level,
    department: req.hoc.department || undefined,
    created_by: req.hoc.id,
  });

  res.status(201).json({ item: withFileUrl(item), campaign: await announce(req, item) });
}));

router.put('/items/:id', materialUpload, handle(async (req, res) => {
  const existing = await ownItem(req, res);
  if (!existing) return;

  // The type of a material never changes, so the stored one is used whatever the browser sends.
  const { title, course_code, description, price } = req.body;
  const problem = checkFields({ ...req.body, kind: existing.kind }, Boolean(req.file), false);
  if (problem) {
    res.status(400).json({ message: problem });
    return;
  }

  const free = FREE_KINDS.includes(existing.kind);
  const file = free && req.file ? await storeFile(req.file, req.hoc.level) : {};
  const item = await centralPost('hoc_item_save', {
    id: existing.id, kind: existing.kind, title, course_code, description,
    price: free ? 0 : price,
    ...file,
    level: req.hoc.level,
    department: req.hoc.department || undefined,
  });
  res.json(withFileUrl(item));
}));

router.put('/items/:id/status', handle(async (req, res) => {
  const existing = await ownItem(req, res);
  if (!existing) return;
  res.json(await centralPost('hoc_item_status', { id: existing.id, status: req.body.status }));
}));

/** Everyone who has paid for a paid item, with whether they have collected it. */
router.get('/items/:id/sales', handle(async (req, res) => {
  const existing = await ownItem(req, res);
  if (!existing) return;
  res.json(await centralGet('hoc_item_sales', { id: existing.id }));
}));

/** Mark a payment as collected (received: true) or undo it (received: false). */
router.put('/items/:id/sales/:paymentId/received', handle(async (req, res) => {
  const existing = await ownItem(req, res);
  if (!existing) return;
  res.json(await centralPost('hoc_sale_receive', {
    item_id: existing.id,
    payment_id: req.params.paymentId,
    received: req.body.received !== false,
    by: req.hoc.full_name,
  }));
}));

/** Only the HOC who started an announcement, for their own class, can see or continue it. */
const ownCampaign = async (req, res) => {
  const campaign = await centralGet('email_campaign_get', { id: req.params.id });
  const mine = campaign.sent_by === `HOC ${req.hoc.level}L: ${req.hoc.full_name}` && campaign.audience_level === req.hoc.level;
  if (!mine) {
    res.status(403).json({ message: 'This announcement is not yours.' });
    return null;
  }
  return campaign;
};

/** Progress of an announcement (the server is sending it in the background). */
router.get('/campaigns/:id', handle(async (req, res) => {
  const campaign = await ownCampaign(req, res);
  if (!campaign) return;
  res.json({
    status: campaign.status,
    with_email: campaign.with_email,
    sent_count: campaign.sent_count,
    failed_count: campaign.failed_count,
  });
}));

/** Nudge a stuck announcement along (normally the server has already finished it). */
router.post('/campaigns/:id/send-batch', handle(async (req, res) => {
  if (!(await ownCampaign(req, res))) return;
  res.json(await sendCampaignBatch(req.params.id));
}));

export default router;
