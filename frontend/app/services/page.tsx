'use client'
import Link from 'next/link'
import { PublicNav } from '@/components/layout/PublicNav'
import { BrandLogo } from '@/components/shared/BrandLogo'
import { ArrowRight, Download, Upload, Send, Bitcoin, FileText, Building, CheckCircle, Globe, Zap } from 'lucide-react'

const SERVICES = [
  {
    code: 'DEP-01',
    icon: Download,
    title: 'Multi-Channel Deposits',
    desc: 'Fund your checking or reserve account via domestic bank transfer, ACH, wire, debit/credit card, digital assets, or direct payment rails.',
    features: ['Instant card funding', 'Same-day ACH clearing', 'Crypto BTC/ETH/USDT/BNB/SOL', 'PayPal, Venmo, & Zelle support'],
  },
  {
    code: 'WTH-02',
    icon: Upload,
    title: 'Direct Withdrawals & Payouts',
    desc: 'Disburse capital quickly with zero-fee ACH transfers, same-day domestic/international wires, crypto payouts, and card settlements.',
    features: ['Zero-fee ACH payouts', 'Same-day Fedwire ($25)', 'Direct on-chain crypto settlement', 'Instant debit card disbursement'],
  },
  {
    code: 'TRF-03',
    icon: Send,
    title: 'Internal & External Transfers',
    desc: 'Execute instant ledger-to-ledger transfers to any Blue ridge Bank client or external institution with full reference tracking.',
    features: ['Immediate internal settlement', 'Send by email or account number', 'Zero internal transfer fees', 'Structured memo & audit notes'],
  },
  {
    code: 'CRY-04',
    icon: Bitcoin,
    title: 'Digital Asset Treasury',
    desc: 'Hold and settle Bitcoin, Ethereum, USDT, BNB, and Solana directly alongside your USD checking ledger.',
    features: ['5 major digital assets supported', 'Multi-network support (ERC-20, TRC-20, BEP-20)', 'Real-time market valuation', 'Dedicated deposit addresses & QR'],
  },
  {
    code: 'BIL-05',
    icon: Building,
    title: 'Commercial & Personal Bill Pay',
    desc: 'Settle utility obligations, commercial leases, vendor invoices, and recurring subscriptions directly from your primary balance.',
    features: ['Utilities, power, water, & telecom', 'Commercial & residential rent', 'Automated vendor disbursements', 'Instant confirmation receipts'],
  },
  {
    code: 'AUD-06',
    icon: FileText,
    title: 'Certified PDF Receipts',
    desc: 'Every transaction automatically generates a downloadable, bank-certified PDF statement with full ledger metadata.',
    features: ['Automated PDF generation', 'Complete sender/receiver details', 'Downloadable & printable anytime', 'Permanent audit history'],
  },
]

const PAYMENT_GRID = [
  { name: 'Bank Transfer', fee: 'Free', speed: 'Instant', code: 'BNK-01' },
  { name: 'ACH Transfer', fee: 'Free', speed: '1–3 Business Days', code: 'ACH-02' },
  { name: 'Wire Transfer', fee: '$25.00', speed: 'Same Day', code: 'WIR-03' },
  { name: 'Debit / Credit Card', fee: '2.5%', speed: 'Instant', code: 'CRD-04' },
  { name: 'Bitcoin (BTC)', fee: '$2.50', speed: '10–30 Mins', code: 'BTC-05' },
  { name: 'Ethereum (ETH)', fee: '$2.50', speed: '2–5 Mins', code: 'ETH-06' },
  { name: 'Tether (USDT)', fee: '$2.50', speed: 'Instant', code: 'USD-07' },
  { name: 'BNB Network', fee: '$2.50', speed: '3–5 Mins', code: 'BNB-08' },
  { name: 'Solana (SOL)', fee: '$2.50', speed: '< 1 Min', code: 'SOL-09' },
  { name: 'PayPal Direct', fee: 'Free', speed: 'Instant', code: 'PPL-10' },
  { name: 'Zelle Network', fee: 'Free', speed: 'Instant', code: 'ZEL-11' },
  { name: 'Apple Pay', fee: 'Free', speed: 'Instant', code: 'APL-12' },
]

export default function ServicesPage() {
  return (
    <div className="min-h-screen" style={{ background: '#F4F7FC', color: '#0A192F' }}>
      <PublicNav />

      {/* Split Hero with Framed Treasury Photography */}
      <section className="pt-28 sm:pt-36 pb-16 sm:pb-24 px-4 sm:px-6 brand-card-gradient text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 animate-reveal">
            <span className="inline-block px-3.5 py-1.5 rounded-full mb-5 text-xs font-semibold bg-white/15 text-blue-100">
              Service Catalog &amp; Fee Schedule
            </span>
            <h1 className="font-display text-3xl sm:text-5xl font-bold text-white mb-5 leading-tight">
              Full-Spectrum Banking &amp; Treasury Services.
            </h1>
            <p className="text-base sm:text-lg max-w-2xl leading-relaxed text-blue-100/90 mb-8">
              12+ domestic and international settlement channels, certified PDF audit receipts, digital asset custody, and commercial bill pay in one unified account.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/auth/register"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-xs sm:text-sm font-semibold text-[#002B5B] bg-white hover:bg-blue-50 shadow-float transition-all"
              >
                <span>Open an Account</span>
                <ArrowRight size={15} />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-xs sm:text-sm font-semibold text-white bg-white/15 hover:bg-white/25 border border-white/20 transition-all"
              >
                Talk to Treasury Desk
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5 relative">
            <div className="rounded-3xl overflow-hidden shadow-float border-4 border-white/20 aspect-[4/3] bg-[#001F42]">
              <img
                src="/images/services-treasury.png"
                alt="Financial executive analyzing global treasury clearing dashboards"
                className="w-full h-full object-cover animate-ken-burns"
              />
            </div>

            <div className="animate-float absolute top-3 left-3 sm:-left-3 sm:top-5 px-3.5 py-2 rounded-2xl bg-white/95 backdrop-blur-md text-[#002B5B] shadow-float flex items-center gap-2">
              <Globe size={14} className="text-[#0052CC]" />
              <span className="text-xs font-bold">12+ Global Rails</span>
            </div>

            <div className="animate-float-delayed absolute bottom-3 right-3 sm:-right-3 sm:bottom-5 px-3.5 py-2 rounded-2xl bg-[#001F42]/90 backdrop-blur-md text-white shadow-float border border-white/20 flex items-center gap-2">
              <Zap size={14} className="text-[#60A5FA]" />
              <span className="text-xs font-bold">Same-Day Fedwire</span>
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SERVICES.map(({ code, icon: Icon, title, desc, features }) => (
            <div
              key={title}
              className="bg-white rounded-3xl border border-slate-200/80 shadow-card hover:shadow-card-hover transition-all p-7 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-[#EBF2FF] text-[#0052CC] group-hover:bg-[#0052CC] group-hover:text-white flex items-center justify-center transition-colors">
                    <Icon size={22} />
                  </div>
                  <span className="px-3 py-1 rounded-full text-[11px] font-mono font-semibold bg-[#F4F7FC] text-[#002B5B]">
                    {code}
                  </span>
                </div>
                <h3 className="font-display font-bold text-xl mb-2 text-[#002B5B]">{title}</h3>
                <p className="text-sm mb-5 leading-relaxed text-slate-500">{desc}</p>
              </div>
              <ul className="space-y-2.5 pt-4 border-t border-slate-100">
                {features.map(f => (
                  <li key={f} className="flex items-center gap-2.5">
                    <CheckCircle size={14} className="text-[#0052CC] flex-shrink-0" />
                    <span className="text-xs font-medium text-slate-700">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Multi-Rail Card & Treasury Visual Highlight */}
      <section className="pb-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto bg-white rounded-3xl border border-slate-200/80 shadow-card p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-5 relative group">
            <div className="rounded-3xl overflow-hidden shadow-card aspect-[16/10] bg-[#EBF2FF]">
              <img
                src="/images/home-wealth-cards.png"
                alt="Blue ridge Bank commercial card and digital settlement workspace"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
            </div>
          </div>
          <div className="lg:col-span-7 space-y-4">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[#EBF2FF] text-[#0052CC]">
              Commercial Cards &amp; Treasury Rails
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#002B5B]">
              Seamless Fiat, Wire &amp; Card Settlement Under One Roof
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              Every Blue ridge Bank account pairs instant virtual Visa &amp; Mastercard commercial debit cards with domestic ACH, Fedwire, international IBAN/SWIFT wires, and multi-chain digital asset custody.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {['Zero-Fee Internal Transfers', 'Instant Card Controls', 'Certified PDF Audit Trail'].map(tag => (
                <span key={tag} className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#F4F7FC] text-[#002B5B]">
                  ✓ {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Payment Methods Schedule Table */}
      <section className="py-16 px-4 sm:px-6 bg-white border-y border-slate-200/70">
        <div className="max-w-6xl mx-auto">
          <div className="mb-10">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[#EBF2FF] text-[#0052CC] mb-2">
              Clearing Specifications
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#002B5B]">
              Payment Rail &amp; Fee Schedule
            </h2>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-slate-200/80 shadow-card">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F4F7FC] text-[#002B5B] border-b border-slate-200/80">
                  <th className="px-5 py-4 text-xs font-semibold">Code</th>
                  <th className="px-5 py-4 text-xs font-semibold">Settlement Method</th>
                  <th className="px-5 py-4 text-xs font-semibold">Standard Fee</th>
                  <th className="px-5 py-4 text-xs font-semibold">Clearing Speed</th>
                  <th className="px-5 py-4 text-xs font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm bg-white">
                {PAYMENT_GRID.map(({ name, fee, speed, code }) => (
                  <tr key={name} className="hover:bg-[#F4F7FC]/70 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-xs font-bold text-[#0052CC]">{code}</td>
                    <td className="px-5 py-3.5 font-semibold text-[#002B5B]">{name}</td>
                    <td className="px-5 py-3.5 font-mono text-xs font-bold" style={{ color: fee === 'Free' ? '#059669' : '#0A192F' }}>{fee}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">{speed}</td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-[#ECFDF5] text-[#059669]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Account Limits */}
      <section className="py-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[#EBF2FF] text-[#0052CC] mb-2">
              Regulatory Thresholds
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#002B5B]">
              Standard Account Limits
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {[
              { label: 'Daily Deposit Limit', value: '$50,000', note: 'Per day across all settlement rails' },
              { label: 'Single Withdrawal', value: '$10,000', note: 'Standard single disbursement limit' },
              { label: 'Daily Transfer Limit', value: '$10,000', note: 'Combined internal & external daily' },
              { label: 'Monthly Deposit Volume', value: '$250,000', note: 'Rolling 30-day clearing threshold' },
              { label: 'Single Transfer', value: '$5,000', note: 'Standard individual transfer cap' },
              { label: 'FDIC Coverage', value: '$250,000', note: 'Per depositor institutional insurance' },
            ].map(({ label, value, note }) => (
              <div
                key={label}
                className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card"
              >
                <p className="text-xs font-semibold text-slate-400 mb-1">{label}</p>
                <p className="font-mono text-2xl font-bold mb-1 text-[#002B5B]">{value}</p>
                <p className="text-xs text-slate-500">{note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto p-8 sm:p-12 rounded-3xl brand-card-gradient text-white shadow-float flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mb-2">
              Open Your Blue ridge Bank Account Today
            </h2>
            <p className="text-sm text-blue-100">
              Immediate online provisioning. Zero monthly maintenance fees.
            </p>
          </div>
          <Link
            href="/auth/register"
            className="px-7 py-3.5 rounded-full text-xs sm:text-sm font-semibold text-[#002B5B] bg-white hover:bg-blue-50 flex items-center gap-2 flex-shrink-0 shadow-lg transition-all"
          >
            <span>Enroll Now</span>
            <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      <footer className="py-10 px-4 sm:px-6 brand-card-gradient text-white">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <BrandLogo variant="light" size="sm" />
          <p className="text-xs text-blue-200">
            © 2026 Blue ridge Bank. All rights reserved. · support@theblueridges.com
          </p>
        </div>
      </footer>
    </div>
  )
}
