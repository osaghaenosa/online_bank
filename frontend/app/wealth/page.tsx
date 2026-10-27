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
    <div className="max-w-6xl space-y-5 sm:space-y-6 fade-up">
      {/* ── Header & Currency switcher ─────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#0052CC' }}>
            PRIVATE WEALTH &amp; TREASURY
          </p>
          <h2 className="font-display text-lg sm:text-2xl font-bold mt-0.5" style={{ color: '#002B5B' }}>
            Consolidated Portfolio Valuation
          </h2>
        </div>
        <div className="inline-flex self-start sm:self-auto border" style={{ background: '#FFFFFF', borderColor: '#CBD5E1' }}>
          {CURRENCIES.map(c => (
            <button
              key={c}
              onClick={() => setCur(c)}
              className="px-3.5 py-2 text-xs font-bold uppercase transition-all"
              style={{
                background: cur === c ? '#002B5B' : 'transparent',
                color: cur === c ? '#FFFFFF' : '#475569',
              }}
            >
              {CUR_SYMBOL[c]} {c}
            </button>
          ))}
        </div>
      </div>

      {/* ── Net worth hero ─────────────────────────────────────────── */}
      <div
        className="p-4 sm:p-7 border-2"
        style={{ background: '#002B5B', borderColor: '#0052CC', color: '#FFFFFF' }}
      >
        <p className="text-[11px] uppercase tracking-widest font-bold mb-1.5" style={{ color: '#93C5FD' }}>
          TOTAL CONSOLIDATED NET WORTH
        </p>
        <p className="font-mono text-2xl sm:text-4xl lg:text-5xl font-bold text-white mb-1 truncate">
          {fmt(netWorth, cur)}
        </p>
        {cur !== 'USD' && (
          <p className="text-xs font-mono" style={{ color: '#BFDBFE' }}>Equivalent to {fmtUSD(netWorth)} USD</p>
        )}
        <div className="flex flex-wrap gap-2 mt-4 sm:mt-6 pt-4 border-t" style={{ borderColor: '#1E3A5F' }}>
          <span
            className="px-2.5 py-1 text-[10px] sm:text-[11px] font-bold uppercase"
            style={{ background: '#0052CC', color: '#FFFFFF' }}
          >
            ✓ KYC VERIFIED
          </span>
          <span
            className="px-2.5 py-1 text-[10px] sm:text-[11px] font-bold uppercase border"
            style={{ background: '#001F42', borderColor: '#60A5FA', color: '#93C5FD' }}
          >
            FIDUCIARY CUSTODY ACTIVE
          </span>
          <span
            className="px-2.5 py-1 text-[10px] sm:text-[11px] font-bold uppercase border"
            style={{ background: '#001F42', borderColor: '#60A5FA', color: '#93C5FD' }}
          >
            MULTI-ASSET LEDGER
          </span>
        </div>
      </div>

      {/* ── Breakdown grid ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
        {SECTIONS.map(({ href, icon: Icon, color, label, value, sub }) => (
          <Link key={label} href={href}>
            <Card className="p-4 sm:p-5 cursor-pointer hover:bg-blue-50/30 transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div
                  className="w-10 h-10 flex items-center justify-center text-white flex-shrink-0"
                  style={{ background: color }}
                >
                  <Icon size={18} />
                </div>
                <ArrowRight
                  size={15}
                  className="opacity-40 group-hover:opacity-100 transition-opacity mt-1 flex-shrink-0"
                  style={{ color: '#0052CC' }}
                />
              </div>
              <p className="text-[11px] font-bold uppercase tracking-wider mb-1 truncate" style={{ color: 'var(--color-muted)' }}>
                {label}
              </p>
              <p className="text-lg sm:text-xl font-bold font-mono truncate" style={{ color: '#002B5B' }}>
                {fmt(value, cur)}
              </p>
              <div className="flex items-center justify-between gap-2 mt-2">
                <p className="text-xs truncate" style={{ color: 'var(--color-muted)' }}>{sub}</p>
                <span className="text-xs font-mono font-bold whitespace-nowrap flex-shrink-0" style={{ color: '#0052CC' }}>
                  {pct(value)}%
                </span>
              </div>
              <div className="mt-2 h-1.5 border" style={{ background: '#F1F5F9', borderColor: '#CBD5E1' }}>
                <div
                  className="h-full transition-all"
                  style={{ width: `${Math.min(100, parseFloat(pct(value)))}%`, background: '#0052CC' }}
                />
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* ── Linked accounts ────────────────────────────────────────── */}
      <div id="linked">
        <Card className="p-4 sm:p-6">
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
                  className="flex items-center justify-between gap-3 p-3.5 sm:p-4 border"
                  style={{ background: '#F8FAFC', borderColor: '#CBD5E1' }}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-base sm:text-lg flex-shrink-0 border"
                      style={{ background: '#FFFFFF', borderColor: '#CBD5E1' }}
                    >
                      {info.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-bold truncate" style={{ color: '#002B5B' }}>
                        {acc.label || info.label}
                      </p>
                      <p className="text-[11px] font-mono truncate" style={{ color: 'var(--color-muted)' }}>
                        {acc.accountId}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
                    <p className="text-xs sm:text-sm font-bold font-mono whitespace-nowrap" style={{ color: '#002B5B' }}>
                      {fmt(acc.balance || 0, cur)}
                    </p>
                    <Badge variant="blue">Connected</Badge>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      {/* ── Allocation bar ─────────────────────────────────────────── */}
      <Card className="p-4 sm:p-6">
        <SectionHeader title="Asset Class Allocation" />
        <div className="space-y-3.5">
          {SECTIONS.map(({ label, value }) => value > 0 && (
            <div key={label}>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-xs font-bold uppercase tracking-wider truncate" style={{ color: '#002B5B' }}>
                  {label}
                </span>
                <span className="text-xs font-mono font-bold whitespace-nowrap flex-shrink-0" style={{ color: '#0052CC' }}>
                  {fmt(value, cur)} · {pct(value)}%
                </span>
              </div>
              <div className="h-2.5 border" style={{ background: '#F1F5F9', borderColor: '#CBD5E1' }}>
                <div
                  className="h-full transition-all duration-700"
                  style={{ width: `${Math.min(100, parseFloat(pct(value)))}%`, background: '#0052CC' }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
