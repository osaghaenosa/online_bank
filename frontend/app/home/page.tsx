'use client'
import Link from 'next/link'
import { PublicNav } from '@/components/layout/PublicNav'
import { BrandLogo } from '@/components/shared/BrandLogo'
import {
  Shield, Zap, Globe, CreditCard, ArrowRight, CheckCircle,
  Bitcoin, PiggyBank, Lock, Building2, Users, DollarSign, FileText, Landmark
} from 'lucide-react'

const FEATURES = [
  {
    code: 'SRV-01',
    icon: Zap,
    title: 'Direct Wire & ACH Clearing',
    desc: 'Execute domestic and international transfers with immediate ledger settlement and transparent tracking.',
  },
  {
    code: 'SRV-02',
    icon: Shield,
    title: 'Institutional Custody & Security',
    desc: 'Protected by 256-bit encryption, multi-token hardware verification, and 24/7 automated risk controls.',
  },
  {
    code: 'SRV-03',
    icon: Bitcoin,
    title: 'Digital Asset Treasury',
    desc: 'Deposit, custody, and settle BTC, ETH, USDT, BNB, and SOL directly alongside your fiat checking balance.',
  },
  {
    code: 'SRV-04',
    icon: PiggyBank,
    title: 'High-Yield Reserve Vaults',
    desc: 'Allocate capital into structured savings vaults with competitive institutional yield and instant liquidity.',
  },
  {
    code: 'SRV-05',
    icon: CreditCard,
    title: 'Commercial & Virtual Cards',
    desc: 'Issue instant virtual debit cards with programmable spending limits, merchant locks, and PIN controls.',
  },
  {
    code: 'SRV-06',
    icon: FileText,
    title: 'Certified Audit Statements',
    desc: 'Download official PDF transaction receipts with cryptographic reference numbers for every ledger movement.',
  },
]

const SETTLEMENT_RAILS = [
  { rail: 'Fedwire / Domestic Wire', speed: 'Same-Day Clearing', status: 'OPERATIONAL', code: 'USD-WIRE' },
  { rail: 'ACH Direct Network', speed: 'Instant / Next-Day', status: 'OPERATIONAL', code: 'USD-ACH' },
  { rail: 'SWIFT International', speed: '180+ Corridors', status: 'OPERATIONAL', code: 'INTL-SWIFT' },
  { rail: 'Bitcoin & Ethereum Settlement', speed: 'On-Chain / Instant', status: 'OPERATIONAL', code: 'CRYPTO-L1' },
  { rail: 'USDT / Solana Treasury', speed: 'Near-Zero Latency', status: 'OPERATIONAL', code: 'STABLE-NET' },
  { rail: 'Virtual Card Issuance', speed: 'Immediate Provision', status: 'OPERATIONAL', code: 'VISA-COMM' },
]

const STATS = [
  { value: '500K+', label: 'VERIFIED CLIENT ACCOUNTS', icon: Users },
  { value: '$2.4B+', label: 'ANNUAL CLEARED VOLUME', icon: DollarSign },
  { value: '99.99%', label: 'CORE LEDGER UPTIME', icon: CheckCircle },
  { value: '180+', label: 'SUPPORTED JURISDICTIONS', icon: Globe },
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
    <div className="min-h-screen" style={{ background: '#F2F5F9', color: '#0A192F' }}>
      <PublicNav />

      {/* ── Architectural Hero Section ────────────────────────────────────── */}
      <section
        className="pt-28 sm:pt-32 pb-16 sm:pb-24 border-b-4"
        style={{ background: '#002B5B', borderColor: '#0052CC', color: '#FFFFFF' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column (7 cols) */}
          <div className="lg:col-span-7">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 border"
              style={{ background: '#001F42', borderColor: '#0052CC' }}
            >
              <span className="w-2 h-2" style={{ background: '#60A5FA' }} />
              <span className="text-[11px] font-mono uppercase tracking-widest font-bold" style={{ color: '#93C5FD' }}>
                BLUE RIDGE BANK · CHARTERED DIGITAL INSTITUTION
              </span>
            </div>

            <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6 text-white">
              Institutional Strength.
              <br />
              <span style={{ color: '#60A5FA' }}>Uncompromised Personal Banking.</span>
            </h1>

            <p className="text-base sm:text-lg mb-8 max-w-2xl leading-relaxed" style={{ color: '#BFDBFE' }}>
              Manage checking, high-yield savings, domestic &amp; international wires, and digital asset settlements from a unified, high-security banking ledger with certified real-time receipts.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-10">
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center gap-2 px-7 py-4 text-xs font-bold uppercase tracking-wider text-white border transition-colors"
                style={{ background: '#0052CC', borderColor: '#60A5FA' }}
              >
                Open an Account <ArrowRight size={15} />
              </Link>
              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center gap-2 px-7 py-4 text-xs font-bold uppercase tracking-wider text-white border transition-colors hover:bg-white/10"
                style={{ background: '#001F42', borderColor: '#60A5FA' }}
              >
                Access Client Portal
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 border-t" style={{ borderColor: '#1E3A5F' }}>
              {[
                'FDIC Insured up to $250,000',
                '256-Bit Cryptographic Ledger',
                'Certified PDF Audit Receipts',
              ].map(b => (
                <div key={b} className="flex items-center gap-2">
                  <CheckCircle size={14} style={{ color: '#60A5FA' }} className="flex-shrink-0" />
                  <span className="text-xs font-medium" style={{ color: '#DBEAFE' }}>{b}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column – Institutional Ledger Preview Box (5 cols) */}
          <div className="lg:col-span-5">
            <div
              className="border-2 bg-white text-slate-900"
              style={{ borderColor: '#60A5FA', boxShadow: '0 8px 24px rgba(0, 20, 43, 0.35)' }}
            >
              {/* Top Header Bar */}
              <div
                className="px-5 py-3.5 flex items-center justify-between border-b"
                style={{ background: '#001F42', borderColor: '#1E3A5F', color: '#FFFFFF' }}
              >
                <div className="flex items-center gap-2">
                  <Landmark size={15} style={{ color: '#60A5FA' }} />
                  <span className="text-xs font-mono uppercase tracking-wider font-bold">
                    EXECUTIVE CHECKING LEDGER
                  </span>
                </div>
                <span
                  className="px-2 py-0.5 text-[10px] font-mono uppercase font-bold"
                  style={{ background: '#0052CC', color: '#FFFFFF' }}
                >
                  ACTIVE · VERIFIED
                </span>
              </div>

              {/* Balance Summary */}
              <div className="p-6 border-b" style={{ borderColor: '#CBD5E1', background: '#FFFFFF' }}>
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-[11px] font-mono uppercase tracking-wider font-semibold" style={{ color: '#475569' }}>
                    AVAILABLE LIQUID BALANCE
                  </span>
                  <span className="text-xs font-mono font-bold" style={{ color: '#0052CC' }}>
                    ACCT #4532-8921
                  </span>
                </div>
                <p className="font-mono text-3xl sm:text-4xl font-bold tracking-tight" style={{ color: '#002B5B' }}>
                  $124,850.00 <span className="text-sm font-normal" style={{ color: '#64748B' }}>USD</span>
                </p>

                <div className="grid grid-cols-2 gap-3 mt-5 pt-4 border-t" style={{ borderColor: '#E2E8F0' }}>
                  <div className="p-3 border" style={{ background: '#F8FAFC', borderColor: '#CBD5E1' }}>
                    <p className="text-[10px] font-mono uppercase" style={{ color: '#64748B' }}>30-DAY INFLOW</p>
                    <p className="font-mono text-sm font-bold mt-0.5" style={{ color: '#0052CC' }}>+$18,420.00</p>
                  </div>
                  <div className="p-3 border" style={{ background: '#F8FAFC', borderColor: '#CBD5E1' }}>
                    <p className="text-[10px] font-mono uppercase" style={{ color: '#64748B' }}>RESERVE YIELD</p>
                    <p className="font-mono text-sm font-bold mt-0.5" style={{ color: '#002B5B' }}>4.85% APY</p>
                  </div>
                </div>
              </div>

              {/* Recent Cleared Settlements */}
              <div className="p-5" style={{ background: '#F2F5F9' }}>
                <p className="text-[10px] font-mono uppercase tracking-widest font-bold mb-3" style={{ color: '#002B5B' }}>
                  RECENT CLEARED SETTLEMENTS
                </p>
                <div className="space-y-2">
                  {[
                    { ref: 'TXN-9841A', desc: 'Incoming Domestic Wire · Meridian Corp', amt: '+$14,500.00', status: 'CLEARED' },
                    { ref: 'TXN-9839C', desc: 'ACH Treasury Allocation · Vault Reserve', amt: '+$3,200.00', status: 'CLEARED' },
                    { ref: 'TXN-9832B', desc: 'International SWIFT Settlement', amt: '-$1,850.00', status: 'VERIFIED' },
                  ].map(row => (
                    <div
                      key={row.ref}
                      className="px-3.5 py-2.5 bg-white border flex items-center justify-between text-xs"
                      style={{ borderColor: '#CBD5E1' }}
                    >
                      <div>
                        <p className="font-semibold" style={{ color: '#0A192F' }}>{row.desc}</p>
                        <p className="font-mono text-[10px]" style={{ color: '#64748B' }}>REF: {row.ref}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-bold" style={{ color: row.amt.startsWith('+') ? '#0052CC' : '#002B5B' }}>
                          {row.amt}
                        </p>
                        <span className="text-[9px] font-mono uppercase font-bold" style={{ color: '#475569' }}>
                          {row.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Key Institutional Metrics Bar ─────────────────────────────────── */}
      <section className="bg-white border-b" style={{ borderColor: '#CBD5E1' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x" style={{ borderColor: '#CBD5E1' }}>
          {STATS.map(({ value, label, icon: Icon }) => (
            <div key={label} className="p-6 sm:p-8 flex items-start gap-4">
              <div
                className="w-10 h-10 flex items-center justify-center flex-shrink-0"
                style={{ background: '#002B5B', color: '#FFFFFF' }}
              >
                <Icon size={18} />
              </div>
              <div>
                <p className="font-display text-2xl sm:text-3xl font-bold" style={{ color: '#002B5B' }}>{value}</p>
                <p className="text-[11px] font-mono uppercase tracking-wider font-semibold mt-1" style={{ color: '#475569' }}>
                  {label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Core Banking Capabilities Grid ────────────────────────────────── */}
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 pb-6 border-b-2" style={{ borderColor: '#002B5B' }}>
            <div>
              <p className="text-xs font-mono uppercase tracking-widest font-bold mb-2" style={{ color: '#0052CC' }}>
                CORE BANKING INFRASTRUCTURE
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold" style={{ color: '#002B5B' }}>
                Engineered for Financial Precision
              </h2>
            </div>
            <p className="text-sm max-w-md mt-3 md:mt-0" style={{ color: '#475569' }}>
              Comprehensive personal and commercial banking services operating on a unified, zero-compromise digital ledger.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ code, icon: Icon, title, desc }) => (
              <div
                key={title}
                className="bg-white border p-6 flex flex-col justify-between transition-colors"
                style={{ borderColor: '#CBD5E1', borderTop: '3px solid #002B5B' }}
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div
                      className="w-11 h-11 flex items-center justify-center"
                      style={{ background: '#0052CC', color: '#FFFFFF' }}
                    >
                      <Icon size={20} />
                    </div>
                    <span
                      className="px-2.5 py-1 text-[10px] font-mono font-bold uppercase"
                      style={{ background: '#EBF2FF', color: '#002B5B' }}
                    >
                      {code}
                    </span>
                  </div>
                  <h3 className="font-display text-lg font-bold mb-2" style={{ color: '#002B5B' }}>
                    {title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#475569' }}>
                    {desc}
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t flex items-center justify-between" style={{ borderColor: '#E2E8F0' }}>
                  <Link
                    href="/services"
                    className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
                    style={{ color: '#0052CC' }}
                  >
                    Service Specifications <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Global Settlement Rails Table ─────────────────────────────────── */}
      <section className="py-16 sm:py-20 bg-white border-y" style={{ borderColor: '#CBD5E1' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="mb-10">
            <p className="text-xs font-mono uppercase tracking-widest font-bold mb-2" style={{ color: '#0052CC' }}>
              MULTI-RAIL CLEARING NETWORK
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold" style={{ color: '#002B5B' }}>
              Supported Payment &amp; Treasury Channels
            </h2>
          </div>

          <div className="overflow-x-auto border" style={{ borderColor: '#CBD5E1' }}>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr style={{ background: '#002B5B', color: '#FFFFFF' }}>
                  <th className="py-3.5 px-4 text-xs font-mono uppercase tracking-wider">Rail Code</th>
                  <th className="py-3.5 px-4 text-xs font-mono uppercase tracking-wider">Settlement Channel</th>
                  <th className="py-3.5 px-4 text-xs font-mono uppercase tracking-wider">Clearing Window</th>
                  <th className="py-3.5 px-4 text-xs font-mono uppercase tracking-wider text-right">Network Status</th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm" style={{ borderColor: '#CBD5E1' }}>
                {SETTLEMENT_RAILS.map(r => (
                  <tr key={r.code} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 font-mono text-xs font-bold" style={{ color: '#0052CC' }}>{r.code}</td>
                    <td className="py-3.5 px-4 font-semibold" style={{ color: '#002B5B' }}>{r.rail}</td>
                    <td className="py-3.5 px-4 text-xs" style={{ color: '#475569' }}>{r.speed}</td>
                    <td className="py-3.5 px-4 text-right">
                      <span
                        className="inline-block px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase"
                        style={{ background: '#EBF2FF', color: '#0052CC', border: '1px solid #93C5FD' }}
                      >
                        ● {r.status}
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
          <div
            className="p-8 sm:p-12 border-2 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center"
            style={{ background: '#002B5B', borderColor: '#0052CC', color: '#FFFFFF' }}
          >
            <div className="lg:col-span-7">
              <div
                className="inline-block px-3 py-1 mb-4 text-[11px] font-mono uppercase tracking-widest font-bold"
                style={{ background: '#0052CC', color: '#FFFFFF' }}
              >
                VERIFIED AUDIT TRAIL
              </div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4">
                Official PDF Receipts Generated for Every Transaction
              </h2>
              <p className="text-sm sm:text-base mb-8 leading-relaxed" style={{ color: '#BFDBFE' }}>
                Every deposit, wire transfer, withdrawal, and bill settlement automatically generates a standardized Blue ridge Bank PDF receipt containing timestamps, reference codes, and post-transaction balances.
              </p>
              <Link
                href="/auth/register"
                className="inline-flex items-center gap-2 px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white border"
                style={{ background: '#0052CC', borderColor: '#60A5FA' }}
              >
                Enroll for Online Banking <ArrowRight size={15} />
              </Link>
            </div>

            <div className="lg:col-span-5">
              <div className="bg-white p-5 border-2 text-slate-900" style={{ borderColor: '#60A5FA' }}>
                <div className="pb-3 mb-3 border-b flex items-center justify-between" style={{ borderColor: '#CBD5E1' }}>
                  <div>
                    <p className="text-[10px] font-mono uppercase font-bold" style={{ color: '#0052CC' }}>
                      OFFICIAL TRANSACTION RECEIPT
                    </p>
                    <p className="font-display text-sm font-bold" style={{ color: '#002B5B' }}>
                      BLUE RIDGE BANK · LEDGER RECORD
                    </p>
                  </div>
                  <span
                    className="px-2 py-0.5 text-[10px] font-mono font-bold"
                    style={{ background: '#002B5B', color: '#FFFFFF' }}
                  >
                    PDF
                  </span>
                </div>

                <div className="p-3 mb-3 border" style={{ background: '#EBF2FF', borderColor: '#93C5FD' }}>
                  <p className="text-[10px] font-mono uppercase" style={{ color: '#002B5B' }}>SETTLED AMOUNT</p>
                  <p className="font-mono text-2xl font-bold" style={{ color: '#0052CC' }}>+$2,500.00 USD</p>
                </div>

                {[
                  ['Reference ID', 'TXN-4F2A9C1'],
                  ['Settlement Rail', 'ACH Direct Transfer'],
                  ['Verification', 'Completed & Cleared'],
                  ['Resulting Balance', '$24,850.00 USD'],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between py-2 border-b text-xs" style={{ borderColor: '#E2E8F0' }}>
                    <span style={{ color: '#64748B' }}>{k}</span>
                    <span className="font-mono font-semibold" style={{ color: '#0A192F' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Client Testimonials ───────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 bg-white border-t" style={{ borderColor: '#CBD5E1' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="mb-12">
            <p className="text-xs font-mono uppercase tracking-widest font-bold mb-2" style={{ color: '#0052CC' }}>
              CLIENT ENDORSEMENTS
            </p>
            <h2 className="font-display text-3xl font-bold" style={{ color: '#002B5B' }}>
              Trusted by Individuals &amp; Enterprises
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(({ name, role, text }) => (
              <div
                key={name}
                className="p-6 border flex flex-col justify-between"
                style={{ background: '#F8FAFC', borderColor: '#CBD5E1', borderTop: '3px solid #0052CC' }}
              >
                <p className="text-sm leading-relaxed mb-6" style={{ color: '#1E293B' }}>
                  &ldquo;{text}&rdquo;
                </p>
                <div className="flex items-center gap-3 pt-4 border-t" style={{ borderColor: '#E2E8F0' }}>
                  <div
                    className="w-9 h-9 flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: '#002B5B' }}
                  >
                    {name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: '#002B5B' }}>{name}</p>
                    <p className="text-xs" style={{ color: '#64748B' }}>{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Institutional Footer ──────────────────────────────────────────── */}
      <footer
        className="border-t-4 py-12"
        style={{ background: '#002B5B', borderColor: '#0052CC', color: '#FFFFFF' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b" style={{ borderColor: '#1E3A5F' }}>
            <div className="md:col-span-2">
              <BrandLogo variant="light" size="md" showTagline />
              <p className="text-xs mt-4 max-w-md leading-relaxed" style={{ color: '#BFDBFE' }}>
                Blue ridge Bank provides personal checking, high-yield savings, international wire clearing, and digital asset custody under strict regulatory and cryptographic standards.
              </p>
              <p className="text-xs font-mono mt-3" style={{ color: '#93C5FD' }}>
                Support Desk: <a href="mailto:support@theblueridges.com" className="underline text-white">support@theblueridges.com</a>
              </p>
            </div>

            <div>
              <p className="text-xs font-mono uppercase tracking-wider font-bold mb-3" style={{ color: '#60A5FA' }}>
                Navigation
              </p>
              <ul className="space-y-2 text-xs" style={{ color: '#DBEAFE' }}>
                <li><Link href="/home" className="hover:underline">Overview</Link></li>
                <li><Link href="/services" className="hover:underline">Banking Services</Link></li>
                <li><Link href="/about" className="hover:underline">About the Institution</Link></li>
                <li><Link href="/blog" className="hover:underline">Market Insights</Link></li>
                <li><Link href="/contact" className="hover:underline">Client Support</Link></li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-mono uppercase tracking-wider font-bold mb-3" style={{ color: '#60A5FA' }}>
                Client Portal
              </p>
              <ul className="space-y-2 text-xs" style={{ color: '#DBEAFE' }}>
                <li><Link href="/auth/login" className="hover:underline">Sign In to Online Banking</Link></li>
                <li><Link href="/auth/register" className="hover:underline">Open a New Account</Link></li>
                <li><Link href="/contact" className="hover:underline">Wire &amp; Routing Instructions</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs" style={{ color: '#93C5FD' }}>
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
