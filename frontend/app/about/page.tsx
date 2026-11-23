'use client'
import { PublicNav } from '@/components/layout/PublicNav'
import { BrandLogo } from '@/components/shared/BrandLogo'
import { Shield, Users, Globe, Award, CheckCircle, TrendingUp, Lock, Zap } from 'lucide-react'

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
    <div className="min-h-screen" style={{ background: '#F4F7FC', color: '#0A192F' }}>
      <PublicNav />

      {/* Split Hero with Architectural Headquarters Photo */}
      <section className="pt-28 sm:pt-36 pb-16 sm:pb-24 px-4 sm:px-6 brand-card-gradient text-white overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 animate-reveal">
            <span className="inline-block px-3.5 py-1.5 rounded-full mb-5 text-xs font-semibold bg-white/15 text-blue-100">
              Institutional Profile · Charter &amp; Governance
            </span>
            <h1 className="font-display text-3xl sm:text-5xl font-bold text-white mb-5 leading-tight">
              Built on Banking Discipline, Transparency, and Security.
            </h1>
            <p className="text-base sm:text-lg max-w-2xl leading-relaxed text-blue-100/90">
              Blue ridge Bank combines traditional institutional banking standards with modern real-time clearing infrastructure for individuals and global enterprises.
            </p>
          </div>

          <div className="lg:col-span-5 relative">
            <div className="rounded-3xl overflow-hidden shadow-float border-4 border-white/20 aspect-[4/3] bg-[#001F42]">
              <img
                src="/images/about-institution.png"
                alt="Blue ridge Bank contemporary institutional headquarters"
                className="w-full h-full object-cover animate-ken-burns"
              />
            </div>
            <div className="animate-float absolute bottom-3 left-3 sm:-left-3 sm:bottom-5 px-4 py-2.5 rounded-2xl bg-white/95 backdrop-blur-md text-[#002B5B] shadow-float">
              <p className="text-[11px] font-medium text-slate-500">Chartered Trust</p>
              <p className="text-xs font-bold text-[#002B5B]">500K+ Verified Accounts · FDIC Insured</p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Statement + Leadership Team Split */}
      <section className="py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-10 lg:p-12 border border-slate-200/80 shadow-card grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[#EBF2FF] text-[#0052CC] mb-4">
                Institutional Mandate
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-bold mb-4 leading-snug text-[#002B5B]">
                &ldquo;To deliver institutional-grade financial custody, multi-rail settlement, and verifiable transparency to every account holder.&rdquo;
              </h2>
              <p className="text-sm sm:text-base leading-relaxed text-slate-500">
                From cross-border corporate settlements to personal checking and high-yield reserve management, Blue ridge Bank is engineered to execute every transaction with uncompromising accuracy and complete auditability.
              </p>
            </div>

            <div className="lg:col-span-5 relative group">
              <div className="rounded-2xl overflow-hidden shadow-card aspect-[16/10] bg-[#EBF2FF]">
                <img
                  src="/images/about-team.png"
                  alt="Blue ridge Bank leadership governance board collaborating"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>
              <div className="animate-float-delayed absolute bottom-3 right-3 px-3.5 py-2 rounded-xl bg-[#002B5B]/90 backdrop-blur-md text-white shadow-float">
                <p className="text-[11px] font-semibold">Global Governance Board</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-10 sm:py-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[#EBF2FF] text-[#0052CC] mb-2">
              Operating Principles
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#002B5B]">
              What Blue ridge Bank Stands For
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {VALUES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-card flex gap-5"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#EBF2FF] text-[#0052CC] flex items-center justify-center flex-shrink-0">
                  <Icon size={22} />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold mb-2 text-[#002B5B]">{title}</h3>
                  <p className="text-sm leading-relaxed text-slate-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Institutional Timeline */}
      <section className="py-16 px-4 sm:px-6 bg-white border-y border-slate-200/70">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[#EBF2FF] text-[#0052CC] mb-2">
              Historical Milestones
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#002B5B]">
              Institutional Progression
            </h2>
          </div>
          <div className="space-y-3">
            {TIMELINE.map(({ year, title, desc }) => (
              <div
                key={year}
                className="grid grid-cols-1 sm:grid-cols-12 gap-4 p-5 rounded-2xl bg-[#F4F7FC] items-start"
              >
                <div className="sm:col-span-2">
                  <span className="inline-block px-3.5 py-1 rounded-full font-mono font-bold text-xs bg-[#002B5B] text-white">
                    {year}
                  </span>
                </div>
                <div className="sm:col-span-4">
                  <h3 className="font-display font-bold text-base text-[#002B5B]">{title}</h3>
                </div>
                <div className="sm:col-span-6">
                  <p className="text-sm leading-relaxed text-slate-600">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Executive Leadership */}
      <section className="py-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[#EBF2FF] text-[#0052CC] mb-2">
              Governance Board
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#002B5B]">
              Executive Leadership
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {TEAM.map(({ name, role, init }) => (
              <div
                key={name}
                className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-card text-center"
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-white text-base font-bold mx-auto mb-3 shadow-brand"
                  style={{ background: 'linear-gradient(135deg, #002B5B 0%, #0052CC 100%)' }}
                >
                  {init}
                </div>
                <p className="text-sm font-bold text-[#002B5B]">{name}</p>
                <p className="text-xs mt-1 text-slate-500">{role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security & Compliance */}
      <section className="py-16 px-4 sm:px-6 bg-white border-t border-slate-200/70">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[#EBF2FF] text-[#0052CC] mb-3">
              Regulatory &amp; Security Standards
            </span>
            <h2 className="font-display text-3xl font-bold mb-4 text-[#002B5B]">
              Your Capital Is Protected at Every Layer
            </h2>
            <p className="text-sm sm:text-base mb-6 leading-relaxed text-slate-500">
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
                <div key={item} className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-[#F4F7FC]">
                  <CheckCircle size={15} className="text-[#0052CC] flex-shrink-0" />
                  <span className="text-xs font-semibold text-[#002B5B]">{item}</span>
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
                className="p-6 rounded-3xl brand-card-gradient text-white text-center shadow-card"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center mx-auto mb-3 text-blue-200">
                  <Icon size={20} />
                </div>
                <p className="text-xs font-bold text-white">{label}</p>
                <p className="text-[11px] font-mono mt-1 text-blue-200">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
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
