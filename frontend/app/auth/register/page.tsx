'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/store/auth'
import { BrandLogo } from '@/components/shared/BrandLogo'
import { Eye, EyeOff, ArrowRight, CheckCircle, ChevronDown, Search, ShieldCheck, Building2, Lock, Globe } from 'lucide-react'

const COUNTRIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina', 'Armenia',
  'Australia', 'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus',
  'Belgium', 'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil',
  'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cabo Verde', 'Cambodia', 'Cameroon', 'Canada',
  'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo (Congo-Brazzaville)',
  'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic', 'Democratic Republic of the Congo',
  'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic', 'Ecuador', 'Egypt', 'El Salvador',
  'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia', 'Fiji', 'Finland', 'France',
  'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea',
  'Guinea-Bissau', 'Guyana', 'Haiti', 'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran',
  'Iraq', 'Ireland', 'Israel', 'Italy', 'Ivory Coast', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan',
  'Kenya', 'Kiribati', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia',
  'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Madagascar', 'Malawi', 'Malaysia', 'Maldives',
  'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 'Micronesia', 'Moldova',
  'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nauru', 'Nepal',
  'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'North Macedonia',
  'Norway', 'Oman', 'Pakistan', 'Palau', 'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru',
  'Philippines', 'Poland', 'Portugal', 'Qatar', 'Romania', 'Russia', 'Rwanda', 'Saint Kitts and Nevis',
  'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Sao Tome and Principe',
  'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia',
  'Solomon Islands', 'Somalia', 'South Africa', 'South Korea', 'South Sudan', 'Spain', 'Sri Lanka',
  'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria', 'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand',
  'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu',
  'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan',
  'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe'
]

export default function RegisterPage() {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', country: '', location: '', password: '', confirm: '' })
  const [countrySearch, setCountrySearch] = useState('')
  const [countryOpen, setCountryOpen] = useState(false)
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { register, toast } = useAuth()
  const router = useRouter()
  const countryRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (countryRef.current && !countryRef.current.contains(e.target as Node)) {
        setCountryOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredCountries = COUNTRIES.filter(c =>
    c.toLowerCase().includes(countrySearch.trim().toLowerCase())
  )

  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  const handleCountryInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setCountrySearch(val)
    setForm(p => ({ ...p, country: val }))
    setCountryOpen(true)
  }

  const selectCountry = (country: string) => {
    setForm(p => ({ ...p, country }))
    setCountrySearch(country)
    setCountryOpen(false)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.country.trim()) { setError('Please select your country'); return }
    if (form.password !== form.confirm) { setError('Passwords do not match'); return }
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true)
    try {
      await register({ firstName: form.firstName, lastName: form.lastName, email: form.email, phone: form.phone, country: form.country, location: form.location, password: form.password })
      toast('Account created! Welcome to Blue ridge Bank', 'success')
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
  const STRENGTH_COLORS = ['', '#DC2626', '#D97706', '#2563EB', '#059669']

  const inputCls =
    'w-full px-3.5 py-2.5 rounded-xl text-sm outline-none font-sans border border-slate-200 bg-[#F8FAFC] focus:bg-white focus:border-[#0052CC] focus:ring-4 focus:ring-blue-500/10 transition-all text-[#0A192F]'

  return (
    <div className="min-h-screen flex flex-col lg:flex-row" style={{ background: '#F4F7FC' }}>
      {/* ── Desktop Left Brand Panel ──────────────────────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between w-5/12 p-12 brand-card-gradient text-white relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#3B82F6]/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-white/10 blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <Link href="/home" className="inline-block">
            <BrandLogo variant="light" size="lg" showTagline />
          </Link>
        </div>

        <div className="relative z-10 my-10">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-5 text-xs font-semibold bg-white/15 border border-white/20 text-blue-100">
            New Account Enrollment
          </span>
          <h2 className="font-display text-4xl font-bold text-white mb-4 leading-tight">
            Establish Your Institutional &amp; Personal Account
          </h2>
          <p className="text-sm mb-6 leading-relaxed text-blue-100/90">
            Experience precision banking with direct ledger clearing, instant multi-channel funding, and full cryptographic protection.
          </p>

          <div className="relative mb-6 animate-reveal">
            <div className="rounded-3xl overflow-hidden border-2 border-white/20 shadow-float aspect-[16/9] bg-[#001F42]">
              <img
                src="/images/about-institution.png"
                alt="Blue ridge Bank institutional headquarters"
                className="w-full h-full object-cover animate-ken-burns"
              />
            </div>
            <div className="absolute bottom-3 left-3 rounded-2xl px-3.5 py-2 glass shadow-float animate-float">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#60A5FA] animate-live-dot flex-shrink-0" />
                <span className="text-xs font-semibold text-white">Instant Account Provisioning</span>
              </div>
            </div>
          </div>

          <div className="space-y-2.5 rounded-3xl p-5 glass">
            {[
              { icon: Building2, title: 'Instant Account Provisioning', text: 'Immediate USD checking & savings ledger with routing credentials' },
              { icon: ShieldCheck, title: 'FDIC & 256-Bit Protection', text: 'Institutional-grade security protocols and multi-factor verification' },
              { icon: Globe, title: 'Global Settlement Network', text: 'Access 12+ international & domestic transfer rails immediately' },
              { icon: Lock, title: 'Verified Audit Receipts', text: 'Official downloadable PDF statements generated for every transaction' },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex items-start gap-3.5 py-2">
                <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0 mt-0.5 text-blue-200">
                  <Icon size={16} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="text-xs mt-0.5 text-blue-200/90">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 pt-6 border-t border-white/15 flex items-center justify-between text-xs text-blue-200">
          <span>Member FDIC · Equal Housing Lender</span>
          <span>support@theblueridges.com</span>
        </div>
      </div>

      {/* ── Mobile Curved Splash Banner ─────────────────────────────────────── */}
      <div className="lg:hidden brand-card-gradient text-white px-5 pt-6 pb-20 rounded-b-[2.25rem]">
        <div className="flex items-center justify-between mb-6">
          <Link href="/home">
            <BrandLogo variant="light" size="sm" />
          </Link>
          <Link
            href="/auth/login"
            className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-white bg-white/15 border border-white/25"
          >
            Sign In
          </Link>
        </div>
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold text-white">Open a Bank Account</h1>
          <p className="text-xs text-blue-200 mt-1">Fast digital enrollment with instant provisioning</p>
        </div>
      </div>

      {/* ── Right Form Card ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex items-start lg:items-center justify-center px-4 pb-10 -mt-12 lg:mt-0 lg:p-10 overflow-y-auto relative z-20">
        <div className="w-full max-w-xl bg-white rounded-3xl border border-slate-200/80 shadow-float p-6 sm:p-9">
          <div className="hidden lg:flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 mb-6 border-b border-slate-100 gap-2">
            <div>
              <span className="inline-block px-3 py-1 rounded-full text-[11px] font-semibold bg-[#EBF2FF] text-[#0052CC] mb-2">
                Online Account Enrollment
              </span>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#002B5B]">
                Open a Bank Account
              </h1>
            </div>
            <div className="text-xs sm:text-right text-slate-500">
              Already enrolled?{' '}
              <Link href="/auth/login" className="font-semibold text-[#0052CC] hover:underline">
                Sign In Here
              </Link>
            </div>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-2xl text-xs sm:text-sm font-medium bg-red-50 border border-red-200 text-red-700">
              {error}
            </div>
          )}

          {/* Account Type Switcher */}
          <div className="mb-5 grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-[#F4F7FC] border border-slate-200">
            <div className="py-2.5 px-3 rounded-xl text-center text-xs font-bold bg-[#002B5B] text-white shadow-sm">
              Personal Account
            </div>
            <Link
              href="/auth/register/business"
              className="py-2.5 px-3 rounded-xl text-center text-xs font-bold text-[#002B5B] hover:bg-white transition-colors"
            >
              Business Account →
            </Link>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { k: 'firstName', label: 'Legal First Name', ph: 'Jordan', type: 'text' },
                { k: 'lastName', label: 'Legal Last Name', ph: 'Mitchell', type: 'text' },
              ].map(({ k, label, ph, type }) => (
                <div key={k}>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    {label} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type={type}
                    required
                    placeholder={ph}
                    value={form[k as keyof typeof form]}
                    onChange={f(k as keyof typeof form)}
                    className={inputCls}
                  />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@domain.com"
                  value={form.email}
                  onChange={f('email')}
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Telephone Number
                </label>
                <input
                  type="tel"
                  placeholder="+1 (555) 010-0200"
                  value={form.phone}
                  onChange={f('phone')}
                  className={inputCls}
                />
              </div>
            </div>

            {/* Searchable Country Dropdown & City/Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div ref={countryRef} className="relative">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Country of Residence <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Type or select country..."
                    value={countrySearch}
                    onChange={handleCountryInput}
                    onFocus={() => setCountryOpen(true)}
                    autoComplete="off"
                    className="w-full pl-3.5 pr-9 py-2.5 rounded-xl text-sm outline-none font-sans border border-slate-200 bg-[#F8FAFC] focus:bg-white focus:border-[#0052CC] focus:ring-4 focus:ring-blue-500/10 transition-all text-[#0A192F]"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setCountryOpen(!countryOpen)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#002B5B]"
                  >
                    <ChevronDown size={15} className={`transition-transform ${countryOpen ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                {countryOpen && (
                  <div className="absolute left-0 right-0 z-50 mt-1.5 max-h-56 overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-float">
                    <div className="sticky top-0 px-3 py-2 text-[11px] font-semibold flex items-center justify-between border-b border-slate-100 bg-[#F4F7FC] text-[#002B5B]">
                      <span className="flex items-center gap-1.5">
                        <Search size={11} /> {filteredCountries.length} Countries
                      </span>
                      <span className="text-slate-400">Select</span>
                    </div>
                    {filteredCountries.length === 0 ? (
                      <div className="px-3.5 py-3 text-xs text-slate-500">
                        No country matching &ldquo;{countrySearch}&rdquo;
                      </div>
                    ) : (
                      filteredCountries.map(c => {
                        const isSelected = form.country.toLowerCase() === c.toLowerCase()
                        return (
                          <button
                            type="button"
                            key={c}
                            onClick={() => selectCountry(c)}
                            className="w-full text-left px-3.5 py-2 text-sm flex items-center justify-between border-b border-slate-50 last:border-b-0 transition-colors cursor-pointer"
                            style={{
                              background: isSelected ? '#0052CC' : '#FFFFFF',
                              color: isSelected ? '#FFFFFF' : '#0A192F',
                            }}
                          >
                            <span className="font-medium">{c}</span>
                            {isSelected && <CheckCircle size={13} />}
                          </button>
                        )
                      })
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  City / State / Province <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. New York, NY"
                  value={form.location}
                  onChange={f('location')}
                  autoComplete="address-level2"
                  className={inputCls}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Create Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={show ? 'text' : 'password'}
                    required
                    placeholder="Min. 8 characters"
                    value={form.password}
                    onChange={f('password')}
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl text-sm outline-none font-sans border border-slate-200 bg-[#F8FAFC] focus:bg-white focus:border-[#0052CC] focus:ring-4 focus:ring-blue-500/10 transition-all text-[#0A192F]"
                  />
                  <button
                    type="button"
                    onClick={() => setShow(!show)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {show ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {form.password && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex gap-1.5 flex-1">
                      {[1, 2, 3, 4].map(i => (
                        <div
                          key={i}
                          className="h-1.5 rounded-full flex-1 transition-all"
                          style={{ background: i <= pw ? STRENGTH_COLORS[pw] : '#E2E8F0' }}
                        />
                      ))}
                    </div>
                    <span className="text-[11px] font-semibold" style={{ color: STRENGTH_COLORS[pw] }}>
                      {STRENGTH_LABELS[pw]}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="Repeat password"
                  value={form.confirm}
                  onChange={f('confirm')}
                  className={inputCls}
                  style={{
                    borderColor:
                      form.confirm && form.confirm !== form.password
                        ? '#DC2626'
                        : form.confirm
                        ? '#0052CC'
                        : '#DDE5F0',
                  }}
                />
                {form.confirm && form.confirm === form.password && (
                  <p className="text-xs mt-1.5 flex items-center gap-1 font-semibold text-[#059669]">
                    <CheckCircle size={12} /> Passwords verified
                  </p>
                )}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-full text-sm font-semibold text-white flex items-center justify-center gap-2 shadow-brand transition-all hover:opacity-95 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                style={{ background: 'linear-gradient(135deg, #0052CC 0%, #003D99 100%)' }}
              >
                {loading ? (
                  <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                ) : (
                  <>
                    <span>Complete Account Enrollment</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
            <span>
              By enrolling you agree to our{' '}
              <Link href="/about" className="font-semibold text-[#0052CC] hover:underline">
                Terms of Service
              </Link>{' '}
              &amp;{' '}
              <Link href="/about" className="font-semibold text-[#0052CC] hover:underline">
                Privacy Policy
              </Link>
            </span>
            <span className="font-mono text-[11px] text-[#002B5B]">
              256-Bit TLS Encrypted
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
