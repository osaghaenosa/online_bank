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
