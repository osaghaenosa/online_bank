const crypto = require('crypto');
const cors = require('cors');
const mongoose = require('mongoose');
const ApiKey = require('../models/ApiKey');
const ApiRequestLog = require('../models/ApiRequestLog');
const ApiIdempotency = require('../models/ApiIdempotency');
const AppSettings = require('../models/AppSettings');
const User = require('../models/User');

// Fixed-window rate limit buckets: keyId -> { count, resetAt }
const rateBuckets = new Map();

// Periodically purge expired rate-limit buckets to keep memory bounded
setInterval(() => {
  const now = Date.now();
  for (const [k, bucket] of rateBuckets.entries()) {
    if (bucket.resetAt <= now) rateBuckets.delete(k);
  }
}, 60 * 1000).unref();

function extractClientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  let ip = Array.isArray(fwd) ? fwd[0] : (typeof fwd === 'string' ? fwd.split(',')[0] : '');
  if (!ip) ip = req.ip || req.socket?.remoteAddress || '';
  return String(ip).trim().replace(/^::ffff:/, '');
}

function sendSuccess(res, data, status = 200, meta = undefined) {
  const payload = {
    success: true,
    requestId: res.locals.requestId,
    data,
  };
  if (meta !== undefined) payload.meta = meta;
  return res.status(status).json(payload);
}

function sendError(res, status, code, message, details = undefined) {
  res.locals.errorCode = code;
  const errorObj = { code, message };
  if (details !== undefined) errorObj.details = details;
  return res.status(status).json({
    success: false,
    requestId: res.locals.requestId,
    error: errorObj,
  });
}

const apiCors = cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'Idempotency-Key', 'X-Account-Pin'],
  exposedHeaders: [
    'X-Request-Id',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
    'X-Idempotency-Replayed',
  ],
});

function attachRequestMeta(req, res, next) {
  const requestId = 'req_' + crypto.randomUUID().replace(/-/g, '').slice(0, 16);
  req.requestId = requestId;
  req.apiStartTime = Date.now();
  res.locals.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);

  res.on('finish', () => {
    if (!req.apiKey) return;
    const responseTimeMs = Math.max(0, Date.now() - req.apiStartTime);
    ApiRequestLog.create({
      apiKeyId: req.apiKey._id,
      keyPrefix: req.apiKey.keyPrefix,
      method: req.method,
      path: req.originalUrl.split('?')[0],
      statusCode: res.statusCode,
      responseTimeMs,
      ip: extractClientIp(req),
      targetUserId: res.locals.targetUserId || req.targetUser?._id || null,
      errorCode: res.locals.errorCode || null,
    }).catch(() => {});
  });

  next();
}

async function authenticateApiKey(req, res, next) {
  try {
    const maintenanceSetting = await AppSettings.findOne({ key: 'maintenance_mode' }).lean();
    if (maintenanceSetting?.value === true) {
      return sendError(
        res,
        503,
        'MAINTENANCE_MODE',
        'Blue ridge Bank is currently undergoing scheduled maintenance. Please try again later.'
      );
    }

    let rawKey = '';
    const headerKey = req.headers['x-api-key'];
    const authHeader = req.headers.authorization;

    if (typeof headerKey === 'string' && headerKey.trim()) {
      rawKey = headerKey.trim();
    } else if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      rawKey = authHeader.slice(7).trim();
    }

    if (!rawKey) {
      return sendError(
        res,
        401,
        'API_KEY_MISSING',
        'API key required. Pass X-API-Key header or Authorization: Bearer <api_key>.'
      );
    }

    if (!rawKey.startsWith('brb_live_') && !rawKey.startsWith('brb_test_')) {
      return sendError(res, 401, 'INVALID_API_KEY', 'Invalid API key format.');
    }

    const keyHash = ApiKey.hashKey(rawKey);
    const apiKey = await ApiKey.findOne({ keyHash }).select('+keyHash');
    if (!apiKey) {
      return sendError(res, 401, 'INVALID_API_KEY', 'API key is invalid or unrecognized.');
    }

    if (apiKey.status === 'suspended') {
      return sendError(res, 403, 'API_KEY_SUSPENDED', 'This API key has been suspended by an administrator.');
    }
    if (apiKey.status === 'revoked') {
      return sendError(res, 403, 'API_KEY_REVOKED', 'This API key has been permanently revoked.');
    }
    if (apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()) {
      return sendError(res, 401, 'API_KEY_EXPIRED', 'This API key has expired.');
    }

    const clientIp = extractClientIp(req);
    if (Array.isArray(apiKey.ipWhitelist) && apiKey.ipWhitelist.length > 0) {
      const normalizedAllowed = apiKey.ipWhitelist.map((ip) => String(ip).trim().replace(/^::ffff:/, ''));
      if (!normalizedAllowed.includes(clientIp)) {
        return sendError(
          res,
          403,
          'IP_NOT_ALLOWED',
          `Client IP ${clientIp || 'unknown'} is not authorized for this API key.`
        );
      }
    }

    // Per-key fixed-window rate limit (1 minute window)
    const limit = apiKey.rateLimitPerMinute || 120;
    const now = Date.now();
    const bucketKey = apiKey._id.toString();
    let bucket = rateBuckets.get(bucketKey);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + 60 * 1000 };
      rateBuckets.set(bucketKey, bucket);
    }
    bucket.count += 1;

    const remaining = Math.max(0, limit - bucket.count);
    const resetEpochSec = Math.ceil(bucket.resetAt / 1000);
    res.setHeader('X-RateLimit-Limit', String(limit));
    res.setHeader('X-RateLimit-Remaining', String(remaining));
    res.setHeader('X-RateLimit-Reset', String(resetEpochSec));

    if (bucket.count > limit) {
      const retryAfterSec = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
      res.setHeader('Retry-After', String(retryAfterSec));
      return sendError(
        res,
        429,
        'RATE_LIMIT_EXCEEDED',
        `Rate limit of ${limit} requests/minute exceeded. Retry in ${retryAfterSec}s.`
      );
    }

    req.apiKey = apiKey;

    // Non-blocking usage telemetry update
    ApiKey.updateOne(
      { _id: apiKey._id },
      { $inc: { usageCount: 1 }, $set: { lastUsedAt: new Date(), lastUsedIp: clientIp } }
    ).catch(() => {});

    next();
  } catch (err) {
    next(err);
  }
}

function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.apiKey) {
      return sendError(res, 401, 'API_KEY_MISSING', 'API authentication required.');
    }
    if (!Array.isArray(req.apiKey.permissions) || !req.apiKey.permissions.includes(permission)) {
      return sendError(
        res,
        403,
        'INSUFFICIENT_PERMISSION',
        `This API key does not have the required '${permission}' permission.`
      );
    }
    next();
  };
}

function resolveTargetAccount({ requireActive = false } = {}) {
  return async (req, res, next) => {
    try {
      const rawId = String(req.params.accountId || '').trim();
      if (!rawId) {
        return sendError(res, 400, 'INVALID_ACCOUNT_ID', 'Account identifier is required.');
      }

      let target = null;
      if (rawId.toLowerCase() === 'me') {
        if (!req.apiKey.userId) {
          return sendError(
            res,
            400,
            'NO_BOUND_ACCOUNT',
            'The "me" alias requires an API key bound to a specific bank client account.'
          );
        }
        target = await User.findById(req.apiKey.userId).select('-password');
      } else if (mongoose.isValidObjectId(rawId)) {
        target = await User.findById(rawId).select('-password');
      } else if (rawId.includes('@')) {
        target = await User.findOne({ email: rawId.toLowerCase() }).select('-password');
      } else {
        target = await User.findOne({ accountNumber: rawId }).select('-password');
      }

      if (!target) {
        return sendError(res, 404, 'ACCOUNT_NOT_FOUND', `Bank account '${rawId}' was not found.`);
      }
      if (target.role === 'admin') {
        return sendError(res, 403, 'FORBIDDEN_ACCOUNT', 'Administrative accounts cannot be accessed via the external API.');
      }

      const scope = req.apiKey.accountScope;
      if (scope === 'single_user') {
        if (!req.apiKey.userId || target._id.toString() !== req.apiKey.userId.toString()) {
          return sendError(
            res,
            403,
            'ACCOUNT_OUT_OF_SCOPE',
            'This API key is restricted to a single assigned account.'
          );
        }
      } else if (scope === 'owned') {
        const createdByThisKey =
          target.createdByApiKey && target.createdByApiKey.toString() === req.apiKey._id.toString();
        const isBoundUser =
          req.apiKey.userId && target._id.toString() === req.apiKey.userId.toString();
        if (!createdByThisKey && !isBoundUser) {
          return sendError(
            res,
            403,
            'ACCOUNT_OUT_OF_SCOPE',
            'This API key can only access accounts created by or assigned to it.'
          );
        }
      }

      if (requireActive && target.status === 'suspended') {
        return sendError(res, 403, 'ACCOUNT_SUSPENDED', 'This bank account is currently suspended.');
      }

      req.targetUser = target;
      res.locals.targetUserId = target._id;
      next();
    } catch (err) {
      next(err);
    }
  };
}

async function handleIdempotency(req, res, next) {
  const rawKey = req.headers['idempotency-key'];
  if (rawKey === undefined) return next();

  const idempotencyKey = String(rawKey).trim();
  if (!idempotencyKey || idempotencyKey.length > 128) {
    return sendError(
      res,
      400,
      'INVALID_IDEMPOTENCY_KEY',
      'Idempotency-Key header must be a non-empty string up to 128 characters.'
    );
  }

  const reqPath = req.originalUrl.split('?')[0];

  try {
    const existing = await ApiIdempotency.findOne({
      apiKeyId: req.apiKey._id,
      idempotencyKey,
    }).lean();

    if (existing) {
      if (existing.method !== req.method || existing.path !== reqPath) {
        return sendError(
          res,
          409,
          'IDEMPOTENCY_KEY_REUSED',
          'Idempotency-Key was already used for a different request endpoint or method.'
        );
      }
      res.setHeader('X-Idempotency-Replayed', 'true');
      return res.status(existing.statusCode).json(existing.responseBody);
    }

    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        ApiIdempotency.create({
          apiKeyId: req.apiKey._id,
          idempotencyKey,
          method: req.method,
          path: reqPath,
          statusCode: res.statusCode,
          responseBody: body,
        }).catch(() => {});
      }
      return originalJson(body);
    };

    next();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  apiCors,
  attachRequestMeta,
  authenticateApiKey,
  requirePermission,
  resolveTargetAccount,
  handleIdempotency,
  sendSuccess,
  sendError,
  extractClientIp,
};
