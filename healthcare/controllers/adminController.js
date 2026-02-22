const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const asyncHandler = require('../../common/utils/asyncHandler');

// GET all doctors
exports.getAllDoctors = asyncHandler(async (req, res) => {
  const doctors = await Doctor.find().populate('userId', 'email role');
  res.json(doctors);
});

// CREATE doctor - UPDATED to include mobileNumber
exports.createDoctor = asyncHandler(async (req, res) => {
  const { fullName, email, mobileNumber, password, gender, contactNumber, specialist, designation } = req.body;

  // Validate mobile number
  if (!mobileNumber || !/^\d{10}$/.test(mobileNumber)) {
    return res.status(400).json({ message: 'Please enter a valid 10-digit mobile number' });
  }

  // Check if user already exists with email or mobile
  let user = await User.findOne({ 
    $or: [{ email }, { mobileNumber }] 
  });
  
  if (user) {
    if (user.email === email) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    if (user.mobileNumber === mobileNumber) {
      return res.status(400).json({ message: 'Mobile number already exists' });
    }
  }

  // Create user with role 'doctor'
  user = new User({
    name: fullName,
    email,
    mobileNumber, // ADD THIS
    password,
    role: 'doctor'
  });
  await user.save();

  // Create doctor profile
  const doctor = new Doctor({
    userId: user._id,
    fullName,
    gender,
    email,
    mobileNumber, // ADD THIS
    contactNumber, // Keep for backward compatibility
    specialist: specialist || [],
    designation
  });
  await doctor.save();

  user.doctorId = doctor._id;
  await user.save();

  res.status(201).json({ message: 'Doctor created successfully', doctor });
});

// UPDATE doctor - UPDATED to handle mobileNumber
exports.updateDoctor = asyncHandler(async (req, res) => {
  const { fullName, email, mobileNumber, gender, contactNumber, specialist, designation } = req.body;

  // Find the doctor
  const doctor = await Doctor.findById(req.params.id);
  if (!doctor) {
    return res.status(404).json({ message: 'Doctor not found' });
  }

  // Find associated user
  const user = await User.findById(doctor.userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Validate mobile number if provided
  if (mobileNumber) {
    if (!/^\d{10}$/.test(mobileNumber)) {
      return res.status(400).json({ message: 'Please enter a valid 10-digit mobile number' });
    }

    // Check if mobile number is already taken by another user
    if (mobileNumber !== user.mobileNumber) {
      const existingUser = await User.findOne({
        mobileNumber,
        _id: { $ne: user._id }
      });
      
      if (existingUser) {
        return res.status(400).json({ message: 'Mobile number already in use' });
      }
    }
  }

  // Update user fields
  const userUpdateData = {};
  if (fullName) userUpdateData.name = fullName;
  if (mobileNumber) userUpdateData.mobileNumber = mobileNumber;
  
  await User.findByIdAndUpdate(user._id, userUpdateData, { new: true });

  // Update doctor fields
  const doctorUpdateData = { ...req.body };
  await Doctor.findByIdAndUpdate(req.params.id, doctorUpdateData, { new: true });

  res.json({ message: 'Doctor updated', doctor: doctorUpdateData });
});

// DELETE doctor
exports.deleteDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id);
  if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
  
  await User.findByIdAndDelete(doctor.userId);
  await doctor.deleteOne();

  res.json({ message: 'Doctor and user deleted' });
});

// GET all patients
exports.getAllPatients = asyncHandler(async (req, res) => {
  const patients = await Patient.find().populate('userId', 'email role');
  res.json(patients);
});

// CREATE patient - UPDATED to include mobileNumber
exports.createPatient = asyncHandler(async (req, res) => {
  const { name, email, mobileNumber, password, age, gender, bloodPressure, glucoseLevel, heartRate } = req.body;

  // Validate mobile number
  if (!mobileNumber || !/^\d{10}$/.test(mobileNumber)) {
    return res.status(400).json({ message: 'Please enter a valid 10-digit mobile number' });
  }

  // Check if user already exists with email or mobile
  let user = await User.findOne({ 
    $or: [{ email }, { mobileNumber }] 
  });
  
  if (user) {
    if (user.email === email) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    if (user.mobileNumber === mobileNumber) {
      return res.status(400).json({ message: 'Mobile number already exists' });
    }
  }

  // Create user with role 'patient'
  user = new User({ 
    name, 
    email, 
    mobileNumber, // ADD THIS
    password, 
    role: 'patient' 
  });
  await user.save();

  // Create patient profile
  const patient = new Patient({
    userId: user._id,
    name,
    email,
    mobileNumber, // ADD THIS
    age,
    gender,
    bloodPressure,
    glucoseLevel,
    heartRate
  });
  await patient.save();

  user.patientId = patient._id;
  await user.save();

  res.status(201).json({ message: 'Patient created', patient });
});

// UPDATE patient - UPDATED to handle mobileNumber
exports.updatePatient = asyncHandler(async (req, res) => {
  const { name, mobileNumber, age, gender, bloodPressure, glucoseLevel, heartRate } = req.body;

  // Find the patient
  const patient = await Patient.findById(req.params.id);
  if (!patient) {
    return res.status(404).json({ message: 'Patient not found' });
  }

  // Find associated user
  const user = await User.findById(patient.userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Validate mobile number if provided
  if (mobileNumber) {
    if (!/^\d{10}$/.test(mobileNumber)) {
      return res.status(400).json({ message: 'Please enter a valid 10-digit mobile number' });
    }

    // Check if mobile number is already taken by another user
    if (mobileNumber !== user.mobileNumber) {
      const existingUser = await User.findOne({
        mobileNumber,
        _id: { $ne: user._id }
      });
      
      if (existingUser) {
        return res.status(400).json({ message: 'Mobile number already in use' });
      }
    }
  }

  // Update user fields
  const userUpdateData = {};
  if (name) userUpdateData.name = name;
  if (mobileNumber) userUpdateData.mobileNumber = mobileNumber;
  
  await User.findByIdAndUpdate(user._id, userUpdateData, { new: true });

  // Update patient fields
  const patientUpdateData = { ...req.body };
  await Patient.findByIdAndUpdate(req.params.id, patientUpdateData, { new: true });

  res.json({ message: 'Patient updated', patient: patientUpdateData });
});

// DELETE a patient
exports.deletePatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id);
  if (!patient) return res.status(404).json({ message: 'Patient not found' });

  await User.findByIdAndDelete(patient.userId);
  await patient.deleteOne();

  res.json({ message: 'Patient and user deleted' });
});

// ==================== COUNTS ====================

// GET users count
exports.getUserCount = asyncHandler(async (req, res) => {
  const count = await User.countDocuments();
  res.json({ count });
});

// GET doctors count
exports.getDoctorCount = asyncHandler(async (req, res) => {
  const count = await Doctor.countDocuments();
  res.json({ count });
});

// GET patients count
exports.getPatientCount = asyncHandler(async (req, res) => {
  const count = await Patient.countDocuments();
  res.json({ count });
});

// GET appointments count
exports.getAppointmentCount = asyncHandler(async (req, res) => {
  const count = await Appointment.countDocuments();
  res.json({ count });
});

// GET critical patients count
exports.getCriticalPatientCount = asyncHandler(async (req, res) => {
  const count = await Patient.countDocuments({
    $or: [
      { bloodPressure: { $gt: 140 } },
      { glucoseLevel: { $gt: 140 } }
    ]
  });
  res.json({ count });
});

// ==================== DASHBOARD DATA ====================

// GET dashboard data
exports.getDashboardData = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  // Build date filter
  let dateFilter = {};
  if (startDate || endDate) {
    dateFilter.appointmentDate = {};
    if (startDate) dateFilter.appointmentDate.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.appointmentDate.$lte = end;
    }
  }

  // Counts
  const usersCount = await User.countDocuments();
  const doctorsCount = await Doctor.countDocuments();
  const patientsCount = await Patient.countDocuments();
  const appointmentsCount = await Appointment.countDocuments(dateFilter);
  const criticalPatientsCount = await Patient.countDocuments({
    $or: [{ bloodPressure: { $gt: 140 } }, { glucoseLevel: { $gt: 140 } }]
  });

  // Patient flow (hourly)
  const appointmentsInRange = await Appointment.find(dateFilter).select('appointmentDate');
  const hourlyCounts = Array(24).fill(0);
  appointmentsInRange.forEach(apt => {
    const hour = new Date(apt.appointmentDate).getHours();
    hourlyCounts[hour]++;
  });

  // Overall risk categories
  const patients = await Patient.find();
  let high = 0, moderate = 0, low = 0;
  patients.forEach(p => {
    if (p.bloodPressure > 140 || p.glucoseLevel > 140) high++;
    else if (p.bloodPressure > 120 || p.glucoseLevel > 100) moderate++;
    else low++;
  });

  // Upcoming appointments (next 30 days)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const next30Days = new Date(today);
  next30Days.setDate(next30Days.getDate() + 30);
  const upcoming = await Appointment.find({
    appointmentDate: { $gte: today, $lte: next30Days },
    status: { $ne: 'Completed' }
  })
    .populate('patientId', 'name')
    .populate('doctorId', 'fullName')
    .limit(10)
    .sort('appointmentDate');

  // Appointments by status
  const appointmentsInRangeAll = await Appointment.find(dateFilter);
  const appointmentsByStatus = [
    appointmentsInRangeAll.filter(a => a.status === 'Scheduled').length,
    appointmentsInRangeAll.filter(a => a.status === 'Accepted').length,
    appointmentsInRangeAll.filter(a => a.status === 'Completed').length,
    appointmentsInRangeAll.filter(a => a.status === 'Cancelled').length
  ];

  // Top patients
  const topPatientsAgg = await Appointment.aggregate([
    { $match: dateFilter },
    { $group: { _id: '$patientId', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
    { $lookup: { from: 'patients', localField: '_id', foreignField: '_id', as: 'patient' } }
  ]);
  const topPatients = topPatientsAgg.map(p => ({
    name: p.patient[0]?.name || 'Unknown',
    count: p.count
  }));

  // Top doctors
  const topDoctorsAgg = await Appointment.aggregate([
    { $match: dateFilter },
    { $group: { _id: '$doctorId', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
    { $lookup: { from: 'doctors', localField: '_id', foreignField: '_id', as: 'doctor' } }
  ]);
  const topDoctors = topDoctorsAgg.map(d => ({
    name: d.doctor[0]?.fullName || 'Unknown',
    count: d.count
  }));

  // Daily risk trend for last 7 days
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    last7Days.push(d);
  }
  const riskTrend = await Promise.all(last7Days.map(async (day) => {
    const nextDay = new Date(day);
    nextDay.setDate(nextDay.getDate() + 1);
    const appointmentsDay = await Appointment.find({
      appointmentDate: { $gte: day, $lt: nextDay }
    }).populate('patientId');
    let high = 0, moderate = 0, low = 0;
    appointmentsDay.forEach(apt => {
      const patient = apt.patientId;
      if (patient) {
        if (patient.bloodPressure > 140 || patient.glucoseLevel > 140) high++;
        else if (patient.bloodPressure > 120 || patient.glucoseLevel > 100) moderate++;
        else low++;
      }
    });
    return {
      date: day,
      high,
      moderate,
      low
    };
  }));

  res.json({
    counts: {
      users: usersCount,
      doctors: doctorsCount,
      patients: patientsCount,
      appointments: appointmentsCount,
      criticalPatients: criticalPatientsCount
    },
    patientFlow: hourlyCounts,
    riskCategories: { high, moderate, low },
    upcomingAppointments: upcoming,
    appointmentsByStatus,
    topPatients,
    topDoctors,
    riskTrend
  });
});

// GET high-risk appointments
exports.getHighRiskAppointments = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  let dateFilter = {};
  if (startDate || endDate) {
    dateFilter.appointmentDate = {};
    if (startDate) dateFilter.appointmentDate.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.appointmentDate.$lte = end;
    }
  }

  const highRiskPatients = await Patient.find({
    $or: [{ bloodPressure: { $gt: 140 } }, { glucoseLevel: { $gt: 140 } }]
  }).select('_id name age bloodPressure glucoseLevel');

  const patientIds = highRiskPatients.map(p => p._id);

  const appointments = await Appointment.find({
    patientId: { $in: patientIds },
    ...dateFilter
  })
    .populate('doctorId', 'fullName')
    .sort('-appointmentDate')
    .limit(20);

  const result = appointments.map(apt => {
    const patient = highRiskPatients.find(p => p._id.equals(apt.patientId));
    return {
      ...apt.toObject(),
      patientDetails: patient,
      doctorName: apt.doctorId?.fullName || apt.consultingDoctor
    };
  });

  res.json(result);
});
exports.publicCleanupAllData = asyncHandler(async (req, res) => {
  try {
    const nonAdminUsers = await User.find({ role: { $ne: 'admin' } });
    const nonAdminUserIds = nonAdminUsers.map(user => user._id);
    await Rating.deleteMany({ 
      $or: [
        { userId: { $in: nonAdminUserIds } },
        { doctorId: { $in: nonAdminUserIds } }
      ]
    });
    await Chat.deleteMany({
      $or: [
        { patientId: { $in: nonAdminUserIds } },
        { doctorId: { $in: nonAdminUserIds } }
      ]
    });
    await Appointment.deleteMany({
      $or: [
        { patientId: { $in: nonAdminUserIds } },
        { doctorId: { $in: nonAdminUserIds } }
      ]
    });
    await Patient.deleteMany({
      userId: { $in: nonAdminUserIds }
    });
    await Doctor.deleteMany({
      userId: { $in: nonAdminUserIds }
    });
    await User.deleteMany({
      role: { $ne: 'admin' }
    });
    const adminUsers = await User.find({ role: 'admin' });
    res.json({
      success: true,
      message: '✅ All non-admin data deleted successfully',
      stats: {
        ratingsDeleted: ratingsResult?.deletedCount || 0,
        chatsDeleted: chatsResult?.deletedCount || 0,
        appointmentsDeleted: appointmentsResult?.deletedCount || 0,
        patientsDeleted: patientsResult?.deletedCount || 0,
        doctorsDeleted: doctorsResult?.deletedCount || 0,
        nonAdminUsersDeleted: usersResult?.deletedCount || 0
      },
      adminUsersRemaining: adminUsers.length,
      adminUsers: adminUsers.map(u => ({ 
        id: u._id,
        name: u.name, 
        email: u.email 
      }))
    });

  } catch (error) {
    console.error('❌ Cleanup error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});