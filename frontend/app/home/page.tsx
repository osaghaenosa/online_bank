'use client'
import Link from 'next/link'
import { PublicNav } from '@/components/layout/PublicNav'
import { BrandLogo } from '@/components/shared/BrandLogo'
import {
  Shield, Zap, Globe, CreditCard, ArrowRight, CheckCircle,
  Bitcoin, PiggyBank, Users, DollarSign, FileText, Landmark
} from 'lucide-react'

const FEATURES = [
  {
    code: 'Clearing',
    icon: Zap,
    title: 'Direct Wire & ACH Clearing',
    desc: 'Execute domestic and international transfers with immediate ledger settlement and transparent tracking.',
  },
  {
    code: 'Security',
    icon: Shield,
    title: 'Institutional Custody & Security',
    desc: 'Protected by multi-layer security, account verification, and 24/7 automated fraud monitoring.',
  },
  {
    code: 'Treasury',
    icon: Bitcoin,
    title: 'Digital Asset Treasury',
    desc: 'Deposit, custody, and settle BTC, ETH, USDT, BNB, and SOL directly alongside your fiat checking balance.',
  },
  {
    code: 'Reserves',
    icon: PiggyBank,
    title: 'High-Yield Reserve Vaults',
    desc: 'Allocate capital into structured savings vaults with competitive institutional yield and instant liquidity.',
  },
  {
    code: 'Cards',
    icon: CreditCard,
    title: 'Commercial & Virtual Cards',
    desc: 'Issue instant virtual debit cards with programmable spending limits, merchant locks, and PIN controls.',
  },
  {
    code: 'Audit',
    icon: FileText,
    title: 'Certified Audit Statements',
    desc: 'Download official PDF transaction receipts with unique reference numbers for every payment and transfer.',
  },
]

const SETTLEMENT_RAILS = [
  { rail: 'Fedwire / Domestic Wire', speed: 'Same-Day Clearing', status: 'Operational', code: 'USD-WIRE' },
  { rail: 'ACH Direct Network', speed: 'Instant / Next-Day', status: 'Operational', code: 'USD-ACH' },
  { rail: 'SWIFT International', speed: '180+ Corridors', status: 'Operational', code: 'INTL-SWIFT' },
  { rail: 'Bitcoin & Ethereum Settlement', speed: 'On-Chain / Instant', status: 'Operational', code: 'CRYPTO-L1' },
  { rail: 'USDT / Solana Treasury', speed: 'Near-Zero Latency', status: 'Operational', code: 'STABLE-NET' },
  { rail: 'Virtual Card Issuance', speed: 'Immediate Provision', status: 'Operational', code: 'VISA-COMM' },
]

const STATS = [
  { value: '500K+', label: 'Verified Client Accounts', icon: Users },
  { value: '$2.4B+', label: 'Annual Cleared Volume', icon: DollarSign },
  { value: '99.99%', label: 'Core Ledger Uptime', icon: CheckCircle },
  { value: '180+', label: 'Supported Jurisdictions', icon: Globe },
]

const TESTIMONIALS = [
  {
    name: 'Sarah M.',
    role: 'Principal Consultant',
    text: 'Blue ridge Bank transformed how our firm handles international settlements. The instant PDF audit receipts and multi-rail support keep our accounting effortless.',
  },
  {
    name: 'James K.',
    role: 'Managing Director',
    text: 'Having wire transfers, ACH, and digital asset treasury in a single institutional portal gives us complete visibility over every dollar.',
  },
  {
    name: 'Priya S.',
    role: 'Senior Systems Architect',
    text: 'Clean, structured, and dependable. The security token architecture and real-time balance ledger set the standard for modern online banking.',
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen" style={{ background: '#F4F7FC', color: '#0A192F' }}>
      <PublicNav />

      {/* ── Luminous Neo-Fintech Hero Section with Framed Person Photography ── */}
      <section className="pt-28 sm:pt-36 pb-24 sm:pb-32 brand-card-gradient text-white relative overflow-hidden">
        <div className="absolute -top-28 -right-20 w-96 h-96 rounded-full bg-[#3B82F6]/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-20 w-80 h-80 rounded-full bg-white/10 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center relative z-10">
          {/* Left Column (7 cols) */}
          <div className="lg:col-span-7 animate-reveal">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-6 bg-white/15 border border-white/20 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-[#60A5FA] animate-live-dot text-[#60A5FA]" />
              <span className="text-xs font-semibold text-blue-100">
                Blue ridge Bank · Chartered Digital Institution
              </span>
            </div>

            <h1 className="font-display text-3xl sm:text-5xl lg:text-[54px] font-bold leading-[1.12] mb-6 text-white">
              Institutional Strength.
              <br />
              <span className="text-[#60A5FA]">Uncompromised Personal Banking.</span>
            </h1>

            <p className="text-base sm:text-lg mb-8 max-w-2xl leading-relaxed text-blue-100/90">
              Manage checking, high-yield savings, domestic &amp; international wires, and digital asset settlements from a unified, high-security banking studio with certified real-time receipts.
            </p>

            <div className="flex flex-col sm:flex-row gap-3.5 mb-10">
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full text-sm font-semibold text-[#002B5B] bg-white hover:bg-blue-50 shadow-float transition-all"
              >
                <span>Open an Account</span>
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full text-sm font-semibold text-white bg-white/15 hover:bg-white/25 border border-white/25 transition-all"
              >
                Access Client Portal
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 border-t border-white/15">
              {[
                'FDIC Insured up to $250,000',
                'Protected Online Banking',
                'Instant PDF Receipts',
              ].map(b => (
                <div key={b} className="flex items-center gap-2">
                  <CheckCircle size={15} className="text-[#60A5FA] flex-shrink-0" />
                  <span className="text-xs font-medium text-blue-100">{b}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column – Framed Editorial Person Portrait + Floating Animated Banking Pills (5 cols) */}
          <div className="lg:col-span-5">
            <div className="relative group">
              <div className="rounded-3xl overflow-hidden shadow-float border-4 border-white/20 bg-[#001F42] aspect-[4/3] relative">
                <img
                  src="/images/hero-banking-person.png"
                  alt="Client reviewing Blue ridge Bank mobile portal"
                  className="w-full h-full object-cover animate-ken-burns"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#001F42]/75 via-transparent to-[#002B5B]/20 pointer-events-none" />
              </div>

              {/* Top-right Floating Live Wire Pill */}
              <div className="animate-float-delayed absolute top-3 right-3 sm:-right-3 sm:top-5 rounded-2xl bg-white/95 backdrop-blur-md text-[#002B5B] px-3.5 py-2.5 shadow-float border border-white/60 max-w-[210px]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-live-dot text-[#10B981] flex-shrink-0" />
                  <span className="text-[11px] font-semibold text-slate-500">Wire Cleared</span>
                </div>
                <p className="font-mono text-sm font-bold text-[#059669] mt-0.5">+$14,500.00</p>
                <p className="text-[10px] text-slate-400">Instant Settlement</p>
              </div>

              {/* Bottom-left Floating Active Checking Pill */}
              <div className="animate-float absolute bottom-3 left-3 sm:-left-4 sm:bottom-5 rounded-2xl bg-[#001F42]/90 backdrop-blur-md text-white px-4 py-3 shadow-float border border-white/20 max-w-[240px]">
                <div className="flex items-center gap-2 mb-1">
                  <Landmark size={13} className="text-[#60A5FA]" />
                  <span className="text-[11px] font-medium text-blue-200">Active Checking</span>
                </div>
                <p className="font-mono text-lg sm:text-xl font-bold text-white">$124,850.00</p>
                <p className="text-[10px] text-[#60A5FA] font-medium mt-0.5">4.85% Reserve APY · Verified</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Floating Institutional Metrics Bar ──────────────────────────────── */}
      <section className="px-4 sm:px-6 -mt-12 relative z-20">
        <div className="max-w-7xl mx-auto bg-white rounded-3xl shadow-float border border-slate-200/80 grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
          {STATS.map(({ value, label, icon: Icon }) => (
            <div key={label} className="p-5 sm:p-7 flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl bg-[#EBF2FF] text-[#0052CC] flex items-center justify-center flex-shrink-0">
                <Icon size={20} />
              </div>
              <div className="min-w-0">
                <p className="font-display text-2xl sm:text-3xl font-bold text-[#002B5B]">{value}</p>
                <p className="text-xs font-medium text-slate-500 mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Core Banking Capabilities Grid ────────────────────────────────── */}
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[#EBF2FF] text-[#0052CC] mb-3">
                Core Banking Infrastructure
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#002B5B]">
                Engineered for Financial Precision
              </h2>
            </div>
            <p className="text-sm max-w-md text-slate-500">
              Comprehensive personal and commercial banking services operating on a unified, zero-compromise digital ledger.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ code, icon: Icon, title, desc }) => (
              <div
                key={title}
                className="bg-white rounded-3xl border border-slate-200/80 shadow-card hover:shadow-card-hover transition-all p-7 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-[#EBF2FF] text-[#0052CC] group-hover:bg-[#0052CC] group-hover:text-white flex items-center justify-center transition-colors">
                      <Icon size={22} />
                    </div>
                    <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-[#F4F7FC] text-[#002B5B]">
                      {code}
                    </span>
                  </div>
                  <h3 className="font-display text-lg font-bold mb-2 text-[#002B5B]">
                    {title}
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-500">
                    {desc}
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100">
                  <Link
                    href="/services"
                    className="text-xs font-semibold flex items-center gap-1.5 text-[#0052CC] hover:text-[#002B5B] transition-colors"
                  >
                    <span>Service Specifications</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Modern Banking Experience Editorial Split Section ──────────────── */}
      <section className="py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto bg-white rounded-3xl border border-slate-200/80 shadow-card p-6 sm:p-10 lg:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-6 relative group">
            <div className="rounded-3xl overflow-hidden shadow-float aspect-[16/10] bg-[#EBF2FF]">
              <img
                src="/images/home-wealth-cards.png"
                alt="Contactless Blue ridge Bank commercial card and digital portal"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
            </div>
            <div className="animate-float absolute bottom-3 left-3 sm:left-5 sm:bottom-5 px-4 py-2.5 rounded-2xl bg-[#002B5B]/90 backdrop-blur-md text-white shadow-float border border-white/15">
              <p className="text-[11px] text-blue-200 font-medium">Commercial &amp; Virtual</p>
              <p className="text-xs sm:text-sm font-bold text-white">Contactless Virtual &amp; Physical Cards</p>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-5">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[#EBF2FF] text-[#0052CC]">
              Modern Banking Studio
            </span>
            <h2 className="font-display text-2xl sm:text-4xl font-bold text-[#002B5B] leading-tight">
              One Unified Command Center for Cards, Wires &amp; Reserves
            </h2>
            <p className="text-sm sm:text-base text-slate-500 leading-relaxed">
              Provision Visa or Mastercard commercial debit cards in seconds, monitor multi-currency inflows with interactive cash-flow analytics, and execute PIN-verified domestic or international transfers without friction.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {[
                'Instant virtual card issuance',
                'Real-time PIN & TTN protection',
                'Multi-currency USD / GBP / EUR view',
                'Automated PDF ledger receipts',
              ].map(item => (
                <div key={item} className="flex items-center gap-2.5 p-3 rounded-2xl bg-[#F4F7FC]">
                  <CheckCircle size={15} className="text-[#0052CC] flex-shrink-0" />
                  <span className="text-xs font-semibold text-[#002B5B]">{item}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/auth/register"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs sm:text-sm font-semibold text-white shadow-brand transition-all hover:opacity-95"
                style={{ background: 'linear-gradient(135deg, #0052CC 0%, #003D99 100%)' }}
              >
                <span>Open Your Account</span>
                <ArrowRight size={15} />
              </Link>
              <Link
                href="/services"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs sm:text-sm font-semibold text-[#002B5B] bg-[#F4F7FC] hover:bg-[#EBF2FF] transition-colors"
              >
                Explore Services
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Global Settlement Rails Table ─────────────────────────────────── */}
      <section className="py-16 sm:py-20 bg-white border-y border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="mb-10">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[#EBF2FF] text-[#0052CC] mb-3">
              Multi-Rail Clearing Network
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#002B5B]">
              Supported Payment &amp; Treasury Channels
            </h2>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-slate-200/80 shadow-card">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F4F7FC] text-[#002B5B] border-b border-slate-200/80">
                  <th className="py-4 px-5 text-xs font-semibold">Rail Code</th>
                  <th className="py-4 px-5 text-xs font-semibold">Settlement Channel</th>
                  <th className="py-4 px-5 text-xs font-semibold">Clearing Window</th>
                  <th className="py-4 px-5 text-xs font-semibold text-right">Network Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm bg-white">
                {SETTLEMENT_RAILS.map(r => (
                  <tr key={r.code} className="hover:bg-[#F4F7FC]/70 transition-colors">
                    <td className="py-4 px-5 font-mono text-xs font-bold text-[#0052CC]">{r.code}</td>
                    <td className="py-4 px-5 font-semibold text-[#002B5B]">{r.rail}</td>
                    <td className="py-4 px-5 text-xs text-slate-500">{r.speed}</td>
                    <td className="py-4 px-5 text-right">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-[#ECFDF5] text-[#059669]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Certified Receipt & Audit Banner ──────────────────────────────── */}
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="p-7 sm:p-12 rounded-3xl brand-card-gradient text-white shadow-float grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative overflow-hidden">
            <div className="lg:col-span-7 relative z-10">
              <span className="inline-block px-3.5 py-1 rounded-full mb-4 text-xs font-semibold bg-white/15 text-blue-100">
                Verified Audit Trail
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4">
                Official PDF Receipts Generated for Every Transaction
              </h2>
              <p className="text-sm sm:text-base mb-8 leading-relaxed text-blue-100/90">
                Every deposit, wire transfer, withdrawal, and bill settlement automatically generates a standardized Blue ridge Bank PDF receipt containing timestamps, reference codes, and post-transaction balances.
              </p>
              <Link
                href="/auth/register"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-xs sm:text-sm font-semibold text-[#002B5B] bg-white hover:bg-blue-50 shadow-lg transition-all"
              >
                <span>Enroll for Online Banking</span>
                <ArrowRight size={15} />
              </Link>
            </div>

            <div className="lg:col-span-5 relative z-10">
              <div className="bg-white rounded-3xl p-6 text-slate-900 shadow-float">
                <div className="pb-4 mb-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-semibold text-[#0052CC]">Official Transaction Receipt</p>
                    <p className="font-display text-sm font-bold text-[#002B5B]">
                      Blue ridge Bank · Ledger Record
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#002B5B] text-white">
                    PDF
                  </span>
                </div>

                <div className="p-4 mb-4 rounded-2xl bg-[#EBF2FF]">
                  <p className="text-[11px] font-semibold text-[#002B5B]">Settled Amount</p>
                  <p className="font-mono text-2xl font-bold text-[#0052CC] mt-0.5">+$2,500.00 USD</p>
                </div>

                {[
                  ['Reference ID', 'TXN-4F2A9C1'],
                  ['Settlement Rail', 'ACH Direct Transfer'],
                  ['Verification', 'Completed & Cleared'],
                  ['Resulting Balance', '$24,850.00 USD'],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between py-2.5 border-b border-slate-100 last:border-b-0 text-xs">
                    <span className="text-slate-500">{k}</span>
                    <span className="font-mono font-semibold text-[#002B5B]">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Client Endorsements with Framed Editorial Highlight ──────────── */}
      <section className="py-16 sm:py-20 bg-white border-t border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-6">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[#EBF2FF] text-[#0052CC] mb-3">
                Client Endorsements
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#002B5B] mb-3">
                Trusted by Individuals &amp; Enterprises
              </h2>
              <p className="text-sm sm:text-base text-slate-500 leading-relaxed">
                From high-yield reserve vaults to cross-border corporate treasury operations, over half a million clients rely on Blue ridge Bank for speed, clarity, and security.
              </p>
            </div>

            <div className="lg:col-span-6 relative group">
              <div className="rounded-3xl overflow-hidden shadow-card aspect-[16/10] bg-[#EBF2FF]">
                <img
                  src="/images/blog-reserve-vaults.png"
                  alt="Private client reviewing savings and reserve growth"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>
              <div className="animate-float-delayed absolute bottom-3 right-3 sm:right-5 sm:bottom-5 px-4 py-2.5 rounded-2xl bg-white/95 backdrop-blur-md shadow-float border border-slate-200/80">
                <p className="text-[11px] font-medium text-slate-500">High-Yield Savings</p>
                <p className="text-xs sm:text-sm font-bold text-[#0052CC]">4.85% APY Reserve Vaults</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(({ name, role, text }) => (
              <div
                key={name}
                className="p-7 rounded-3xl bg-[#F4F7FC] border border-slate-200/70 flex flex-col justify-between"
              >
                <p className="text-sm leading-relaxed mb-6 text-slate-700">
                  &ldquo;{text}&rdquo;
                </p>
                <div className="flex items-center gap-3 pt-4 border-t border-slate-200/70">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, #002B5B 0%, #0052CC 100%)' }}
                  >
                    {name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#002B5B]">{name}</p>
                    <p className="text-xs text-slate-500">{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Institutional Footer ──────────────────────────────────────────── */}
      <footer className="py-12 brand-card-gradient text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-white/15">
            <div className="md:col-span-2">
              <BrandLogo variant="light" size="md" showTagline />
              <p className="text-xs mt-4 max-w-md leading-relaxed text-blue-100/85">
                Blue ridge Bank provides personal checking, high-yield savings, international wire transfers, and digital asset accounts under strict regulatory and security standards.
              </p>
              <p className="text-xs font-mono mt-3 text-blue-200">
                Support Desk:{' '}
                <a href="mailto:support@theblueridges.com" className="underline text-white">
                  support@theblueridges.com
                </a>
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold mb-3 text-[#60A5FA]">Navigation</p>
              <ul className="space-y-2 text-xs text-blue-100">
                <li><Link href="/home" className="hover:text-white">Overview</Link></li>
                <li><Link href="/services" className="hover:text-white">Banking Services</Link></li>
                <li><Link href="/docs" className="hover:text-white">Developer API Docs</Link></li>
                <li><Link href="/about" className="hover:text-white">About the Institution</Link></li>
                <li><Link href="/blog" className="hover:text-white">Market Insights</Link></li>
                <li><Link href="/contact" className="hover:text-white">Client Support</Link></li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold mb-3 text-[#60A5FA]">Client Portal</p>
              <ul className="space-y-2 text-xs text-blue-100">
                <li><Link href="/auth/login" className="hover:text-white">Sign In to Online Banking</Link></li>
                <li><Link href="/auth/register" className="hover:text-white">Open a New Account</Link></li>
                <li><Link href="/contact" className="hover:text-white">Wire &amp; Routing Instructions</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-blue-200">
            <p>© 2026 Blue ridge Bank. All rights reserved. Member FDIC. Equal Housing Lender.</p>
            <div className="flex gap-6">
              <Link href="/about" className="hover:text-white">Privacy Policy</Link>
              <Link href="/about" className="hover:text-white">Terms of Service</Link>
              <Link href="/contact" className="hover:text-white">Security Disclosure</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
