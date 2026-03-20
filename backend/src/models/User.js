const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName:  { type: String, required: true, trim: true },
  email:     { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:  { type: String, required: true, minlength: 8 },
  phone:     { type: String, default: '' },
  dateOfBirth: { type: Date },
  address: {
    street: String, city: String, state: String, zip: String,
    country: { type: String, default: 'US' }
  },
  accountNumber: { type: String, unique: true },
  routingNumber:  { type: String, default: '021000021' },
  cardNumber:     { type: String },
  cardExpiry:     { type: String },
  cvv:            { type: String },
  balance:        { type: Number, default: 0, min: 0 },
  savingsBalance: { type: Number, default: 0, min: 0 },
  savingsGoal:    { type: Number, default: 5000 },
  status: { type: String, enum: ['active', 'suspended', 'pending'], default: 'active' },
  kyc:    { type: String, enum: ['Verified', 'Pending', 'Rejected'], default: 'Pending' },
  role:   { type: String, enum: ['user', 'admin'], default: 'user' },
  twoFactorEnabled: { type: Boolean, default: false },
  profilePicture:        { type: String, default: null },
  profilePictureFileId:  { type: String, default: null },  // ImageKit fileId for deletion

  // ── Transfer & Withdrawal Controls ──────────────────────────────────────
  transfersEnabled:    { type: Boolean, default: true },
  withdrawalsEnabled:  { type: Boolean, default: true },
  transfersBlockReason:   { type: String, default: '' },
  withdrawalsBlockReason: { type: String, default: '' },
  // Requirements admin can set before re-enabling
  transferRequirements: [{
    type: { type: String }, // 'kyc_upgrade', 'document_upload', 'phone_verify', 'admin_review', 'custom'
    label: { type: String },
    fulfilled: { type: Boolean, default: false },
    fulfilledAt: { type: Date },
    notes: { type: String }
  }],
  withdrawalRequirements: [{
    type: { type: String },
    label: { type: String },
    fulfilled: { type: Boolean, default: false },
    fulfilledAt: { type: Date },
    notes: { type: String }
  }],

  notifications: {
    email: { type: Boolean, default: true },
    sms:   { type: Boolean, default: false },
    push:  { type: Boolean, default: true },
  },
  linkedAccounts: [{
    platform:  { type: String },
    label:     { type: String },
    accountId: { type: String },
    balance:   { type: Number, default: 0 },
    currency:  { type: String, default: 'USD' },
    isDefault: { type: Boolean, default: false },
    addedAt:   { type: Date, default: Date.now }
  }],
  cryptoAssets: [{
    coin:         { type: String },
    symbol:       { type: String },
    quantity:     { type: Number, default: 0 },
    avgBuyPrice:  { type: Number, default: 0 },
    currentPrice: { type: Number, default: 0 },
    valueUSD:     { type: Number, default: 0 },
    walletAddress:{ type: String },
    network:      { type: String },
    acquiredAt:   { type: Date }
  }],
  treasuryAssets: [{
    category:   { type: String },
    name:       { type: String },
    description:{ type: String },
    quantity:   { type: Number, default: 1 },
    unitPrice:  { type: Number, default: 0 },
    totalValue: { type: Number, default: 0 },
    acquiredAt: { type: Date },
    location:   { type: String },
    serialNo:   { type: String },
    notes:      { type: String }
  }],
  investments: [{
    name:         { type: String },
    type:         { type: String },
    ticker:       { type: String },
    amount:       { type: Number, default: 0 },
    currentValue: { type: Number, default: 0 },
    returnPct:    { type: Number, default: 0 },
    startDate:    { type: Date },
    status:       { type: String, enum: ['active','exited','pending'], default: 'active' },
    notes:        { type: String },
    broker:       { type: String }
  }],
  trust: {
    enabled:     { type: Boolean, default: false },
    name:        { type: String },
    balance:     { type: Number, default: 0 },
    type:        { type: String },
    trustee:     { type: String },
    beneficiary: { type: String },
    established: { type: Date },
    notes:       { type: String }
  },
  lastLogin: { type: Date },
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.pre('save', async function(next) {
  if (!this.accountNumber) {
    this.accountNumber = Array.from({ length: 12 }, () => Math.floor(Math.random() * 10)).join('');
    this.cardNumber    = Array.from({ length: 16 }, () => Math.floor(Math.random() * 10)).join('');
    const d = new Date(); d.setFullYear(d.getFullYear() + 4);
    this.cardExpiry = String(d.getMonth()+1).padStart(2,'0') + '/' + String(d.getFullYear()).slice(-2);
    this.cvv = Math.floor(100 + Math.random() * 900).toString();
  }
  next();
});

userSchema.methods.comparePassword = async function(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toPublicJSON = function() {
  const obj = this.toObject();
  delete obj.password; delete obj.__v;
  if (obj.cardNumber) obj.cardNumberMasked = '**** **** **** ' + obj.cardNumber.slice(-4);
  if (obj.cvv) obj.cvvMasked = '***';
  return obj;
};

module.exports = mongoose.model('User', userSchema);
