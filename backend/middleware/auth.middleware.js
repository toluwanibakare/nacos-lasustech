import jwt from 'jsonwebtoken';
import { centralGet, identityParams } from '../services/central.service.js';

/**
 * Auth Middleware
 * ---------------------------------------------------------
 * This checks if the user has a valid badge (JWT) to enter.
 */
const readUser = (req, res, { allowSignup }) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized! Please login first.' });
    return false;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'nacos_secret_2025');
    // A registration token (issued while a new student pays for the ID card) is not a sign-in.
    if (decoded.scope === 'signup' && !allowSignup) {
      res.status(401).json({ message: 'Finish your registration, then sign in.' });
      return false;
    }
    req.user = decoded; // Attach user info to the request
    return true;
  } catch (error) {
    res.status(401).json({ message: 'Token is invalid or expired. Time to login again!' });
    return false;
  }
};

/**
 * A member whose ID card is flagged can do nothing in the portal until the flag fee is paid. They may still load their
 * dashboard (to see why), fix their ID card application and pay: those paths are listed here. Anything else is refused.
 */
const FLAG_ALLOWED = [
  '/api/student/dashboard',
  '/api/student/payments',
  '/api/fresher/me',
  '/api/services/id-card/',
  '/api/payments/initialize',
  '/api/payments/verify/',
];

// Who is flagged, remembered briefly so the portal does not ask the central server on every click.
// A flagged answer is kept for seconds only, so paying the fee unlocks the portal almost at once.
const flagCache = new Map();
const FLAGGED_TTL = 5000;
const CLEAR_TTL = 30000;

/** Forget what we know about who is flagged. Called whenever a flag is set or removed, or a payment is recorded. */
export const clearFlagCache = () => flagCache.clear();

const isFlagged = async (user) => {
  const key = user.account_type === 'fresher' ? `f${user.id}` : `s${user.matric}`;
  const hit = flagCache.get(key);
  if (hit && hit.until > Date.now()) return hit.flagged;
  try {
    const { flagged } = await centralGet('id_flag_status', identityParams(user));
    flagCache.set(key, { flagged: !!flagged, until: Date.now() + (flagged ? FLAGGED_TTL : CLEAR_TTL) });
    return !!flagged;
  } catch {
    return false; // if the central server cannot be reached, do not lock everyone out
  }
};

const protect = async (req, res, next) => {
  if (!readUser(req, res, { allowSignup: false })) return;
  const { role, account_type: accountType } = req.user;
  // Admin tokens are not members. Everyone else (students, freshers, HOC) is checked.
  if (role !== 'admin' && (accountType === 'fresher' || req.user.matric)) {
    const path = req.originalUrl.split('?')[0];
    if (!FLAG_ALLOWED.some((allowed) => path === allowed || (allowed.endsWith('/') && path.startsWith(allowed))) && (await isFlagged(req.user))) {
      res.status(403).json({ message: 'Your ID card was flagged. Pay the new ID card fee on the ID Card page to continue.', code: 'ID_FLAGGED' });
      return;
    }
  }
  next();
};

/** Like protect, but also lets a registration token through (used only for paying the ID card fee). */
export const protectOrSignup = (req, res, next) => {
  if (readUser(req, res, { allowSignup: true })) next();
};

export default protect;
