'use client'
import { useState } from 'react'
import { PublicNav } from '@/components/layout/PublicNav'
import { BrandLogo } from '@/components/shared/BrandLogo'
import { WhatsAppIcon } from '@/components/shared/WhatsAppIcon'
import { Mail, MapPin, Clock, MessageSquare, CheckCircle } from 'lucide-react'

export default function ContactPage() {
  const [sent, setSent] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSent(true)
  }

  return (
    <div className="min-h-screen flex flex-col justify-between" style={{ background: '#F4F7FC', color: '#0A192F' }}>
      <div>
        <PublicNav />

        {/* Split Hero with Private Advisor Portrait */}
        <section className="pt-28 sm:pt-36 pb-16 px-4 sm:px-6 brand-card-gradient text-white overflow-hidden">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 animate-reveal">
              <span className="inline-block px-3.5 py-1.5 rounded-full mb-4 text-xs font-semibold bg-white/15 text-blue-100">
                Client Support &amp; Wire Desk
              </span>
              <h1 className="font-display text-3xl sm:text-5xl font-bold text-white mb-4">
                Contact Blue ridge Bank
              </h1>
              <p className="text-base sm:text-lg max-w-2xl text-blue-100/90 mb-7">
                Our institutional support and settlement specialists are available 24/7 to assist with account inquiries, wire verifications, and security credentials.
              </p>
              <a
                href="https://wa.me/12488346313"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-5 py-3 rounded-full bg-white text-[#002B5B] hover:bg-blue-50 text-xs sm:text-sm font-semibold shadow-float transition-all"
              >
                <WhatsAppIcon size={17} />
                <span>WhatsApp Desk: +1 (248) 834-6313</span>
              </a>
            </div>

            <div className="lg:col-span-5 relative">
              <div className="rounded-3xl overflow-hidden shadow-float border-4 border-white/20 aspect-[4/3] bg-[#001F42]">
                <img
                  src="/images/contact-advisor.png"
                  alt="Blue ridge Bank private banking relationship advisor"
                  className="w-full h-full object-cover animate-ken-burns"
                />
              </div>
              <div className="animate-float absolute bottom-3 left-3 sm:-left-3 sm:bottom-5 px-4 py-2.5 rounded-2xl bg-white/95 backdrop-blur-md text-[#002B5B] shadow-float flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-live-dot text-[#10B981]" />
                <span className="text-xs font-bold">24/7 Live Advisors Online</span>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Directory */}
            <div className="lg:col-span-5 space-y-4">
              {/* WhatsApp & Telephone Card */}
              <a
                href="https://wa.me/12488346313"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-card hover:shadow-card-hover flex gap-4 transition-all"
              >
                <div className="w-11 h-11 rounded-2xl bg-[#ECFDF5] flex items-center justify-center flex-shrink-0">
                  <WhatsAppIcon size={22} />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-400">WhatsApp &amp; Telephone Banking</p>
                  <p className="text-sm font-bold mt-0.5 text-[#002B5B] flex items-center gap-1.5">
                    <span>+1 (248) 834-6313</span>
                  </p>
                  <p className="text-xs mt-0.5 text-[#059669] font-medium">Tap to message on WhatsApp · 24/7 Line</p>
                </div>
              </a>

              {[
                { icon: Mail, label: 'Electronic Mail Desk', val: 'support@theblueridges.com', sub: 'Priority response within 2 hours' },
                { icon: MapPin, label: 'Corporate Headquarters', val: '100 Blue ridge Bank Plaza', sub: 'San Francisco, CA 94105' },
                { icon: Clock, label: 'Operating Hours', val: '24 Hours / 7 Days a Week', sub: 'Continuous ledger & support coverage' },
              ].map(({ icon: Icon, label, val, sub }) => (
                <div
                  key={label}
                  className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-card flex gap-4"
                >
                  <div className="w-11 h-11 rounded-2xl bg-[#EBF2FF] text-[#0052CC] flex items-center justify-center flex-shrink-0">
                    <Icon size={19} />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-slate-400">{label}</p>
                    <p className="text-sm font-bold mt-0.5 text-[#002B5B]">{val}</p>
                    <p className="text-xs mt-0.5 text-slate-500">{sub}</p>
                  </div>
                </div>
              ))}

              <div className="p-6 rounded-3xl brand-card-gradient text-white shadow-brand">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                  <span className="text-xs font-semibold text-white">
                    All Banking Systems Operational
                  </span>
                </div>
                <p className="text-xs text-blue-100 leading-relaxed">
                  Existing clients can also use the encrypted Live Support Chat directly inside the Online Banking Portal.
                </p>
              </div>
            </div>

            {/* Right Inquiry Form */}
            <div className="lg:col-span-7">
              <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-card">
                {sent ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 bg-[#EBF2FF] text-[#0052CC]">
                      <CheckCircle size={32} />
                    </div>
                    <h3 className="font-display text-2xl font-bold mb-2 text-[#002B5B]">
                      Inquiry Logged &amp; Transmitted
                    </h3>
                    <p className="text-sm mb-6 text-slate-500">
                      A Blue ridge Bank specialist will respond via email to <strong className="text-[#002B5B]">{form.email || 'your address'}</strong> within 2 hours.
                    </p>
                    <button
                      onClick={() => {
                        setSent(false)
                        setForm({ name: '', email: '', subject: '', message: '' })
                      }}
                      className="px-6 py-3 rounded-full text-xs font-semibold text-white shadow-brand cursor-pointer"
                      style={{ background: 'linear-gradient(135deg, #0052CC 0%, #003D99 100%)' }}
                    >
                      Submit Another Inquiry
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3.5 pb-5 mb-6 border-b border-slate-100">
                      <div className="w-10 h-10 rounded-2xl bg-[#EBF2FF] text-[#0052CC] flex items-center justify-center">
                        <MessageSquare size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[#0052CC]">Direct Dispatch Form</p>
                        <h3 className="font-display font-bold text-lg text-[#002B5B]">
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
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                              {label}
                            </label>
                            <input
                              type={type}
                              required
                              placeholder={ph}
                              value={form[key as keyof typeof form]}
                              onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                              className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none font-sans border border-slate-200 bg-[#F8FAFC] focus:bg-white focus:border-[#0052CC] focus:ring-4 focus:ring-blue-500/10 transition-all text-[#0A192F]"
                            />
                          </div>
                        ))}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Department / Subject
                        </label>
                        <select
                          required
                          value={form.subject}
                          onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                          className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none font-sans border border-slate-200 bg-[#F8FAFC] focus:bg-white focus:border-[#0052CC] transition-all text-[#0A192F]"
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
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Detailed Message
                        </label>
                        <textarea
                          required
                          rows={5}
                          placeholder="Please provide relevant details (never include your account password or PIN)..."
                          value={form.message}
                          onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                          className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none font-sans resize-none border border-slate-200 bg-[#F8FAFC] focus:bg-white focus:border-[#0052CC] focus:ring-4 focus:ring-blue-500/10 transition-all text-[#0A192F]"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3.5 rounded-full text-sm font-semibold text-white shadow-brand transition-all hover:opacity-95 cursor-pointer"
                        style={{ background: 'linear-gradient(135deg, #0052CC 0%, #003D99 100%)' }}
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
