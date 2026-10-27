'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/store/auth'
import { BrandLogo } from '@/components/shared/BrandLogo'
import { Eye, EyeOff, ArrowRight, ShieldCheck, Lock, Building2 } from 'lucide-react'

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
      toast('Welcome back to Blue ridge Bank', 'success')
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row" style={{ background: '#F2F5F9' }}>
      {/* Left Institutional Panel */}
      <div
        className="hidden lg:flex flex-col justify-between w-5/12 p-12 border-r-4"
        style={{ background: '#002B5B', borderColor: '#0052CC' }}
      >
        <div>
          <Link href="/home" className="inline-block">
            <BrandLogo variant="light" size="lg" showTagline />
          </Link>
        </div>

        <div className="my-12">
          <div
            className="inline-block px-3 py-1 mb-5 text-xs font-mono uppercase tracking-widest font-bold"
            style={{ background: '#0052CC', color: '#FFFFFF' }}
          >
            Client Portal Access
          </div>
          <h2 className="font-display text-4xl font-bold text-white mb-4 leading-tight">
            Institutional Precision.<br />Personal Control.
          </h2>
          <p className="text-sm mb-8 leading-relaxed max-w-md" style={{ color: '#BFDBFE' }}>
            Sign in to your Blue ridge Bank portal to manage real-time balances, authorize domestic and international wires, and download certified transaction statements.
          </p>

          <div className="border-t" style={{ borderColor: '#1E3A5F' }}>
            {[
              { icon: Building2, label: 'Direct clearing for ACH, Wire, and International Swift rails' },
              { icon: ShieldCheck, label: 'Real-time PDF audit receipts for every ledger entry' },
              { icon: Lock, label: 'Multi-layer hardware and PIN transaction verification' },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-3.5 py-3.5 border-b"
                style={{ borderColor: '#1E3A5F' }}
              >
                <div
                  className="w-8 h-8 flex items-center justify-center flex-shrink-0"
                  style={{ background: '#0052CC', color: '#FFFFFF' }}
                >
                  <Icon size={15} />
                </div>
                <span className="text-xs font-medium text-white">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-6 border-t flex items-center justify-between text-xs font-mono" style={{ borderColor: '#1E3A5F', color: '#93C5FD' }}>
          <span>FDIC INSURED · 256-BIT ENCRYPTION</span>
          <span>SOC 2 TYPE II CERTIFIED</span>
        </div>
      </div>

      {/* Mobile Top Bar */}
      <div
        className="lg:hidden px-5 py-4 flex items-center justify-between border-b-2"
        style={{ background: '#002B5B', borderColor: '#0052CC' }}
      >
        <Link href="/home">
          <BrandLogo variant="light" size="sm" />
        </Link>
        <Link
          href="/auth/register"
          className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white border"
          style={{ background: '#0052CC', borderColor: '#60A5FA' }}
        >
          Open Account
        </Link>
      </div>

      {/* Right Sign-In Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-12">
        <div
          className="w-full max-w-md bg-white border border-slate-300 p-6 sm:p-10"
          style={{ borderTop: '4px solid #002B5B', boxShadow: '0 2px 6px rgba(0, 43, 91, 0.06)' }}
        >
          <div className="pb-6 mb-6 border-b border-slate-200">
            <p className="text-[11px] font-mono uppercase tracking-widest font-bold" style={{ color: '#0052CC' }}>
              AUTHORIZED ONLINE BANKING
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-bold mt-1" style={{ color: '#002B5B' }}>
              Sign In to Your Account
            </h1>
            <p className="text-xs mt-2" style={{ color: '#475569' }}>
              New to Blue ridge Bank?{' '}
              <Link href="/auth/register" className="font-bold underline" style={{ color: '#0052CC' }}>
                Enroll for Online Banking
              </Link>
            </p>
          </div>

          {error && (
            <div
              className="mb-6 p-4 text-sm font-medium border-l-4"
              style={{ background: '#FEF2F2', borderColor: '#DC2626', color: '#991B1B' }}
            >
              {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-5">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#002B5B' }}>
                Registered Email Address
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 text-sm outline-none transition-colors font-sans border"
                style={{ background: '#FFFFFF', borderColor: '#CBD5E1', color: '#0A192F' }}
                onFocus={e => (e.target.style.borderColor = '#0052CC')}
                onBlur={e => (e.target.style.borderColor = '#CBD5E1')}
              />
            </div>

            <div>
              <div className="flex justify-between mb-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#002B5B' }}>
                  Security Password
                </label>
                <Link href="/contact" className="text-xs font-semibold hover:underline" style={{ color: '#0052CC' }}>
                  Reset Credentials?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-11 text-sm outline-none font-sans border transition-colors"
                  style={{ background: '#FFFFFF', borderColor: '#CBD5E1', color: '#0A192F' }}
                  onFocus={e => (e.target.style.borderColor = '#0052CC')}
                  onBlur={e => (e.target.style.borderColor = '#CBD5E1')}
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: '#64748B' }}
                >
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 text-sm font-bold uppercase tracking-wider text-white flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              style={{ background: '#0052CC' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#002B5B')}
              onMouseLeave={e => (e.currentTarget.style.background = '#0052CC')}
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white animate-spin" />
              ) : (
                <>
                  <span>Access Banking Portal</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          <div
            className="mt-6 pt-5 border-t border-slate-200 flex items-center justify-between text-xs"
            style={{ color: '#64748B' }}
          >
            <span>Need assistance? <a href="mailto:support@theblueridges.com" className="underline font-semibold" style={{ color: '#002B5B' }}>support@theblueridges.com</a></span>
          </div>
        </div>
      </div>
    </div>
  )
}
