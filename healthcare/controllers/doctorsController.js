const Doctor = require('../models/Doctor');
const User = require('../models/User');
const asyncHandler = require('../../common/utils/asyncHandler');

// GET all doctors (public) – includes profile images
exports.getAllDoctors = asyncHandler(async (req, res) => {
  // Populate the userId field to get the user's profilePicture
  const doctors = await Doctor.find().populate('userId', 'profilePicture');
  
  // Map each doctor to include profileImage from the populated user
  const doctorsWithImage = doctors.map(doc => {
    const docObj = doc.toObject();
    docObj.profileImage = doc.userId?.profilePicture || null;
    return docObj;
  });
  
  res.json(doctorsWithImage);
});

// GET a single doctor by ID with profile image
exports.getDoctorById = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id).populate('userId', 'profilePicture');
  if (!doctor) {
    return res.status(404).json({ message: 'Doctor not found' });
  }
  
  const doctorObj = doctor.toObject();
  doctorObj.profileImage = doctor.userId?.profilePicture || null;
  
  res.json(doctorObj);
});

// POST a new doctor (admin only) – also creates user account
exports.createDoctor = asyncHandler(async (req, res) => {
  const { fullName, email, password, gender, contactNumber, specialist, designation } = req.body;

  // Check if user already exists
  let user = await User.findOne({ email });
  if (user) {
    return res.status(400).json({ message: 'User already exists' });
  }

  // Create user with role 'doctor'
  user = new User({
    name: fullName,
    email,
    password, // will be hashed by pre-save hook
    role: 'doctor'
  });
  await user.save();

  // Create doctor profile
  const doctor = new Doctor({
    userId: user._id,
    fullName,
    gender,
    email,
    contactNumber,
    specialist: specialist || [],
    designation
  });
  await doctor.save();

  // Link doctorId to user
  user.doctorId = doctor._id;
  await user.save();

  res.status(201).json({ message: 'Doctor created successfully', doctor });
});

// PUT update a doctor (admin only)
exports.updateDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!doctor) {
    return res.status(404).json({ message: 'Doctor not found' });
  }
  res.json({ message: 'Doctor updated', doctor });
});

// DELETE a doctor (admin only) – also deletes user
exports.deleteDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id);
  if (!doctor) {
    return res.status(404).json({ message: 'Doctor not found' });
  }

  // Delete associated user
  await User.findByIdAndDelete(doctor.userId);
  // Delete doctor
  await doctor.deleteOne();

  res.json({ message: 'Doctor and user deleted' });
});