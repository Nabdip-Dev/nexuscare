const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/report.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');
const { uploadReport } = require('../middlewares/upload.middleware');
const { uploadLimiter } = require('../middlewares/rateLimiter');

router.post('/', protect, uploadLimiter, uploadReport, ctrl.uploadReport);
router.get('/my', protect, ctrl.getMyReports);
router.get('/patient/:patientId', protect, authorize('doctor', 'admin', 'receptionist'), ctrl.getPatientReports);
router.delete('/:id', protect, ctrl.deleteReport);

module.exports = router;
