const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/publicApiController');
const {
  attachRequestMeta,
  authenticateApiKey,
  requirePermission,
  resolveTargetAccount,
  handleIdempotency,
  sendError,
} = require('../middleware/apiKeyAuth');

router.use(attachRequestMeta);

// Public unauthenticated endpoints
router.get('/health', ctrl.health);
router.get('/openapi.json', ctrl.getOpenApiSpec);

// Authenticated endpoints
router.use(authenticateApiKey);

// Key introspection
router.get('/key', ctrl.getKeyInfo);

// Bank configuration
router.get('/bank/settings', requirePermission('bank:read'), ctrl.getBankSettings);
router.get('/bank/deposit-methods', requirePermission('bank:read'), ctrl.getDepositMethods);
router.get('/bank/withdrawal-methods', requirePermission('bank:read'), ctrl.getWithdrawalMethods);

// Accounts & onboarding
router.post('/accounts', requirePermission('accounts:create'), handleIdempotency, ctrl.createAccount);
router.post('/accounts/authenticate', requirePermission('accounts:read'), ctrl.authenticateAccount);
router.get('/accounts', requirePermission('accounts:read'), ctrl.listAccounts);

router.get('/accounts/:accountId', requirePermission('accounts:read'), resolveTargetAccount(), ctrl.getAccount);
router.patch('/accounts/:accountId', requirePermission('accounts:write'), resolveTargetAccount({ requireActive: true }), ctrl.updateAccount);
router.patch('/accounts/:accountId/password', requirePermission('accounts:write'), resolveTargetAccount({ requireActive: true }), ctrl.changeAccountPassword);
router.post('/accounts/:accountId/pin', requirePermission('accounts:write'), resolveTargetAccount({ requireActive: true }), ctrl.setAccountPin);
router.post('/accounts/:accountId/kyc', requirePermission('accounts:write'), resolveTargetAccount({ requireActive: true }), ctrl.submitAccountKyc);

// Balances, dashboard & restrictions
router.get('/accounts/:accountId/balance', requirePermission('accounts:read'), resolveTargetAccount(), ctrl.getBalance);
router.get('/accounts/:accountId/dashboard', requirePermission('accounts:read'), resolveTargetAccount(), ctrl.getDashboard);
router.get('/accounts/:accountId/restrictions', requirePermission('accounts:read'), resolveTargetAccount(), ctrl.getRestrictions);

// Money movement
router.post('/accounts/:accountId/deposit', requirePermission('transactions:deposit'), resolveTargetAccount({ requireActive: true }), handleIdempotency, ctrl.deposit);
router.post('/accounts/:accountId/deposits', requirePermission('transactions:deposit'), resolveTargetAccount({ requireActive: true }), handleIdempotency, ctrl.deposit);
router.post('/accounts/:accountId/withdraw', requirePermission('transactions:withdraw'), resolveTargetAccount({ requireActive: true }), handleIdempotency, ctrl.withdraw);
router.post('/accounts/:accountId/withdrawals', requirePermission('transactions:withdraw'), resolveTargetAccount({ requireActive: true }), handleIdempotency, ctrl.withdraw);
router.post('/accounts/:accountId/transfer', requirePermission('transactions:transfer'), resolveTargetAccount({ requireActive: true }), handleIdempotency, ctrl.transfer);
router.post('/accounts/:accountId/transfers', requirePermission('transactions:transfer'), resolveTargetAccount({ requireActive: true }), handleIdempotency, ctrl.transfer);
router.post('/accounts/:accountId/bill-pay', requirePermission('transactions:bill_pay'), resolveTargetAccount({ requireActive: true }), handleIdempotency, ctrl.payBill);

// Convenience root aliases (resolve bound account "me" or body/query accountId)
router.get('/balance', requirePermission('accounts:read'), resolveTargetAccount(), ctrl.getBalance);
router.get('/transactions', requirePermission('transactions:read'), resolveTargetAccount(), ctrl.listTransactions);
router.post('/deposit', requirePermission('transactions:deposit'), resolveTargetAccount({ requireActive: true }), handleIdempotency, ctrl.deposit);
router.post('/deposits', requirePermission('transactions:deposit'), resolveTargetAccount({ requireActive: true }), handleIdempotency, ctrl.deposit);
router.post('/withdraw', requirePermission('transactions:withdraw'), resolveTargetAccount({ requireActive: true }), handleIdempotency, ctrl.withdraw);
router.post('/withdrawals', requirePermission('transactions:withdraw'), resolveTargetAccount({ requireActive: true }), handleIdempotency, ctrl.withdraw);
router.post('/transfer', requirePermission('transactions:transfer'), resolveTargetAccount({ requireActive: true }), handleIdempotency, ctrl.transfer);
router.post('/transfers', requirePermission('transactions:transfer'), resolveTargetAccount({ requireActive: true }), handleIdempotency, ctrl.transfer);
router.post('/bill-pay', requirePermission('transactions:bill_pay'), resolveTargetAccount({ requireActive: true }), handleIdempotency, ctrl.payBill);

// Transactions & receipts
router.get('/accounts/:accountId/transactions', requirePermission('transactions:read'), resolveTargetAccount(), ctrl.listTransactions);
router.get('/accounts/:accountId/transactions/:transactionId', requirePermission('transactions:read'), resolveTargetAccount(), ctrl.getTransaction);
router.get('/accounts/:accountId/receipts/:transactionId', requirePermission('transactions:read'), resolveTargetAccount(), ctrl.getReceipt);
router.get('/accounts/:accountId/receipts/:transactionId/pdf', requirePermission('transactions:read'), resolveTargetAccount(), ctrl.downloadReceiptPdf);

// Debit cards
router.get('/accounts/:accountId/card', requirePermission('cards:read'), resolveTargetAccount(), ctrl.getCard);
router.post('/accounts/:accountId/card/request', requirePermission('cards:write'), resolveTargetAccount({ requireActive: true }), handleIdempotency, ctrl.requestCard);

// Wealth & reserves
router.get('/accounts/:accountId/wealth', requirePermission('wealth:read'), resolveTargetAccount(), ctrl.getWealthOverview);
router.get('/accounts/:accountId/wealth/crypto', requirePermission('wealth:read'), resolveTargetAccount(), ctrl.getWealthSection('crypto'));
router.get('/accounts/:accountId/wealth/treasury', requirePermission('wealth:read'), resolveTargetAccount(), ctrl.getWealthSection('treasury'));
router.get('/accounts/:accountId/wealth/investments', requirePermission('wealth:read'), resolveTargetAccount(), ctrl.getWealthSection('investments'));
router.get('/accounts/:accountId/wealth/trust', requirePermission('wealth:read'), resolveTargetAccount(), ctrl.getWealthSection('trust'));
router.get('/accounts/:accountId/wealth/linked-accounts', requirePermission('wealth:read'), resolveTargetAccount(), ctrl.getWealthSection('linked-accounts'));

// Security tokens
router.get('/accounts/:accountId/tokens', requirePermission('accounts:read'), resolveTargetAccount(), ctrl.getTokens);

// Notifications (static read-all before parameterized routes)
router.get('/accounts/:accountId/notifications', requirePermission('notifications:read'), resolveTargetAccount(), ctrl.listNotifications);
router.patch('/accounts/:accountId/notifications/read-all', requirePermission('notifications:write'), resolveTargetAccount(), ctrl.markAllNotificationsRead);
router.patch('/accounts/:accountId/notifications/:notificationId/read', requirePermission('notifications:write'), resolveTargetAccount(), ctrl.markNotificationRead);
router.delete('/accounts/:accountId/notifications/:notificationId', requirePermission('notifications:write'), resolveTargetAccount(), ctrl.deleteNotification);

// Support chat
router.get('/accounts/:accountId/chat', requirePermission('chat:read'), resolveTargetAccount(), ctrl.getChatHistory);
router.post('/accounts/:accountId/chat', requirePermission('chat:write'), resolveTargetAccount({ requireActive: true }), ctrl.sendChatMessage);

// 404 catch-all for /api/v1
router.use((req, res) => {
  sendError(res, 404, 'ENDPOINT_NOT_FOUND', `Endpoint '${req.method} ${req.originalUrl.split('?')[0]}' does not exist on API v1.`);
});

module.exports = router;
