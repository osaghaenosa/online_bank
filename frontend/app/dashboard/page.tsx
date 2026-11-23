'use client'
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/store/auth'
import { api, fmtUSD } from '@/lib/api'
import { StatCard, StatusBadge } from '@/components/ui'
import { VirtualCardWidget } from '@/components/dashboard/VirtualCardWidget'
import { MoneyFlowChart } from '@/components/dashboard/MoneyFlowChart'
import { QuickTransferWidget } from '@/components/dashboard/QuickTransferWidget'
import { ReserveGoalRing } from '@/components/dashboard/ReserveGoalRing'
import { DashboardTransactionsCard } from '@/components/dashboard/DashboardTransactionsCard'
import { MarketRatesAndToolsCard } from '@/components/dashboard/MarketRatesAndToolsCard'
import {
  Download, Upload, Send, List, ArrowRight, TrendingUp, TrendingDown,
  ShieldCheck, Landmark, CreditCard, Eye, EyeOff, Copy, Check, Activity, Coins, Wallet
} from 'lucide-react'

export default function DashboardPage() {
  const { user, refreshUser, toast } = useAuth()
  const [data, setData] = useState<any>(null)
  const [allTxs, setAllTxs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [hideBalance, setHideBalance] = useState(false)
  const [copiedAcct, setCopiedAcct] = useState(false)
  const [greeting, setGreeting] = useState('Welcome back')

  useEffect(() => {
    const h = new Date().getHours()
    if (h < 12) setGreeting('Good morning')
    else if (h < 18) setGreeting('Good afternoon')
    else setGreeting('Good evening')
  }, [])

  const loadDashboard = useCallback(async () => {
    try {
      const [dashRes, listRes] = await Promise.allSettled([
        api.user.dashboard(),
        api.tx.list({ limit: '50' }),
      ])
      if (dashRes.status === 'fulfilled') {
        setData(dashRes.value)
      }
      if (listRes.status === 'fulfilled') {
        setAllTxs(listRes.value.transactions || [])
      } else if (dashRes.status === 'fulfilled') {
        setAllTxs(dashRes.value.recentTransactions || [])
      }
      await refreshUser()
    } catch {
      // keep silent; AuthProvider handles session expiry
    } finally {
      setLoading(false)
    }
  }, [refreshUser])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const totalIn  = data?.stats?.credit?.total || 0
  const totalOut = data?.stats?.debit?.total  || 0
  const netFlow  = totalIn - totalOut
  const recent   = allTxs.length > 0 ? allTxs : (data?.recentTransactions || [])

  const u = (user as any) || {}
  const crypto   = (u.cryptoAssets   || []).reduce((s: number, a: any) => s + (a.valueUSD || 0), 0)
  const treasury = (u.treasuryAssets || []).reduce((s: number, a: any) => s + (a.totalValue || 0), 0)
  const invest   = (u.investments    || []).reduce((s: number, a: any) => s + (a.currentValue || 0), 0)
  const linked   = (u.linkedAccounts || []).reduce((s: number, a: any) => s + (a.balance || 0), 0)
  const trust    = u.trust?.balance  || 0
  const netWorth = (u.balance || 0) + crypto + treasury + invest + linked + trust
  const hasWealth = netWorth > (u.balance || 0)

  const copyAccountNumber = () => {
    if (!user?.accountNumber) return
    navigator.clipboard?.writeText(user.accountNumber).catch(() => {})
    setCopiedAcct(true)
    toast('Account number copied', 'success')
    setTimeout(() => setCopiedAcct(false), 1800)
  }

  const QUICK = [
    { label: 'Deposit',  icon: Download, href: '/deposit' },
    { label: 'Transfer', icon: Send,     href: '/transfer' },
    { label: 'Withdraw', icon: Upload,   href: '/withdraw' },
    { label: 'History',  icon: List,     href: '/history' },
  ]

  const MOBILE_QUICK = [
    { label: 'Deposit',  icon: Download,   href: '/deposit' },
    { label: 'Transfer', icon: Send,       href: '/transfer' },
    { label: 'Withdraw', icon: Upload,     href: '/withdraw' },
    { label: 'Cards',    icon: CreditCard, href: '/card' },
  ]

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-8 space-y-5">
            <div className="shimmer h-56 rounded-3xl" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => <div key={i} className="shimmer h-28 rounded-2xl" />)}
            </div>
            <div className="shimmer h-64 rounded-2xl" />
          </div>
          <div className="xl:col-span-4 space-y-5">
            <div className="shimmer h-64 rounded-2xl" />
            <div className="shimmer h-80 rounded-2xl" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 fade-up">
      {/* ── KYC Under Review Notice (UXDA Floating Alert Style) ──────────────── */}
      {user?.kyc === 'Pending' && (
        <div className="rounded-2xl bg-white border border-blue-100 shadow-card p-4 flex items-start sm:items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-[#EBF2FF] text-[#0052CC] flex items-center justify-center flex-shrink-0">
            <ShieldCheck size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#002B5B]">
              KYC Documentation Under Review
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Your compliance documents have been received and are being verified by our onboarding desk (1–2 business days).
            </p>
          </div>
          <StatusBadge status="Pending" />
        </div>
      )}

      {/* ── Main 12-Col Bento Dashboard Workspace ────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* ══ LEFT / MAIN COLUMN (8 cols) ══════════════════════════════════ */}
        <div className="xl:col-span-8 space-y-6 min-w-0">
          {/* 1. Luminous Brand Hero Balance Card */}
          <div className="relative rounded-3xl brand-card-gradient p-5 sm:p-7 text-white overflow-hidden shadow-brand">
            {/* Ambient radial glow ornaments */}
            <div className="absolute -top-20 -right-16 w-64 h-64 rounded-full bg-[#3B82F6]/25 blur-2xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-16 w-60 h-60 rounded-full bg-white/10 blur-2xl pointer-events-none" />

            <div className="relative z-10 space-y-5">
              {/* Top Greeting & Account Status */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center flex-shrink-0">
                    <Landmark size={17} className="text-blue-200" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-blue-200 font-medium truncate">
                      {greeting}, {user?.firstName}
                    </p>
                    <p className="text-xs font-semibold text-white">Primary Checking Ledger</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={copyAccountNumber}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-mono font-semibold text-white transition-colors cursor-pointer"
                    title="Copy account number"
                  >
                    <span>•••• {String(user?.accountNumber || '').slice(-4)}</span>
                    {copiedAcct ? <Check size={12} className="text-[#60A5FA]" /> : <Copy size={12} className="text-blue-200" />}
                  </button>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 text-[11px] font-semibold text-white">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                    Active
                  </span>
                </div>
              </div>

              {/* Balance + Optional Wealth Net Worth */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-blue-200">Available Liquid Balance</span>
                    <button
                      type="button"
                      onClick={() => setHideBalance(v => !v)}
                      className="text-blue-200 hover:text-white transition-colors cursor-pointer"
                      aria-label={hideBalance ? 'Show balance' : 'Hide balance'}
                    >
                      {hideBalance ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  <p className="font-mono text-3xl sm:text-4xl lg:text-[42px] font-bold tracking-tight text-white truncate">
                    {hideBalance ? '••••••••' : fmtUSD(user?.balance || 0)}
                  </p>
                </div>

                {hasWealth && (
                  <Link
                    href="/wealth"
                    className="px-4 py-3 rounded-2xl glass hover:bg-white/20 transition-colors flex-shrink-0 sm:text-right"
                  >
                    <p className="text-[11px] font-medium text-blue-200">Total Portfolio Net Worth</p>
                    <p className="font-mono text-lg sm:text-xl font-bold text-white mt-0.5">
                      {hideBalance ? '••••••••' : fmtUSD(netWorth)}
                    </p>
                  </Link>
                )}
              </div>

              {/* Desktop / Tablet Glass Quick Actions */}
              <div className="hidden sm:flex flex-wrap items-center gap-2.5 pt-2 border-t border-white/15">
                {QUICK.map(({ label, icon: Icon, href }, idx) => (
                  <Link
                    key={href}
                    href={href}
                    className={
                      idx === 0
                        ? 'inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white text-[#002B5B] hover:bg-blue-50 text-xs font-semibold shadow-sm transition-all'
                        : 'inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/15 hover:bg-white/25 border border-white/15 text-white text-xs font-semibold transition-all'
                    }
                  >
                    <Icon size={14} />
                    <span>{label}</span>
                  </Link>
                ))}
                <Link
                  href="/account"
                  className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-blue-200 hover:text-white transition-colors"
                >
                  <span>Full Account Details</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          </div>

          {/* 2. Mobile-Only Native Circular Quick Action Row (Image 3 style) */}
          <div className="grid grid-cols-4 gap-2 sm:hidden">
            {MOBILE_QUICK.map(({ label, icon: Icon, href }) => (
              <Link key={href} href={href} className="flex flex-col items-center gap-1.5 group">
                <div className="w-[52px] h-[52px] rounded-2xl bg-white border border-slate-200/80 shadow-card flex items-center justify-center text-[#0052CC] group-active:scale-95 transition-transform">
                  <Icon size={20} />
                </div>
                <span className="text-[11px] font-semibold text-[#002B5B]">{label}</span>
              </Link>
            ))}
          </div>

          {/* 3. PayDay 4-KPI Statistics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
            <StatCard
              label="Total Inflow"
              value={hideBalance ? '••••••' : fmtUSD(totalIn)}
              sub="Cleared credits"
              trend="up"
              iconBg="bg-[#EBF2FF]"
              icon={<TrendingUp size={18} className="text-[#0052CC]" />}
            />
            <StatCard
              label="Total Outflow"
              value={hideBalance ? '••••••' : fmtUSD(totalOut)}
              sub="Cleared debits"
              iconBg="bg-slate-100"
              icon={<TrendingDown size={18} className="text-[#002B5B]" />}
            />
            <StatCard
              label="Net Cash Flow"
              value={hideBalance ? '••••••' : fmtUSD(netFlow)}
              sub={netFlow >= 0 ? 'Positive flow' : 'Net outflow'}
              trend={netFlow >= 0 ? 'up' : 'down'}
              iconBg="bg-[#ECFDF5]"
              icon={<Activity size={18} className="text-[#059669]" />}
            />
            <StatCard
              label={hasWealth ? 'Net Worth' : 'Reserve Vault'}
              value={hideBalance ? '••••••' : fmtUSD(hasWealth ? netWorth : (user?.savingsBalance || 0))}
              sub={hasWealth ? 'All holdings' : 'Savings balance'}
              iconBg="bg-[#EBF2FF]"
              icon={<Wallet size={18} className="text-[#0052CC]" />}
            />
          </div>

          {/* 4. Interactive Money Flow Spline Chart */}
          <MoneyFlowChart transactions={recent} />

          {/* 5. UXDA-Style Recent Activities Card */}
          <DashboardTransactionsCard transactions={recent} />

          {/* 6. UXDA Bottom Information Strip (Currency Rates + Products/Tools) */}
          <MarketRatesAndToolsCard balance={user?.balance || 0} />
        </div>

        {/* ══ RIGHT RAIL (4 cols) ══════════════════════════════════════════ */}
        <div className="xl:col-span-4 space-y-6 min-w-0">
          {/* 1. Visual Debit Card */}
          <VirtualCardWidget user={user} />

          {/* 2. Quick Send Money + Recent Contacts */}
          <QuickTransferWidget
            user={user}
            transactions={recent}
            onSuccess={loadDashboard}
          />

          {/* 3. Circular Reserve Progress Donut (Image 3 style) */}
          <ReserveGoalRing
            savingsBalance={user?.savingsBalance || 0}
            savingsGoal={user?.savingsGoal || 5000}
          />

          {/* 4. Security & Routing Snapshot Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-sm text-[#002B5B]">Account &amp; Security</h3>
              <StatusBadge status={user?.kyc || 'Not Started'} />
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">ABA Routing</span>
                <span className="font-mono font-bold text-[#002B5B]">{user?.routingNumber || '021000021'}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Coins size={13} className="text-[#0052CC]" />
                  Security Tokens
                </span>
                <Link href="/tokens" className="font-mono font-bold text-[#0052CC] hover:underline">
                  {(user as any)?.tokenBalance || 0} TTN →
                </Link>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-500">FDIC Insurance</span>
                <span className="font-semibold text-[#059669]">Up to $250,000</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
