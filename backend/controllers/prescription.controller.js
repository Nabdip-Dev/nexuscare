const Prescription = require('../models/Prescription.model');
const Appointment = require('../models/Appointment.model');
const Doctor = require('../models/Doctor.model');
const { generatePrescriptionPDF } = require('../utils/pdfGenerator');
const { notifyPrescriptionReady } = require('../services/notification.service');
const User = require('../models/User.model');

// Create prescription
exports.createPrescription = async (req, res, next) => {
  try {
    const { appointmentId, diagnosis, symptoms, medicines, labTests, notes, generalAdvice, followUpDate, vitals } = req.body;

    const appointment = await Appointment.findById(appointmentId).populate('patient', 'name email');
    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found.' });

    const doctor = await Doctor.findOne({ user: req.user._id }).populate('user', 'name').populate('specializations', 'name');
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor profile not found.' });

    // Check this doctor owns the appointment
    if (appointment.doctor.toString() !== doctor._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    // Check if prescription already exists
    if (appointment.prescription) {
      return res.status(400).json({ success: false, message: 'Prescription already exists for this appointment. Use update instead.' });
    }

    const prescription = await Prescription.create({
      appointment: appointmentId,
      patient: appointment.patient._id,
      doctor: doctor._id,
      diagnosis,
      symptoms: symptoms || [],
      medicines: medicines || [],
      labTests: labTests || [],
      notes,
      generalAdvice,
      followUpDate,
      vitals
    });

    // Link to appointment
    appointment.prescription = prescription._id;
    appointment.status = 'completed';
    appointment.completedAt = new Date();
    if (vitals) appointment.vitals = vitals;
    await appointment.save();

    // Generate PDF in background
    generatePrescriptionPDF(prescription, doctor, appointment.patient)
      .then(async ({ url, publicId }) => {
        await Prescription.findByIdAndUpdate(prescription._id, { pdfUrl: url, pdfPublicId: publicId });
      })
      .catch(err => console.error('PDF generation error:', err.message));

    // Notify patient
    const io = req.app.get('io');
    await notifyPrescriptionReady(io, prescription, appointment.patient, doctor);

    res.status(201).json({
      success: true,
      message: 'Prescription created successfully.',
      data: { prescription }
    });
  } catch (error) {
    next(error);
  }
};

// Get prescription by ID
exports.getPrescription = async (req, res, next) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('patient', 'name dateOfBirth gender bloodGroup')
      .populate({ path: 'doctor', populate: { path: 'user', select: 'name avatar' } })
      .populate({ path: 'doctor', populate: { path: 'specializations', select: 'name' } })
      .populate('appointment', 'date timeSlot');

    if (!prescription) return res.status(404).json({ success: false, message: 'Prescription not found.' });

    // Access control
    const userId = req.user._id.toString();
    const doctor = await Doctor.findById(prescription.doctor._id);
    const isPatient = prescription.patient._id.toString() === userId;
    const isDoctor = doctor?.user.toString() === userId;
    const isAdminOrReceptionist = ['admin', 'receptionist'].includes(req.user.role);

    if (!isPatient && !isDoctor && !isAdminOrReceptionist) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.json({ success: true, data: { prescription } });
  } catch (error) {
    next(error);
  }
};

// Get patient's prescriptions
exports.getMyPrescriptions = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [prescriptions, total] = await Promise.all([
      Prescription.find({ patient: req.user._id })
        .populate({ path: 'doctor', populate: { path: 'user', select: 'name avatar' } })
        .populate({ path: 'doctor', populate: { path: 'specializations', select: 'name' } })
        .populate('appointment', 'date timeSlot')
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Prescription.countDocuments({ patient: req.user._id })
    ]);

    res.json({ success: true, data: { prescriptions, total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
  } catch (error) {
    next(error);
  }
};

// Update prescription
exports.updatePrescription = async (req, res, next) => {
  try {
    const prescription = await Prescription.findById(req.params.id);
    if (!prescription) return res.status(404).json({ success: false, message: 'Prescription not found.' });

    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor || prescription.doctor.toString() !== doctor._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    const updates = ['diagnosis', 'symptoms', 'medicines', 'labTests', 'notes', 'generalAdvice', 'followUpDate', 'vitals'];
    updates.forEach(field => {
      if (req.body[field] !== undefined) prescription[field] = req.body[field];
    });

    await prescription.save();

    // Regenerate PDF
    const populatedDoctor = await Doctor.findById(doctor._id).populate('user', 'name').populate('specializations', 'name');
    const patient = await User.findById(prescription.patient).select('name dateOfBirth gender');
    generatePrescriptionPDF(prescription, populatedDoctor, patient)
      .then(async ({ url, publicId }) => {
        await Prescription.findByIdAndUpdate(prescription._id, { pdfUrl: url, pdfPublicId: publicId });
      })
      .catch(err => console.error('PDF regeneration error:', err.message));

    res.json({ success: true, message: 'Prescription updated.', data: { prescription } });
  } catch (error) {
    next(error);
  }
};

// Doctor: get prescriptions they issued
exports.getDoctorPrescriptions = async (req, res, next) => {
  try {
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found.' });

    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [prescriptions, total] = await Promise.all([
      Prescription.find({ doctor: doctor._id })
        .populate('patient', 'name avatar dateOfBirth gender')
        .populate('appointment', 'date timeSlot')
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Prescription.countDocuments({ doctor: doctor._id })
    ]);

    res.json({ success: true, data: { prescriptions, total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
  } catch (error) {
    next(error);
  }
};
