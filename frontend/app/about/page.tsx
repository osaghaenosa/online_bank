'use client'
import Link from 'next/link'
import { PublicNav } from '@/components/layout/PublicNav'
import { BrandLogo } from '@/components/shared/BrandLogo'
import { Shield, Users, Globe, Award, ArrowRight, CheckCircle, TrendingUp, Lock, Zap } from 'lucide-react'

const TIMELINE = [
  { year: '2020', title: 'Institutional Founding', desc: 'Blue ridge Bank was established with a clear mandate: bring institutional-grade banking precision to personal and business accounts.' },
  { year: '2021', title: 'Core Ledger Launch', desc: 'Launched our core checking and reserve accounts with real-time settlement and certified PDF audit receipts.' },
  { year: '2022', title: 'Digital Asset Treasury', desc: 'Integrated native digital asset custody alongside USD checking accounts under unified compliance controls.' },
  { year: '2023', title: 'Global Clearing Expansion', desc: 'Expanded settlement corridors to support international wire transfers, 12+ payment rails, and 180+ jurisdictions.' },
  { year: '2024', title: '500K+ Verified Accounts', desc: 'Surpassed half a million active client accounts and $2.4B in cleared volume with 99.99% core uptime.' },
]

const VALUES = [
  { icon: Shield, title: 'Cryptographic Security First', desc: 'Every account is fortified with 256-bit AES encryption, hardware-grade authentication, and continuous risk monitoring.' },
  { icon: Users, title: 'Transparent Governance', desc: 'No hidden maintenance fees, no opaque clearing delays, and complete auditability across every ledger entry.' },
  { icon: Globe, title: 'Borderless Settlement', desc: 'Engineered so your capital moves seamlessly across domestic ACH, Fedwire, SWIFT, and digital asset networks.' },
  { icon: TrendingUp, title: 'Disciplined Capital Growth', desc: 'High-yield savings vaults and structured wealth tools designed to preserve and compound client capital.' },
]

const TEAM = [
  { name: 'Alex Rivera', role: 'Chief Executive Officer', init: 'AR' },
  { name: 'Mia Chen', role: 'Chief Technology Officer', init: 'MC' },
  { name: 'Jordan Patel', role: 'Chief Information Security Officer', init: 'JP' },
  { name: 'Sadie Okonkwo', role: 'VP of Banking Operations', init: 'SO' },
  { name: 'Lucas Torres', role: 'Principal Ledger Architect', init: 'LT' },
  { name: 'Nina Walsh', role: 'Director of Client Relations', init: 'NW' },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen" style={{ background: '#F2F5F9', color: '#0A192F' }}>
      <PublicNav />

      {/* Hero Header */}
      <section
        className="pt-28 sm:pt-36 pb-16 sm:pb-20 px-4 sm:px-6 border-b-4"
        style={{ background: '#002B5B', borderColor: '#0052CC', color: '#FFFFFF' }}
      >
        <div className="max-w-7xl mx-auto">
          <div
            className="inline-block px-3 py-1 mb-5 text-xs font-mono uppercase tracking-widest font-bold"
            style={{ background: '#0052CC', color: '#FFFFFF' }}
          >
            INSTITUTIONAL PROFILE · CHARTER &amp; GOVERNANCE
          </div>
          <h1 className="font-display text-3xl sm:text-5xl font-bold text-white mb-6 max-w-3xl leading-tight">
            Built on Banking Discipline, Transparency, and Security.
          </h1>
          <p className="text-base sm:text-lg max-w-2xl leading-relaxed" style={{ color: '#BFDBFE' }}>
            Blue ridge Bank combines traditional institutional banking standards with modern real-time clearing infrastructure for individuals and global enterprises.
          </p>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="py-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div
            className="bg-white p-8 sm:p-12 border"
            style={{ borderColor: '#CBD5E1', borderLeft: '6px solid #0052CC' }}
          >
            <p className="text-xs font-mono uppercase tracking-widest font-bold mb-3" style={{ color: '#0052CC' }}>
              INSTITUTIONAL MANDATE
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold mb-4 leading-snug" style={{ color: '#002B5B' }}>
              &ldquo;To deliver institutional-grade financial custody, multi-rail settlement, and verifiable transparency to every account holder.&rdquo;
            </h2>
            <p className="text-sm sm:text-base leading-relaxed max-w-4xl" style={{ color: '#475569' }}>
              From cross-border corporate settlements to personal checking and high-yield reserve management, Blue ridge Bank is engineered to execute every transaction with uncompromising accuracy and complete auditability.
            </p>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10 pb-4 border-b-2" style={{ borderColor: '#002B5B' }}>
            <p className="text-xs font-mono uppercase tracking-widest font-bold mb-1" style={{ color: '#0052CC' }}>
              OPERATING PRINCIPLES
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold" style={{ color: '#002B5B' }}>
              What Blue ridge Bank Stands For
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {VALUES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="bg-white p-6 sm:p-8 border flex gap-5"
                style={{ borderColor: '#CBD5E1', borderTop: '3px solid #002B5B' }}
              >
                <div
                  className="w-12 h-12 flex items-center justify-center flex-shrink-0"
                  style={{ background: '#0052CC', color: '#FFFFFF' }}
                >
                  <Icon size={22} />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold mb-2" style={{ color: '#002B5B' }}>{title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#475569' }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Institutional Timeline */}
      <section className="py-16 px-4 sm:px-6 bg-white border-y" style={{ borderColor: '#CBD5E1' }}>
        <div className="max-w-5xl mx-auto">
          <div className="mb-12">
            <p className="text-xs font-mono uppercase tracking-widest font-bold mb-1" style={{ color: '#0052CC' }}>
              HISTORICAL MILESTONES
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold" style={{ color: '#002B5B' }}>
              Institutional Progression
            </h2>
          </div>
          <div className="border-t" style={{ borderColor: '#CBD5E1' }}>
            {TIMELINE.map(({ year, title, desc }) => (
              <div
                key={year}
                className="grid grid-cols-1 sm:grid-cols-12 gap-4 py-6 border-b items-start"
                style={{ borderColor: '#CBD5E1' }}
              >
                <div className="sm:col-span-2">
                  <span
                    className="inline-block px-3 py-1 font-mono font-bold text-xs"
                    style={{ background: '#002B5B', color: '#FFFFFF' }}
                  >
                    {year}
                  </span>
                </div>
                <div className="sm:col-span-4">
                  <h3 className="font-display font-bold text-base" style={{ color: '#002B5B' }}>{title}</h3>
                </div>
                <div className="sm:col-span-6">
                  <p className="text-sm leading-relaxed" style={{ color: '#475569' }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Executive Leadership */}
      <section className="py-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10 pb-4 border-b-2" style={{ borderColor: '#002B5B' }}>
            <p className="text-xs font-mono uppercase tracking-widest font-bold mb-1" style={{ color: '#0052CC' }}>
              GOVERNANCE BOARD
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold" style={{ color: '#002B5B' }}>
              Executive Leadership
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {TEAM.map(({ name, role, init }) => (
              <div
                key={name}
                className="bg-white p-5 border text-center"
                style={{ borderColor: '#CBD5E1', borderTop: '3px solid #0052CC' }}
              >
                <div
                  className="w-14 h-14 flex items-center justify-center text-white text-base font-mono font-bold mx-auto mb-3"
                  style={{ background: '#002B5B' }}
                >
                  {init}
                </div>
                <p className="text-sm font-bold" style={{ color: '#002B5B' }}>{name}</p>
                <p className="text-xs mt-1" style={{ color: '#64748B' }}>{role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security & Compliance */}
      <section className="py-16 px-4 sm:px-6 bg-white border-t" style={{ borderColor: '#CBD5E1' }}>
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7">
            <p className="text-xs font-mono uppercase tracking-widest font-bold mb-2" style={{ color: '#0052CC' }}>
              REGULATORY &amp; SECURITY STANDARDS
            </p>
            <h2 className="font-display text-3xl font-bold mb-4" style={{ color: '#002B5B' }}>
              Your Capital Is Protected at Every Layer
            </h2>
            <p className="text-sm sm:text-base mb-6 leading-relaxed" style={{ color: '#475569' }}>
              Every client account is safeguarded by multi-layered cryptographic verification, strict transaction PIN and token authorization, and 24/7 automated ledger auditing.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                'FDIC insured up to $250,000',
                '256-bit AES encryption at rest & in transit',
                'Multi-factor & PIN transaction verification',
                'Real-time fraud monitoring & alerts',
                'SOC 2 Type II certified infrastructure',
                'Automatic session & device governance',
              ].map(item => (
                <div key={item} className="flex items-center gap-2.5 p-3 border" style={{ background: '#F8FAFC', borderColor: '#CBD5E1' }}>
                  <CheckCircle size={15} style={{ color: '#0052CC', flexShrink: 0 }} />
                  <span className="text-xs font-semibold" style={{ color: '#0A192F' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 grid grid-cols-2 gap-4">
            {[
              { icon: Lock, label: 'End-to-End Encrypted', sub: 'TLS 1.3 / AES-256' },
              { icon: Shield, label: 'Fraud Protected', sub: '24/7 Ledger Audit' },
              { icon: Zap, label: '99.99% Uptime SLA', sub: 'Redundant Core' },
              { icon: Award, label: 'SOC 2 Type II', sub: 'Certified Controls' },
            ].map(({ icon: Icon, label, sub }) => (
              <div
                key={label}
                className="p-6 border text-center"
                style={{ background: '#002B5B', borderColor: '#0052CC', color: '#FFFFFF' }}
              >
                <div
                  className="w-11 h-11 flex items-center justify-center mx-auto mb-3"
                  style={{ background: '#0052CC', color: '#FFFFFF' }}
                >
                  <Icon size={20} />
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-white">{label}</p>
                <p className="text-[11px] font-mono mt-1" style={{ color: '#93C5FD' }}>{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
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
