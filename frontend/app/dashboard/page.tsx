'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/store/auth'
import { api, fmtUSD } from '@/lib/api'
import { Card, StatCard, SectionHeader, Button } from '@/components/ui'
import { TxRow } from '@/components/shared/TxRow'
import { Download, Upload, Send, List, ArrowRight, TrendingUp, TrendingDown, Target, ShieldCheck, Landmark, CreditCard } from 'lucide-react'

export default function DashboardPage() {
  const { user, refreshUser } = useAuth()
  const [data, setData] = useState<any>(null)
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

  const u = (user as any) || {}
  const crypto   = (u.cryptoAssets   || []).reduce((s: number, a: any) => s + (a.valueUSD || 0), 0)
  const treasury = (u.treasuryAssets || []).reduce((s: number, a: any) => s + (a.totalValue || 0), 0)
  const invest   = (u.investments    || []).reduce((s: number, a: any) => s + (a.currentValue || 0), 0)
  const linked   = (u.linkedAccounts || []).reduce((s: number, a: any) => s + (a.balance || 0), 0)
  const trust    = u.trust?.balance  || 0
  const netWorth = (u.balance || 0) + crypto + treasury + invest + linked + trust
  const hasWealth = netWorth > (u.balance || 0)

  const QUICK = [
    { label: 'Deposit Funds', code: 'DEP', icon: Download, href: '/deposit' },
    { label: 'Withdraw Funds', code: 'WTH', icon: Upload, href: '/withdraw' },
    { label: 'Wire / Transfer', code: 'TRF', icon: Send, href: '/transfer' },
    { label: 'Audit History', code: 'HIS', icon: List, href: '/history' },
  ]

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="shimmer h-52" />
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="shimmer h-24" />
              <div className="shimmer h-24" />
            </div>
            <div className="shimmer h-24" />
          </div>
        </div>
        <div className="shimmer h-64" />
      </div>
    )
  }

  return (
    <div className="space-y-6 fade-up">
      {/* ── Top Institutional Summary Grid ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Primary Checking Account Ledger Box (7 cols) */}
        <div
          className="lg:col-span-7 border-2 flex flex-col justify-between"
          style={{ background: '#002B5B', borderColor: '#0052CC', color: '#FFFFFF' }}
        >
          {/* Top Bar */}
          <div
            className="px-5 py-3.5 border-b flex flex-wrap items-center justify-between gap-2"
            style={{ background: '#001F42', borderColor: '#1E3A5F' }}
          >
            <div className="flex items-center gap-2">
              <Landmark size={15} style={{ color: '#60A5FA' }} />
              <span className="text-xs font-mono uppercase tracking-widest font-bold text-white">
                PRIMARY CHECKING LEDGER
              </span>
            </div>
            <span
              className="px-2.5 py-0.5 text-[10px] font-mono uppercase font-bold"
              style={{ background: '#0052CC', color: '#FFFFFF' }}
            >
              STATUS: ACTIVE
            </span>
          </div>

          {/* Center Balance */}
          <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#93C5FD' }}>
                AVAILABLE LIQUID BALANCE (USD)
              </p>
              <p className="text-2xl sm:text-4xl font-bold mt-1 font-mono truncate text-white">
                {fmtUSD(user?.balance || 0)}
              </p>
            </div>
            {hasWealth && (
              <div
                className="p-3 border sm:text-right flex-shrink-0"
                style={{ background: '#001F42', borderColor: '#0052CC' }}
              >
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#93C5FD' }}>
                  TOTAL PORTFOLIO NET WORTH
                </p>
                <p className="text-base sm:text-xl font-bold font-mono mt-0.5 truncate" style={{ color: '#60A5FA' }}>
                  {fmtUSD(netWorth)}
                </p>
              </div>
            )}
          </div>

          {/* Bottom Account Metadata Strip */}
          <div
            className="px-4 sm:px-5 py-3.5 border-t grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4"
            style={{ background: '#001F42', borderColor: '#1E3A5F' }}
          >
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase" style={{ color: '#93C5FD' }}>ACCOUNT HOLDER</p>
              <p className="text-xs font-bold uppercase truncate text-white mt-0.5">
                {user?.firstName} {user?.lastName}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase" style={{ color: '#93C5FD' }}>ACCOUNT NUMBER</p>
              <p className="text-xs font-mono font-bold text-white mt-0.5">
                •••• {String(user?.accountNumber || '').slice(-4)}
              </p>
            </div>
            <div className="col-span-2 sm:col-span-1 flex sm:justify-end items-center pt-1 sm:pt-0 border-t sm:border-t-0" style={{ borderColor: '#1E3A5F' }}>
              <Link
                href="/account"
                className="text-[11px] uppercase font-bold flex items-center gap-1 hover:underline"
                style={{ color: '#60A5FA' }}
              >
                Full Account Details <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </div>

        {/* Right: Inflow / Outflow & Reserve Target (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-3.5 sm:gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
            <StatCard
              label="Total Credits (In)"
              value={fmtUSD(totalIn)}
              sub="Cleared Inflows"
              iconBg="bg-blue-50"
              icon={<TrendingUp size={15} style={{ color: '#0052CC' }} />}
            />
            <StatCard
              label="Total Debits (Out)"
              value={fmtUSD(totalOut)}
              sub="Cleared Outflows"
              iconBg="bg-slate-100"
              icon={<TrendingDown size={15} style={{ color: '#002B5B' }} />}
            />
          </div>

          {/* Reserve / Savings Target */}
          <Card className="p-4 sm:p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="min-w-0 mr-2">
                <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#0052CC' }}>
                  RESERVE VAULT ALLOCATION
                </p>
                <p className="font-mono font-bold text-base sm:text-lg mt-0.5" style={{ color: '#002B5B' }}>
                  {fmtUSD(user?.savingsBalance || 0)}
                  <span className="text-xs font-normal ml-1.5" style={{ color: '#64748B' }}>
                    of {fmtUSD(user?.savingsGoal || 5000)} target
                  </span>
                </p>
              </div>
              <div
                className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center flex-shrink-0"
                style={{ background: '#002B5B', color: '#FFFFFF' }}
              >
                <Target size={15} />
              </div>
            </div>
            <div className="h-2.5 w-full border" style={{ background: '#F1F5F9', borderColor: '#CBD5E1' }}>
              <div
                className="h-full transition-all duration-700"
                style={{ width: `${pct}%`, background: '#0052CC' }}
              />
            </div>
            <div className="flex justify-between items-center mt-2 text-xs font-semibold" style={{ color: '#475569' }}>
              <span>{pct}% OF TARGET REACHED</span>
              <Link href="/account" className="font-bold underline" style={{ color: '#0052CC' }}>
                Manage Reserve
              </Link>
            </div>
          </Card>
        </div>
      </div>

      {/* ── KYC Status Notices ───────────────────────────────────── */}
      {user?.kyc === 'Pending' && (
        <div
          className="flex items-start sm:items-center gap-3 p-4 border-l-4"
          style={{ background: '#EBF2FF', borderColor: '#0052CC' }}
        >
          <ShieldCheck size={18} style={{ color: '#0052CC' }} className="flex-shrink-0 mt-0.5 sm:mt-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#002B5B' }}>
              KYC Documentation Under Review
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#1E3A5F' }}>
              Your compliance documents have been received and are being verified by our onboarding desk (1–2 business days).
            </p>
          </div>
        </div>
      )}

      {/* ── Quick Command Bar ────────────────────────────────────── */}
      <div>
        <SectionHeader title="Quick Banking Actions" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          {QUICK.map(({ label, code, icon: Icon, href }) => (
            <Link key={href} href={href}>
              <div
                className="flex items-center gap-2.5 sm:gap-3 p-3 sm:p-4 bg-white border cursor-pointer transition-colors hover:bg-blue-50/50"
                style={{ borderColor: '#CBD5E1', borderTop: '3px solid #002B5B' }}
              >
                <div
                  className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center flex-shrink-0"
                  style={{ background: '#0052CC', color: '#FFFFFF' }}
                >
                  <Icon size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase" style={{ color: '#64748B' }}>
                    {code}
                  </p>
                  <p className="text-xs sm:text-sm font-bold truncate" style={{ color: '#002B5B' }}>
                    {label}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Recent Ledger Transactions ───────────────────────────── */}
      <Card className="p-4 sm:p-6">
        <SectionHeader
          title="Recent Ledger Activity"
          action={
            <Link href="/history">
              <Button variant="secondary" size="xs">
                <span>View All</span>
                <ArrowRight size={12} />
              </Button>
            </Link>
          }
        />
        {recent.length === 0 ? (
          <p className="text-center py-10 text-sm" style={{ color: 'var(--color-muted)' }}>
            No recorded transactions on this ledger yet.
          </p>
        ) : (
          <div className="divide-y" style={{ borderColor: '#E2E8F0' }}>
            {recent.map((tx: any) => (
              <TxRow key={tx._id} tx={tx} compact />
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
