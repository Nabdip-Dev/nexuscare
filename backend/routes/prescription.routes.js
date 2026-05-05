// prescription.routes.js - save as routes/prescription.routes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/prescription.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

router.post('/', protect, authorize('doctor'), ctrl.createPrescription);
router.get('/my', protect, authorize('patient'), ctrl.getMyPrescriptions);
router.get('/doctor', protect, authorize('doctor'), ctrl.getDoctorPrescriptions);
router.get('/:id', protect, ctrl.getPrescription);
router.put('/:id', protect, authorize('doctor'), ctrl.updatePrescription);

module.exports = router;
