import { centralGet } from '../services/central.service.js';

/**
 * HOC Middleware
 * ---------------------------------------------------------
 * Lets only a current HOC or Assistant HOC through. The role is checked
 * against the live database on every request (not the 30-day token), so an
 * admin removing the tag takes effect straight away. The HOC only ever acts
 * on their own level.
 */
const isHoc = async (req, res, next) => {
  if (!req.user || req.user.account_type === 'fresher') {
    res.status(403).json({ message: 'HOC access only.' });
    return;
  }

  try {
    const profile = await centralGet('hoc_profile', { matric: req.user.matric });
    if (!profile.is_hoc) {
      res.status(403).json({ message: 'HOC access only.' });
      return;
    }
    req.hoc = profile;
    next();
  } catch (error) {
    res.status(error.response?.status === 404 ? 403 : 502).json({ message: 'Could not verify HOC access.' });
  }
};

export default isHoc;
