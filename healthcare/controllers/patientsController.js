const Patient = require('../models/Patient');
const asyncHandler = require('../../common/utils/asyncHandler');

exports.getAllPatients = asyncHandler(async (req, res) => {
  let query = {};
  if (req.query.critical === 'true') {
    query = { $or: [{ bloodPressure: { $gt: 140 } }, { glucoseLevel: { $gt: 140 } }] };
  }
  const patients = await Patient.find(query);
  res.json(patients);
});

exports.getPatientById = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id);
  if (!patient) return res.status(404).json({ message: 'Patient not found' });
  res.json(patient);
});

exports.createPatient = asyncHandler(async (req, res) => {
  const patient = new Patient(req.body);
  await patient.save();
  res.status(201).json({ message: 'Patient saved successfully', patient });
});

exports.updatePatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!patient) return res.status(404).json({ message: 'Patient not found' });
  res.json({ message: 'Patient updated', patient });
});

exports.deletePatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findByIdAndDelete(req.params.id);
  if (!patient) return res.status(404).json({ message: 'Patient not found' });
  res.json({ message: 'Patient deleted' });
});