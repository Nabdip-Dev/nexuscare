const Appointment = require('../models/Appointment.model');
const Doctor = require('../models/Doctor.model');
const User = require('../models/User.model');
const { invalidatePattern } = require('../services/cache.service');
const { notifyAppointmentBooked, notifyAppointmentStatusChange } = require('../services/notification.service');

// Book appointment
exports.bookAppointment = async (req, res, next) => {
  try {
    const { doctorId, date, timeSlot, type = 'in-person', reasonForVisit, symptoms, isEmergency = false } = req.body;

    const doctor = await Doctor.findById(doctorId).populate('user', 'name email');
    if (!doctor || !doctor.isApproved) {
      return res.status(404).json({ success: false, message: 'Doctor not found or not approved.' });
    }

    const appointmentDate = new Date(date);
    appointmentDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(appointmentDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Check double booking
    const existing = await Appointment.findOne({
      doctor: doctorId,
      date: { $gte: appointmentDate, $lt: nextDay },
      'timeSlot.startTime': timeSlot.startTime,
      status: { $nin: ['cancelled'] }
    });
    if (existing) {
      return res.status(409).json({ success: false, message: 'This time slot is already booked.' });
    }

    // Check patient double booking
    const patientConflict = await Appointment.findOne({
      patient: req.user._id,
      date: { $gte: appointmentDate, $lt: nextDay },
      'timeSlot.startTime': timeSlot.startTime,
      status: { $nin: ['cancelled'] }
    });
    if (patientConflict) {
      return res.status(409).json({ success: false, message: 'You already have an appointment at this time.' });
    }

    // Daily limit check
    const daySchedule = doctor.schedule.find(s => s.dayOfWeek === appointmentDate.getDay());
    if (daySchedule) {
      const dailyCount = await Appointment.countDocuments({
        doctor: doctorId,
        date: { $gte: appointmentDate, $lt: nextDay },
        status: { $nin: ['cancelled'] }
      });
      if (dailyCount >= (daySchedule.maxPatientsPerDay || 20) && !isEmergency) {
        return res.status(409).json({ success: false, message: 'Doctor has reached the daily patient limit.' });
      }
    }

    // Generate token number
    const tokenCount = await Appointment.countDocuments({
      doctor: doctorId,
      date: { $gte: appointmentDate, $lt: nextDay },
      status: { $nin: ['cancelled'] }
    });

    const appointment = await Appointment.create({
      patient: req.user._id,
      doctor: doctorId,
      date: appointmentDate,
      timeSlot,
      type,
      reasonForVisit,
      symptoms: symptoms || [],
      isEmergency,
      priority: isEmergency ? 'emergency' : 'normal',
      tokenNumber: tokenCount + 1,
      fee: doctor.consultationFee,
      createdBy: req.user._id
    });

    const patient = await User.findById(req.user._id);
    const io = req.app.get('io');
    await notifyAppointmentBooked(io, appointment, patient, doctor);

    invalidatePattern(`slots:${doctorId}`);

    const populated = await Appointment.findById(appointment._id)
      .populate('patient', 'name email avatar phone')
      .populate({ path: 'doctor', populate: { path: 'user', select: 'name' } });

    res.status(201).json({ success: true, message: 'Appointment booked successfully.', data: { appointment: populated } });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'This slot was just taken. Please pick another.' });
    }
    next(error);
  }
};

// Get patient's appointments
exports.getMyAppointments = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = { patient: req.user._id };
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [appointments, total] = await Promise.all([
      Appointment.find(query)
        .populate({ path: 'doctor', populate: { path: 'user', select: 'name avatar' }, select: 'user specializations consultationFee' })
        .populate({ path: 'doctor', populate: { path: 'specializations', select: 'name' } })
        .sort('-date')
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Appointment.countDocuments(query)
    ]);

    res.json({ success: true, data: { appointments, total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
  } catch (error) {
    next(error);
  }
};

// Get doctor's appointments
exports.getDoctorAppointments = async (req, res, next) => {
  try {
    const { date, status, page = 1, limit = 20 } = req.query;
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor profile not found.' });

    const query = { doctor: doctor._id };
    if (status) query.status = status;
    if (date) {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      query.date = { $gte: d, $lt: next };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [appointments, total] = await Promise.all([
      Appointment.find(query)
        .populate('patient', 'name avatar gender dateOfBirth phone bloodGroup allergies')
        .sort({ date: 1, 'timeSlot.startTime': 1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Appointment.countDocuments(query)
    ]);

    res.json({ success: true, data: { appointments, total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
  } catch (error) {
    next(error);
  }
};

// Update appointment status
exports.updateStatus = async (req, res, next) => {
  try {
    const { status, notes, vitals, followUpDate } = req.body;
    const appointment = await Appointment.findById(req.params.id)
      .populate('patient', 'name email');

    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found.' });

    // Role-based status transitions
    const allowed = {
      doctor: ['confirmed', 'in-progress', 'completed', 'no-show'],
      receptionist: ['confirmed', 'cancelled'],
      admin: ['confirmed', 'cancelled', 'completed', 'no-show'],
      patient: ['cancelled']
    };
    if (!allowed[req.user.role]?.includes(status)) {
      return res.status(403).json({ success: false, message: 'Not authorized to set this status.' });
    }

    appointment.status = status;
    if (notes) appointment.notes[req.user.role] = notes;
    if (vitals) appointment.vitals = vitals;
    if (followUpDate) appointment.followUpDate = followUpDate;
    if (status === 'completed') appointment.completedAt = new Date();
    if (status === 'cancelled') {
      appointment.cancellationReason = req.body.reason;
      appointment.cancelledBy = req.user._id;
    }

    await appointment.save();
    invalidatePattern(`slots:${appointment.doctor}`);

    const io = req.app.get('io');
    await notifyAppointmentStatusChange(io, appointment, appointment.patient, status);

    // Emit real-time update to doctor's room
    io.to(`doctor:${appointment.doctor}`).emit('appointment_updated', {
      appointmentId: appointment._id,
      status,
      tokenNumber: appointment.tokenNumber
    });

    res.json({ success: true, message: `Appointment ${status}.`, data: { appointment } });
  } catch (error) {
    next(error);
  }
};

// Get single appointment
exports.getAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patient', 'name avatar gender dateOfBirth phone bloodGroup allergies medicalHistory')
      .populate({ path: 'doctor', populate: [{ path: 'user', select: 'name avatar' }, { path: 'specializations', select: 'name' }] })
      .populate('prescription');

    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found.' });

    // Access control
    const userId = req.user._id.toString();
    const doctor = await Doctor.findById(appointment.doctor._id);
    const isPatient = appointment.patient._id.toString() === userId;
    const isDoctor = doctor?.user.toString() === userId;
    const isAdminOrReceptionist = ['admin', 'receptionist'].includes(req.user.role);

    if (!isPatient && !isDoctor && !isAdminOrReceptionist) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.json({ success: true, data: { appointment } });
  } catch (error) {
    next(error);
  }
};

// Get patient history (for doctor viewing a patient)
exports.getPatientHistory = async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const doctor = await Doctor.findOne({ user: req.user._id });

    // Verify doctor had appointment with patient
    if (req.user.role === 'doctor') {
      const hasRelation = await Appointment.findOne({ doctor: doctor._id, patient: patientId });
      if (!hasRelation) return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const [appointments, patient] = await Promise.all([
      Appointment.find({ patient: patientId })
        .populate({ path: 'doctor', populate: { path: 'user', select: 'name' } })
        .populate('prescription')
        .sort('-date')
        .lean(),
      User.findById(patientId).select('-password -otp')
    ]);

    res.json({ success: true, data: { patient, appointments } });
  } catch (error) {
    next(error);
  }
};

// Admin: get all appointments
exports.getAllAppointments = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, date, doctorId } = req.query;
    const query = {};
    if (status) query.status = status;
    if (doctorId) query.doctor = doctorId;
    if (date) {
      const d = new Date(date); d.setHours(0, 0, 0, 0);
      const n = new Date(d); n.setDate(n.getDate() + 1);
      query.date = { $gte: d, $lt: n };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [appointments, total] = await Promise.all([
      Appointment.find(query)
        .populate('patient', 'name email avatar')
        .populate({ path: 'doctor', populate: { path: 'user', select: 'name' } })
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Appointment.countDocuments(query)
    ]);

    res.json({ success: true, data: { appointments, total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
  } catch (error) {
    next(error);
  }
};
