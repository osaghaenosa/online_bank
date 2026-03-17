'use client'
import Link from 'next/link'
import clsx from 'clsx'
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
const CAT_COLORS: Record<string, string> = {
  deposit: 'bg-emerald-100 text-emerald-700',
  withdrawal: 'bg-red-100 text-red-700',
  transfer_in: 'bg-blue-100 text-blue-700',
  transfer_out: 'bg-indigo-100 text-indigo-700',
  bill: 'bg-orange-100 text-orange-700',
  shopping: 'bg-amber-100 text-amber-700',
  food: 'bg-yellow-100 text-yellow-700',
  crypto: 'bg-purple-100 text-purple-700',
  entertainment: 'bg-violet-100 text-violet-700',
  health: 'bg-pink-100 text-pink-700',
  transport: 'bg-slate-100 text-slate-700',
  salary: 'bg-teal-100 text-teal-700',
  payment: 'bg-gray-100 text-gray-700',
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
  }
  showRef?: boolean
  showUser?: string
  compact?: boolean
}

export function TxRow({ tx, showRef, showUser, compact }: TxRowProps) {
  const Icon = CAT_ICONS[tx.category] ?? Circle
  const colorCls = CAT_COLORS[tx.category] ?? 'bg-gray-100 text-gray-600'
  const isCredit = tx.type === 'credit'

  return (
    <Link href={`/receipts/${tx.transactionId}`}>
      <div className="flex items-center gap-3 py-3.5 border-b last:border-b-0 cursor-pointer hover:bg-[var(--color-bg)] rounded-xl px-2 -mx-2 transition-colors"
        style={{ borderColor: 'var(--color-border)' }}>
        <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', colorCls)}>
          <Icon size={17} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{tx.description}</p>
          <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--color-muted)' }}>
            {fmtDateTime(tx.createdAt)}
            {showUser ? ` · ${showUser}` : ''}
            {showRef ? ` · ${tx.transactionId}` : ''}
            {tx.recipientName ? ` · ${tx.recipientName}` : ''}
          </p>
        </div>
        <div className="text-right flex-shrink-0 space-y-1">
          <p className={clsx('font-mono text-sm font-bold', isCredit ? 'text-emerald-600' : 'text-red-500')}>
            {isCredit ? '+' : '-'}{fmtUSD(tx.amount)}
          </p>
          {!compact && <StatusBadge status={tx.status} />}
        </div>
      </div>
    </Link>
  )
}
