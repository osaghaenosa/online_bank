const mongoose = require('mongoose');

const apiRequestLogSchema = new mongoose.Schema({
  apiKeyId: { type: mongoose.Schema.Types.ObjectId, ref: 'ApiKey', required: true, index: true },
  keyPrefix: { type: String, default: '' },
  method: { type: String, required: true },
  path: { type: String, required: true },
  statusCode: { type: Number, required: true },
  responseTimeMs: { type: Number, default: 0 },
  ip: { type: String, default: '' },
  targetUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  errorCode: { type: String, default: null },
  createdAt: { type: Date, default: Date.now, expires: 2592000 }, // 30-day TTL
});

apiRequestLogSchema.index({ apiKeyId: 1, createdAt: -1 });

module.exports = mongoose.model('ApiRequestLog', apiRequestLogSchema);
