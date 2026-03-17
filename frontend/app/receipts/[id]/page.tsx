'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { api, fmtUSD, fmtDateTime } from '@/lib/api'
import { Card, StatusBadge, Button } from '@/components/ui'
import { Download, ArrowLeft, CheckCircle, XCircle, Clock, ExternalLink } from 'lucide-react'

const METHOD_LABELS: Record<string, string> = {
  bank_transfer: 'Bank Transfer', ach: 'ACH Transfer', wire: 'Wire Transfer',
  card: 'Debit/Credit Card', crypto_btc: 'Bitcoin (BTC)', crypto_eth: 'Ethereum (ETH)',
  crypto_usdt: 'USDT', crypto_bnb: 'BNB', crypto_sol: 'Solana (SOL)',
  paypal: 'PayPal', cashapp: 'Cash App', venmo: 'Venmo', zelle: 'Zelle',
  apple_pay: 'Apple Pay', google_pay: 'Google Pay', internal: 'Internal Transfer',
}
const CAT_LABELS: Record<string, string> = {
  deposit: 'Deposit', withdrawal: 'Withdrawal', transfer_in: 'Transfer Received',
  transfer_out: 'Transfer Sent', bill: 'Bill Payment', shopping: 'Shopping',
  crypto: 'Crypto', food: 'Food & Dining', transport: 'Transport',
  entertainment: 'Entertainment', health: 'Health', salary: 'Salary',
}

export default function ReceiptPage() {
  const params = useParams()
  const txId = params.id as string
  const [tx, setTx] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  useEffect(() => {
    api.receipts.get(txId)
      .then(d => { setTx(d.transaction); setUser(d.user) })
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false))
  }, [txId])

  if (loading) return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="shimmer h-64 rounded-2xl" />
      <div className="shimmer h-96 rounded-2xl" />
    </div>
  )

  if (err || !tx) return (
    <div className="max-w-2xl mx-auto">
      <Card className="p-10 text-center">
        <XCircle size={48} className="text-red-400 mx-auto mb-4" />
        <h2 className="font-bold text-xl mb-2">Receipt Not Found</h2>
        <p className="text-sm mb-6" style={{ color: 'var(--color-muted)' }}>{err || 'Transaction not found or access denied.'}</p>
        <Link href="/history"><Button variant="secondary"><ArrowLeft size={14} /> Back to History</Button></Link>
      </Card>
    </div>
  )

  const isCredit = tx.type === 'credit'
  const downloadUrl = api.receipts.download(txId)

  return (
    <div className="max-w-2xl mx-auto space-y-5 fade-up">
      <div className="flex items-center justify-between">
        <Link href="/history">
          <Button variant="secondary" size="sm"><ArrowLeft size={14} /> Back</Button>
        </Link>
        <a href={downloadUrl} target="_blank" rel="noreferrer">
          <Button variant="primary" size="sm"><Download size={14} /> Download PDF</Button>
        </a>
      </div>

      {/* Header card */}
      <Card className="overflow-hidden">
        {/* Navy header strip */}
        <div className="p-6" style={{ background: '#0F1C35' }}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="font-display font-bold text-xl text-white">
                <span style={{ color: '#10B981' }}>N</span>exaBank
              </p>
              <p className="text-xs text-white/40 mt-0.5">Transaction Receipt</p>
            </div>
            <StatusBadge status={tx.status} />
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs text-white/40 mb-1">{isCredit ? 'Money Received' : 'Money Sent'}</p>
              <p className={`font-mono text-4xl font-bold ${isCredit ? 'text-emerald-400' : 'text-red-400'}`}>
                {isCredit ? '+' : '-'}{fmtUSD(tx.amount)}
              </p>
              {tx.fee > 0 && <p className="text-xs text-white/40 mt-1">Fee: {fmtUSD(tx.fee)} · Net: {fmtUSD(tx.netAmount)}</p>}
            </div>
            <div className="text-right">
              <p className="text-xs text-white/40 mb-1">Transaction ID</p>
              <p className="font-mono text-xs text-white/70">{tx.transactionId}</p>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="p-6 space-y-0">
          {[
            ['Description',   tx.description],
            ['Category',      CAT_LABELS[tx.category] || tx.category],
            ['Method',        METHOD_LABELS[tx.method] || tx.method],
            ['Date & Time',   fmtDateTime(tx.createdAt)],
            ['Status',        tx.status],
            ...(tx.balanceAfter !== undefined ? [['Balance After', fmtUSD(tx.balanceAfter)]] : []),
            ...(tx.note ? [['Note', tx.note]] : []),
          ].map(([label, val], i) => (
            <div key={label} className="flex justify-between py-3 border-b last:border-0"
              style={{ borderColor: 'var(--color-border)', background: i % 2 === 0 ? 'transparent' : 'var(--color-bg)', margin: i % 2 !== 0 ? '0 -24px' : '', padding: '12px 24px' }}>
              <span className="text-xs font-semibold" style={{ color: 'var(--color-muted)' }}>{label}</span>
              <span className="text-sm font-semibold">
                {label === 'Status' ? <StatusBadge status={String(val)} /> : String(val)}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Crypto details */}
      {tx.cryptoCoin && (
        <Card className="p-6">
          <h3 className="font-bold text-sm mb-4 uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>Crypto Details</h3>
          <div className="space-y-0">
            {[
              ['Coin', tx.cryptoCoin],
              ['Amount', `${tx.cryptoAmount} ${tx.cryptoCoin}`],
              ['Network', tx.cryptoNetwork || 'N/A'],
              ...(tx.walletAddress ? [['Wallet Address', tx.walletAddress]] : []),
            ].map(([label, val], i) => (
              <div key={label} className="flex justify-between py-3 border-b last:border-0" style={{ borderColor: 'var(--color-border)' }}>
                <span className="text-xs font-semibold" style={{ color: 'var(--color-muted)' }}>{label}</span>
                <span className="text-sm font-mono font-semibold truncate max-w-[60%] text-right">{String(val)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recipient details */}
      {tx.recipientName && (
        <Card className="p-6">
          <h3 className="font-bold text-sm mb-4 uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>Recipient</h3>
          <div className="space-y-0">
            {[
              ['Name', tx.recipientName],
              ...(tx.recipientAccount ? [['Account', '****' + String(tx.recipientAccount).slice(-4)]] : []),
            ].map(([label, val]) => (
              <div key={label} className="flex justify-between py-3 border-b last:border-0" style={{ borderColor: 'var(--color-border)' }}>
                <span className="text-xs font-semibold" style={{ color: 'var(--color-muted)' }}>{label}</span>
                <span className="text-sm font-semibold">{String(val)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Account info */}
      {user && (
        <Card className="p-6">
          <h3 className="font-bold text-sm mb-4 uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>Account Information</h3>
          <div className="space-y-0">
            {[
              ['Account Holder', `${user.firstName} ${user.lastName}`],
              ['Account Number', '****' + String(user.accountNumber || '').slice(-4)],
              ['Routing Number', user.routingNumber || '021000021'],
            ].map(([label, val]) => (
              <div key={label} className="flex justify-between py-3 border-b last:border-0" style={{ borderColor: 'var(--color-border)' }}>
                <span className="text-xs font-semibold" style={{ color: 'var(--color-muted)' }}>{label}</span>
                <span className="text-sm font-semibold font-mono">{String(val)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Download CTA */}
      <div className="flex gap-3">
        <a href={downloadUrl} target="_blank" rel="noreferrer" className="flex-1">
          <Button variant="primary" className="w-full" size="lg">
            <Download size={16} /> Download PDF Receipt
          </Button>
        </a>
        <Link href="/history" className="flex-1">
          <Button variant="secondary" className="w-full" size="lg">
            <ArrowLeft size={16} /> All Transactions
          </Button>
        </Link>
      </div>

      <p className="text-xs text-center" style={{ color: 'var(--color-muted)' }}>
        This receipt is automatically generated and stored permanently. Transaction ID: <span className="font-mono">{tx.transactionId}</span>
      </p>
    </div>
  )
}
