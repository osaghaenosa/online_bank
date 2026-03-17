'use client'
import { useState } from 'react'
import { useAuth } from '@/store/auth'
import { fmtUSD, convertCurrency, INVESTMENT_ICONS } from '@/lib/api'
import { Card, SectionHeader, StatusBadge } from '@/components/ui'
import { TrendingUp, TrendingDown, ArrowLeft, DollarSign } from 'lucide-react'
import Link from 'next/link'

const CURRENCIES = ['USD','GBP','EUR'] as const
type Currency = typeof CURRENCIES[number]
const CUR_SYMBOL: Record<Currency,string> = { USD:'$', GBP:'£', EUR:'€' }

const TYPE_LABELS: Record<string,string> = {
  stocks:'Stocks', bonds:'Bonds', real_estate:'Real Estate',
  startup:'Startup', etf:'ETF', mutual_fund:'Mutual Fund',
  private_equity:'Private Equity', commodity:'Commodity',
}
const TYPE_COLORS: Record<string,string> = {
  stocks:'#3B82F6', bonds:'#10B981', real_estate:'#F97316',
  startup:'#EF4444', etf:'#8B5CF6', mutual_fund:'#06B6D4',
  private_equity:'#EC4899', commodity:'#F59E0B',
}

export default function InvestmentsPage() {
  const { user } = useAuth()
  const [cur, setCur] = useState<Currency>('USD')
  const [filter, setFilter] = useState('all')
  const [sortBy, setSortBy] = useState<'value'|'return'|'date'>('value')

  if (!user) return null
  const u = user as any
  const investments: any[] = u.investments || []

  function fmt(usd: number) { return convertCurrency(usd, cur) }

  const totalInvested = investments.reduce((s,a) => s+(a.amount||0), 0)
  const totalCurrent  = investments.reduce((s,a) => s+(a.currentValue||0), 0)
  const totalReturn   = totalCurrent - totalInvested
  const totalReturnPct= totalInvested > 0 ? ((totalReturn/totalInvested)*100).toFixed(1) : '0'

  const types = ['all', ...new Set(investments.map(a=>a.type))]
  let filtered = filter === 'all' ? [...investments] : investments.filter(a => a.type === filter)
  filtered.sort((a,b) => {
    if (sortBy === 'value')  return (b.currentValue||0) - (a.currentValue||0)
    if (sortBy === 'return') return (b.returnPct||0) - (a.returnPct||0)
    if (sortBy === 'date')   return new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    return 0
  })

  const activeCount = investments.filter(i => i.status === 'active').length
  const exitedCount = investments.filter(i => i.status === 'exited').length

  // Years active: oldest investment
  const oldest = investments.reduce((oldest, i) => {
    return !oldest || new Date(i.startDate) < new Date(oldest) ? i.startDate : oldest
  }, null)
  const yearsActive = oldest ? Math.round((Date.now() - new Date(oldest).getTime()) / (365.25*24*3600*1000)) : 0

  return (
    <div className="max-w-6xl space-y-5 fade-up">
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
            <h2 className="font-display text-2xl font-bold">Investment Portfolio</h2>
            <p className="text-sm" style={{ color:'var(--color-muted)' }}>
              {investments.length} investments · {yearsActive} years active
            </p>
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

      {/* Stats hero */}
      <Card className="p-6" style={{ background:'#0F1C35' }}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-xs text-white/40 mb-1">Current Value</p>
            <p className="font-display text-2xl font-bold text-white">{fmt(totalCurrent)}</p>
          </div>
          <div>
            <p className="text-xs text-white/40 mb-1">Total Invested</p>
            <p className="font-display text-2xl font-bold text-white">{fmt(totalInvested)}</p>
          </div>
          <div>
            <p className="text-xs text-white/40 mb-1">Total Return</p>
            <p className={`font-display text-2xl font-bold ${totalReturn>=0?'text-emerald-400':'text-red-400'}`}>
              {totalReturn>=0?'+':''}{fmt(totalReturn)}
            </p>
          </div>
          <div>
            <p className="text-xs text-white/40 mb-1">Overall ROI</p>
            <p className={`font-display text-2xl font-bold ${parseFloat(totalReturnPct)>=0?'text-emerald-400':'text-red-400'}`}>
              {parseFloat(totalReturnPct)>=0?'+':''}{totalReturnPct}%
            </p>
          </div>
        </div>
        <div className="flex gap-3 mt-5 flex-wrap">
          <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background:'rgba(16,185,129,.2)', color:'#10B981' }}>
            {activeCount} Active
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background:'rgba(107,114,153,.2)', color:'#94A3B8' }}>
            {exitedCount} Exited
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background:'rgba(59,130,246,.2)', color:'#60A5FA' }}>
            {yearsActive} Years Investing
          </span>
        </div>
      </Card>

      {/* Filters + sort */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {types.map(t => (
            <button key={t} onClick={() => setFilter(t)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all font-sans capitalize"
              style={{ background: filter===t ? '#0F1C35' : 'var(--color-surface)', borderColor: filter===t ? '#0F1C35' : 'var(--color-border)', color: filter===t ? '#fff' : 'var(--color-muted)' }}>
              {t === 'all' ? 'All' : (INVESTMENT_ICONS[t]||'📊')+' '+(TYPE_LABELS[t]||t)}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {(['value','return','date'] as const).map(s => (
            <button key={s} onClick={() => setSortBy(s)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all font-sans capitalize"
              style={{ background: sortBy===s ? 'rgba(16,185,129,.15)' : 'var(--color-surface)', borderColor: sortBy===s ? '#10B981' : 'var(--color-border)', color: sortBy===s ? '#10B981' : 'var(--color-muted)' }}>
              Sort: {s}
            </button>
          ))}
        </div>
      </div>

      {/* Investment cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((inv: any, i: number) => {
          const color   = TYPE_COLORS[inv.type] || '#6B7A99'
          const icon    = INVESTMENT_ICONS[inv.type] || '📊'
          const ret     = inv.currentValue - inv.amount
          const isUp    = ret >= 0
          const years   = inv.startDate ? Math.round((Date.now() - new Date(inv.startDate).getTime()) / (365.25*24*3600*1000)) : 0

          return (
            <div key={i} className="rounded-2xl p-5"
              style={{ background:'var(--color-surface)', border:'1px solid var(--color-border)' }}>
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                    style={{ background: color+'15' }}>
                    {icon}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm truncate">{inv.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs px-1.5 py-0.5 rounded font-semibold"
                        style={{ background: color+'18', color }}>
                        {TYPE_LABELS[inv.type]||inv.type}
                      </span>
                      {inv.ticker && (
                        <span className="text-xs font-mono font-bold" style={{ color:'var(--color-muted)' }}>
                          {inv.ticker}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className={`px-2 py-0.5 rounded-full text-xs font-bold ${inv.status==='active'?'bg-emerald-100 text-emerald-700':inv.status==='exited'?'bg-slate-100 text-slate-600':'bg-amber-100 text-amber-700'}`}>
                  {inv.status}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="p-3 rounded-xl" style={{ background:'var(--color-bg)' }}>
                  <p className="text-xs mb-0.5" style={{ color:'var(--color-muted)' }}>Invested</p>
                  <p className="font-mono font-bold text-sm">{fmt(inv.amount)}</p>
                </div>
                <div className="p-3 rounded-xl" style={{ background:'var(--color-bg)' }}>
                  <p className="text-xs mb-0.5" style={{ color:'var(--color-muted)' }}>Current Value</p>
                  <p className={`font-mono font-bold text-sm ${inv.status==='exited'?'line-through opacity-50':''}`}>
                    {inv.status === 'exited' ? fmt(inv.amount) : fmt(inv.currentValue)}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className={`flex items-center gap-1 ${isUp?'text-emerald-600':'text-red-500'}`}>
                  {isUp ? <TrendingUp size={14}/> : <TrendingDown size={14}/>}
                  <span className="font-bold text-sm">
                    {isUp?'+':''}{inv.returnPct?.toFixed(1)}%
                  </span>
                  <span className="text-xs" style={{ color:'var(--color-muted)' }}>
                    ({isUp?'+':''}{fmt(ret)})
                  </span>
                </div>
                <div className="text-xs" style={{ color:'var(--color-muted)' }}>
                  {years}yr · {inv.broker}
                </div>
              </div>

              {inv.notes && (
                <p className="text-xs mt-2 italic" style={{ color:'var(--color-muted)' }}>💬 {inv.notes}</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
