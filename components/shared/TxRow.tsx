'use client'
import { Transaction } from '@/store'
import { StatusBadge } from '@/components/ui'
import { catColor, fmtDate, fmtTime, fmtUSD } from '@/lib/utils'
import {
  TrendingUp, Send, ShoppingBag, Coffee, Building2, Bitcoin,
  Zap, Heart, Car, Circle
} from 'lucide-react'
import clsx from 'clsx'

const CAT_ICONS: Record<string, React.ElementType> = {
  income: TrendingUp, transfer: Send, shopping: ShoppingBag,
  food: Coffee, bills: Building2, crypto: Bitcoin,
  entertainment: Zap, health: Heart, transport: Car,
}

interface TxRowProps {
  tx: Transaction
  showUser?: string
  showRef?: boolean
}

export function TxRow({ tx, showUser, showRef }: TxRowProps) {
  const Icon = CAT_ICONS[tx.cat] ?? Circle
  const colorCls = catColor(tx.cat)

  return (
    <div className="flex items-center gap-3 py-3.5 border-b last:border-b-0" style={{ borderColor: 'var(--color-border)' }}>
      <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', colorCls)}>
        <Icon size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{tx.desc}</p>
        <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--color-muted)' }}>
          {fmtDate(tx.date)} {fmtTime(tx.date)}
          {showUser ? ` · ${showUser}` : ''}
          {showRef ? ` · Ref: ${tx.ref}` : ''}
        </p>
      </div>
      <div className="text-right flex-shrink-0 space-y-1">
        <p className={clsx('font-mono text-sm font-bold', tx.type === 'credit' ? 'text-emerald-600' : 'text-red-500')}>
          {tx.type === 'credit' ? '+' : '-'}{fmtUSD(tx.amount)}
        </p>
        <StatusBadge status={tx.status} />
      </div>
    </div>
  )
}
