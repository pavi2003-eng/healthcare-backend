const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientsController');
const auth = require('../../common/middleware/auth');
const authorize = require('../../common/middleware/role');

router.get('/', auth, authorize('admin'), patientController.getAllPatients);
router.get('/:id', auth, patientController.getPatientById);
router.post('/', auth, authorize('admin'), patientController.createPatient);
router.put('/:id', auth, patientController.updatePatient);
router.delete('/:id', auth, authorize('admin'), patientController.deletePatient);

module.exports = router;