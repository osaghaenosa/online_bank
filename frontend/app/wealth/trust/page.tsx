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
            <button className="w-10 h-10 rounded-full border border-slate-200/80 bg-white hover:bg-[#F4F7FC] flex items-center justify-center transition-colors cursor-pointer text-[#002B5B]">
              <ArrowLeft size={16} />
            </button>
          </Link>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-[#002B5B]">Trust Fund</h2>
        </div>
        <Card className="p-8 sm:p-10 text-center rounded-3xl">
          <div className="w-16 h-16 rounded-full bg-[#EBF2FF] text-[#0052CC] flex items-center justify-center mx-auto mb-4">
            <Lock size={28} />
          </div>
          <h3 className="font-bold text-lg sm:text-xl mb-2 text-[#002B5B]">No Trust Fund</h3>
          <p className="text-xs sm:text-sm text-slate-500">
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
    <div className="max-w-4xl space-y-5 fade-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/wealth">
            <button className="w-10 h-10 rounded-full border border-slate-200/80 bg-white hover:bg-[#F4F7FC] flex items-center justify-center transition-colors cursor-pointer text-[#002B5B]">
              <ArrowLeft size={16} />
            </button>
          </Link>
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[#002B5B]">Trust Fund</h2>
            <p className="text-xs sm:text-sm text-slate-500">{typeLabel}</p>
          </div>
        </div>
        <div className="inline-flex self-start sm:self-auto rounded-full p-1 bg-white border border-slate-200/80 shadow-sm">
          {CURRENCIES.map(c => (
            <button
              key={c}
              onClick={() => setCur(c)}
              className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer"
              style={{ background: cur === c ? '#0052CC' : 'transparent', color: cur === c ? '#fff' : '#475569' }}
            >
              {CUR_SYMBOL[c]} {c}
            </button>
          ))}
        </div>
      </div>

      {/* Hero */}
      <div className="p-6 sm:p-8 rounded-3xl brand-card-gradient text-white shadow-brand">
        <div className="flex items-center gap-3.5 mb-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 bg-white/15 text-blue-200">
            <Lock size={22} />
          </div>
          <div className="min-w-0">
            <p className="text-white font-display font-bold text-lg truncate">{trust.name}</p>
            <p className="text-xs text-blue-200">{typeLabel} · Active for {yearsActive} years</p>
          </div>
        </div>
        <p className="text-xs font-medium text-blue-200 mb-1">Trust Balance</p>
        <p className="font-mono text-3xl sm:text-4xl lg:text-5xl font-bold text-white truncate">{fmt(trust.balance)}</p>
        {cur !== 'USD' && <p className="text-xs font-mono mt-1 text-blue-100">= {fmtUSD(trust.balance)} USD</p>}
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card className="p-5 sm:p-6">
          <SectionHeader title="Trust Details" />
          <div className="space-y-3">
            {[
              { icon: FileText, label: 'Trust Name',     value: trust.name },
              { icon: Shield,   label: 'Trust Type',     value: typeLabel },
              { icon: Calendar, label: 'Established',    value: established?.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) || 'N/A' },
              { icon: Users,    label: 'Trustee(s)',     value: trust.trustee },
              { icon: Users,    label: 'Beneficiaries',  value: trust.beneficiary },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-3 p-3 rounded-2xl bg-[#F4F7FC]">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-white shadow-sm text-[#0052CC]">
                  <Icon size={15} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-slate-400">{label}</p>
                  <p className="text-xs sm:text-sm font-semibold mt-0.5 break-words text-[#002B5B]">{value || 'N/A'}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-5">
          {/* Balance in all currencies */}
          <Card className="p-5 sm:p-6">
            <SectionHeader title="Balance in All Currencies" />
            <div className="space-y-2.5">
              {CURRENCIES.map(c => (
                <div key={c} className="flex justify-between items-center gap-2 p-3 rounded-2xl bg-[#F4F7FC]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs bg-white text-[#0052CC] shadow-sm">
                      {CUR_SYMBOL[c]}
                    </div>
                    <span className="text-sm font-bold text-[#002B5B]">{c}</span>
                  </div>
                  <span className="font-mono font-bold text-sm sm:text-base whitespace-nowrap text-[#002B5B]">
                    {convertCurrency(trust.balance, c)}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {trust.notes && (
            <Card className="p-5 sm:p-6">
              <SectionHeader title="Trust Notes" />
              <p className="text-xs sm:text-sm leading-relaxed text-slate-600">
                {trust.notes}
              </p>
            </Card>
          )}

          <Card className="p-5">
            <SectionHeader title="Quick Stats" />
            <div className="space-y-2">
              {[
                ['Trust Value',  fmt(trust.balance)],
                ['Years Active', `${yearsActive} years`],
                ['Type',         typeLabel],
                ['Status',       '✓ Active'],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between items-center gap-2 py-2 border-b border-slate-100 last:border-0">
                  <span className="text-xs font-medium text-slate-500">{l}</span>
                  <span className="text-xs sm:text-sm font-bold font-mono text-right text-[#002B5B]">{v}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
