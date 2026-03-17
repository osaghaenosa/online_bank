'use client'
import { useState } from 'react'
import { useAuth } from '@/store/auth'
import { fmtUSD, convertCurrency, CATEGORY_ICONS } from '@/lib/api'
import { Card, SectionHeader, Badge } from '@/components/ui'
import { Shield, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const CURRENCIES = ['USD','GBP','EUR'] as const
type Currency = typeof CURRENCIES[number]
const CUR_SYMBOL: Record<Currency,string> = { USD:'$', GBP:'£', EUR:'€' }

const CAT_COLORS: Record<string,string> = {
  gold:'#F59E0B', watch:'#8B5CF6', art:'#EC4899', jewelry:'#06B6D4',
  vehicle:'#3B82F6', bonds:'#10B981', realestate:'#F97316', other:'#6B7A99',
}
const CAT_LABELS: Record<string,string> = {
  gold:'Gold & Precious Metals', watch:'Luxury Watches', art:'Fine Art',
  jewelry:'Jewelry & Gems', vehicle:'Vehicles', bonds:'Bonds & Securities',
  realestate:'Real Estate', other:'Other Assets',
}

export default function TreasuryPage() {
  const { user } = useAuth()
  const [cur, setCur] = useState<Currency>('USD')
  const [filter, setFilter] = useState('all')

  if (!user) return null
  const u = user as any
  const assets: any[] = u.treasuryAssets || []

  function fmt(usd: number) { return convertCurrency(usd, cur) }

  const totalUSD = assets.reduce((s,a) => s+(a.totalValue||0), 0)
  const categories = ['all', ...new Set(assets.map(a=>a.category))]
  const filtered = filter === 'all' ? assets : assets.filter(a => a.category === filter)

  // Group totals
  const byCategory = assets.reduce((acc: Record<string,number>, a) => {
    acc[a.category] = (acc[a.category]||0) + (a.totalValue||0)
    return acc
  }, {})

  return (
    <div className="max-w-5xl space-y-5 fade-up">
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
            <h2 className="font-display text-2xl font-bold">Treasury & Assets</h2>
            <p className="text-sm" style={{ color:'var(--color-muted)' }}>Physical assets, precious metals & valuables</p>
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

      {/* Total */}
      <Card className="p-6" style={{ background:'#0F1C35' }}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Total Treasury Value</p>
            <p className="font-display text-4xl font-bold text-white">{fmt(totalUSD)}</p>
            {cur !== 'USD' && <p className="text-sm text-white/40 mt-1">= {fmtUSD(totalUSD)} USD</p>}
          </div>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background:'rgba(139,92,246,.2)' }}>
            <Shield size={24} style={{ color:'#8B5CF6' }} />
          </div>
        </div>
        {/* Category chips */}
        <div className="flex flex-wrap gap-2 mt-5">
          {Object.entries(byCategory).map(([cat,val]) => (
            <span key={cat} className="px-3 py-1 rounded-full text-xs font-semibold"
              style={{ background: (CAT_COLORS[cat]||'#6B7A99')+'25', color: CAT_COLORS[cat]||'#6B7A99' }}>
              {CATEGORY_ICONS[cat]||'📦'} {CAT_LABELS[cat]||cat}: {fmt(val as number)}
            </span>
          ))}
        </div>
      </Card>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {categories.map(c => (
          <button key={c} onClick={() => setFilter(c)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all capitalize font-sans"
            style={{
              background: filter===c ? '#0F1C35' : 'var(--color-surface)',
              borderColor: filter===c ? '#0F1C35' : 'var(--color-border)',
              color: filter===c ? '#fff' : 'var(--color-muted)',
            }}>
            {c === 'all' ? 'All' : CATEGORY_ICONS[c]+' '+(CAT_LABELS[c]||c)}
          </button>
        ))}
      </div>

      {/* Assets list */}
      <Card className="p-6">
        <SectionHeader title={`Assets (${filtered.length})`} />
        <div className="space-y-4">
          {filtered.map((a: any, i: number) => {
            const color = CAT_COLORS[a.category] || '#6B7A99'
            const icon  = CATEGORY_ICONS[a.category] || '📦'
            return (
              <div key={i} className="rounded-xl p-5"
                style={{ background:'var(--color-bg)', border:'1px solid var(--color-border)' }}>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ background: color+'15' }}>
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <p className="font-bold text-sm">{a.name}</p>
                        <p className="text-xs mt-0.5 leading-relaxed" style={{ color:'var(--color-muted)' }}>
                          {a.description}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold font-mono text-base">{fmt(a.totalValue)}</p>
                        <p className="text-xs font-mono" style={{ color:'var(--color-muted)' }}>
                          {a.quantity} × {fmt(a.unitPrice)}
                        </p>
                      </div>
                    </div>
                    {/* Meta row */}
                    <div className="flex flex-wrap gap-3 mt-3 text-xs" style={{ color:'var(--color-muted)' }}>
                      {a.quantity > 1 && (
                        <span className="px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: color+'15', color }}>
                          Qty: {a.quantity}
                        </span>
                      )}
                      {a.acquiredAt && (
                        <span>📅 Acquired: {new Date(a.acquiredAt).toLocaleDateString('en-US',{month:'short',year:'numeric'})}</span>
                      )}
                      {a.location && <span>📍 {a.location}</span>}
                      {a.serialNo  && <span>🔢 {a.serialNo}</span>}
                    </div>
                    {a.notes && (
                      <p className="text-xs mt-2 italic" style={{ color:'var(--color-muted)' }}>
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
