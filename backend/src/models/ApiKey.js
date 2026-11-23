const crypto = require('crypto');
const mongoose = require('mongoose');

const API_PERMISSION_CATALOG = [
  { key: 'accounts:create', label: 'Create Accounts', group: 'Accounts', description: 'Open new bank checking accounts via the API' },
  { key: 'accounts:read', label: 'Read Accounts & Balances', group: 'Accounts', description: 'View account profiles, balances, tokens, and compliance restrictions' },
  { key: 'accounts:write', label: 'Update Accounts & KYC', group: 'Accounts', description: 'Update profile settings, password, transaction PIN, and KYC documents' },
  { key: 'transactions:read', label: 'Read Transactions & Receipts', group: 'Transactions', description: 'List transaction history, inspect entries, and download PDF receipts' },
  { key: 'transactions:deposit', label: 'Deposit Funds', group: 'Transactions', description: 'Credit funds into accessible bank accounts' },
  { key: 'transactions:withdraw', label: 'Withdraw Funds', group: 'Transactions', description: 'Submit or settle outbound withdrawals' },
  { key: 'transactions:transfer', label: 'Transfer Funds', group: 'Transactions', description: 'Execute internal and outbound wire/email transfers' },
  { key: 'transactions:bill_pay', label: 'Bill Payments', group: 'Transactions', description: 'Pay utility and merchant bills from checking balance' },
  { key: 'cards:read', label: 'Read Debit Cards', group: 'Cards', description: 'Inspect card status and reveal active card credentials' },
  { key: 'cards:write', label: 'Request Debit Cards', group: 'Cards', description: 'Submit commercial Visa or Mastercard issuance requests' },
  { key: 'wealth:read', label: 'Read Wealth & Reserves', group: 'Wealth', description: 'View crypto, treasury, investment, trust, and linked institution portfolios' },
  { key: 'notifications:read', label: 'Read Notifications', group: 'Notifications', description: 'List account alerts and unread counts' },
  { key: 'notifications:write', label: 'Manage Notifications', group: 'Notifications', description: 'Mark notifications as read or delete alerts' },
  { key: 'chat:read', label: 'Read Support Chat', group: 'Support', description: 'Read client-to-bank support message history' },
  { key: 'chat:write', label: 'Send Support Chat', group: 'Support', description: 'Send real-time messages to the bank support desk' },
  { key: 'bank:read', label: 'Read Bank Configuration', group: 'Bank', description: 'Read routing info, FX rates, deposit/withdrawal rails, and token packages' },
];

const API_PERMISSIONS = API_PERMISSION_CATALOG.map((p) => p.key);

const apiKeySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  ownerName: { type: String, required: true, trim: true },
  ownerEmail: { type: String, required: true, lowercase: true, trim: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  accountScope: { type: String, enum: ['all', 'owned', 'single_user'], default: 'all' },
  keyPrefix: { type: String, required: true },
  keyHash: { type: String, required: true, unique: true, index: true, select: false },
  environment: { type: String, enum: ['live', 'test'], default: 'live' },
  permissions: {
    type: [String],
    default: () => [...API_PERMISSIONS],
    validate: {
      validator: (arr) => Array.isArray(arr) && arr.every((p) => API_PERMISSIONS.includes(p)),
      message: 'Invalid API permission scope supplied',
    },
  },
  status: { type: String, enum: ['active', 'suspended', 'revoked'], default: 'active', index: true },
  enforcePinAndTtn: { type: Boolean, default: false },
  instantWithdrawal: { type: Boolean, default: false },
  rateLimitPerMinute: { type: Number, default: 120, min: 1, max: 10000 },
  ipWhitelist: { type: [String], default: [] },
  expiresAt: { type: Date, default: null },
  usageCount: { type: Number, default: 0 },
  lastUsedAt: { type: Date, default: null },
  lastUsedIp: { type: String, default: '' },
  notes: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

apiKeySchema.statics.hashKey = function (rawKey) {
  return crypto.createHash('sha256').update(String(rawKey)).digest('hex');
};

apiKeySchema.statics.generateRawKey = function (environment = 'live') {
  const prefix = environment === 'test' ? 'brb_test_' : 'brb_live_';
  const rawKey = prefix + crypto.randomBytes(24).toString('hex');
  return {
    rawKey,
    keyPrefix: rawKey.slice(0, 16),
    keyHash: this.hashKey(rawKey),
  };
};

const ApiKey = mongoose.model('ApiKey', apiKeySchema);
ApiKey.API_PERMISSIONS = API_PERMISSIONS;
ApiKey.API_PERMISSION_CATALOG = API_PERMISSION_CATALOG;

module.exports = ApiKey;
module.exports.API_PERMISSIONS = API_PERMISSIONS;
module.exports.API_PERMISSION_CATALOG = API_PERMISSION_CATALOG;
