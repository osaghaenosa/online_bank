'use client'
import Link from 'next/link'
import { Target, ArrowUpRight } from 'lucide-react'
import { fmtUSD } from '@/lib/api'

export function ReserveGoalRing({
  savingsBalance,
  savingsGoal,
}: {
  savingsBalance: number
  savingsGoal: number
}) {
  const goal = Math.max(1, savingsGoal || 5000)
  const pct = Math.min(100, Math.round(((savingsBalance || 0) / goal) * 100))
  const r = 46
  const c = 2 * Math.PI * r
  const offset = c - (pct / 100) * c

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#EBF2FF] text-[#0052CC] flex items-center justify-center">
            <Target size={16} />
          </div>
          <div>
            <h3 className="font-display font-bold text-sm text-[#002B5B] leading-tight">Reserve Vault</h3>
            <p className="text-[11px] text-slate-400">Savings goal progress</p>
          </div>
        </div>
        <Link
          href="/account"
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#0052CC] hover:text-[#002B5B]"
        >
          <span>Manage</span>
          <ArrowUpRight size={13} />
        </Link>
      </div>

      <div className="flex items-center gap-5">
        {/* Radial SVG Ring (Image 3 Deposit Ring inspiration) */}
        <div className="relative w-[112px] h-[112px] flex-shrink-0 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 112 112">
            <defs>
              <linearGradient id="brbRingGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#0052CC" />
                <stop offset="100%" stopColor="#60A5FA" />
              </linearGradient>
            </defs>
            <circle
              cx="56"
              cy="56"
              r={r}
              fill="none"
              stroke="#EBF2FF"
              strokeWidth="10"
            />
            <circle
              cx="56"
              cy="56"
              r={r}
              fill="none"
              stroke="url(#brbRingGrad)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={c}
              strokeDashoffset={offset}
              className="transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="font-mono font-bold text-lg text-[#002B5B] leading-none">{pct}%</span>
            <span className="text-[10px] font-medium text-slate-400 mt-1">Reached</span>
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-2.5">
          <div>
            <p className="text-[11px] text-slate-400 font-medium">Current Reserve</p>
            <p className="font-mono font-bold text-lg text-[#002B5B] truncate">
              {fmtUSD(savingsBalance || 0)}
            </p>
          </div>
          <div className="pt-2 border-t border-slate-100">
            <p className="text-[11px] text-slate-400 font-medium">Target Goal</p>
            <p className="font-mono font-semibold text-xs text-[#0052CC] truncate">
              {fmtUSD(goal)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
