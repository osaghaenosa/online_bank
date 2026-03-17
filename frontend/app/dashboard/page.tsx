'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/store/auth'
import { api, fmtUSD } from '@/lib/api'
import { Card, StatCard, SectionHeader, Button } from '@/components/ui'
import { TxRow } from '@/components/shared/TxRow'
import { Download, Upload, Send, List, ArrowRight, TrendingUp, TrendingDown, Target, Zap } from 'lucide-react'

export default function DashboardPage() {
  const { user, refreshUser } = useAuth()
  const [data,    setData]    = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.user.dashboard()
      .then(d => { setData(d); refreshUser() })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const totalIn  = data?.stats?.credit?.total || 0
  const totalOut = data?.stats?.debit?.total  || 0
  const recent   = data?.recentTransactions   || []
  const pct = user ? Math.min(100, Math.round(((user.savingsBalance || 0) / (user.savingsGoal || 5000)) * 100)) : 0

  const QUICK = [
    { label: 'Deposit',  icon: Download, href: '/deposit',  bg: 'bg-blue-50',    ic: 'text-blue-600' },
    { label: 'Withdraw', icon: Upload,   href: '/withdraw', bg: 'bg-red-50',     ic: 'text-red-600' },
    { label: 'Transfer', icon: Send,     href: '/transfer', bg: 'bg-emerald-50', ic: 'text-emerald-600' },
    { label: 'History',  icon: List,     href: '/history',  bg: 'bg-violet-50',  ic: 'text-violet-600' },
  ]

  if (loading) return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="shimmer h-48 rounded-2xl" />
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="shimmer h-24 rounded-2xl" />
            <div className="shimmer h-24 rounded-2xl" />
          </div>
          <div className="shimmer h-20 rounded-2xl" />
        </div>
      </div>
      <div className="shimmer h-64 rounded-2xl" />
    </div>
  )

  return (
    <div className="space-y-5 fade-up">
      {/* ── Top grid ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">

        {/* Bank card */}
        <div className="rounded-2xl p-5 sm:p-7 relative overflow-hidden min-h-[190px] sm:min-h-[210px] flex flex-col justify-between"
          style={{ background: '#0F1C35', color: '#fff' }}>
          <div className="absolute -right-10 -top-10 w-52 h-52 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute right-16 -bottom-14 w-44 h-44 rounded-full pointer-events-none"
            style={{ background: 'rgba(16,185,129,.06)' }} />
          <div className="relative z-10">
            <p className="text-white/50 text-xs font-semibold uppercase tracking-widest">Standard Checking</p>
            <p className="text-2xl sm:text-3xl font-bold mt-2 mb-0.5 font-mono break-all">{fmtUSD(user?.balance || 0)}</p>
            <p className="text-white/40 text-xs">Available Balance</p>
          </div>
          <div className="relative z-10 space-y-2 sm:space-y-3">
            <div className="w-9 h-6 rounded bg-amber-400/75 flex items-center justify-center text-[8px] font-bold text-amber-900">CHIP</div>
            <p className="font-mono text-xs sm:text-sm tracking-[2px] sm:tracking-[3px] text-white/65">
              •••• •••• •••• {String(user?.accountNumber || '').slice(-4)}
            </p>
            <div className="flex items-end justify-between gap-2">
              <div className="min-w-0">
                <p className="text-white/35 text-[10px] uppercase tracking-wider">Card Holder</p>
                <p className="text-white/90 text-xs sm:text-sm font-semibold truncate">
                  {user?.firstName?.toUpperCase()} {user?.lastName?.toUpperCase()}
                </p>
              </div>
              <div className="flex-shrink-0">
                <p className="text-white/35 text-[10px] uppercase tracking-wider">Expires</p>
                <p className="text-white/90 text-xs sm:text-sm font-semibold font-mono">{user?.cardExpiry}</p>
              </div>
              <div className="flex -space-x-2 flex-shrink-0">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/20" />
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full opacity-80" style={{ background: '#10B981' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <StatCard label="Money In"  value={fmtUSD(totalIn)}  sub="Completed"
              iconBg="bg-emerald-100" icon={<TrendingUp  size={16} className="text-emerald-600" />} />
            <StatCard label="Money Out" value={fmtUSD(totalOut)} sub="Completed"
              iconBg="bg-red-100"     icon={<TrendingDown size={16} className="text-red-500" />} />
          </div>

          {/* Savings goal */}
          <Card className="p-4 sm:p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="min-w-0 mr-2">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>Savings Goal</p>
                <p className="font-bold text-base sm:text-lg mt-0.5 break-words">
                  {fmtUSD(user?.savingsBalance || 0)}
                  <span className="text-sm font-normal ml-1" style={{ color: 'var(--color-muted)' }}>
                    / {fmtUSD(user?.savingsGoal || 5000)}
                  </span>
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-amber-100 flex-shrink-0">
                <Target size={16} className="text-amber-600" />
              </div>
            </div>
            <div className="h-2 rounded-full" style={{ background: 'var(--color-border)' }}>
              <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: '#10B981' }} />
            </div>
            <p className="text-xs mt-1.5 font-medium" style={{ color: 'var(--color-muted)' }}>{pct}% of goal reached</p>
          </Card>
        </div>
      </div>

      {/* ── KYC banner ──────────────────────────────────────────── */}
      {user?.kyc === 'Pending' && (
        <div className="flex items-start sm:items-center gap-3 p-4 rounded-xl flex-wrap sm:flex-nowrap"
          style={{ background: '#FEF3C7', border: '1px solid #FCD34D' }}>
          <Zap size={16} className="text-amber-600 flex-shrink-0 mt-0.5 sm:mt-0" />
          <p className="text-sm text-amber-700 font-medium flex-1">
            Complete KYC verification to unlock all features and higher limits.
          </p>
          <Link href="/profile" className="flex-shrink-0">
            <Button variant="secondary" size="sm" style={{ borderColor: '#F59E0B', color: '#B45309' }}>
              Verify Now
            </Button>
          </Link>
        </div>
      )}

      {/* ── Quick actions ────────────────────────────────────────── */}
      <div>
        <SectionHeader title="Quick Actions" />
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {QUICK.map(({ label, icon: Icon, href, bg, ic }) => (
            <Link key={href} href={href}>
              <div className="flex flex-col items-center gap-1.5 sm:gap-2.5 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border cursor-pointer hover:shadow-sm transition-all"
                style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center ${bg}`}>
                  <Icon size={17} className={ic} />
                </div>
                <span className="text-[10px] sm:text-xs font-semibold text-center" style={{ color: 'var(--color-muted)' }}>
                  {label}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Recent transactions ──────────────────────────────────── */}
      <Card className="p-4 sm:p-6">
        <SectionHeader title="Recent Transactions" action={
          <Link href="/history">
            <Button variant="secondary" size="sm">
              <span className="hidden sm:inline">View All</span>
              <span className="sm:hidden">All</span>
              <ArrowRight size={14} />
            </Button>
          </Link>
        } />
        {recent.length === 0
          ? <p className="text-center py-10 text-sm" style={{ color: 'var(--color-muted)' }}>No transactions yet</p>
          : recent.map((tx: any) => <TxRow key={tx._id} tx={tx} compact />)
        }
      </Card>

    </div>
  )
}
