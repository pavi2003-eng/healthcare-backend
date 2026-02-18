const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const auth = require('../middleware/auth');
const authorize = require('../middleware/role');
const bcrypt = require('bcryptjs');
const Appointment = require('../models/Appointment');

// All admin routes require authentication and admin role
router.use(auth, authorize('admin'));

// ==================== DOCTORS ====================

// GET all doctors (with user account info)
router.get('/doctors', async (req, res) => {
  try {
    const doctors = await Doctor.find().populate('userId', 'email role');
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create a new doctor (also creates a user account)
router.post('/doctors', async (req, res) => {
  try {
    const { fullName, email, password, gender, contactNumber, specialist, designation } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });

    // Create user with role 'doctor'
    user = new User({
      name: fullName,
      email,
      password, // will be hashed by pre-save hook
      role: 'doctor'
    });
    await user.save();

    // Create doctor profile
    const doctor = new Doctor({
      userId: user._id,
      fullName,
      gender,
      email,
      contactNumber,
      specialist: specialist || [],
      designation
    });
    await doctor.save();

    // Link doctorId to user
    user.doctorId = doctor._id;
    await user.save();

    res.status(201).json({ message: 'Doctor created successfully', doctor });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update a doctor
router.put('/doctors/:id', async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    res.json({ message: 'Doctor updated', doctor });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE a doctor (also delete user)
router.delete('/doctors/:id', async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

    // Delete associated user
    await User.findByIdAndDelete(doctor.userId);
    // Delete doctor
    await doctor.deleteOne();

    res.json({ message: 'Doctor and user deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== PATIENTS ====================

// GET all patients
router.get('/patients', async (req, res) => {
  try {
    const patients = await Patient.find().populate('userId', 'email role');
    res.json(patients);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create a patient manually (optional)
router.post('/patients', async (req, res) => {
  try {
    const { name, email, password, age, gender, bloodPressure, glucoseLevel, heartRate } = req.body;

    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });

    user = new User({ name, email, password, role: 'patient' });
    await user.save();

    const patient = new Patient({
      userId: user._id,
      name,
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
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update a patient
router.put('/patients/:id', async (req, res) => {
  try {
    const patient = await Patient.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    res.json({ message: 'Patient updated', patient });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE a patient
router.delete('/patients/:id', async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    await User.findByIdAndDelete(patient.userId);
    await patient.deleteOne();

    res.json({ message: 'Patient and user deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Add these inside admin router after auth
// GET counts
router.get('/users/count', async (req, res) => {
  try {
    const count = await User.countDocuments();
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/doctors/count', async (req, res) => {
  try {
    const count = await Doctor.countDocuments();
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/patients/count', async (req, res) => {
  try {
    const count = await Patient.countDocuments();
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/appointments/count', async (req, res) => {
  try {
    const count = await Appointment.countDocuments();
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.get('/critical-patients/count', async (req, res) => {
  try {
    const criticalCount = await Patient.find({
      $or: [
        { bloodPressure: { $gt: 140 } },
        { glucoseLevel: { $gt: 140 } }
      ]
    }).countDocuments();
    res.json({ count: criticalCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== DASHBOARD DATA ====================
router.get('/dashboard-data', auth, authorize('admin'), async (req, res) => {
  try {
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

    // Overall risk categories (static)
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

    // ---- NEW: Daily risk trend for last 7 days (wavy area chart) ----
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
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.get('/high-risk-appointments', auth, authorize('admin'), async (req, res) => {
  try {
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
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
module.exports = router;