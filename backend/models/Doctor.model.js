const mongoose = require('mongoose');

const timeSlotSchema = new mongoose.Schema({
  startTime: { type: String, required: true }, // "09:00"
  endTime: { type: String, required: true },   // "09:15"
  isAvailable: { type: Boolean, default: true }
}, { _id: false });

const scheduleSchema = new mongoose.Schema({
  dayOfWeek: {
    type: Number, // 0=Sunday, 1=Monday, ..., 6=Saturday
    required: true
  },
  isWorking: { type: Boolean, default: true },
  slots: [timeSlotSchema],
  maxPatientsPerDay: { type: Number, default: 20 }
}, { _id: false });

const doctorSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  licenseNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  specializations: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  qualifications: [{
    degree: String,
    institution: String,
    year: Number
  }],
  experience: {
    type: Number, // years
    default: 0
  },
  bio: {
    type: String,
    maxlength: 1000
  },
  consultationFee: {
    type: Number,
    default: 0
  },
  consultationDuration: {
    type: Number, // minutes
    default: 15
  },
  schedule: [scheduleSchema],
  languages: [String],
  hospitalAffiliation: String,
  rating: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0 }
  },
  reviews: [{
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating: { type: Number, min: 1, max: 5 },
    comment: String,
    date: { type: Date, default: Date.now }
  }],
  isApproved: {
    type: Boolean,
    default: false
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  isAvailableForEmergency: {
    type: Boolean,
    default: false
  },
  totalPatients: {
    type: Number,
    default: 0
  },
  totalAppointments: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes
doctorSchema.index({ user: 1 });
doctorSchema.index({ specializations: 1 });
doctorSchema.index({ isApproved: 1 });
doctorSchema.index({ 'rating.average': -1 });
doctorSchema.index({ consultationFee: 1 });

// Virtual for availability check
doctorSchema.methods.getAvailableSlots = function(date) {
  const dayOfWeek = new Date(date).getDay();
  const daySchedule = this.schedule.find(s => s.dayOfWeek === dayOfWeek);
  if (!daySchedule || !daySchedule.isWorking) return [];
  return daySchedule.slots.filter(slot => slot.isAvailable);
};

module.exports = mongoose.model('Doctor', doctorSchema);
