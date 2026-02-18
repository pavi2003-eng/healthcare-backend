const express = require('express');
const Patient = require('../models/Patient');
const router = express.Router();

// GET analytics summary (total patients, high-risk count)
router.get('/', async (req, res) => {
  try {
    const patients = await Patient.find();
    const totalPatients = patients.length;
    // High-risk: BP > 140 or glucose > 140
    const highRiskCount = patients.filter(p => p.bloodPressure > 140 || p.glucoseLevel > 140).length;

    res.json({
      totalPatients,
      highRiskCount
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Optional: detailed risk per patient
router.get('/details', async (req, res) => {
  try {
    const patients = await Patient.find();
    const detailed = patients.map(p => ({
      id: p._id,
      name: p.name,
      age: p.age,
      bloodPressure: p.bloodPressure,
      glucoseLevel: p.glucoseLevel,
      heartRate: p.heartRate,
      highRisk: p.bloodPressure > 140 || p.glucoseLevel > 140
    }));
    res.json(detailed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;