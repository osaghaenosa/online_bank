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

// Delete one notification
router.delete('/notifications/:id', async (req, res, next) => {
  try {
    const notif = await Notification.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!notif) return res.status(404).json({ error: 'Notification not found' });
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

// ── KYC & PIN ────────────────────────────────────────────────────────────────
const bcrypt = require('bcryptjs');

router.post('/pin', async (req, res, next) => {
  try {
    const { pin } = req.body;
    if (!pin || pin.length < 4) return res.status(400).json({ error: 'Valid PIN required' });
    
    const user = await User.findById(req.user._id);
    if (user.pin) return res.status(400).json({ error: 'PIN is already set' });
    
    user.pin = await bcrypt.hash(pin, 12);
    await user.save();
    res.json({ success: true, message: 'PIN set successfully' });
  } catch (err) { next(err); }
});

const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });

router.post('/kyc', upload.fields([{ name: 'idCard' }, { name: 'otherVerification' }]), async (req, res, next) => {
  try {
    const { ssnOrBvn } = req.body;
    let idCard = req.body.idCard;
    let otherVerification = req.body.otherVerification;

    if (req.files && req.files.idCard) {
      const file = req.files.idCard[0];
      idCard = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    }
    if (req.files && req.files.otherVerification) {
      const file = req.files.otherVerification[0];
      otherVerification = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    }

    if (!idCard || !otherVerification || !ssnOrBvn) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    const user = await User.findById(req.user._id);
    user.kyc = 'Pending';
    user.kycDetails = {
      idCard,
      otherVerification,
      ssnOrBvn,
      submittedAt: new Date()
    };
    await user.save();
    res.json({ success: true, message: 'KYC submitted successfully' });
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

// @desc    Request a debit card
// @route   POST /api/users/card/request
// @access  Private
router.post('/card/request', protect, async (req, res, next) => {
  try {
    const { cardType } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    if (user.cardStatus !== 'Not Requested') {
      return res.status(400).json({ error: 'Card already requested or active' });
    }
    if (!['Visa', 'Mastercard'].includes(cardType)) {
      return res.status(400).json({ error: 'Invalid card type' });
    }

    const AppSettings = require('../models/AppSettings');
    const s = await AppSettings.findOne({ key: 'card_fee' });
    const fee = s ? Number(s.value) : 50;

    if (user.balance < fee) {
      return res.status(400).json({ error: `Insufficient balance for card issuance fee ($${fee})` });
    }

    user.balance -= fee;
    user.cardStatus = 'Pending Approval';
    user.cardType = cardType;
    await user.save();

    res.json({ message: 'Card requested successfully', user });
  } catch (err) { next(err); }
});

module.exports = router;
