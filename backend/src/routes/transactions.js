const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/transactionController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', ctrl.getTransactions);
router.get('/:id', ctrl.getTransaction);
router.post('/deposit', ctrl.deposit);
router.post('/withdraw', ctrl.withdraw);
router.post('/transfer', ctrl.transfer);
router.post('/bill-pay', ctrl.payBill);

module.exports = router;
