const express = require('express');
const Appointment = require('../models/Appointment');
const router = express.Router();
const { sendAppointmentAcceptedEmail } = require('../utils/email');
const Chat = require('../models/Chat');
const auth = require('../middleware/auth'); // import auth
const authorize = require('../middleware/role');
const Notification = require('../models/Notification');
const User = require('../models/User');
const Patient = require('../models/Patient');
// GET all appointments (admin only maybe)
router.get('/', async (req, res) => {
  try {
    const appointments = await Appointment.find();
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET appointments by doctor ID
router.get('/doctor/:doctorId', async (req, res) => {
  try {
    const appointments = await Appointment.find({ doctorId: req.params.doctorId });
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET appointments by patient ID
router.get('/patient/:patientId', async (req, res) => {
  try {
    const appointments = await Appointment.find({ patientId: req.params.patientId });
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET a single appointment by ID
router.get('/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    res.json(appointment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      appointmentDate,
      appointmentTime,
      appointmentReason,
      appointmentType,
      consultingDoctor,
      doctorId,
      patientId,
      patientName,
      patientEmail,
      patientGender,
      patientAge,
      notes,
      bloodPressure,
      glucoseLevel,
      heartRate
    } = req.body;

    // Create the appointment
    const newAppointment = new Appointment({
      appointmentId: "APT-" + Date.now(),
      patientName,
      patientEmail,
      patientGender,
      patientAge,
      appointmentDate,
      appointmentTime,
      appointmentReason,
      appointmentType,
      consultingDoctor,
      notes: notes || '',
      doctorId,
      patientId,
      status: 'Scheduled'
    });

    await newAppointment.save();

    // If vitals were provided, update the patient record
    if (bloodPressure || glucoseLevel || heartRate) {
      const updateFields = {};
      if (bloodPressure) updateFields.bloodPressure = bloodPressure;
      if (glucoseLevel) updateFields.glucoseLevel = glucoseLevel;
      if (heartRate) updateFields.heartRate = heartRate;

      await Patient.findByIdAndUpdate(patientId, updateFields, { new: true });
    }

    // Create notification for the doctor
    const doctorUser = await User.findOne({ doctorId });
    if (doctorUser) {
      const notification = new Notification({
        userId: doctorUser._id,
        message: `New appointment booked by ${patientName} on ${new Date(appointmentDate).toLocaleDateString()}`,
        type: 'appointment_booked',
        link: `/doctor/appointments`
      });
      await notification.save();
    }

    res.status(201).json({
      message: 'Appointment created',
      appointment: newAppointment
    });

  } catch (err) {
    console.error("Validation Error:", err);
    res.status(400).json({ error: err.message });
  }
});


// PUT update an appointment
router.put('/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    res.json({ message: 'Appointment updated', appointment });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE an appointment
router.delete('/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    res.json({ message: 'Appointment deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Accept appointment (protected, doctor only? but for now any authenticated user with right doctorId)
router.patch('/:id/accept', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Optional: check if logged-in doctor is the one assigned
    // if (req.user.role !== 'doctor' || appointment.doctorId.toString() !== req.user.doctorId) {
    //   return res.status(403).json({ message: 'Unauthorized' });
    // }

    appointment.status = 'Accepted';
    await appointment.save();
    // Create notification for patient
    const patientUser = await User.findOne({ patientId: appointment.patientId });
    if (patientUser) {
      const notification = new Notification({
        userId: patientUser._id,
        message: `Your appointment with Dr. ${appointment.consultingDoctor} on ${new Date(appointment.appointmentDate).toLocaleDateString()} has been accepted.`,
        type: 'appointment_accepted',
        link: `/patient/appointments`
      });
      await notification.save();
    }
    // Send email
    try {
      await sendAppointmentAcceptedEmail(
        appointment.patientEmail,
        appointment.patientName,
        appointment.consultingDoctor,
        appointment.appointmentDate,
        appointment.appointmentTime
      );
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
    }

    // Create or update chat
    const doctorName = appointment.consultingDoctor;
    const patientName = appointment.patientName;
    const doctorId = appointment.doctorId;
    const patientId = appointment.patientId;

    let chat = await Chat.findOne({ doctorId, patientId, appointmentId: appointment._id });

    const messageText = `Your appointment on ${new Date(appointment.appointmentDate).toLocaleDateString()} at ${appointment.appointmentTime} has been accepted.`;

    if (chat) {
      chat.messages.push({
        sender: doctorName,
        text: messageText,
        timestamp: new Date()
      });
      chat.lastUpdated = new Date();
    } else {
      chat = new Chat({
        doctorId,
        doctorName,
        patientId,
        patientName,
        appointmentId: appointment._id,
        subject: appointment.appointmentReason,
        messages: [{
          sender: doctorName,
          text: messageText,
          timestamp: new Date()
        }],
        lastUpdated: new Date()
      });
    }
    await chat.save();

    res.json({ message: 'Appointment accepted, email and chat created', appointment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Mark appointment as completed (doctor only)
router.patch('/:id/complete', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    appointment.status = 'Completed';
    await appointment.save();
    res.json({ message: 'Appointment marked as completed', appointment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Reschedule appointment (doctor only, after acceptance)
router.patch('/:id/reschedule', auth, authorize('doctor'), async (req, res) => {
  try {
    const { appointmentDate, appointmentTime } = req.body;
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    if (appointment.status !== 'Accepted') {
      return res.status(400).json({ message: 'Only accepted appointments can be rescheduled' });
    }
    appointment.appointmentDate = appointmentDate;
    appointment.appointmentTime = appointmentTime;
    await appointment.save();

    // Notify patient
    const patientUser = await User.findOne({ patientId: appointment.patientId });
    if (patientUser) {
      const notification = new Notification({
        userId: patientUser._id,
        message: `Your appointment with Dr. ${appointment.consultingDoctor} has been rescheduled to ${new Date(appointmentDate).toLocaleDateString()} at ${appointmentTime}.`,
        type: 'appointment_rescheduled',
        link: `/patient/appointments`
      });
      await notification.save();
    }

    res.json({ message: 'Appointment rescheduled', appointment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
module.exports = router;