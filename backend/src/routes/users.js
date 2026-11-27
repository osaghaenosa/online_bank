const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const Notification = require('../models/Notification');

router.use(protect);

// Resolve an exact Blue ridge Bank account number for internal transfers.
router.get('/lookup-account', async (req, res, next) => {
  try {
    const raw = String(req.query.q || '').trim();
    if (!/^\d{12}$/.test(raw)) {
      return res.json({ users: [] });
    }
    const user = await User.findOne({
      _id: { $ne: req.user._id },
      accountNumber: raw,
    })
      .select('_id firstName lastName accountNumber profilePicture')
      .lean();
    res.json({ users: user ? [user] : [] });
  } catch (err) { next(err); }
});

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

    const { uploadToImageKit } = require('../utils/imagekit');

    if (req.files && req.files.idCard) {
      const file = req.files.idCard[0];
      const result = await uploadToImageKit(file.buffer, `kyc_id_${req.user._id}_${Date.now()}`, '/nexabank/kyc');
      idCard = result.url;
    } else if (idCard && idCard.startsWith('data:image')) {
      const result = await uploadToImageKit(idCard, `kyc_id_${req.user._id}_${Date.now()}`, '/nexabank/kyc');
      idCard = result.url;
    }

    if (req.files && req.files.otherVerification) {
      const file = req.files.otherVerification[0];
      const result = await uploadToImageKit(file.buffer, `kyc_other_${req.user._id}_${Date.now()}`, '/nexabank/kyc');
      otherVerification = result.url;
    } else if (otherVerification && otherVerification.startsWith('data:image')) {
      const result = await uploadToImageKit(otherVerification, `kyc_other_${req.user._id}_${Date.now()}`, '/nexabank/kyc');
      otherVerification = result.url;
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

router.post(
  '/business-compliance',
  upload.fields([
    { name: 'registrationDocs' },
    { name: 'directorIdAndProof' },
    { name: 'boardResolution' },
  ]),
  async (req, res, next) => {
    try {
      const { businessActivity, companyName, registrationNumber, businessType } = req.body;
      let { registrationDocs, directorIdAndProof, boardResolution } = req.body;

      const user = await User.findById(req.user._id);
      if (!user) return res.status(404).json({ error: 'User not found' });
      if (user.accountType !== 'business') {
        return res.status(400).json({ error: 'Business compliance is only applicable to business accounts' });
      }

      const { uploadToImageKit } = require('../utils/imagekit');
      const hasImageKit = Boolean(
        process.env.IMAGEKIT_PUBLIC_KEY &&
        process.env.IMAGEKIT_PRIVATE_KEY &&
        process.env.IMAGEKIT_URL_ENDPOINT
      );

      const uploadField = async (fieldKey, currentVal) => {
        if (req.files && req.files[fieldKey] && req.files[fieldKey][0]) {
          const file = req.files[fieldKey][0];
          if (hasImageKit) {
            const result = await uploadToImageKit(file.buffer, `biz_${fieldKey}_${user._id}_${Date.now()}`, '/nexabank/business-kyc');
            return result.url;
          }
          return `data:${file.mimetype || 'application/octet-stream'};base64,${file.buffer.toString('base64')}`;
        }
        if (currentVal && typeof currentVal === 'string' && currentVal.startsWith('data:') && hasImageKit) {
          const result = await uploadToImageKit(currentVal, `biz_${fieldKey}_${user._id}_${Date.now()}`, '/nexabank/business-kyc');
          return result.url;
        }
        return currentVal;
      };

      registrationDocs = await uploadField('registrationDocs', registrationDocs);
      directorIdAndProof = await uploadField('directorIdAndProof', directorIdAndProof);
      boardResolution = await uploadField('boardResolution', boardResolution);

      if (!registrationDocs || !directorIdAndProof || !boardResolution || !String(businessActivity || '').trim()) {
        return res.status(400).json({
          error: 'All business compliance documents and a description of business activity are required',
        });
      }

      user.kyc = 'Pending';
      user.businessDetails = {
        ...(user.businessDetails?.toObject?.() || user.businessDetails || {}),
        ...(companyName ? { companyName: String(companyName).trim() } : {}),
        ...(registrationNumber !== undefined ? { registrationNumber: String(registrationNumber).trim() } : {}),
        ...(businessType !== undefined ? { businessType: String(businessType).trim() } : {}),
        registrationDocs,
        directorIdAndProof,
        boardResolution,
        businessActivity: String(businessActivity).trim(),
        complianceStatus: 'Pending',
        submittedAt: new Date(),
        rejectionReason: '',
      };

      await user.save();

      await Notification.create({
        userId: user._id,
        title: 'Business Compliance Submitted',
        message: 'Your corporate registration, director IDs, board resolution, and business activity profile have been submitted for review.',
        type: 'system',
        priority: 'high',
      });

      res.json({
        success: true,
        message: 'Business compliance documents submitted successfully',
        user: user.toPublicJSON(),
      });
    } catch (err) { next(err); }
  }
);


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

    res.json({ message: 'Card requested successfully', user: user.toPublicJSON() });
  } catch (err) { next(err); }
});

// @desc    Transfer money from checking balance to debit card balance
// @route   POST /api/users/card/fund
// @access  Private
router.post('/card/fund', protect, async (req, res, next) => {
  try {
    const numAmount = parseFloat(req.body.amount);
    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: 'Enter a valid positive amount' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.cardStatus !== 'Active') {
      return res.status(400).json({ error: 'An active debit card is required before funding it' });
    }
    if (user.balance < numAmount) {
      return res.status(400).json({ error: `Insufficient checking balance. Available: $${user.balance.toFixed(2)}` });
    }

    user.balance = parseFloat((user.balance - numAmount).toFixed(2));
    user.cardBalance = parseFloat(((user.cardBalance || 0) + numAmount).toFixed(2));
    await user.save();

    const Transaction = require('../models/Transaction');
    const tx = await Transaction.create({
      userId: user._id,
      type: 'debit',
      category: 'transfer_out',
      method: 'card',
      amount: numAmount,
      fee: 0,
      description: 'Transfer to Debit Card',
      note: `Card funded (${user.cardType || 'Debit'} •••• ${String(user.cardNumber || '').slice(-4)})`,
      status: 'completed',
      balanceAfter: user.balance,
    });

    await Notification.create({
      userId: user._id,
      title: 'Debit Card Funded',
      message: `$${numAmount.toFixed(2)} has been transferred from your checking balance to your debit card. Card balance: $${user.cardBalance.toFixed(2)}.`,
      type: 'transaction',
      priority: 'medium',
    });

    res.json({
      success: true,
      message: 'Funds transferred to your debit card successfully',
      balance: user.balance,
      cardBalance: user.cardBalance,
      transaction: tx,
      user: user.toPublicJSON(),
    });
  } catch (err) { next(err); }
});

module.exports = router;
