const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const RECEIPTS_DIR = path.join(process.cwd(), 'uploads', 'receipts');
const LOGO_PATH = path.join(__dirname, 'logo.jpg');

// Ensure dir exists
if (!fs.existsSync(RECEIPTS_DIR)) {
  fs.mkdirSync(RECEIPTS_DIR, { recursive: true });
}

const fmtUSD = (n) => '$' + Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const fmtDate = (d) => new Date(d).toLocaleString('en-US', {
  year: 'numeric', month: 'long', day: 'numeric',
  hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short'
});

const METHOD_LABELS = {
  bank_transfer: 'Bank Transfer', ach: 'ACH Transfer', wire: 'Wire Transfer',
  card: 'Debit/Credit Card', crypto_btc: 'Bitcoin (BTC)', crypto_eth: 'Ethereum (ETH)',
  crypto_usdt: 'USDT', crypto_bnb: 'BNB', crypto_sol: 'Solana (SOL)',
  paypal: 'PayPal', cashapp: 'Cash App', venmo: 'Venmo', zelle: 'Zelle',
  apple_pay: 'Apple Pay', google_pay: 'Google Pay', internal: 'Internal Transfer'
};

const CATEGORY_LABELS = {
  deposit: 'Deposit', withdrawal: 'Withdrawal', transfer_in: 'Transfer Received',
  transfer_out: 'Transfer Sent', payment: 'Payment', bill: 'Bill Payment',
  crypto: 'Crypto', shopping: 'Shopping', other: 'Other'
};

exports.generateReceiptPDF = async (transaction, user) => {
  return new Promise((resolve, reject) => {
    const filename = `receipt_${transaction.transactionId}.pdf`;
    const filepath = path.join(RECEIPTS_DIR, filename);
    const url = `/uploads/receipts/${filename}`;

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    // ── Header (Solid Corporate Blue #002B5B + #0052CC Accent Strip) ──────────
    doc.rect(0, 0, 595, 116).fill('#002B5B');
    doc.rect(0, 116, 595, 5).fill('#0052CC');

    let textStartX = 50;
    if (fs.existsSync(LOGO_PATH)) {
      try {
        doc.rect(48, 28, 56, 56).fill('#FFFFFF');
        doc.image(LOGO_PATH, 50, 30, { width: 52, height: 52 });
        textStartX = 116;
      } catch (e) {
        // Fallback if image read fails
      }
    }

    // Bank name
    doc.font('Helvetica-Bold').fontSize(24).fillColor('#FFFFFF').text('BLUE RIDGE ', textStartX, 34, { continued: true });
    doc.font('Helvetica-Bold').fontSize(24).fillColor('#60A5FA').text('BANK');

    doc.font('Helvetica-Bold').fontSize(9).fillColor('#93C5FD').text('INSTITUTIONAL & PERSONAL BANKING', textStartX, 64);
    doc.font('Helvetica').fontSize(9).fillColor('#BFDBFE').text('www.theblueridges.com | support@theblueridges.com', textStartX, 79);

    // Receipt label top right
    doc.font('Helvetica-Bold').fontSize(14).fillColor('#FFFFFF').text('OFFICIAL RECEIPT', 370, 38, { align: 'right', width: 175 });
    doc.font('Helvetica').fontSize(9).fillColor('#93C5FD').text(`REF #: ${transaction.transactionId}`, 370, 58, { align: 'right', width: 175 });

    // ── Status Badge ──────────────────────────────────────────────────────────
    const statusColor = transaction.status === 'completed' ? '#0052CC' : transaction.status === 'pending' ? '#B45309' : '#DC2626';
    const statusBg = transaction.status === 'completed' ? '#EBF2FF' : transaction.status === 'pending' ? '#FEF3C7' : '#FEF2F2';
    doc.rect(50, 138, 110, 24).fill(statusBg).stroke(statusColor);
    doc.font('Helvetica-Bold').fontSize(9).fillColor(statusColor)
       .text(transaction.status.toUpperCase(), 50, 146, { width: 110, align: 'center' });

    doc.rect(50, 174, 495, 1).fill('#CBD5E1');

    // ── Amount Section ────────────────────────────────────────────────────────
    const isCredit = transaction.type === 'credit';
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#475569').text('SETTLEMENT AMOUNT (USD)', 50, 188);
    doc.font('Helvetica-Bold').fontSize(30).fillColor(isCredit ? '#0052CC' : '#002B5B')
       .text(`${isCredit ? '+' : '-'}${fmtUSD(transaction.amount)}`, 50, 204);

    if (transaction.fee > 0) {
      doc.font('Helvetica').fontSize(10).fillColor('#475569')
         .text(`Fee: ${fmtUSD(transaction.fee)} | Net Settlement: ${fmtUSD(transaction.netAmount || transaction.amount - transaction.fee)}`, 50, 242);
    }

    doc.rect(50, 265, 495, 2).fill('#002B5B');

    // ── Transaction Details ────────────────────────────────────────────────────
    doc.font('Helvetica-Bold').fontSize(12).fillColor('#002B5B').text('TRANSACTION LEDGER DETAILS', 50, 280);

    const details = [
      ['Transaction ID', transaction.transactionId],
      ['Date & Time', fmtDate(transaction.createdAt || new Date())],
      ['Entry Type', isCredit ? 'Credit (Inflow)' : 'Debit (Outflow)'],
      ['Category', CATEGORY_LABELS[transaction.category] || transaction.category],
      ['Settlement Method', METHOD_LABELS[transaction.method] || transaction.method],
      ['Description', transaction.description],
      ...(transaction.note ? [['Audit Memo', transaction.note]] : []),
      ...(transaction.balanceAfter !== undefined ? [['Resulting Balance', fmtUSD(transaction.balanceAfter)]] : []),
    ];

    let y = 305;
    details.forEach(([label, value], i) => {
      if (i % 2 === 0) doc.rect(50, y - 4, 495, 22).fill('#F2F5F9');
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#334155').text(label + ':', 60, y);
      doc.font('Helvetica').fontSize(10).fillColor('#002B5B').text(String(value), 220, y, { width: 315 });
      y += 24;
    });

    // ── Crypto Details ────────────────────────────────────────────────────────
    if (transaction.cryptoCoin) {
      y += 8;
      doc.font('Helvetica-Bold').fontSize(12).fillColor('#002B5B').text('DIGITAL ASSET SETTLEMENT DETAILS', 50, y);
      y += 22;
      const cryptoDetails = [
        ['Asset', transaction.cryptoCoin],
        ['Quantity', `${transaction.cryptoAmount} ${transaction.cryptoCoin}`],
        ['Network', transaction.cryptoNetwork || 'N/A'],
        ...(transaction.walletAddress ? [['Wallet Address', transaction.walletAddress]] : []),
      ];
      cryptoDetails.forEach(([label, value], i) => {
        if (i % 2 === 0) doc.rect(50, y - 4, 495, 22).fill('#EBF2FF');
        doc.font('Helvetica-Bold').fontSize(10).fillColor('#334155').text(label + ':', 60, y);
        doc.font('Helvetica').fontSize(10).fillColor('#002B5B').text(String(value), 220, y, { width: 315 });
        y += 24;
      });
    }

    // ── Recipient Details ─────────────────────────────────────────────────────
    if (transaction.recipientName) {
      y += 8;
      doc.font('Helvetica-Bold').fontSize(12).fillColor('#002B5B').text('COUNTERPARTY / RECIPIENT', 50, y);
      y += 22;
      const recipDetails = [
        ['Beneficiary Name', transaction.recipientName],
        ...(transaction.recipientAccount ? [['Account', '****' + String(transaction.recipientAccount).slice(-4)]] : []),
      ];
      recipDetails.forEach(([label, value], i) => {
        if (i % 2 === 0) doc.rect(50, y - 4, 495, 22).fill('#EBF2FF');
        doc.font('Helvetica-Bold').fontSize(10).fillColor('#334155').text(label + ':', 60, y);
        doc.font('Helvetica').fontSize(10).fillColor('#002B5B').text(String(value), 220, y, { width: 315 });
        y += 24;
      });
    }

    y += 18;
    doc.rect(50, y, 495, 1).fill('#CBD5E1');
    y += 15;

    // ── Account Info ──────────────────────────────────────────────────────────
    doc.font('Helvetica-Bold').fontSize(12).fillColor('#002B5B').text('ORIGINATING ACCOUNT INFORMATION', 50, y);
    y += 22;
    const accountDetails = [
      ['Account Holder', `${user.firstName} ${user.lastName}`],
      ['Account Number', '****' + String(user.accountNumber).slice(-4)],
      ['ABA Routing Number', user.routingNumber || '021000021'],
    ];
    accountDetails.forEach(([label, value], i) => {
      if (i % 2 === 0) doc.rect(50, y - 4, 495, 22).fill('#F2F5F9');
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#334155').text(label + ':', 60, y);
      doc.font('Helvetica').fontSize(10).fillColor('#002B5B').text(String(value), 220, y);
      y += 24;
    });

    // ── Footer ────────────────────────────────────────────────────────────────
    doc.rect(0, 756, 595, 4).fill('#0052CC');
    doc.rect(0, 760, 595, 82).fill('#002B5B');
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#FFFFFF')
       .text('BLUE RIDGE BANK · CERTIFIED TRANSACTION RECORD', 50, 773, { align: 'center', width: 495 })
       .font('Helvetica').fontSize(8).fillColor('#93C5FD')
       .text('Support & Verification Desk: support@theblueridges.com', 50, 787, { align: 'center', width: 495 })
       .text(`Generated on ${new Date().toUTCString()}`, 50, 800, { align: 'center', width: 495 });

    doc.end();

    stream.on('finish', () => resolve({ url, filepath, filename }));
    stream.on('error', reject);
  });
};
