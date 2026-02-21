const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const User = require('../models/User');
const Chat = require('../models/Chat');
const Notification = require('../models/Notification');
const { sendAppointmentAcceptedEmail } = require('../../common/utils/email');
const asyncHandler = require('../../common/utils/asyncHandler');

// GET all appointments (admin only)
exports.getAllAppointments = asyncHandler(async (req, res) => {
  const appointments = await Appointment.find();
  res.json(appointments);
});

// GET appointments by doctor ID
exports.getAppointmentsByDoctor = asyncHandler(async (req, res) => {
  const appointments = await Appointment.find({ doctorId: req.params.doctorId });
  res.json(appointments);
});

// GET appointments by patient ID
exports.getAppointmentsByPatient = asyncHandler(async (req, res) => {
  const appointments = await Appointment.find({ patientId: req.params.patientId });
  res.json(appointments);
});

// GET a single appointment by ID
exports.getAppointmentById = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) {
    return res.status(404).json({ message: 'Appointment not found' });
  }
  res.json(appointment);
});

// POST a new appointment (patient books)
exports.createAppointment = asyncHandler(async (req, res) => {
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
});

// PUT update an appointment (admin or doctor)
exports.updateAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!appointment) {
    return res.status(404).json({ message: 'Appointment not found' });
  }
  res.json({ message: 'Appointment updated', appointment });
});

// DELETE an appointment (admin only)
exports.deleteAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findByIdAndDelete(req.params.id);
  if (!appointment) {
    return res.status(404).json({ message: 'Appointment not found' });
  }
  res.json({ message: 'Appointment deleted' });
});

// PATCH accept appointment (doctor)
exports.acceptAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) {
    return res.status(404).json({ message: 'Appointment not found' });
  }

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

  let chat = await Chat.findOne({ doctorId, patientId });

  const messageText = `Your appointment on ${new Date(appointment.appointmentDate).toLocaleDateString()} at ${appointment.appointmentTime} has been accepted. You can communicate here.`;

  if (!chat) {
    chat = new Chat({
      doctorId,
      patientId,
      doctorName,
      patientName,
      subject: appointment.appointmentReason,
      appointmentId: appointment._id
    });
    await chat.save();
  }

  // Get sender ID (doctor's user ID)
  const doctorUser = await User.findOne({ doctorId });
  
  // Add system message
  const message = new Message({
    chatId: chat._id,
    senderId: doctorUser?._id || req.user.userId,
    senderName: doctorName,
    senderRole: 'doctor',
    text: messageText
  });
  await message.save();

  chat.lastMessageAt = new Date();
  await chat.save();

  res.json({ message: 'Appointment accepted, email and chat created', appointment });
});

// PATCH complete appointment (doctor)
exports.completeAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) {
    return res.status(404).json({ message: 'Appointment not found' });
  }

  appointment.status = 'Completed';
  await appointment.save();
  res.json({ message: 'Appointment marked as completed', appointment });
});

// PATCH reschedule appointment (doctor only, after acceptance)
exports.rescheduleAppointment = asyncHandler(async (req, res) => {
  const { appointmentDate, appointmentTime } = req.body;
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) {
    return res.status(404).json({ message: 'Appointment not found' });
  }
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
});