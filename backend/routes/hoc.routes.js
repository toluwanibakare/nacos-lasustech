import { Router } from 'express';
import protect from '../middleware/auth.middleware.js';
import isHoc from '../middleware/hoc.middleware.js';
import { centralGet, centralPost, identityParams, sendCentralError } from '../services/central.service.js';
import { createCampaign, sendCampaignBatch } from '../services/campaign.service.js';

const router = Router();

/**
 * HOC Routes
 * ---------------------------------------------------------
 * An HOC / Assistant HOC posts books, manuals and workbooks for their own
 * level. Classmates pay on the portal and the payment shows on their
 * dashboard. New items are announced by email through the campaign system.
 */

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

// ── Any signed-in member (student or fresher): items for my own level ────────
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
  res.json(items);
}));

// ── HOC only ─────────────────────────────────────────────────────────────────
router.use(protect, isHoc);

router.get('/me', (req, res) => res.json(req.hoc));

router.get('/items', handle(async (req, res) => {
  res.json(await centralGet('hoc_items_list', { level: req.hoc.level, include_archived: 1 }));
}));

/** Loads an item and makes sure it belongs to this HOC's level. */
const ownItem = async (req, res) => {
  const item = await centralGet('hoc_item_get', { id: req.params.id });
  if (item.level !== req.hoc.level) {
    res.status(403).json({ message: 'You can only manage items for your own level.' });
    return null;
  }
  return item;
};

router.post('/items', handle(async (req, res) => {
  const { title, course_code, description, price, department } = req.body;
  const item = await centralPost('hoc_item_save', {
    title, course_code, description, price, department,
    level: req.hoc.level,
    created_by: req.hoc.id,
  });

  // Announce it to the class. If nobody in the class has an email, the item is still created.
  let campaign = null;
  const classAudience = item.department
    ? { type: 'level_department', level: item.level, department: item.department }
    : { type: 'level', level: item.level };
  try {
    campaign = await createCampaign({
      subject: `New material available: ${item.title}`,
      body:
        `Hello {{name}},\n\nA new item has been added for ${item.level} Level${item.course_code ? ` (${item.course_code})` : ''}:\n\n` +
        `${item.title}\nPrice: ${naira(item.price)}\n\n` +
        `Please log in to the NACOS portal and pay for it from your dashboard.`,
      audience: classAudience,
      sentBy: `HOC ${req.hoc.level}L: ${req.hoc.full_name}`,
    });
  } catch (error) {
    console.warn('HOC announcement not created:', error.response?.data?.message || error.message);
  }

  res.status(201).json({ item, campaign: campaign ? { id: campaign.id, with_email: campaign.with_email, warning: campaign.warning } : null });
}));

router.put('/items/:id', handle(async (req, res) => {
  const existing = await ownItem(req, res);
  if (!existing) return;
  const { title, course_code, description, price, department } = req.body;
  res.json(await centralPost('hoc_item_save', {
    id: existing.id, title, course_code, description, price, department, level: req.hoc.level,
  }));
}));

router.put('/items/:id/status', handle(async (req, res) => {
  const existing = await ownItem(req, res);
  if (!existing) return;
  res.json(await centralPost('hoc_item_status', { id: existing.id, status: req.body.status }));
}));

router.get('/items/:id/sales', handle(async (req, res) => {
  const existing = await ownItem(req, res);
  if (!existing) return;
  res.json(await centralGet('hoc_item_sales', { id: existing.id }));
}));

/** Sends the next batch of the announcement for an item this HOC created. */
router.post('/campaigns/:id/send-batch', handle(async (req, res) => {
  const campaign = await centralGet('email_campaign_get', { id: req.params.id });
  if (campaign.sent_by !== `HOC ${req.hoc.level}L: ${req.hoc.full_name}` || campaign.audience_level !== req.hoc.level) {
    res.status(403).json({ message: 'This announcement is not yours.' });
    return;
  }
  res.json(await sendCampaignBatch(req.params.id));
}));

export default router;
