const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const mongoose = require('mongoose');

exports.getDashboard = async (req, res, next) => {
  try {
    const [totalUsers, totalTransactions, pendingTxs, suspendedUsers] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Transaction.countDocuments(),
      Transaction.countDocuments({ status: 'pending' }),
      User.countDocuments({ status: 'suspended' })
    ]);
    const balanceAgg  = await User.aggregate([{ $group: { _id: null, total: { $sum: '$balance' } } }]);
    const txVolumeAgg = await Transaction.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);
    const recentTxs   = await Transaction.find().sort({ createdAt: -1 }).limit(10).populate('userId', 'firstName lastName email');
    const recentUsers = await User.find({ role: 'user' }).sort({ createdAt: -1 }).limit(5).select('-password');
    res.json({
      stats: {
        totalUsers, totalTransactions, pendingTxs, suspendedUsers,
        systemBalance: balanceAgg[0]?.total || 0,
        txVolume: txVolumeAgg.reduce((acc, v) => ({ ...acc, [v._id]: { total: v.total, count: v.count } }), {})
      },
      recentTransactions: recentTxs, recentUsers
    });
  } catch (err) { next(err); }
};

exports.getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const query = { role: 'user' };
    if (status) query.status = status;
    if (search) query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName:  { $regex: search, $options: 'i' } },
      { email:     { $regex: search, $options: 'i' } }
    ];
    const total = await User.countDocuments(query);
    const users = await User.find(query).select('-password').sort({ createdAt: -1 })
      .skip((page - 1) * limit).limit(parseInt(limit));
    res.json({ users: users.map(u => u.toPublicJSON()), pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
};

exports.getUserDetail = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    const txs = await Transaction.find({ userId: user._id }).sort({ createdAt: -1 }).limit(20);
    res.json({ user: user.toPublicJSON(), transactions: txs });
  } catch (err) { next(err); }
};

exports.editUserName = async (req, res, next) => {
  try {
    const { firstName, lastName } = req.body;
    if (!firstName?.trim() || !lastName?.trim()) return res.status(400).json({ error: 'First and last name required' });
    const user = await User.findByIdAndUpdate(req.params.id,
      { firstName: firstName.trim(), lastName: lastName.trim() },
      { new: true, runValidators: true }).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user: user.toPublicJSON() });
  } catch (err) { next(err); }
};

// ── Block / Unblock Transfers ─────────────────────────────────────────────────
exports.setTransferAccess = async (req, res, next) => {
  try {
    const { enabled, reason, requirements } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.transfersEnabled = !!enabled;
    user.transfersBlockReason = enabled ? '' : (reason || 'Transfers blocked by administrator');
    if (!enabled && requirements && requirements.length > 0) {
      user.transferRequirements = requirements.map(r => ({
        type: r.type, label: r.label, fulfilled: false, notes: r.notes || ''
      }));
    }
    if (enabled) user.transferRequirements = [];
    await user.save({ validateBeforeSave: false });

    await Notification.create({
      userId: user._id,
      title: enabled ? 'Transfer Capability Restored' : 'Transfer Capability Blocked',
      message: enabled
        ? 'Your ability to make transfers has been restored by an administrator.'
        : `Transfer capability has been blocked. Reason: ${user.transfersBlockReason}`,
      type: 'security', priority: 'high'
    });

    res.json({ user: user.toPublicJSON() });
  } catch (err) { next(err); }
};

// ── Block / Unblock Withdrawals ───────────────────────────────────────────────
exports.setWithdrawalAccess = async (req, res, next) => {
  try {
    const { enabled, reason, requirements } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.withdrawalsEnabled = !!enabled;
    user.withdrawalsBlockReason = enabled ? '' : (reason || 'Withdrawals blocked by administrator');
    if (!enabled && requirements && requirements.length > 0) {
      user.withdrawalRequirements = requirements.map(r => ({
        type: r.type, label: r.label, fulfilled: false, notes: r.notes || ''
      }));
    }
    if (enabled) user.withdrawalRequirements = [];
    await user.save({ validateBeforeSave: false });

    await Notification.create({
      userId: user._id,
      title: enabled ? 'Withdrawal Capability Restored' : 'Withdrawal Capability Blocked',
      message: enabled
        ? 'Your ability to make withdrawals has been restored by an administrator.'
        : `Withdrawal capability has been blocked. Reason: ${user.withdrawalsBlockReason}`,
      type: 'security', priority: 'high'
    });

    res.json({ user: user.toPublicJSON() });
  } catch (err) { next(err); }
};

// ── Fulfill a requirement ─────────────────────────────────────────────────────
exports.fulfillRequirement = async (req, res, next) => {
  try {
    const { reqType, reqId } = req.body; // reqType: 'transfer' | 'withdrawal'
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const arr = reqType === 'transfer' ? user.transferRequirements : user.withdrawalRequirements;
    const item = arr.id(reqId);
    if (!item) return res.status(404).json({ error: 'Requirement not found' });
    item.fulfilled   = true;
    item.fulfilledAt = new Date();
    await user.save({ validateBeforeSave: false });

    // Auto-enable if all requirements fulfilled
    const allDone = arr.every(r => r.fulfilled);
    if (allDone) {
      if (reqType === 'transfer')   { user.transfersEnabled = true; user.transfersBlockReason = ''; }
      if (reqType === 'withdrawal') { user.withdrawalsEnabled = true; user.withdrawalsBlockReason = ''; }
      await user.save({ validateBeforeSave: false });
      await Notification.create({
        userId: user._id,
        title: `${reqType === 'transfer' ? 'Transfer' : 'Withdrawal'} Capability Restored`,
        message: `All requirements fulfilled. Your ${reqType} capability has been automatically restored.`,
        type: 'system', priority: 'high'
      });
    }

    res.json({ user: user.toPublicJSON(), allRequirementsFulfilled: allDone });
  } catch (err) { next(err); }
};

exports.adjustBalance = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { userId, amount, type, description } = req.body;
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) return res.status(400).json({ error: 'Invalid amount' });
    const user = await User.findById(userId).session(session);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const delta = type === 'credit' ? numAmount : -numAmount;
    const newBalance = parseFloat((user.balance + delta).toFixed(2));
    if (newBalance < 0) { await session.abortTransaction(); return res.status(400).json({ error: 'Cannot reduce balance below zero' }); }
    const tx = new Transaction({
      userId, type, category: type === 'credit' ? 'deposit' : 'withdrawal',
      method: 'internal', amount: numAmount, fee: 0,
      description: description || `Admin ${type === 'credit' ? 'Credit' : 'Debit'}`,
      status: 'completed', balanceAfter: newBalance
    });
    await tx.save({ session }); user.balance = newBalance; await user.save({ session });
    await session.commitTransaction();
    await Notification.create({
      userId, title: 'Balance Adjusted',
      message: `Your balance has been ${type === 'credit' ? 'credited' : 'debited'} $${numAmount} by an administrator. ${description || ''}`,
      type: 'system', priority: 'high'
    });
    res.json({ user: user.toPublicJSON(), transaction: tx, newBalance });
  } catch (err) { await session.abortTransaction(); next(err); }
  finally { session.endSession(); }
};

exports.toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.status = user.status === 'active' ? 'suspended' : 'active';
    await user.save({ validateBeforeSave: false });
    await Notification.create({
      userId: user._id,
      title: user.status === 'suspended' ? 'Account Suspended' : 'Account Activated',
      message: user.status === 'suspended'
        ? 'Your account has been suspended. Contact support.' : 'Your account has been reactivated. Welcome back!',
      type: 'security', priority: 'high'
    });
    res.json({ user: user.toPublicJSON() });
  } catch (err) { next(err); }
};

exports.updateTransactionStatus = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { status, reason } = req.body;
    const tx = await Transaction.findById(req.params.id).session(session);
    if (!tx) { await session.abortTransaction(); return res.status(404).json({ error: 'Transaction not found' }); }

    const oldStatus = tx.status;

    // ── Approve a pending withdrawal ─────────────────────────────────────────
    if (tx.category === 'withdrawal' && tx.status === 'pending' && status === 'completed') {
      const user = await User.findById(tx.userId).session(session);
      if (!user) { await session.abortTransaction(); return res.status(404).json({ error: 'User not found' }); }

      const total = parseFloat((tx.amount + (tx.fee || 0)).toFixed(2));
      if (user.balance < total) {
        await session.abortTransaction();
        return res.status(400).json({ error: `Insufficient funds for approval. Balance: $${user.balance.toFixed(2)}, Required: $${total.toFixed(2)}` });
      }

      const newBalance = parseFloat((user.balance - total).toFixed(2));
      user.balance     = newBalance;
      tx.balanceAfter  = newBalance;
      tx.status        = 'completed';
      tx.completedAt   = new Date();

      await user.save({ session });
      await tx.save({ session });
      await session.commitTransaction();

      await Notification.create({
        userId: tx.userId, title: 'Withdrawal Approved ✅',
        message: `Your withdrawal of $${tx.amount.toFixed(2)} has been approved and processed. $${total.toFixed(2)} (including fees) has been deducted from your account. New balance: $${newBalance.toFixed(2)}.`,
        type: 'transaction', priority: 'high'
      });

      return res.json({ transaction: tx, newBalance, approved: true });
    }

    // ── Reject a pending withdrawal ──────────────────────────────────────────
    if (tx.category === 'withdrawal' && tx.status === 'pending' && status === 'failed') {
      tx.status    = 'failed';
      tx.failedAt  = new Date();
      tx.failReason = reason || 'Rejected by administrator';
      await tx.save({ session });
      await session.commitTransaction();

      await Notification.create({
        userId: tx.userId, title: 'Withdrawal Rejected ❌',
        message: `Your withdrawal request of $${tx.amount.toFixed(2)} has been rejected. Reason: ${reason || 'Not approved by administrator'}. No funds have been deducted from your account.`,
        type: 'transaction', priority: 'high'
      });

      return res.json({ transaction: tx, rejected: true });
    }

    // ── Generic status change (non-withdrawal or already processed) ───────────
    tx.status = status;
    if (status === 'failed')    { tx.failedAt = new Date(); tx.failReason = reason; }
    if (status === 'completed')   tx.completedAt = new Date();
    await tx.save({ session });
    await session.commitTransaction();

    await Notification.create({
      userId: tx.userId, title: 'Transaction Updated',
      message: `Transaction ${tx.transactionId} status changed from ${oldStatus} to ${status}${reason ? ': ' + reason : ''}`,
      type: 'transaction'
    });

    res.json({ transaction: tx });
  } catch (err) { await session.abortTransaction(); next(err); }
  finally { session.endSession(); }
};

exports.sendNotification = async (req, res, next) => {
  try {
    const { userId, title, message, type, priority } = req.body;
    if (userId === 'all') {
      const users = await User.find({ role: 'user' }).select('_id');
      const notifs = users.map(u => ({ userId: u._id, title, message, type: type || 'system', priority: priority || 'medium' }));
      await Notification.insertMany(notifs);
      return res.json({ sent: notifs.length });
    }
    await Notification.create({ userId, title, message, type: type || 'system', priority: priority || 'medium' });
    res.json({ sent: 1 });
  } catch (err) { next(err); }
};

exports.getAllTransactions = async (req, res, next) => {
  try {
    const { page = 1, limit = 25, status, type } = req.query;
    const query = {};
    if (status && status !== 'all') query.status = status;
    if (type   && type   !== 'all') query.type   = type;
    const total = await Transaction.countDocuments(query);
    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit))
      .populate('userId', 'firstName lastName email');
    res.json({ transactions, pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
};

// ── Edit user credentials (email + password) ──────────────────────────────────
exports.editUserCredentials = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (email && email.trim()) {
      const emailLower = email.trim().toLowerCase();
      const existing = await User.findOne({ email: emailLower, _id: { $ne: user._id } });
      if (existing) return res.status(400).json({ error: 'Email already in use by another account' });
      user.email = emailLower;
    }
    if (password && password.length >= 8) {
      user.password = password; // pre-save hook will hash it
    } else if (password && password.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    await user.save();

    await Notification.create({
      userId: user._id,
      title: 'Account Credentials Updated',
      message: `Your account ${email ? 'email' : ''}${email && password ? ' and ' : ''}${password ? 'password' : ''} ha${email && password ? 've' : 's'} been updated by an administrator.`,
      type: 'security', priority: 'high'
    });

    res.json({ user: user.toPublicJSON() });
  } catch (err) { next(err); }
};

// ── Get deposit method settings ───────────────────────────────────────────────
exports.getDepositSettings = async (req, res, next) => {
  try {
    const Settings = require('../models/AppSettings');
    const s = await Settings.findOne({ key: 'deposit_methods' });
    res.json({ settings: s?.value || null });
  } catch (err) { next(err); }
};

// ── Save deposit method settings ──────────────────────────────────────────────
exports.saveDepositSettings = async (req, res, next) => {
  try {
    const Settings = require('../models/AppSettings');
    const { methods } = req.body;
    await Settings.findOneAndUpdate(
      { key: 'deposit_methods' },
      { key: 'deposit_methods', value: methods, updatedAt: new Date() },
      { upsert: true, new: true }
    );
    res.json({ success: true });
  } catch (err) { next(err); }
};

// ── Edit a transaction (admin) ─────────────────────────────────────────────────
exports.editTransaction = async (req, res, next) => {
  try {
    const { description, amount, fee, type, category, method, status, note, date } = req.body;
    const tx = await Transaction.findById(req.params.id);
    if (!tx) return res.status(404).json({ error: 'Transaction not found' });

    if (description !== undefined) tx.description = description;
    if (note        !== undefined) tx.note        = note;
    if (type        !== undefined) tx.type        = type;
    if (category    !== undefined) tx.category    = category;
    if (method      !== undefined) tx.method      = method;
    if (status      !== undefined) tx.status      = status;
    if (date        !== undefined) tx.createdAt   = new Date(date);
    if (amount      !== undefined) {
      const num = parseFloat(amount);
      if (!isNaN(num) && num > 0) tx.amount = num;
    }
    if (fee !== undefined) {
      const f = parseFloat(fee);
      if (!isNaN(f) && f >= 0) tx.fee = f;
    }

    await tx.save();
    res.json({ transaction: tx });
  } catch (err) { next(err); }
};

// ── Delete a transaction (admin) ──────────────────────────────────────────────
exports.deleteTransaction = async (req, res, next) => {
  try {
    const tx = await Transaction.findById(req.params.id);
    if (!tx) return res.status(404).json({ error: 'Transaction not found' });
    await tx.deleteOne();
    res.json({ success: true });
  } catch (err) { next(err); }
};

// ── Get all transactions for a specific user (admin) ──────────────────────────
exports.getUserTransactions = async (req, res, next) => {
  try {
    const { page = 1, limit = 25 } = req.query;
    const total = await Transaction.countDocuments({ userId: req.params.userId });
    const transactions = await Transaction.find({ userId: req.params.userId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    const user = await User.findById(req.params.userId).select('firstName lastName email balance');
    res.json({ transactions, user, pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
};

// ── Withdrawal method settings ─────────────────────────────────────────────────
exports.getWithdrawalSettings = async (req, res, next) => {
  try {
    const Settings = require('../models/AppSettings');
    const s = await Settings.findOne({ key: 'withdrawal_methods' });
    res.json({ settings: s?.value || null });
  } catch (err) { next(err); }
};

exports.saveWithdrawalSettings = async (req, res, next) => {
  try {
    const Settings = require('../models/AppSettings');
    const { methods } = req.body;
    await Settings.findOneAndUpdate(
      { key: 'withdrawal_methods' },
      { key: 'withdrawal_methods', value: methods, updatedAt: new Date() },
      { upsert: true, new: true }
    );
    res.json({ success: true });
  } catch (err) { next(err); }
};

// ── Upload user profile picture via ImageKit ───────────────────────────────────
exports.uploadUserPhoto = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided. Please attach an image.' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { uploadToImageKit } = require('../utils/imagekit');

    const ext      = req.file.originalname.split('.').pop() || 'jpg';
    const fileName = `avatar_${user._id}_${Date.now()}.${ext}`;

    // Upload buffer directly to ImageKit — nothing saved locally
    const result = await uploadToImageKit(req.file.buffer, fileName, '/nexabank/avatars');

    // Save the CDN URL (and optionally fileId for future deletion)
    user.profilePicture        = result.url;
    user.profilePictureFileId  = result.fileId;   // stored so we can delete old one later
    await user.save({ validateBeforeSave: false });

    res.json({
      user:        user.toPublicJSON(),
      profilePicture: result.url,
      fileId:         result.fileId,
    });
  } catch (err) {
    // Give a clear message if ImageKit isn't configured yet
    if (err.message && err.message.includes('ImageKit environment')) {
      return res.status(500).json({ error: err.message });
    }
    next(err);
  }
};

// ── Delete user profile picture ────────────────────────────────────────────────
exports.deleteUserPhoto = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.profilePictureFileId) {
      const { deleteFromImageKit } = require('../utils/imagekit');
      await deleteFromImageKit(user.profilePictureFileId);
    }

    user.profilePicture       = null;
    user.profilePictureFileId = null;
    await user.save({ validateBeforeSave: false });

    res.json({ user: user.toPublicJSON() });
  } catch (err) { next(err); }
};

// ── Generic image upload to ImageKit ─────────────────────────────────────────
// Used for QR codes, payment method images, any admin-uploaded asset
exports.uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided.' });
    }

    const { uploadToImageKit } = require('../utils/imagekit');

    // folder query param lets caller specify: /nexabank/qrcodes, /nexabank/avatars, etc.
    const folder   = req.query.folder || '/nexabank/uploads';
    const ext      = (req.file.originalname.split('.').pop() || 'jpg').toLowerCase();
    const prefix   = req.query.prefix || 'img';
    const fileName = `${prefix}_${Date.now()}.${ext}`;

    const result = await uploadToImageKit(req.file.buffer, fileName, folder);

    res.json({
      url:    result.url,
      fileId: result.fileId,
      name:   result.name,
    });
  } catch (err) {
    if (err.message && err.message.includes('ImageKit environment')) {
      return res.status(500).json({ error: err.message });
    }
    next(err);
  }
};
