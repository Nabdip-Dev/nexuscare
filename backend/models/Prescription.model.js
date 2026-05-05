const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  name: { type: String, required: true },
  dosage: { type: String, required: true },
  frequency: { type: String, required: true }, // "twice daily", "once daily"
  duration: { type: String, required: true },  // "7 days", "2 weeks"
  instructions: String,                         // "take after meals"
  quantity: Number
}, { _id: true });

const prescriptionSchema = new mongoose.Schema({
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true
  },
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
  prescriptionNumber: {
    type: String,
    unique: true
  },
  diagnosis: {
    type: String,
    required: true
  },
  symptoms: [String],
  medicines: [medicineSchema],
  labTests: [{
    testName: String,
    instructions: String,
    urgency: { type: String, enum: ['routine', 'urgent', 'stat'], default: 'routine' }
  }],
  notes: String,
  generalAdvice: String,
  followUpDate: Date,
  followUpNotes: String,
  vitals: {
    bloodPressure: String,
    heartRate: Number,
    temperature: Number,
    weight: Number,
    height: Number,
    oxygenSaturation: Number
  },
  isDispensed: {
    type: Boolean,
    default: false
  },
  dispensedAt: Date,
  pdfUrl: String,
  pdfPublicId: String
}, {
  timestamps: true
});

// Auto-generate prescription number
prescriptionSchema.pre('save', async function(next) {
  if (!this.prescriptionNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const count = await mongoose.model('Prescription').countDocuments();
    this.prescriptionNumber = `RX${year}${month}${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Indexes
prescriptionSchema.index({ patient: 1, createdAt: -1 });
prescriptionSchema.index({ doctor: 1, createdAt: -1 });
prescriptionSchema.index({ appointment: 1 });
prescriptionSchema.index({ prescriptionNumber: 1 });

module.exports = mongoose.model('Prescription', prescriptionSchema);
