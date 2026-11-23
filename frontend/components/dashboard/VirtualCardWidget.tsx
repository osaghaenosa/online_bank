'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, Wifi, ArrowUpRight, CreditCard } from 'lucide-react'
import type { User } from '@/store/auth'

export function VirtualCardWidget({ user }: { user: User | null }) {
  const [showLast4, setShowLast4] = useState(true)
  const last4 = String(user?.cardNumber || '0000').slice(-4)
  const status = user?.cardStatus || 'Not Requested'
  const isActive = status === 'Active'

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="font-display font-bold text-base text-[#002B5B]">My Card</h3>
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
            style={{
              background: isActive ? '#ECFDF5' : status === 'Blocked' ? '#FEF2F2' : '#EBF2FF',
              color: isActive ? '#059669' : status === 'Blocked' ? '#DC2626' : '#0052CC',
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: isActive ? '#10B981' : status === 'Blocked' ? '#EF4444' : '#0052CC' }}
            />
            {status}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setShowLast4(v => !v)}
          className="w-8 h-8 rounded-full bg-[#F4F7FC] hover:bg-[#EBF2FF] text-[#002B5B] flex items-center justify-center transition-colors cursor-pointer"
          title={showLast4 ? 'Mask digits' : 'Show last 4 digits'}
        >
          {showLast4 ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>

      {/* Luminous Brand Debit Card */}
      <div className="relative rounded-3xl brand-card-gradient p-5 text-white overflow-hidden shadow-brand">
        {/* Decorative background curves */}
        <svg
          className="absolute inset-0 w-full h-full opacity-20 pointer-events-none"
          viewBox="0 0 400 240"
          fill="none"
          preserveAspectRatio="none"
        >
          <circle cx="340" cy="30" r="110" fill="#60A5FA" fillOpacity="0.35" />
          <circle cx="60" cy="210" r="95" fill="#FFFFFF" fillOpacity="0.18" />
          <path
            d="M-20 175 C 90 120, 210 220, 420 105"
            stroke="#93C5FD"
            strokeWidth="1.5"
            strokeOpacity="0.55"
          />
        </svg>

        <div className="relative z-10 flex flex-col justify-between min-h-[168px]">
          {/* Top Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-6 rounded-md bg-white/15 border border-white/25 backdrop-blur-sm flex items-center justify-center">
                <div className="w-4 h-3 rounded-sm border border-blue-200/70" />
              </div>
              <Wifi size={15} className="text-blue-200 rotate-90" />
            </div>
            <span className="text-xs font-display font-bold tracking-wider uppercase text-white/95 bg-white/15 px-2.5 py-1 rounded-full">
              {user?.cardType || 'VISA'}
            </span>
          </div>

          {/* Card Number */}
          <div className="my-4">
            <p className="text-[10px] text-blue-200 font-medium mb-1">Blue ridge Commercial Debit</p>
            <p className="font-mono text-base sm:text-lg font-bold tracking-[0.16em] text-white whitespace-nowrap">
              {showLast4 ? `•••• •••• •••• ${last4}` : '•••• •••• •••• ••••'}
            </p>
          </div>

          {/* Bottom Row */}
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] text-blue-200">Card Holder</p>
              <p className="text-xs sm:text-sm font-semibold text-white truncate">
                {user?.firstName} {user?.lastName}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-[10px] text-blue-200">Expires</p>
              <p className="font-mono text-xs sm:text-sm font-semibold text-white">
                {user?.cardExpiry || '••/••'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Link */}
      <div className="mt-4 flex items-center justify-between text-xs">
        <span className="text-slate-500 flex items-center gap-1.5">
          <CreditCard size={13} className="text-[#0052CC]" />
          {isActive ? 'Virtual & online ready' : 'Card settings & PIN reveal'}
        </span>
        <Link
          href="/card"
          className="inline-flex items-center gap-1 font-semibold text-[#0052CC] hover:text-[#002B5B] transition-colors"
        >
          <span>Manage</span>
          <ArrowUpRight size={13} />
        </Link>
      </div>
    </div>
  )
}
