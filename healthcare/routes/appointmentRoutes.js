const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentsController');
const auth = require('../../common/middleware/auth');
const authorize = require('../../common/middleware/role');

// GET all appointments (admin only)
router.get('/', auth, authorize('admin'), appointmentController.getAllAppointments);

// GET appointments by doctor ID
router.get('/doctor/:doctorId', auth, appointmentController.getAppointmentsByDoctor);

// GET appointments by patient ID
router.get('/patient/:patientId', auth, appointmentController.getAppointmentsByPatient);

// GET a single appointment by ID
router.get('/:id', auth, appointmentController.getAppointmentById);

// POST a new appointment (patient books)
router.post('/', auth, appointmentController.createAppointment);

// PUT update an appointment (admin or doctor)
router.put('/:id', auth, appointmentController.updateAppointment);

// DELETE an appointment (admin only)
router.delete('/:id', auth, authorize('admin'), appointmentController.deleteAppointment);

// PATCH accept appointment (doctor)
router.patch('/:id/accept', auth, authorize('doctor'), appointmentController.acceptAppointment);

// PATCH complete appointment (doctor)
router.patch('/:id/complete', auth, authorize('doctor'), appointmentController.completeAppointment);

// PATCH reschedule appointment (doctor)
router.patch('/:id/reschedule', auth, authorize('doctor'), appointmentController.rescheduleAppointment);

module.exports = router;