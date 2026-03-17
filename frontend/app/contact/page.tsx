'use client'
import { useState } from 'react'
import { PublicNav } from '@/components/layout/PublicNav'
import { Mail, Phone, MapPin, Clock, MessageSquare, CheckCircle } from 'lucide-react'

export default function ContactPage() {
  const [sent, setSent] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSent(true)
  }

  return (
    <div className="min-h-screen" style={{ background: '#080E1C', color: '#fff' }}>
      <PublicNav />

      <section className="pt-32 pb-20 px-6 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6"
          style={{ background: 'rgba(16,185,129,.1)', border: '1px solid rgba(16,185,129,.25)' }}>
          <span className="text-xs font-semibold" style={{ color: '#10B981' }}>We're here to help</span>
        </div>
        <h1 className="font-display text-5xl font-bold text-white mb-4">Get in Touch</h1>
        <p className="text-white/55 max-w-xl mx-auto">Our support team is available 24/7 to help with any questions about your account, transactions, or features.</p>
      </section>

      <section className="pb-24 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Info */}
          <div className="md:col-span-2 space-y-5">
            {[
              { icon: Mail,  label: 'Email Support',   val: 'support@nexabank.com',  sub: 'Response within 2 hours' },
              { icon: Phone, label: 'Phone Support',    val: '+1 (888) 639-2265',     sub: '24/7 Available' },
              { icon: MapPin,label: 'Headquarters',     val: '100 NexaBank Plaza',    sub: 'San Francisco, CA 94105' },
              { icon: Clock, label: 'Business Hours',   val: '24 hours, 7 days',      sub: 'Including holidays' },
            ].map(({ icon: Icon, label, val, sub }) => (
              <div key={label} className="flex gap-4 p-5 rounded-2xl"
                style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(16,185,129,.15)' }}>
                  <Icon size={18} style={{ color: '#10B981' }} />
                </div>
                <div>
                  <p className="text-xs text-white/40 mb-0.5">{label}</p>
                  <p className="text-sm font-semibold text-white">{val}</p>
                  <p className="text-xs text-white/35">{sub}</p>
                </div>
              </div>
            ))}

            <div className="p-5 rounded-2xl" style={{ background: 'rgba(16,185,129,.08)', border: '1px solid rgba(16,185,129,.2)' }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="status-dot-green" />
                <span className="text-xs font-semibold" style={{ color: '#10B981' }}>All systems operational</span>
              </div>
              <p className="text-xs text-white/50">Live chat available in your dashboard when logged in.</p>
            </div>
          </div>

          {/* Form */}
          <div className="md:col-span-3">
            <div className="rounded-2xl p-8" style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)' }}>
              {sent ? (
                <div className="text-center py-10">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-emerald-500/15">
                    <CheckCircle size={32} style={{ color: '#10B981' }} />
                  </div>
                  <h3 className="font-display text-xl font-bold text-white mb-2">Message Sent!</h3>
                  <p className="text-white/50 text-sm">We'll get back to you within 2 hours.</p>
                  <button onClick={() => { setSent(false); setForm({ name:'',email:'',subject:'',message:'' }) }}
                    className="mt-6 px-5 py-2 rounded-xl text-sm font-semibold text-white"
                    style={{ background: '#10B981' }}>
                    Send Another
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-6">
                    <MessageSquare size={20} style={{ color: '#10B981' }} />
                    <h3 className="font-display font-bold text-lg text-white">Send us a message</h3>
                  </div>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { key:'name',    label:'Full Name',      ph:'Your name',    type:'text' },
                        { key:'email',   label:'Email Address',  ph:'your@email.com',type:'email' },
                      ].map(({ key, label, ph, type }) => (
                        <div key={key}>
                          <label className="block text-xs font-semibold text-white/60 mb-1.5">{label}</label>
                          <input type={type} required placeholder={ph}
                            value={form[key as keyof typeof form]}
                            onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                            className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none font-sans"
                            style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: '#fff' }} />
                        </div>
                      ))}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-white/60 mb-1.5">Subject</label>
                      <select required value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                        className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none font-sans"
                        style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: form.subject ? '#fff' : 'rgba(255,255,255,.4)' }}>
                        <option value="">Select a subject</option>
                        <option>Account Issue</option>
                        <option>Transaction Problem</option>
                        <option>Security Concern</option>
                        <option>Feature Request</option>
                        <option>General Inquiry</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-white/60 mb-1.5">Message</label>
                      <textarea required rows={5} placeholder="Describe your issue or question in detail..."
                        value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                        className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none font-sans resize-none"
                        style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: '#fff' }} />
                    </div>
                    <button type="submit" className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
                      style={{ background: '#10B981' }}>
                      Send Message
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t py-10 px-6" style={{ borderColor: 'rgba(255,255,255,.08)' }}>
        <div className="max-w-7xl mx-auto flex justify-between">
          <p className="text-sm font-display font-bold text-white"><span style={{ color: '#10B981' }}>N</span>exaBank</p>
          <p className="text-xs text-white/30">© {new Date().getFullYear()} NexaBank. Demo application.</p>
        </div>
      </footer>
    </div>
  )
}
