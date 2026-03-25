const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const Notification = require('../models/Notification');

router.use(protect);

// Get notifications
router.get('/notifications', async (req, res, next) => {
  try {
    const notifs = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(30);
    const unread = await Notification.countDocuments({ userId: req.user._id, read: false });
    res.json({ notifications: notifs, unreadCount: unread });
  } catch (err) { next(err); }
});

// Mark all read
router.patch('/notifications/read-all', async (req, res, next) => {
  try {
    await Notification.updateMany({ userId: req.user._id }, { read: true });
    res.json({ success: true });
  } catch (err) { next(err); }
});

// Mark one read
router.patch('/notifications/:id/read', async (req, res, next) => {
  try {
    await Notification.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, { read: true });
    res.json({ success: true });
  } catch (err) { next(err); }
});

// Get dashboard summary
router.get('/dashboard', async (req, res, next) => {
  try {
    const Transaction = require('../models/Transaction');
    const user = await User.findById(req.user._id).select('-password');
    const recentTxs = await Transaction.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(5);
    const stats = await Transaction.aggregate([
      { $match: { userId: req.user._id, status: 'completed' } },
      { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);
    const unreadCount = await Notification.countDocuments({ userId: req.user._id, read: false });
    res.json({
      user: user.toPublicJSON(),
      recentTransactions: recentTxs,
      stats: stats.reduce((acc, s) => ({ ...acc, [s._id]: { total: s.total, count: s.count } }), {}),
      unreadNotifications: unreadCount
    });
  } catch (err) { next(err); }
});


// ── Payment method settings (public to all authenticated users) ───────────────
router.get('/deposit-settings', async (req, res, next) => {
  try {
    const AppSettings = require('../models/AppSettings');
    const s = await AppSettings.findOne({ key: 'deposit_methods' });
    res.json({ settings: s?.value || null });
  } catch (err) { next(err); }
});

router.get('/withdrawal-settings', async (req, res, next) => {
  try {
    const AppSettings = require('../models/AppSettings');
    const s = await AppSettings.findOne({ key: 'withdrawal_methods' });
    res.json({ settings: s?.value || null });
  } catch (err) { next(err); }
});

module.exports = router;