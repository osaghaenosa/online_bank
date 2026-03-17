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
    street: String,
    city:   String,
    state:  String,
    zip:    String,
    country: { type: String, default: 'US' }
  },

  // Banking details
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
  profilePicture:   { type: String, default: null },

  // Notification preferences
  notifications: {
    email:     { type: Boolean, default: true },
    sms:       { type: Boolean, default: false },
    push:      { type: Boolean, default: true },
  },

  linkedAccounts: [{
    type:        { type: String, enum: ['bank', 'card', 'crypto', 'paypal', 'cashapp', 'venmo'] },
    label:       String,
    lastFour:    String,
    isDefault:   { type: Boolean, default: false },
    addedAt:     { type: Date, default: Date.now }
  }],

  lastLogin:  { type: Date },
  createdAt:  { type: Date, default: Date.now },
  updatedAt:  { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Hash password before save
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Generate account number
userSchema.pre('save', async function(next) {
  if (!this.accountNumber) {
    this.accountNumber = generateAccountNumber();
    this.cardNumber = generateCardNumber();
    this.cardExpiry = generateExpiry();
    this.cvv = Math.floor(100 + Math.random() * 900).toString();
  }
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toPublicJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  // Mask sensitive data
  if (obj.cardNumber) {
    obj.cardNumberMasked = '**** **** **** ' + obj.cardNumber.slice(-4);
  }
  if (obj.cvv) {
    obj.cvvMasked = '***';
  }
  return obj;
};

function generateAccountNumber() {
  return Array.from({ length: 12 }, () => Math.floor(Math.random() * 10)).join('');
}

function generateCardNumber() {
  return Array.from({ length: 16 }, () => Math.floor(Math.random() * 10)).join('');
}

function generateExpiry() {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 4);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const y = String(d.getFullYear()).slice(-2);
  return `${m}/${y}`;
}

module.exports = mongoose.model('User', userSchema);
