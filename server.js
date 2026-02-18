const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path'); // ✅ IMPORTANT
require('dotenv').config();

const patientRoutes = require('./routes/patients');
const doctorRoutes = require('./routes/doctors');
const appointmentRoutes = require('./routes/appointments');
const chatRoutes = require('./routes/chats');
const departmentRoutes = require('./routes/departments');
const analyticsRoutes = require('./routes/analytics');
const authRoutes = require('./routes/auth');
const ratingRoutes = require('./routes/ratings');
const adminRoutes = require('./routes/admin');
const Doctor = require('./models/Doctor');
const Rating = require('./models//Rating');

const app = express();

app.use(cors());
app.use(express.json());

/* ✅ FIXED STATIC FOLDER CONFIGURATION */
app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'))
);

// MongoDB connection
const mongoURI =
  process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/healthcare';

mongoose
  .connect(mongoURI)
  .then(() => {
    console.log('MongoDB connected');
    createDefaultAdmin();
  })
  .catch((err) =>
    console.log('MongoDB connection error:', err)
  );

const User = require('./models/User');

// Create default admin if not exists
const createDefaultAdmin = async () => {
  try {
    const adminExists = await User.findOne({
      email: 'admin@gmail.com',
    });

    if (!adminExists) {
      const admin = new User({
        name: 'Admin',
        email: 'admin@gmail.com',
        password: 'admin@gmail.com',
        role: 'admin',
      });

      await admin.save();
      console.log(
        'Default admin created: admin@gmail.com / admin@gmail.com'
      );
    }
  } catch (err) {
    console.error('Error creating default admin:', err);
  }
};

// Routes
app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/profile', require('./routes/profile'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);
// TEMPORARY FIX ROUTE – REMOVE AFTER USING
app.post('/api/fix-all-ratings', async (req, res) => {
  try {
    const doctors = await Doctor.find();
    let updatedCount = 0;
    for (let doc of doctors) {
      const stats = await Rating.aggregate([
        { $match: { doctorId: doc._id } },
        { $group: { _id: '$doctorId', avg: { $avg: '$score' }, count: { $sum: 1 } } }
      ]);
      if (stats.length > 0) {
        doc.averageRating = stats[0].avg;
        doc.totalRatings = stats[0].count;
        await doc.save();
        updatedCount++;
        console.log(`✅ Updated ${doc.fullName}: avg=${stats[0].avg}, count=${stats[0].count}`);
      } else {
        // If no ratings, reset to zero (optional)
        doc.averageRating = 0;
        doc.totalRatings = 0;
        await doc.save();
      }
    }
    res.json({ message: `Fixed ${updatedCount} doctors with ratings.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});