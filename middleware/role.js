// role.js
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: insufficient rights' });
    }
    next();
  };
};

module.exports = authorize;