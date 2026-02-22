const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const asyncHandler = require('../../common/utils/asyncHandler');

// POST register a new patient
exports.register = asyncHandler(async (req, res) => {
  const { name, email, mobileNumber, password, age, gender, bloodPressure, glucoseLevel, heartRate } = req.body;

  // Check if user already exists with email or mobile
  let user = await User.findOne({ 
    $or: [{ email }, { mobileNumber }] 
  });
  
  if (user) {
    if (user.email === email) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    if (user.mobileNumber === mobileNumber) {
      return res.status(400).json({ message: 'Mobile number already exists' });
    }
  }

  // Create user with role 'patient'
  user = new User({ 
    name, 
    email, 
    mobileNumber, 
    password, 
    role: 'patient' 
  });
  await user.save();

  // Create patient profile
  const patient = new Patient({
    userId: user._id,
    name: user.name,
    email: user.email,
    mobileNumber: user.mobileNumber,
    age: age || undefined,
    gender: gender || undefined,
    bloodPressure: bloodPressure || undefined,
    glucoseLevel: glucoseLevel || undefined,
    heartRate: heartRate || undefined
  });
  await patient.save();

  // Link patientId to user
  user.patientId = patient._id;
  await user.save();

  // Generate JWT
  const token = jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET || 'secretkey',
    { expiresIn: '7d' }
  );

  res.status(201).json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      mobileNumber: user.mobileNumber,
      role: user.role,
      patientId: patient._id
    }
  });
});

// POST login (supports both email and mobile number)
exports.login = asyncHandler(async (req, res) => {
  const { email, mobileNumber, password } = req.body;

  // Build query based on provided credentials
  let query = {};
  if (email) {
    query.email = email;
  } else if (mobileNumber) {
    query.mobileNumber = mobileNumber;
  } else {
    return res.status(400).json({ message: 'Email or mobile number is required' });
  }

  // Find user
  const user = await User.findOne(query);
  if (!user) {
    return res.status(400).json({ message: 'Invalid credentials' });
  }

  // Check password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(400).json({ message: 'Invalid credentials' });
  }

  // Fetch patientId or doctorId if exists
  let patientId, doctorId;
  if (user.role === 'patient') {
    const patient = await Patient.findOne({ userId: user._id });
    patientId = patient ? patient._id : null;
  } else if (user.role === 'doctor') {
    const doctor = await Doctor.findOne({ userId: user._id });
    doctorId = doctor ? doctor._id : null;
  }

  // Generate JWT
  const token = jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET || 'secretkey',
    { expiresIn: '7d' }
  );

  res.json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      mobileNumber: user.mobileNumber,
      role: user.role,
      patientId,
      doctorId
    }
  });
});