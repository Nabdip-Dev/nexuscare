// appointment.routes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/appointment.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

router.post('/', protect, authorize('patient', 'receptionist', 'admin'), ctrl.bookAppointment);
router.get('/my', protect, authorize('patient'), ctrl.getMyAppointments);
router.get('/doctor', protect, authorize('doctor'), ctrl.getDoctorAppointments);
router.get('/all', protect, authorize('admin', 'receptionist'), ctrl.getAllAppointments);
router.get('/patient/:patientId/history', protect, authorize('doctor', 'admin', 'receptionist'), ctrl.getPatientHistory);
router.get('/:id', protect, ctrl.getAppointment);
router.put('/:id/status', protect, ctrl.updateStatus);

module.exports = router;
