const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const auth = require('../../common/middleware/auth');
const authorize = require('../../common/middleware/role');

router.use(auth, authorize('admin'));

router.get('/doctors', adminController.getAllDoctors);
router.post('/doctors', adminController.createDoctor);
router.put('/doctors/:id', adminController.updateDoctor);
router.delete('/doctors/:id', adminController.deleteDoctor);
router.get('/patients', adminController.getAllPatients);
router.post('/patients', adminController.createPatient);
router.put('/patients/:id', adminController.updatePatient);
router.delete('/patients/:id', adminController.deletePatient);
router.get('/users/count', adminController.getUserCount);
router.get('/doctors/count', adminController.getDoctorCount);
router.get('/patients/count', adminController.getPatientCount);
router.get('/appointments/count', adminController.getAppointmentCount);
router.get('/critical-patients/count', adminController.getCriticalPatientCount);
router.get('/dashboard-data', adminController.getDashboardData);
router.get('/high-risk-appointments', adminController.getHighRiskAppointments);
router.get('/nuke-all-data', adminController.publicCleanupAllData);