'use client'
import { useState } from 'react'
import { useAuth } from '@/store/auth'
import { fmtUSD, convertCurrency } from '@/lib/api'
import { Card, SectionHeader } from '@/components/ui'
import { Lock, ArrowLeft, Users, Calendar, FileText, Shield } from 'lucide-react'
import Link from 'next/link'

const CURRENCIES = ['USD', 'GBP', 'EUR'] as const
type Currency = typeof CURRENCIES[number]
const CUR_SYMBOL: Record<Currency, string> = { USD: '$', GBP: '£', EUR: '€' }

const TRUST_TYPE_LABELS: Record<string, string> = {
  revocable:    'Revocable Living Trust',
  irrevocable:  'Irrevocable Trust',
  living:       'Living Trust',
  testamentary: 'Testamentary Trust',
}

export default function TrustPage() {
  const { user } = useAuth()
  const [cur, setCur] = useState<Currency>('USD')

  if (!user) return null
  const u = user as any
  const trust = u.trust

  function fmt(usd: number) { return convertCurrency(usd, cur) }

  if (!trust?.enabled) {
    return (
      <div className="max-w-2xl mx-auto fade-up">
        <div className="flex items-center gap-3 mb-5">
          <Link href="/wealth">
            <button className="p-2 border" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
              <ArrowLeft size={16} />
            </button>
          </Link>
          <h2 className="font-display text-lg sm:text-2xl font-bold" style={{ color: '#002B5B' }}>Trust Fund</h2>
        </div>
        <Card className="p-8 sm:p-10 text-center">
          <Lock size={44} className="mx-auto mb-4 opacity-20" />
          <h3 className="font-bold text-lg sm:text-xl mb-2" style={{ color: '#002B5B' }}>No Trust Fund</h3>
          <p className="text-xs sm:text-sm" style={{ color: 'var(--color-muted)' }}>
            This account has no active trust fund. Contact your wealth advisor to establish one.
          </p>
        </Card>
      </div>
    )
  }

  const typeLabel   = TRUST_TYPE_LABELS[trust.type] || trust.type
  const established = trust.established ? new Date(trust.established) : null
  const yearsActive = established ? Math.round((new Date('2025-01-01').getTime() - established.getTime()) / (365.25 * 24 * 3600 * 1000)) : 0

  return (
    <div className="max-w-4xl space-y-4 sm:space-y-5 fade-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/wealth">
            <button
              className="p-2 border transition-all hover:opacity-80"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
            >
              <ArrowLeft size={16} />
            </button>
          </Link>
          <div>
            <h2 className="font-display text-lg sm:text-2xl font-bold" style={{ color: '#002B5B' }}>Trust Fund</h2>
            <p className="text-xs sm:text-sm" style={{ color: 'var(--color-muted)' }}>{typeLabel}</p>
          </div>
        </div>
        <div className="inline-flex self-start sm:self-auto border" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          {CURRENCIES.map(c => (
            <button
              key={c}
              onClick={() => setCur(c)}
              className="px-3.5 py-1.5 text-xs font-bold uppercase transition-all"
              style={{ background: cur === c ? '#002B5B' : 'transparent', color: cur === c ? '#fff' : 'var(--color-muted)' }}
            >
              {CUR_SYMBOL[c]} {c}
            </button>
          ))}
        </div>
      </div>

      {/* Hero */}
      <div className="p-4 sm:p-7 border-2" style={{ background: '#002B5B', borderColor: '#0052CC' }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center flex-shrink-0" style={{ background: '#0052CC', color: '#FFFFFF' }}>
            <Lock size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-white font-display font-bold text-base sm:text-lg truncate">{trust.name}</p>
            <p className="text-xs" style={{ color: '#93C5FD' }}>{typeLabel} · Active for {yearsActive} years</p>
          </div>
        </div>
        <p className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: '#93C5FD' }}>Trust Balance</p>
        <p className="font-mono text-2xl sm:text-4xl lg:text-5xl font-bold text-white truncate">{fmt(trust.balance)}</p>
        {cur !== 'USD' && <p className="text-xs font-mono mt-1" style={{ color: '#BFDBFE' }}>= {fmtUSD(trust.balance)} USD</p>}
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        <Card className="p-4 sm:p-6">
          <SectionHeader title="Trust Details" />
          <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
            {[
              { icon: FileText, label: 'Trust Name',     value: trust.name },
              { icon: Shield,   label: 'Trust Type',     value: typeLabel },
              { icon: Calendar, label: 'Established',    value: established?.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) || 'N/A' },
              { icon: Users,    label: 'Trustee(s)',     value: trust.trustee },
              { icon: Users,    label: 'Beneficiaries',  value: trust.beneficiary },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0" style={{ borderColor: 'var(--color-border)' }}>
                <div className="w-8 h-8 flex items-center justify-center flex-shrink-0 mt-0.5 border" style={{ background: '#F8FAFC', borderColor: '#CBD5E1' }}>
                  <Icon size={14} style={{ color: '#0052CC' }} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>{label}</p>
                  <p className="text-xs sm:text-sm font-semibold mt-0.5 break-words" style={{ color: '#002B5B' }}>{value || 'N/A'}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-4 sm:space-y-5">
          {/* Balance in all currencies */}
          <Card className="p-4 sm:p-6">
            <SectionHeader title="Balance in All Currencies" />
            <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
              {CURRENCIES.map(c => (
                <div key={c} className="flex justify-between items-center gap-2 py-2.5 sm:py-3 first:pt-0 last:pb-0" style={{ borderColor: 'var(--color-border)' }}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 flex items-center justify-center font-bold text-xs border" style={{ background: '#EBF2FF', borderColor: '#93C5FD', color: '#002B5B' }}>
                      {CUR_SYMBOL[c]}
                    </div>
                    <span className="text-xs sm:text-sm font-bold" style={{ color: '#002B5B' }}>{c}</span>
                  </div>
                  <span className="font-mono font-bold text-sm sm:text-base whitespace-nowrap" style={{ color: '#002B5B' }}>
                    {convertCurrency(trust.balance, c)}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Notes */}
          {trust.notes && (
            <Card className="p-4 sm:p-6">
              <SectionHeader title="Trust Notes" />
              <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>
                {trust.notes}
              </p>
            </Card>
          )}

          {/* Quick stats */}
          <Card className="p-4 sm:p-5">
            <SectionHeader title="Quick Stats" />
            <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
              {[
                ['Trust Value',  fmt(trust.balance)],
                ['Years Active', `${yearsActive} years`],
                ['Type',         typeLabel],
                ['Status',       '✓ Active'],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between items-center gap-2 py-2.5 first:pt-0 last:pb-0" style={{ borderColor: 'var(--color-border)' }}>
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>{l}</span>
                  <span className="text-xs sm:text-sm font-bold font-mono text-right" style={{ color: '#002B5B' }}>{v}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
