'use client'
import Link from 'next/link'
import { PublicNav } from '@/components/layout/PublicNav'
import { Shield, Users, Globe, Award, ArrowRight, CheckCircle, TrendingUp, Lock, Zap } from 'lucide-react'

const TIMELINE = [
  { year: '2020', title: 'Founded', desc: 'NexaBank was born from a simple idea: banking should work for everyone, not just the privileged few.' },
  { year: '2021', title: 'First 10K Users', desc: 'Launched our core checking accounts with instant transfers and reached 10,000 customers in our first year.' },
  { year: '2022', title: 'Crypto Integration', desc: 'Became one of the first digital banks to offer native crypto holdings alongside traditional USD accounts.' },
  { year: '2023', title: 'Global Expansion', desc: 'Expanded to support international wire transfers, 12+ payment methods, and 180+ countries.' },
  { year: '2024', title: '500K+ Members', desc: 'Passed half a million active members and $2.4B in processed transactions with 99.9% uptime.' },
]

const VALUES = [
  { icon: Shield,    title: 'Security First',    desc: 'Every feature is built with bank-grade 256-bit encryption and multi-factor authentication as the baseline, not an afterthought.' },
  { icon: Users,     title: 'People Over Profit', desc: 'No hidden fees, no selling your data, no confusing terms. We earn when you thrive — a model built on aligned incentives.' },
  { icon: Globe,     title: 'Borderless Finance', desc: 'Money should move freely. We built the infrastructure so your wealth isn\'t locked in by geography or legacy systems.' },
  { icon: TrendingUp,title: 'Continuous Growth',  desc: 'Every deposit, every transfer, every transaction is an opportunity to learn and improve the product for everyone.' },
]

const TEAM = [
  { name: 'Alex Rivera',   role: 'CEO & Co-Founder',      init: 'AR', color: '#10B981' },
  { name: 'Mia Chen',      role: 'CTO & Co-Founder',      init: 'MC', color: '#3B82F6' },
  { name: 'Jordan Patel',  role: 'Head of Security',      init: 'JP', color: '#8B5CF6' },
  { name: 'Sadie Okonkwo', role: 'Head of Product',       init: 'SO', color: '#F59E0B' },
  { name: 'Lucas Torres',  role: 'Lead Engineer',         init: 'LT', color: '#EF4444' },
  { name: 'Nina Walsh',    role: 'Customer Experience',   init: 'NW', color: '#06B6D4' },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen" style={{ background: '#080E1C', color: '#fff' }}>
      <PublicNav />

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6"
          style={{ background: 'rgba(16,185,129,.1)', border: '1px solid rgba(16,185,129,.25)' }}>
          <span className="text-xs font-semibold" style={{ color: '#10B981' }}>Our Story</span>
        </div>
        <h1 className="font-display text-5xl md:text-6xl font-bold text-white mb-6">
          We believe banking<br /><span style={{ color: '#10B981' }}>should be human.</span>
        </h1>
        <p className="text-lg text-white/55 max-w-2xl mx-auto leading-relaxed">
          NexaBank was built by a team of engineers and designers who were tired of outdated, opaque, 
          and fee-heavy banking. We set out to build the bank we wished existed.
        </p>
      </section>

      {/* Mission Banner */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto rounded-3xl p-10 md:p-16 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #0F2A1A 0%, #0A1628 100%)', border: '1px solid rgba(16,185,129,.2)' }}>
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #10B981, transparent 70%)' }} />
          <div className="relative z-10 max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#10B981' }}>Our Mission</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-6 leading-snug">
              "To make sophisticated financial tools accessible to every person on the planet — not just the wealthy few."
            </h2>
            <p className="text-white/50 leading-relaxed">
              From the freelancer receiving international payments to the small business owner managing payroll, 
              NexaBank is engineered to handle every financial need with the speed, transparency, and security 
              that modern life demands.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl font-bold text-white mb-3">What We Stand For</h2>
            <p className="text-white/50">The principles that guide every decision we make</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {VALUES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-2xl p-7 flex gap-5"
                style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)' }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(16,185,129,.15)' }}>
                  <Icon size={22} style={{ color: '#10B981' }} />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">{title}</h3>
                  <p className="text-sm text-white/50 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 px-6" style={{ background: 'rgba(255,255,255,.02)' }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl font-bold text-white mb-3">Our Journey</h2>
            <p className="text-white/50">From a bold idea to banking half a million people</p>
          </div>
          <div className="relative">
            {/* Line */}
            <div className="absolute left-16 top-0 bottom-0 w-px" style={{ background: 'rgba(16,185,129,.2)' }} />
            <div className="space-y-10">
              {TIMELINE.map(({ year, title, desc }) => (
                <div key={year} className="flex gap-8 items-start">
                  <div className="w-32 flex-shrink-0 text-right pr-4">
                    <span className="font-mono font-bold text-sm" style={{ color: '#10B981' }}>{year}</span>
                  </div>
                  {/* Dot */}
                  <div className="relative flex-shrink-0 mt-1">
                    <div className="w-3 h-3 rounded-full" style={{ background: '#10B981', boxShadow: '0 0 0 4px rgba(16,185,129,.2)' }} />
                  </div>
                  <div className="pb-2">
                    <h3 className="font-semibold text-white mb-1">{title}</h3>
                    <p className="text-sm text-white/50 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl font-bold text-white mb-3">The Team Behind NexaBank</h2>
            <p className="text-white/50">Passionate builders, engineers, and dreamers</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
            {TEAM.map(({ name, role, init, color }) => (
              <div key={name} className="text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-lg font-bold mx-auto mb-3"
                  style={{ background: color + '25', border: `1px solid ${color}40` }}>
                  <span style={{ color }}>{init}</span>
                </div>
                <p className="text-sm font-semibold text-white">{name}</p>
                <p className="text-xs text-white/40 mt-0.5">{role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security section */}
      <section className="py-20 px-6" style={{ background: 'rgba(255,255,255,.02)' }}>
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#10B981' }}>Security & Compliance</p>
            <h2 className="font-display text-3xl font-bold text-white mb-5">Your money is safe with us</h2>
            <p className="text-white/55 mb-7 leading-relaxed">
              We take security as seriously as the best banks in the world. Every piece of your financial data is protected with military-grade encryption, and our systems are monitored 24/7 for threats.
            </p>
            <div className="space-y-3">
              {[
                'FDIC insured up to $250,000',
                '256-bit AES encryption at rest and in transit',
                'Multi-factor authentication on every login',
                'Real-time fraud detection and alerts',
                'SOC 2 Type II compliant infrastructure',
                'Automatic session timeouts and device management',
              ].map(item => (
                <div key={item} className="flex items-center gap-3">
                  <CheckCircle size={15} style={{ color: '#10B981', flexShrink: 0 }} />
                  <span className="text-sm text-white/70">{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Lock,   label: 'End-to-End Encrypted',  color: '#10B981' },
              { icon: Shield, label: 'Fraud Protected',        color: '#3B82F6' },
              { icon: Zap,    label: '99.9% Uptime SLA',       color: '#F59E0B' },
              { icon: Award,  label: 'SOC 2 Certified',        color: '#8B5CF6' },
            ].map(({ icon: Icon, label, color }) => (
              <div key={label} className="rounded-2xl p-5 text-center"
                style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)' }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
                  style={{ background: color + '18' }}>
                  <Icon size={22} style={{ color }} />
                </div>
                <p className="text-xs font-semibold text-white/80">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 text-center">
        <h2 className="font-display text-4xl font-bold text-white mb-4">Join our mission</h2>
        <p className="text-white/50 mb-8 max-w-md mx-auto">Open your free account today and experience banking the way it should be.</p>
        <Link href="/auth/register"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-white"
          style={{ background: '#10B981' }}>
          Open Free Account <ArrowRight size={16} />
        </Link>
      </section>

      <footer className="border-t py-10 px-6" style={{ borderColor: 'rgba(255,255,255,.08)' }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-4">
          <p className="text-sm font-display font-bold text-white"><span style={{ color: '#10B981' }}>N</span>exaBank</p>
          <p className="text-xs text-white/30">© {new Date().getFullYear()} NexaBank. Simulated banking application.</p>
        </div>
      </footer>
    </div>
  )
}
