/**
 * Admin Middleware
 * ---------------------------------------------------------
 * Only allows users with the 'admin' role to pass.
 */
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access Denied. Admins only, boss!' });
  }
};

export default isAdmin;
