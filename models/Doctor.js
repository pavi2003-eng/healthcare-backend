const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fullName: { type: String, required: true },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
  email: { type: String, required: true, unique: true },
  contactNumber: { type: String, required: true },
  specialist: [{ type: String }],
  designation: { type: String },
  averageRating: { type: Number, default: 0 },
  totalRatings: { type: Number, default: 0 },
  profileImage: { type: String }
});

module.exports = mongoose.model('Doctor', doctorSchema);