const express  = require('express');
const http     = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors     = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes        = require('./routes/auth');
const userRoutes        = require('./routes/users');
const transactionRoutes = require('./routes/transactions');
const adminRoutes       = require('./routes/admin');
const receiptRoutes     = require('./routes/receipts');
const chatRoutes        = require('./routes/chat');

const ChatMessage = require('./models/ChatMessage');
const User        = require('./models/User');
const jwt         = require('jsonwebtoken');

const app    = express();
const server = http.createServer(app);

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (/https:\/\/.*\.vercel\.app$/.test(origin)) return callback(null, true);
    callback(new Error('CORS blocked: ' + origin));
  },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));

// ── Socket.io ──────────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: { origin: allowedOrigins, methods: ['GET','POST'], credentials: true },
  transports: ['websocket','polling'],
});

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token ||
                  (socket.handshake.headers?.authorization || '').replace('Bearer ','');
    if (!token) return next(new Error('No token'));
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id || decoded._id).select('firstName lastName role email');
    if (!user) return next(new Error('User not found'));
    socket.user = user;
    next();
  } catch(e) { next(new Error('Invalid token')); }
});

const onlineUsers = new Map();

io.on('connection', (socket) => {
  const uid  = socket.user._id.toString();
  const role = socket.user.role;
  const name = socket.user.firstName + ' ' + socket.user.lastName;

  if (!onlineUsers.has(uid)) onlineUsers.set(uid, new Set());
  onlineUsers.get(uid).add(socket.id);

  socket.join(uid);
  socket.join('admin_room');

  io.emit('user_online', { userId: uid, online: true });

  socket.on('user_message', async ({ message }) => {
    if (!message?.trim() || role !== 'user') return;
    try {
      const msg = await ChatMessage.create({
        roomId: uid, senderId: socket.user._id,
        senderRole: 'user', senderName: name, message: message.trim(),
      });
      io.to(uid).emit('new_message', msg);
      io.to('admin_room').emit('new_message', msg);
    } catch(e) { console.error('Chat error:', e.message); }
  });

  socket.on('admin_message', async ({ toUserId, message }) => {
    if (!message?.trim() || role !== 'admin') return;
    try {
      const msg = await ChatMessage.create({
        roomId: toUserId, senderId: socket.user._id,
        senderRole: 'admin', senderName: name, message: message.trim(),
      });
      io.to(toUserId).emit('new_message', msg);
      io.to('admin_room').emit('new_message', msg);
    } catch(e) { console.error('Chat error:', e.message); }
  });

  socket.on('typing', ({ toUserId, isTyping }) => {
    if (role === 'admin' && toUserId) {
      io.to(toUserId).emit('typing', { fromAdmin: true, isTyping });
    } else if (role === 'user') {
      io.to('admin_room').emit('typing', { fromUserId: uid, fromName: name, isTyping });
    }
  });

  socket.on('disconnect', () => {
    const s = onlineUsers.get(uid);
    if (s) { s.delete(socket.id); if (!s.size) { onlineUsers.delete(uid); io.emit('user_online', { userId: uid, online: false }); } }
  });
});

app.set('io', io);

const limiter = rateLimit({ windowMs: 15*60*1000, max: 100, message: { error: 'Too many requests' } });
app.use('/api/', limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static('uploads'));

app.use('/api/auth',         authRoutes);
app.use('/api/users',        userRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/admin',        adminRoutes);
app.use('/api/receipts',     receiptRoutes);
app.use('/api/chat',         chatRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => console.log('NexaBank API + Socket.io on port ' + PORT));
  })
  .catch(err => { console.error('MongoDB error:', err); process.exit(1); });

module.exports = { app, server, io };
