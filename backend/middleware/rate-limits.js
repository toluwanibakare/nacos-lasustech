import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

/**
 * Rate limits
 * ---------------------------------------------------------
 * Many students share one campus Wi-Fi IP address, so limits that count every
 * request per IP lock out whole groups. These count what actually matters:
 *  - failed sign-in style attempts, per IP + account (and a looser cap per account)
 *  - emails and codes sent, per account
 *  - a generous per-IP safety net for everything else
 * Counters live in memory, so on a serverless host each instance counts separately.
 */
const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

const make = (options) =>
  rateLimit({ standardHeaders: 'draft-7', legacyHeaders: false, ...options });

// JSON, so the website can show the message.
const tooMany = (text) => ({ message: text });

const clean = (value) => String(value ?? '').trim().toLowerCase().slice(0, 120);
const ipOf = (req) => ipKeyGenerator(req.ip);

/** Everything not covered below. The admin API is exempt: it already needs a signed-in admin. */
export const generalLimiter = make({
  windowMs: 15 * MINUTE,
  limit: 1000,
  skip: (req) => req.path.startsWith('/api/admin/'),
  message: tooMany('Too many requests from this network. Please wait a few minutes and try again.'),
});

/** Per-IP safety net for a whole group of routes (every request counts). */
export const ipBackstop = (limit, windowMs = 15 * MINUTE) =>
  make({ windowMs, limit, message: tooMany('Too many requests from this network. Please wait a few minutes and try again.') });

/**
 * Failed attempts only (successful requests are not counted).
 * `field` is the request-body field that names the account (matric_number, email, username).
 * Returns two limiters: 10 failures per 15 minutes per IP + account, and 60 per hour per account.
 */
export const failedAttempts = (field) => [
  make({
    windowMs: 15 * MINUTE,
    limit: 10,
    skipSuccessfulRequests: true,
    keyGenerator: (req) => `${ipOf(req)}|${clean(req.body?.[field])}`,
    message: tooMany('Too many failed attempts. Please wait 15 minutes and try again.'),
  }),
  make({
    windowMs: HOUR,
    limit: 60,
    skipSuccessfulRequests: true,
    keyGenerator: (req) => clean(req.body?.[field]) || ipOf(req),
    message: tooMany('Too many failed attempts for this account. Please try again later.'),
  }),
];

/** Anything that sends an email or a code: a few per hour per account. */
export const emailsPerAccount = (field, limit = 5) =>
  make({
    windowMs: HOUR,
    limit,
    keyGenerator: (req) => clean(req.body?.[field]) || ipOf(req),
    message: tooMany('Too many requests for this account. Please try again in an hour.'),
  });
