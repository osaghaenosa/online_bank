'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/store/auth'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login, toast } = useAuth()
  const router = useRouter()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      toast('Welcome back!', 'success')
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#080E1C' }}>
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0F2A1A 0%, #0A1628 60%, #0F1C35 100%)' }}>
        <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #10B981, transparent 70%)' }} />
        <Link href="/home" className="text-2xl font-display font-bold text-white">
          <span style={{ color: '#10B981' }}>N</span>exaBank
        </Link>
        <div>
          <h2 className="font-display text-4xl font-bold text-white mb-4">
            Your finances,<br />always in control.
          </h2>
          <p className="text-white/50 mb-8 leading-relaxed max-w-sm">
            Sign in to access your account, view real-time balances, transfer funds, and manage all your transactions from one place.
          </p>
          <div className="space-y-3">
            {['Instant transfers to any account', 'Real-time transaction receipts', '12+ payment methods supported'].map(f => (
              <div key={f} className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#10B981' }} />
                <span className="text-sm text-white/60">{f}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-white/25">FDIC Insured · 256-bit Encryption · SOC 2 Certified</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md fade-up">
          {/* Mobile logo */}
          <Link href="/home" className="flex lg:hidden text-2xl font-display font-bold text-white mb-8 justify-center">
            <span style={{ color: '#10B981' }}>N</span>exaBank
          </Link>

          <h1 className="font-display text-3xl font-bold text-white mb-2">Welcome back</h1>
          <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,.45)' }}>
            Don't have an account?{' '}
            <Link href="/auth/register" style={{ color: '#10B981' }} className="font-semibold hover:underline">
              Sign up free
            </Link>
          </p>

          {error && (
            <div className="mb-5 p-4 rounded-xl text-sm text-red-300"
              style={{ background: 'rgba(239,68,68,.12)', border: '1px solid rgba(239,68,68,.25)' }}>
              {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5 text-white/60">Email Address</label>
              <input type="email" required autoComplete="email" placeholder="you@example.com"
                value={email} onChange={e => setEmail(e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all font-sans"
                style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: '#fff' }}
                onFocus={e => e.target.style.borderColor = '#10B981'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,.1)'} />
            </div>
            <div>
              <div className="flex justify-between mb-1.5">
                <label className="text-xs font-semibold text-white/60">Password</label>
                <button type="button" className="text-xs hover:underline" style={{ color: '#10B981' }}>Forgot password?</button>
              </div>
              <div className="relative">
                <input type={show ? 'text' : 'password'} required autoComplete="current-password" placeholder="••••••••"
                  value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full rounded-xl px-4 py-3 pr-11 text-sm outline-none font-sans"
                  style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: '#fff' }}
                  onFocus={e => e.target.style.borderColor = '#10B981'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,.1)'} />
                <button type="button" onClick={() => setShow(!show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70">
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: '#10B981' }}>
              {loading
                ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : <><span>Sign In</span><ArrowRight size={15} /></>}
            </button>
          </form>

          {/* Demo hint */}
          <div className="mt-6 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)' }}>
            <p className="text-xs font-semibold text-white/50 mb-2">🧪 Demo — create an account to get started</p>
            <p className="text-xs text-white/30">Registration is instant. You'll receive $1,000 starting balance.</p>
          </div>

          <p className="text-xs text-center mt-6 text-white/25">
            By signing in you agree to our{' '}
            <a href="#" className="hover:text-white/50 underline">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="hover:text-white/50 underline">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  )
}
