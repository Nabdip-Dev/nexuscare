// admin.controller.js
const User = require('../models/User.model');
const Doctor = require('../models/Doctor.model');
const Appointment = require('../models/Appointment.model');
const Prescription = require('../models/Prescription.model');
const { Report, Notification, Category, Banner } = require('../models/index');
const { get, set, KEYS } = require('../services/cache.service');

// Dashboard analytics
exports.getAnalytics = async (req, res, next) => {
  try {
    const cached = get(KEYS.ANALYTICS);
    if (cached) return res.json(cached);

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      totalUsers, totalDoctors, totalPatients, totalAppointments,
      todayAppointments, monthAppointments, pendingDoctors,
      completedAppointments, totalPrescriptions
    ] = await Promise.all([
      User.countDocuments(),
      Doctor.countDocuments({ isApproved: true }),
      User.countDocuments({ role: 'patient' }),
      Appointment.countDocuments(),
      Appointment.countDocuments({ date: { $gte: today } }),
      Appointment.countDocuments({ date: { $gte: thisMonth } }),
      Doctor.countDocuments({ isApproved: false }),
      Appointment.countDocuments({ status: 'completed' }),
      Prescription.countDocuments()
    ]);

    // Monthly appointment trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const trend = await Appointment.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const response = {
      success: true,
      data: {
        totalUsers, totalDoctors, totalPatients, totalAppointments,
        todayAppointments, monthAppointments, pendingDoctors,
        completedAppointments, totalPrescriptions, trend
      }
    };
    set(KEYS.ANALYTICS, response, 300);
    res.json(response);
  } catch (error) {
    next(error);
  }
};

// Manage users
exports.getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, search, isActive } = req.query;
    const query = {};
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];

    const skip = (Number(page) - 1) * Number(limit);
    const [users, total] = await Promise.all([
      User.find(query).sort('-createdAt').skip(skip).limit(Number(limit)).lean(),
      User.countDocuments(query)
    ]);
    res.json({ success: true, data: { users, total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
  } catch (error) { next(error); }
};

exports.updateUser = async (req, res, next) => {
  try {
    const { isActive, role } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { isActive, role }, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, data: { user } });
  } catch (error) { next(error); }
};

exports.deleteUser = async (req, res, next) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted.' });
  } catch (error) { next(error); }
};

// Approve/reject doctor
exports.approveDoctor = async (req, res, next) => {
  try {
    const { isApproved } = req.body;
    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { isApproved, approvedBy: req.user._id, approvedAt: new Date() },
      { new: true }
    ).populate('user', 'name email');

    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found.' });

    // Notify doctor
    const { createNotification } = require('../services/notification.service');
    const io = req.app.get('io');
    await createNotification(io, {
      recipient: doctor.user._id,
      type: 'doctor_approved',
      title: isApproved ? 'Profile Approved' : 'Profile Rejected',
      message: isApproved ? 'Your doctor profile has been approved! You can now receive appointments.' : 'Your doctor profile was not approved. Please contact support.'
    });

    res.json({ success: true, message: `Doctor ${isApproved ? 'approved' : 'rejected'}.`, data: { doctor } });
  } catch (error) { next(error); }
};

exports.getPendingDoctors = async (req, res, next) => {
  try {
    const doctors = await Doctor.find({ isApproved: false })
      .populate('user', 'name email avatar createdAt')
      .populate('specializations', 'name')
      .lean();
    res.json({ success: true, data: { doctors } });
  } catch (error) { next(error); }
};

module.exports.adminController = exports;
