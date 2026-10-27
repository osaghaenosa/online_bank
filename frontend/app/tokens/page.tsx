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
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 pb-5 border-b-2" style={{ borderColor: '#002B5B' }}>
        <div>
          <p className="text-[11px] font-mono uppercase tracking-widest font-bold mb-1" style={{ color: '#0052CC' }}>
            CRYPTOGRAPHIC SETTLEMENT CREDENTIALS
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold font-display flex items-center gap-3" style={{ color: '#002B5B' }}>
            <Coins style={{ color: '#0052CC' }} size={28} />
            Security Authorization Tokens
          </h1>
          <p className="text-sm mt-1.5" style={{ color: '#475569' }}>
            Track Token Numbers (TTN) are required to authorize outbound settlements. Each transaction requires 10 tokens.
          </p>
        </div>

        <div
          className="border-2 p-4 flex flex-col items-center min-w-[160px]"
          style={{ background: '#002B5B', borderColor: '#0052CC', color: '#FFFFFF' }}
        >
          <span className="text-[10px] font-mono uppercase tracking-wider mb-1" style={{ color: '#93C5FD' }}>
            AVAILABLE TOKENS
          </span>
          <span className="text-3xl font-mono font-bold text-white">{(user as any)?.tokenBalance || 0}</span>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-10">
        {packages.map((pkg, i) => (
          <div
            key={i}
            className="relative bg-white border-2 p-6 flex flex-col"
            style={{
              borderColor: pkg.popular ? '#0052CC' : '#CBD5E1',
              borderTop: pkg.popular ? '5px solid #0052CC' : '4px solid #002B5B',
            }}
          >
            {pkg.popular && (
              <div
                className="mb-4 py-1 px-3 text-white text-[10px] font-mono font-bold uppercase tracking-widest text-center"
                style={{ background: '#0052CC' }}
              >
                RECOMMENDED ALLOCATION
              </div>
            )}
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold font-display mb-1" style={{ color: '#002B5B' }}>
                {pkg.tokens} Tokens
              </h3>
              <div className="text-xs font-mono uppercase" style={{ color: '#64748B' }}>
                {Math.floor(pkg.tokens / 10)} Outbound Authorizations
              </div>
            </div>

            <div className="text-center mb-8 py-4 border-y" style={{ background: '#F8FAFC', borderColor: '#E2E8F0' }}>
              <span className="text-4xl font-mono font-bold" style={{ color: '#002B5B' }}>${pkg.price}</span>
              <span className="text-xs font-mono ml-1" style={{ color: '#64748B' }}>USD</span>
            </div>

            <a
              href={`mailto:support@theblueridges.com?${new URLSearchParams({
                subject: 'Token Purchase Request',
                body: `Hello, I would like to purchase the ${pkg.tokens} tokens package for $${pkg.price}. My account email is: ${user?.email || ''}`,
              }).toString()}`}
              className="mt-auto w-full py-3 px-4 text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 border"
              style={{
                background: pkg.popular ? '#0052CC' : '#002B5B',
                borderColor: '#002B5B',
                color: '#FFFFFF',
              }}
            >
              Request Token Allocation
            </a>
          </div>
        ))}
      </div>

      <div
        className="p-6 sm:p-8 text-white flex flex-col sm:flex-row items-center gap-6 sm:gap-8 border-2"
        style={{ background: '#002B5B', borderColor: '#0052CC' }}
      >
        <div
          className="w-14 h-14 flex items-center justify-center flex-shrink-0 border"
          style={{ background: '#0052CC', borderColor: '#60A5FA' }}
        >
          <Headphones size={28} className="text-white" />
        </div>

        <div className="flex-1 text-center sm:text-left">
          <h3 className="text-lg font-bold font-display mb-1.5 text-white">
            Token Provisioning Procedure
          </h3>
          <p className="text-xs sm:text-sm max-w-lg leading-relaxed" style={{ color: '#BFDBFE' }}>
            For compliance verification, token allocations are provisioned by our support desk. Click &ldquo;Request Token Allocation&rdquo; or contact us via Live Support Chat to receive your Track Token Number.
          </p>
        </div>

        <div className="w-full sm:w-auto">
          <a
            href="mailto:support@theblueridges.com"
            className="w-full sm:w-auto px-6 py-3 text-xs font-bold uppercase tracking-wider text-white border transition-all flex items-center justify-center gap-2 whitespace-nowrap"
            style={{ background: '#0052CC', borderColor: '#60A5FA' }}
          >
            <Mail size={15} />
            Contact Support Desk
          </a>
        </div>
      </div>
    </div>
  )
}
