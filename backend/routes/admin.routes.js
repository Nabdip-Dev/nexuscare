const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/admin.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');
const { Category, Banner } = require('../models/index');
const { get, set, del, KEYS, flush } = require('../services/cache.service');
const { uploadBanner } = require('../middlewares/upload.middleware');

const adminOnly = [protect, authorize('admin')];

router.get('/analytics', ...adminOnly, ctrl.getAnalytics);
router.get('/users', ...adminOnly, ctrl.getUsers);
router.put('/users/:id', ...adminOnly, ctrl.updateUser);
router.delete('/users/:id', ...adminOnly, ctrl.deleteUser);
router.get('/doctors/pending', ...adminOnly, ctrl.getPendingDoctors);
router.put('/doctors/:id/approve', ...adminOnly, ctrl.approveDoctor);

// Categories CRUD
router.get('/categories', protect, authorize('admin'), async (req, res, next) => {
  try {
    const cats = await Category.find().sort('order name');
    res.json({ success: true, data: { categories: cats } });
  } catch (e) { next(e); }
});
router.post('/categories', ...adminOnly, async (req, res, next) => {
  try {
    const cat = await Category.create(req.body);
    del(KEYS.CATEGORIES);
    res.status(201).json({ success: true, data: { category: cat } });
  } catch (e) { next(e); }
});
router.put('/categories/:id', ...adminOnly, async (req, res, next) => {
  try {
    const cat = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    del(KEYS.CATEGORIES);
    res.json({ success: true, data: { category: cat } });
  } catch (e) { next(e); }
});
router.delete('/categories/:id', ...adminOnly, async (req, res, next) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    del(KEYS.CATEGORIES);
    res.json({ success: true, message: 'Category deleted.' });
  } catch (e) { next(e); }
});

// Banners
router.get('/banners', ...adminOnly, async (req, res, next) => {
  try {
    const banners = await Banner.find().sort('order');
    res.json({ success: true, data: { banners } });
  } catch (e) { next(e); }
});
router.post('/banners', ...adminOnly, uploadBanner, async (req, res, next) => {
  try {
    const banner = await Banner.create({ ...req.body, imageUrl: req.file?.path, publicId: req.file?.filename });
    del(KEYS.BANNERS);
    res.status(201).json({ success: true, data: { banner } });
  } catch (e) { next(e); }
});
router.delete('/banners/:id', ...adminOnly, async (req, res, next) => {
  try {
    await Banner.findByIdAndDelete(req.params.id);
    del(KEYS.BANNERS);
    res.json({ success: true, message: 'Banner deleted.' });
  } catch (e) { next(e); }
});

// Cache flush
router.post('/cache/flush', ...adminOnly, (req, res) => {
  flush();
  res.json({ success: true, message: 'Cache cleared.' });
});

module.exports = router;
