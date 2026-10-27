'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { api, fmtUSD, fmtDateTime } from '@/lib/api'
import { Card, StatusBadge, Button } from '@/components/ui'
import { BrandLogo } from '@/components/shared/BrandLogo'
import { Download, ArrowLeft, XCircle } from 'lucide-react'

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
      <div className="shimmer h-64" />
      <div className="shimmer h-96" />
    </div>
  )

  if (err || !tx) return (
    <div className="max-w-2xl mx-auto">
      <Card className="p-10 text-center">
        <XCircle size={48} className="text-red-500 mx-auto mb-4" />
        <h2 className="font-bold text-xl mb-2" style={{ color: '#002B5B' }}>Official Receipt Not Found</h2>
        <p className="text-sm mb-6" style={{ color: 'var(--color-muted)' }}>{err || 'Transaction record not found or access denied.'}</p>
        <Link href="/history"><Button variant="secondary"><ArrowLeft size={14} /> Back to Audit History</Button></Link>
      </Card>
    </div>
  )

  const isCredit = tx.type === 'credit'
  const downloadUrl = api.receipts.download(txId)

  return (
    <div className="max-w-2xl mx-auto space-y-5 fade-up">
      <div className="flex items-center justify-between">
        <Link href="/history">
          <Button variant="secondary" size="sm"><ArrowLeft size={14} /> Audit History</Button>
        </Link>
        <a href={downloadUrl} target="_blank" rel="noreferrer">
          <Button variant="primary" size="sm"><Download size={14} /> Download Certified PDF</Button>
        </a>
      </div>

      {/* Institutional Receipt Card */}
      <div className="bg-white border-2" style={{ borderColor: '#002B5B' }}>
        {/* Solid Corporate Blue Header Strip */}
        <div
          className="p-6 border-b-4"
          style={{ background: '#002B5B', borderColor: '#0052CC', color: '#FFFFFF' }}
        >
          <div className="flex items-start justify-between mb-6 pb-4 border-b" style={{ borderColor: '#1E3A5F' }}>
            <div>
              <BrandLogo variant="light" size="sm" />
              <p className="text-[10px] font-mono uppercase tracking-widest mt-2" style={{ color: '#93C5FD' }}>
                OFFICIAL LEDGER AUDIT RECEIPT
              </p>
            </div>
            <StatusBadge status={tx.status} />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-wider mb-1" style={{ color: '#93C5FD' }}>
                {isCredit ? 'CREDIT SETTLEMENT AMOUNT' : 'DEBIT SETTLEMENT AMOUNT'}
              </p>
              <p className="font-mono text-3xl sm:text-4xl font-bold text-white">
                {isCredit ? '+' : '-'}{fmtUSD(tx.amount)}
              </p>
              {tx.fee > 0 && (
                <p className="text-xs font-mono mt-1" style={{ color: '#BFDBFE' }}>
                  Fee: {fmtUSD(tx.fee)} · Net Settlement: {fmtUSD(tx.netAmount)}
                </p>
              )}
            </div>
            <div className="sm:text-right p-3 border" style={{ background: '#001F42', borderColor: '#0052CC' }}>
              <p className="text-[10px] font-mono uppercase" style={{ color: '#93C5FD' }}>REFERENCE ID</p>
              <p className="font-mono text-xs font-bold text-white mt-0.5">{tx.transactionId}</p>
            </div>
          </div>
        </div>

        {/* Details Table */}
        <div className="p-6 space-y-0">
          {[
            ['Description', tx.description],
            ['Classification', CAT_LABELS[tx.category] || tx.category],
            ['Settlement Rail', METHOD_LABELS[tx.method] || tx.method],
            ['Timestamp', fmtDateTime(tx.createdAt)],
            ['Verification Status', tx.status],
            ...(tx.balanceAfter !== undefined ? [['Resulting Balance', fmtUSD(tx.balanceAfter)]] : []),
            ...(tx.note ? [['Audit Memo', tx.note]] : []),
          ].map(([label, val], i) => (
            <div
              key={label}
              className="flex justify-between py-3 border-b last:border-0"
              style={{
                borderColor: 'var(--color-border)',
                background: i % 2 === 0 ? '#FFFFFF' : '#F8FAFC',
                margin: i % 2 !== 0 ? '0 -24px' : '',
                padding: '12px 24px',
              }}
            >
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>{label}</span>
              <span className="text-sm font-semibold" style={{ color: '#002B5B' }}>
                {label === 'Verification Status' ? <StatusBadge status={String(val)} /> : String(val)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Crypto details */}
      {tx.cryptoCoin && (
        <Card className="p-6">
          <h3 className="font-bold text-xs mb-4 font-mono uppercase tracking-wider" style={{ color: '#0052CC' }}>
            Digital Asset Settlement Details
          </h3>
          <div className="space-y-0">
            {[
              ['Asset', tx.cryptoCoin],
              ['Quantity', `${tx.cryptoAmount} ${tx.cryptoCoin}`],
              ['Network', tx.cryptoNetwork || 'N/A'],
              ...(tx.walletAddress ? [['Destination Wallet', tx.walletAddress]] : []),
            ].map(([label, val]) => (
              <div key={label} className="flex justify-between py-3 border-b last:border-0" style={{ borderColor: 'var(--color-border)' }}>
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>{label}</span>
                <span className="text-sm font-mono font-semibold truncate max-w-[60%] text-right" style={{ color: '#002B5B' }}>{String(val)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recipient details */}
      {tx.recipientName && (
        <Card className="p-6">
          <h3 className="font-bold text-xs mb-4 font-mono uppercase tracking-wider" style={{ color: '#0052CC' }}>
            Beneficiary / Counterparty
          </h3>
          <div className="space-y-0">
            {[
              ['Counterparty Name', tx.recipientName],
              ...(tx.recipientAccount ? [['Account Number', '****' + String(tx.recipientAccount).slice(-4)]] : []),
            ].map(([label, val]) => (
              <div key={label} className="flex justify-between py-3 border-b last:border-0" style={{ borderColor: 'var(--color-border)' }}>
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>{label}</span>
                <span className="text-sm font-semibold" style={{ color: '#002B5B' }}>{String(val)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Account info */}
      {user && (
        <Card className="p-6">
          <h3 className="font-bold text-xs mb-4 font-mono uppercase tracking-wider" style={{ color: '#0052CC' }}>
            Originating Account Information
          </h3>
          <div className="space-y-0">
            {[
              ['Account Holder', `${user.firstName} ${user.lastName}`],
              ['Account Number', '****' + String(user.accountNumber || '').slice(-4)],
              ['ABA Routing Number', user.routingNumber || '021000021'],
            ].map(([label, val]) => (
              <div key={label} className="flex justify-between py-3 border-b last:border-0" style={{ borderColor: 'var(--color-border)' }}>
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>{label}</span>
                <span className="text-sm font-semibold font-mono" style={{ color: '#002B5B' }}>{String(val)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Download CTA */}
      <div className="flex flex-col sm:flex-row gap-3">
        <a href={downloadUrl} target="_blank" rel="noreferrer" className="flex-1">
          <Button variant="primary" className="w-full" size="lg">
            <Download size={16} /> Download Certified PDF Receipt
          </Button>
        </a>
        <Link href="/history" className="flex-1">
          <Button variant="secondary" className="w-full" size="lg">
            <ArrowLeft size={16} /> Return to Audit History
          </Button>
        </Link>
      </div>

      <p className="text-xs text-center font-mono" style={{ color: 'var(--color-muted)' }}>
        BLUE RIDGE BANK · CERTIFIED AUDIT RECORD · REF: {tx.transactionId} · SUPPORT@THEBLUERIDGES.COM
      </p>
    </div>
  )
}
