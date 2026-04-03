'use client'
import { useState } from 'react'
import { useAuth } from '@/store/auth'
import { fmtUSD, convertCurrency } from '@/lib/api'
import { Card, SectionHeader } from '@/components/ui'
import { Lock, ArrowLeft, Users, Calendar, FileText, Shield } from 'lucide-react'
import Link from 'next/link'

const CURRENCIES = ['USD','GBP','EUR'] as const
type Currency = typeof CURRENCIES[number]
const CUR_SYMBOL: Record<Currency,string> = { USD:'$', GBP:'£', EUR:'€' }

const TRUST_TYPE_LABELS: Record<string,string> = {
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
        <div className="flex items-center gap-3 mb-6">
          <Link href="/wealth">
            <button className="p-2 rounded-xl border" style={{ borderColor:'var(--color-border)', background:'var(--color-surface)' }}>
              <ArrowLeft size={16} />
            </button>
          </Link>
          <h2 className="font-display text-2xl font-bold">Trust Fund</h2>
        </div>
        <Card className="p-10 text-center">
          <Lock size={48} className="mx-auto mb-4 opacity-20" />
          <h3 className="font-bold text-xl mb-2">No Trust Fund</h3>
          <p className="text-sm" style={{ color:'var(--color-muted)' }}>
            This account has no active trust fund. Contact your wealth advisor to establish one.
          </p>
        </Card>
      </div>
    )
  }

  const typeLabel = TRUST_TYPE_LABELS[trust.type] || trust.type
  const established = trust.established ? new Date(trust.established) : null
  const yearsActive = established ? Math.round((new Date('2025-01-01').getTime() - established.getTime()) / (365.25*24*3600*1000)) : 0

  return (
    <div className="max-w-4xl space-y-5 fade-up">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Link href="/wealth">
            <button className="p-2 rounded-xl border transition-all hover:opacity-70"
              style={{ borderColor:'var(--color-border)', background:'var(--color-surface)' }}>
              <ArrowLeft size={16} />
            </button>
          </Link>
          <div>
            <h2 className="font-display text-2xl font-bold">Trust Fund</h2>
            <p className="text-sm" style={{ color:'var(--color-muted)' }}>{typeLabel}</p>
          </div>
        </div>
        <div className="flex gap-1 p-1 rounded-xl" style={{ background:'var(--color-surface)', border:'1px solid var(--color-border)' }}>
          {CURRENCIES.map(c => (
            <button key={c} onClick={() => setCur(c)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{ background: cur===c ? '#0F1C35' : 'transparent', color: cur===c ? '#fff' : 'var(--color-muted)' }}>
              {CUR_SYMBOL[c]} {c}
            </button>
          ))}
        </div>
      </div>

      {/* Hero */}
      <Card className="p-8 relative overflow-hidden" style={{ background:'#0F1C35' }}>
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full opacity-10"
          style={{ background:'radial-gradient(circle, #EC4899, transparent 70%)' }} />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background:'rgba(236,72,153,.2)' }}>
              <Lock size={22} style={{ color:'#EC4899' }} />
            </div>
            <div>
              <p className="text-white font-display font-bold text-lg">{trust.name}</p>
              <p className="text-xs text-white/40">{typeLabel} · Active for {yearsActive} years</p>
            </div>
          </div>
          <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Trust Balance</p>
          <p className="font-display text-5xl font-bold text-white">{fmt(trust.balance)}</p>
          {cur !== 'USD' && <p className="text-sm text-white/40 mt-1">= {fmtUSD(trust.balance)} USD</p>}
        </div>
      </Card>

      {/* Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card className="p-6">
          <SectionHeader title="Trust Details" />
          {[
            { icon: FileText,  label: 'Trust Name',    value: trust.name },
            { icon: Shield,    label: 'Trust Type',    value: typeLabel },
            { icon: Calendar,  label: 'Established',   value: established?.toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'}) || 'N/A' },
            { icon: Users,     label: 'Trustee(s)',    value: trust.trustee },
            { icon: Users,     label: 'Next of Kin(s)',   value: trust.beneficiary },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-3 py-3.5 border-b last:border-0"
              style={{ borderColor:'var(--color-border)' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background:'var(--color-bg)' }}>
                <Icon size={14} style={{ color:'var(--color-muted)' }} />
              </div>
              <div>
                <p className="text-xs font-semibold" style={{ color:'var(--color-muted)' }}>{label}</p>
                <p className="text-sm font-semibold mt-0.5">{value || 'N/A'}</p>
              </div>
            </div>
          ))}
        </Card>

        <div className="space-y-5">
          {/* Balance in all currencies */}
          <Card className="p-6">
            <SectionHeader title="Balance in All Currencies" />
            {CURRENCIES.map(c => (
              <div key={c} className="flex justify-between items-center py-3 border-b last:border-0"
                style={{ borderColor:'var(--color-border)' }}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm"
                    style={{ background:'var(--color-bg)', color:'var(--color-text)' }}>
                    {CUR_SYMBOL[c]}
                  </div>
                  <span className="text-sm font-semibold">{c}</span>
                </div>
                <span className="font-mono font-bold text-base">{convertCurrency(trust.balance, c)}</span>
              </div>
            ))}
          </Card>

          {/* Notes */}
          {trust.notes && (
            <Card className="p-6">
              <SectionHeader title="Trust Notes" />
              <p className="text-sm leading-relaxed" style={{ color:'var(--color-muted)' }}>
                {trust.notes}
              </p>
            </Card>
          )}

          {/* Quick stats */}
          <Card className="p-5">
            <SectionHeader title="Quick Stats" />
            {[
              ['Trust Value',      fmt(trust.balance)],
              ['Years Active',     `${yearsActive} years`],
              ['Type',             typeLabel],
              ['Status',           '✅ Active'],
            ].map(([l,v]) => (
              <div key={l} className="flex justify-between py-2.5 border-b last:border-0"
                style={{ borderColor:'var(--color-border)' }}>
                <span className="text-xs" style={{ color:'var(--color-muted)' }}>{l}</span>
                <span className="text-sm font-bold">{v}</span>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  )
}
