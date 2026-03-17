const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect, adminOnly);

router.get('/dashboard', ctrl.getDashboard);
router.get('/users', ctrl.getUsers);
router.get('/users/:id', ctrl.getUserDetail);
router.patch('/users/:id/toggle-status', ctrl.toggleUserStatus);
router.post('/balance-adjust', ctrl.adjustBalance);
router.get('/transactions', ctrl.getAllTransactions);
router.patch('/transactions/:id/status', ctrl.updateTransactionStatus);
router.post('/notifications/send', ctrl.sendNotification);

module.exports = router;
