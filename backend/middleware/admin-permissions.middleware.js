import { centralGet } from '../services/central.service.js';

/**
 * Admin permissions
 * ---------------------------------------------------------
 * The super admin (admin_kind 'super') can use everything. A sub-admin (a
 * student given access) can only use the admin pages the super admin ticked,
 * checked against the live database on every request so removing access
 * takes effect straight away. Anything not listed here is super-admin only.
 */
export const ADMIN_PAGES = [
  'students', 'freshers', 'idcards', 'payments', 'email', 'settings', 'executives', 'events', 'blogs', 'messages',
];

// First path segment -> the page permission it needs.
const PAGE_BY_SEGMENT = {
  students: 'students',
  'student-flags': 'students',
  stats: 'students',
  freshers: 'freshers',
  'id-requests': 'idcards',
  'id-cards': 'idcards',
  payments: 'payments',
  'hoc-items': 'payments',
  email: 'email',
  'email-check': 'email',
  settings: 'settings',
  executives: 'executives',
  events: 'events',
  blogs: 'blogs',
  messages: 'messages',
};

// Any signed-in admin may call these (the dashboard filters its own output).
const OPEN_SEGMENTS = new Set(['me', 'dashboard', 'upload']);

const adminPermissions = async (req, res, next) => {
  const kind = req.user?.admin_kind;

  if (kind === 'super') {
    req.adminPermissions = ['*'];
    next();
    return;
  }

  if (kind !== 'sub' || !req.user.matric) {
    // Includes old tokens and any non-admin-console token: sign in again.
    res.status(401).json({ message: 'Please sign in to the admin again.' });
    return;
  }

  try {
    const access = await centralGet('admin_access_get', { matric: req.user.matric });
    req.adminPermissions = access.permissions || [];
  } catch (error) {
    res.status(502).json({ message: 'Could not verify your admin access.' });
    return;
  }

  if (!req.adminPermissions.length) {
    res.status(403).json({ message: 'Your admin access has been removed.' });
    return;
  }

  const segment = req.path.split('/')[1] || '';
  if (OPEN_SEGMENTS.has(segment)) {
    next();
    return;
  }

  const needed = PAGE_BY_SEGMENT[segment];
  if (!needed || !req.adminPermissions.includes(needed)) {
    res.status(403).json({ message: 'You do not have access to this page.' });
    return;
  }
  next();
};

export default adminPermissions;
