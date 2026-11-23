const mongoose = require('mongoose');

const apiIdempotencySchema = new mongoose.Schema({
  apiKeyId: { type: mongoose.Schema.Types.ObjectId, ref: 'ApiKey', required: true },
  idempotencyKey: { type: String, required: true },
  method: { type: String, required: true },
  path: { type: String, required: true },
  statusCode: { type: Number, required: true },
  responseBody: { type: mongoose.Schema.Types.Mixed, required: true },
  createdAt: { type: Date, default: Date.now, expires: 86400 }, // 24-hour TTL
});

apiIdempotencySchema.index({ apiKeyId: 1, idempotencyKey: 1 }, { unique: true });

module.exports = mongoose.model('ApiIdempotency', apiIdempotencySchema);
