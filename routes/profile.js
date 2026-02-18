const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const auth = require('../middleware/auth');
const Patient = require('../models/Patient');

/* ================================
   MULTER STORAGE CONFIG
================================ */

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '..', 'uploads');

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },

  filename: function (req, file, cb) {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mime = allowedTypes.test(file.mimetype);

    if (ext && mime) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

/* ================================
   GET CURRENT USER
================================ */

router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ================================
   UPDATE PROFILE TEXT FIELDS
================================ */

router.put('/me', auth, async (req, res) => {
  try {
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
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/* ================================
   UPLOAD PROFILE PICTURE
================================ */

router.post(
  '/me/picture',
  auth,
  upload.single('profilePicture'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const user = await User.findById(req.user.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // 🔥 DELETE OLD IMAGE IF EXISTS
      if (user.profilePicture) {
        const oldImagePath = path.join(
          __dirname,
          '..',
          user.profilePicture
        );

        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }

      // Save new image
      const imageUrl = `/uploads/${req.file.filename}`;
      user.profilePicture = imageUrl;

      await user.save();

      res.json({ profilePicture: imageUrl });

    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  }
);

/* ================================
   DELETE USER ACCOUNT
   (Also deletes profile image)
================================ */

router.delete('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete profile image if exists
    if (user.profilePicture) {
      const imagePath = path.join(__dirname, '..', user.profilePicture);

      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await User.findByIdAndDelete(req.user.userId);

    res.json({ message: 'User account deleted successfully' });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Change password
router.post('/change-password', auth, async (req, res) => {
  try {
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

    user.password = newPassword; // will be hashed by pre-save hook
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
module.exports = router;
