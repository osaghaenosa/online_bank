const express  = require('express');
const router   = express.Router();
const ctrl     = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');
const upload   = require('../middleware/upload');

router.use(protect, adminOnly);

// Users
router.get('/users',                              ctrl.getUsers);
router.get('/users/:id',                          ctrl.getUserDetail);
router.patch('/users/:id/toggle-status',          ctrl.toggleUserStatus);
router.patch('/users/:id/name',                   ctrl.editUserName);
router.patch('/users/:id/credentials',            ctrl.editUserCredentials);
router.patch('/users/:id/transfer-access',        ctrl.setTransferAccess);
router.patch('/users/:id/withdrawal-access',      ctrl.setWithdrawalAccess);
router.patch('/users/:id/fulfill-requirement',    ctrl.fulfillRequirement);
router.post('/users/:id/photo',                   upload.single('photo'), ctrl.uploadUserPhoto);
router.delete('/users/:id/photo',                 ctrl.deleteUserPhoto);
router.get('/users/:userId/transactions',         ctrl.getUserTransactions);

// Dashboard
router.get('/dashboard',                          ctrl.getDashboard);

// Balance
router.post('/balance-adjust',                    ctrl.adjustBalance);

// Transactions
router.get('/transactions',                       ctrl.getAllTransactions);
router.patch('/transactions/:id/status',          ctrl.updateTransactionStatus);
router.patch('/transactions/:id/edit',            ctrl.editTransaction);
router.delete('/transactions/:id',               ctrl.deleteTransaction);

// Notifications
router.post('/notifications/send',                ctrl.sendNotification);

// Payment method settings
router.get('/deposit-settings',                   ctrl.getDepositSettings);
router.post('/deposit-settings',                  ctrl.saveDepositSettings);
router.get('/withdrawal-settings',                ctrl.getWithdrawalSettings);
router.post('/withdrawal-settings',               ctrl.saveWithdrawalSettings);

// Generic image upload (QR codes, payment method logos, etc.)
router.post('/upload-image', upload.single('image'), ctrl.uploadImage);

module.exports = router;
