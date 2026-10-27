'use client'
import { useState } from 'react'
import { useAuth } from '@/store/auth'
import { fmtUSD, convertCurrency, CATEGORY_ICONS } from '@/lib/api'
import { Card, SectionHeader } from '@/components/ui'
import { Shield, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const CURRENCIES = ['USD', 'GBP', 'EUR'] as const
type Currency = typeof CURRENCIES[number]
const CUR_SYMBOL: Record<Currency, string> = { USD: '$', GBP: '£', EUR: '€' }

const CAT_LABELS: Record<string, string> = {
  gold: 'Gold & Precious Metals', watch: 'Luxury Watches', art: 'Fine Art',
  jewelry: 'Jewelry & Gems', vehicle: 'Vehicles', bonds: 'Bonds & Securities',
  realestate: 'Real Estate', other: 'Other Assets',
}

export default function TreasuryPage() {
  const { user } = useAuth()
  const [cur, setCur] = useState<Currency>('USD')
  const [filter, setFilter] = useState('all')

  if (!user) return null
  const u = user as any
  const assets: any[] = u.treasuryAssets || []

  function fmt(usd: number) { return convertCurrency(usd, cur) }

  const totalUSD = assets.reduce((s, a) => s + (a.totalValue || 0), 0)
  const categories = ['all', ...new Set(assets.map(a => a.category))]
  const filtered = filter === 'all' ? assets : assets.filter(a => a.category === filter)

  const byCategory = assets.reduce((acc: Record<string, number>, a) => {
    acc[a.category] = (acc[a.category] || 0) + (a.totalValue || 0)
    return acc
  }, {})

  return (
    <div className="max-w-5xl space-y-4 sm:space-y-5 fade-up">
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
            <h2 className="font-display text-lg sm:text-2xl font-bold" style={{ color: '#002B5B' }}>Treasury &amp; Assets</h2>
            <p className="text-xs sm:text-sm" style={{ color: 'var(--color-muted)' }}>Physical assets, precious metals &amp; valuables</p>
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

      {/* Total */}
      <div className="p-4 sm:p-6 border-2" style={{ background: '#002B5B', borderColor: '#0052CC' }}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: '#93C5FD' }}>Total Treasury Value</p>
            <p className="font-mono text-2xl sm:text-4xl font-bold text-white truncate">{fmt(totalUSD)}</p>
            {cur !== 'USD' && <p className="text-xs font-mono mt-1" style={{ color: '#BFDBFE' }}>= {fmtUSD(totalUSD)} USD</p>}
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center flex-shrink-0" style={{ background: '#0052CC', color: '#FFFFFF' }}>
            <Shield size={22} />
          </div>
        </div>
        {/* Category chips */}
        <div className="flex flex-wrap gap-2 mt-4">
          {Object.entries(byCategory).map(([cat, val]) => (
            <span
              key={cat}
              className="px-2.5 py-1 text-[11px] font-bold border"
              style={{ background: '#001F42', borderColor: '#60A5FA', color: '#FFFFFF' }}
            >
              {CATEGORY_ICONS[cat] || '📦'} {CAT_LABELS[cat] || cat}: {fmt(val as number)}
            </span>
          ))}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 sm:gap-2 flex-wrap">
        {categories.map(c => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className="px-3 py-1.5 text-xs font-semibold border transition-all capitalize"
            style={{
              background: filter === c ? '#002B5B' : 'var(--color-surface)',
              borderColor: filter === c ? '#002B5B' : 'var(--color-border)',
              color: filter === c ? '#fff' : 'var(--color-muted)',
            }}
          >
            {c === 'all' ? 'All' : (CATEGORY_ICONS[c] || '') + ' ' + (CAT_LABELS[c] || c)}
          </button>
        ))}
      </div>

      {/* Assets list */}
      <Card className="p-4 sm:p-6">
        <SectionHeader title={`Custody Assets (${filtered.length})`} />
        <div className="space-y-3.5">
          {filtered.map((a: any, i: number) => {
            const icon = CATEGORY_ICONS[a.category] || '📦'
            return (
              <div
                key={i}
                className="p-3.5 sm:p-4 border"
                style={{ background: '#F8FAFC', borderColor: 'var(--color-border)' }}
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <div
                    className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-xl flex-shrink-0 border bg-white"
                    style={{ borderColor: '#CBD5E1' }}
                  >
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1.5 sm:gap-3">
                      <div className="min-w-0">
                        <p className="font-bold text-xs sm:text-sm" style={{ color: '#002B5B' }}>{a.name}</p>
                        <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--color-muted)' }}>
                          {a.description}
                        </p>
                      </div>
                      <div className="sm:text-right flex-shrink-0">
                        <p className="font-bold font-mono text-sm sm:text-base whitespace-nowrap" style={{ color: '#002B5B' }}>
                          {fmt(a.totalValue)}
                        </p>
                        <p className="text-[11px] font-mono whitespace-nowrap" style={{ color: 'var(--color-muted)' }}>
                          {a.quantity} × {fmt(a.unitPrice)}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2.5 mt-2.5 text-[11px]" style={{ color: 'var(--color-muted)' }}>
                      {a.quantity > 1 && (
                        <span className="px-2 py-0.5 font-bold" style={{ background: '#EBF2FF', color: '#0052CC' }}>
                          Qty: {a.quantity}
                        </span>
                      )}
                      {a.acquiredAt && (
                        <span>📅 Acquired: {new Date(a.acquiredAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                      )}
                      {a.location && <span>📍 {a.location}</span>}
                      {a.serialNo && <span>🔢 {a.serialNo}</span>}
                    </div>
                    {a.notes && (
                      <p className="text-xs mt-2 italic" style={{ color: 'var(--color-muted)' }}>
                        💬 {a.notes}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
