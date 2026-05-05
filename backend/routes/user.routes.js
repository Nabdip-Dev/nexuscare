// user.routes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const { uploadAvatar } = require('../middlewares/upload.middleware');
const User = require('../models/User.model');
const Doctor = require('../models/Doctor.model');

router.get('/profile', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, data: { user } });
  } catch (e) { next(e); }
});

router.put('/profile', protect, async (req, res, next) => {
  try {
    const allowed = ['name', 'phone', 'dateOfBirth', 'gender', 'address', 'bloodGroup', 'allergies', 'medicalHistory', 'emergencyContact', 'notificationPreferences'];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.json({ success: true, data: { user } });
  } catch (e) { next(e); }
});

router.post('/avatar', protect, uploadAvatar, async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded.' });
    const user = await User.findByIdAndUpdate(req.user._id, { avatar: { url: req.file.path, publicId: req.file.filename } }, { new: true });
    res.json({ success: true, data: { avatar: user.avatar } });
  } catch (e) { next(e); }
});

// Doctor registration (after user account)
router.post('/register-doctor', protect, async (req, res, next) => {
  try {
    if (req.user.role !== 'doctor') return res.status(403).json({ success: false, message: 'Only doctor accounts can register doctor profiles.' });
    const existing = await Doctor.findOne({ user: req.user._id });
    if (existing) return res.status(400).json({ success: false, message: 'Doctor profile already exists.' });

    const { licenseNumber, specializations, qualifications, experience, bio, consultationFee, consultationDuration, schedule, languages, hospitalAffiliation } = req.body;
    const doctor = await Doctor.create({
      user: req.user._id, licenseNumber, specializations, qualifications, experience,
      bio, consultationFee, consultationDuration, schedule, languages, hospitalAffiliation
    });
    res.status(201).json({ success: true, message: 'Doctor profile created. Awaiting admin approval.', data: { doctor } });
  } catch (e) { next(e); }
});

module.exports = router;
