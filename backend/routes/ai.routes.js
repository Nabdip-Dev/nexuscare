// ai.routes.js
const express = require('express');
const router = express.Router();
const { checkSymptoms, analyzeHealthRisk, analyzeReport } = require('../controllers/ai.controller');
const { protect } = require('../middlewares/auth.middleware');

router.post('/symptoms', protect, checkSymptoms);
router.post('/health-risk', protect, analyzeHealthRisk);
router.post('/analyze-report', protect, analyzeReport);

module.exports = router;
