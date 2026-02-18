const express = require('express');
const Patient = require('../models/Patient');
const router = express.Router();
const auth = require('../middleware/auth');
const authorize = require('../middleware/role');
router.get('/', auth, authorize('admin'), async (req, res) => {
  try {
    let query = {};
    if (req.query.critical === 'true') {
      query = {
        $or: [
          { bloodPressure: { $gt: 140 } },
          { glucoseLevel: { $gt: 140 } }
        ]
      };
    }
    const patients = await Patient.find(query);
    res.json(patients);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET a single patient by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    res.json(patient);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST a new patient
router.post('/', async (req, res) => {
  try {
    const patient = new Patient(req.body);
    await patient.save();
    res.status(201).json({ message: 'Patient saved successfully', patient });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update a patient
router.put('/:id', auth, async (req, res) => {
  try {
    const patient = await Patient.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    res.json({ message: 'Patient updated', patient });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
// DELETE a patient
router.delete('/:id', async (req, res) => {
  try {
    const patient = await Patient.findByIdAndDelete(req.params.id);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    res.json({ message: 'Patient deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;