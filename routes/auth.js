const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Patient = require('../models/Patient'); // add this
const Doctor = require('../models/Doctor');
const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, age, gender, bloodPressure, glucoseLevel, heartRate } = req.body;
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });

    user = new User({ name, email, password, role: 'patient' });
    await user.save();

    const patient = new Patient({
      userId: user._id,
      name: user.name,
      email: user.email,
      age: age || undefined,
      gender: gender || undefined,
      bloodPressure: bloodPressure || undefined,
      glucoseLevel: glucoseLevel || undefined,
      heartRate: heartRate || undefined
    });
    await patient.save();

    user.patientId = patient._id;
    await user.save();

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
        role: user.role,
        patientId: patient._id
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    // Fetch patientId or doctorId if exists
    let patientId, doctorId;
    if (user.role === 'patient') {
      const patient = await Patient.findOne({ userId: user._id });
      patientId = patient ? patient._id : null;
    } else if (user.role === 'doctor') {
      const doctor = await Doctor.findOne({ userId: user._id });
      doctorId = doctor ? doctor._id : null;
    }

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
        role: user.role,
        patientId,
        doctorId
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;