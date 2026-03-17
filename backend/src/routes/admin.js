const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect, adminOnly);

router.get('/dashboard',                      ctrl.getDashboard);
router.get('/users',                          ctrl.getUsers);
router.get('/users/:id',                      ctrl.getUserDetail);
router.patch('/users/:id/toggle-status',      ctrl.toggleUserStatus);
router.patch('/users/:id/name',               ctrl.editUserName);
router.patch('/users/:id/transfer-access',    ctrl.setTransferAccess);
router.patch('/users/:id/withdrawal-access',  ctrl.setWithdrawalAccess);
router.patch('/users/:id/fulfill-requirement',ctrl.fulfillRequirement);
router.post('/balance-adjust',                ctrl.adjustBalance);
router.get('/transactions',                   ctrl.getAllTransactions);
router.patch('/transactions/:id/status',      ctrl.updateTransactionStatus);
router.post('/notifications/send',            ctrl.sendNotification);

module.exports = router;
