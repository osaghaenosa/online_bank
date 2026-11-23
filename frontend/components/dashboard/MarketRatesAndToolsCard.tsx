'use client'
import Link from 'next/link'
import {
  CreditCard, TrendingUp, Coins, Building2, Download, Upload, Globe, ArrowUpRight
} from 'lucide-react'
import { FX, convertCurrency } from '@/lib/api'

const CURRENCY_ROWS = [
  { code: 'USD', name: 'US Dollar', flag: '🇺🇸', buy: FX.USD.toFixed(4), sell: '1.0000' },
  { code: 'GBP', name: 'British Pound', flag: '🇬🇧', buy: FX.GBP.toFixed(4), sell: (FX.GBP * 1.028).toFixed(4) },
  { code: 'EUR', name: 'Euro', flag: '🇪🇺', buy: FX.EUR.toFixed(4), sell: (FX.EUR * 1.025).toFixed(4) },
]

const TOOLS = [
  { href: '/card', label: 'Debit Cards', sub: 'Virtual & PIN', icon: CreditCard },
  { href: '/wealth', label: 'Wealth Vaults', sub: 'Assets & Trust', icon: TrendingUp },
  { href: '/tokens', label: 'Security Tokens', sub: 'TTN Codes', icon: Coins },
  { href: '/account', label: 'Checking Ledger', sub: 'Routing & Specs', icon: Building2 },
  { href: '/deposit', label: 'Fund Account', sub: '12+ Channels', icon: Download },
  { href: '/withdraw', label: 'Disbursements', sub: 'ACH, Wire, IBAN', icon: Upload },
]

export function MarketRatesAndToolsCard({ balance }: { balance: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
      {/* UXDA Currency Rates & Live Equivalent */}
      <div className="md:col-span-5 bg-white rounded-2xl border border-slate-200/80 shadow-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#EBF2FF] text-[#0052CC] flex items-center justify-center">
              <Globe size={15} />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-[#002B5B] leading-tight">Currency Rates</h3>
              <p className="text-[11px] text-slate-400">Live balance equivalents</p>
            </div>
          </div>
          <Link href="/wealth" className="text-xs font-semibold text-[#0052CC] hover:underline">
            Wealth →
          </Link>
        </div>

        <div className="space-y-2.5">
          <div className="grid grid-cols-12 text-[10px] font-semibold text-slate-400 px-2 pb-1 border-b border-slate-100">
            <span className="col-span-4">Currency</span>
            <span className="col-span-3 text-right">Rate</span>
            <span className="col-span-5 text-right">Your Balance</span>
          </div>
          {CURRENCY_ROWS.map(row => (
            <div
              key={row.code}
              className="grid grid-cols-12 items-center px-2 py-2 rounded-xl hover:bg-[#F4F7FC] transition-colors text-xs"
            >
              <div className="col-span-4 flex items-center gap-2 min-w-0">
                <span className="text-base leading-none">{row.flag}</span>
                <span className="font-semibold text-[#002B5B]">{row.code}</span>
              </div>
              <span className="col-span-3 text-right font-mono text-slate-500 text-[11px]">
                {row.buy}
              </span>
              <span className="col-span-5 text-right font-mono font-bold text-[#002B5B] truncate">
                {convertCurrency(balance || 0, row.code)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* UXDA Products & Banking Tools Grid */}
      <div className="md:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display font-bold text-sm text-[#002B5B] leading-tight">Products &amp; Banking Tools</h3>
            <p className="text-[11px] text-slate-400">Quick access across your account services</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {TOOLS.map(({ href, label, sub, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="group p-3 rounded-2xl bg-[#F4F7FC] hover:bg-[#EBF2FF] border border-transparent hover:border-blue-200/80 transition-all flex flex-col justify-between gap-2.5"
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-white text-[#0052CC] shadow-sm flex items-center justify-center group-hover:bg-[#0052CC] group-hover:text-white transition-colors">
                  <Icon size={16} />
                </div>
                <ArrowUpRight size={13} className="text-slate-400 group-hover:text-[#0052CC] transition-colors" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#002B5B] truncate">{label}</p>
                <p className="text-[10px] text-slate-500 truncate">{sub}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
