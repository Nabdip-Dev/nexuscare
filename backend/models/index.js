const mongoose = require('mongoose');

// Medical Report Model
const reportSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  title: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['blood_test', 'urine_test', 'xray', 'mri', 'ct_scan', 'ultrasound', 'ecg', 'other'],
    default: 'other'
  },
  fileUrl: {
    type: String,
    required: true
  },
  publicId: String,
  fileType: {
    type: String,
    enum: ['pdf', 'image']
  },
  reportDate: Date,
  notes: String,
  aiAnalysis: {
    summary: String,
    abnormalValues: [{ parameter: String, value: String, normalRange: String, status: String }],
    recommendations: [String],
    analyzedAt: Date
  },
  isSharedWithDoctor: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

reportSchema.index({ patient: 1, createdAt: -1 });
reportSchema.index({ appointment: 1 });

// Notification Model
const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['appointment_booked', 'appointment_confirmed', 'appointment_cancelled',
           'appointment_reminder', 'prescription_ready', 'report_uploaded',
           'doctor_approved', 'payment_received', 'general'],
    required: true
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  data: mongoose.Schema.Types.Mixed, // Additional data (appointmentId, etc.)
  isRead: { type: Boolean, default: false },
  readAt: Date,
  channels: {
    email: { type: Boolean, default: false },
    push: { type: Boolean, default: false }
  }
}, { timestamps: true });

notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });

// Category (Specialization) Model
const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  description: String,
  icon: String,
  image: {
    url: String,
    publicId: String
  },
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 }
}, { timestamps: true });

categorySchema.pre('save', function(next) {
  if (!this.slug) {
    this.slug = this.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }
  next();
});

categorySchema.index({ slug: 1 });
categorySchema.index({ isActive: 1 });

// Pharmacy Order Model
const pharmacyOrderSchema = new mongoose.Schema({
  prescription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prescription',
    required: true
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  pharmacy: {
    name: String,
    address: String,
    phone: String
  },
  medicines: [{
    name: String,
    dosage: String,
    quantity: Number,
    price: Number,
    available: { type: Boolean, default: true }
  }],
  status: {
    type: String,
    enum: ['pending', 'processing', 'ready', 'delivered', 'cancelled'],
    default: 'pending'
  },
  totalAmount: Number,
  deliveryType: {
    type: String,
    enum: ['pickup', 'delivery'],
    default: 'pickup'
  },
  deliveryAddress: String,
  notes: String,
  orderNumber: String
}, { timestamps: true });

pharmacyOrderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('PharmacyOrder').countDocuments();
    this.orderNumber = `ORD${Date.now().toString().slice(-8)}${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

pharmacyOrderSchema.index({ patient: 1, createdAt: -1 });
pharmacyOrderSchema.index({ prescription: 1 });
pharmacyOrderSchema.index({ status: 1 });

// Banner Model (for admin)
const bannerSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subtitle: String,
  imageUrl: { type: String, required: true },
  publicId: String,
  link: String,
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
  startDate: Date,
  endDate: Date
}, { timestamps: true });

module.exports = {
  Report: mongoose.model('Report', reportSchema),
  Notification: mongoose.model('Notification', notificationSchema),
  Category: mongoose.model('Category', categorySchema),
  PharmacyOrder: mongoose.model('PharmacyOrder', pharmacyOrderSchema),
  Banner: mongoose.model('Banner', bannerSchema)
};
