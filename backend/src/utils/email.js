// ── Resend SDK — no SMTP, works on Render free tier ──────────────────────────
const { Resend } = require('resend');

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error(
      'RESEND_API_KEY is not set. Add it to your .env file.\n' +
      'Get your key at https://resend.com/api-keys'
    );
  }
  return new Resend(apiKey);
}

// ── Branded HTML template ─────────────────────────────────────────────────────
function buildEmailHTML({ type, subject, recipientName, bodyHTML, amount, accountNumber }) {
  const accent = '#10B981';
  const navy   = '#0F1C35';

  const TYPE_MAP = {
    credit:      { color: '#10B981', bg: '#ECFDF5', label: 'Credit Alert'  },
    debit:       { color: '#EF4444', bg: '#FEF2F2', label: 'Debit Alert'   },
    security:    { color: '#F59E0B', bg: '#FFFBEB', label: 'Security Alert' },
    newsletter:  { color: '#3B82F6', bg: '#EFF6FF', label: 'Newsletter'    },
    article:     { color: '#8B5CF6', bg: '#F5F3FF', label: 'Article'       },
    promotion:   { color: '#EC4899', bg: '#FDF2F8', label: 'Special Offer' },
    system:      { color: '#6B7280', bg: '#F9FAFB', label: 'System Notice' },
    information: { color: '#0EA5E9', bg: '#F0F9FF', label: 'Information'   },
    custom:      { color: '#10B981', bg: '#F9FAFB', label: subject || 'Message' },
  };

  const t           = TYPE_MAP[type] || TYPE_MAP.custom;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const year        = new Date().getFullYear();

  const amtBox = (type === 'credit' || type === 'debit') && amount ? `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="background:${t.bg};border:1.5px solid ${t.color}33;border-radius:12px;padding:20px 24px;text-align:center;">
          <p style="font-size:12px;color:${t.color};font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px 0;">
            ${type === 'credit' ? 'Amount Credited' : 'Amount Debited'}
          </p>
          <p style="font-size:36px;font-weight:800;color:${t.color};font-family:monospace;margin:0 0 6px 0;">
            ${type === 'credit' ? '+' : '-'}$${parseFloat(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          </p>
          ${accountNumber ? `<p style="font-size:12px;color:#6B7280;margin:0;">Account ••••${String(accountNumber).slice(-4)}</p>` : ''}
        </td>
      </tr>
    </table>` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#F0F2F7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td align="center" style="padding:32px 16px;">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

  <tr>
    <td style="background:${navy};border-radius:16px 16px 0 0;padding:28px 36px;">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td>
          <span style="color:#fff;font-size:22px;font-weight:800;"><span style="color:${accent}">N</span>exaBank</span><br/>
          <span style="color:rgba(255,255,255,0.4);font-size:11px;">Personal Banking</span>
        </td>
        <td align="right">
          <span style="background:${t.bg};color:${t.color};padding:6px 14px;border-radius:999px;font-size:11px;font-weight:700;">
            ${t.label}
          </span>
        </td>
      </tr></table>
    </td>
  </tr>

  <tr><td style="background:${t.color};height:4px;line-height:4px;font-size:4px;">&nbsp;</td></tr>

  <tr>
    <td style="background:#ffffff;padding:36px 36px 28px;">
      ${recipientName ? `<p style="font-size:16px;font-weight:600;color:${navy};margin:0 0 20px 0;">Hello, ${recipientName} \u{1F44B}</p>` : ''}
      ${amtBox}
      <div style="font-size:15px;line-height:1.7;color:#374151;">${bodyHTML}</div>
    </td>
  </tr>

  <tr><td style="background:#fff;padding:0 36px;"><hr style="border:none;border-top:1px solid #E5E7EB;margin:0;"/></td></tr>

  <tr>
    <td style="background:#ffffff;padding:24px 36px;text-align:center;">
      <a href="${frontendUrl}/dashboard"
        style="display:inline-block;background:${navy};color:#ffffff;text-decoration:none;padding:13px 32px;border-radius:10px;font-size:14px;font-weight:700;">
        Go to My Account &rarr;
      </a>
    </td>
  </tr>

  <tr>
    <td style="background:#F9FAFB;border-radius:0 0 16px 16px;padding:24px 36px;text-align:center;border-top:1px solid #E5E7EB;">
      <p style="font-size:12px;color:#9CA3AF;line-height:1.6;margin:0 0 8px 0;">
        Sent by <strong style="color:${navy};">NexaBank</strong> &bull;
        <a href="mailto:support@nexabank.com" style="color:${accent};">support@nexabank.com</a>
      </p>
      <p style="font-size:11px;color:#D1D5DB;margin:0;">&copy; ${year} NexaBank. All rights reserved.</p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

function buildPlainText({ recipientName, subject, bodyText, amount, type }) {
  let out = `NexaBank — ${subject}\n${'─'.repeat(50)}\n\n`;
  if (recipientName) out += `Hello ${recipientName},\n\n`;
  if ((type === 'credit' || type === 'debit') && amount) {
    out += `Amount ${type === 'credit' ? 'Credited' : 'Debited'}: $${parseFloat(amount).toFixed(2)}\n\n`;
  }
  out += (bodyText || '') + '\n\n─────────────────────────────────\nNexaBank — support@nexabank.com\n';
  return out;
}

// ── Send a single email via Resend HTTP API ───────────────────────────────────
async function sendEmail(opts) {
  const resend    = getResend();
  const fromName  = process.env.SMTP_FROM_NAME  || 'NexaBank';
  const fromEmail = process.env.SMTP_FROM_EMAIL || 'onboarding@resend.dev'; // resend test address

  const { data, error } = await resend.emails.send({
    from:    `${fromName} <${fromEmail}>`,
    to:      [opts.to],
    subject: opts.subject,
    html:    buildEmailHTML(opts),
    text:    opts.bodyText || buildPlainText(opts),
  });

  if (error) {
    throw new Error(`Resend error: ${error.message || JSON.stringify(error)}`);
  }

  return { messageId: data.id, accepted: [opts.to] };
}

// ── Bulk send ─────────────────────────────────────────────────────────────────
async function sendBulkEmail(recipients, opts) {
  const results = [];
  for (const { email, name } of recipients) {
    try {
      const r = await sendEmail({ ...opts, to: email, recipientName: name });
      results.push({ email, success: true, messageId: r.messageId });
    } catch (e) {
      results.push({ email, success: false, error: e.message });
    }
    // Small delay to stay within Resend's rate limit (2 req/sec on free plan)
    await new Promise(r => setTimeout(r, 600));
  }
  return results;
}

module.exports = { sendEmail, sendBulkEmail };