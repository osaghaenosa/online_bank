'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/store/auth'
import { Eye, EyeOff, ArrowRight, CheckCircle } from 'lucide-react'

export default function RegisterPage() {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '', confirm: '' })
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { register, toast } = useAuth()
  const router = useRouter()

  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) { setError('Passwords do not match'); return }
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true)
    try {
      await register({ firstName: form.firstName, lastName: form.lastName, email: form.email, phone: form.phone, password: form.password })
      toast('Account created! Welcome to NexaBank 🎉', 'success')
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const strength = (p: string) => {
    if (!p) return 0
    let s = 0
    if (p.length >= 8) s++
    if (/[A-Z]/.test(p)) s++
    if (/[0-9]/.test(p)) s++
    if (/[^A-Za-z0-9]/.test(p)) s++
    return s
  }
  const pw = strength(form.password)
  const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong']
  const STRENGTH_COLORS = ['', '#EF4444', '#F59E0B', '#3B82F6', '#10B981']

  return (
    <div className="min-h-screen flex" style={{ background: '#080E1C' }}>
      {/* Left */}
      <div className="hidden lg:flex flex-col justify-between w-5/12 p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0A1628 0%, #0F1C35 100%)' }}>
        <div className="absolute -left-16 top-1/3 w-72 h-72 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #10B981, transparent 70%)' }} />
        <Link href="/home" className="text-2xl font-display font-bold text-white">
          <span style={{ color: '#10B981' }}>N</span>exaBank
        </Link>
        <div>
          <h2 className="font-display text-4xl font-bold text-white mb-6">Open your account<br />in 2 minutes</h2>
          <div className="space-y-4">
            {[
              { icon: '🎁', text: '$1,000 welcome balance to get started' },
              { icon: '🔒', text: 'FDIC insured and 256-bit encrypted' },
              { icon: '⚡', text: 'Instant access to all 12+ payment methods' },
              { icon: '📄', text: 'PDF receipts generated for every transaction' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-start gap-3">
                <span className="text-lg">{icon}</span>
                <p className="text-sm text-white/60 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-white/25">No credit check required · No monthly fees · Cancel anytime</p>
      </div>

      {/* Right */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
        <div className="w-full max-w-lg py-8 fade-up">
          <Link href="/home" className="flex lg:hidden text-2xl font-display font-bold text-white mb-8 justify-center">
            <span style={{ color: '#10B981' }}>N</span>exaBank
          </Link>

          <h1 className="font-display text-3xl font-bold text-white mb-2">Create your account</h1>
          <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,.45)' }}>
            Already have an account?{' '}
            <Link href="/auth/login" style={{ color: '#10B981' }} className="font-semibold hover:underline">Sign in</Link>
          </p>

          {error && (
            <div className="mb-5 p-4 rounded-xl text-sm text-red-300"
              style={{ background: 'rgba(239,68,68,.12)', border: '1px solid rgba(239,68,68,.25)' }}>
              {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { k: 'firstName', label: 'First Name', ph: 'Jordan', type: 'text' },
                { k: 'lastName',  label: 'Last Name',  ph: 'Mitchell', type: 'text' },
              ].map(({ k, label, ph, type }) => (
                <div key={k}>
                  <label className="block text-xs font-semibold mb-1.5 text-white/60">{label}</label>
                  <input type={type} required placeholder={ph}
                    value={form[k as keyof typeof form]} onChange={f(k as keyof typeof form)}
                    className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none font-sans"
                    style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: '#fff' }}
                    onFocus={e => e.target.style.borderColor = '#10B981'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,.1)'} />
                </div>
              ))}
            </div>

            {[
              { k: 'email', label: 'Email Address', ph: 'you@example.com', type: 'email' },
              { k: 'phone', label: 'Phone Number (optional)', ph: '+1 555-0100', type: 'tel' },
            ].map(({ k, label, ph, type }) => (
              <div key={k}>
                <label className="block text-xs font-semibold mb-1.5 text-white/60">{label}</label>
                <input type={type} placeholder={ph} required={k === 'email'}
                  value={form[k as keyof typeof form]} onChange={f(k as keyof typeof form)}
                  className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none font-sans"
                  style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: '#fff' }}
                  onFocus={e => e.target.style.borderColor = '#10B981'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,.1)'} />
              </div>
            ))}

            <div>
              <label className="block text-xs font-semibold mb-1.5 text-white/60">Password</label>
              <div className="relative">
                <input type={show ? 'text' : 'password'} required placeholder="Min. 8 characters"
                  value={form.password} onChange={f('password')}
                  className="w-full rounded-xl px-3.5 py-2.5 pr-11 text-sm outline-none font-sans"
                  style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: '#fff' }}
                  onFocus={e => e.target.style.borderColor = '#10B981'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,.1)'} />
                <button type="button" onClick={() => setShow(!show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70">
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {form.password && (
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex gap-1 flex-1">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="h-1 flex-1 rounded-full transition-all"
                        style={{ background: i <= pw ? STRENGTH_COLORS[pw] : 'rgba(255,255,255,.1)' }} />
                    ))}
                  </div>
                  <span className="text-xs font-semibold" style={{ color: STRENGTH_COLORS[pw] }}>{STRENGTH_LABELS[pw]}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 text-white/60">Confirm Password</label>
              <input type="password" required placeholder="Repeat password"
                value={form.confirm} onChange={f('confirm')}
                className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none font-sans"
                style={{
                  background: 'rgba(255,255,255,.06)',
                  border: `1px solid ${form.confirm && form.confirm !== form.password ? '#EF4444' : form.confirm ? '#10B981' : 'rgba(255,255,255,.1)'}`,
                  color: '#fff'
                }} />
              {form.confirm && form.confirm === form.password && (
                <p className="text-xs mt-1 flex items-center gap-1" style={{ color: '#10B981' }}>
                  <CheckCircle size={11} /> Passwords match
                </p>
              )}
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-50 mt-2"
              style={{ background: '#10B981' }}>
              {loading
                ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : <><span>Create Account</span><ArrowRight size={15} /></>}
            </button>
          </form>

          <p className="text-xs text-center mt-5 text-white/25">
            By creating an account you agree to our{' '}
            <a href="#" className="underline hover:text-white/50">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="underline hover:text-white/50">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  )
}
