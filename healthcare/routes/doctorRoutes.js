const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorsController');
const auth = require('../../common/middleware/auth');
const authorize = require('../../common/middleware/role');

// GET all doctors (public) – includes profile images
router.get('/', doctorController.getAllDoctors);

// GET a single doctor by ID (public)
router.get('/:id', doctorController.getDoctorById);

// POST a new doctor (admin only) – also creates user account
router.post('/', auth, authorize('admin'), doctorController.createDoctor);

// PUT update a doctor (admin only)
router.put('/:id', auth, authorize('admin'), doctorController.updateDoctor);

// DELETE a doctor (admin only) – also deletes user
router.delete('/:id', auth, authorize('admin'), doctorController.deleteDoctor);

module.exports = router;