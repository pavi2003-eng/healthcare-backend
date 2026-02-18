const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) return res.status(401).json({ message: 'User not found' });

    req.user = {
      userId: user._id,
      role: user.role,
      patientId: user.patientId,
      doctorId: user.doctorId,
      name: user.name,
      email: user.email
    };
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};