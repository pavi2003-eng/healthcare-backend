const { getDatabaseConnection } = require('../../common/config/db');
const mongoose = require('mongoose');

const conn = getDatabaseConnection('healthcare');

const appointmentSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: String,
      unique: true
    },
    patientName: {
      type: String,
      required: true,
      trim: true
    },
    patientEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    patientGender: {
      type: String,
      enum: ["Male", "Female", "Other", "Not specified"],
      required: true
    },
    patientAge: {
      type: Number,
      required: true,
      min: 0
    },
    appointmentDate: {
      type: Date,
      required: true
    },
    appointmentTime: {
      type: String,
      required: true
    },
    appointmentReason: {
      type: String,
      required: true,
      trim: true
    },
    appointmentType: {
      type: String,
      required: true
    },
    consultingDoctor: {
      type: String,
      required: true
    },
    notes: {
      type: String,
      default: ""
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true
    },
    status: {
      type: String,
      enum: ["Scheduled", "Accepted", "Completed", "Cancelled"],
      default: "Scheduled"
    }
  },
  { timestamps: true }
);

appointmentSchema.pre("save", async function (next) {
  if (!this.appointmentId) {
    this.appointmentId = "APT-" + Date.now();
  }
  next();
});

module.exports = conn.model("Appointment", appointmentSchema);