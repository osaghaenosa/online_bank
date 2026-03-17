'use client'
import { useState } from 'react'
import { useAuth } from '@/store/auth'
import { fmtUSD, convertCurrency } from '@/lib/api'
import { Card, SectionHeader, Badge } from '@/components/ui'
import { Bitcoin, TrendingUp, TrendingDown, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const CURRENCIES = ['USD','GBP','EUR'] as const
type Currency = typeof CURRENCIES[number]
const CUR_SYMBOL: Record<Currency,string> = { USD:'$', GBP:'£', EUR:'€' }

const COIN_COLORS: Record<string,string> = {
  BTC:'#F59E0B', ETH:'#6366F1', SOL:'#9945FF', BNB:'#F0B90B', USDT:'#26A17B',
  ADA:'#0033AD', DOT:'#E6007A', AVAX:'#E84142', MATIC:'#8247E5', LINK:'#2A5ADA',
}
const COIN_ICONS: Record<string,string> = {
  BTC:'₿', ETH:'Ξ', SOL:'◎', BNB:'⬡', USDT:'₮',
  ADA:'₳', DOT:'●', AVAX:'▲', MATIC:'⬟', LINK:'⬡',
}

export default function CryptoPage() {
  const { user } = useAuth()
  const [cur, setCur] = useState<Currency>('USD')

  if (!user) return null
  const u = user as any
  const assets: any[] = u.cryptoAssets || []
  const totalUSD = assets.reduce((s, a) => s + (a.valueUSD || 0), 0)

  function fmt(usd: number) { return convertCurrency(usd, cur) }

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
            <h2 className="font-display text-2xl font-bold">Crypto Assets</h2>
            <p className="text-sm" style={{ color:'var(--color-muted)' }}>Digital asset portfolio</p>
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
            <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Total Crypto Value</p>
            <p className="font-display text-4xl font-bold text-white">{fmt(totalUSD)}</p>
            {cur !== 'USD' && <p className="text-sm text-white/40 mt-1">= {fmtUSD(totalUSD)} USD</p>}
          </div>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background:'rgba(245,158,11,.2)' }}>
            <Bitcoin size={24} style={{ color:'#F59E0B' }} />
          </div>
        </div>
        <div className="flex gap-3 mt-5 flex-wrap">
          <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background:'rgba(16,185,129,.2)', color:'#10B981' }}>
            {assets.length} Coins
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background:'rgba(245,158,11,.2)', color:'#F59E0B' }}>
            Multi-chain
          </span>
        </div>
      </Card>

      {/* Assets table */}
      <Card className="p-6">
        <SectionHeader title="Holdings" />
        <div className="space-y-0">
          {assets.length === 0 ? (
            <p className="text-sm text-center py-10" style={{ color:'var(--color-muted)' }}>No crypto assets</p>
          ) : assets.map((a: any, i: number) => {
            const color  = COIN_COLORS[a.symbol] || '#6B7A99'
            const icon   = COIN_ICONS[a.symbol]  || '◉'
            const gain   = a.currentPrice - a.avgBuyPrice
            const gainPct= a.avgBuyPrice > 0 ? ((gain / a.avgBuyPrice) * 100).toFixed(2) : '0'
            const isUp   = gain >= 0
            return (
              <div key={i} className="py-4 border-b last:border-0"
                style={{ borderColor:'var(--color-border)', background: i%2!==0 ? 'var(--color-bg)' : 'transparent',
                  margin: i%2!==0 ? '0 -24px' : '', padding: i%2!==0 ? '16px 24px' : '16px 0' }}>
                <div className="flex items-center gap-4">
                  {/* Coin icon */}
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-lg"
                    style={{ background: color+'18', color }}>
                    {icon}
                  </div>
                  {/* Name + wallet */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold">{a.coin}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={{ background: color+'18', color }}>{a.symbol}</span>
                    </div>
                    <p className="text-xs mt-0.5 truncate" style={{ color:'var(--color-muted)' }}>
                      {a.network} · {a.quantity.toLocaleString()} {a.symbol}
                    </p>
                    {a.walletAddress && (
                      <p className="text-[10px] mt-0.5 font-mono truncate" style={{ color:'var(--color-muted)' }}>
                        {a.walletAddress.slice(0,12)}…{a.walletAddress.slice(-6)}
                      </p>
                    )}
                  </div>
                  {/* Prices */}
                  <div className="text-right">
                    <p className="text-sm font-bold font-mono">{fmt(a.valueUSD)}</p>
                    <p className="text-xs font-mono" style={{ color:'var(--color-muted)' }}>
                      @ {fmtUSD(a.currentPrice)}
                    </p>
                    <div className={`flex items-center justify-end gap-1 mt-0.5 ${isUp ? 'text-emerald-500' : 'text-red-500'}`}>
                      {isUp ? <TrendingUp size={11}/> : <TrendingDown size={11}/>}
                      <span className="text-xs font-semibold">{isUp?'+':''}{gainPct}%</span>
                    </div>
                  </div>
                </div>
                {/* Progress bar — share of portfolio */}
                <div className="mt-3 ml-15">
                  <div className="flex justify-between text-[10px] mb-1" style={{ color:'var(--color-muted)' }}>
                    <span>Avg buy: {fmtUSD(a.avgBuyPrice)}</span>
                    <span>{totalUSD > 0 ? ((a.valueUSD/totalUSD)*100).toFixed(1) : 0}% of portfolio</span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background:'var(--color-border)' }}>
                    <div className="h-1.5 rounded-full" style={{ width:`${Math.min(100,totalUSD>0?(a.valueUSD/totalUSD)*100:0)}%`, background:color }} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Summary card */}
      <Card className="p-5">
        <SectionHeader title="Portfolio Summary" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label:'Total Value', value: fmt(totalUSD) },
            { label:'# of Coins',  value: String(assets.length) },
            { label:'Largest Hold',value: assets.sort((a,b)=>b.valueUSD-a.valueUSD)[0]?.symbol || '—' },
            { label:'Networks',    value: Array.from(new Set(assets.map((a: any) => a.network))).length + ' chains'},
          ].map(({label,value}) => (
            <div key={label} className="text-center p-3 rounded-xl" style={{ background:'var(--color-bg)' }}>
              <p className="text-xs font-semibold mb-1" style={{ color:'var(--color-muted)' }}>{label}</p>
              <p className="text-base font-bold">{value}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
