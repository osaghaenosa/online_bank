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
    <div className="max-w-5xl space-y-5 fade-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/wealth">
            <button className="w-10 h-10 rounded-full border border-slate-200/80 bg-white hover:bg-[#F4F7FC] flex items-center justify-center transition-colors cursor-pointer text-[#002B5B]">
              <ArrowLeft size={16} />
            </button>
          </Link>
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[#002B5B]">Treasury &amp; Assets</h2>
            <p className="text-xs sm:text-sm text-slate-500">Physical assets, precious metals &amp; valuables</p>
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

      {/* Total */}
      <div className="p-6 sm:p-7 rounded-3xl brand-card-gradient text-white shadow-brand">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium text-blue-200 mb-1">Total Treasury Value</p>
            <p className="font-mono text-3xl sm:text-4xl font-bold text-white truncate">{fmt(totalUSD)}</p>
            {cur !== 'USD' && <p className="text-xs font-mono mt-1 text-blue-100">= {fmtUSD(totalUSD)} USD</p>}
          </div>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 bg-white/15 text-blue-200">
            <Shield size={24} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          {Object.entries(byCategory).map(([cat, val]) => (
            <span
              key={cat}
              className="px-3 py-1 rounded-full text-[11px] font-semibold bg-white/15 text-white"
            >
              {CATEGORY_ICONS[cat] || '📦'} {CAT_LABELS[cat] || cat}: {fmt(val as number)}
            </span>
          ))}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {categories.map(c => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className="px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all capitalize cursor-pointer"
            style={{
              background: filter === c ? '#0052CC' : '#FFFFFF',
              border: filter === c ? '1px solid #0052CC' : '1px solid #E2E8F0',
              color: filter === c ? '#fff' : '#475569',
            }}
          >
            {c === 'all' ? 'All' : (CATEGORY_ICONS[c] || '') + ' ' + (CAT_LABELS[c] || c)}
          </button>
        ))}
      </div>

      {/* Assets list */}
      <Card className="p-5 sm:p-6">
        <SectionHeader title={`Custody Assets (${filtered.length})`} />
        <div className="space-y-3">
          {filtered.map((a: any, i: number) => {
            const icon = CATEGORY_ICONS[a.category] || '📦'
            return (
              <div
                key={i}
                className="p-4 rounded-2xl bg-[#F4F7FC]"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 bg-white shadow-sm">
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1.5 sm:gap-3">
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-[#002B5B]">{a.name}</p>
                        <p className="text-xs mt-0.5 leading-relaxed text-slate-500">
                          {a.description}
                        </p>
                      </div>
                      <div className="sm:text-right flex-shrink-0">
                        <p className="font-bold font-mono text-base whitespace-nowrap text-[#002B5B]">
                          {fmt(a.totalValue)}
                        </p>
                        <p className="text-[11px] font-mono whitespace-nowrap text-slate-400">
                          {a.quantity} × {fmt(a.unitPrice)}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2.5 mt-2.5 text-[11px] text-slate-500">
                      {a.quantity > 1 && (
                        <span className="px-2.5 py-0.5 rounded-full font-semibold bg-[#EBF2FF] text-[#0052CC]">
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
                      <p className="text-xs mt-2 italic text-slate-500">
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
