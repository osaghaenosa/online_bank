const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/chatController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect);

// User routes
router.get('/history', ctrl.getUserHistory);

// Admin routes
router.get('/admin/rooms',           adminOnly, ctrl.getAdminRooms);
router.get('/admin/room/:userId',    adminOnly, ctrl.getAdminRoomHistory);

module.exports = router;
