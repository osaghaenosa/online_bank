const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/emailController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect, adminOnly);

router.post('/send',   ctrl.sendAdminEmail);
router.get('/verify',  ctrl.verifySmtp);

module.exports = router;
