'use client'
import { useState } from 'react'
import { PublicNav } from '@/components/layout/PublicNav'
import { BrandLogo } from '@/components/shared/BrandLogo'
import { Mail, Phone, MapPin, Clock, MessageSquare, CheckCircle } from 'lucide-react'

export default function ContactPage() {
  const [sent, setSent] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSent(true)
  }

  return (
    <div className="min-h-screen flex flex-col justify-between" style={{ background: '#F2F5F9', color: '#0A192F' }}>
      <div>
        <PublicNav />

        {/* Header */}
        <section
          className="pt-28 sm:pt-36 pb-16 px-4 sm:px-6 border-b-4"
          style={{ background: '#002B5B', borderColor: '#0052CC', color: '#FFFFFF' }}
        >
          <div className="max-w-7xl mx-auto">
            <div
              className="inline-block px-3 py-1 mb-4 text-xs font-mono uppercase tracking-widest font-bold"
              style={{ background: '#0052CC', color: '#FFFFFF' }}
            >
              CLIENT SUPPORT &amp; WIRE DESK
            </div>
            <h1 className="font-display text-3xl sm:text-5xl font-bold text-white mb-4">
              Contact Blue ridge Bank
            </h1>
            <p className="text-base sm:text-lg max-w-2xl" style={{ color: '#BFDBFE' }}>
              Our institutional support and settlement specialists are available 24/7 to assist with account inquiries, wire verifications, and security credentials.
            </p>
          </div>
        </section>

        <section className="py-16 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Directory */}
            <div className="lg:col-span-5 space-y-4">
              {[
                { icon: Mail, label: 'ELECTRONIC MAIL DESK', val: 'support@theblueridges.com', sub: 'Priority response within 2 hours' },
                { icon: Phone, label: 'TELEPHONE BANKING', val: '+1 (248) 834-6313', sub: '24/7 Automated & Specialist Line' },
                { icon: MapPin, label: 'CORPORATE HEADQUARTERS', val: '100 Blue ridge Bank Plaza', sub: 'San Francisco, CA 94105' },
                { icon: Clock, label: 'OPERATING HOURS', val: '24 Hours / 7 Days a Week', sub: 'Continuous ledger & support coverage' },
              ].map(({ icon: Icon, label, val, sub }) => (
                <div
                  key={label}
                  className="bg-white p-5 border flex gap-4"
                  style={{ borderColor: '#CBD5E1', borderLeft: '4px solid #002B5B' }}
                >
                  <div
                    className="w-10 h-10 flex items-center justify-center flex-shrink-0"
                    style={{ background: '#0052CC', color: '#FFFFFF' }}
                  >
                    <Icon size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-wider font-bold" style={{ color: '#64748B' }}>{label}</p>
                    <p className="text-sm font-bold mt-0.5" style={{ color: '#002B5B' }}>{val}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#475569' }}>{sub}</p>
                  </div>
                </div>
              ))}

              <div
                className="p-5 border"
                style={{ background: '#002B5B', borderColor: '#0052CC', color: '#FFFFFF' }}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-2 h-2" style={{ background: '#60A5FA' }} />
                  <span className="text-xs font-mono uppercase tracking-wider font-bold text-white">
                    ALL BANKING SYSTEMS OPERATIONAL
                  </span>
                </div>
                <p className="text-xs" style={{ color: '#BFDBFE' }}>
                  Existing clients can also use the encrypted Live Support Chat directly inside the Online Banking Portal.
                </p>
              </div>
            </div>

            {/* Right Inquiry Form */}
            <div className="lg:col-span-7">
              <div
                className="bg-white p-6 sm:p-10 border"
                style={{ borderColor: '#CBD5E1', borderTop: '4px solid #002B5B' }}
              >
                {sent ? (
                  <div className="text-center py-12">
                    <div
                      className="w-14 h-14 flex items-center justify-center mx-auto mb-4"
                      style={{ background: '#0052CC', color: '#FFFFFF' }}
                    >
                      <CheckCircle size={28} />
                    </div>
                    <h3 className="font-display text-2xl font-bold mb-2" style={{ color: '#002B5B' }}>
                      Inquiry Logged &amp; Transmitted
                    </h3>
                    <p className="text-sm mb-6" style={{ color: '#475569' }}>
                      A Blue ridge Bank specialist will respond via email to <strong>{form.email || 'your address'}</strong> within 2 hours.
                    </p>
                    <button
                      onClick={() => {
                        setSent(false)
                        setForm({ name: '', email: '', subject: '', message: '' })
                      }}
                      className="px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white"
                      style={{ background: '#0052CC' }}
                    >
                      Submit Another Inquiry
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 pb-5 mb-6 border-b" style={{ borderColor: '#E2E8F0' }}>
                      <div
                        className="w-9 h-9 flex items-center justify-center"
                        style={{ background: '#002B5B', color: '#FFFFFF' }}
                      >
                        <MessageSquare size={17} />
                      </div>
                      <div>
                        <p className="text-[10px] font-mono uppercase tracking-widest font-bold" style={{ color: '#0052CC' }}>
                          DIRECT DISPATCH FORM
                        </p>
                        <h3 className="font-display font-bold text-lg" style={{ color: '#002B5B' }}>
                          Submit an Official Inquiry
                        </h3>
                      </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                          { key: 'name', label: 'Full Legal Name', ph: 'Your name', type: 'text' },
                          { key: 'email', label: 'Email Address', ph: 'your@email.com', type: 'email' },
                        ].map(({ key, label, ph, type }) => (
                          <div key={key}>
                            <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#002B5B' }}>
                              {label}
                            </label>
                            <input
                              type={type}
                              required
                              placeholder={ph}
                              value={form[key as keyof typeof form]}
                              onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                              className="w-full px-3.5 py-2.5 text-sm outline-none font-sans border"
                              style={{ background: '#FFFFFF', borderColor: '#CBD5E1', color: '#0A192F' }}
                            />
                          </div>
                        ))}
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#002B5B' }}>
                          Department / Subject
                        </label>
                        <select
                          required
                          value={form.subject}
                          onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                          className="w-full px-3.5 py-2.5 text-sm outline-none font-sans border"
                          style={{ background: '#FFFFFF', borderColor: '#CBD5E1', color: '#0A192F' }}
                        >
                          <option value="">Select inquiry category</option>
                          <option>Account Access &amp; Enrollment</option>
                          <option>Wire / ACH Settlement Inquiry</option>
                          <option>Security &amp; Verification Credentials</option>
                          <option>Virtual Card &amp; Limits</option>
                          <option>General Institutional Inquiry</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#002B5B' }}>
                          Detailed Message
                        </label>
                        <textarea
                          required
                          rows={5}
                          placeholder="Please provide relevant details (never include your account password or PIN)..."
                          value={form.message}
                          onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                          className="w-full px-3.5 py-2.5 text-sm outline-none font-sans resize-none border"
                          style={{ background: '#FFFFFF', borderColor: '#CBD5E1', color: '#0A192F' }}
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3.5 text-xs font-bold uppercase tracking-wider text-white transition-colors"
                        style={{ background: '#0052CC' }}
                      >
                        Transmit Message to Support Desk
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

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
