const User = require('../models/User');
const { sendEmail, sendBulkEmail } = require('../utils/email');

// ── Send email ────────────────────────────────────────────────────────────────
exports.sendAdminEmail = async (req, res, next) => {
  try {
    const { target, customEmail, subject, type, bodyHTML, bodyText, amount, accountNumber } = req.body;

    if (!subject?.trim())  return res.status(400).json({ error: 'Subject is required' });
    if (!bodyHTML?.trim()) return res.status(400).json({ error: 'Email body is required' });

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

    // Convert plain text body → HTML paragraphs
    const safeHTML = bodyHTML
      .split('\n\n').map(p => p.trim()).filter(Boolean)
      .map(p => `<p style="margin-bottom:16px;">${p.replace(/\n/g, '<br/>')}</p>`)
      .join('');

    const opts = {
      subject:  subject.trim(),
      type:     type || 'custom',
      bodyHTML: safeHTML,
      bodyText: bodyText || bodyHTML.replace(/<[^>]+>/g, ''),
      amount,
      accountNumber,
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
    if (msg.includes('RESEND_API_KEY')) {
      return res.status(500).json({ error: msg });
    }
    next(err);
  }
};

// ── Verify Resend connection ──────────────────────────────────────────────────
// Uses Resend's REST API directly — no SMTP, no ports, works on Render free tier
exports.verifySmtp = async (req, res) => {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return res.json({
      connected: false,
      error: 'RESEND_API_KEY is not set in your environment variables. Get your key at https://resend.com/api-keys',
    });
  }

  try {
    // Ping Resend API — list domains endpoint, lightweight auth check
    const response = await fetch('https://api.resend.com/domains', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const from = process.env.SMTP_FROM_EMAIL || 'onboarding@resend.dev';
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