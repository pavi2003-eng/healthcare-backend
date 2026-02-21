const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorsController');
const auth = require('../../common/middleware/auth');
const authorize = require('../../common/middleware/role');

router.get('/', doctorController.getAllDoctors);
router.get('/:id', doctorController.getDoctorById);
router.post('/', auth, authorize('admin'), doctorController.createDoctor);
router.put('/:id', auth, authorize('admin'), doctorController.updateDoctor);
router.delete('/:id', auth, authorize('admin'), doctorController.deleteDoctor);

module.exports = router;