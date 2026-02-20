// src/healthcare/controllers/profileController.js
const User = require('../models/User'); // now inside healthcare/models
const Patient = require('../models/Patient');
const asyncHandler = require('../../common/utils/asyncHandler');
const fs = require('fs');
const path = require('path');

// Helper to get the absolute path to the uploads folder
const UPLOAD_ROOT = path.join(__dirname, '../../../uploads');

// GET current user profile
exports.getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.userId).select('-password');
  res.json(user);
});

// PUT update profile text fields
exports.updateProfile = asyncHandler(async (req, res) => {
  const { name, bio, username, bloodPressure, glucoseLevel, heartRate } = req.body;

  const updateData = {};

  if (name) updateData.name = name;
  if (bio !== undefined) updateData.bio = bio;

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

  // If user is a patient, update vitals
  if (req.user.role === 'patient' && req.user.patientId) {
    const patientUpdate = {};
    if (bloodPressure !== undefined) patientUpdate.bloodPressure = bloodPressure;
    if (glucoseLevel !== undefined) patientUpdate.glucoseLevel = glucoseLevel;
    if (heartRate !== undefined) patientUpdate.heartRate = heartRate;

    if (Object.keys(patientUpdate).length > 0) {
      await Patient.findByIdAndUpdate(req.user.patientId, patientUpdate, { new: true });
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
    // user.profilePicture is stored as "/uploads/filename.jpg"
    const oldImagePath = path.join(UPLOAD_ROOT, path.basename(user.profilePicture));
    if (fs.existsSync(oldImagePath)) {
      fs.unlinkSync(oldImagePath);
    }
  }

  // Save new image path (relative to static serve)
  const imageUrl = `/uploads/${req.file.filename}`;
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