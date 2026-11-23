'use client'
import { useEffect, useState } from 'react'
import { Coins, Mail, Headphones } from 'lucide-react'
import { useAuth } from '@/store/auth'
import { api } from '@/lib/api'

const DEFAULT_PACKAGES = [
  { tokens: 100, price: 10, popular: false },
  { tokens: 300, price: 20, popular: true },
  { tokens: 500, price: 30, popular: false },
]

export default function TokensPage() {
  const { user } = useAuth()
  const [packages, setPackages] = useState(DEFAULT_PACKAGES)

  useEffect(() => {
    api.settings.getTokenPackages()
      .then(data => {
        if (Array.isArray(data.packages) && data.packages.length === 3) setPackages(data.packages)
      })
      .catch(() => {})
  }, [])

  return (
    <div className="max-w-4xl mx-auto space-y-8 fade-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="inline-block px-3 py-1 rounded-full text-[11px] font-semibold bg-[#EBF2FF] text-[#0052CC] mb-2">
            Cryptographic Settlement Credentials
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold font-display flex items-center gap-3 text-[#002B5B]">
            <Coins className="text-[#0052CC]" size={28} />
            Security Authorization Tokens
          </h1>
          <p className="text-sm mt-1.5 text-slate-500 max-w-xl">
            Track Token Numbers (TTN) are required to authorize outbound settlements. Each transaction requires 10 tokens.
          </p>
        </div>

        <div className="rounded-3xl p-5 flex flex-col items-center min-w-[175px] brand-card-gradient text-white shadow-brand">
          <span className="text-[11px] font-medium text-blue-200 mb-1">
            Available Tokens
          </span>
          <span className="text-3xl font-mono font-bold text-white">{(user as any)?.tokenBalance || 0}</span>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {packages.map((pkg, i) => (
          <div
            key={i}
            className="relative bg-white rounded-3xl p-6 flex flex-col border transition-all"
            style={{
              borderColor: pkg.popular ? '#0052CC' : '#E2E8F0',
              boxShadow: pkg.popular ? '0 14px 40px rgba(0, 82, 204, 0.14)' : '0 4px 24px rgba(0, 43, 91, 0.045)',
            }}
          >
            {pkg.popular && (
              <div className="mb-4 py-1 px-3 rounded-full text-white text-[11px] font-semibold text-center bg-[#0052CC]">
                Recommended Allocation
              </div>
            )}
            <div className="text-center mb-5 mt-1">
              <h3 className="text-2xl font-bold font-display mb-1 text-[#002B5B]">
                {pkg.tokens} Tokens
              </h3>
              <div className="text-xs font-medium text-slate-500">
                {Math.floor(pkg.tokens / 10)} Outbound Authorizations
              </div>
            </div>

            <div className="text-center mb-6 py-5 rounded-2xl bg-[#F4F7FC]">
              <span className="text-4xl font-mono font-bold text-[#002B5B]">${pkg.price}</span>
              <span className="text-xs font-mono ml-1.5 text-slate-400">USD</span>
            </div>

            <a
              href={`mailto:support@theblueridges.com?${new URLSearchParams({
                subject: 'Token Purchase Request',
                body: `Hello, I would like to purchase the ${pkg.tokens} tokens package for $${pkg.price}. My account email is: ${user?.email || ''}`,
              }).toString()}`}
              className="mt-auto w-full py-3 px-4 rounded-full text-xs font-semibold transition-all flex items-center justify-center gap-2 text-white shadow-brand hover:opacity-95"
              style={{
                background: pkg.popular
                  ? 'linear-gradient(135deg, #0052CC 0%, #003D99 100%)'
                  : '#002B5B',
              }}
            >
              Request Token Allocation
            </a>
          </div>
        ))}
      </div>

      <div className="p-6 sm:p-8 rounded-3xl brand-card-gradient text-white flex flex-col sm:flex-row items-center gap-6 sm:gap-8 shadow-float">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 bg-white/15 text-blue-200">
          <Headphones size={28} />
        </div>

        <div className="flex-1 text-center sm:text-left">
          <h3 className="text-lg font-bold font-display mb-1.5 text-white">
            Token Provisioning Procedure
          </h3>
          <p className="text-xs sm:text-sm max-w-lg leading-relaxed text-blue-100">
            For compliance verification, token allocations are provisioned by our support desk. Click &ldquo;Request Token Allocation&rdquo; or contact us via Live Support Chat to receive your Track Token Number.
          </p>
        </div>

        <div className="w-full sm:w-auto">
          <a
            href="mailto:support@theblueridges.com"
            className="w-full sm:w-auto px-6 py-3 rounded-full text-xs font-semibold text-[#002B5B] bg-white hover:bg-blue-50 transition-all flex items-center justify-center gap-2 whitespace-nowrap shadow-md"
          >
            <Mail size={15} />
            <span>Contact Support Desk</span>
          </a>
        </div>
      </div>
    </div>
  )
}
