const fs = require('fs');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const ChatMessage = require('../models/ChatMessage');
const AppSettings = require('../models/AppSettings');
const { API_PERMISSION_CATALOG } = require('../models/ApiKey');
const { generateReceiptPDF } = require('../utils/receiptGenerator');
const { sendEmail } = require('../utils/email');
const { uploadToImageKit } = require('../utils/imagekit');
const { sendSuccess, sendError } = require('../middleware/apiKeyAuth');

const FX_RATES = { USD: 1, GBP: 0.79, EUR: 0.92 };
const VALID_METHODS = [
  'bank_transfer', 'ach', 'wire', 'iban', 'card',
  'crypto_btc', 'crypto_eth', 'crypto_usdt', 'crypto_bnb', 'crypto_sol',
  'paypal', 'cashapp', 'venmo', 'zelle', 'apple_pay', 'google_pay', 'internal',
];
const DEFAULT_TOKEN_PACKAGES = [
  { tokens: 100, price: 10 },
  { tokens: 300, price: 20 },
  { tokens: 500, price: 30 },
];
const METHOD_LABELS = {
  bank_transfer: 'Bank Transfer', ach: 'ACH Transfer', wire: 'Wire Transfer', iban: 'IBAN Wire',
  card: 'Card', crypto_btc: 'Bitcoin', crypto_eth: 'Ethereum', crypto_usdt: 'USDT',
  crypto_bnb: 'BNB', crypto_sol: 'Solana', paypal: 'PayPal', cashapp: 'Cash App',
  venmo: 'Venmo', zelle: 'Zelle', apple_pay: 'Apple Pay', google_pay: 'Google Pay', internal: 'Internal',
};

const fmtUSD = (n) => '$' + Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

function sanitizeApiAccount(userDoc) {
  if (!userDoc) return null;
  const obj = typeof userDoc.toObject === 'function' ? userDoc.toObject() : { ...userDoc };
  const hasPin = !!obj.pin;
  const hasTrackToken = !!obj.trackTokenNumber;
  const cardLast4 = obj.cardNumber ? String(obj.cardNumber).slice(-4) : null;

  delete obj.password;
  delete obj.pin;
  delete obj.cardNumber;
  delete obj.cvv;
  delete obj.trackTokenNumber;
  delete obj.kycDetails;
  delete obj.createdByApiKey;
  delete obj.__v;

  obj.hasPin = hasPin;
  obj.hasTrackToken = hasTrackToken;
  obj.cardNumberMasked = cardLast4 ? `**** **** **** ${cardLast4}` : null;
  obj.cvvMasked = obj.cardStatus === 'Active' ? '***' : null;
  return obj;
}

async function runInTransaction(workFn) {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const result = await workFn(session);
    await session.commitTransaction();
    return result;
  } catch (err) {
    try {
      if (session.inTransaction()) await session.abortTransaction();
    } catch (_) {}

    const msg = String(err?.message || '');
    const isUnsupportedTx =
      err?.code === 20 ||
      err?.codeName === 'IllegalOperation' ||
      msg.includes('Transaction numbers are only allowed on a replica set member') ||
      msg.includes('does not support transactions');

    if (isUnsupportedTx) {
      return workFn(null);
    }
    throw err;
  } finally {
    session.endSession();
  }
}

async function sendTransactionEmailSafe(options) {
  try {
    const result = await sendEmail(options);
    return { sent: true, messageId: result.messageId };
  } catch (error) {
    return { sent: false, error: error.message };
  }
}

async function verifyApiTransactionSecurity(req, user) {
  const { pin, trackTokenNumber } = req.body || {};

  if (req.apiKey.enforcePinAndTtn) {
    if (!pin) return { status: 400, code: 'PIN_REQUIRED', error: 'Transaction PIN is required by this API key policy.' };
    if (!trackTokenNumber) {
      return { status: 400, code: 'TTN_REQUIRED', error: 'Track Token Number (TTN) is required by this API key policy.' };
    }
    if (user.kyc !== 'Verified') {
      return { status: 403, code: 'KYC_REQUIRED', error: 'Account KYC must be Verified before performing transactions.' };
    }
    if (!user.pin) {
      return { status: 400, code: 'PIN_NOT_SET', error: 'Transaction PIN must be configured on this account first.' };
    }
    const isMatch = await bcrypt.compare(String(pin), user.pin);
    if (!isMatch) return { status: 401, code: 'INVALID_PIN', error: 'Invalid transaction PIN.' };
    if (user.trackTokenNumber !== String(trackTokenNumber)) {
      return { status: 401, code: 'INVALID_TTN', error: 'Invalid Track Token Number.' };
    }
    if ((user.tokenBalance || 0) < 10) {
      return { status: 402, code: 'INSUFFICIENT_TOKENS', error: 'Insufficient security tokens. 10 tokens are required per transaction.' };
    }
    return { ok: true, deductTokens: true };
  }

  // Trusted key mode: validate PIN only if the caller explicitly supplies one and user has a PIN set
  if (pin !== undefined && pin !== null && String(pin) !== '' && user.pin) {
    const isMatch = await bcrypt.compare(String(pin), user.pin);
    if (!isMatch) return { status: 401, code: 'INVALID_PIN', error: 'Invalid transaction PIN.' };
  }

  return { ok: true, deductTokens: false };
}

function computeWealthTotals(user) {
  const crypto = (user.cryptoAssets || []).reduce((s, a) => s + (a.valueUSD || 0), 0);
  const treasury = (user.treasuryAssets || []).reduce((s, a) => s + (a.totalValue || 0), 0);
  const investments = (user.investments || []).reduce((s, a) => s + (a.currentValue || 0), 0);
  const linkedAccounts = (user.linkedAccounts || []).reduce((s, a) => s + (a.balance || 0), 0);
  const trust = user.trust?.enabled ? (user.trust.balance || 0) : (user.trust?.balance || 0);
  const checking = user.balance || 0;
  const savings = user.savingsBalance || 0;
  const totalNetWorth = parseFloat((checking + savings + crypto + treasury + investments + linkedAccounts + trust).toFixed(2));
  return {
    checking: parseFloat(checking.toFixed(2)),
    savings: parseFloat(savings.toFixed(2)),
    crypto: parseFloat(crypto.toFixed(2)),
    treasury: parseFloat(treasury.toFixed(2)),
    investments: parseFloat(investments.toFixed(2)),
    linkedAccounts: parseFloat(linkedAccounts.toFixed(2)),
    trust: parseFloat(trust.toFixed(2)),
    totalNetWorth,
  };
}

function parseCurrency(raw) {
  const cur = String(raw || 'USD').toUpperCase();
  if (!FX_RATES[cur]) return null;
  return { currency: cur, rate: FX_RATES[cur] };
}

function applyFx(usdVal, rate) {
  return parseFloat((Number(usdVal || 0) * rate).toFixed(2));
}

// ── System & Spec ─────────────────────────────────────────────────────────────

exports.health = async (req, res) => {
  sendSuccess(res, {
    status: 'operational',
    version: 'v1',
    institution: 'Blue ridge Bank',
    routingNumber: '021000021',
    timestamp: new Date().toISOString(),
  });
};

exports.getKeyInfo = async (req, res) => {
  const key = req.apiKey;
  let boundAccount = null;
  if (key.userId) {
    const u = await User.findById(key.userId).select('firstName lastName email accountNumber status kyc balance');
    if (u) {
      boundAccount = {
        id: u._id,
        name: `${u.firstName} ${u.lastName}`,
        email: u.email,
        accountNumber: u.accountNumber,
        status: u.status,
        kyc: u.kyc,
      };
    }
  }

  sendSuccess(res, {
    id: key._id,
    name: key.name,
    ownerName: key.ownerName,
    ownerEmail: key.ownerEmail,
    keyPrefix: key.keyPrefix,
    environment: key.environment,
    accountScope: key.accountScope,
    permissions: key.permissions,
    rateLimitPerMinute: key.rateLimitPerMinute,
    enforcePinAndTtn: key.enforcePinAndTtn,
    instantWithdrawal: key.instantWithdrawal,
    usageCount: key.usageCount,
    expiresAt: key.expiresAt,
    boundAccount,
  });
};

exports.getOpenApiSpec = async (req, res) => {
  const proto = String(req.headers['x-forwarded-proto'] || req.protocol || 'http').split(',')[0].trim();
  const host = req.headers['x-forwarded-host'] || req.get('host');
  const serverUrl = `${proto}://${host}/api/v1`;

  const accountParam = {
    name: 'accountId',
    in: 'path',
    required: true,
    description: 'Bank account identifier: MongoDB ObjectId, 12-digit accountNumber, email, or "me" (for bound keys).',
    schema: { type: 'string' },
  };
  const txParam = {
    name: 'transactionId',
    in: 'path',
    required: true,
    description: 'Transaction reference (e.g. TXN1A2B3C4D5E6F) or MongoDB ObjectId.',
    schema: { type: 'string' },
  };
  const idempotencyHeader = {
    name: 'Idempotency-Key',
    in: 'header',
    required: false,
    description: 'Optional unique key (up to 128 chars) to safely retry POST requests without duplicate execution.',
    schema: { type: 'string' },
  };
  const okResp = (description) => ({
    description,
    content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } } },
  });
  const jsonBody = (schema) => ({
    required: true,
    content: { 'application/json': { schema } },
  });

  const spec = {
    openapi: '3.0.3',
    info: {
      title: 'Blue ridge Bank External Banking API',
      version: '1.0.0',
      description:
        'Institutional REST API for account onboarding, balance & multi-currency queries, deposits, withdrawals, transfers, bill payments, PDF receipts, debit cards, wealth & reserves, notifications, and live support chat.',
      contact: {
        name: 'Blue ridge Bank API Desk',
        email: 'support@theblueridges.com',
      },
    },
    servers: [{ url: serverUrl, description: 'Active Blue ridge Bank API v1 Server' }],
    security: [{ ApiKeyAuth: [] }, { BearerAuth: [] }],
    tags: [
      { name: 'System', description: 'API health, key introspection, and OpenAPI schema' },
      { name: 'Bank Configuration', description: 'Routing numbers, FX rates, payment rails, fees, and token bundles' },
      { name: 'Accounts', description: 'Account creation, authentication, profile, PIN, and KYC' },
      { name: 'Balances & Overview', description: 'Real-time checking balances, multi-currency FX, dashboard, and restrictions' },
      { name: 'Money Movement', description: 'Deposits, withdrawals, transfers, and bill payments' },
      { name: 'Transactions & Receipts', description: 'Audit history, transaction details, and PDF receipts' },
      { name: 'Debit Cards', description: 'Card issuance requests and credential reveal' },
      { name: 'Wealth & Reserves', description: 'Crypto, treasury, investments, fiduciary trust, and linked banks' },
      { name: 'Security Tokens', description: 'Track Token & authorization token balances' },
      { name: 'Notifications', description: 'Client notification inbox management' },
      { name: 'Support Chat', description: 'Real-time client support messaging' },
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: { type: 'apiKey', in: 'header', name: 'X-API-Key' },
        BearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'API Key (brb_live_...)' },
      },
      schemas: {
        SuccessEnvelope: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            requestId: { type: 'string', example: 'req_4f2a9c10b7d8e1a2' },
            data: { type: 'object', additionalProperties: true },
            meta: { type: 'object', additionalProperties: true },
          },
        },
        ErrorEnvelope: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            requestId: { type: 'string', example: 'req_4f2a9c10b7d8e1a2' },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'INSUFFICIENT_FUNDS' },
                message: { type: 'string' },
                details: { type: 'object', additionalProperties: true },
              },
            },
          },
        },
      },
    },
    paths: {
      '/health': {
        get: { tags: ['System'], summary: 'API Health Check', security: [], responses: { 200: okResp('Operational') } },
      },
      '/openapi.json': {
        get: { tags: ['System'], summary: 'Download OpenAPI 3.0 Specification', security: [], responses: { 200: okResp('OpenAPI JSON') } },
      },
      '/key': {
        get: { tags: ['System'], summary: 'Inspect Active API Key', responses: { 200: okResp('Key metadata & scopes') } },
      },
      '/bank/settings': {
        get: { tags: ['Bank Configuration'], summary: 'Get Bank Settings & FX Rates', responses: { 200: okResp('Bank config') } },
      },
      '/bank/deposit-methods': {
        get: { tags: ['Bank Configuration'], summary: 'List Deposit Rails', responses: { 200: okResp('Deposit methods') } },
      },
      '/bank/withdrawal-methods': {
        get: { tags: ['Bank Configuration'], summary: 'List Withdrawal Rails', responses: { 200: okResp('Withdrawal methods') } },
      },
      '/accounts': {
        post: {
          tags: ['Accounts'],
          summary: 'Create Bank Account',
          parameters: [idempotencyHeader],
          requestBody: jsonBody({
            type: 'object',
            required: ['firstName', 'lastName', 'email', 'password'],
            properties: {
              firstName: { type: 'string' },
              lastName: { type: 'string' },
              email: { type: 'string', format: 'email' },
              password: { type: 'string', minLength: 8 },
              phone: { type: 'string' },
              country: { type: 'string' },
              location: { type: 'string' },
              savingsGoal: { type: 'number' },
              pin: { type: 'string' },
            },
          }),
          responses: { 201: okResp('Account created') },
        },
        get: { tags: ['Accounts'], summary: 'List Accessible Bank Accounts', responses: { 200: okResp('Paginated accounts') } },
      },
      '/accounts/authenticate': {
        post: {
          tags: ['Accounts'],
          summary: 'Verify Account Credentials',
          requestBody: jsonBody({
            type: 'object',
            required: ['email', 'password'],
            properties: { email: { type: 'string' }, password: { type: 'string' } },
          }),
          responses: { 200: okResp('Credentials verified') },
        },
      },
      '/accounts/{accountId}': {
        get: { tags: ['Accounts'], summary: 'Get Account Details', parameters: [accountParam], responses: { 200: okResp('Account details') } },
        patch: { tags: ['Accounts'], summary: 'Update Account Profile', parameters: [accountParam], responses: { 200: okResp('Account updated') } },
      },
      '/accounts/{accountId}/password': {
        patch: { tags: ['Accounts'], summary: 'Change Account Password', parameters: [accountParam], responses: { 200: okResp('Password changed') } },
      },
      '/accounts/{accountId}/pin': {
        post: { tags: ['Accounts'], summary: 'Set or Update Transaction PIN', parameters: [accountParam], responses: { 200: okResp('PIN updated') } },
      },
      '/accounts/{accountId}/kyc': {
        post: { tags: ['Accounts'], summary: 'Submit KYC Verification', parameters: [accountParam], responses: { 200: okResp('KYC submitted') } },
      },
      '/accounts/{accountId}/balance': {
        get: {
          tags: ['Balances & Overview'],
          summary: 'Get Real-Time Balance & Net Worth',
          parameters: [
            accountParam,
            { name: 'currency', in: 'query', schema: { type: 'string', enum: ['USD', 'GBP', 'EUR'] } },
          ],
          responses: { 200: okResp('Balance snapshot') },
        },
      },
      '/accounts/{accountId}/dashboard': {
        get: { tags: ['Balances & Overview'], summary: 'Get Account Dashboard Summary', parameters: [accountParam], responses: { 200: okResp('Dashboard summary') } },
      },
      '/accounts/{accountId}/restrictions': {
        get: { tags: ['Balances & Overview'], summary: 'Get Compliance Restrictions', parameters: [accountParam], responses: { 200: okResp('Account restrictions') } },
      },
      '/accounts/{accountId}/deposit': {
        post: {
          tags: ['Money Movement'],
          summary: 'Deposit Funds',
          parameters: [accountParam, idempotencyHeader],
          requestBody: jsonBody({
            type: 'object',
            required: ['amount'],
            properties: {
              amount: { type: 'number', minimum: 0.01, maximum: 50000 },
              method: { type: 'string', enum: VALID_METHODS },
              description: { type: 'string' },
              note: { type: 'string' },
              pin: { type: 'string' },
              trackTokenNumber: { type: 'string' },
            },
          }),
          responses: { 201: okResp('Deposit completed') },
        },
      },
      '/accounts/{accountId}/withdraw': {
        post: {
          tags: ['Money Movement'],
          summary: 'Withdraw Funds',
          parameters: [accountParam, idempotencyHeader],
          requestBody: jsonBody({
            type: 'object',
            required: ['amount'],
            properties: {
              amount: { type: 'number', minimum: 0.01 },
              method: { type: 'string', enum: VALID_METHODS },
              description: { type: 'string' },
              note: { type: 'string' },
              pin: { type: 'string' },
              trackTokenNumber: { type: 'string' },
            },
          }),
          responses: { 201: okResp('Withdrawal submitted or settled') },
        },
      },
      '/accounts/{accountId}/transfer': {
        post: {
          tags: ['Money Movement'],
          summary: 'Transfer Funds',
          parameters: [accountParam, idempotencyHeader],
          requestBody: jsonBody({
            type: 'object',
            required: ['amount'],
            properties: {
              amount: { type: 'number', minimum: 0.01, maximum: 100000 },
              recipientEmail: { type: 'string', format: 'email' },
              recipientAccountNumber: { type: 'string' },
              description: { type: 'string' },
              note: { type: 'string' },
              pin: { type: 'string' },
              trackTokenNumber: { type: 'string' },
            },
          }),
          responses: { 201: okResp('Transfer completed') },
        },
      },
      '/accounts/{accountId}/bill-pay': {
        post: {
          tags: ['Money Movement'],
          summary: 'Pay Merchant or Utility Bill',
          parameters: [accountParam, idempotencyHeader],
          requestBody: jsonBody({
            type: 'object',
            required: ['amount', 'billType', 'billerAccountNumber'],
            properties: {
              amount: { type: 'number', minimum: 0.01 },
              billType: { type: 'string' },
              billerAccountNumber: { type: 'string' },
              description: { type: 'string' },
              pin: { type: 'string' },
              trackTokenNumber: { type: 'string' },
            },
          }),
          responses: { 201: okResp('Bill payment settled') },
        },
      },
      '/accounts/{accountId}/transactions': {
        get: { tags: ['Transactions & Receipts'], summary: 'List Account Transaction History', parameters: [accountParam], responses: { 200: okResp('Transaction list') } },
      },
      '/accounts/{accountId}/transactions/{transactionId}': {
        get: { tags: ['Transactions & Receipts'], summary: 'Get Transaction Detail', parameters: [accountParam, txParam], responses: { 200: okResp('Transaction record') } },
      },
      '/accounts/{accountId}/receipts/{transactionId}': {
        get: { tags: ['Transactions & Receipts'], summary: 'Get Official Receipt Metadata', parameters: [accountParam, txParam], responses: { 200: okResp('Receipt metadata') } },
      },
      '/accounts/{accountId}/receipts/{transactionId}/pdf': {
        get: {
          tags: ['Transactions & Receipts'],
          summary: 'Download Official PDF Receipt',
          parameters: [accountParam, txParam],
          responses: { 200: { description: 'Binary PDF stream', content: { 'application/pdf': { schema: { type: 'string', format: 'binary' } } } } },
        },
      },
      '/accounts/{accountId}/card': {
        get: { tags: ['Debit Cards'], summary: 'Get Debit Card Status & Credentials', parameters: [accountParam], responses: { 200: okResp('Debit card info') } },
      },
      '/accounts/{accountId}/card/request': {
        post: { tags: ['Debit Cards'], summary: 'Request Commercial Debit Card', parameters: [accountParam, idempotencyHeader], responses: { 201: okResp('Card request created') } },
      },
      '/accounts/{accountId}/wealth': {
        get: { tags: ['Wealth & Reserves'], summary: 'Get Consolidated Wealth Overview', parameters: [accountParam], responses: { 200: okResp('Wealth portfolio') } },
      },
      '/accounts/{accountId}/wealth/crypto': {
        get: { tags: ['Wealth & Reserves'], summary: 'Get Digital Asset Holdings', parameters: [accountParam], responses: { 200: okResp('Crypto holdings') } },
      },
      '/accounts/{accountId}/wealth/treasury': {
        get: { tags: ['Wealth & Reserves'], summary: 'Get Treasury & Reserve Assets', parameters: [accountParam], responses: { 200: okResp('Treasury reserves') } },
      },
      '/accounts/{accountId}/wealth/investments': {
        get: { tags: ['Wealth & Reserves'], summary: 'Get Equity & Investment Positions', parameters: [accountParam], responses: { 200: okResp('Investment positions') } },
      },
      '/accounts/{accountId}/wealth/trust': {
        get: { tags: ['Wealth & Reserves'], summary: 'Get Fiduciary Trust Fund', parameters: [accountParam], responses: { 200: okResp('Trust details') } },
      },
      '/accounts/{accountId}/wealth/linked-accounts': {
        get: { tags: ['Wealth & Reserves'], summary: 'Get Linked External Institutions', parameters: [accountParam], responses: { 200: okResp('Linked accounts') } },
      },
      '/accounts/{accountId}/tokens': {
        get: { tags: ['Security Tokens'], summary: 'Get Security Token Balance & Packages', parameters: [accountParam], responses: { 200: okResp('Token summary') } },
      },
      '/accounts/{accountId}/notifications': {
        get: { tags: ['Notifications'], summary: 'List Account Notifications', parameters: [accountParam], responses: { 200: okResp('Notifications') } },
      },
      '/accounts/{accountId}/notifications/read-all': {
        patch: { tags: ['Notifications'], summary: 'Mark All Notifications Read', parameters: [accountParam], responses: { 200: okResp('All marked read') } },
      },
      '/accounts/{accountId}/notifications/{notificationId}/read': {
        patch: {
          tags: ['Notifications'],
          summary: 'Mark Single Notification Read',
          parameters: [accountParam, { name: 'notificationId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: okResp('Marked read') },
        },
      },
      '/accounts/{accountId}/notifications/{notificationId}': {
        delete: {
          tags: ['Notifications'],
          summary: 'Delete Notification',
          parameters: [accountParam, { name: 'notificationId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: okResp('Notification deleted') },
        },
      },
      '/accounts/{accountId}/chat': {
        get: { tags: ['Support Chat'], summary: 'Get Support Chat History', parameters: [accountParam], responses: { 200: okResp('Chat history') } },
        post: { tags: ['Support Chat'], summary: 'Send Support Chat Message', parameters: [accountParam], responses: { 201: okResp('Message sent') } },
      },
    },
    'x-permission-catalog': API_PERMISSION_CATALOG,
  };

  res.json(spec);
};

// ── Bank Configuration ────────────────────────────────────────────────────────

exports.getBankSettings = async (req, res, next) => {
  try {
    const [cardFeeSetting, tokenPkgSetting, maintenanceSetting] = await Promise.all([
      AppSettings.findOne({ key: 'card_fee' }).lean(),
      AppSettings.findOne({ key: 'token_packages' }).lean(),
      AppSettings.findOne({ key: 'maintenance_mode' }).lean(),
    ]);

    const packages =
      Array.isArray(tokenPkgSetting?.value) && tokenPkgSetting.value.length === 3
        ? tokenPkgSetting.value
        : DEFAULT_TOKEN_PACKAGES;

    sendSuccess(res, {
      institution: 'Blue ridge Bank',
      routingNumber: '021000021',
      swiftCode: 'BRBKUS33',
      supportedCurrencies: Object.keys(FX_RATES),
      fxRates: FX_RATES,
      cardIssuanceFeeUSD: cardFeeSetting ? Number(cardFeeSetting.value) : 50,
      tokensPerTransaction: 10,
      tokenPackages: packages,
      maintenanceMode: maintenanceSetting?.value === true,
      limits: {
        maxSingleDepositUSD: 50000,
        maxSingleTransferUSD: 100000,
        defaultWithdrawalLimitUSD: 10000,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.getDepositMethods = async (req, res, next) => {
  try {
    const s = await AppSettings.findOne({ key: 'deposit_methods' }).lean();
    const methods = Array.isArray(s?.value) && s.value.length > 0
      ? s.value
      : [
          { id: 'bank_transfer', label: 'Bank Transfer', fee: 0, feeType: 'fixed', enabled: true },
          { id: 'ach', label: 'ACH Transfer', fee: 0, feeType: 'fixed', enabled: true },
          { id: 'wire', label: 'Wire Transfer', fee: 15, feeType: 'fixed', enabled: true },
          { id: 'card', label: 'Debit/Credit Card', fee: 2.5, feeType: 'percent', enabled: true },
          { id: 'crypto_btc', label: 'Bitcoin (BTC)', fee: 2.5, feeType: 'fixed', enabled: true },
          { id: 'crypto_eth', label: 'Ethereum (ETH)', fee: 2.5, feeType: 'fixed', enabled: true },
          { id: 'crypto_usdt', label: 'USDT (TRC-20)', fee: 2.5, feeType: 'fixed', enabled: true },
          { id: 'crypto_sol', label: 'Solana (SOL)', fee: 2.5, feeType: 'fixed', enabled: true },
          { id: 'paypal', label: 'PayPal', fee: 0, feeType: 'fixed', enabled: true },
          { id: 'cashapp', label: 'Cash App', fee: 0, feeType: 'fixed', enabled: true },
          { id: 'venmo', label: 'Venmo', fee: 0, feeType: 'fixed', enabled: true },
          { id: 'zelle', label: 'Zelle', fee: 0, feeType: 'fixed', enabled: true },
        ];
    sendSuccess(res, { methods });
  } catch (err) {
    next(err);
  }
};

exports.getWithdrawalMethods = async (req, res, next) => {
  try {
    const s = await AppSettings.findOne({ key: 'withdrawal_methods' }).lean();
    const methods = Array.isArray(s?.value) && s.value.length > 0
      ? s.value
      : [
          { id: 'ach', label: 'ACH Transfer', fee: 0, feeType: 'fixed', enabled: true, processingTime: '1-3 business days' },
          { id: 'wire', label: 'Wire Transfer', fee: 25, feeType: 'fixed', enabled: true, processingTime: 'Same day' },
          { id: 'iban', label: 'IBAN / Int\'l Wire', fee: 0, feeType: 'fixed', enabled: true, processingTime: '1-2 business days' },
          { id: 'card', label: 'Debit Card', fee: 1.5, feeType: 'fixed', enabled: true, processingTime: 'Instant' },
          { id: 'crypto_btc', label: 'Bitcoin (BTC)', fee: 5, feeType: 'fixed', enabled: true, processingTime: '10-60 min' },
          { id: 'crypto_eth', label: 'Ethereum (ETH)', fee: 5, feeType: 'fixed', enabled: true, processingTime: '10-30 min' },
          { id: 'crypto_usdt', label: 'USDT', fee: 5, feeType: 'fixed', enabled: true, processingTime: '5-15 min' },
          { id: 'crypto_sol', label: 'Solana (SOL)', fee: 5, feeType: 'fixed', enabled: true, processingTime: '5-10 min' },
        ];
    sendSuccess(res, { methods });
  } catch (err) {
    next(err);
  }
};

// ── Accounts & Onboarding ─────────────────────────────────────────────────────

exports.createAccount = async (req, res, next) => {
  try {
    if (req.apiKey.accountScope === 'single_user') {
      return sendError(
        res,
        403,
        'ACCOUNT_OUT_OF_SCOPE',
        'API keys with single_user scope cannot create new bank accounts.'
      );
    }

    const {
      firstName,
      lastName,
      email,
      password,
      phone = '',
      location,
      country,
      address,
      dateOfBirth,
      savingsGoal,
      pin,
    } = req.body || {};

    if (!firstName || !String(firstName).trim() || !lastName || !String(lastName).trim()) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'firstName and lastName are required.');
    }
    const cleanEmail = String(email || '').trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'A valid email address is required.');
    }
    if (!password || String(password).length < 8) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'password must be at least 8 characters.');
    }

    let hashedPin;
    if (pin !== undefined && pin !== null && String(pin) !== '') {
      if (!/^\d{4,6}$/.test(String(pin))) {
        return sendError(res, 400, 'INVALID_PIN_FORMAT', 'Transaction PIN must be 4 to 6 numeric digits.');
      }
      hashedPin = await bcrypt.hash(String(pin), 12);
    }

    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return sendError(res, 409, 'EMAIL_ALREADY_EXISTS', 'An account with this email already exists.');
    }

    const resolvedLocation = String(location || address?.city || '').trim();
    const resolvedCountry = String(country || address?.country || '').trim();

    const user = new User({
      firstName: String(firstName).trim(),
      lastName: String(lastName).trim(),
      email: cleanEmail,
      password: String(password),
      phone: String(phone || '').trim(),
      location: resolvedLocation,
      address: { ...(address || {}), city: resolvedLocation, country: resolvedCountry },
      ...(dateOfBirth && !Number.isNaN(new Date(dateOfBirth).getTime()) ? { dateOfBirth: new Date(dateOfBirth) } : {}),
      ...(savingsGoal !== undefined && Number.isFinite(Number(savingsGoal)) && Number(savingsGoal) >= 0
        ? { savingsGoal: Number(savingsGoal) }
        : {}),
      ...(hashedPin ? { pin: hashedPin } : {}),
      balance: 0,
      kyc: 'Pending',
      createdByApiKey: req.apiKey._id,
    });

    await user.save();

    await Notification.create({
      userId: user._id,
      title: 'Welcome to Blue ridge Bank!',
      message: `Hi ${user.firstName}! Your account (${user.accountNumber}) has been opened via API integration.`,
      type: 'system',
      priority: 'high',
    });

    res.locals.targetUserId = user._id;
    sendSuccess(res, { account: sanitizeApiAccount(user) }, 201);
  } catch (err) {
    next(err);
  }
};

exports.authenticateAccount = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'email and password are required.');
    }

    const user = await User.findOne({ email: String(email).trim().toLowerCase() }).select('+password');
    if (!user || !(await user.comparePassword(String(password)))) {
      return sendError(res, 401, 'INVALID_CREDENTIALS', 'Invalid email or password.');
    }
    if (user.role === 'admin') {
      return sendError(res, 403, 'FORBIDDEN_ACCOUNT', 'Administrative accounts cannot authenticate through the external API.');
    }

    const scope = req.apiKey.accountScope;
    if (scope === 'single_user' && (!req.apiKey.userId || user._id.toString() !== req.apiKey.userId.toString())) {
      return sendError(res, 403, 'ACCOUNT_OUT_OF_SCOPE', 'This account is outside the scope of this API key.');
    }
    if (scope === 'owned') {
      const owns = user.createdByApiKey && user.createdByApiKey.toString() === req.apiKey._id.toString();
      const bound = req.apiKey.userId && user._id.toString() === req.apiKey.userId.toString();
      if (!owns && !bound) {
        return sendError(res, 403, 'ACCOUNT_OUT_OF_SCOPE', 'This account is outside the scope of this API key.');
      }
    }

    if (user.status === 'suspended') {
      return sendError(res, 403, 'ACCOUNT_SUSPENDED', 'Account is suspended. Contact support.');
    }

    await User.updateOne({ _id: user._id }, { $set: { lastLogin: new Date() } });
    res.locals.targetUserId = user._id;
    sendSuccess(res, { authenticated: true, account: sanitizeApiAccount(user) });
  } catch (err) {
    next(err);
  }
};

exports.listAccounts = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, status, kyc } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

    const query = { role: 'user' };

    if (req.apiKey.accountScope === 'single_user') {
      if (!req.apiKey.userId) {
        return sendSuccess(res, { accounts: [] }, 200, { pagination: { page: pageNum, limit: limitNum, total: 0, pages: 0 } });
      }
      query._id = req.apiKey.userId;
    } else if (req.apiKey.accountScope === 'owned') {
      const scopeConditions = [{ createdByApiKey: req.apiKey._id }];
      if (req.apiKey.userId) scopeConditions.push({ _id: req.apiKey.userId });
      query.$and = [{ $or: scopeConditions }];
    }

    if (status && status !== 'all') query.status = status;
    if (kyc && kyc !== 'all') query.kyc = kyc;
    if (search && String(search).trim()) {
      const s = String(search).trim();
      const searchCond = {
        $or: [
          { firstName: { $regex: s, $options: 'i' } },
          { lastName: { $regex: s, $options: 'i' } },
          { email: { $regex: s, $options: 'i' } },
          { accountNumber: { $regex: s, $options: 'i' } },
        ],
      };
      if (query.$and) query.$and.push(searchCond);
      else query.$or = searchCond.$or;
    }

    const [total, users] = await Promise.all([
      User.countDocuments(query),
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
    ]);

    sendSuccess(
      res,
      { accounts: users.map(sanitizeApiAccount) },
      200,
      { pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) } }
    );
  } catch (err) {
    next(err);
  }
};

exports.getAccount = async (req, res) => {
  sendSuccess(res, { account: sanitizeApiAccount(req.targetUser) });
};

exports.updateAccount = async (req, res, next) => {
  try {
    const user = req.targetUser;
    const { firstName, lastName, phone, address, country, location, notifications, savingsGoal } = req.body || {};

    if (firstName !== undefined) {
      if (!String(firstName).trim()) return sendError(res, 400, 'VALIDATION_ERROR', 'firstName cannot be empty.');
      user.firstName = String(firstName).trim();
    }
    if (lastName !== undefined) {
      if (!String(lastName).trim()) return sendError(res, 400, 'VALIDATION_ERROR', 'lastName cannot be empty.');
      user.lastName = String(lastName).trim();
    }
    if (phone !== undefined) user.phone = String(phone).trim();
    if (notifications !== undefined && typeof notifications === 'object') {
      user.notifications = {
        email: notifications.email ?? user.notifications?.email ?? true,
        sms: notifications.sms ?? user.notifications?.sms ?? false,
        push: notifications.push ?? user.notifications?.push ?? true,
      };
    }
    if (savingsGoal !== undefined) {
      const goal = Number(savingsGoal);
      if (!Number.isFinite(goal) || goal < 0) {
        return sendError(res, 400, 'VALIDATION_ERROR', 'savingsGoal must be a non-negative number.');
      }
      user.savingsGoal = goal;
    }

    if (address || country !== undefined || location !== undefined) {
      const nextAddress = { ...(user.address?.toObject?.() || user.address || {}), ...(address || {}) };
      if (location !== undefined) {
        user.location = String(location).trim();
        nextAddress.city = String(location).trim();
      } else if (address?.city !== undefined) {
        user.location = String(address.city).trim();
      }
      if (country !== undefined) nextAddress.country = String(country).trim();
      user.address = nextAddress;
    }

    await user.save();
    sendSuccess(res, { account: sanitizeApiAccount(user) });
  } catch (err) {
    next(err);
  }
};

exports.changeAccountPassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'currentPassword and newPassword are required.');
    }
    if (String(newPassword).length < 8) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'newPassword must be at least 8 characters.');
    }

    const user = await User.findById(req.targetUser._id).select('+password');
    const ok = await user.comparePassword(String(currentPassword));
    if (!ok) return sendError(res, 401, 'INVALID_CREDENTIALS', 'Current password is incorrect.');

    user.password = String(newPassword);
    await user.save();
    sendSuccess(res, { updated: true, message: 'Password updated successfully.' });
  } catch (err) {
    next(err);
  }
};

exports.setAccountPin = async (req, res, next) => {
  try {
    const { pin, currentPin } = req.body || {};
    if (!pin || !/^\d{4,6}$/.test(String(pin))) {
      return sendError(res, 400, 'INVALID_PIN_FORMAT', 'PIN must be 4 to 6 numeric digits.');
    }

    const user = req.targetUser;
    if (user.pin) {
      if (!currentPin) {
        return sendError(res, 400, 'PIN_ALREADY_SET', 'PIN is already set. Supply currentPin to change it.');
      }
      const match = await bcrypt.compare(String(currentPin), user.pin);
      if (!match) {
        return sendError(res, 401, 'INVALID_PIN', 'currentPin does not match.');
      }
    }

    user.pin = await bcrypt.hash(String(pin), 12);
    await user.save();
    sendSuccess(res, { pinConfigured: true, message: 'Transaction PIN saved successfully.' });
  } catch (err) {
    next(err);
  }
};

exports.submitAccountKyc = async (req, res, next) => {
  try {
    const { ssnOrBvn } = req.body || {};
    let { idCard, otherVerification } = req.body || {};

    if (!ssnOrBvn || !idCard || !otherVerification) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'ssnOrBvn, idCard, and otherVerification are all required.');
    }

    const hasImageKit = Boolean(
      process.env.IMAGEKIT_PUBLIC_KEY &&
      process.env.IMAGEKIT_PRIVATE_KEY &&
      process.env.IMAGEKIT_URL_ENDPOINT
    );

    if (typeof idCard === 'string' && idCard.startsWith('data:image') && hasImageKit) {
      const r = await uploadToImageKit(idCard, `kyc_id_${req.targetUser._id}_${Date.now()}`, '/nexabank/kyc');
      idCard = r.url;
    }
    if (typeof otherVerification === 'string' && otherVerification.startsWith('data:image') && hasImageKit) {
      const r = await uploadToImageKit(otherVerification, `kyc_other_${req.targetUser._id}_${Date.now()}`, '/nexabank/kyc');
      otherVerification = r.url;
    }

    const user = req.targetUser;
    user.kyc = 'Pending';
    user.kycDetails = {
      idCard: String(idCard),
      otherVerification: String(otherVerification),
      ssnOrBvn: String(ssnOrBvn).trim(),
      submittedAt: new Date(),
    };
    await user.save();

    sendSuccess(res, {
      kycStatus: user.kyc,
      submittedAt: user.kycDetails.submittedAt,
      message: 'KYC verification documents submitted for review.',
    });
  } catch (err) {
    next(err);
  }
};

// ── Balances, Dashboard & Restrictions ────────────────────────────────────────

exports.getBalance = async (req, res) => {
  const fx = parseCurrency(req.query.currency);
  if (!fx) {
    return sendError(res, 400, 'UNSUPPORTED_CURRENCY', 'Supported currencies are USD, GBP, and EUR.');
  }

  const user = req.targetUser;
  const usdTotals = computeWealthTotals(user);
  const converted = Object.fromEntries(
    Object.entries(usdTotals).map(([k, v]) => [k, applyFx(v, fx.rate)])
  );

  sendSuccess(res, {
    accountId: user._id,
    accountNumber: user.accountNumber,
    routingNumber: user.routingNumber || '021000021',
    status: user.status,
    kyc: user.kyc,
    currency: fx.currency,
    exchangeRate: fx.rate,
    balance: applyFx(usdTotals.checking, fx.rate),
    savingsBalance: applyFx(usdTotals.savings, fx.rate),
    savingsGoal: applyFx(user.savingsGoal || 0, fx.rate),
    tokenBalance: user.tokenBalance || 0,
    totalNetWorth: converted.totalNetWorth,
    usd: usdTotals,
    converted,
    asOf: new Date().toISOString(),
  });
};

exports.getDashboard = async (req, res, next) => {
  try {
    const user = req.targetUser;
    const [recentTransactions, statsAgg, unreadNotifications] = await Promise.all([
      Transaction.find({ userId: user._id }).sort({ createdAt: -1 }).limit(5),
      Transaction.aggregate([
        { $match: { userId: user._id, status: 'completed' } },
        { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Notification.countDocuments({ userId: user._id, read: false }),
    ]);

    sendSuccess(res, {
      account: sanitizeApiAccount(user),
      wealthTotals: computeWealthTotals(user),
      recentTransactions,
      stats: statsAgg.reduce((acc, s) => ({ ...acc, [s._id]: { total: s.total, count: s.count } }), {}),
      unreadNotifications,
    });
  } catch (err) {
    next(err);
  }
};

exports.getRestrictions = async (req, res) => {
  const user = req.targetUser;
  sendSuccess(res, {
    accountId: user._id,
    status: user.status,
    kyc: user.kyc,
    transfersEnabled: user.transfersEnabled,
    withdrawalsEnabled: user.withdrawalsEnabled,
    withdrawalLimit: user.withdrawalLimit || 10000,
    transfersBlockReason: user.transfersBlockReason || '',
    withdrawalsBlockReason: user.withdrawalsBlockReason || '',
    transferRequirements: user.transferRequirements || [],
    withdrawalRequirements: user.withdrawalRequirements || [],
  });
};

// ── Money Movement ────────────────────────────────────────────────────────────

exports.deposit = async (req, res, next) => {
  try {
    const { amount, method = 'bank_transfer', description, note, cryptoDetails } = req.body || {};
    const numAmount = parseFloat(amount);
    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      return sendError(res, 400, 'INVALID_AMOUNT', 'Deposit amount must be greater than 0.');
    }
    if (numAmount > 50000) {
      return sendError(res, 400, 'LIMIT_EXCEEDED', 'Maximum single deposit is $50,000.');
    }
    if (!VALID_METHODS.includes(method)) {
      return sendError(res, 400, 'INVALID_METHOD', `Unsupported method '${method}'.`, { validMethods: VALID_METHODS });
    }

    let fee = 0;
    if (method === 'card') fee = parseFloat((numAmount * 0.025).toFixed(2));
    else if (method === 'wire') fee = 15;
    else if (method.startsWith('crypto')) fee = 2.5;

    const sec = await verifyApiTransactionSecurity(req, req.targetUser);
    if (!sec.ok) return sendError(res, sec.status, sec.code, sec.error);

    const { tx, user, newBalance } = await runInTransaction(async (session) => {
      const q = User.findById(req.targetUser._id);
      if (session) q.session(session);
      const freshUser = await q;
      if (!freshUser) {
        const e = new Error('Account not found');
        e.status = 404; e.code = 'ACCOUNT_NOT_FOUND';
        throw e;
      }

      const computedBalance = parseFloat((freshUser.balance + numAmount).toFixed(2));
      const newTx = new Transaction({
        userId: freshUser._id,
        type: 'credit',
        category: 'deposit',
        method,
        amount: numAmount,
        fee,
        description: description || `${METHOD_LABELS[method] || method} Deposit`,
        note: note || '',
        status: 'completed',
        balanceAfter: computedBalance,
        metadata: { source: 'api_v1', apiKeyId: req.apiKey._id },
        ...(cryptoDetails && typeof cryptoDetails === 'object' ? {
          cryptoCoin: cryptoDetails.coin,
          cryptoAmount: cryptoDetails.coinAmount,
          cryptoNetwork: cryptoDetails.network,
          walletAddress: cryptoDetails.walletAddress,
        } : {}),
      });

      await newTx.save(session ? { session } : {});
      freshUser.balance = computedBalance;
      if (sec.deductTokens) freshUser.tokenBalance = Math.max(0, (freshUser.tokenBalance || 0) - 10);
      await freshUser.save(session ? { session } : {});

      return { tx: newTx, user: freshUser, newBalance: computedBalance };
    });

    try {
      const receipt = await generateReceiptPDF(tx, user);
      tx.receiptGenerated = true;
      tx.receiptUrl = receipt.url;
      await tx.save();
    } catch (_) {}

    await Notification.create({
      userId: user._id,
      title: 'Deposit Confirmed',
      message: `Your deposit of ${fmtUSD(numAmount)} via ${METHOD_LABELS[method] || method} has been processed. New balance: ${fmtUSD(newBalance)}`,
      type: 'transaction',
      priority: 'medium',
    });

    const email = await sendTransactionEmailSafe({
      to: user.email,
      subject: 'Deposit Confirmed',
      recipientName: user.firstName,
      type: 'credit',
      amount: numAmount,
      bodyHTML: `<p>Your deposit of <strong>${fmtUSD(numAmount)}</strong> via ${METHOD_LABELS[method] || method} has been processed.</p><p>Your new balance is <strong>${fmtUSD(newBalance)}</strong>.</p>`,
      bodyText: `Your deposit of ${fmtUSD(numAmount)} via ${METHOD_LABELS[method] || method} has been processed. New balance: ${fmtUSD(newBalance)}`,
    });

    sendSuccess(
      res,
      {
        transaction: tx,
        newBalance,
        receiptUrl: tx.receiptUrl || null,
        receiptPdfEndpoint: `/api/v1/accounts/${user._id}/receipts/${tx.transactionId}/pdf`,
        email,
      },
      201
    );
  } catch (err) {
    if (err.status && err.code) return sendError(res, err.status, err.code, err.message);
    next(err);
  }
};

exports.withdraw = async (req, res, next) => {
  try {
    const userCheck = req.targetUser;
    if (!userCheck.withdrawalsEnabled) {
      return sendError(
        res,
        403,
        'WITHDRAWALS_BLOCKED',
        'Withdrawals are currently blocked on this account.',
        {
          reason: userCheck.withdrawalsBlockReason || 'Contact support for assistance.',
          requirements: userCheck.withdrawalRequirements || [],
        }
      );
    }

    const { amount, method = 'ach', description, note, bankDetails, cardDetails, cryptoDetails } = req.body || {};
    const numAmount = parseFloat(amount);
    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      return sendError(res, 400, 'INVALID_AMOUNT', 'Withdrawal amount must be greater than 0.');
    }

    const limit = userCheck.withdrawalLimit || 10000;
    if (numAmount > limit) {
      return sendError(res, 400, 'LIMIT_EXCEEDED', `Maximum single withdrawal is ${fmtUSD(limit)}.`);
    }
    if (!VALID_METHODS.includes(method)) {
      return sendError(res, 400, 'INVALID_METHOD', `Unsupported method '${method}'.`, { validMethods: VALID_METHODS });
    }

    let fee = 0;
    if (method === 'wire') fee = 25;
    else if (method === 'card') fee = 1.5;
    else if (method.startsWith('crypto')) fee = 5.0;
    const total = parseFloat((numAmount + fee).toFixed(2));

    const sec = await verifyApiTransactionSecurity(req, userCheck);
    if (!sec.ok) return sendError(res, sec.status, sec.code, sec.error);

    if (userCheck.balance < total) {
      return sendError(
        res,
        400,
        'INSUFFICIENT_FUNDS',
        `Insufficient funds. Available: ${fmtUSD(userCheck.balance)}, Required: ${fmtUSD(total)}.`
      );
    }

    const isInstant = Boolean(req.apiKey.instantWithdrawal);

    if (isInstant) {
      const { tx, user, newBalance } = await runInTransaction(async (session) => {
        const q = User.findById(userCheck._id);
        if (session) q.session(session);
        const freshUser = await q;
        if (freshUser.balance < total) {
          const e = new Error(`Insufficient funds. Available: ${fmtUSD(freshUser.balance)}, Required: ${fmtUSD(total)}.`);
          e.status = 400; e.code = 'INSUFFICIENT_FUNDS';
          throw e;
        }
        const computedBalance = parseFloat((freshUser.balance - total).toFixed(2));
        const newTx = new Transaction({
          userId: freshUser._id,
          type: 'debit',
          category: 'withdrawal',
          method,
          amount: numAmount,
          fee,
          description: description || `${METHOD_LABELS[method] || method} Withdrawal`,
          note: note || '',
          status: 'completed',
          balanceAfter: computedBalance,
          metadata: { source: 'api_v1', apiKeyId: req.apiKey._id, bankDetails, cardDetails, cryptoDetails },
          ...(cryptoDetails && typeof cryptoDetails === 'object' ? {
            cryptoCoin: cryptoDetails.coin,
            cryptoAmount: cryptoDetails.coinAmount,
            cryptoNetwork: cryptoDetails.network,
            walletAddress: cryptoDetails.walletAddress,
          } : {}),
        });
        await newTx.save(session ? { session } : {});
        freshUser.balance = computedBalance;
        if (sec.deductTokens) freshUser.tokenBalance = Math.max(0, (freshUser.tokenBalance || 0) - 10);
        await freshUser.save(session ? { session } : {});
        return { tx: newTx, user: freshUser, newBalance: computedBalance };
      });

      try {
        const receipt = await generateReceiptPDF(tx, user);
        tx.receiptGenerated = true;
        tx.receiptUrl = receipt.url;
        await tx.save();
      } catch (_) {}

      await Notification.create({
        userId: user._id,
        title: 'Withdrawal Settled',
        message: `Your withdrawal of ${fmtUSD(numAmount)} via ${METHOD_LABELS[method] || method} has settled. New balance: ${fmtUSD(newBalance)}.`,
        type: 'transaction',
        priority: 'medium',
      });

      const email = await sendTransactionEmailSafe({
        to: user.email,
        subject: 'Withdrawal Processed',
        recipientName: user.firstName,
        type: 'debit',
        amount: numAmount,
        bodyHTML: `<p>Your withdrawal of <strong>${fmtUSD(numAmount)}</strong> via ${METHOD_LABELS[method] || method} has been processed.</p><p>New balance: <strong>${fmtUSD(newBalance)}</strong>.</p>`,
        bodyText: `Your withdrawal of ${fmtUSD(numAmount)} via ${METHOD_LABELS[method] || method} has been processed. New balance: ${fmtUSD(newBalance)}.`,
      });

      return sendSuccess(
        res,
        {
          transaction: tx,
          pendingApproval: false,
          newBalance,
          receiptUrl: tx.receiptUrl || null,
          receiptPdfEndpoint: `/api/v1/accounts/${user._id}/receipts/${tx.transactionId}/pdf`,
          email,
        },
        201
      );
    }

    // Pending approval mode (default, matching web portal)
    const tx = new Transaction({
      userId: userCheck._id,
      type: 'debit',
      category: 'withdrawal',
      method,
      amount: numAmount,
      fee,
      description: description || `${METHOD_LABELS[method] || method} Withdrawal`,
      note: note || '',
      status: 'pending',
      balanceAfter: null,
      metadata: { source: 'api_v1', apiKeyId: req.apiKey._id, bankDetails, cardDetails, cryptoDetails },
      ...(cryptoDetails && typeof cryptoDetails === 'object' ? {
        cryptoCoin: cryptoDetails.coin,
        cryptoAmount: cryptoDetails.coinAmount,
        cryptoNetwork: cryptoDetails.network,
        walletAddress: cryptoDetails.walletAddress,
      } : {}),
    });
    await tx.save();

    if (sec.deductTokens) {
      userCheck.tokenBalance = Math.max(0, (userCheck.tokenBalance || 0) - 10);
      await userCheck.save({ validateBeforeSave: false });
    }

    await Notification.create({
      userId: userCheck._id,
      title: 'Withdrawal Request Submitted',
      message: `Your withdrawal request of ${fmtUSD(numAmount)} is pending admin approval. Your balance has NOT been deducted yet.`,
      type: 'transaction',
      priority: 'medium',
    });

    const email = await sendTransactionEmailSafe({
      to: userCheck.email,
      subject: 'Withdrawal Request Submitted',
      recipientName: userCheck.firstName,
      type: 'debit',
      amount: numAmount,
      bodyHTML: `<p>Your withdrawal request of <strong>${fmtUSD(numAmount)}</strong> via ${METHOD_LABELS[method] || method} is pending admin approval.</p><p>Your balance has not been deducted yet.</p>`,
      bodyText: `Your withdrawal request of ${fmtUSD(numAmount)} via ${METHOD_LABELS[method] || method} is pending admin approval.`,
    });

    sendSuccess(
      res,
      {
        transaction: tx,
        pendingApproval: true,
        message: 'Withdrawal submitted for admin approval. Balance will be deducted upon approval.',
        currentBalance: userCheck.balance,
        email,
      },
      201
    );
  } catch (err) {
    if (err.status && err.code) return sendError(res, err.status, err.code, err.message);
    next(err);
  }
};

exports.transfer = async (req, res, next) => {
  try {
    const senderCheck = req.targetUser;
    if (!senderCheck.transfersEnabled) {
      return sendError(
        res,
        403,
        'TRANSFERS_BLOCKED',
        'Transfers are currently blocked on this account.',
        {
          reason: senderCheck.transfersBlockReason || 'Your transfer capability is under review. Contact support.',
          requirements: senderCheck.transferRequirements || [],
        }
      );
    }

    const { amount, recipientEmail, recipientAccountNumber, description, note } = req.body || {};
    const numAmount = parseFloat(amount);
    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      return sendError(res, 400, 'INVALID_AMOUNT', 'Transfer amount must be greater than 0.');
    }
    if (numAmount > 100000) {
      return sendError(res, 400, 'LIMIT_EXCEEDED', 'Maximum single transfer is $100,000.');
    }
    if (!recipientEmail && !recipientAccountNumber) {
      return sendError(res, 400, 'RECIPIENT_REQUIRED', 'Either recipientEmail or recipientAccountNumber is required.');
    }

    const sec = await verifyApiTransactionSecurity(req, senderCheck);
    if (!sec.ok) return sendError(res, sec.status, sec.code, sec.error);

    const { sender, recipient, senderTx, senderNewBalance, finalRecipientBalance } = await runInTransaction(async (session) => {
      const senderQuery = User.findById(senderCheck._id);
      if (session) senderQuery.session(session);
      const freshSender = await senderQuery;

      if (freshSender.balance < numAmount) {
        const e = new Error(`Insufficient funds. Available: ${fmtUSD(freshSender.balance)}`);
        e.status = 400; e.code = 'INSUFFICIENT_FUNDS';
        throw e;
      }

      let targetRecipient = null;
      if (recipientAccountNumber) {
        const rq = User.findOne({ accountNumber: String(recipientAccountNumber).trim() });
        if (session) rq.session(session);
        targetRecipient = await rq;
      } else if (recipientEmail) {
        const rq = User.findOne({ email: String(recipientEmail).trim().toLowerCase() });
        if (session) rq.session(session);
        targetRecipient = await rq;
      }

      if (targetRecipient && targetRecipient.role === 'admin') {
        const e = new Error('Cannot transfer to administrative accounts.');
        e.status = 403; e.code = 'FORBIDDEN_ACCOUNT';
        throw e;
      }

      const isSelf =
        (targetRecipient && targetRecipient._id.toString() === freshSender._id.toString()) ||
        (recipientEmail && String(recipientEmail).trim().toLowerCase() === freshSender.email) ||
        (recipientAccountNumber && String(recipientAccountNumber).trim() === freshSender.accountNumber);

      if (isSelf) {
        const e = new Error('You cannot transfer money to your own account.');
        e.status = 400; e.code = 'SELF_TRANSFER_FORBIDDEN';
        throw e;
      }

      const nextSenderBalance = parseFloat((freshSender.balance - numAmount).toFixed(2));
      const recipientDisplay = targetRecipient
        ? `${targetRecipient.firstName} ${targetRecipient.lastName}`
        : (recipientEmail || recipientAccountNumber);

      const outTx = new Transaction({
        userId: freshSender._id,
        type: 'debit',
        category: 'transfer_out',
        method: 'internal',
        amount: numAmount,
        fee: 0,
        description: description || `Transfer to ${recipientDisplay}`,
        note: note || '',
        status: 'completed',
        balanceAfter: nextSenderBalance,
        recipientId: targetRecipient?._id,
        recipientName: targetRecipient ? `${targetRecipient.firstName} ${targetRecipient.lastName}` : undefined,
        recipientAccount: targetRecipient?.accountNumber || (recipientAccountNumber ? String(recipientAccountNumber).trim() : undefined),
        metadata: { source: 'api_v1', apiKeyId: req.apiKey._id },
      });

      await outTx.save(session ? { session } : {});
      freshSender.balance = nextSenderBalance;
      if (sec.deductTokens) freshSender.tokenBalance = Math.max(0, (freshSender.tokenBalance || 0) - 10);
      await freshSender.save(session ? { session } : {});

      let recipientBal = null;
      if (targetRecipient) {
        const rq2 = User.findById(targetRecipient._id);
        if (session) rq2.session(session);
        const freshRecip = await rq2;
        recipientBal = parseFloat((freshRecip.balance + numAmount).toFixed(2));
        const inTx = new Transaction({
          userId: freshRecip._id,
          type: 'credit',
          category: 'transfer_in',
          method: 'internal',
          amount: numAmount,
          fee: 0,
          description: `Transfer from ${freshSender.firstName} ${freshSender.lastName}`,
          note: note || '',
          status: 'completed',
          balanceAfter: recipientBal,
          recipientId: freshSender._id,
          recipientName: `${freshSender.firstName} ${freshSender.lastName}`,
          recipientAccount: freshSender.accountNumber,
          metadata: { source: 'api_v1', apiKeyId: req.apiKey._id },
        });
        await inTx.save(session ? { session } : {});
        freshRecip.balance = recipientBal;
        await freshRecip.save(session ? { session } : {});
      }

      return {
        sender: freshSender,
        recipient: targetRecipient,
        senderTx: outTx,
        senderNewBalance: nextSenderBalance,
        finalRecipientBalance: recipientBal,
      };
    });

    try {
      const receipt = await generateReceiptPDF(senderTx, sender);
      senderTx.receiptGenerated = true;
      senderTx.receiptUrl = receipt.url;
      await senderTx.save();
    } catch (_) {}

    const notifs = [
      {
        userId: sender._id,
        title: 'Transfer Sent',
        message: `You sent ${fmtUSD(numAmount)} to ${senderTx.recipientName || recipientEmail || recipientAccountNumber}. New balance: ${fmtUSD(senderNewBalance)}`,
        type: 'transaction',
      },
    ];
    if (recipient) {
      notifs.push({
        userId: recipient._id,
        title: 'Money Received',
        message: `You received ${fmtUSD(numAmount)} from ${sender.firstName} ${sender.lastName}.`,
        type: 'transaction',
      });
    }
    await Notification.create(notifs);

    const emails = await Promise.all([
      sendTransactionEmailSafe({
        to: sender.email,
        subject: 'Transfer Successful',
        recipientName: sender.firstName,
        type: 'debit',
        amount: numAmount,
        bodyHTML: `<p>You have successfully sent <strong>${fmtUSD(numAmount)}</strong> to ${senderTx.recipientName || recipientEmail || recipientAccountNumber}.</p><p>New balance: <strong>${fmtUSD(senderNewBalance)}</strong>.</p>`,
        bodyText: `You sent ${fmtUSD(numAmount)} to ${senderTx.recipientName || recipientEmail || recipientAccountNumber}. New balance: ${fmtUSD(senderNewBalance)}.`,
      }),
      ...(recipient
        ? [
            sendTransactionEmailSafe({
              to: recipient.email,
              subject: 'Money Received',
              recipientName: recipient.firstName,
              type: 'credit',
              amount: numAmount,
              bodyHTML: `<p>You received <strong>${fmtUSD(numAmount)}</strong> from ${sender.firstName} ${sender.lastName}.</p><p>New balance: <strong>${fmtUSD(finalRecipientBalance)}</strong>.</p>`,
              bodyText: `You received ${fmtUSD(numAmount)} from ${sender.firstName} ${sender.lastName}. New balance: ${fmtUSD(finalRecipientBalance)}.`,
            }),
          ]
        : []),
    ]);

    sendSuccess(
      res,
      {
        transaction: senderTx,
        newBalance: senderNewBalance,
        recipientFound: !!recipient,
        receiptUrl: senderTx.receiptUrl || null,
        receiptPdfEndpoint: `/api/v1/accounts/${sender._id}/receipts/${senderTx.transactionId}/pdf`,
        emails,
      },
      201
    );
  } catch (err) {
    if (err.status && err.code) return sendError(res, err.status, err.code, err.message);
    next(err);
  }
};

exports.payBill = async (req, res, next) => {
  try {
    const { amount, billType, billerAccountNumber, accountNumber, description } = req.body || {};
    const acctRef = String(billerAccountNumber || accountNumber || '').trim();
    const numAmount = parseFloat(amount);

    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      return sendError(res, 400, 'INVALID_AMOUNT', 'Bill payment amount must be greater than 0.');
    }
    if (!billType || !String(billType).trim() || !acctRef) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'billType and billerAccountNumber are required.');
    }

    const sec = await verifyApiTransactionSecurity(req, req.targetUser);
    if (!sec.ok) return sendError(res, sec.status, sec.code, sec.error);

    const { tx, user, newBalance } = await runInTransaction(async (session) => {
      const q = User.findById(req.targetUser._id);
      if (session) q.session(session);
      const freshUser = await q;

      if (freshUser.balance < numAmount) {
        const e = new Error(`Insufficient funds. Available: ${fmtUSD(freshUser.balance)}`);
        e.status = 400; e.code = 'INSUFFICIENT_FUNDS';
        throw e;
      }

      const computedBalance = parseFloat((freshUser.balance - numAmount).toFixed(2));
      const newTx = new Transaction({
        userId: freshUser._id,
        type: 'debit',
        category: 'bill',
        method: 'internal',
        amount: numAmount,
        fee: 0,
        description: description || `${String(billType).trim()} Bill Payment`,
        note: `Account: ${acctRef}`,
        status: 'completed',
        balanceAfter: computedBalance,
        metadata: { source: 'api_v1', apiKeyId: req.apiKey._id, billType: String(billType).trim(), billerAccountNumber: acctRef },
      });

      await newTx.save(session ? { session } : {});
      freshUser.balance = computedBalance;
      if (sec.deductTokens) freshUser.tokenBalance = Math.max(0, (freshUser.tokenBalance || 0) - 10);
      await freshUser.save(session ? { session } : {});

      return { tx: newTx, user: freshUser, newBalance: computedBalance };
    });

    try {
      const receipt = await generateReceiptPDF(tx, user);
      tx.receiptGenerated = true;
      tx.receiptUrl = receipt.url;
      await tx.save();
    } catch (_) {}

    await Notification.create({
      userId: user._id,
      title: 'Bill Payment Processed',
      message: `Your ${billType} payment of ${fmtUSD(numAmount)} (Ref: ${acctRef}) was processed. New balance: ${fmtUSD(newBalance)}.`,
      type: 'transaction',
      priority: 'medium',
    });

    const email = await sendTransactionEmailSafe({
      to: user.email,
      subject: 'Bill Payment Processed',
      recipientName: user.firstName,
      type: 'debit',
      amount: numAmount,
      bodyHTML: `<p>Your ${billType} payment of <strong>${fmtUSD(numAmount)}</strong> has been processed.</p><p>New balance: <strong>${fmtUSD(newBalance)}</strong>.</p>`,
      bodyText: `Your ${billType} payment of ${fmtUSD(numAmount)} has been processed. New balance: ${fmtUSD(newBalance)}.`,
    });

    sendSuccess(
      res,
      {
        transaction: tx,
        newBalance,
        receiptUrl: tx.receiptUrl || null,
        receiptPdfEndpoint: `/api/v1/accounts/${user._id}/receipts/${tx.transactionId}/pdf`,
        email,
      },
      201
    );
  } catch (err) {
    if (err.status && err.code) return sendError(res, err.status, err.code, err.message);
    next(err);
  }
};

// ── Transactions & Receipts ───────────────────────────────────────────────────

exports.listTransactions = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, category, type, search, startDate, endDate } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

    const query = { userId: req.targetUser._id };
    if (status && status !== 'all') query.status = status;
    if (category && category !== 'all') query.category = category;
    if (type && type !== 'all') query.type = type;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        const sd = new Date(startDate);
        if (Number.isNaN(sd.getTime())) return sendError(res, 400, 'INVALID_DATE', 'Invalid startDate');
        query.createdAt.$gte = sd;
      }
      if (endDate) {
        const ed = new Date(endDate);
        if (Number.isNaN(ed.getTime())) return sendError(res, 400, 'INVALID_DATE', 'Invalid endDate');
        query.createdAt.$lte = ed;
      }
    }
    if (search && String(search).trim()) {
      const s = String(search).trim();
      query.$or = [
        { description: { $regex: s, $options: 'i' } },
        { transactionId: { $regex: s, $options: 'i' } },
      ];
    }

    const [total, transactions, stats] = await Promise.all([
      Transaction.countDocuments(query),
      Transaction.find(query)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .populate('recipientId', 'firstName lastName email accountNumber'),
      Transaction.aggregate([
        { $match: { userId: req.targetUser._id, status: 'completed' } },
        { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
    ]);

    sendSuccess(
      res,
      {
        transactions,
        stats: stats.reduce((acc, s) => ({ ...acc, [s._id]: { total: s.total, count: s.count } }), {}),
      },
      200,
      { pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) } }
    );
  } catch (err) {
    next(err);
  }
};

exports.getTransaction = async (req, res, next) => {
  try {
    const rawTxId = String(req.params.transactionId || '').trim();
    const orConds = [{ transactionId: rawTxId }];
    if (mongoose.isValidObjectId(rawTxId)) orConds.push({ _id: rawTxId });

    const tx = await Transaction.findOne({ $or: orConds, userId: req.targetUser._id })
      .populate('recipientId', 'firstName lastName email accountNumber');
    if (!tx) return sendError(res, 404, 'TRANSACTION_NOT_FOUND', `Transaction '${rawTxId}' was not found.`);

    sendSuccess(res, { transaction: tx });
  } catch (err) {
    next(err);
  }
};

exports.getReceipt = async (req, res, next) => {
  try {
    const rawTxId = String(req.params.transactionId || '').trim();
    const orConds = [{ transactionId: rawTxId }];
    if (mongoose.isValidObjectId(rawTxId)) orConds.push({ _id: rawTxId });

    const tx = await Transaction.findOne({ $or: orConds, userId: req.targetUser._id })
      .populate('recipientId', 'firstName lastName email accountNumber');
    if (!tx) return sendError(res, 404, 'RECEIPT_NOT_FOUND', `Receipt for '${rawTxId}' was not found.`);

    sendSuccess(res, {
      transaction: tx,
      accountHolder: `${req.targetUser.firstName} ${req.targetUser.lastName}`,
      accountNumberMasked: '****' + String(req.targetUser.accountNumber || '').slice(-4),
      routingNumber: req.targetUser.routingNumber || '021000021',
      pdfDownloadUrl: `/api/v1/accounts/${req.targetUser._id}/receipts/${tx.transactionId}/pdf`,
    });
  } catch (err) {
    next(err);
  }
};

exports.downloadReceiptPdf = async (req, res, next) => {
  try {
    const rawTxId = String(req.params.transactionId || '').trim();
    const orConds = [{ transactionId: rawTxId }];
    if (mongoose.isValidObjectId(rawTxId)) orConds.push({ _id: rawTxId });

    const tx = await Transaction.findOne({ $or: orConds, userId: req.targetUser._id });
    if (!tx) return sendError(res, 404, 'TRANSACTION_NOT_FOUND', `Transaction '${rawTxId}' was not found.`);

    const receipt = await generateReceiptPDF(tx, req.targetUser);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Blue_Ridge_Bank_Receipt_${tx.transactionId}.pdf"`);
    fs.createReadStream(receipt.filepath).pipe(res);
  } catch (err) {
    next(err);
  }
};

// ── Debit Cards ───────────────────────────────────────────────────────────────

exports.getCard = async (req, res, next) => {
  try {
    const user = req.targetUser;
    const reveal = String(req.query.reveal || '').toLowerCase() === 'true';

    const payload = {
      cardStatus: user.cardStatus || 'Not Requested',
      cardType: user.cardType || null,
      cardNumberMasked: user.cardNumber ? `**** **** **** ${String(user.cardNumber).slice(-4)}` : null,
      cardExpiry: user.cardStatus === 'Active' ? (reveal ? user.cardExpiry : '••/••') : null,
      cvv: user.cardStatus === 'Active' ? '•••' : null,
    };

    if (reveal) {
      if (user.cardStatus !== 'Active') {
        return sendError(res, 400, 'CARD_NOT_ACTIVE', 'Full credentials can only be revealed for Active debit cards.');
      }
      if (user.pin) {
        const suppliedPin = req.headers['x-account-pin'] || req.query.pin;
        if (!suppliedPin) {
          return sendError(
            res,
            400,
            'PIN_REQUIRED',
            'Account has a transaction PIN set. Supply X-Account-Pin header or ?pin= to reveal card credentials.'
          );
        }
        const match = await bcrypt.compare(String(suppliedPin), user.pin);
        if (!match) return sendError(res, 401, 'INVALID_PIN', 'Invalid transaction PIN.');
      }
      payload.cardNumber = user.cardNumber;
      payload.cardExpiry = user.cardExpiry;
      payload.cvv = user.cvv;
    }

    sendSuccess(res, payload);
  } catch (err) {
    next(err);
  }
};

exports.requestCard = async (req, res, next) => {
  try {
    const { cardType } = req.body || {};
    if (!['Visa', 'Mastercard'].includes(cardType)) {
      return sendError(res, 400, 'INVALID_CARD_TYPE', 'cardType must be "Visa" or "Mastercard".');
    }

    const user = req.targetUser;
    if (user.cardStatus !== 'Not Requested') {
      return sendError(res, 400, 'CARD_ALREADY_REQUESTED', `Card status is already '${user.cardStatus}'.`);
    }

    const s = await AppSettings.findOne({ key: 'card_fee' }).lean();
    const fee = s ? Number(s.value) : 50;

    if (user.balance < fee) {
      return sendError(
        res,
        400,
        'INSUFFICIENT_FUNDS',
        `Insufficient balance for card issuance fee (${fmtUSD(fee)}). Available: ${fmtUSD(user.balance)}.`
      );
    }

    user.balance = parseFloat((user.balance - fee).toFixed(2));
    user.cardStatus = 'Pending Approval';
    user.cardType = cardType;
    await user.save();

    await Notification.create({
      userId: user._id,
      title: 'Debit Card Requested',
      message: `Your ${cardType} debit card request has been submitted (${fmtUSD(fee)} issuance fee deducted) and is pending approval.`,
      type: 'system',
      priority: 'medium',
    });

    sendSuccess(
      res,
      {
        cardStatus: user.cardStatus,
        cardType: user.cardType,
        feeDeducted: fee,
        newBalance: user.balance,
        message: 'Card requested successfully.',
      },
      201
    );
  } catch (err) {
    next(err);
  }
};

// ── Wealth & Reserves ─────────────────────────────────────────────────────────

exports.getWealthOverview = async (req, res) => {
  const fx = parseCurrency(req.query.currency);
  if (!fx) {
    return sendError(res, 400, 'UNSUPPORTED_CURRENCY', 'Supported currencies are USD, GBP, and EUR.');
  }

  const user = req.targetUser;
  const usd = computeWealthTotals(user);
  const converted = Object.fromEntries(Object.entries(usd).map(([k, v]) => [k, applyFx(v, fx.rate)]));
  const pct = (v) => (usd.totalNetWorth > 0 ? parseFloat(((v / usd.totalNetWorth) * 100).toFixed(2)) : 0);

  sendSuccess(res, {
    accountId: user._id,
    currency: fx.currency,
    exchangeRate: fx.rate,
    totalNetWorth: converted.totalNetWorth,
    breakdown: converted,
    usd,
    allocationPct: {
      checking: pct(usd.checking),
      savings: pct(usd.savings),
      crypto: pct(usd.crypto),
      treasury: pct(usd.treasury),
      investments: pct(usd.investments),
      linkedAccounts: pct(usd.linkedAccounts),
      trust: pct(usd.trust),
    },
    counts: {
      cryptoAssets: (user.cryptoAssets || []).length,
      treasuryAssets: (user.treasuryAssets || []).length,
      investments: (user.investments || []).length,
      linkedAccounts: (user.linkedAccounts || []).length,
      trustEnabled: !!user.trust?.enabled,
    },
  });
};

exports.getWealthSection = (section) => (req, res) => {
  const user = req.targetUser;
  if (section === 'crypto') {
    const assets = user.cryptoAssets || [];
    const totalValueUSD = parseFloat(assets.reduce((s, a) => s + (a.valueUSD || 0), 0).toFixed(2));
    return sendSuccess(res, { assets, totalValueUSD, count: assets.length });
  }
  if (section === 'treasury') {
    const assets = user.treasuryAssets || [];
    const totalValueUSD = parseFloat(assets.reduce((s, a) => s + (a.totalValue || 0), 0).toFixed(2));
    return sendSuccess(res, { assets, totalValueUSD, count: assets.length });
  }
  if (section === 'investments') {
    const positions = user.investments || [];
    const totalValueUSD = parseFloat(positions.reduce((s, a) => s + (a.currentValue || 0), 0).toFixed(2));
    return sendSuccess(res, { investments: positions, totalValueUSD, count: positions.length });
  }
  if (section === 'trust') {
    return sendSuccess(res, { trust: user.trust || { enabled: false, balance: 0 } });
  }
  if (section === 'linked-accounts') {
    const linkedAccounts = user.linkedAccounts || [];
    const totalBalanceUSD = parseFloat(linkedAccounts.reduce((s, a) => s + (a.balance || 0), 0).toFixed(2));
    return sendSuccess(res, { linkedAccounts, totalBalanceUSD, count: linkedAccounts.length });
  }
  return sendError(res, 404, 'UNKNOWN_SECTION', 'Unknown wealth section.');
};

// ── Security Tokens ───────────────────────────────────────────────────────────

exports.getTokens = async (req, res, next) => {
  try {
    const setting = await AppSettings.findOne({ key: 'token_packages' }).lean();
    const packages =
      Array.isArray(setting?.value) && setting.value.length === 3
        ? setting.value
        : DEFAULT_TOKEN_PACKAGES;

    sendSuccess(res, {
      tokenBalance: req.targetUser.tokenBalance || 0,
      hasTrackToken: !!req.targetUser.trackTokenNumber,
      costPerTransaction: 10,
      enforcePinAndTtnOnKey: !!req.apiKey.enforcePinAndTtn,
      packages,
    });
  } catch (err) {
    next(err);
  }
};

// ── Notifications ─────────────────────────────────────────────────────────────

exports.listNotifications = async (req, res, next) => {
  try {
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 30));
    const [notifications, unreadCount] = await Promise.all([
      Notification.find({ userId: req.targetUser._id }).sort({ createdAt: -1 }).limit(limit),
      Notification.countDocuments({ userId: req.targetUser._id, read: false }),
    ]);
    sendSuccess(res, { notifications, unreadCount });
  } catch (err) {
    next(err);
  }
};

exports.markAllNotificationsRead = async (req, res, next) => {
  try {
    const result = await Notification.updateMany({ userId: req.targetUser._id, read: false }, { read: true });
    sendSuccess(res, { markedRead: result.modifiedCount || 0 });
  } catch (err) {
    next(err);
  }
};

exports.markNotificationRead = async (req, res, next) => {
  try {
    const { notificationId } = req.params;
    if (!mongoose.isValidObjectId(notificationId)) {
      return sendError(res, 400, 'INVALID_ID', 'Invalid notification ID.');
    }
    const notif = await Notification.findOneAndUpdate(
      { _id: notificationId, userId: req.targetUser._id },
      { read: true },
      { new: true }
    );
    if (!notif) return sendError(res, 404, 'NOTIFICATION_NOT_FOUND', 'Notification not found.');
    sendSuccess(res, { notification: notif });
  } catch (err) {
    next(err);
  }
};

exports.deleteNotification = async (req, res, next) => {
  try {
    const { notificationId } = req.params;
    if (!mongoose.isValidObjectId(notificationId)) {
      return sendError(res, 400, 'INVALID_ID', 'Invalid notification ID.');
    }
    const notif = await Notification.findOneAndDelete({ _id: notificationId, userId: req.targetUser._id });
    if (!notif) return sendError(res, 404, 'NOTIFICATION_NOT_FOUND', 'Notification not found.');
    sendSuccess(res, { deleted: true, id: notificationId });
  } catch (err) {
    next(err);
  }
};

// ── Support Chat ──────────────────────────────────────────────────────────────

exports.getChatHistory = async (req, res, next) => {
  try {
    const roomId = req.targetUser._id.toString();
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 100));
    const messages = await ChatMessage.find({ roomId }).sort({ createdAt: 1 }).limit(limit);

    await ChatMessage.updateMany(
      { roomId, senderRole: 'admin', read: false },
      { $set: { read: true, readAt: new Date() } }
    );

    sendSuccess(res, { messages });
  } catch (err) {
    next(err);
  }
};

exports.sendChatMessage = async (req, res, next) => {
  try {
    const { message } = req.body || {};
    if (!message || !String(message).trim()) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'message is required.');
    }

    const user = req.targetUser;
    const roomId = user._id.toString();
    const msg = await ChatMessage.create({
      roomId,
      senderId: user._id,
      senderRole: 'user',
      senderName: `${user.firstName} ${user.lastName}`,
      message: String(message).trim(),
    });

    const io = req.app.get('io');
    if (io) {
      io.to(roomId).emit('new_message', msg);
      io.to('admin_room').emit('new_message', msg);
    }

    sendSuccess(res, { message: msg }, 201);
  } catch (err) {
    next(err);
  }
};
