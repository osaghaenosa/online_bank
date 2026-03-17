const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { generateReceiptPDF } = require('../utils/receiptGenerator');
const path = require('path');
const fs = require('fs');

router.use(protect);

// Get receipt metadata
router.get('/:transactionId', async (req, res, next) => {
  try {
    const tx = await Transaction.findOne({
      transactionId: req.params.transactionId,
      userId: req.user._id
    }).populate('recipientId', 'firstName lastName email');

    if (!tx) return res.status(404).json({ error: 'Receipt not found' });
    res.json({ transaction: tx, user: req.user });
  } catch (err) { next(err); }
});

// Download/regenerate receipt PDF
router.get('/:transactionId/download', async (req, res, next) => {
  try {
    const tx = await Transaction.findOne({
      transactionId: req.params.transactionId,
      userId: req.user._id
    });
    if (!tx) return res.status(404).json({ error: 'Transaction not found' });

    const user = await User.findById(req.user._id);
    const receipt = await generateReceiptPDF(tx, user);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="NexaBank_Receipt_${tx.transactionId}.pdf"`);
    fs.createReadStream(receipt.filepath).pipe(res);
  } catch (err) { next(err); }
});

module.exports = router;
