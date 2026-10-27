const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/emailController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect, adminOnly);

// Outbound sending (supports file & image attachments)
router.post('/send',                                      ctrl.sendAdminEmail);

// Inbound receiving via Resend API (no webhooks required)
router.get('/inbox',                                      ctrl.getReceivedEmails);
router.get('/inbox/:id',                                  ctrl.getReceivedEmailDetail);
router.get('/inbox/:emailId/attachments/:attachmentId',   ctrl.getReceivedAttachment);

// Outbound sent history via Resend API
router.get('/sent',                                       ctrl.getSentEmails);
router.get('/sent/:id',                                   ctrl.getSentEmailDetail);

// Verify Resend API key & domain status
router.get('/verify',                                     ctrl.verifySmtp);

module.exports = router;
