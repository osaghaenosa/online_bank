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
  const STRENGTH_COLORS = ['', '#DC2626', '#D97706', '#2563EB', '#0052CC']

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
            New Account Enrollment
          </div>
          <h2 className="font-display text-4xl font-bold text-white mb-6 leading-tight">
            Establish Your Institutional &amp; Personal Account
          </h2>
          <p className="text-sm mb-8 leading-relaxed" style={{ color: '#BFDBFE' }}>
            Experience precision banking with direct ledger clearing, instant multi-channel funding, and full cryptographic protection.
          </p>

          <div className="space-y-0 border-t" style={{ borderColor: '#1E3A5F' }}>
            {[
              { icon: Building2, title: 'Instant Account Provisioning', text: 'Immediate USD checking & savings ledger with routing credentials' },
              { icon: ShieldCheck, title: 'FDIC & 256-Bit Protection', text: 'Institutional-grade security protocols and multi-factor verification' },
              { icon: Globe, title: 'Global Settlement Network', text: 'Access 12+ international & domestic transfer rails immediately' },
              { icon: Lock, title: 'Verified Audit Receipts', text: 'Official downloadable PDF statements generated for every transaction' },
            ].map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="flex items-start gap-4 py-4 border-b"
                style={{ borderColor: '#1E3A5F' }}
              >
                <div
                  className="w-9 h-9 flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: '#0052CC', color: '#FFFFFF' }}
                >
                  <Icon size={16} />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{title}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#93C5FD' }}>{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-6 border-t flex items-center justify-between text-xs font-mono" style={{ borderColor: '#1E3A5F', color: '#93C5FD' }}>
          <span>MEMBER FDIC · EQUAL HOUSING LENDER</span>
          <span>SUPPORT@THEBLUERIDGES.COM</span>
        </div>
      </div>

      {/* Top Mobile Banner */}
      <div
        className="lg:hidden px-5 py-4 flex items-center justify-between border-b-2"
        style={{ background: '#002B5B', borderColor: '#0052CC' }}
      >
        <Link href="/home">
          <BrandLogo variant="light" size="sm" />
        </Link>
        <Link
          href="/auth/login"
          className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white border"
          style={{ background: '#0052CC', borderColor: '#60A5FA' }}
        >
          Sign In
        </Link>
      </div>

      {/* Right Form Container */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-12 overflow-y-auto">
        <div
          className="w-full max-w-xl bg-white border border-slate-300 p-6 sm:p-10"
          style={{ borderTop: '4px solid #002B5B', boxShadow: '0 2px 6px rgba(0, 43, 91, 0.06)' }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 mb-6 border-b border-slate-200 gap-2">
            <div>
              <p className="text-[11px] font-mono uppercase tracking-widest font-bold" style={{ color: '#0052CC' }}>
                FORM BRB-101 · ENROLLMENT
              </p>
              <h1 className="font-display text-2xl sm:text-3xl font-bold mt-1" style={{ color: '#002B5B' }}>
                Open a Bank Account
              </h1>
            </div>
            <div className="text-xs sm:text-right" style={{ color: '#475569' }}>
              Already enrolled?{' '}
              <Link href="/auth/login" className="font-bold underline" style={{ color: '#0052CC' }}>
                Sign In Here
              </Link>
            </div>
          </div>

          {error && (
            <div
              className="mb-6 p-4 text-sm font-medium border-l-4"
              style={{ background: '#FEF2F2', borderColor: '#DC2626', color: '#991B1B' }}
            >
              {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { k: 'firstName', label: 'Legal First Name', ph: 'Jordan', type: 'text' },
                { k: 'lastName', label: 'Legal Last Name', ph: 'Mitchell', type: 'text' },
              ].map(({ k, label, ph, type }) => (
                <div key={k}>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#002B5B' }}>
                    {label} <span className="text-red-600">*</span>
                  </label>
                  <input
                    type={type}
                    required
                    placeholder={ph}
                    value={form[k as keyof typeof form]}
                    onChange={f(k as keyof typeof form)}
                    className="w-full px-3.5 py-2.5 text-sm outline-none font-sans border transition-colors"
                    style={{ background: '#FFFFFF', borderColor: '#CBD5E1', color: '#0A192F' }}
                    onFocus={e => (e.target.style.borderColor = '#0052CC')}
                    onBlur={e => (e.target.style.borderColor = '#CBD5E1')}
                  />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#002B5B' }}>
                  Email Address <span className="text-red-600">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@domain.com"
                  value={form.email}
                  onChange={f('email')}
                  className="w-full px-3.5 py-2.5 text-sm outline-none font-sans border transition-colors"
                  style={{ background: '#FFFFFF', borderColor: '#CBD5E1', color: '#0A192F' }}
                  onFocus={e => (e.target.style.borderColor = '#0052CC')}
                  onBlur={e => (e.target.style.borderColor = '#CBD5E1')}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#002B5B' }}>
                  Telephone Number
                </label>
                <input
                  type="tel"
                  placeholder="+1 (555) 010-0200"
                  value={form.phone}
                  onChange={f('phone')}
                  className="w-full px-3.5 py-2.5 text-sm outline-none font-sans border transition-colors"
                  style={{ background: '#FFFFFF', borderColor: '#CBD5E1', color: '#0A192F' }}
                  onFocus={e => (e.target.style.borderColor = '#0052CC')}
                  onBlur={e => (e.target.style.borderColor = '#CBD5E1')}
                />
              </div>
            </div>

            {/* Searchable Country Dropdown & City/Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div ref={countryRef} className="relative">
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#002B5B' }}>
                  Country of Residence <span className="text-red-600">*</span>
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
                    className="w-full pl-3.5 pr-9 py-2.5 text-sm outline-none font-sans border transition-colors"
                    style={{
                      background: '#FFFFFF',
                      borderColor: countryOpen ? '#0052CC' : '#CBD5E1',
                      color: '#0A192F',
                    }}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setCountryOpen(!countryOpen)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1"
                    style={{ color: '#002B5B' }}
                  >
                    <ChevronDown size={15} className={`transition-transform ${countryOpen ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                {countryOpen && (
                  <div
                    className="absolute left-0 right-0 z-50 mt-1 max-h-56 overflow-y-auto border-2 bg-white"
                    style={{ borderColor: '#002B5B', boxShadow: '0 8px 20px rgba(0, 43, 91, 0.15)' }}
                  >
                    <div
                      className="sticky top-0 px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider flex items-center justify-between border-b"
                      style={{ background: '#EBF2FF', color: '#002B5B', borderColor: '#CBD5E1' }}
                    >
                      <span className="flex items-center gap-1.5">
                        <Search size={11} /> {filteredCountries.length} Countries Available
                      </span>
                      <span>Click to Select</span>
                    </div>
                    {filteredCountries.length === 0 ? (
                      <div className="px-3.5 py-3 text-xs" style={{ color: '#64748B' }}>
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
                            className="w-full text-left px-3.5 py-2 text-sm flex items-center justify-between border-b last:border-b-0 transition-colors"
                            style={{
                              background: isSelected ? '#0052CC' : '#FFFFFF',
                              color: isSelected ? '#FFFFFF' : '#0A192F',
                              borderColor: '#F1F5F9',
                            }}
                            onMouseEnter={e => {
                              if (!isSelected) {
                                e.currentTarget.style.background = '#EBF2FF'
                                e.currentTarget.style.color = '#002B5B'
                              }
                            }}
                            onMouseLeave={e => {
                              if (!isSelected) {
                                e.currentTarget.style.background = '#FFFFFF'
                                e.currentTarget.style.color = '#0A192F'
                              }
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
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#002B5B' }}>
                  City / State / Province <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. New York, NY"
                  value={form.location}
                  onChange={f('location')}
                  autoComplete="address-level2"
                  className="w-full px-3.5 py-2.5 text-sm outline-none font-sans border transition-colors"
                  style={{ background: '#FFFFFF', borderColor: '#CBD5E1', color: '#0A192F' }}
                  onFocus={e => (e.target.style.borderColor = '#0052CC')}
                  onBlur={e => (e.target.style.borderColor = '#CBD5E1')}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#002B5B' }}>
                  Create Password <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <input
                    type={show ? 'text' : 'password'}
                    required
                    placeholder="Min. 8 characters"
                    value={form.password}
                    onChange={f('password')}
                    className="w-full px-3.5 py-2.5 pr-10 text-sm outline-none font-sans border transition-colors"
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
                    {show ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {form.password && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex gap-1 flex-1">
                      {[1, 2, 3, 4].map(i => (
                        <div
                          key={i}
                          className="h-1.5 flex-1 transition-all"
                          style={{ background: i <= pw ? STRENGTH_COLORS[pw] : '#E2E8F0' }}
                        />
                      ))}
                    </div>
                    <span className="text-[11px] font-bold uppercase" style={{ color: STRENGTH_COLORS[pw] }}>
                      {STRENGTH_LABELS[pw]}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#002B5B' }}>
                  Confirm Password <span className="text-red-600">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="Repeat password"
                  value={form.confirm}
                  onChange={f('confirm')}
                  className="w-full px-3.5 py-2.5 text-sm outline-none font-sans border transition-colors"
                  style={{
                    background: '#FFFFFF',
                    borderColor:
                      form.confirm && form.confirm !== form.password
                        ? '#DC2626'
                        : form.confirm
                        ? '#0052CC'
                        : '#CBD5E1',
                    color: '#0A192F',
                  }}
                />
                {form.confirm && form.confirm === form.password && (
                  <p className="text-xs mt-1.5 flex items-center gap-1 font-semibold" style={{ color: '#0052CC' }}>
                    <CheckCircle size={12} /> Passwords verified
                  </p>
                )}
              </div>
            </div>

            <div className="pt-2">
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
                    <span>Complete Account Enrollment</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs" style={{ color: '#64748B' }}>
            <span>
              By enrolling you agree to our{' '}
              <Link href="/about" className="underline font-semibold" style={{ color: '#002B5B' }}>
                Terms of Service
              </Link>{' '}
              &amp;{' '}
              <Link href="/about" className="underline font-semibold" style={{ color: '#002B5B' }}>
                Privacy Policy
              </Link>
            </span>
            <span className="font-mono text-[11px]" style={{ color: '#002B5B' }}>
              256-BIT TLS ENCRYPTED
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
