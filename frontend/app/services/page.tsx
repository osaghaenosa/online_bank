'use client'
import Link from 'next/link'
import { PublicNav } from '@/components/layout/PublicNav'
import { BrandLogo } from '@/components/shared/BrandLogo'
import { ArrowRight, Download, Upload, Send, Bitcoin, FileText, Building, CheckCircle } from 'lucide-react'

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
    <div className="min-h-screen" style={{ background: '#F2F5F9', color: '#0A192F' }}>
      <PublicNav />

      {/* Hero */}
      <section
        className="pt-28 sm:pt-36 pb-16 sm:pb-20 px-4 sm:px-6 border-b-4"
        style={{ background: '#002B5B', borderColor: '#0052CC', color: '#FFFFFF' }}
      >
        <div className="max-w-7xl mx-auto">
          <div
            className="inline-block px-3 py-1 mb-5 text-xs font-mono uppercase tracking-widest font-bold"
            style={{ background: '#0052CC', color: '#FFFFFF' }}
          >
            SERVICE CATALOG &amp; FEE SCHEDULE
          </div>
          <h1 className="font-display text-3xl sm:text-5xl font-bold text-white mb-6 max-w-3xl leading-tight">
            Full-Spectrum Banking &amp; Treasury Services.
          </h1>
          <p className="text-base sm:text-lg max-w-2xl leading-relaxed" style={{ color: '#BFDBFE' }}>
            12+ domestic and international settlement channels, certified PDF audit receipts, digital asset custody, and commercial bill pay in one unified account.
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SERVICES.map(({ code, icon: Icon, title, desc, features }) => (
            <div
              key={title}
              className="bg-white border p-7 flex flex-col justify-between"
              style={{ borderColor: '#CBD5E1', borderTop: '4px solid #002B5B' }}
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div
                    className="w-12 h-12 flex items-center justify-center"
                    style={{ background: '#0052CC', color: '#FFFFFF' }}
                  >
                    <Icon size={22} />
                  </div>
                  <span
                    className="px-2.5 py-1 text-[10px] font-mono font-bold uppercase"
                    style={{ background: '#EBF2FF', color: '#002B5B' }}
                  >
                    {code}
                  </span>
                </div>
                <h3 className="font-display font-bold text-xl mb-2" style={{ color: '#002B5B' }}>{title}</h3>
                <p className="text-sm mb-5 leading-relaxed" style={{ color: '#475569' }}>{desc}</p>
              </div>
              <ul className="space-y-2 pt-4 border-t" style={{ borderColor: '#E2E8F0' }}>
                {features.map(f => (
                  <li key={f} className="flex items-center gap-2.5">
                    <CheckCircle size={13} style={{ color: '#0052CC', flexShrink: 0 }} />
                    <span className="text-xs font-medium" style={{ color: '#1E293B' }}>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Payment Methods Schedule Table */}
      <section className="py-16 px-4 sm:px-6 bg-white border-y" style={{ borderColor: '#CBD5E1' }}>
        <div className="max-w-6xl mx-auto">
          <div className="mb-10">
            <p className="text-xs font-mono uppercase tracking-widest font-bold mb-1" style={{ color: '#0052CC' }}>
              CLEARING SPECIFICATIONS
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold" style={{ color: '#002B5B' }}>
              Payment Rail &amp; Fee Schedule
            </h2>
          </div>

          <div className="overflow-x-auto border" style={{ borderColor: '#CBD5E1' }}>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr style={{ background: '#002B5B', color: '#FFFFFF' }}>
                  <th className="px-5 py-3.5 text-xs font-mono uppercase tracking-wider">Code</th>
                  <th className="px-5 py-3.5 text-xs font-mono uppercase tracking-wider">Settlement Method</th>
                  <th className="px-5 py-3.5 text-xs font-mono uppercase tracking-wider">Standard Fee</th>
                  <th className="px-5 py-3.5 text-xs font-mono uppercase tracking-wider">Clearing Speed</th>
                  <th className="px-5 py-3.5 text-xs font-mono uppercase tracking-wider text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm" style={{ borderColor: '#CBD5E1' }}>
                {PAYMENT_GRID.map(({ name, fee, speed, code }, i) => (
                  <tr key={name} style={{ background: i % 2 === 0 ? '#FFFFFF' : '#F8FAFC' }}>
                    <td className="px-5 py-3.5 font-mono text-xs font-bold" style={{ color: '#0052CC' }}>{code}</td>
                    <td className="px-5 py-3.5 font-semibold" style={{ color: '#002B5B' }}>{name}</td>
                    <td className="px-5 py-3.5 font-mono text-xs font-bold" style={{ color: fee === 'Free' ? '#0052CC' : '#0A192F' }}>{fee}</td>
                    <td className="px-5 py-3.5 text-xs" style={{ color: '#475569' }}>{speed}</td>
                    <td className="px-5 py-3.5 text-right">
                      <span
                        className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase"
                        style={{ background: '#EBF2FF', color: '#0052CC', border: '1px solid #93C5FD' }}
                      >
                        ACTIVE
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
          <div className="mb-10 pb-4 border-b-2" style={{ borderColor: '#002B5B' }}>
            <p className="text-xs font-mono uppercase tracking-widest font-bold mb-1" style={{ color: '#0052CC' }}>
              REGULATORY THRESHOLDS
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold" style={{ color: '#002B5B' }}>
              Standard Account Limits
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {[
              { label: 'DAILY DEPOSIT LIMIT', value: '$50,000', note: 'Per day across all settlement rails' },
              { label: 'SINGLE WITHDRAWAL', value: '$10,000', note: 'Standard single disbursement limit' },
              { label: 'DAILY TRANSFER LIMIT', value: '$10,000', note: 'Combined internal & external daily' },
              { label: 'MONTHLY DEPOSIT VOLUME', value: '$250,000', note: 'Rolling 30-day clearing threshold' },
              { label: 'SINGLE TRANSFER', value: '$5,000', note: 'Standard individual transfer cap' },
              { label: 'FDIC COVERAGE', value: '$250,000', note: 'Per depositor institutional insurance' },
            ].map(({ label, value, note }) => (
              <div
                key={label}
                className="bg-white p-6 border"
                style={{ borderColor: '#CBD5E1', borderTop: '3px solid #0052CC' }}
              >
                <p className="text-[11px] font-mono uppercase tracking-wider font-bold mb-1" style={{ color: '#64748B' }}>{label}</p>
                <p className="font-mono text-2xl font-bold mb-1" style={{ color: '#002B5B' }}>{value}</p>
                <p className="text-xs" style={{ color: '#475569' }}>{note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 sm:px-6">
        <div
          className="max-w-5xl mx-auto p-8 sm:p-12 border-2 flex flex-col sm:flex-row items-center justify-between gap-6"
          style={{ background: '#002B5B', borderColor: '#0052CC', color: '#FFFFFF' }}
        >
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mb-2">
              Open Your Blue ridge Bank Account Today
            </h2>
            <p className="text-sm" style={{ color: '#BFDBFE' }}>
              Immediate online provisioning. Zero monthly maintenance fees.
            </p>
          </div>
          <Link
            href="/auth/register"
            className="px-7 py-4 text-xs font-bold uppercase tracking-wider text-white border flex items-center gap-2 flex-shrink-0"
            style={{ background: '#0052CC', borderColor: '#60A5FA' }}
          >
            Enroll Now <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      <footer
        className="border-t-4 py-10 px-4 sm:px-6"
        style={{ background: '#002B5B', borderColor: '#0052CC', color: '#FFFFFF' }}
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <BrandLogo variant="light" size="sm" />
          <p className="text-xs" style={{ color: '#93C5FD' }}>
            © 2026 Blue ridge Bank. All rights reserved. · support@theblueridges.com
          </p>
        </div>
      </footer>
    </div>
  )
}
