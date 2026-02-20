const Patient = require('../models/Patient');
const asyncHandler = require('../../common/utils/asyncHandler');

// GET analytics summary (total patients, high-risk count)
exports.getAnalytics = asyncHandler(async (req, res) => {
  const patients = await Patient.find();
  const totalPatients = patients.length;
  // High-risk: BP > 140 or glucose > 140
  const highRiskCount = patients.filter(p => p.bloodPressure > 140 || p.glucoseLevel > 140).length;

  res.json({
    totalPatients,
    highRiskCount
  });
});

// GET detailed risk per patient
exports.getPatientRiskDetails = asyncHandler(async (req, res) => {
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
});