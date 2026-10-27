'use client'
import Link from 'next/link'
import { StatusBadge } from '@/components/ui'
import { fmtUSD, fmtDateTime } from '@/lib/api'
import {
  TrendingUp, Send, ShoppingBag, Coffee, Zap, Heart, Car,
  Bitcoin, Building2, Circle, Download, Upload, FileText,
} from 'lucide-react'

const CAT_ICONS: Record<string, React.ElementType> = {
  deposit: Download, withdrawal: Upload, transfer_in: TrendingUp,
  transfer_out: Send, bill: Building2, shopping: ShoppingBag,
  food: Coffee, crypto: Bitcoin, entertainment: Zap,
  health: Heart, transport: Car, salary: TrendingUp, payment: FileText,
}

interface TxRowProps {
  tx: {
    _id: string
    transactionId: string
    type: string
    category: string
    description: string
    amount: number
    fee?: number
    status: string
    createdAt: string
    recipientName?: string
    method?: string
  }
  showRef?: boolean
  showUser?: string
  compact?: boolean
}

export function TxRow({ tx, showRef, showUser, compact }: TxRowProps) {
  const Icon = CAT_ICONS[tx.category] ?? Circle
  const isCredit = tx.type === 'credit'

  return (
    <Link href={`/receipts/${tx.transactionId}`}>
      <div
        className="flex items-center justify-between gap-2.5 sm:gap-3.5 py-3 sm:py-3.5 border-b last:border-b-0 cursor-pointer hover:bg-blue-50/40 px-2 -mx-2 transition-colors"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
          <div
            className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center flex-shrink-0 border"
            style={{
              background: isCredit ? '#EBF2FF' : '#F8FAFC',
              borderColor: isCredit ? '#93C5FD' : '#CBD5E1',
              color: isCredit ? '#0052CC' : '#002B5B',
            }}
          >
            <Icon size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs sm:text-sm font-semibold truncate" style={{ color: '#002B5B' }}>
              {tx.description}
            </p>

            {(() => {
              const m = (tx as any).metadata || {}
              const b = m.bankDetails || {}
              const c = m.cryptoDetails || {}

              let destInfo = ''
              if (tx.method === 'iban' && b.iban) {
                destInfo = `IBAN: ${b.iban} · ${b.beneficiaryName || ''}`
              } else if ((tx.method === 'wire' || tx.method === 'ach' || tx.method === 'bank_transfer') && b.accountNumber) {
                destInfo = `To: ${b.beneficiaryName || 'Unknown'} · Acct: •••${b.accountNumber.slice(-4)} (${b.bankName || 'Bank'})`
              } else if (tx.method?.startsWith('crypto') && (c.walletAddress || (tx as any).walletAddress)) {
                const w = c.walletAddress || (tx as any).walletAddress
                destInfo = `Wallet: ${w.slice(0, 6)}...${w.slice(-4)} · ${c.coin || (tx as any).cryptoCoin || ''}`
              } else if (m.recipientName) {
                destInfo = `To: ${m.recipientName}`
              } else if ((tx as any).recipientName) {
                destInfo = `To: ${(tx as any).recipientName}`
              }

              if (!destInfo) return null
              return (
                <p className="text-[11px] mt-0.5 truncate font-medium" style={{ color: '#0052CC' }}>
                  {destInfo}
                </p>
              )
            })()}

            <p className="text-[11px] mt-0.5 truncate" style={{ color: 'var(--color-muted)' }}>
              {fmtDateTime(tx.createdAt)}
              {showUser ? ` · ${showUser}` : ''}
              {showRef ? <span className="hidden sm:inline">{` · REF: ${tx.transactionId}`}</span> : ''}
            </p>
          </div>
        </div>

        <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
          <p
            className="font-mono text-xs sm:text-sm font-bold whitespace-nowrap"
            style={{ color: isCredit ? '#0052CC' : '#0A192F' }}
          >
            {isCredit ? '+' : '-'}{fmtUSD(tx.amount)}
          </p>
          {!compact && <StatusBadge status={tx.status} />}
        </div>
      </div>
    </Link>
  )
}
