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
    <div className="max-w-6xl space-y-5 fade-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/wealth">
            <button className="w-10 h-10 rounded-full border border-slate-200/80 bg-white hover:bg-[#F4F7FC] flex items-center justify-center transition-colors cursor-pointer text-[#002B5B]">
              <ArrowLeft size={16} />
            </button>
          </Link>
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[#002B5B]">Investment Portfolio</h2>
            <p className="text-xs sm:text-sm text-slate-500">
              {investments.length} investments · {yearsActive} years active
            </p>
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

      {/* Stats hero */}
      <div className="p-6 sm:p-7 rounded-3xl brand-card-gradient text-white shadow-brand">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div>
            <p className="text-xs font-medium text-blue-200 mb-1">Current Value</p>
            <p className="font-mono text-xl sm:text-2xl font-bold text-white truncate">{fmt(totalCurrent)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-blue-200 mb-1">Total Invested</p>
            <p className="font-mono text-xl sm:text-2xl font-bold text-white truncate">{fmt(totalInvested)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-blue-200 mb-1">Total Return</p>
            <p className="font-mono text-xl sm:text-2xl font-bold truncate" style={{ color: totalReturn >= 0 ? '#60A5FA' : '#FCA5A5' }}>
              {totalReturn >= 0 ? '+' : ''}{fmt(totalReturn)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-blue-200 mb-1">Overall ROI</p>
            <p className="font-mono text-xl sm:text-2xl font-bold truncate" style={{ color: parseFloat(totalReturnPct) >= 0 ? '#60A5FA' : '#FCA5A5' }}>
              {parseFloat(totalReturnPct) >= 0 ? '+' : ''}{totalReturnPct}%
            </p>
          </div>
        </div>
        <div className="flex gap-2 mt-5 pt-4 border-t border-white/15 flex-wrap">
          <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-white/15 text-white">
            {activeCount} Active
          </span>
          <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-white/10 border border-white/15 text-blue-100">
            {exitedCount} Exited
          </span>
          <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-white/10 border border-white/15 text-blue-100">
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
              className="px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all capitalize cursor-pointer"
              style={{
                background: filter === t ? '#0052CC' : '#FFFFFF',
                border: filter === t ? '1px solid #0052CC' : '1px solid #E2E8F0',
                color: filter === t ? '#fff' : '#475569',
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
              className="px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all capitalize cursor-pointer"
              style={{
                background: sortBy === s ? '#EBF2FF' : '#FFFFFF',
                border: sortBy === s ? '1px solid #0052CC' : '1px solid #E2E8F0',
                color: sortBy === s ? '#0052CC' : '#475569',
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
            <Card key={i} className="p-5">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg flex-shrink-0 bg-[#EBF2FF]">
                    {icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm truncate text-[#002B5B]">{inv.name}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-[#EBF2FF] text-[#0052CC]">
                        {TYPE_LABELS[inv.type] || inv.type}
                      </span>
                      {inv.ticker && (
                        <span className="text-xs font-mono font-bold text-slate-400">
                          {inv.ticker}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <span
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold capitalize flex-shrink-0"
                  style={{
                    background: inv.status === 'active' ? '#ECFDF5' : '#F1F5F9',
                    color: inv.status === 'active' ? '#059669' : '#64748B',
                  }}
                >
                  {inv.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3.5">
                <div className="p-3 rounded-2xl bg-[#F4F7FC]">
                  <p className="text-[11px] font-medium mb-0.5 text-slate-500">Invested</p>
                  <p className="font-mono font-bold text-sm truncate text-[#002B5B]">{fmt(inv.amount)}</p>
                </div>
                <div className="p-3 rounded-2xl bg-[#F4F7FC]">
                  <p className="text-[11px] font-medium mb-0.5 text-slate-500">Current Value</p>
                  <p className={`font-mono font-bold text-sm truncate text-[#002B5B] ${inv.status === 'exited' ? 'line-through opacity-50' : ''}`}>
                    {inv.status === 'exited' ? fmt(inv.amount) : fmt(inv.currentValue)}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1" style={{ color: isUp ? '#059669' : '#DC2626' }}>
                  {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  <span className="font-bold text-sm">
                    {isUp ? '+' : ''}{inv.returnPct?.toFixed(1)}%
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    ({isUp ? '+' : ''}{fmt(ret)})
                  </span>
                </div>
                <div className="text-xs truncate text-slate-400">
                  {years}yr · {inv.broker}
                </div>
              </div>

              {inv.notes && (
                <p className="text-xs mt-2.5 italic text-slate-500">💬 {inv.notes}</p>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
