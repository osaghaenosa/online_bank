const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title:     { type: String, required: true },
  message:   { type: String, required: true },
  type:      { type: String, enum: ['transaction', 'security', 'system', 'promotion', 'alert'], default: 'system' },
  read:      { type: Boolean, default: false },
  priority:  { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  link:      { type: String },
  metadata:  { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

notificationSchema.index({ userId: 1, read: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
