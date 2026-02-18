const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['patient', 'doctor', 'admin'], default: 'patient' },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
  createdAt: { type: Date, default: Date.now },
  profilePicture: { type: String, default: '' }, // store URL or path
  bio: { type: String, default: '' },
  username: { type: String, unique: true, sparse: true } // optional username
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);