'use client'
import { useState } from 'react'
import { useAuth } from '@/store/auth'
import { convertCurrency, INVESTMENT_ICONS } from '@/lib/api'
import { Card } from '@/components/ui'
import { TrendingUp, TrendingDown, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const CURRENCIES = ['USD', 'GBP', 'EUR'] as const
type Currency = typeof CURRENCIES[number]
const CUR_SYMBOL: Record<Currency, string> = { USD: '$', GBP: '£', EUR: '€' }

const TYPE_LABELS: Record<string, string> = {
  stocks: 'Stocks', bonds: 'Bonds', real_estate: 'Real Estate',
  startup: 'Startup', etf: 'ETF', mutual_fund: 'Mutual Fund',
  private_equity: 'Private Equity', commodity: 'Commodity',
}

export default function InvestmentsPage() {
  const { user } = useAuth()
  const [cur, setCur] = useState<Currency>('USD')
  const [filter, setFilter] = useState('all')
  const [sortBy, setSortBy] = useState<'value' | 'return' | 'date'>('value')

  if (!user) return null
  const u = user as any
  const investments: any[] = u.investments || []

  function fmt(usd: number) { return convertCurrency(usd, cur) }

  const totalInvested  = investments.reduce((s, a) => s + (a.amount || 0), 0)
  const totalCurrent   = investments.reduce((s, a) => s + (a.currentValue || 0), 0)
  const totalReturn    = totalCurrent - totalInvested
  const totalReturnPct = totalInvested > 0 ? ((totalReturn / totalInvested) * 100).toFixed(1) : '0'

  const types = ['all', ...new Set(investments.map(a => a.type))]
  const filtered = filter === 'all' ? [...investments] : investments.filter(a => a.type === filter)
  filtered.sort((a, b) => {
    if (sortBy === 'value')  return (b.currentValue || 0) - (a.currentValue || 0)
    if (sortBy === 'return') return (b.returnPct || 0) - (a.returnPct || 0)
    if (sortBy === 'date')   return new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    return 0
  })

  const activeCount = investments.filter(i => i.status === 'active').length
  const exitedCount = investments.filter(i => i.status === 'exited').length

  const oldest = investments.reduce((oldest, i) => {
    return !oldest || new Date(i.startDate) < new Date(oldest) ? i.startDate : oldest
  }, null)
  const yearsActive = oldest ? Math.round((new Date('2025-01-01').getTime() - new Date(oldest).getTime()) / (365.25 * 24 * 3600 * 1000)) : 0

  return (
    <div className="max-w-6xl space-y-4 sm:space-y-5 fade-up">
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
            <h2 className="font-display text-lg sm:text-2xl font-bold" style={{ color: '#002B5B' }}>Investment Portfolio</h2>
            <p className="text-xs sm:text-sm" style={{ color: 'var(--color-muted)' }}>
              {investments.length} investments · {yearsActive} years active
            </p>
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

      {/* Stats hero */}
      <div className="p-4 sm:p-6 border-2" style={{ background: '#002B5B', borderColor: '#0052CC' }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: '#93C5FD' }}>Current Value</p>
            <p className="font-mono text-xl sm:text-2xl font-bold text-white truncate">{fmt(totalCurrent)}</p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: '#93C5FD' }}>Total Invested</p>
            <p className="font-mono text-xl sm:text-2xl font-bold text-white truncate">{fmt(totalInvested)}</p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: '#93C5FD' }}>Total Return</p>
            <p className="font-mono text-xl sm:text-2xl font-bold truncate" style={{ color: totalReturn >= 0 ? '#60A5FA' : '#F87171' }}>
              {totalReturn >= 0 ? '+' : ''}{fmt(totalReturn)}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: '#93C5FD' }}>Overall ROI</p>
            <p className="font-mono text-xl sm:text-2xl font-bold truncate" style={{ color: parseFloat(totalReturnPct) >= 0 ? '#60A5FA' : '#F87171' }}>
              {parseFloat(totalReturnPct) >= 0 ? '+' : ''}{totalReturnPct}%
            </p>
          </div>
        </div>
        <div className="flex gap-2 mt-4 pt-4 border-t flex-wrap" style={{ borderColor: '#1E3A5F' }}>
          <span className="px-2.5 py-1 text-[11px] font-bold uppercase" style={{ background: '#0052CC', color: '#FFFFFF' }}>
            {activeCount} Active
          </span>
          <span className="px-2.5 py-1 text-[11px] font-bold uppercase border" style={{ background: '#001F42', borderColor: '#60A5FA', color: '#93C5FD' }}>
            {exitedCount} Exited
          </span>
          <span className="px-2.5 py-1 text-[11px] font-bold uppercase border" style={{ background: '#001F42', borderColor: '#60A5FA', color: '#93C5FD' }}>
            {yearsActive} Years Active
          </span>
        </div>
      </div>

      {/* Filters + sort */}
      <div className="flex flex-wrap gap-2.5 items-center justify-between">
        <div className="flex flex-wrap gap-1.5">
          {types.map(t => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className="px-3 py-1.5 text-xs font-semibold border transition-all capitalize"
              style={{
                background: filter === t ? '#002B5B' : 'var(--color-surface)',
                borderColor: filter === t ? '#002B5B' : 'var(--color-border)',
                color: filter === t ? '#fff' : 'var(--color-muted)',
              }}
            >
              {t === 'all' ? 'All' : (INVESTMENT_ICONS[t] || '📊') + ' ' + (TYPE_LABELS[t] || t)}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5">
          {(['value', 'return', 'date'] as const).map(s => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className="px-3 py-1.5 text-xs font-semibold border transition-all capitalize"
              style={{
                background: sortBy === s ? '#EBF2FF' : 'var(--color-surface)',
                borderColor: sortBy === s ? '#0052CC' : 'var(--color-border)',
                color: sortBy === s ? '#0052CC' : 'var(--color-muted)',
              }}
            >
              Sort: {s}
            </button>
          ))}
        </div>
      </div>

      {/* Investment cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((inv: any, i: number) => {
          const icon  = INVESTMENT_ICONS[inv.type] || '📊'
          const ret   = inv.currentValue - inv.amount
          const isUp  = ret >= 0
          const years = inv.startDate ? Math.round((new Date('2025-01-01').getTime() - new Date(inv.startDate).getTime()) / (365.25 * 24 * 3600 * 1000)) : 0

          return (
            <Card key={i} className="p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3 mb-3.5">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-base sm:text-lg flex-shrink-0 border"
                    style={{ background: '#EBF2FF', borderColor: '#93C5FD' }}
                  >
                    {icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-xs sm:text-sm truncate" style={{ color: '#002B5B' }}>{inv.name}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-[10px] px-1.5 py-0.5 font-bold uppercase" style={{ background: '#EBF2FF', color: '#0052CC' }}>
                        {TYPE_LABELS[inv.type] || inv.type}
                      </span>
                      {inv.ticker && (
                        <span className="text-xs font-mono font-bold" style={{ color: 'var(--color-muted)' }}>
                          {inv.ticker}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <span
                  className="px-2 py-0.5 text-[10px] font-bold uppercase flex-shrink-0 border"
                  style={{
                    background: inv.status === 'active' ? '#EBF2FF' : '#F1F5F9',
                    borderColor: inv.status === 'active' ? '#93C5FD' : '#CBD5E1',
                    color: inv.status === 'active' ? '#0052CC' : '#475569',
                  }}
                >
                  {inv.status}
                </span>
              </div>

              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 gap-2.5 sm:gap-3 mb-3">
                <div className="p-2.5 sm:p-3 border" style={{ background: '#F8FAFC', borderColor: '#CBD5E1' }}>
                  <p className="text-[11px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: 'var(--color-muted)' }}>Invested</p>
                  <p className="font-mono font-bold text-xs sm:text-sm truncate" style={{ color: '#002B5B' }}>{fmt(inv.amount)}</p>
                </div>
                <div className="p-2.5 sm:p-3 border" style={{ background: '#F8FAFC', borderColor: '#CBD5E1' }}>
                  <p className="text-[11px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: 'var(--color-muted)' }}>Current Value</p>
                  <p className={`font-mono font-bold text-xs sm:text-sm truncate ${inv.status === 'exited' ? 'line-through opacity-50' : ''}`} style={{ color: '#002B5B' }}>
                    {inv.status === 'exited' ? fmt(inv.amount) : fmt(inv.currentValue)}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className={`flex items-center gap-1 ${isUp ? 'text-[#0052CC]' : 'text-red-600'}`}>
                  {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  <span className="font-bold text-xs sm:text-sm">
                    {isUp ? '+' : ''}{inv.returnPct?.toFixed(1)}%
                  </span>
                  <span className="text-xs font-mono" style={{ color: 'var(--color-muted)' }}>
                    ({isUp ? '+' : ''}{fmt(ret)})
                  </span>
                </div>
                <div className="text-xs truncate" style={{ color: 'var(--color-muted)' }}>
                  {years}yr · {inv.broker}
                </div>
              </div>

              {inv.notes && (
                <p className="text-xs mt-2 italic" style={{ color: 'var(--color-muted)' }}>💬 {inv.notes}</p>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
