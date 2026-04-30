import jwt from 'jsonwebtoken';

/**
 * Auth Middleware
 * ---------------------------------------------------------
 * This checks if the user has a valid badge (JWT) to enter.
 */
const protect = (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized! Please login first.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach user info to the request
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token is invalid or expired. Time to login again!' });
  }
};

export default protect;
