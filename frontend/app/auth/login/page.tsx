'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/store/auth'
import { BrandLogo } from '@/components/shared/BrandLogo'
import { Eye, EyeOff, ArrowRight, ShieldCheck, Lock, Building2, Mail } from 'lucide-react'

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
    <div className="min-h-screen flex flex-col lg:flex-row" style={{ background: '#F4F7FC' }}>
      {/* ── Desktop Left Brand Showcase ─────────────────────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between w-5/12 p-12 brand-card-gradient text-white relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#3B82F6]/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-white/10 blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <Link href="/home" className="inline-block">
            <BrandLogo variant="light" size="lg" showTagline />
          </Link>
        </div>

        <div className="relative z-10 my-10 space-y-6">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white/15 border border-white/20 text-blue-100">
            <span className="w-2 h-2 rounded-full bg-[#60A5FA]" />
            Client Portal Access
          </span>

          <h2 className="font-display text-4xl font-bold text-white leading-tight">
            Institutional Precision.<br />Personal Control.
          </h2>
          <p className="text-sm leading-relaxed max-w-md text-blue-100/90">
            Sign in to your Blue ridge Bank portal to manage real-time balances, authorize domestic and international wires, and download certified transaction statements.
          </p>

          {/* Framed Client Portal Preview + Glass Security Card */}
          <div className="relative max-w-md animate-reveal">
            <div className="rounded-3xl overflow-hidden border-2 border-white/20 shadow-float aspect-[16/9] bg-[#001F42]">
              <img
                src="/images/hero-banking-person.png"
                alt="Client accessing Blue ridge Bank online portal"
                className="w-full h-full object-cover animate-ken-burns"
              />
            </div>
            <div className="absolute bottom-3 left-3 rounded-2xl px-3.5 py-2 glass shadow-float animate-float">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#60A5FA] animate-live-dot flex-shrink-0" />
                <span className="text-xs font-semibold text-white">256-Bit Encrypted Access</span>
              </div>
            </div>
          </div>

          <div className="rounded-3xl p-5 glass space-y-3 max-w-md">
            {[
              { icon: Building2, label: 'Direct clearing for ACH, Wire & SWIFT rails' },
              { icon: ShieldCheck, label: 'Certified PDF audit receipts for every transaction' },
              { icon: Lock, label: 'Hardware & PIN multi-layer authorization' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0 text-blue-200">
                  <Icon size={15} />
                </div>
                <span className="text-xs font-medium text-white/95">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 pt-6 border-t border-white/15 flex items-center justify-between text-xs text-blue-200">
          <span>FDIC Insured · 256-Bit TLS</span>
          <span>SOC 2 Type II Certified</span>
        </div>
      </div>

      {/* ── Mobile Curved Brand Splash Header (Image 3 style) ───────────────── */}
      <div className="lg:hidden brand-card-gradient text-white px-5 pt-6 pb-20 rounded-b-[2.25rem] relative overflow-hidden">
        <div className="flex items-center justify-between mb-6 relative z-10">
          <Link href="/home">
            <BrandLogo variant="light" size="sm" />
          </Link>
          <Link
            href="/auth/register"
            className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-white bg-white/15 border border-white/25"
          >
            Open Account
          </Link>
        </div>
        <div className="text-center relative z-10">
          <h1 className="font-display text-2xl font-bold text-white">Welcome Back</h1>
          <p className="text-xs text-blue-200 mt-1">Sign in to access your Blue ridge Bank portal</p>
        </div>
      </div>

      {/* ── Right / Overlapping Sign-In Form Card ───────────────────────────── */}
      <div className="flex-1 flex items-start lg:items-center justify-center px-4 pb-10 -mt-12 lg:mt-0 lg:p-12 relative z-20">
        <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/80 shadow-float p-6 sm:p-9">
          <div className="hidden lg:block pb-6 mb-6 border-b border-slate-100">
            <span className="inline-block px-3 py-1 rounded-full text-[11px] font-semibold bg-[#EBF2FF] text-[#0052CC] mb-2">
              Authorized Online Banking
            </span>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#002B5B]">
              Sign In to Your Account
            </h1>
            <p className="text-xs mt-2 text-slate-500">
              New to Blue ridge Bank?{' '}
              <Link href="/auth/register" className="font-semibold text-[#0052CC] hover:underline">
                Enroll for Online Banking
              </Link>
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-2xl text-xs sm:text-sm font-medium bg-red-50 border border-red-200 text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Registered Email Address
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all font-sans border border-slate-200 bg-[#F8FAFC] focus:bg-white focus:border-[#0052CC] focus:ring-4 focus:ring-blue-500/10 text-[#0A192F]"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Security Password
                </label>
                <Link href="/contact" className="text-xs font-semibold text-[#0052CC] hover:underline">
                  Reset credentials?
                </Link>
              </div>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={show ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-11 py-3 rounded-xl text-sm outline-none font-sans border border-slate-200 bg-[#F8FAFC] focus:bg-white focus:border-[#0052CC] focus:ring-4 focus:ring-blue-500/10 transition-all text-[#0A192F]"
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-full text-sm font-semibold text-white flex items-center justify-center gap-2 shadow-brand transition-all hover:opacity-95 active:scale-[0.99] disabled:opacity-50 cursor-pointer mt-2"
              style={{ background: 'linear-gradient(135deg, #0052CC 0%, #003D99 100%)' }}
            >
              {loading ? (
                <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
              ) : (
                <>
                  <span>Access Banking Portal</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>

            <Link
              href="/auth/register"
              className="w-full py-3 rounded-full text-xs font-semibold text-[#002B5B] bg-[#F4F7FC] hover:bg-[#EBF2FF] border border-slate-200/80 flex items-center justify-center transition-colors lg:hidden"
            >
              Create a New Account
            </Link>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 text-center text-xs text-slate-500">
            Need assistance?{' '}
            <a href="mailto:support@theblueridges.com" className="font-semibold text-[#0052CC] hover:underline">
              support@theblueridges.com
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
