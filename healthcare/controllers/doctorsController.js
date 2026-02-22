const Doctor = require('../models/Doctor');
const User = require('../models/User');
const asyncHandler = require('../../common/utils/asyncHandler');

// GET all doctors (public) – includes profile images
exports.getAllDoctors = asyncHandler(async (req, res) => {
  // Populate the userId field to get the user's profilePicture
  const doctors = await Doctor.find().populate('userId', 'profilePicture mobileNumber');
  
  // Map each doctor to include profileImage from the populated user
  const doctorsWithImage = doctors.map(doc => {
    const docObj = doc.toObject();
    docObj.profileImage = doc.userId?.profilePicture || null;
    return docObj;
  });
  
  res.json(doctorsWithImage);
});

// GET a single doctor by ID with profile image
exports.getDoctorById = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id).populate('userId', 'profilePicture mobileNumber');
  if (!doctor) {
    return res.status(404).json({ message: 'Doctor not found' });
  }
  
  const doctorObj = doctor.toObject();
  doctorObj.profileImage = doctor.userId?.profilePicture || null;
  
  res.json(doctorObj);
});

// POST a new doctor (admin only) – also creates user account
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
    mobileNumber, // ADD THIS
    contactNumber, // Keep for backward compatibility
    specialist: specialist || [],
    designation
  });
  await doctor.save();

  // Link doctorId to user
  user.doctorId = doctor._id;
  await user.save();

  res.status(201).json({ message: 'Doctor created successfully', doctor });
});

// PUT update a doctor (admin only)
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

// DELETE a doctor (admin only) – also deletes user
exports.deleteDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id);
  if (!doctor) {
    return res.status(404).json({ message: 'Doctor not found' });
  }

  // Delete associated user
  await User.findByIdAndDelete(doctor.userId);
  // Delete doctor
  await doctor.deleteOne();

  res.json({ message: 'Doctor and user deleted' });
});