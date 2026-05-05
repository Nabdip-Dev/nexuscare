// category.routes.js
const express = require('express');
const router = express.Router();
const { Category } = require('../models/index');
const { get, set, KEYS } = require('../services/cache.service');

router.get('/', async (req, res, next) => {
  try {
    const cached = get(KEYS.CATEGORIES);
    if (cached) return res.json(cached);
    const categories = await Category.find({ isActive: true }).sort('order name').lean();
    const response = { success: true, data: { categories } };
    set(KEYS.CATEGORIES, response, 600); // 10 min cache
    res.json(response);
  } catch (e) { next(e); }
});

router.get('/:slug', async (req, res, next) => {
  try {
    const cat = await Category.findOne({ slug: req.params.slug, isActive: true });
    if (!cat) return res.status(404).json({ success: false, message: 'Category not found.' });
    res.json({ success: true, data: { category: cat } });
  } catch (e) { next(e); }
});

module.exports = router;
