// receptionist.routes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth.middleware');
const Appointment = require('../models/Appointment.model');
const User = require('../models/User.model');
const Doctor = require('../models/Doctor.model');

const recepAuth = [protect, authorize('receptionist', 'admin')];

router.post('/appointments', ...recepAuth, async (req, res, next) => {
  try {
    const { patientId, doctorId, date, timeSlot, type, reasonForVisit, isEmergency } = req.body;
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found.' });

    const appointmentDate = new Date(date); appointmentDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(appointmentDate); nextDay.setDate(nextDay.getDate() + 1);

    const conflict = await Appointment.findOne({ doctor: doctorId, date: { $gte: appointmentDate, $lt: nextDay }, 'timeSlot.startTime': timeSlot.startTime, status: { $nin: ['cancelled'] } });
    if (conflict) return res.status(409).json({ success: false, message: 'Slot already booked.' });

    const tokenCount = await Appointment.countDocuments({ doctor: doctorId, date: { $gte: appointmentDate, $lt: nextDay }, status: { $nin: ['cancelled'] } });
    const appointment = await Appointment.create({ patient: patientId, doctor: doctorId, date: appointmentDate, timeSlot, type: type || 'in-person', reasonForVisit, isEmergency: isEmergency || false, tokenNumber: tokenCount + 1, fee: doctor.consultationFee, createdBy: req.user._id });
    res.status(201).json({ success: true, data: { appointment } });
  } catch (e) { next(e); }
});

router.get('/queue/:doctorId', ...recepAuth, async (req, res, next) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const queue = await Appointment.find({ doctor: req.params.doctorId, date: { $gte: today, $lt: tomorrow }, status: { $ne: 'cancelled' } })
      .populate('patient', 'name phone avatar')
      .sort('tokenNumber').lean();
    res.json({ success: true, data: { queue } });
  } catch (e) { next(e); }
});

router.get('/search-patient', ...recepAuth, async (req, res, next) => {
  try {
    const { q } = req.query;
    const patients = await User.find({ role: 'patient', $or: [{ name: { $regex: q, $options: 'i' } }, { email: { $regex: q, $options: 'i' } }, { phone: { $regex: q, $options: 'i' } }] }).limit(10).select('name email phone avatar dateOfBirth').lean();
    res.json({ success: true, data: { patients } });
  } catch (e) { next(e); }
});

module.exports = router;
