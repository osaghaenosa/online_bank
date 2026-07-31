'use client'
import { Coins, Mail, Headphones } from 'lucide-react'
import { useAuth } from '@/store/auth'
import Link from 'next/link'

const PACKAGES = [
  { tokens: 100, price: 80,   popular: false },
  { tokens: 300, price: 200,  popular: true },
  { tokens: 500, price: 350,  popular: false },
]

export default function TokensPage() {
  const { user } = useAuth()
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold font-display text-gray-900 flex items-center gap-3">
            <Coins className="text-[#10B981]" size={32} />
            Transaction Tokens
          </h1>
          <p className="text-gray-500 mt-2">
            Tokens are required to process your transactions smoothly. Each transaction costs 10 tokens.
          </p>
        </div>
        
        <div className="bg-emerald-50 border border-[#10B981]/20 rounded-xl p-4 flex flex-col items-center min-w-[160px]">
          <span className="text-sm font-semibold text-emerald-800 mb-1">Your Balance</span>
          <span className="text-3xl font-mono font-bold text-[#10B981]">{(user as any)?.tokenBalance || 0}</span>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-12">
        {PACKAGES.map((pkg, i) => (
          <div 
            key={i} 
            className={`relative bg-white rounded-2xl border ${pkg.popular ? 'border-[#10B981] shadow-lg shadow-[#10B981]/10' : 'border-gray-200 shadow-sm'} p-6 flex flex-col`}
          >
            {pkg.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#10B981] text-white text-xs font-bold px-3 py-1 rounded-full">
                MOST POPULAR
              </div>
            )}
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{pkg.tokens} Tokens</h3>
              <div className="text-gray-500 text-sm">Perfect for active users</div>
            </div>
            
            <div className="text-center mb-8">
              <span className="text-4xl font-bold text-gray-900">${pkg.price}</span>
            </div>
            
            <a 
              href="mailto:support@nexabanking.com?subject=Token Purchase Request&body=Hello, I would like to purchase the ${pkg.tokens} tokens package for $${pkg.price}. My account email is: "
              className={`mt-auto w-full py-3 px-4 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 ${
                pkg.popular 
                  ? 'bg-[#10B981] hover:bg-emerald-600 text-white' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
              }`}
            >
              Buy Now
            </a>
          </div>
        ))}
      </div>

      <div className="bg-[#0F1C35] rounded-2xl p-6 sm:p-8 text-white flex flex-col sm:flex-row items-center gap-6 sm:gap-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#10B981]/20 to-transparent rounded-full blur-3xl" />
        
        <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 relative z-10">
          <Headphones size={32} className="text-[#10B981]" />
        </div>
        
        <div className="flex-1 text-center sm:text-left relative z-10">
          <h3 className="text-xl font-bold font-display mb-2">How to purchase tokens?</h3>
          <p className="text-white/70 text-sm max-w-lg">
            To ensure secure processing, token purchases are handled manually. Click 'Buy Now' to email support or contact us directly via the live chat. A secure payment link will be generated uniquely for you.
          </p>
        </div>
        
        <div className="relative z-10 w-full sm:w-auto">
          <a 
            href="mailto:support@nexabanking.com" 
            className="w-full sm:w-auto px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Mail size={18} />
            Contact Support
          </a>
        </div>
      </div>
    </div>
  )
}
