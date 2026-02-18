const express = require('express');
const Doctor = require('../models/Doctor');
const router = express.Router();

// GET all doctors with profile images (from associated user)
router.get('/', async (req, res) => {
  try {
    // Populate the userId field to get the user's profilePicture
    const doctors = await Doctor.find().populate('userId', 'profilePicture');
    
    // Map each doctor to include profileImage from the populated user
    const doctorsWithImage = doctors.map(doc => {
      const docObj = doc.toObject();
      docObj.profileImage = doc.userId?.profilePicture || null;
      return docObj;
    });
    
    res.json(doctorsWithImage);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET a single doctor by ID with profile image
router.get('/:id', async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id).populate('userId', 'profilePicture');
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    
    const doctorObj = doctor.toObject();
    doctorObj.profileImage = doctor.userId?.profilePicture || null;
    
    res.json(doctorObj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST a new doctor (no profile image handling needed – it belongs to user)
router.post('/', async (req, res) => {
  try {
    const doctor = new Doctor(req.body);
    await doctor.save();
    res.status(201).json({ message: 'Doctor saved', doctor });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update a doctor
router.put('/:id', async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    res.json({ message: 'Doctor updated', doctor });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE a doctor
router.delete('/:id', async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndDelete(req.params.id);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    res.json({ message: 'Doctor deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;