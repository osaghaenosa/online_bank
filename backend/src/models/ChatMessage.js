const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  roomId:    { type: String, required: true, index: true }, // userId of the user (room = user<>admin)
  senderId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderRole:{ type: String, enum: ['user','admin'], required: true },
  senderName:{ type: String, required: true },
  message:   { type: String, required: true, trim: true, maxlength: 2000 },
  read:      { type: Boolean, default: false },
  readAt:    { type: Date },
}, { timestamps: true });

chatMessageSchema.index({ roomId: 1, createdAt: -1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
