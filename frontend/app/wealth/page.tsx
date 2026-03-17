'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/store/auth'
import { fmtUSD, convertCurrency, PLATFORM_LABELS } from '@/lib/api'
import { Card, SectionHeader, Badge } from '@/components/ui'
import {
  Bitcoin, TrendingUp, Shield, Building, Wallet,
  ArrowRight, DollarSign, PiggyBank, Lock
} from 'lucide-react'

const CURRENCIES = ['USD', 'GBP', 'EUR'] as const
type Currency = typeof CURRENCIES[number]
const CUR_SYMBOL: Record<Currency, string> = { USD: '$', GBP: '£', EUR: '€' }
const FX: Record<Currency, number> = { USD: 1, GBP: 0.79, EUR: 0.92 }

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
      icon: Wallet, color: '#10B981', bg: 'rgba(16,185,129,.12)',
      label: 'Checking Account', value: u.balance,
      sub: 'Main balance',
    },
    {
      href: '/wealth/crypto',
      icon: Bitcoin, color: '#F59E0B', bg: 'rgba(245,158,11,.12)',
      label: 'Crypto Assets', value: crypto,
      sub: `${(u.cryptoAssets || []).length} coins`,
    },
    {
      href: '/wealth/treasury',
      icon: Shield, color: '#8B5CF6', bg: 'rgba(139,92,246,.12)',
      label: 'Treasury & Assets', value: treasury,
      sub: `${(u.treasuryAssets || []).length} items`,
    },
    {
      href: '/wealth/investments',
      icon: TrendingUp, color: '#3B82F6', bg: 'rgba(59,130,246,.12)',
      label: 'Investments', value: invest,
      sub: `${(u.investments || []).length} holdings`,
    },
    {
      href: '/wealth/trust',
      icon: Lock, color: '#EC4899', bg: 'rgba(236,72,153,.12)',
      label: 'Trust Fund', value: trust,
      sub: u.trust?.name || 'Family Trust',
    },
    {
      href: '#linked',
      icon: Building, color: '#06B6D4', bg: 'rgba(6,182,212,.12)',
      label: 'Linked Accounts', value: linked,
      sub: `${(u.linkedAccounts || []).length} accounts`,
    },
  ]

  const pct = (val: number) => netWorth > 0 ? ((val / netWorth) * 100).toFixed(1) : '0'

  return (
    <div className="max-w-6xl space-y-6 fade-up">

      {/* ── Currency switcher ──────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold">Wealth Overview</h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-muted)' }}>
            Total net worth across all assets and accounts
          </p>
        </div>
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          {CURRENCIES.map(c => (
            <button key={c} onClick={() => setCur(c)}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              style={{
                background: cur === c ? '#0F1C35' : 'transparent',
                color: cur === c ? '#fff' : 'var(--color-muted)',
              }}>
              {CUR_SYMBOL[c]} {c}
            </button>
          ))}
        </div>
      </div>

      {/* ── Net worth hero ─────────────────────────────────────────── */}
      <Card className="p-8 relative overflow-hidden" style={{ background: '#0F1C35' }}>
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #10B981, transparent 70%)' }} />
        <div className="relative z-10">
          <p className="text-xs text-white/40 uppercase tracking-widest font-semibold mb-2">Total Net Worth</p>
          <p className="font-display text-5xl font-bold text-white mb-1">{fmt(netWorth, cur)}</p>
          {cur !== 'USD' && (
            <p className="text-sm text-white/40">= {fmtUSD(netWorth)} USD</p>
          )}
          <div className="flex flex-wrap gap-3 mt-5">
            <span className="px-3 py-1 rounded-full text-xs font-semibold"
              style={{ background: 'rgba(16,185,129,.2)', color: '#10B981' }}>
              ✓ KYC Verified
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold"
              style={{ background: 'rgba(245,158,11,.2)', color: '#F59E0B' }}>
              🔒 Trust Active
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold"
              style={{ background: 'rgba(139,92,246,.2)', color: '#A78BFA' }}>
              📊 20 Investments
            </span>
          </div>
        </div>
      </Card>

      {/* ── Breakdown grid ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {SECTIONS.map(({ href, icon: Icon, color, bg, label, value, sub }) => (
          <Link key={label} href={href}>
            <Card className="p-5 cursor-pointer hover:shadow-md transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: bg }}>
                  <Icon size={20} style={{ color }} />
                </div>
                <ArrowRight size={15} className="opacity-0 group-hover:opacity-100 transition-opacity mt-1"
                  style={{ color: 'var(--color-muted)' }} />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--color-muted)' }}>{label}</p>
              <p className="text-xl font-bold font-mono">{fmt(value, cur)}</p>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{sub}</p>
                <span className="text-xs font-semibold" style={{ color }}>{pct(value)}%</span>
              </div>
              {/* Progress bar */}
              <div className="mt-2 h-1 rounded-full" style={{ background: 'var(--color-border)' }}>
                <div className="h-1 rounded-full transition-all"
                  style={{ width: `${Math.min(100, parseFloat(pct(value)))}%`, background: color }} />
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* ── Linked accounts ────────────────────────────────────────── */}
      <div id="linked">
      <Card className="p-6">
        <SectionHeader title="Linked Bank Accounts & Platforms" sub={`${(u.linkedAccounts || []).length} accounts · ${fmt(linked, cur)} total`} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(u.linkedAccounts || []).map((acc: any, i: number) => {
            const info = PLATFORM_LABELS[acc.platform] || { label: acc.label, color: '#6B7A99', icon: '🏦' }
            return (
              <div key={i} className="flex items-center gap-4 p-4 rounded-xl"
                style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                  style={{ background: info.color + '18' }}>
                  {info.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{acc.label || info.label}</p>
                  <p className="text-xs font-mono truncate" style={{ color: 'var(--color-muted)' }}>{acc.accountId}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold font-mono">{fmt(acc.balance || 0, cur)}</p>
                  <Badge variant="green">Active</Badge>
                </div>
              </div>
            )
          })}
        </div>
      </Card>
      </div>

      {/* ── Allocation bar ─────────────────────────────────────────── */}
      <Card className="p-6">
        <SectionHeader title="Portfolio Allocation" />
        <div className="space-y-3">
          {SECTIONS.map(({ label, value, color }) => value > 0 && (
            <div key={label}>
              <div className="flex justify-between mb-1">
                <span className="text-xs font-semibold">{label}</span>
                <span className="text-xs font-mono font-bold">{fmt(value, cur)} · {pct(value)}%</span>
              </div>
              <div className="h-2 rounded-full" style={{ background: 'var(--color-border)' }}>
                <div className="h-2 rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, parseFloat(pct(value)))}%`, background: color }} />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
