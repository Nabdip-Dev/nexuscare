// auth.routes.js
const express = require('express');
const router = express.Router();
const { register, verifyOTP, resendOTP, login, getMe, changePassword, createStaff } = require('../controllers/auth.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');
const { authLimiter, otpLimiter } = require('../middlewares/rateLimiter');

router.post('/register', authLimiter, register);
router.post('/verify-otp', otpLimiter, verifyOTP);
router.post('/resend-otp', otpLimiter, resendOTP);
router.post('/login', authLimiter, login);
router.get('/me', protect, getMe);
router.put('/change-password', protect, changePassword);
router.post('/create-staff', protect, authorize('admin'), createStaff);

module.exports = router;
