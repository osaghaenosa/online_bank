const User = require('../models/User');
const { sendEmail, sendBulkEmail } = require('../utils/email');

// ── Send email ────────────────────────────────────────────────────────────────
exports.sendAdminEmail = async (req, res, next) => {
  try {
    const { target, customEmail, subject, type, bodyHTML, bodyText, amount, accountNumber } = req.body;

    if (!subject?.trim())  return res.status(400).json({ error: 'Subject is required' });
    if (!bodyHTML?.trim()) return res.status(400).json({ error: 'Email body is required' });

    let recipients = [];
    if (target === 'all') {
      const users = await User.find({ role: 'user' }).select('firstName email');
      recipients  = users.map(u => ({ email: u.email, name: u.firstName }));
    } else if (target === 'custom' || (!target && customEmail)) {
      const email = (customEmail || '').trim();
      if (!email || !email.includes('@')) return res.status(400).json({ error: 'Enter a valid email address' });
      recipients = [{ email, name: '' }];
    } else {
      const user = await User.findById(target).select('firstName email');
      if (!user) return res.status(404).json({ error: 'User not found' });
      recipients = [{ email: user.email, name: user.firstName }];
    }
    if (!recipients.length) return res.status(400).json({ error: 'No recipients found' });

    // Convert plain text → HTML paragraphs
    const safeHTML = bodyHTML
      .split('\n\n').map(p => p.trim()).filter(Boolean)
      .map(p => `<p style="margin-bottom:16px;">${p.replace(/\n/g, '<br/>')}</p>`)
      .join('');

    const opts = {
      subject: subject.trim(), type: type || 'custom',
      bodyHTML: safeHTML,
      bodyText: bodyText || bodyHTML.replace(/<[^>]+>/g, ''),
      amount, accountNumber,
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
    if (msg.includes('Email not configured') || msg.includes('SMTP not configured')) {
      return res.status(500).json({ error: msg });
    }
    next(err);
  }
};

// ── Verify email connection ───────────────────────────────────────────────────
exports.verifySmtp = async (req, res) => {
  try {
    const nodemailer = require('nodemailer');
    const apiKey  = process.env.RESEND_API_KEY;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    let provider = 'unknown';
    let transporter;

    if (apiKey) {
      provider = 'Resend';
      transporter = nodemailer.createTransport({
        host: 'smtp.resend.com', port: 465, secure: true,
        auth: { user: 'resend', pass: apiKey },
      });
    } else if (smtpUser && smtpPass) {
      provider = 'SMTP';
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user: smtpUser, pass: smtpPass },
        tls: { rejectUnauthorized: false },
      });
    } else {
      return res.json({
        connected: false,
        error: 'No email credentials found. Add RESEND_API_KEY (recommended) or SMTP_USER + SMTP_PASS to .env',
      });
    }

    await transporter.verify();
    res.json({ connected: true, provider, from: process.env.SMTP_FROM_EMAIL || smtpUser });
  } catch (err) {
    res.json({ connected: false, error: err.message });
  }
};
