'use client'
import { useStore } from '@/store'
import { Card, SectionHeader, StatCard, Button, Divider } from '@/components/ui'
import { TxRow } from '@/components/shared/TxRow'
import { fmtUSD, maskCard } from '@/lib/utils'
import { Download, Upload, Send, List, ArrowRight, TrendingUp, TrendingDown, Target } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function DashboardPage() {
  const { state, me, myTxs } = useStore()
  const { theme } = state
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 400)
    return () => clearTimeout(t)
  }, [])

  const totalIn = myTxs.filter(t => t.type === 'credit' && t.status === 'completed').reduce((s, t) => s + t.amount, 0)
  const totalOut = myTxs.filter(t => t.type === 'debit' && t.status === 'completed').reduce((s, t) => s + t.amount, 0)
  const savingsGoal = 5000
  const saved = 1840
  const pct = Math.round((saved / savingsGoal) * 100)

  const quickActions = [
    { label: 'Deposit', icon: Download, href: '/deposit', color: 'bg-blue-50 text-blue-700' },
    { label: 'Withdraw', icon: Upload, href: '/withdraw', color: 'bg-red-50 text-red-700' },
    { label: 'Transfer', icon: Send, href: '/transfer', color: 'bg-emerald-50 text-emerald-700' },
    { label: 'History', icon: List, href: '/history', color: 'bg-violet-50 text-violet-700' },
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="shimmer h-52 rounded-2xl" />
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="shimmer h-28 rounded-2xl" />
              <div className="shimmer h-28 rounded-2xl" />
            </div>
            <div className="shimmer h-24 rounded-2xl" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Top grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Bank Card */}
        <div
          className="rounded-2xl p-7 relative overflow-hidden min-h-[200px] flex flex-col justify-between"
          style={{ background: theme.primaryColor, color: '#fff' }}
        >
          {/* Decorative circles */}
          <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/5" />
          <div className="absolute right-14 -bottom-14 w-44 h-44 rounded-full bg-white/4" />

          <div className="relative z-10">
            <p className="text-white/50 text-xs font-semibold uppercase tracking-widest">
              Standard Checking Account
            </p>
            <p className="text-3xl font-bold mt-2 mb-0.5 font-mono">{fmtUSD(me.balance)}</p>
            <p className="text-white/40 text-xs">Available Balance</p>
          </div>

          <div className="relative z-10 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-7 rounded bg-amber-400/80 flex items-center justify-center text-[8px] font-bold text-amber-900">
                CHIP
              </div>
            </div>
            <p className="font-mono text-sm tracking-[3px] text-white/75">{maskCard(me.cardNo)}</p>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-white/40 text-[10px] uppercase tracking-wider">Card Holder</p>
                <p className="text-white/90 text-sm font-semibold">{me.name.toUpperCase()}</p>
              </div>
              <div>
                <p className="text-white/40 text-[10px] uppercase tracking-wider">Expires</p>
                <p className="text-white/90 text-sm font-semibold font-mono">{me.expiry}</p>
              </div>
              <div className="flex -space-x-2">
                <div className="w-7 h-7 rounded-full bg-white/20" />
                <div className="w-7 h-7 rounded-full opacity-80" style={{ background: theme.accentColor }} />
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <StatCard
              label="Money In"
              value={fmtUSD(totalIn)}
              sub="This month"
              iconBg="bg-emerald-100"
              icon={<TrendingUp size={16} className="text-emerald-600" />}
            />
            <StatCard
              label="Money Out"
              value={fmtUSD(totalOut)}
              sub="This month"
              iconBg="bg-red-100"
              icon={<TrendingDown size={16} className="text-red-500" />}
            />
          </div>

          {/* Savings goal */}
          <Card className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                  Savings Goal
                </p>
                <p className="font-bold text-lg mt-0.5">
                  {fmtUSD(saved)}
                  <span className="text-sm font-normal ml-1" style={{ color: 'var(--color-muted)' }}>
                    / {fmtUSD(savingsGoal)}
                  </span>
                </p>
              </div>
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center bg-amber-100"
              >
                <Target size={16} className="text-amber-600" />
              </div>
            </div>
            <div className="h-2 rounded-full" style={{ background: 'var(--color-border)' }}>
              <div
                className="h-2 rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, background: theme.accentColor }}
              />
            </div>
            <p className="text-xs mt-1.5 font-medium" style={{ color: 'var(--color-muted)' }}>
              {pct}% of goal reached
            </p>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <SectionHeader title="Quick Actions" />
        <div className="grid grid-cols-4 gap-3">
          {quickActions.map(a => (
            <Link key={a.href} href={a.href}>
              <div className="flex flex-col items-center gap-2.5 p-4 rounded-2xl border cursor-pointer transition-all hover:shadow-sm group"
                style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${a.color}`}>
                  <a.icon size={20} />
                </div>
                <span className="text-xs font-semibold" style={{ color: 'var(--color-muted)' }}>
                  {a.label}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Transactions */}
      <Card className="p-6">
        <SectionHeader
          title="Recent Transactions"
          action={
            <Link href="/history">
              <Button variant="secondary" size="sm">
                View All <ArrowRight size={14} />
              </Button>
            </Link>
          }
        />
        {myTxs.slice(0, 5).length === 0 ? (
          <p className="text-center py-10 text-sm" style={{ color: 'var(--color-muted)' }}>
            No transactions yet
          </p>
        ) : (
          myTxs.slice(0, 5).map(tx => <TxRow key={tx.id} tx={tx} />)
        )}
      </Card>
    </div>
  )
}
