const User = require('../models/User');
const {
  sendEmail,
  sendBulkEmail,
  listReceivedEmails,
  getReceivedEmail,
  getReceivedAttachment,
  listSentEmails,
  getSentEmail,
} = require('../utils/email');

// ── Send email (supports file & image attachments via Resend API) ─────────────
exports.sendAdminEmail = async (req, res, next) => {
  try {
    const {
      target,
      customEmail,
      subject,
      type,
      bodyHTML,
      bodyText,
      amount,
      accountNumber,
      attachments,
      embedImages,
      replyTo,
    } = req.body;

    const hasAttachments = Array.isArray(attachments) && attachments.length > 0;
    if (!subject?.trim()) return res.status(400).json({ error: 'Subject is required' });
    if (!bodyHTML?.trim() && !hasAttachments) {
      return res.status(400).json({ error: 'Email body or at least one attachment is required' });
    }

    // ── Resolve recipients ────────────────────────────────────────────────────
    let recipients = [];
    if (target === 'all') {
      const users = await User.find({ role: 'user' }).select('firstName email');
      recipients  = users.map(u => ({ email: u.email, name: u.firstName }));
    } else if (target === 'custom' || (!target && customEmail)) {
      const email = (customEmail || '').trim();
      if (!email || !email.includes('@')) {
        return res.status(400).json({ error: 'Enter a valid email address' });
      }
      recipients = [{ email, name: '' }];
    } else {
      const user = await User.findById(target).select('firstName email');
      if (!user) return res.status(404).json({ error: 'User not found' });
      recipients = [{ email: user.email, name: user.firstName }];
    }
    if (!recipients.length) return res.status(400).json({ error: 'No recipients found' });

    const rawBody = bodyHTML || '';
    const safeHTML = rawBody
      .split('\n\n').map(p => p.trim()).filter(Boolean)
      .map(p => `<p style="margin-bottom:16px;">${p.replace(/\n/g, '<br/>')}</p>`)
      .join('');

    const opts = {
      subject:       subject.trim(),
      type:          type || 'custom',
      bodyHTML:      safeHTML,
      bodyText:      bodyText || rawBody.replace(/<[^>]+>/g, ''),
      amount,
      accountNumber,
      attachments:   hasAttachments ? attachments : [],
      embedImages:   embedImages !== false,
      replyTo,
    };

    let results;
    if (recipients.length === 1) {
      const r = await sendEmail({ ...opts, to: recipients[0].email, recipientName: recipients[0].name });
      results = [{ email: recipients[0].email, success: true, messageId: r.messageId }];
    } else {
      results = await sendBulkEmail(recipients, opts);
    }

    const sent   = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    res.json({ sent, failed, total: recipients.length, results });

  } catch (err) {
    const msg = err.message || '';
    if (msg.includes('RESEND_API_KEY') || err.status) {
      return res.status(err.status || 500).json({ error: msg });
    }
    next(err);
  }
};

// ── Receive emails directly from Resend Receiving API (No Webhooks Required) ──
exports.getReceivedEmails = async (req, res) => {
  try {
    const { limit = 50, after, before } = req.query;
    const result = await listReceivedEmails({ limit, after, before });
    res.json({
      emails: Array.isArray(result.data) ? result.data : [],
      hasMore: !!result.has_more,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      error: err.message || 'Failed to fetch received emails from Resend API',
    });
  }
};

// ── Get single received email with full HTML/text body & attachments ──────────
exports.getReceivedEmailDetail = async (req, res) => {
  try {
    const email = await getReceivedEmail(req.params.id);
    res.json({ email });
  } catch (err) {
    res.status(err.status || 500).json({
      error: err.message || 'Failed to retrieve email details from Resend API',
    });
  }
};

// ── Get attachment metadata & download URL for a received email ───────────────
exports.getReceivedAttachment = async (req, res) => {
  try {
    const attachment = await getReceivedAttachment(req.params.emailId, req.params.attachmentId);
    res.json({ attachment });
  } catch (err) {
    res.status(err.status || 500).json({
      error: err.message || 'Failed to retrieve attachment from Resend API',
    });
  }
};

// ── List sent emails from Resend API ──────────────────────────────────────────
exports.getSentEmails = async (req, res) => {
  try {
    const { limit = 50, after, before } = req.query;
    const result = await listSentEmails({ limit, after, before });
    res.json({
      emails: Array.isArray(result.data) ? result.data : [],
      hasMore: !!result.has_more,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      error: err.message || 'Failed to fetch sent emails from Resend API',
    });
  }
};

// ── Get single sent email detail from Resend API ──────────────────────────────
exports.getSentEmailDetail = async (req, res) => {
  try {
    const email = await getSentEmail(req.params.id);
    res.json({ email });
  } catch (err) {
    res.status(err.status || 500).json({
      error: err.message || 'Failed to retrieve sent email details from Resend API',
    });
  }
};

// ── Verify Resend connection ──────────────────────────────────────────────────
exports.verifySmtp = async (req, res) => {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return res.json({
      connected: false,
      error: 'RESEND_API_KEY is not set in your environment variables. Get your key at https://resend.com/api-keys',
    });
  }

  try {
    const response = await fetch('https://api.resend.com/domains', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const from = process.env.SMTP_FROM_EMAIL || 'support@theblueridges.com';
      return res.json({ connected: true, provider: 'Resend', from });
    }

    const body = await response.json().catch(() => ({}));
    return res.json({
      connected: false,
      error: `Resend API error ${response.status}: ${body.message || body.name || 'Invalid API key'}`,
    });

  } catch (err) {
    res.json({ connected: false, error: `Network error: ${err.message}` });
  }
};