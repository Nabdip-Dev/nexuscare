// pharmacy.routes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth.middleware');
const { PharmacyOrder } = require('../models/index');
const Prescription = require('../models/Prescription.model');

router.post('/order', protect, authorize('patient'), async (req, res, next) => {
  try {
    const { prescriptionId, pharmacy, deliveryType, deliveryAddress, notes } = req.body;
    const prescription = await Prescription.findById(prescriptionId);
    if (!prescription) return res.status(404).json({ success: false, message: 'Prescription not found.' });
    if (prescription.patient.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: 'Access denied.' });

    const medicines = prescription.medicines.map(m => ({ name: m.name, dosage: m.dosage, quantity: m.quantity || 1, available: true }));
    const order = await PharmacyOrder.create({ prescription: prescriptionId, patient: req.user._id, pharmacy, medicines, deliveryType, deliveryAddress, notes });

    await Prescription.findByIdAndUpdate(prescriptionId, { isDispensed: true, dispensedAt: new Date() });
    res.status(201).json({ success: true, data: { order } });
  } catch (e) { next(e); }
});

router.get('/my-orders', protect, async (req, res, next) => {
  try {
    const orders = await PharmacyOrder.find({ patient: req.user._id }).populate('prescription', 'prescriptionNumber diagnosis').sort('-createdAt').lean();
    res.json({ success: true, data: { orders } });
  } catch (e) { next(e); }
});

router.get('/pharmacies', async (req, res) => {
  // Static pharmacy list (in production, integrate with pharmacy API)
  res.json({
    success: true,
    data: {
      pharmacies: [
        { id: 1, name: 'HealthPlus Pharmacy', address: '123 Main St', phone: '+1-555-0101', rating: 4.5, deliveryAvailable: true },
        { id: 2, name: 'CareFirst Drugstore', address: '456 Oak Ave', phone: '+1-555-0102', rating: 4.2, deliveryAvailable: true },
        { id: 3, name: 'MedExpress Pharmacy', address: '789 Pine Rd', phone: '+1-555-0103', rating: 4.7, deliveryAvailable: false },
        { id: 4, name: 'Wellness Rx', address: '321 Elm St', phone: '+1-555-0104', rating: 4.0, deliveryAvailable: true }
      ]
    }
  });
});

module.exports = router;
