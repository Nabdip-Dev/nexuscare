// notification.routes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const { Notification } = require('../models/index');

router.get('/', protect, async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find({ recipient: req.user._id }).sort('-createdAt').skip(skip).limit(Number(limit)).lean(),
      Notification.countDocuments({ recipient: req.user._id }),
      Notification.countDocuments({ recipient: req.user._id, isRead: false })
    ]);
    res.json({ success: true, data: { notifications, total, unreadCount, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
  } catch (e) { next(e); }
});

router.put('/:id/read', protect, async (req, res, next) => {
  try {
    await Notification.findOneAndUpdate({ _id: req.params.id, recipient: req.user._id }, { isRead: true, readAt: new Date() });
    res.json({ success: true });
  } catch (e) { next(e); }
});

router.put('/read-all', protect, async (req, res, next) => {
  try {
    await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true, readAt: new Date() });
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (e) { next(e); }
});

module.exports = router;
