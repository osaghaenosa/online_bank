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
  BTC: '#F59E0B', ETH: '#0052CC', SOL: '#002B5B', BNB: '#D97706', USDT: '#0052CC',
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
            <h2 className="font-display text-lg sm:text-2xl font-bold" style={{ color: '#002B5B' }}>Crypto Assets</h2>
            <p className="text-xs sm:text-sm" style={{ color: 'var(--color-muted)' }}>Digital asset treasury portfolio</p>
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
            <p className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: '#93C5FD' }}>Total Crypto Value</p>
            <p className="font-mono text-2xl sm:text-4xl font-bold text-white truncate">{fmt(totalUSD)}</p>
            {cur !== 'USD' && <p className="text-xs font-mono mt-1" style={{ color: '#BFDBFE' }}>= {fmtUSD(totalUSD)} USD</p>}
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center flex-shrink-0" style={{ background: '#0052CC', color: '#FFFFFF' }}>
            <Bitcoin size={22} />
          </div>
        </div>
        <div className="flex gap-2 mt-4 flex-wrap">
          <span className="px-2.5 py-1 text-[11px] font-bold uppercase" style={{ background: '#0052CC', color: '#FFFFFF' }}>
            {assets.length} Coins
          </span>
          <span className="px-2.5 py-1 text-[11px] font-bold uppercase border" style={{ background: '#001F42', borderColor: '#60A5FA', color: '#93C5FD' }}>
            Multi-Chain Custody
          </span>
        </div>
      </div>

      {/* Assets table */}
      <Card className="p-4 sm:p-6">
        <SectionHeader title="Digital Asset Holdings" />
        <div className="divide-y border" style={{ borderColor: 'var(--color-border)' }}>
          {assets.length === 0 ? (
            <p className="text-sm text-center py-10" style={{ color: 'var(--color-muted)' }}>No crypto assets</p>
          ) : assets.map((a: any, i: number) => {
            const color   = COIN_COLORS[a.symbol] || '#002B5B'
            const icon    = COIN_ICONS[a.symbol]  || '◉'
            const gain    = a.currentPrice - a.avgBuyPrice
            const gainPct = a.avgBuyPrice > 0 ? ((gain / a.avgBuyPrice) * 100).toFixed(2) : '0'
            const isUp    = gain >= 0
            return (
              <div
                key={i}
                className="p-3.5 sm:p-4"
                style={{ background: i % 2 !== 0 ? '#F8FAFC' : '#FFFFFF' }}
              >
                <div className="flex items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className="w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center flex-shrink-0 font-bold text-base sm:text-lg border"
                      style={{ background: '#EBF2FF', borderColor: '#93C5FD', color: '#002B5B' }}
                    >
                      {icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs sm:text-sm font-bold truncate" style={{ color: '#002B5B' }}>{a.coin}</p>
                        <span className="text-[10px] px-1.5 py-0.5 font-bold uppercase" style={{ background: '#EBF2FF', color: '#0052CC' }}>
                          {a.symbol}
                        </span>
                      </div>
                      <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--color-muted)' }}>
                        {a.network} · {a.quantity.toLocaleString()} {a.symbol}
                      </p>
                      {a.walletAddress && (
                        <p className="text-[11px] mt-0.5 font-mono truncate" style={{ color: 'var(--color-muted)' }}>
                          {a.walletAddress.slice(0, 10)}…{a.walletAddress.slice(-6)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Prices */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs sm:text-sm font-bold font-mono whitespace-nowrap" style={{ color: '#002B5B' }}>
                      {fmt(a.valueUSD)}
                    </p>
                    <p className="text-[11px] font-mono whitespace-nowrap" style={{ color: 'var(--color-muted)' }}>
                      @ {fmtUSD(a.currentPrice)}
                    </p>
                    <div className={`flex items-center justify-end gap-1 mt-0.5 ${isUp ? 'text-[#0052CC]' : 'text-red-600'}`}>
                      {isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                      <span className="text-[11px] font-bold whitespace-nowrap">{isUp ? '+' : ''}{gainPct}%</span>
                    </div>
                  </div>
                </div>

                {/* Progress bar — share of portfolio */}
                <div className="mt-3">
                  <div className="flex justify-between text-[11px] mb-1 gap-2" style={{ color: 'var(--color-muted)' }}>
                    <span className="truncate">Avg buy: {fmtUSD(a.avgBuyPrice)}</span>
                    <span className="whitespace-nowrap flex-shrink-0">
                      {totalUSD > 0 ? ((a.valueUSD / totalUSD) * 100).toFixed(1) : 0}% of portfolio
                    </span>
                  </div>
                  <div className="h-1.5 border" style={{ background: '#F1F5F9', borderColor: '#CBD5E1' }}>
                    <div
                      className="h-full"
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
      <Card className="p-4 sm:p-5">
        <SectionHeader title="Portfolio Summary" />
        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total Value',  value: fmt(totalUSD) },
            { label: '# of Coins',   value: String(assets.length) },
            { label: 'Largest Hold', value: [...assets].sort((a, b) => b.valueUSD - a.valueUSD)[0]?.symbol || '—' },
            { label: 'Networks',     value: [...new Set(assets.map((a: any) => a.network))].length + ' chains' },
          ].map(({ label, value }) => (
            <div key={label} className="p-3 border" style={{ background: '#F8FAFC', borderColor: '#CBD5E1' }}>
              <p className="text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--color-muted)' }}>{label}</p>
              <p className="text-sm sm:text-base font-bold font-mono truncate" style={{ color: '#002B5B' }}>{value}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
