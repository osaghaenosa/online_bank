const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const RECEIPTS_DIR = path.join(process.cwd(), 'uploads', 'receipts');

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

    // ── Header ────────────────────────────────────────────────────────────────
    // Navy background header
    doc.rect(0, 0, 595, 120).fill('#1A2B4A');

    // Bank name
    doc.font('Helvetica-Bold').fontSize(28).fillColor('#10B981').text('N', 50, 35, { continued: true });
    doc.font('Helvetica-Bold').fontSize(28).fillColor('#ffffff').text('exaBank');

    doc.font('Helvetica').fontSize(11).fillColor('rgba(255,255,255,0.6)').text('Personal Banking', 50, 70);
    doc.font('Helvetica').fontSize(10).fillColor('rgba(255,255,255,0.5)').text('www.nexabank.com | support@nexabank.com', 50, 88);

    // Receipt label top right
    doc.font('Helvetica-Bold').fontSize(18).fillColor('#10B981').text('TRANSACTION RECEIPT', 350, 42);
    doc.font('Helvetica').fontSize(9).fillColor('rgba(255,255,255,0.6)').text(`Receipt #: ${transaction.transactionId}`, 350, 68);

    // ── Status Badge ──────────────────────────────────────────────────────────
    const statusColor = transaction.status === 'completed' ? '#10B981' : transaction.status === 'pending' ? '#F59E0B' : '#EF4444';
    doc.rect(50, 135, 100, 26).fill(statusColor + '20').stroke(statusColor);
    doc.font('Helvetica-Bold').fontSize(10).fillColor(statusColor)
       .text(transaction.status.toUpperCase(), 55, 143);

    doc.rect(50, 170, 495, 1).fill('#E2E8F0');

    // ── Amount Section ────────────────────────────────────────────────────────
    const isCredit = transaction.type === 'credit';
    doc.font('Helvetica').fontSize(12).fillColor('#6B7A99').text('Transaction Amount', 50, 185);
    doc.font('Helvetica-Bold').fontSize(32).fillColor(isCredit ? '#10B981' : '#EF4444')
       .text(`${isCredit ? '+' : '-'}${fmtUSD(transaction.amount)}`, 50, 202);

    if (transaction.fee > 0) {
      doc.font('Helvetica').fontSize(11).fillColor('#6B7A99')
         .text(`Fee: ${fmtUSD(transaction.fee)} | Net: ${fmtUSD(transaction.netAmount || transaction.amount - transaction.fee)}`, 50, 240);
    }

    doc.rect(50, 265, 495, 1).fill('#E2E8F0');

    // ── Transaction Details ────────────────────────────────────────────────────
    doc.font('Helvetica-Bold').fontSize(13).fillColor('#1A2B4A').text('Transaction Details', 50, 280);

    const details = [
      ['Transaction ID', transaction.transactionId],
      ['Date & Time', fmtDate(transaction.createdAt || new Date())],
      ['Type', isCredit ? 'Credit (Money In)' : 'Debit (Money Out)'],
      ['Category', CATEGORY_LABELS[transaction.category] || transaction.category],
      ['Payment Method', METHOD_LABELS[transaction.method] || transaction.method],
      ['Description', transaction.description],
      ...(transaction.note ? [['Note', transaction.note]] : []),
      ...(transaction.balanceAfter !== undefined ? [['Balance After', fmtUSD(transaction.balanceAfter)]] : []),
    ];

    let y = 305;
    details.forEach(([label, value], i) => {
      if (i % 2 === 0) doc.rect(50, y - 4, 495, 22).fill('#F8FAFC');
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#374151').text(label + ':', 60, y);
      doc.font('Helvetica').fontSize(10).fillColor('#1A2B4A').text(String(value), 220, y, { width: 315 });
      y += 24;
    });

    // ── Crypto Details ────────────────────────────────────────────────────────
    if (transaction.cryptoCoin) {
      y += 8;
      doc.font('Helvetica-Bold').fontSize(13).fillColor('#1A2B4A').text('Crypto Details', 50, y);
      y += 22;
      const cryptoDetails = [
        ['Coin', transaction.cryptoCoin],
        ['Amount', `${transaction.cryptoAmount} ${transaction.cryptoCoin}`],
        ['Network', transaction.cryptoNetwork || 'N/A'],
        ...(transaction.walletAddress ? [['Wallet Address', transaction.walletAddress]] : []),
      ];
      cryptoDetails.forEach(([label, value], i) => {
        if (i % 2 === 0) doc.rect(50, y - 4, 495, 22).fill('#F0FDF4');
        doc.font('Helvetica-Bold').fontSize(10).fillColor('#374151').text(label + ':', 60, y);
        doc.font('Helvetica').fontSize(10).fillColor('#1A2B4A').text(String(value), 220, y, { width: 315 });
        y += 24;
      });
    }

    // ── Recipient Details ─────────────────────────────────────────────────────
    if (transaction.recipientName) {
      y += 8;
      doc.font('Helvetica-Bold').fontSize(13).fillColor('#1A2B4A').text('Recipient Details', 50, y);
      y += 22;
      const recipDetails = [
        ['Name', transaction.recipientName],
        ...(transaction.recipientAccount ? [['Account', '****' + String(transaction.recipientAccount).slice(-4)]] : []),
      ];
      recipDetails.forEach(([label, value], i) => {
        if (i % 2 === 0) doc.rect(50, y - 4, 495, 22).fill('#EFF6FF');
        doc.font('Helvetica-Bold').fontSize(10).fillColor('#374151').text(label + ':', 60, y);
        doc.font('Helvetica').fontSize(10).fillColor('#1A2B4A').text(String(value), 220, y, { width: 315 });
        y += 24;
      });
    }

    y += 20;
    doc.rect(50, y, 495, 1).fill('#E2E8F0');
    y += 15;

    // ── Account Info ──────────────────────────────────────────────────────────
    doc.font('Helvetica-Bold').fontSize(13).fillColor('#1A2B4A').text('Account Information', 50, y);
    y += 22;
    const accountDetails = [
      ['Account Holder', `${user.firstName} ${user.lastName}`],
      ['Account Number', '****' + String(user.accountNumber).slice(-4)],
      ['Routing Number', user.routingNumber || '021000021'],
    ];
    accountDetails.forEach(([label, value], i) => {
      if (i % 2 === 0) doc.rect(50, y - 4, 495, 22).fill('#F8FAFC');
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#374151').text(label + ':', 60, y);
      doc.font('Helvetica').fontSize(10).fillColor('#1A2B4A').text(String(value), 220, y);
      y += 24;
    });

    // ── Footer ────────────────────────────────────────────────────────────────
    doc.rect(0, 760, 595, 82).fill('#1A2B4A');
    doc.font('Helvetica').fontSize(9).fillColor('rgba(255,255,255,0.5)')
       .text('This is an automatically generated receipt. NexaBank is a simulated banking application.', 50, 773, { align: 'center', width: 495 })
       .text('All transactions are simulated for demonstration purposes only.', 50, 787, { align: 'center', width: 495 })
       .text(`Generated: ${fmtDate(new Date())} | NexaBank © ${new Date().getFullYear()}`, 50, 805, { align: 'center', width: 495 });

    doc.end();

    stream.on('finish', () => resolve({ url, filepath, filename }));
    stream.on('error', reject);
  });
};
