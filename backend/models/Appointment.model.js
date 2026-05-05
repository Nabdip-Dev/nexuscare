const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  timeSlot: {
    startTime: { type: String, required: true },
    endTime: { type: String, required: true }
  },
  type: {
    type: String,
    enum: ['in-person', 'video', 'emergency'],
    default: 'in-person'
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'],
    default: 'pending'
  },
  reasonForVisit: {
    type: String,
    maxlength: 500
  },
  symptoms: [String],
  notes: {
    patient: String,
    doctor: String,
    receptionist: String
  },
  tokenNumber: {
    type: Number
  },
  isEmergency: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    enum: ['normal', 'urgent', 'emergency'],
    default: 'normal'
  },
  // For video consultations
  meetingId: String,
  meetingLink: String,
  // Prescription linked
  prescription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prescription'
  },
  // Vitals recorded
  vitals: {
    bloodPressure: String,
    heartRate: Number,
    temperature: Number,
    weight: Number,
    height: Number,
    oxygenSaturation: Number
  },
  followUpDate: Date,
  cancellationReason: String,
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  completedAt: Date,
  // Payment info
  fee: Number,
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for performance
appointmentSchema.index({ patient: 1, date: -1 });
appointmentSchema.index({ doctor: 1, date: 1 });
appointmentSchema.index({ date: 1, status: 1 });
appointmentSchema.index({ doctor: 1, date: 1, 'timeSlot.startTime': 1 }, { unique: true });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ tokenNumber: 1, doctor: 1, date: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
