const express = require('express');
const router = express.Router();
const { getDoctors, getDoctorById, getAvailableSlots, getMyProfile, updateProfile, getDashboardStats, addReview } = require('../controllers/doctor.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

router.get('/', getDoctors);
router.get('/my-profile', protect, authorize('doctor'), getMyProfile);
router.get('/dashboard', protect, authorize('doctor'), getDashboardStats);
router.put('/profile', protect, authorize('doctor'), updateProfile);
router.get('/:id', getDoctorById);
router.get('/:id/slots', getAvailableSlots);
router.post('/:id/review', protect, authorize('patient'), addReview);

module.exports = router;
