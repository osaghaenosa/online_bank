'use client'
import { useState } from 'react'
import { useAuth } from '@/store/auth'
import { fmtUSD, convertCurrency } from '@/lib/api'
import { Card, SectionHeader } from '@/components/ui'
import { Bitcoin, TrendingUp, TrendingDown, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const CURRENCIES = ['USD', 'GBP', 'EUR'] as const
type Currency = typeof CURRENCIES[number]
const CUR_SYMBOL: Record<Currency, string> = { USD: '$', GBP: '£', EUR: '€' }

const COIN_COLORS: Record<string, string> = {
  BTC: '#F59E0B', ETH: '#0052CC', SOL: '#002B5B', BNB: '#D97706', USDT: '#059669',
  ADA: '#0033AD', DOT: '#002B5B', AVAX: '#DC2626', MATIC: '#0052CC', LINK: '#2A5ADA',
}
const COIN_ICONS: Record<string, string> = {
  BTC: '₿', ETH: 'Ξ', SOL: '◎', BNB: '⬡', USDT: '₮',
  ADA: '₳', DOT: '●', AVAX: '▲', MATIC: '⬟', LINK: '⬡',
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/wealth">
            <button className="w-10 h-10 rounded-full border border-slate-200/80 bg-white hover:bg-[#F4F7FC] flex items-center justify-center transition-colors cursor-pointer text-[#002B5B]">
              <ArrowLeft size={16} />
            </button>
          </Link>
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[#002B5B]">Crypto Assets</h2>
            <p className="text-xs sm:text-sm text-slate-500">Digital asset treasury portfolio</p>
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
            <p className="text-xs font-medium text-blue-200 mb-1">Total Crypto Value</p>
            <p className="font-mono text-3xl sm:text-4xl font-bold text-white truncate">{fmt(totalUSD)}</p>
            {cur !== 'USD' && <p className="text-xs font-mono mt-1 text-blue-100">= {fmtUSD(totalUSD)} USD</p>}
          </div>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 bg-white/15 text-blue-200">
            <Bitcoin size={24} />
          </div>
        </div>
        <div className="flex gap-2 mt-4 flex-wrap">
          <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-white/15 text-white">
            {assets.length} Coins
          </span>
          <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-white/10 border border-white/15 text-blue-100">
            Multi-Chain Custody
          </span>
        </div>
      </div>

      {/* Assets table */}
      <Card className="p-5 sm:p-6">
        <SectionHeader title="Digital Asset Holdings" />
        <div className="space-y-3">
          {assets.length === 0 ? (
            <p className="text-sm text-center py-10 text-slate-400">No crypto assets</p>
          ) : assets.map((a: any, i: number) => {
            const color   = COIN_COLORS[a.symbol] || '#0052CC'
            const icon    = COIN_ICONS[a.symbol]  || '◉'
            const gain    = a.currentPrice - a.avgBuyPrice
            const gainPct = a.avgBuyPrice > 0 ? ((gain / a.avgBuyPrice) * 100).toFixed(2) : '0'
            const isUp    = gain >= 0
            return (
              <div
                key={i}
                className="p-4 rounded-2xl bg-[#F4F7FC]"
              >
                <div className="flex items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 font-bold text-lg bg-white text-[#002B5B] shadow-sm">
                      {icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold truncate text-[#002B5B]">{a.coin}</p>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-[#EBF2FF] text-[#0052CC]">
                          {a.symbol}
                        </span>
                      </div>
                      <p className="text-xs mt-0.5 truncate text-slate-500">
                        {a.network} · {a.quantity.toLocaleString()} {a.symbol}
                      </p>
                      {a.walletAddress && (
                        <p className="text-[11px] mt-0.5 font-mono truncate text-slate-400">
                          {a.walletAddress.slice(0, 10)}…{a.walletAddress.slice(-6)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Prices */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold font-mono whitespace-nowrap text-[#002B5B]">
                      {fmt(a.valueUSD)}
                    </p>
                    <p className="text-[11px] font-mono whitespace-nowrap text-slate-400">
                      @ {fmtUSD(a.currentPrice)}
                    </p>
                    <div className="flex items-center justify-end gap-1 mt-0.5" style={{ color: isUp ? '#059669' : '#DC2626' }}>
                      {isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                      <span className="text-[11px] font-bold whitespace-nowrap">{isUp ? '+' : ''}{gainPct}%</span>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-[11px] mb-1 gap-2 text-slate-500">
                    <span className="truncate">Avg buy: {fmtUSD(a.avgBuyPrice)}</span>
                    <span className="whitespace-nowrap flex-shrink-0">
                      {totalUSD > 0 ? ((a.valueUSD / totalUSD) * 100).toFixed(1) : 0}% of portfolio
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-white overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${Math.min(100, totalUSD > 0 ? (a.valueUSD / totalUSD) * 100 : 0)}%`, background: color }}
                    />
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total Value',  value: fmt(totalUSD) },
            { label: '# of Coins',   value: String(assets.length) },
            { label: 'Largest Hold', value: [...assets].sort((a, b) => b.valueUSD - a.valueUSD)[0]?.symbol || '—' },
            { label: 'Networks',     value: [...new Set(assets.map((a: any) => a.network))].length + ' chains' },
          ].map(({ label, value }) => (
            <div key={label} className="p-3.5 rounded-2xl bg-[#F4F7FC]">
              <p className="text-xs font-medium mb-1 text-slate-500">{label}</p>
              <p className="text-base font-bold font-mono truncate text-[#002B5B]">{value}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
