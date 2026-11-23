const mongoose = require('mongoose');
const ApiKey = require('../models/ApiKey');
const { API_PERMISSIONS, API_PERMISSION_CATALOG } = require('../models/ApiKey');
const ApiRequestLog = require('../models/ApiRequestLog');
const ApiIdempotency = require('../models/ApiIdempotency');
const User = require('../models/User');
const Notification = require('../models/Notification');

const SCOPE_META = [
  {
    value: 'all',
    label: 'All Bank Accounts (Partner)',
    description: 'Can create new accounts and operate on any non-admin bank account.',
  },
  {
    value: 'owned',
    label: 'Created / Managed Accounts Only',
    description: 'Can create new accounts and operate only on accounts created by this key (plus any assigned client).',
  },
  {
    value: 'single_user',
    label: 'Single Assigned Client Account',
    description: 'Locked strictly to one specific bank client account. Cannot create or access other accounts.',
  },
];

function parseIpWhitelist(input) {
  if (!input) return [];
  const rawList = Array.isArray(input) ? input : String(input).split(/[,\n]/);
  return rawList
    .map((ip) => String(ip).trim().replace(/^::ffff:/, ''))
    .filter(Boolean);
}

function sanitizePermissions(perms) {
  if (!Array.isArray(perms)) return [...API_PERMISSIONS];
  return [...new Set(perms.filter((p) => API_PERMISSIONS.includes(p)))];
}

exports.getMeta = async (req, res) => {
  res.json({
    permissions: API_PERMISSION_CATALOG,
    scopes: SCOPE_META,
  });
};

exports.listApiKeys = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const query = {};
    if (status && status !== 'all') query.status = status;
    if (search && String(search).trim()) {
      const s = String(search).trim();
      query.$or = [
        { name: { $regex: s, $options: 'i' } },
        { ownerName: { $regex: s, $options: 'i' } },
        { ownerEmail: { $regex: s, $options: 'i' } },
        { keyPrefix: { $regex: s, $options: 'i' } },
      ];
    }

    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [apiKeys, total, active, suspended, revoked, usageAgg, requests24h] = await Promise.all([
      ApiKey.find(query)
        .populate('userId', 'firstName lastName email accountNumber status kyc')
        .populate('createdBy', 'firstName lastName email')
        .sort({ createdAt: -1 }),
      ApiKey.countDocuments(),
      ApiKey.countDocuments({ status: 'active' }),
      ApiKey.countDocuments({ status: 'suspended' }),
      ApiKey.countDocuments({ status: 'revoked' }),
      ApiKey.aggregate([{ $group: { _id: null, totalRequests: { $sum: '$usageCount' } } }]),
      ApiRequestLog.countDocuments({ createdAt: { $gte: since24h } }),
    ]);

    res.json({
      apiKeys,
      stats: {
        total,
        active,
        suspended,
        revoked,
        totalRequests: usageAgg[0]?.totalRequests || 0,
        requests24h,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.createApiKey = async (req, res, next) => {
  try {
    const {
      name,
      ownerName,
      ownerEmail,
      userId,
      accountScope = 'all',
      environment = 'live',
      permissions,
      rateLimitPerMinute = 120,
      enforcePinAndTtn = false,
      instantWithdrawal = false,
      ipWhitelist,
      expiresAt,
      notes = '',
    } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'API key name/label is required' });
    }
    if (!['all', 'owned', 'single_user'].includes(accountScope)) {
      return res.status(400).json({ error: 'Invalid accountScope. Use all, owned, or single_user.' });
    }
    if (!['live', 'test'].includes(environment)) {
      return res.status(400).json({ error: 'Invalid environment. Use live or test.' });
    }

    let boundUser = null;
    if (userId) {
      if (!mongoose.isValidObjectId(userId)) {
        return res.status(400).json({ error: 'Invalid bound client userId' });
      }
      boundUser = await User.findById(userId).select('firstName lastName email accountNumber role');
      if (!boundUser) {
        return res.status(404).json({ error: 'Assigned bank client not found' });
      }
      if (boundUser.role === 'admin') {
        return res.status(400).json({ error: 'Cannot bind an external API key to an administrator account' });
      }
    }

    if (accountScope === 'single_user' && !boundUser) {
      return res.status(400).json({ error: 'A bank client user must be selected for single_user scope' });
    }

    const resolvedOwnerName = String(
      ownerName || (boundUser ? `${boundUser.firstName} ${boundUser.lastName}` : '')
    ).trim();
    const resolvedOwnerEmail = String(ownerEmail || (boundUser ? boundUser.email : '')).trim().toLowerCase();

    if (!resolvedOwnerName || !resolvedOwnerEmail) {
      return res.status(400).json({ error: 'Owner name and owner email are required' });
    }

    const rate = Number(rateLimitPerMinute);
    if (!Number.isFinite(rate) || rate < 1 || rate > 10000) {
      return res.status(400).json({ error: 'rateLimitPerMinute must be between 1 and 10000' });
    }

    let parsedExpiry = null;
    if (expiresAt) {
      parsedExpiry = new Date(expiresAt);
      if (Number.isNaN(parsedExpiry.getTime())) {
        return res.status(400).json({ error: 'Invalid expiration date' });
      }
    }

    let finalPermissions = sanitizePermissions(permissions);
    if (accountScope === 'single_user') {
      finalPermissions = finalPermissions.filter((p) => p !== 'accounts:create');
    }

    const { rawKey, keyPrefix, keyHash } = ApiKey.generateRawKey(environment);

    const apiKey = await ApiKey.create({
      name: String(name).trim(),
      ownerName: resolvedOwnerName,
      ownerEmail: resolvedOwnerEmail,
      userId: boundUser ? boundUser._id : null,
      accountScope,
      keyPrefix,
      keyHash,
      environment,
      permissions: finalPermissions,
      enforcePinAndTtn: !!enforcePinAndTtn,
      instantWithdrawal: !!instantWithdrawal,
      rateLimitPerMinute: Math.round(rate),
      ipWhitelist: parseIpWhitelist(ipWhitelist),
      expiresAt: parsedExpiry,
      notes: String(notes || '').trim(),
      createdBy: req.user._id,
    });

    if (boundUser) {
      await Notification.create({
        userId: boundUser._id,
        title: 'API Access Provisioned',
        message: `An administrator generated an external API key ("${apiKey.name}", prefix ${keyPrefix}) linked to your Blue ridge Bank account.`,
        type: 'security',
        priority: 'high',
      });
    }

    const populated = await ApiKey.findById(apiKey._id)
      .populate('userId', 'firstName lastName email accountNumber status kyc')
      .populate('createdBy', 'firstName lastName email');

    res.status(201).json({ apiKey: populated, rawKey });
  } catch (err) {
    next(err);
  }
};

exports.getApiKeyDetail = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid API key ID' });
    }
    const apiKey = await ApiKey.findById(req.params.id)
      .populate('userId', 'firstName lastName email accountNumber status kyc')
      .populate('createdBy', 'firstName lastName email');
    if (!apiKey) return res.status(404).json({ error: 'API key not found' });

    const logs = await ApiRequestLog.find({ apiKeyId: apiKey._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('targetUserId', 'firstName lastName email accountNumber');

    res.json({ apiKey, logs });
  } catch (err) {
    next(err);
  }
};

exports.updateApiKey = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid API key ID' });
    }
    const apiKey = await ApiKey.findById(req.params.id);
    if (!apiKey) return res.status(404).json({ error: 'API key not found' });

    const {
      name,
      ownerName,
      ownerEmail,
      userId,
      accountScope,
      permissions,
      rateLimitPerMinute,
      enforcePinAndTtn,
      instantWithdrawal,
      ipWhitelist,
      expiresAt,
      notes,
    } = req.body;

    if (name !== undefined) {
      if (!String(name).trim()) return res.status(400).json({ error: 'Name cannot be empty' });
      apiKey.name = String(name).trim();
    }
    if (ownerName !== undefined) {
      if (!String(ownerName).trim()) return res.status(400).json({ error: 'Owner name cannot be empty' });
      apiKey.ownerName = String(ownerName).trim();
    }
    if (ownerEmail !== undefined) {
      if (!String(ownerEmail).trim()) return res.status(400).json({ error: 'Owner email cannot be empty' });
      apiKey.ownerEmail = String(ownerEmail).trim().toLowerCase();
    }
    if (userId !== undefined) {
      if (!userId) {
        apiKey.userId = null;
      } else {
        if (!mongoose.isValidObjectId(userId)) return res.status(400).json({ error: 'Invalid userId' });
        const target = await User.findById(userId).select('role');
        if (!target) return res.status(404).json({ error: 'Assigned user not found' });
        if (target.role === 'admin') return res.status(400).json({ error: 'Cannot bind key to admin account' });
        apiKey.userId = target._id;
      }
    }
    if (accountScope !== undefined) {
      if (!['all', 'owned', 'single_user'].includes(accountScope)) {
        return res.status(400).json({ error: 'Invalid accountScope' });
      }
      apiKey.accountScope = accountScope;
    }
    if (apiKey.accountScope === 'single_user' && !apiKey.userId) {
      return res.status(400).json({ error: 'single_user scope requires an assigned bank client account' });
    }
    if (permissions !== undefined) {
      let nextPerms = sanitizePermissions(permissions);
      if (apiKey.accountScope === 'single_user') {
        nextPerms = nextPerms.filter((p) => p !== 'accounts:create');
      }
      apiKey.permissions = nextPerms;
    }
    if (rateLimitPerMinute !== undefined) {
      const rate = Number(rateLimitPerMinute);
      if (!Number.isFinite(rate) || rate < 1 || rate > 10000) {
        return res.status(400).json({ error: 'rateLimitPerMinute must be between 1 and 10000' });
      }
      apiKey.rateLimitPerMinute = Math.round(rate);
    }
    if (enforcePinAndTtn !== undefined) apiKey.enforcePinAndTtn = !!enforcePinAndTtn;
    if (instantWithdrawal !== undefined) apiKey.instantWithdrawal = !!instantWithdrawal;
    if (ipWhitelist !== undefined) apiKey.ipWhitelist = parseIpWhitelist(ipWhitelist);
    if (expiresAt !== undefined) {
      if (!expiresAt) {
        apiKey.expiresAt = null;
      } else {
        const d = new Date(expiresAt);
        if (Number.isNaN(d.getTime())) return res.status(400).json({ error: 'Invalid expiration date' });
        apiKey.expiresAt = d;
      }
    }
    if (notes !== undefined) apiKey.notes = String(notes || '').trim();

    await apiKey.save();

    const populated = await ApiKey.findById(apiKey._id)
      .populate('userId', 'firstName lastName email accountNumber status kyc')
      .populate('createdBy', 'firstName lastName email');

    res.json({ apiKey: populated });
  } catch (err) {
    next(err);
  }
};

exports.setApiKeyStatus = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid API key ID' });
    }
    const { status } = req.body;
    if (!['active', 'suspended', 'revoked'].includes(status)) {
      return res.status(400).json({ error: 'Status must be active, suspended, or revoked' });
    }
    const apiKey = await ApiKey.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    )
      .populate('userId', 'firstName lastName email accountNumber status kyc')
      .populate('createdBy', 'firstName lastName email');

    if (!apiKey) return res.status(404).json({ error: 'API key not found' });
    res.json({ apiKey });
  } catch (err) {
    next(err);
  }
};

exports.rotateApiKey = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid API key ID' });
    }
    const apiKey = await ApiKey.findById(req.params.id).select('+keyHash');
    if (!apiKey) return res.status(404).json({ error: 'API key not found' });
    if (apiKey.status === 'revoked') {
      return res.status(400).json({ error: 'Revoked API keys cannot be rotated. Create a new API key instead.' });
    }

    const { rawKey, keyPrefix, keyHash } = ApiKey.generateRawKey(apiKey.environment);
    apiKey.keyPrefix = keyPrefix;
    apiKey.keyHash = keyHash;
    if (apiKey.status === 'suspended') apiKey.status = 'active';
    await apiKey.save();

    const populated = await ApiKey.findById(apiKey._id)
      .populate('userId', 'firstName lastName email accountNumber status kyc')
      .populate('createdBy', 'firstName lastName email');

    res.json({ apiKey: populated, rawKey });
  } catch (err) {
    next(err);
  }
};

exports.deleteApiKey = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid API key ID' });
    }
    const apiKey = await ApiKey.findByIdAndDelete(req.params.id);
    if (!apiKey) return res.status(404).json({ error: 'API key not found' });

    await Promise.all([
      ApiRequestLog.deleteMany({ apiKeyId: apiKey._id }),
      ApiIdempotency.deleteMany({ apiKeyId: apiKey._id }),
    ]);

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

exports.getRecentLogs = async (req, res, next) => {
  try {
    const { apiKeyId, statusCode, method, page = 1, limit = 50 } = req.query;
    const query = {};
    if (apiKeyId && mongoose.isValidObjectId(apiKeyId)) query.apiKeyId = apiKeyId;
    if (statusCode) {
      const code = Number(statusCode);
      if (Number.isFinite(code)) query.statusCode = code;
    }
    if (method && method !== 'all') query.method = String(method).toUpperCase();

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));

    const [total, logs] = await Promise.all([
      ApiRequestLog.countDocuments(query),
      ApiRequestLog.find(query)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .populate('apiKeyId', 'name keyPrefix ownerName')
        .populate('targetUserId', 'firstName lastName email accountNumber'),
    ]);

    res.json({
      logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    next(err);
  }
};
