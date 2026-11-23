'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/store/auth'
import { fmtUSD, convertCurrency, PLATFORM_LABELS } from '@/lib/api'
import { Card, SectionHeader, Badge } from '@/components/ui'
import {
  Bitcoin, TrendingUp, Shield, Building, Wallet,
  ArrowRight, Lock
} from 'lucide-react'

const CURRENCIES = ['USD', 'GBP', 'EUR'] as const
type Currency = typeof CURRENCIES[number]
const CUR_SYMBOL: Record<Currency, string> = { USD: '$', GBP: '£', EUR: '€' }

function fmt(usd: number, cur: Currency) {
  return convertCurrency(usd, cur)
}

export default function WealthPage() {
  const { user } = useAuth()
  const [cur, setCur] = useState<Currency>('USD')

  if (!user) return null

  const u = user as any

  const crypto   = (u.cryptoAssets    || []).reduce((s: number, a: any) => s + (a.valueUSD || 0), 0)
  const treasury = (u.treasuryAssets  || []).reduce((s: number, a: any) => s + (a.totalValue || 0), 0)
  const invest   = (u.investments     || []).reduce((s: number, a: any) => s + (a.currentValue || 0), 0)
  const linked   = (u.linkedAccounts  || []).reduce((s: number, a: any) => s + (a.balance || 0), 0)
  const trust    = u.trust?.balance   || 0
  const netWorth = u.balance + crypto + treasury + invest + linked + trust

  const SECTIONS = [
    {
      href: '/deposit',
      icon: Wallet,
      color: '#0052CC',
      label: 'Checking & Liquidity',
      value: u.balance,
      sub: 'Primary balance',
    },
    {
      href: '/wealth/crypto',
      icon: Bitcoin,
      color: '#002B5B',
      label: 'Digital Asset Treasury',
      value: crypto,
      sub: `${(u.cryptoAssets || []).length} assets`,
    },
    {
      href: '/wealth/treasury',
      icon: Shield,
      color: '#0052CC',
      label: 'Treasury & Reserves',
      value: treasury,
      sub: `${(u.treasuryAssets || []).length} holdings`,
    },
    {
      href: '/wealth/investments',
      icon: TrendingUp,
      color: '#002B5B',
      label: 'Equities & Investments',
      value: invest,
      sub: `${(u.investments || []).length} positions`,
    },
    {
      href: '/wealth/trust',
      icon: Lock,
      color: '#0052CC',
      label: 'Fiduciary Trust Fund',
      value: trust,
      sub: u.trust?.name || 'Family Trust',
    },
    {
      href: '#linked',
      icon: Building,
      color: '#002B5B',
      label: 'Linked Institutions',
      value: linked,
      sub: `${(u.linkedAccounts || []).length} accounts`,
    },
  ]

  const pct = (val: number) => netWorth > 0 ? ((val / netWorth) * 100).toFixed(1) : '0'

  return (
    <div className="max-w-6xl space-y-6 fade-up">
      {/* ── Header & Currency switcher ─────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="inline-block px-3 py-1 rounded-full text-[11px] font-semibold bg-[#EBF2FF] text-[#0052CC] mb-1.5">
            Private Wealth &amp; Treasury
          </span>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-[#002B5B]">
            Consolidated Portfolio Valuation
          </h2>
        </div>
        <div className="inline-flex self-start sm:self-auto rounded-full p-1 bg-white border border-slate-200/80 shadow-sm">
          {CURRENCIES.map(c => (
            <button
              key={c}
              onClick={() => setCur(c)}
              className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer"
              style={{
                background: cur === c ? '#0052CC' : 'transparent',
                color: cur === c ? '#FFFFFF' : '#475569',
              }}
            >
              {CUR_SYMBOL[c]} {c}
            </button>
          ))}
        </div>
      </div>

      {/* ── Net worth hero ─────────────────────────────────────────── */}
      <div className="p-6 sm:p-8 rounded-3xl brand-card-gradient text-white shadow-brand relative overflow-hidden">
        <div className="absolute -top-20 -right-16 w-64 h-64 rounded-full bg-[#3B82F6]/25 blur-2xl pointer-events-none" />
        <p className="text-xs font-medium text-blue-200 mb-1.5">
          Total Consolidated Net Worth
        </p>
        <p className="font-mono text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-1 truncate">
          {fmt(netWorth, cur)}
        </p>
        {cur !== 'USD' && (
          <p className="text-xs font-mono text-blue-100">Equivalent to {fmtUSD(netWorth)} USD</p>
        )}
        <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-white/15">
          <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-white/15 text-white">
            ✓ KYC Verified
          </span>
          <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-white/10 border border-white/15 text-blue-100">
            Fiduciary Custody Active
          </span>
          <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-white/10 border border-white/15 text-blue-100">
            Multi-Asset Ledger
          </span>
        </div>
      </div>

      {/* ── Breakdown grid ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {SECTIONS.map(({ href, icon: Icon, color, label, value, sub }) => (
          <Link key={label} href={href}>
            <Card className="p-5 cursor-pointer hover:shadow-card-hover transition-all group">
              <div className="flex items-start justify-between mb-3.5">
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center text-white flex-shrink-0 shadow-sm"
                  style={{ background: color }}
                >
                  <Icon size={19} />
                </div>
                <ArrowRight
                  size={16}
                  className="opacity-40 group-hover:opacity-100 transition-opacity mt-1 flex-shrink-0 text-[#0052CC]"
                />
              </div>
              <p className="text-xs font-semibold mb-1 truncate text-slate-500">
                {label}
              </p>
              <p className="text-xl font-bold font-mono truncate text-[#002B5B]">
                {fmt(value, cur)}
              </p>
              <div className="flex items-center justify-between gap-2 mt-2">
                <p className="text-xs truncate text-slate-400">{sub}</p>
                <span className="text-xs font-mono font-bold whitespace-nowrap flex-shrink-0 text-[#0052CC]">
                  {pct(value)}%
                </span>
              </div>
              <div className="mt-2.5 h-2 rounded-full bg-[#F4F7FC] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, parseFloat(pct(value)))}%`, background: '#0052CC' }}
                />
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* ── Linked accounts ────────────────────────────────────────── */}
      <div id="linked">
        <Card className="p-5 sm:p-6">
          <SectionHeader
            title="Linked External Institutions"
            sub={`${(u.linkedAccounts || []).length} connected accounts · ${fmt(linked, cur)} total`}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(u.linkedAccounts || []).map((acc: any, i: number) => {
              const info = PLATFORM_LABELS[acc.platform] || { label: acc.label, color: '#002B5B', icon: '🏦' }
              return (
                <div
                  key={i}
                  className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-[#F4F7FC]"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 bg-white shadow-sm">
                      {info.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-bold truncate text-[#002B5B]">
                        {acc.label || info.label}
                      </p>
                      <p className="text-[11px] font-mono truncate text-slate-400">
                        {acc.accountId}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
                    <p className="text-xs sm:text-sm font-bold font-mono whitespace-nowrap text-[#002B5B]">
                      {fmt(acc.balance || 0, cur)}
                    </p>
                    <Badge variant="green">Connected</Badge>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      {/* ── Allocation bar ─────────────────────────────────────────── */}
      <Card className="p-5 sm:p-6">
        <SectionHeader title="Asset Class Allocation" />
        <div className="space-y-4">
          {SECTIONS.map(({ label, value }) => value > 0 && (
            <div key={label}>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-xs font-semibold truncate text-[#002B5B]">
                  {label}
                </span>
                <span className="text-xs font-mono font-bold whitespace-nowrap flex-shrink-0 text-[#0052CC]">
                  {fmt(value, cur)} · {pct(value)}%
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-[#F4F7FC] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, parseFloat(pct(value)))}%`, background: 'linear-gradient(90deg, #0052CC 0%, #60A5FA 100%)' }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
