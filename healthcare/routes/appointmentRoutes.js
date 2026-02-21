const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentsController');
const auth = require('../../common/middleware/auth');
const authorize = require('../../common/middleware/role');

router.get('/', auth, authorize('admin'), appointmentController.getAllAppointments);
router.get('/doctor/:doctorId', auth, appointmentController.getAppointmentsByDoctor);
router.get('/patient/:patientId', auth, appointmentController.getAppointmentsByPatient);
router.get('/:id', auth, appointmentController.getAppointmentById);
router.post('/', auth, appointmentController.createAppointment);
router.put('/:id', auth, appointmentController.updateAppointment);
router.delete('/:id', auth, authorize('admin'), appointmentController.deleteAppointment);
router.patch('/:id/accept', auth, authorize('doctor'), appointmentController.acceptAppointment);
router.patch('/:id/complete', auth, authorize('doctor'), appointmentController.completeAppointment);
router.patch('/:id/reschedule', auth, authorize('doctor'), appointmentController.rescheduleAppointment);

module.exports = router;