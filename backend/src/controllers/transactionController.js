const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { generateReceiptPDF } = require('../utils/receiptGenerator');

const fmtUSD = (n) => '$' + Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

// ─── Deposit ─────────────────────────────────────────────────────────────────
exports.deposit = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { amount, method, description, note, cryptoDetails } = req.body;
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) return res.status(400).json({ error: 'Invalid amount' });
    if (numAmount > 50000) return res.status(400).json({ error: 'Maximum single deposit is $50,000' });

    // Calculate fees
    let fee = 0;
    if (method === 'card') fee = parseFloat((numAmount * 0.025).toFixed(2));
    if (method === 'wire') fee = 15;
    if (method && method.startsWith('crypto')) fee = 2.50;

    const user = await User.findById(req.user._id).session(session);
    const newBalance = parseFloat((user.balance + numAmount).toFixed(2));

    const tx = new Transaction({
      userId: req.user._id,
      type: 'credit',
      category: 'deposit',
      method: method || 'bank_transfer',
      amount: numAmount,
      fee,
      description: description || `${getMethodLabel(method)} Deposit`,
      note: note || '',
      status: method === 'card' ? 'completed' : 'completed',
      balanceAfter: newBalance,
      ...(cryptoDetails && {
        cryptoCoin: cryptoDetails.coin,
        cryptoAmount: cryptoDetails.coinAmount,
        cryptoNetwork: cryptoDetails.network,
        walletAddress: cryptoDetails.walletAddress
      })
    });
    await tx.save({ session });

    user.balance = newBalance;
    await user.save({ session });
    await session.commitTransaction();

    // Generate receipt
    const receipt = await generateReceiptPDF(tx, user);
    tx.receiptGenerated = true;
    tx.receiptUrl = receipt.url;
    await tx.save();

    // Notification
    await Notification.create({
      userId: user._id,
      title: 'Deposit Confirmed',
      message: `Your deposit of ${fmtUSD(numAmount)} via ${getMethodLabel(method)} has been processed. New balance: ${fmtUSD(newBalance)}`,
      type: 'transaction',
      priority: 'medium',
      link: `/receipts/${tx.transactionId}`
    });

    res.status(201).json({ transaction: tx, newBalance, receiptUrl: tx.receiptUrl });
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
};

// ─── Withdraw ─────────────────────────────────────────────────────────────────
exports.withdraw = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { amount, method, description, note, bankDetails, cardDetails, cryptoDetails } = req.body;
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) return res.status(400).json({ error: 'Invalid amount' });

    let fee = 0;
    if (method === 'wire') fee = 25;
    if (method === 'card') fee = 1.50;
    if (method && method.startsWith('crypto')) fee = 5.00;

    const total = parseFloat((numAmount + fee).toFixed(2));

    const user = await User.findById(req.user._id).session(session);
    if (user.balance < total) {
      await session.abortTransaction();
      return res.status(400).json({ error: `Insufficient funds. Available: ${fmtUSD(user.balance)}, Required: ${fmtUSD(total)}` });
    }
    if (numAmount > 10000) {
      await session.abortTransaction();
      return res.status(400).json({ error: 'Maximum single withdrawal is $10,000' });
    }

    const newBalance = parseFloat((user.balance - total).toFixed(2));

    const tx = new Transaction({
      userId: req.user._id,
      type: 'debit',
      category: 'withdrawal',
      method: method || 'ach',
      amount: numAmount,
      fee,
      description: description || `${getMethodLabel(method)} Withdrawal`,
      note: note || '',
      status: 'completed',
      balanceAfter: newBalance,
      metadata: { bankDetails, cardDetails, cryptoDetails }
    });

    if (cryptoDetails) {
      tx.cryptoCoin = cryptoDetails.coin;
      tx.cryptoAmount = cryptoDetails.coinAmount;
      tx.cryptoNetwork = cryptoDetails.network;
      tx.walletAddress = cryptoDetails.walletAddress;
    }

    await tx.save({ session });
    user.balance = newBalance;
    await user.save({ session });
    await session.commitTransaction();

    const receipt = await generateReceiptPDF(tx, user);
    tx.receiptGenerated = true;
    tx.receiptUrl = receipt.url;
    await tx.save();

    await Notification.create({
      userId: user._id,
      title: 'Withdrawal Processed',
      message: `Withdrawal of ${fmtUSD(numAmount)} via ${getMethodLabel(method)} completed. Fee: ${fmtUSD(fee)}. New balance: ${fmtUSD(newBalance)}`,
      type: 'transaction',
      link: `/receipts/${tx.transactionId}`
    });

    res.status(201).json({ transaction: tx, newBalance, receiptUrl: tx.receiptUrl });
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
};

// ─── Transfer ─────────────────────────────────────────────────────────────────
exports.transfer = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { amount, recipientEmail, recipientAccountNumber, description, note } = req.body;
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) return res.status(400).json({ error: 'Invalid amount' });
    if (numAmount > 5000) return res.status(400).json({ error: 'Maximum single transfer is $5,000' });

    const sender = await User.findById(req.user._id).session(session);
    if (sender.balance < numAmount) {
      await session.abortTransaction();
      return res.status(400).json({ error: `Insufficient funds. Available: ${fmtUSD(sender.balance)}` });
    }

    // Find recipient
    let recipient = null;
    if (recipientEmail) {
      recipient = await User.findOne({ email: recipientEmail }).session(session);
    } else if (recipientAccountNumber) {
      recipient = await User.findOne({ accountNumber: recipientAccountNumber }).session(session);
    }

    const senderNewBalance = parseFloat((sender.balance - numAmount).toFixed(2));

    // Debit sender
    const senderTx = new Transaction({
      userId: sender._id,
      type: 'debit',
      category: 'transfer_out',
      method: 'internal',
      amount: numAmount,
      fee: 0,
      description: description || `Transfer to ${recipient ? recipient.firstName + ' ' + recipient.lastName : recipientAccountNumber || recipientEmail}`,
      note: note || '',
      status: 'completed',
      balanceAfter: senderNewBalance,
      recipientId: recipient?._id,
      recipientName: recipient ? `${recipient.firstName} ${recipient.lastName}` : undefined,
      recipientAccount: recipientAccountNumber || recipient?.accountNumber
    });
    await senderTx.save({ session });
    sender.balance = senderNewBalance;
    await sender.save({ session });

    // Credit recipient if internal
    let recipientTx = null;
    if (recipient) {
      const recipientNewBalance = parseFloat((recipient.balance + numAmount).toFixed(2));
      recipientTx = new Transaction({
        userId: recipient._id,
        type: 'credit',
        category: 'transfer_in',
        method: 'internal',
        amount: numAmount,
        fee: 0,
        description: `Transfer from ${sender.firstName} ${sender.lastName}`,
        note: note || '',
        status: 'completed',
        balanceAfter: recipientNewBalance,
        recipientId: sender._id,
        recipientName: `${sender.firstName} ${sender.lastName}`
      });
      await recipientTx.save({ session });
      recipient.balance = recipientNewBalance;
      await recipient.save({ session });
    }

    await session.commitTransaction();

    // Generate receipts
    const receiptSender = await generateReceiptPDF(senderTx, sender);
    senderTx.receiptGenerated = true;
    senderTx.receiptUrl = receiptSender.url;
    await senderTx.save();

    // Notifications
    await Notification.create([
      {
        userId: sender._id,
        title: 'Transfer Sent',
        message: `You sent ${fmtUSD(numAmount)} to ${senderTx.recipientName || recipientAccountNumber || recipientEmail}. New balance: ${fmtUSD(senderNewBalance)}`,
        type: 'transaction',
        link: `/receipts/${senderTx.transactionId}`
      },
      ...(recipient ? [{
        userId: recipient._id,
        title: 'Money Received',
        message: `You received ${fmtUSD(numAmount)} from ${sender.firstName} ${sender.lastName}`,
        type: 'transaction'
      }] : [])
    ]);

    res.status(201).json({
      transaction: senderTx,
      newBalance: senderNewBalance,
      recipientFound: !!recipient,
      receiptUrl: senderTx.receiptUrl
    });
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
};

// ─── Get Transactions ─────────────────────────────────────────────────────────
exports.getTransactions = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, category, type, search, startDate, endDate } = req.query;
    const query = { userId: req.user._id };

    if (status && status !== 'all') query.status = status;
    if (category && category !== 'all') query.category = category;
    if (type && type !== 'all') query.type = type;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    if (search) {
      query.$or = [
        { description: { $regex: search, $options: 'i' } },
        { transactionId: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await Transaction.countDocuments(query);
    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('recipientId', 'firstName lastName email');

    // Summary stats
    const stats = await Transaction.aggregate([
      { $match: { userId: req.user._id, status: 'completed' } },
      { $group: {
        _id: '$type',
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }}
    ]);

    res.json({
      transactions,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
      stats: stats.reduce((acc, s) => ({ ...acc, [s._id]: { total: s.total, count: s.count } }), {})
    });
  } catch (err) { next(err); }
};

// ─── Get single transaction ────────────────────────────────────────────────────
exports.getTransaction = async (req, res, next) => {
  try {
    const tx = await Transaction.findOne({
      $or: [{ _id: req.params.id }, { transactionId: req.params.id }],
      userId: req.user._id
    }).populate('recipientId', 'firstName lastName email');

    if (!tx) return res.status(404).json({ error: 'Transaction not found' });
    res.json({ transaction: tx });
  } catch (err) { next(err); }
};

// ─── Bill Payment ──────────────────────────────────────────────────────────────
exports.payBill = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { amount, billType, accountNumber, description } = req.body;
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) return res.status(400).json({ error: 'Invalid amount' });

    const user = await User.findById(req.user._id).session(session);
    if (user.balance < numAmount) {
      await session.abortTransaction();
      return res.status(400).json({ error: 'Insufficient funds' });
    }

    const newBalance = parseFloat((user.balance - numAmount).toFixed(2));
    const tx = new Transaction({
      userId: user._id, type: 'debit', category: 'bill', method: 'internal',
      amount: numAmount, fee: 0,
      description: description || `${billType} Bill Payment`,
      note: `Account: ${accountNumber}`,
      status: 'completed', balanceAfter: newBalance,
      metadata: { billType, accountNumber }
    });
    await tx.save({ session });
    user.balance = newBalance;
    await user.save({ session });
    await session.commitTransaction();

    const receipt = await generateReceiptPDF(tx, user);
    tx.receiptUrl = receipt.url; tx.receiptGenerated = true;
    await tx.save();

    await Notification.create({
      userId: user._id, title: 'Bill Payment Successful',
      message: `${billType} bill payment of ${fmtUSD(numAmount)} processed.`,
      type: 'transaction', link: `/receipts/${tx.transactionId}`
    });

    res.status(201).json({ transaction: tx, newBalance, receiptUrl: tx.receiptUrl });
  } catch (err) { await session.abortTransaction(); next(err); }
  finally { session.endSession(); }
};

function getMethodLabel(method) {
  const labels = {
    bank_transfer: 'Bank Transfer', ach: 'ACH Transfer', wire: 'Wire Transfer',
    card: 'Card', crypto_btc: 'Bitcoin', crypto_eth: 'Ethereum',
    crypto_usdt: 'USDT', crypto_bnb: 'BNB', crypto_sol: 'Solana',
    paypal: 'PayPal', cashapp: 'Cash App', venmo: 'Venmo', zelle: 'Zelle',
    apple_pay: 'Apple Pay', google_pay: 'Google Pay', internal: 'Internal'
  };
  return labels[method] || method || 'Bank Transfer';
}
