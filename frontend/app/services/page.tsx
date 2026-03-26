'use client'
import Link from 'next/link'
import { PublicNav } from '@/components/layout/PublicNav'
import { ArrowRight, Download, Upload, Send, Bitcoin, CreditCard, FileText, Building, Smartphone, DollarSign, CheckCircle } from 'lucide-react'

const SERVICES = [
  {
    icon: Download, color: '#10B981', title: 'Deposits',
    desc: 'Fund your account via bank transfer, ACH, wire, debit/credit card, crypto, or PayPal.',
    features: ['Instant card deposits', 'Same-day ACH', 'Crypto BTC/ETH/USDT/BNB/SOL', 'PayPal, Venmo, Zelle'],
  },
  {
    icon: Upload, color: '#EF4444', title: 'Withdrawals',
    desc: 'Get your money out fast. Free ACH, wire transfers, crypto payouts, and instant card withdrawals.',
    features: ['Free ACH withdrawals', 'Same-day wire ($25)', 'Crypto to any wallet', 'Instant debit card payout'],
  },
  {
    icon: Send, color: '#3B82F6', title: 'Transfers',
    desc: 'Send money to any NexaBank user instantly with zero fees by email or account number.',
    features: ['Instant internal transfers', 'Send by email or account #', 'Zero transfer fees', 'Add a memo/note'],
  },
  {
    icon: Bitcoin, color: '#F59E0B', title: 'Crypto',
    desc: 'Hold and transact in Bitcoin, Ethereum, USDT, BNB, and Solana alongside your USD balance.',
    features: ['5 cryptocurrencies', 'Multiple networks (ERC-20, TRC-20, BEP-20)', 'Real-time coin prices', 'Wallet address + QR code'],
  },
  {
    icon: Building, color: '#8B5CF6', title: 'Bill Payments',
    desc: 'Pay utility bills, rent, subscriptions, and more directly from your NexaBank balance.',
    features: ['Electricity, water, gas', 'Internet & phone', 'Rent payments', 'Subscription management'],
  },
  {
    icon: FileText, color: '#06B6D4', title: 'Transaction Receipts',
    desc: 'Every single transaction generates a professional PDF receipt automatically — forever.',
    features: ['Auto-generated PDFs', 'Full transaction details', 'Downloadable & shareable', 'Accessible anytime'],
  },
]

const PAYMENT_GRID = [
  { name: 'Bank Transfer',  fee: 'Free',   speed: 'Instant',     icon: '🏦' },
  { name: 'ACH Transfer',   fee: 'Free',   speed: '1–3 days',    icon: '🔄' },
  { name: 'Wire Transfer',  fee: '$25',    speed: 'Same day',    icon: '⚡' },
  { name: 'Debit Card',     fee: '2.5%',   speed: 'Instant',     icon: '💳' },
  { name: 'Bitcoin (BTC)',  fee: '$2.50',  speed: '10–30 min',   icon: '₿' },
  { name: 'Ethereum (ETH)', fee: '$2.50',  speed: '2–5 min',     icon: 'Ξ' },
  { name: 'USDT',           fee: '$2.50',  speed: 'Instant',     icon: '💲' },
  { name: 'BNB',            fee: '$2.50',  speed: '3–5 min',     icon: '🟡' },
  { name: 'Solana (SOL)',   fee: '$2.50',  speed: '< 1 min',     icon: '◎' },
  { name: 'PayPal',         fee: 'Free',   speed: 'Instant',     icon: '🅿' },
  { name: 'Zelle',          fee: 'Free',   speed: 'Instant',     icon: '💜' },
  { name: 'Apple Pay',      fee: 'Free',   speed: 'Instant',     icon: '🍎' },
]

export default function ServicesPage() {
  return (
    <div className="min-h-screen" style={{ background: '#080E1C', color: '#fff' }}>
      <PublicNav />

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6"
          style={{ background: 'rgba(16,185,129,.1)', border: '1px solid rgba(16,185,129,.25)' }}>
          <span className="text-xs font-semibold" style={{ color: '#10B981' }}>Full-Stack Banking</span>
        </div>
        <h1 className="font-display text-5xl md:text-6xl font-bold text-white mb-6">
          Everything you need.<br /><span style={{ color: '#10B981' }}>Nothing you don't.</span>
        </h1>
        <p className="text-lg text-white/55 max-w-2xl mx-auto">
          12+ payment methods, real-time receipts, crypto integration, and bill payments — all in one account with zero monthly fees.
        </p>
      </section>

      {/* Services grid */}
      <section className="py-10 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SERVICES.map(({ icon: Icon, color, title, desc, features }) => (
            <div key={title} className="rounded-2xl p-7"
              style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)' }}>
              <div className="w-13 h-13 w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                style={{ background: color + '18' }}>
                <Icon size={22} style={{ color }} />
              </div>
              <h3 className="font-display font-bold text-xl text-white mb-2">{title}</h3>
              <p className="text-sm text-white/50 mb-5 leading-relaxed">{desc}</p>
              <ul className="space-y-2">
                {features.map(f => (
                  <li key={f} className="flex items-center gap-2.5">
                    <CheckCircle size={13} style={{ color: '#10B981', flexShrink: 0 }} />
                    <span className="text-xs text-white/65">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Payment methods table */}
      <section className="py-20 px-6" style={{ background: 'rgba(255,255,255,.02)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold text-white mb-3">Payment Method Comparison</h2>
            <p className="text-white/50">Choose the right method for every situation</p>
          </div>
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,.08)' }}>
            <div className="grid grid-cols-4 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white/40"
              style={{ background: 'rgba(255,255,255,.04)' }}>
              <span>Method</span><span>Fee</span><span>Speed</span><span>Available</span>
            </div>
            {PAYMENT_GRID.map(({ name, fee, speed, icon }, i) => (
              <div key={name} className="grid grid-cols-4 px-6 py-4 items-center"
                style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,.02)', borderTop: '1px solid rgba(255,255,255,.05)' }}>
                <div className="flex items-center gap-3">
                  <span className="text-lg">{icon}</span>
                  <span className="text-sm font-medium text-white">{name}</span>
                </div>
                <span className="text-sm font-mono font-bold" style={{ color: fee === 'Free' ? '#10B981' : '#F59E0B' }}>{fee}</span>
                <span className="text-sm text-white/60">{speed}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold inline-block w-fit"
                  style={{ background: 'rgba(16,185,129,.12)', color: '#10B981' }}>Active</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Limits table */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold text-white mb-3">Account Limits</h2>
            <p className="text-white/50">Transparent limits, no surprises</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { label: 'Daily Deposit',     value: '$50,000',  note: 'Per day, all methods combined' },
              { label: 'Single Withdrawal', value: '$10,000',  note: 'Per transaction maximum' },
              { label: 'Daily Transfer',    value: '$10,000',  note: 'Internal + external per day' },
              { label: 'Monthly Deposit',   value: '$250,000', note: 'Rolling 30-day limit' },
              { label: 'Single Transfer',   value: '$5,000',   note: 'Per individual transfer' },
              { label: 'FDIC Insurance',    value: '$250,000', note: 'Per depositor protection' },
            ].map(({ label, value, note }) => (
              <div key={label} className="rounded-xl p-5 text-center"
                style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)' }}>
                <p className="text-xs text-white/40 mb-1">{label}</p>
                <p className="font-display text-2xl font-bold text-white mb-1">{value}</p>
                <p className="text-xs text-white/35">{note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 text-center">
        <h2 className="font-display text-4xl font-bold text-white mb-4">Start using all features today</h2>
        <p className="text-white/50 mb-8">Free account. Instant setup. No credit check required.</p>
        <Link href="/auth/register"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-white"
          style={{ background: '#10B981' }}>
          Open Free Account <ArrowRight size={16} />
        </Link>
      </section>

      <footer className="border-t py-10 px-6" style={{ borderColor: 'rgba(255,255,255,.08)' }}>
        <div className="max-w-7xl mx-auto flex justify-between">
          <p className="text-sm font-display font-bold text-white"><span style={{ color: '#10B981' }}>N</span>exaBank</p>
          <p className="text-xs text-white/30">© 2025 NexaBank. Demo application.</p>
        </div>
      </footer>
    </div>
  )
}
