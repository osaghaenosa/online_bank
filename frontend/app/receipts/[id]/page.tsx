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
      <div className="shimmer h-64 rounded-3xl" />
      <div className="shimmer h-96 rounded-3xl" />
    </div>
  )

  if (err || !tx) return (
    <div className="max-w-2xl mx-auto">
      <Card className="p-10 text-center rounded-3xl">
        <XCircle size={48} className="text-red-500 mx-auto mb-4" />
        <h2 className="font-bold text-xl mb-2 text-[#002B5B]">Official Receipt Not Found</h2>
        <p className="text-sm mb-6 text-slate-500">{err || 'Transaction record not found or access denied.'}</p>
        <Link href="/history"><Button variant="secondary" className="rounded-full"><ArrowLeft size={14} /> Back to Audit History</Button></Link>
      </Card>
    </div>
  )

  const isCredit = tx.type === 'credit'
  const downloadUrl = api.receipts.download(txId)

  return (
    <div className="max-w-2xl mx-auto space-y-5 fade-up">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/history">
          <Button variant="secondary" size="sm" className="rounded-full"><ArrowLeft size={14} /> Audit History</Button>
        </Link>
        <a href={downloadUrl} target="_blank" rel="noreferrer">
          <Button variant="primary" size="sm" className="rounded-full"><Download size={14} /> Download Certified PDF</Button>
        </a>
      </div>

      {/* Institutional Receipt Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-float overflow-hidden">
        <div className="p-6 sm:p-7 brand-card-gradient text-white">
          <div className="flex items-start justify-between mb-6 pb-4 border-b border-white/15">
            <div>
              <BrandLogo variant="light" size="sm" />
              <p className="text-[11px] font-medium mt-2 text-blue-200">
                Official Ledger Audit Receipt
              </p>
            </div>
            <StatusBadge status={tx.status} />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-xs text-blue-200 mb-1">
                {isCredit ? 'Credit Settlement Amount' : 'Debit Settlement Amount'}
              </p>
              <p className="font-mono text-3xl sm:text-4xl font-bold text-white">
                {isCredit ? '+' : '-'}{fmtUSD(tx.amount)}
              </p>
              {tx.fee > 0 && (
                <p className="text-xs font-mono mt-1 text-blue-100">
                  Fee: {fmtUSD(tx.fee)} · Net Settlement: {fmtUSD(tx.netAmount)}
                </p>
              )}
            </div>
            <div className="sm:text-right px-4 py-2.5 rounded-2xl glass">
              <p className="text-[10px] text-blue-200">Reference ID</p>
              <p className="font-mono text-xs font-bold text-white mt-0.5">{tx.transactionId}</p>
            </div>
          </div>
        </div>

        {/* Details Table */}
        <div className="p-5 sm:p-6 space-y-1">
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
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 px-4 py-3 rounded-xl"
              style={{
                background: i % 2 !== 0 ? '#F4F7FC' : 'transparent',
              }}
            >
              <span className="text-xs font-medium text-slate-500">{label}</span>
              <span className="text-sm font-semibold text-[#002B5B]">
                {label === 'Verification Status' ? <StatusBadge status={String(val)} /> : String(val)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Crypto details */}
      {tx.cryptoCoin && (
        <Card className="p-6">
          <h3 className="font-display font-bold text-sm mb-4 text-[#0052CC]">
            Digital Asset Settlement Details
          </h3>
          <div className="space-y-2">
            {[
              ['Asset', tx.cryptoCoin],
              ['Quantity', `${tx.cryptoAmount} ${tx.cryptoCoin}`],
              ['Network', tx.cryptoNetwork || 'N/A'],
              ...(tx.walletAddress ? [['Destination Wallet', tx.walletAddress]] : []),
            ].map(([label, val]) => (
              <div key={label} className="flex justify-between py-2.5 border-b border-slate-100 last:border-0">
                <span className="text-xs font-medium text-slate-500">{label}</span>
                <span className="text-sm font-mono font-semibold truncate max-w-[60%] text-right text-[#002B5B]">{String(val)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recipient details */}
      {tx.recipientName && (
        <Card className="p-6">
          <h3 className="font-display font-bold text-sm mb-4 text-[#0052CC]">
            Beneficiary / Counterparty
          </h3>
          <div className="space-y-2">
            {[
              ['Counterparty Name', tx.recipientName],
              ...(tx.recipientAccount ? [['Account Number', '****' + String(tx.recipientAccount).slice(-4)]] : []),
            ].map(([label, val]) => (
              <div key={label} className="flex justify-between py-2.5 border-b border-slate-100 last:border-0">
                <span className="text-xs font-medium text-slate-500">{label}</span>
                <span className="text-sm font-semibold text-[#002B5B]">{String(val)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Account info */}
      {user && (
        <Card className="p-6">
          <h3 className="font-display font-bold text-sm mb-4 text-[#0052CC]">
            Originating Account Information
          </h3>
          <div className="space-y-2">
            {[
              ['Account Holder', `${user.firstName} ${user.lastName}`],
              ['Account Number', '****' + String(user.accountNumber || '').slice(-4)],
              ['ABA Routing Number', user.routingNumber || '021000021'],
            ].map(([label, val]) => (
              <div key={label} className="flex justify-between py-2.5 border-b border-slate-100 last:border-0">
                <span className="text-xs font-medium text-slate-500">{label}</span>
                <span className="text-sm font-semibold font-mono text-[#002B5B]">{String(val)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Download CTA */}
      <div className="flex flex-col sm:flex-row gap-3">
        <a href={downloadUrl} target="_blank" rel="noreferrer" className="flex-1">
          <Button variant="primary" className="w-full rounded-full" size="lg">
            <Download size={16} /> Download Certified PDF Receipt
          </Button>
        </a>
        <Link href="/history" className="flex-1">
          <Button variant="secondary" className="w-full rounded-full" size="lg">
            <ArrowLeft size={16} /> Return to Audit History
          </Button>
        </Link>
      </div>

      <p className="text-xs text-center font-mono text-slate-400">
        Blue ridge Bank · Certified Audit Record · Ref: {tx.transactionId} · support@theblueridges.com
      </p>
    </div>
  )
}
