const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const transactionSchema = new mongoose.Schema({
  transactionId: { type: String, unique: true, default: () => 'TXN' + uuidv4().replace(/-/g,'').toUpperCase().slice(0, 12) },
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type:      { type: String, enum: ['credit', 'debit'], required: true },
  category:  {
    type: String,
    enum: ['deposit', 'withdrawal', 'transfer_in', 'transfer_out', 'payment', 'refund', 'fee', 'interest', 'crypto', 'bill', 'shopping', 'food', 'transport', 'health', 'entertainment', 'salary', 'other'],
    required: true
  },
  method:    {
    type: String,
    enum: ['bank_transfer', 'ach', 'wire', 'card', 'crypto_btc', 'crypto_eth', 'crypto_usdt', 'crypto_bnb', 'crypto_sol', 'paypal', 'cashapp', 'venmo', 'zelle', 'apple_pay', 'google_pay', 'internal'],
    default: 'bank_transfer'
  },

  amount:      { type: Number, required: true, min: 0.01 },
  fee:         { type: Number, default: 0 },
  netAmount:   { type: Number }, // amount - fee
  currency:    { type: String, default: 'USD' },

  description: { type: String, required: true },
  note:        { type: String, default: '' },

  status:      { type: String, enum: ['pending', 'completed', 'failed', 'cancelled', 'processing'], default: 'pending' },

  // For transfers between accounts
  recipientId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  recipientName:   { type: String },
  recipientAccount:{ type: String },
  recipientRouting:{ type: String },

  // For crypto
  cryptoCoin:    { type: String },
  cryptoAmount:  { type: Number },
  cryptoNetwork: { type: String },
  walletAddress: { type: String },

  // Receipt
  receiptGenerated: { type: Boolean, default: false },
  receiptUrl:       { type: String },

  // Balance snapshot after transaction
  balanceAfter: { type: Number },

  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },

  completedAt: { type: Date },
  failedAt:    { type: Date },
  failReason:  { type: String },
}, {
  timestamps: true
});

// Pre-save: calculate netAmount
transactionSchema.pre('save', function(next) {
  this.netAmount = this.amount - (this.fee || 0);
  if (this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  next();
});

// Virtual: formatted amount
transactionSchema.virtual('formattedAmount').get(function() {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(this.amount);
});

transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ transactionId: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
