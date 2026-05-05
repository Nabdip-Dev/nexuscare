const User = require('../models/User.model');
const Doctor = require('../models/Doctor.model');
const { generateToken } = require('../utils/jwt');
const { sendEmail, emailTemplates } = require('../services/email.service');
const { validationResult } = require('express-validator');

// Register new user
exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, email, password, role = 'patient', phone } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered.' });
    }

    const allowedPublicRoles = ['patient', 'doctor'];
    if (!allowedPublicRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role.' });
    }

    const user = new User({ name, email, password, role, phone });
    const otp = user.generateOTP();
    await user.save();

    // Send OTP
    const { subject, html } = emailTemplates.otpVerification(name, otp);
    await sendEmail({ to: email, subject, html });

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please verify your email with the OTP sent.',
      data: { userId: user._id, email }
    });
  } catch (error) {
    next(error);
  }
};

// Verify OTP
exports.verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required.' });
    }

    const user = await User.findOne({ email }).select('+otp');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'Account already verified.' });
    }
    if (!user.isOTPValid(otp)) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
    }

    user.isVerified = true;
    user.otp = undefined;
    await user.save();

    const token = generateToken(user._id, user.role);

    res.json({
      success: true,
      message: 'Email verified successfully.',
      data: { token, user: user.toJSON() }
    });
  } catch (error) {
    next(error);
  }
};

// Resend OTP
exports.resendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email }).select('+otp');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    if (user.isVerified) return res.status(400).json({ success: false, message: 'Already verified.' });

    const otp = user.generateOTP();
    await user.save();

    const { subject, html } = emailTemplates.otpVerification(user.name, otp);
    await sendEmail({ to: email, subject, html });

    res.json({ success: true, message: 'OTP resent successfully.' });
  } catch (error) {
    next(error);
  }
};

// Login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }
    if (!user.isVerified) {
      return res.status(401).json({ success: false, message: 'Please verify your email first.' });
    }
    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account deactivated. Contact support.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user._id, user.role);

    // If doctor, fetch doctor profile
    let doctorProfile = null;
    if (user.role === 'doctor') {
      doctorProfile = await Doctor.findOne({ user: user._id }).populate('specializations', 'name');
    }

    res.json({
      success: true,
      message: 'Login successful.',
      data: {
        token,
        user: user.toJSON(),
        doctorProfile
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get current user
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    let extra = {};
    if (user.role === 'doctor') {
      extra.doctorProfile = await Doctor.findOne({ user: user._id })
        .populate('specializations', 'name slug icon');
    }
    res.json({ success: true, data: { user, ...extra } });
  } catch (error) {
    next(error);
  }
};

// Change password
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Current password is incorrect.' });

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    next(error);
  }
};

// Admin: create staff accounts
exports.createStaff = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const allowed = ['receptionist', 'admin'];
    if (!allowed.includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid staff role.' });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: 'Email already exists.' });

    const user = new User({ name, email, password, role, isVerified: true });
    await user.save();

    res.status(201).json({ success: true, message: 'Staff account created.', data: { user } });
  } catch (error) {
    next(error);
  }
};
