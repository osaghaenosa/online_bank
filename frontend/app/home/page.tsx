'use client'
import Link from 'next/link'
import { PublicNav } from '@/components/layout/PublicNav'
import {
  Shield, Zap, Globe, TrendingUp, CreditCard, Smartphone,
  ChevronRight, Star, ArrowRight, CheckCircle, Bitcoin,
  PiggyBank, Lock, Building, Users, DollarSign,
} from 'lucide-react'

const FEATURES = [
  { icon: Zap,        title: 'Instant Transfers',     desc: 'Move money in seconds between any accounts, anywhere in the world with zero fees.' },
  { icon: Shield,     title: 'Bank-Grade Security',   desc: '256-bit encryption, 2FA, and 24/7 fraud monitoring protect every transaction.' },
  { icon: Bitcoin,    title: 'Crypto Integration',    desc: 'Buy, sell, and hold BTC, ETH, USDT, BNB, and SOL directly from your account.' },
  { icon: PiggyBank,  title: 'Smart Savings',         desc: 'Set goals, automate savings, and watch your wealth grow with competitive rates.' },
  { icon: CreditCard, title: 'Virtual Cards',         desc: 'Instant virtual debit cards for secure online shopping with spending controls.' },
]

const PAYMENT_METHODS = [
  { name: 'Bank Transfer', color: '#3B82F6' },
  { name: 'ACH / Wire',    color: '#8B5CF6' },
  { name: 'Bitcoin',       color: '#F59E0B' },
  { name: 'Ethereum',      color: '#6366F1' },
  { name: 'USDT',          color: '#26A17B' },
  { name: 'Solana',        color: '#9945FF' },
]

const STATS = [
  { value: '500K+', label: 'Active Users',        icon: Users },
  { value: '$2.4B', label: 'Transactions Processed', icon: DollarSign },
  { value: '99.9%', label: 'Uptime Guarantee',    icon: CheckCircle },
  { value: '180+',  label: 'Countries Supported', icon: Globe },
]

const TESTIMONIALS = [
  { name: 'Sarah M.', role: 'Freelance Designer', text: 'NexaBank transformed how I handle international payments. The crypto integration alone saved me thousands in fees.', stars: 5 },
  { name: 'James K.', role: 'Small Business Owner', text: 'The admin controls and real-time notifications give me complete visibility over every dollar that moves.', stars: 5 },
  { name: 'Priya S.', role: 'Software Engineer', text: 'I love that I can send money via Zelle, PayPal, or crypto all from one dashboard. The receipts are perfect for expense tracking.', stars: 5 },
]

export default function HomePage() {
  return (
    <div className="min-h-screen" style={{ background: '#080E1C', color: '#fff' }}>
      <PublicNav />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="hero-gradient min-h-screen flex items-center pt-16 relative overflow-hidden">
        {/* Decorative orbs */}
        <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #10B981 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 rounded-full opacity-8" style={{ background: 'radial-gradient(circle, #3B82F6 0%, transparent 70%)', filter: 'blur(40px)' }} />

        <div className="max-w-7xl mx-auto px-6 py-24 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 fade-up"
              style={{ background: 'rgba(16,185,129,.12)', border: '1px solid rgba(16,185,129,.3)' }}>
              <div className="status-dot-green" />
              <span className="text-xs font-semibold" style={{ color: '#10B981' }}>Banking reimagined for 2024</span>
            </div>

            <h1 className="font-display text-5xl md:text-6xl font-bold leading-tight mb-6 fade-up-1">
              The Future of
              <br />
              <span style={{ color: '#10B981' }}>Personal Banking</span>
              <br />
              Is Here.
            </h1>

            <p className="text-lg text-white/60 mb-8 max-w-lg leading-relaxed fade-up-2">
              One account for everything — bank transfers, crypto, PayPal, wire transfers, bill payments, and more. 
              Bank smarter with real-time receipts and complete transparency.
            </p>

            <div className="flex flex-wrap gap-4 mb-10 fade-up-3">
              <Link href="/auth/register" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold text-white pulse-glow"
                style={{ background: '#10B981' }}>
                Open Free Account <ArrowRight size={16} />
              </Link>
              <Link href="/services" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold"
                style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.15)', color: '#fff' }}>
                Explore Features
              </Link>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-5 fade-up-4">
              {['FDIC Insured up to $250K', '256-bit Encryption', 'No Hidden Fees'].map(b => (
                <div key={b} className="flex items-center gap-2">
                  <CheckCircle size={14} style={{ color: '#10B981' }} />
                  <span className="text-xs text-white/50">{b}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right – fake card UI */}
          <div className="fade-up-2 relative">
            {/* Main card */}
            <div className="rounded-2xl p-6 relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #1A2B4A 0%, #0F1C35 100%)', border: '1px solid rgba(255,255,255,.1)' }}>
              <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full opacity-10" style={{ background: '#10B981' }} />
              <div className="absolute right-12 -bottom-12 w-32 h-32 rounded-full opacity-5" style={{ background: '#3B82F6' }} />

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <p className="text-white/40 text-xs uppercase tracking-widest">Checking Account</p>
                    <p className="font-mono text-3xl font-bold text-white mt-1">$24,850.00</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white/40 text-xs mb-1">Monthly</p>
                    <p className="text-emerald-400 text-sm font-semibold">+$3,240</p>
                  </div>
                </div>
                <div className="w-10 h-7 rounded bg-amber-400/70 flex items-center justify-center text-[8px] font-bold text-amber-900 mb-4">CHIP</div>
                <p className="font-mono text-sm tracking-[3px] text-white/60 mb-4">4532 •••• •••• 8921</p>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-white/30 text-[10px] uppercase tracking-wider">Card Holder</p>
                    <p className="text-white text-sm font-semibold">JORDAN MITCHELL</p>
                  </div>
                  <div className="flex -space-x-2">
                    <div className="w-7 h-7 rounded-full bg-white/20" />
                    <div className="w-7 h-7 rounded-full bg-emerald-500/80" />
                  </div>
                </div>
              </div>
            </div>

            {/* Floating transaction cards */}
            <div className="absolute -right-6 top-12 rounded-xl px-4 py-3 shadow-2xl min-w-44 fade-up-3"
              style={{ background: '#0F2A1A', border: '1px solid rgba(16,185,129,.3)' }}>
              <p className="text-xs text-white/40 mb-0.5">Transfer Received</p>
              <p className="font-mono font-bold text-emerald-400">+$1,500.00</p>
              <p className="text-xs text-white/30 mt-0.5">From Samantha L.</p>
            </div>
            <div className="absolute -left-4 bottom-12 rounded-xl px-4 py-3 shadow-2xl min-w-44 fade-up-4"
              style={{ background: '#1A1A2E', border: '1px solid rgba(99,102,241,.3)' }}>
              <p className="text-xs text-white/40 mb-0.5">Bitcoin Deposit</p>
              <p className="font-mono font-bold" style={{ color: '#F59E0B' }}>+$850.00</p>
              <p className="text-xs text-white/30 mt-0.5">0.0126 BTC</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────────────────────────────── */}
      <section className="py-16 border-y" style={{ background: 'rgba(255,255,255,.02)', borderColor: 'rgba(255,255,255,.06)' }}>
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map(({ value, label, icon: Icon }) => (
            <div key={label} className="text-center">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3"
                style={{ background: 'rgba(16,185,129,.15)' }}>
                <Icon size={18} style={{ color: '#10B981' }} />
              </div>
              <p className="font-display text-3xl font-bold text-white mb-1">{value}</p>
              <p className="text-sm text-white/40">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────────── */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#10B981' }}>Everything you need</p>
            <h2 className="font-display text-4xl font-bold text-white mb-4">Banking Without Limits</h2>
            <p className="text-white/50 max-w-xl mx-auto">From everyday spending to international crypto transfers, NexaBank handles it all in one seamless platform.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-2xl p-6 group hover:border-emerald-500/40 transition-all duration-300"
                style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)' }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform"
                  style={{ background: 'rgba(16,185,129,.15)' }}>
                  <Icon size={22} style={{ color: '#10B981' }} />
                </div>
                <h3 className="font-semibold text-white mb-2">{title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Payment Methods ────────────────────────────────────────────────── */}
      <section className="py-20" style={{ background: 'rgba(255,255,255,.02)' }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold text-white mb-3">12+ Payment Methods</h2>
            <p className="text-white/50">Pay and receive money any way you want</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {PAYMENT_METHODS.map(({ name, color }) => (
              <div key={name} className="flex items-center gap-2.5 px-4 py-2.5 rounded-full"
                style={{ background: color + '18', border: `1px solid ${color}40` }}>
                <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                <span className="text-sm font-medium text-white/80">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Receipts CTA ──────────────────────────────────────────────────── */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="rounded-3xl p-10 md:p-16 grid grid-cols-1 md:grid-cols-2 gap-12 items-center"
            style={{ background: 'linear-gradient(135deg, rgba(16,185,129,.12) 0%, rgba(10,36,69,.6) 100%)', border: '1px solid rgba(16,185,129,.25)' }}>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#10B981' }}>Full transparency</p>
              <h2 className="font-display text-4xl font-bold text-white mb-4">Professional Receipts for Every Transaction</h2>
              <p className="text-white/60 mb-6 leading-relaxed">
                Every deposit, withdrawal, transfer, and bill payment generates a beautiful PDF receipt with full transaction details, account information, and timestamps — automatically.
              </p>
              <Link href="/auth/register" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white"
                style={{ background: '#10B981' }}>
                Get Started Free <ArrowRight size={16} />
              </Link>
            </div>
            {/* Receipt preview mockup */}
            <div className="rounded-2xl p-5 text-sm" style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)' }}>
              <div className="rounded-lg p-4 mb-3" style={{ background: '#0F1C35' }}>
                <div className="flex justify-between mb-2">
                  <span className="text-[10px] uppercase tracking-widest text-white/40">Transaction ID</span>
                  <span className="font-mono text-[10px] text-white/60">TXN4F2A9C1</span>
                </div>
                <p className="font-mono text-2xl font-bold text-emerald-400 mb-1">+$2,500.00</p>
                <p className="text-xs text-white/40">Bank Transfer Deposit</p>
              </div>
              {[['Status', '✅ Completed'], ['Method', 'ACH Transfer'], ['Date', 'Jan 15, 2025 · 14:32'], ['Balance After', '$24,850.00']].map(([k, v]) => (
                <div key={k} className="flex justify-between py-1.5 border-b" style={{ borderColor: 'rgba(255,255,255,.06)' }}>
                  <span className="text-white/40 text-xs">{k}</span>
                  <span className="text-white text-xs font-medium">{v}</span>
                </div>
              ))}
              <div className="mt-3 text-center">
                <span className="text-xs px-3 py-1 rounded-full font-semibold" style={{ background: 'rgba(16,185,129,.15)', color: '#10B981' }}>📄 Download PDF Receipt</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────────────────────────── */}
      <section className="py-20" style={{ background: 'rgba(255,255,255,.02)' }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold text-white mb-3">Loved by Thousands</h2>
            <p className="text-white/50">Real stories from real NexaBank customers</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(({ name, role, text, stars }) => (
              <div key={name} className="rounded-2xl p-6"
                style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)' }}>
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: stars }).map((_, i) => <Star key={i} size={14} fill="#F59E0B" stroke="none" />)}
                </div>
                <p className="text-sm text-white/70 leading-relaxed mb-5">"{text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: '#10B981' }}>{name[0]}</div>
                  <div>
                    <p className="text-sm font-semibold text-white">{name}</p>
                    <p className="text-xs text-white/40">{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────────── */}
      <section className="py-28">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
            Ready to bank<br /><span style={{ color: '#10B981' }}>smarter?</span>
          </h2>
          <p className="text-white/50 mb-8">Open your free account in under 2 minutes. No paperwork. No hidden fees.</p>
          <Link href="/auth/register" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-semibold text-white"
            style={{ background: '#10B981' }}>
            Create Free Account <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-10" style={{ borderColor: 'rgba(255,255,255,.08)' }}>
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between gap-4">
          <p className="text-sm font-display font-bold text-white"><span style={{ color: '#10B981' }}>N</span>exaBank</p>
          <p className="text-xs text-white/30">© 2026 NexaBank.</p>
          <div className="flex gap-5">
            {['Privacy', 'Terms', 'Security'].map(l => (
              <Link key={l} href="#" className="text-xs text-white/40 hover:text-white/70 transition-colors">{l}</Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
