// ── Resend HTTP API & SDK — Sending + Receiving (No Webhooks Required) ────────
const { Resend } = require('resend');

const RESEND_API_BASE = 'https://api.resend.com';

function getApiKey() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      'RESEND_API_KEY is not set. Add it to your .env file.\n' +
      'Get your key at https://resend.com/api-keys'
    );
  }
  return apiKey;
}

function getResend() {
  return new Resend(getApiKey());
}

async function resendRequest(endpoint, options = {}) {
  const apiKey = getApiKey();
  const url = `${RESEND_API_BASE}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const text = await res.text();
  let json = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }

  if (!res.ok) {
    const errMsg = json.message || json.error?.message || json.error || `Resend HTTP ${res.status}`;
    const err = new Error(errMsg);
    err.status = res.status;
    err.details = json;
    throw err;
  }

  return json;
}

// Strip "data:...;base64," prefix if present so Resend gets pure base64
function normalizeBase64(str) {
  if (!str || typeof str !== 'string') return '';
  const idx = str.indexOf('base64,');
  return idx !== -1 ? str.slice(idx + 7).trim() : str.trim();
}

// ── Branded Institutional HTML Template (Solid Blue, Sharp Corners, Zero Gradients) ──
function buildEmailHTML({ type, subject, recipientName, bodyHTML, amount, accountNumber, attachments = [], embedImages = true }) {
  const primaryBlue = '#002B5B';
  const accentBlue  = '#0052CC';
  const darkBlue    = '#001F42';

  const TYPE_MAP = {
    credit:      { color: '#0052CC', bg: '#EBF2FF', border: '#93C5FD', label: 'CREDIT SETTLEMENT ALERT' },
    debit:       { color: '#002B5B', bg: '#F1F5F9', border: '#CBD5E1', label: 'DEBIT SETTLEMENT ALERT' },
    security:    { color: '#B45309', bg: '#FEF3C7', border: '#FCD34D', label: 'SECURITY ADVISORY' },
    newsletter:  { color: '#0052CC', bg: '#EBF2FF', border: '#93C5FD', label: 'INSTITUTIONAL BRIEFING' },
    article:     { color: '#002B5B', bg: '#EBF2FF', border: '#93C5FD', label: 'RESEARCH PUBLICATION' },
    promotion:   { color: '#0052CC', bg: '#EBF2FF', border: '#93C5FD', label: 'CLIENT PRIVILEGE' },
    system:      { color: '#002B5B', bg: '#F1F5F9', border: '#CBD5E1', label: 'SYSTEM NOTICE' },
    information: { color: '#0052CC', bg: '#EBF2FF', border: '#93C5FD', label: 'OFFICIAL NOTICE' },
    custom:      { color: '#0052CC', bg: '#EBF2FF', border: '#93C5FD', label: (subject || 'OFFICIAL DISPATCH').toUpperCase().slice(0, 32) },
  };

  const t           = TYPE_MAP[type] || TYPE_MAP.custom;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const year        = new Date().getFullYear();
  const formattedBody = String(bodyHTML || '')
    .split(/\n\n+/)
    .map(p => `<p style="margin:0 0 16px 0;font-size:14px;line-height:1.7;color:#1E293B;">${p.replace(/\n/g, '<br/>')}</p>`)
    .join('');

  const amtBox = (type === 'credit' || type === 'debit') && amount ? `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px 0;border-collapse:collapse;">
      <tr>
        <td style="background:${t.bg};border:2px solid ${primaryBlue};border-left:6px solid ${accentBlue};border-radius:0px;padding:20px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <p style="font-size:11px;color:${primaryBlue};font-weight:700;text-transform:uppercase;letter-spacing:1.2px;margin:0 0 6px 0;font-family:'Courier New',Courier,monospace;">
                  ${type === 'credit' ? 'CLEARED CREDIT AMOUNT' : 'PROCESSED DEBIT AMOUNT'}
                </p>
                <p style="font-size:32px;font-weight:800;color:${type === 'credit' ? accentBlue : primaryBlue};font-family:'Courier New',Courier,monospace;margin:0;">
                  ${type === 'credit' ? '+' : '-'}$${parseFloat(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} <span style="font-size:14px;font-weight:600;color:#475569;">USD</span>
                </p>
              </td>
              ${accountNumber ? `
              <td align="right" valign="bottom">
                <span style="display:inline-block;background:${primaryBlue};color:#FFFFFF;padding:5px 10px;font-family:'Courier New',Courier,monospace;font-size:11px;font-weight:700;border-radius:0px;">
                  ACCT ••••${String(accountNumber).slice(-4)}
                </span>
              </td>` : ''}
            </tr>
          </table>
        </td>
      </tr>
    </table>` : '';

  // Inline image blocks (using CID references when images are attached and embedImages !== false)
  const imageAttachments = Array.isArray(attachments)
    ? attachments.filter(a => a && a.contentType && a.contentType.startsWith('image/') && a.cid)
    : [];

  const inlineImagesHTML = embedImages && imageAttachments.length > 0 ? `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;border-collapse:collapse;">
      ${imageAttachments.map(img => `
        <tr>
          <td style="padding:0 0 14px 0;">
            <div style="border:2px solid ${primaryBlue};background:#F8FAFC;padding:8px;">
              <img src="cid:${img.cid}" alt="${img.filename || 'Attached Image'}" style="max-width:100%;height:auto;display:block;border:0;" />
              <p style="margin:6px 0 0 0;font-size:10px;font-family:'Courier New',Courier,monospace;color:#475569;text-transform:uppercase;">
                ATTACHED IMAGE: ${img.filename || 'Image'}
              </p>
            </div>
          </td>
        </tr>
      `).join('')}
    </table>
  ` : '';

  // Attachment manifest summary block when files/images are included
  const attachmentsSummaryHTML = Array.isArray(attachments) && attachments.length > 0 ? `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0 8px 0;border-collapse:collapse;">
      <tr>
        <td style="background:#EBF2FF;border:1px solid #93C5FD;border-left:4px solid ${primaryBlue};padding:12px 16px;">
          <p style="margin:0 0 6px 0;font-size:10px;font-family:'Courier New',Courier,monospace;font-weight:700;color:${primaryBlue};text-transform:uppercase;letter-spacing:1px;">
            ENCLOSED OFFICIAL ATTACHMENTS (${attachments.length})
          </p>
          ${attachments.map(att => `
            <p style="margin:3px 0;font-size:12px;font-family:'Courier New',Courier,monospace;color:#1E3A5F;">
              &bull; <strong>${att.filename}</strong> ${att.contentType ? `<span style="color:#64748B;">(${att.contentType})</span>` : ''}
            </p>
          `).join('')}
        </td>
      </tr>
    </table>
  ` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#F2F5F9;font-family:'Segoe UI',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F2F5F9;border-collapse:collapse;">
<tr><td align="center" style="padding:28px 12px;">

<table width="620" cellpadding="0" cellspacing="0" style="max-width:620px;width:100%;background:#FFFFFF;border:2px solid ${primaryBlue};border-radius:0px;border-collapse:collapse;">

  <!-- Top Utility Bar -->
  <tr>
    <td style="background:${darkBlue};padding:10px 28px;border-bottom:1px solid #1E3A5F;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="font-family:'Courier New',Courier,monospace;font-size:10px;color:#93C5FD;letter-spacing:1px;font-weight:700;">
            BLUE RIDGE BANK &bull; OFFICIAL ELECTRONIC DISPATCH
          </td>
          <td align="right" style="font-family:'Courier New',Courier,monospace;font-size:10px;color:#60A5FA;font-weight:700;">
            256-BIT ENCRYPTED
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Main Institutional Header -->
  <tr>
    <td style="background:${primaryBlue};padding:24px 28px;border-bottom:4px solid ${accentBlue};">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td valign="middle">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="width:42px;height:42px;background:#FFFFFF;border:2px solid #60A5FA;text-align:center;vertical-align:middle;padding:0;">
                  <img src="${frontendUrl}/logo.png" alt="BRB" width="38" height="38" style="display:block;width:38px;height:38px;object-fit:contain;border:0;" />
                </td>
                <td style="padding-left:12px;">
                  <span style="color:#FFFFFF;font-size:20px;font-weight:800;letter-spacing:0.6px;text-transform:uppercase;display:block;line-height:1.1;">
                    BLUE RIDGE <span style="color:#60A5FA;">BANK</span>
                  </span>
                  <span style="color:#93C5FD;font-size:10px;font-family:'Courier New',Courier,monospace;letter-spacing:1.2px;text-transform:uppercase;display:block;margin-top:3px;">
                    INSTITUTIONAL &amp; PERSONAL BANKING
                  </span>
                </td>
              </tr>
            </table>
          </td>
          <td align="right" valign="middle">
            <span style="display:inline-block;background:${accentBlue};color:#FFFFFF;border:1px solid #60A5FA;padding:6px 12px;border-radius:0px;font-family:'Courier New',Courier,monospace;font-size:10px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;">
              ${t.label}
            </span>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Message Body -->
  <tr>
    <td style="background:#FFFFFF;padding:32px 28px 24px 28px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;border-bottom:1px solid #E2E8F0;padding-bottom:12px;">
        <tr>
          <td>
            <p style="font-size:11px;font-family:'Courier New',Courier,monospace;text-transform:uppercase;letter-spacing:1px;color:${accentBlue};font-weight:700;margin:0 0 4px 0;">
              SUBJECT: ${subject}
            </p>
            ${recipientName ? `<p style="font-size:16px;font-weight:700;color:${primaryBlue};margin:0;">Dear ${recipientName},</p>` : `<p style="font-size:16px;font-weight:700;color:${primaryBlue};margin:0;">Valued Client,</p>`}
          </td>
        </tr>
      </table>

      ${amtBox}

      <div style="font-size:14px;line-height:1.7;color:#1E293B;">
        ${formattedBody}
      </div>

      ${inlineImagesHTML}
      ${attachmentsSummaryHTML}
    </td>
  </tr>

  <!-- Action Bar -->
  <tr>
    <td style="background:#F8FAFC;padding:22px 28px;border-top:1px solid #CBD5E1;border-bottom:1px solid #CBD5E1;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td valign="middle" style="font-size:12px;color:#475569;">
            Access your real-time ledger and downloadable PDF statements:
          </td>
          <td align="right" valign="middle">
            <a href="${frontendUrl}/dashboard"
              style="display:inline-block;background:${accentBlue};color:#FFFFFF;text-decoration:none;padding:12px 24px;border-radius:0px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;border:1px solid ${primaryBlue};">
              ACCESS BANKING PORTAL &rarr;
            </a>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Security & Compliance Footer -->
  <tr>
    <td style="background:${primaryBlue};padding:22px 28px;color:#BFDBFE;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="font-size:11px;line-height:1.6;color:#BFDBFE;">
            <strong style="color:#FFFFFF;text-transform:uppercase;letter-spacing:0.5px;">Blue ridge Bank</strong> &bull; Chartered Digital Banking Institution<br/>
            Client Support &amp; Wire Desk: <a href="mailto:support@theblueridges.com" style="color:#60A5FA;text-decoration:underline;font-weight:700;">support@theblueridges.com</a>
          </td>
        </tr>
        <tr>
          <td style="padding-top:12px;border-top:1px solid #1E3A5F;margin-top:12px;font-size:10px;font-family:'Courier New',Courier,monospace;color:#93C5FD;">
            SECURITY NOTICE: Blue ridge Bank will never ask for your password or PIN via email. &copy; ${year} Blue ridge Bank. All rights reserved.
          </td>
        </tr>
      </table>
    </td>
  </tr>

</table>

</td></tr>
</table>
</body>
</html>`;
}

function buildPlainText({ recipientName, subject, bodyText, amount, type }) {
  let out = `BLUE RIDGE BANK — ${subject}\n${'═'.repeat(50)}\n\n`;
  if (recipientName) out += `Dear ${recipientName},\n\n`;
  if ((type === 'credit' || type === 'debit') && amount) {
    out += `Amount ${type === 'credit' ? 'Credited' : 'Debited'}: $${parseFloat(amount).toFixed(2)} USD\n\n`;
  }
  out += (bodyText || '') + '\n\n──────────────────────────────────────────────────\nBlue ridge Bank — support@theblueridges.com\n';
  return out;
}

// ── Send a single email via Resend HTTP API (supports file & image attachments) ──
async function sendEmail(opts) {
  const fromName = process.env.EMAIL_FROM_NAME || process.env.SMTP_FROM_NAME || 'Blue ridge Bank';
  const fromEmail = process.env.EMAIL_FROM_EMAIL || process.env.SMTP_FROM_EMAIL || 'support@theblueridges.com';
  const recipients = (Array.isArray(opts.to) ? opts.to : [opts.to])
    .map(email => String(email || '').trim())
    .filter(Boolean);

  if (!recipients.length || recipients.some(email => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
    throw new Error('A valid recipient email address is required');
  }
  if (!opts.subject?.trim()) throw new Error('Email subject is required');

  // Normalize incoming attachments: [{ filename, content (base64), contentType }]
  const rawAttachments = Array.isArray(opts.attachments) ? opts.attachments : [];
  const preparedAttachments = rawAttachments
    .filter(a => a && a.filename && a.content)
    .map((att, idx) => {
      const contentType = att.contentType || att.content_type || 'application/octet-stream';
      const isImage = contentType.startsWith('image/');
      const cid = isImage ? `brb-img-${idx + 1}-${Date.now()}` : undefined;
      return {
        filename: String(att.filename),
        content: normalizeBase64(att.content),
        contentType,
        cid,
      };
    });

  const resendAttachments = preparedAttachments.map(att => {
    const item = {
      filename: att.filename,
      content: att.content,
    };
    if (att.contentType) item.content_type = att.contentType;
    if (att.cid && opts.embedImages !== false) item.content_id = att.cid;
    return item;
  });

  const payload = {
    from: `${fromName} <${fromEmail}>`,
    to: recipients,
    subject: opts.subject,
    html: buildEmailHTML({ ...opts, attachments: preparedAttachments }),
    text: opts.bodyText || buildPlainText(opts),
  };

  if (opts.replyTo) {
    payload.reply_to = opts.replyTo;
  }

  if (resendAttachments.length > 0) {
    payload.attachments = resendAttachments;
  }

  const data = await resendRequest('/emails', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return { messageId: data.id, accepted: payload.to };
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
    await new Promise(r => setTimeout(r, 600));
  }
  return results;
}

// ── Resend Receiving API (No Webhook Required) ───────────────────────────────
// Lists inbound emails received by your Resend domain
async function listReceivedEmails({ limit = 50, after, before } = {}) {
  const params = new URLSearchParams();
  if (limit) params.set('limit', String(Math.min(Math.max(Number(limit) || 50, 1), 100)));
  if (after) params.set('after', String(after));
  if (before) params.set('before', String(before));
  const qs = params.toString() ? `?${params.toString()}` : '';
  return await resendRequest(`/emails/receiving${qs}`, { method: 'GET' });
}

// Retrieves a single received email (HTML, plain text, headers, and attachment download URLs)
async function getReceivedEmail(emailId) {
  if (!emailId) throw new Error('Email ID is required');
  const email = await resendRequest(`/emails/receiving/${encodeURIComponent(emailId)}`, { method: 'GET' });

  // Also fetch attachments list with download_url from /emails/receiving/:id/attachments
  try {
    const attList = await resendRequest(`/emails/receiving/${encodeURIComponent(emailId)}/attachments`, { method: 'GET' });
    if (attList && Array.isArray(attList.data) && attList.data.length > 0) {
      email.attachments = attList.data;
    }
  } catch {
    // Keep email.attachments as returned by main endpoint if attachments sub-endpoint fails
  }

  return email;
}

// Retrieves a single attachment (including fresh download_url) for a received email
async function getReceivedAttachment(emailId, attachmentId) {
  if (!emailId || !attachmentId) throw new Error('Email ID and Attachment ID are required');
  return await resendRequest(
    `/emails/receiving/${encodeURIComponent(emailId)}/attachments/${encodeURIComponent(attachmentId)}`,
    { method: 'GET' }
  );
}

// ── Resend Sent Emails API ───────────────────────────────────────────────────
// Lists outbound emails sent via Resend
async function listSentEmails({ limit = 50, after, before } = {}) {
  const params = new URLSearchParams();
  if (limit) params.set('limit', String(Math.min(Math.max(Number(limit) || 50, 1), 100)));
  if (after) params.set('after', String(after));
  if (before) params.set('before', String(before));
  const qs = params.toString() ? `?${params.toString()}` : '';
  return await resendRequest(`/emails${qs}`, { method: 'GET' });
}

// Retrieves a single outbound email sent via Resend
async function getSentEmail(emailId) {
  if (!emailId) throw new Error('Email ID is required');
  return await resendRequest(`/emails/${encodeURIComponent(emailId)}`, { method: 'GET' });
}

module.exports = {
  sendEmail,
  sendBulkEmail,
  listReceivedEmails,
  getReceivedEmail,
  getReceivedAttachment,
  listSentEmails,
  getSentEmail,
};