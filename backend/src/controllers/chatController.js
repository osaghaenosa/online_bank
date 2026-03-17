const ChatMessage = require('../models/ChatMessage');
const User = require('../models/User');

// GET /api/chat/history  — user gets their own room history
exports.getUserHistory = async (req, res, next) => {
  try {
    const roomId = req.user._id.toString();
    const messages = await ChatMessage.find({ roomId })
      .sort({ createdAt: 1 })
      .limit(100);

    // Mark admin messages as read
    await ChatMessage.updateMany(
      { roomId, senderRole: 'admin', read: false },
      { $set: { read: true, readAt: new Date() } }
    );

    res.json({ messages });
  } catch (err) { next(err); }
};

// GET /api/chat/admin/rooms  — admin sees all rooms with last message + unread count
exports.getAdminRooms = async (req, res, next) => {
  try {
    const users = await User.find({ role: 'user' }).select('firstName lastName email _id').lean();

    const rooms = await Promise.all(users.map(async (u) => {
      const roomId = u._id.toString();
      const lastMsg = await ChatMessage.findOne({ roomId }).sort({ createdAt: -1 });
      const unread  = await ChatMessage.countDocuments({ roomId, senderRole: 'user', read: false });
      return { user: u, lastMessage: lastMsg, unreadCount: unread };
    }));

    // Sort by last message time, rooms with messages first
    rooms.sort((a, b) => {
      if (!a.lastMessage && !b.lastMessage) return 0;
      if (!a.lastMessage) return 1;
      if (!b.lastMessage) return -1;
      return new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime();
    });

    res.json({ rooms });
  } catch (err) { next(err); }
};

// GET /api/chat/admin/room/:userId  — admin gets a specific user's chat history
exports.getAdminRoomHistory = async (req, res, next) => {
  try {
    const roomId = req.params.userId;
    const messages = await ChatMessage.find({ roomId })
      .sort({ createdAt: 1 })
      .limit(100);

    // Mark user messages as read
    await ChatMessage.updateMany(
      { roomId, senderRole: 'user', read: false },
      { $set: { read: true, readAt: new Date() } }
    );

    const user = await User.findById(roomId).select('firstName lastName email');
    res.json({ messages, user });
  } catch (err) { next(err); }
};
