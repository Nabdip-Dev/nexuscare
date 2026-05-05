const Doctor = require('../models/Doctor.model');
const User = require('../models/User.model');
const Appointment = require('../models/Appointment.model');
const { get, set, del, KEYS, invalidatePattern } = require('../services/cache.service');

// Get all approved doctors (public, paginated)
exports.getDoctors = async (req, res, next) => {
  try {
    const { page = 1, limit = 12, specialization, search, minFee, maxFee, sort = '-rating.average' } = req.query;

    const cacheKey = `doctors:${page}:${limit}:${specialization || ''}:${search || ''}:${sort}`;
    const cached = get(cacheKey);
    if (cached) return res.json(cached);

    const skip = (page - 1) * limit;
    const query = { isApproved: true };
    if (specialization) query.specializations = specialization;
    if (minFee || maxFee) {
      query.consultationFee = {};
      if (minFee) query.consultationFee.$gte = Number(minFee);
      if (maxFee) query.consultationFee.$lte = Number(maxFee);
    }

    let doctorsQuery = Doctor.find(query)
      .populate({ path: 'user', select: 'name email avatar gender' })
      .populate({ path: 'specializations', select: 'name slug icon' })
      .select('-reviews')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .lean();

    if (search) {
      const userIds = await User.find({
        $or: [
          { name: { $regex: search, $options: 'i' } }
        ]
      }).distinct('_id');
      query.$or = [{ user: { $in: userIds } }];
      doctorsQuery = Doctor.find(query)
        .populate({ path: 'user', select: 'name email avatar gender' })
        .populate({ path: 'specializations', select: 'name slug icon' })
        .select('-reviews')
        .sort(sort)
        .skip(skip)
        .limit(Number(limit))
        .lean();
    }

    const [doctors, total] = await Promise.all([
      doctorsQuery,
      Doctor.countDocuments(query)
    ]);

    const response = {
      success: true,
      data: { doctors, total, page: Number(page), pages: Math.ceil(total / limit) }
    };
    set(cacheKey, response, 120); // 2 min cache
    res.json(response);
  } catch (error) {
    next(error);
  }
};

// Get doctor profile by ID
exports.getDoctorById = async (req, res, next) => {
  try {
    const cacheKey = KEYS.DOCTOR_PROFILE(req.params.id);
    const cached = get(cacheKey);
    if (cached) return res.json(cached);

    const doctor = await Doctor.findById(req.params.id)
      .populate({ path: 'user', select: 'name email avatar gender phone' })
      .populate({ path: 'specializations', select: 'name slug icon' })
      .populate({ path: 'reviews.patient', select: 'name avatar' });

    if (!doctor || !doctor.isApproved) {
      return res.status(404).json({ success: false, message: 'Doctor not found.' });
    }

    const response = { success: true, data: { doctor } };
    set(cacheKey, response, 300);
    res.json(response);
  } catch (error) {
    next(error);
  }
};

// Get doctor's available slots for a date
exports.getAvailableSlots = async (req, res, next) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ success: false, message: 'Date is required.' });

    const cacheKey = KEYS.AVAILABLE_SLOTS(req.params.id, date);
    const cached = get(cacheKey);
    if (cached) return res.json(cached);

    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found.' });

    const dayOfWeek = new Date(date).getDay();
    const daySchedule = doctor.schedule.find(s => s.dayOfWeek === dayOfWeek);

    if (!daySchedule || !daySchedule.isWorking) {
      return res.json({ success: true, data: { slots: [], message: 'Doctor not available on this day.' } });
    }

    // Get booked slots for this date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const bookedAppointments = await Appointment.find({
      doctor: req.params.id,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $nin: ['cancelled'] }
    }).select('timeSlot').lean();

    const bookedTimes = new Set(bookedAppointments.map(a => a.timeSlot.startTime));

    const availableSlots = daySchedule.slots.map(slot => ({
      startTime: slot.startTime,
      endTime: slot.endTime,
      isBooked: bookedTimes.has(slot.startTime)
    }));

    const dailyCount = bookedAppointments.length;
    const isAtCapacity = dailyCount >= (daySchedule.maxPatientsPerDay || 20);

    const response = {
      success: true,
      data: {
        slots: availableSlots,
        isAtCapacity,
        totalBooked: dailyCount,
        maxPerDay: daySchedule.maxPatientsPerDay
      }
    };
    set(cacheKey, response, 30); // 30 sec cache for slots
    res.json(response);
  } catch (error) {
    next(error);
  }
};

// Get doctor's own profile (for doctor dashboard)
exports.getMyProfile = async (req, res, next) => {
  try {
    const doctor = await Doctor.findOne({ user: req.user._id })
      .populate('specializations', 'name slug icon');
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor profile not found.' });
    res.json({ success: true, data: { doctor } });
  } catch (error) {
    next(error);
  }
};

// Update doctor profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { bio, consultationFee, consultationDuration, schedule, languages, hospitalAffiliation, isAvailableForEmergency } = req.body;

    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor profile not found.' });

    if (bio !== undefined) doctor.bio = bio;
    if (consultationFee !== undefined) doctor.consultationFee = consultationFee;
    if (consultationDuration !== undefined) doctor.consultationDuration = consultationDuration;
    if (schedule !== undefined) doctor.schedule = schedule;
    if (languages !== undefined) doctor.languages = languages;
    if (hospitalAffiliation !== undefined) doctor.hospitalAffiliation = hospitalAffiliation;
    if (isAvailableForEmergency !== undefined) doctor.isAvailableForEmergency = isAvailableForEmergency;

    await doctor.save();
    invalidatePattern(`doctor:${doctor._id}`);

    res.json({ success: true, message: 'Profile updated.', data: { doctor } });
  } catch (error) {
    next(error);
  }
};

// Get doctor dashboard stats
exports.getDashboardStats = async (req, res, next) => {
  try {
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found.' });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [todayAppointments, pendingCount, totalCompleted, totalPatients] = await Promise.all([
      Appointment.find({ doctor: doctor._id, date: { $gte: today, $lt: tomorrow }, status: { $ne: 'cancelled' } })
        .populate('patient', 'name avatar gender dateOfBirth phone')
        .sort('timeSlot.startTime')
        .lean(),
      Appointment.countDocuments({ doctor: doctor._id, status: 'pending' }),
      Appointment.countDocuments({ doctor: doctor._id, status: 'completed' }),
      Appointment.distinct('patient', { doctor: doctor._id })
    ]);

    res.json({
      success: true,
      data: {
        todayAppointments,
        pendingCount,
        totalCompleted,
        totalPatients: totalPatients.length,
        rating: doctor.rating
      }
    });
  } catch (error) {
    next(error);
  }
};

// Add review
exports.addReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found.' });

    // Check if patient has completed appointment with this doctor
    const hasAppointment = await Appointment.findOne({
      patient: req.user._id,
      doctor: req.params.id,
      status: 'completed'
    });
    if (!hasAppointment) {
      return res.status(403).json({ success: false, message: 'You can only review doctors after a completed appointment.' });
    }

    // Check if already reviewed
    const alreadyReviewed = doctor.reviews.find(r => r.patient.toString() === req.user._id.toString());
    if (alreadyReviewed) {
      alreadyReviewed.rating = rating;
      alreadyReviewed.comment = comment;
    } else {
      doctor.reviews.push({ patient: req.user._id, rating, comment });
    }

    // Recalculate average
    const total = doctor.reviews.reduce((sum, r) => sum + r.rating, 0);
    doctor.rating = { average: total / doctor.reviews.length, count: doctor.reviews.length };

    await doctor.save();
    del(KEYS.DOCTOR_PROFILE(req.params.id));

    res.json({ success: true, message: 'Review submitted.', data: { rating: doctor.rating } });
  } catch (error) {
    next(error);
  }
};
