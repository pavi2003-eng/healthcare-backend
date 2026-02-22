const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const asyncHandler = require('../../common/utils/asyncHandler');
const fs = require('fs');
const path = require('path');

// Helper to get the absolute path to the uploads folder
const UPLOAD_ROOT = path.join(__dirname, '../../../uploads');

// GET current user profile
exports.getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.userId).select('-password');
  
  // If user is doctor, fetch doctor details
  if (req.user.role === 'doctor' && req.user.doctorId) {
    const doctor = await Doctor.findById(req.user.doctorId);
    res.json({
      ...user.toObject(),
      specialization: doctor?.specialization || doctor?.specialist,
      qualifications: doctor?.qualifications,
      experience: doctor?.experience,
      consultationFee: doctor?.consultationFee,
      availableDays: doctor?.availableDays,
      availableTime: doctor?.availableTime
    });
  } 
  // If user is patient, fetch patient details
  else if (req.user.role === 'patient' && req.user.patientId) {
    const patient = await Patient.findById(req.user.patientId);
    res.json({
      ...user.toObject(),
      age: patient?.age,
      gender: patient?.gender,
      bloodPressure: patient?.bloodPressure,
      glucoseLevel: patient?.glucoseLevel,
      heartRate: patient?.heartRate
    });
  } 
  // Admin or other roles
  else {
    res.json(user);
  }
});

// PUT update profile text fields
exports.updateProfile = asyncHandler(async (req, res) => {
  const { 
    name, bio, username, mobileNumber,
    // Patient fields
    age, gender, bloodPressure, glucoseLevel, heartRate,
    // Doctor fields
    specialization, qualifications, experience, consultationFee, availableDays, availableTime
  } = req.body;

  const updateData = {};

  // Common fields for all users
  if (name) updateData.name = name;
  if (bio !== undefined) updateData.bio = bio;
  
  // Handle mobile number update
  if (mobileNumber) {
    // Validate mobile number format (10 digits)
    if (!/^\d{10}$/.test(mobileNumber)) {
      return res.status(400).json({ message: 'Please enter a valid 10-digit mobile number' });
    }
    
    // Check if mobile number is already taken by another user
    const existingUser = await User.findOne({
      mobileNumber,
      _id: { $ne: req.user.userId }
    });
    
    if (existingUser) {
      return res.status(400).json({ message: 'Mobile number already in use' });
    }
    
    updateData.mobileNumber = mobileNumber;
  }

  // Handle username update
  if (username) {
    const existingUser = await User.findOne({
      username,
      _id: { $ne: req.user.userId }
    });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already taken' });
    }
    updateData.username = username;
  }

  // Update user
  const updatedUser = await User.findByIdAndUpdate(
    req.user.userId,
    updateData,
    { new: true }
  ).select('-password');

  // If user is a patient, update patient collection
  if (req.user.role === 'patient' && req.user.patientId) {
    const patientUpdate = {};
    
    if (age !== undefined) patientUpdate.age = age;
    if (gender !== undefined) patientUpdate.gender = gender;
    if (bloodPressure !== undefined) patientUpdate.bloodPressure = bloodPressure;
    if (glucoseLevel !== undefined) patientUpdate.glucoseLevel = glucoseLevel;
    if (heartRate !== undefined) patientUpdate.heartRate = heartRate;
    
    // Also update mobile number and name in patient collection
    if (mobileNumber) patientUpdate.mobileNumber = mobileNumber;
    if (name) patientUpdate.name = name;

    if (Object.keys(patientUpdate).length > 0) {
      await Patient.findByIdAndUpdate(req.user.patientId, patientUpdate, { new: true });
    }
  }

  // If user is a doctor, update doctor collection
  if (req.user.role === 'doctor' && req.user.doctorId) {
    const doctorUpdate = {};
    
    if (specialization !== undefined) {
      doctorUpdate.specialization = specialization;
      doctorUpdate.specialist = specialization; // Keep both for compatibility
    }
    if (qualifications !== undefined) doctorUpdate.qualifications = qualifications;
    if (experience !== undefined) doctorUpdate.experience = experience;
    if (consultationFee !== undefined) doctorUpdate.consultationFee = consultationFee;
    if (availableDays !== undefined) doctorUpdate.availableDays = availableDays;
    if (availableTime !== undefined) doctorUpdate.availableTime = availableTime;
    
    // Also update mobile number and name in doctor collection
    if (mobileNumber) doctorUpdate.mobileNumber = mobileNumber;
    if (name) doctorUpdate.fullName = name;

    if (Object.keys(doctorUpdate).length > 0) {
      await Doctor.findByIdAndUpdate(req.user.doctorId, doctorUpdate, { new: true });
    }
  }

  res.json(updatedUser);
});

// POST upload profile picture
exports.uploadProfilePicture = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const user = await User.findById(req.user.userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Delete old image if exists
  if (user.profilePicture) {
    const oldImagePath = path.join(UPLOAD_ROOT, path.basename(user.profilePicture));
    if (fs.existsSync(oldImagePath)) {
      fs.unlinkSync(oldImagePath);
    }
  }

  // Save with user ID in filename for better tracking
  const fileExt = path.extname(req.file.originalname);
  const newFilename = `${user._id}-${Date.now()}${fileExt}`;
  const newPath = path.join(UPLOAD_ROOT, newFilename);
  
  // Rename the file
  fs.renameSync(req.file.path, newPath);

  const imageUrl = `/uploads/${newFilename}`;
  user.profilePicture = imageUrl;
  await user.save();

  res.json({ profilePicture: imageUrl });
});

// DELETE user account (and profile picture)
exports.deleteAccount = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Delete profile image if exists
  if (user.profilePicture) {
    const imagePath = path.join(UPLOAD_ROOT, path.basename(user.profilePicture));
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
  }

  // Delete associated patient or doctor record
  if (user.role === 'patient' && user.patientId) {
    await Patient.findByIdAndDelete(user.patientId);
  } else if (user.role === 'doctor' && user.doctorId) {
    await Doctor.findByIdAndDelete(user.doctorId);
  }

  await User.findByIdAndDelete(req.user.userId);
  res.json({ message: 'User account deleted successfully' });
});

// POST change password
exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current password and new password are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  const user = await User.findById(req.user.userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    return res.status(400).json({ message: 'Current password is incorrect' });
  }

  user.password = newPassword;
  await user.save();

  res.json({ message: 'Password changed successfully' });
});