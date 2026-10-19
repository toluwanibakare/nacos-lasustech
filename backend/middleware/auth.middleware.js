import jwt from 'jsonwebtoken';

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

const protect = (req, res, next) => {
  if (readUser(req, res, { allowSignup: false })) next();
};

/** Like protect, but also lets a registration token through (used only for paying the ID card fee). */
export const protectOrSignup = (req, res, next) => {
  if (readUser(req, res, { allowSignup: true })) next();
};

export default protect;
