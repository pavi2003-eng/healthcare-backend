const mongoose = require('mongoose');
const Rating = require('../models/Rating');
const Doctor = require('../models/Doctor');
const asyncHandler = require('../../common/utils/asyncHandler');

// POST a new rating (patient only)
exports.createRating = asyncHandler(async (req, res) => {
  const { doctorId, appointmentId, score, comment } = req.body;

  if (!doctorId || !appointmentId || !score) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const patientId = req.user.patientId; // from auth middleware

  // Convert to ObjectId
  const doctorObjectId = new mongoose.Types.ObjectId(doctorId);

  // Save rating
  const rating = await Rating.create({
    doctorId: doctorObjectId,
    patientId,
    appointmentId,
    score,
    comment
  });

  // Recalculate doctor rating
  const stats = await Rating.aggregate([
    { $match: { doctorId: doctorObjectId } },
    {
      $group: {
        _id: '$doctorId',
        avg: { $avg: '$score' },
        count: { $sum: 1 }
      }
    }
  ]);

  if (stats.length > 0) {
    await Doctor.findByIdAndUpdate(
      doctorObjectId,
      {
        averageRating: stats[0].avg,
        totalRatings: stats[0].count
      },
      { new: true }
    );

    console.log(`✅ Doctor updated: avg=${stats[0].avg}, count=${stats[0].count}`);
  }

  res.status(201).json({
    message: 'Rating submitted successfully',
    rating
  });
});

// GET ratings for a specific doctor
exports.getDoctorRatings = asyncHandler(async (req, res) => {
  const doctorObjectId = new mongoose.Types.ObjectId(req.params.doctorId);

  const ratings = await Rating.find({ doctorId: doctorObjectId })
    .populate('patientId', 'name')
    .sort('-createdAt');

  res.json(ratings);
});