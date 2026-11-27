'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard, Building2, Download, Upload, Send, List,
  User, Menu, X, LogOut, ChevronRight, ShieldCheck, Wallet, TrendingUp, CreditCard, Smartphone, BookOpen, Search, AlertTriangle
} from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '@/store/auth'
import { fmtUSD, api } from '@/lib/api'
import { NotificationPopup } from '@/components/shared/NotificationPopup'
import { ChatWidget } from '@/components/shared/ChatWidget'
import { SetPinModal } from '@/components/shared/SetPinModal'
import { BrandLogo } from '@/components/shared/BrandLogo'
import { triggerPwaInstall } from '@/components/shared/PwaRegistrar'

const NAV = [
  { href: '/dashboard', label: 'Overview',          icon: LayoutDashboard },
  { href: '/account',   label: 'Checking Ledger',   icon: Building2 },
  { href: '/wealth',    label: 'Wealth & Reserves', icon: TrendingUp },
  { href: '/deposit',   label: 'Deposit Funds',     icon: Download },
  { href: '/withdraw',  label: 'Withdraw Funds',    icon: Upload },
  { href: '/transfer',  label: 'Wire & Transfer',   icon: Send },
  { href: '/tokens',    label: 'Security Tokens',   icon: Wallet },
  { href: '/history',   label: 'Audit History',     icon: List },
  { href: '/card',      label: 'Debit Cards',       icon: CreditCard },
  { href: '/profile',   label: 'Client Profile',    icon: User },
]

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':           'Account Overview',
  '/account':             'Checking Account Ledger',
  '/wealth':              'Wealth & Reserve Overview',
  '/wealth/crypto':       'Digital Asset Treasury',
  '/wealth/treasury':     'Treasury & Reserve Assets',
  '/wealth/investments':  'Investment Portfolio',
  '/wealth/trust':        'Trust & Fiduciary Fund',
  '/deposit':             'Deposit & Account Funding',
  '/withdraw':            'Withdraw & Disbursement',
  '/transfer':            'Wire & Internal Transfer',
  '/tokens':              'Security Authorization Tokens',
  '/history':             'Transaction Audit History',
  '/card':                'Virtual & Commercial Cards',
  '/profile':             'Client Profile & Security',
  '/kyc':                 'Identity Verification (KYC)',
  '/receipts':            'Official Transaction Receipt',
  '/admin':               'Administrative Command Center',
  '/admin/users':         'Client Directory & Management',
  '/admin/transactions':  'Global Ledger Transactions',
  '/admin/settings':      'System Configuration',
  '/admin/notifications': 'Broadcast Notifications',
  '/admin/accounts':      'Account Balance Editor',
  '/admin/controls':      'Compliance & Controls',
  '/admin/chat':          'Client Support Desk',
  '/admin/email':         'Communications & Mail Center',
  '/admin/api-keys':      'External API Key Management',
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [open,   setOpen]   = useState(false)
  const [unread, setUnread] = useState(0)
  const [maintenance, setMaintenance] = useState(false)
  const [clockText, setClockText] = useState('')
  const [topSearch, setTopSearch] = useState('')

  const isAdmin = pathname.startsWith('/admin')
  const title = Object.entries(PAGE_TITLES)
    .sort((a, b) => b[0].length - a[0].length)
    .find(([k]) => pathname.startsWith(k))?.[1] ?? 'Blue ridge Bank'

  useEffect(() => {
    api.user.notifications().then(d => setUnread(d.unreadCount)).catch(() => {})
    api.settings.maintenance().then(d => setMaintenance(d.maintenance)).catch(() => {})
  }, [pathname])

  useEffect(() => {
    const updateClock = () => {
      const now = new Date()
      const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
      setClockText(`${timeStr} · ${dateStr}`)
    }
    updateClock()
    const timer = setInterval(updateClock, 30000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else      document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!user) return null

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const q = topSearch.trim()
    router.push(q ? `/history?search=${encodeURIComponent(q)}` : '/history')
  }

  if (maintenance && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 brand-card-gradient text-white">
        <div className="text-center max-w-md rounded-3xl p-8 bg-white/10 backdrop-blur-xl border border-white/20 shadow-float">
          <div className="w-16 h-16 rounded-full bg-white/15 flex items-center justify-center mx-auto mb-5">
            <ShieldCheck size={34} className="text-blue-200" />
          </div>
          <h1 className="text-2xl font-bold font-display mb-3">Scheduled Ledger Maintenance</h1>
          <p className="text-sm mb-6 text-blue-100 leading-relaxed">
            Blue ridge Bank is currently performing scheduled core ledger maintenance. Online banking access will resume shortly.
          </p>
          <button
            onClick={logout}
            className="px-6 py-3 text-xs font-semibold rounded-full text-[#002B5B] bg-white hover:bg-blue-50 transition-colors cursor-pointer"
          >
            Sign Out Safely
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen" style={{ background: '#F4F7FC' }}>
      {!(user as any).hasPin && <SetPinModal />}

      {/* ── Desktop Light Institutional Sidebar (UXDA + PayDay style) ───────── */}
      <aside className="hidden lg:flex fixed top-0 left-0 h-screen w-[264px] z-50 flex-col bg-white border-r border-slate-200/75 shadow-[4px_0_24px_rgba(0,43,91,0.03)] overflow-hidden">
        {/* Brand Header */}
        <div className="px-5 py-5 flex items-center justify-between flex-shrink-0">
          <Link href="/dashboard">
            <BrandLogo variant="dark" size="sm" />
          </Link>
        </div>

        {/* Mini Balance Pill */}
        <div className="mx-4 mb-2 p-3.5 rounded-2xl bg-[#F4F7FC] border border-slate-200/70 flex-shrink-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-medium text-slate-500">Available Balance</span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#EBF2FF] text-[#0052CC]">USD</span>
          </div>
          <p className="font-mono font-bold text-lg text-[#002B5B] truncate">{fmtUSD(user.balance)}</p>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
          <p className="text-[11px] font-semibold text-slate-400 px-3 pt-2 pb-1.5">
            Banking
          </p>
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = href === '/dashboard' ? pathname === href : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] transition-all',
                  active
                    ? 'bg-[#EBF2FF] text-[#0052CC] font-semibold'
                    : 'text-slate-600 font-medium hover:bg-[#F4F7FC] hover:text-[#002B5B]'
                )}
              >
                <Icon size={16} className={clsx('flex-shrink-0', active ? 'text-[#0052CC]' : 'text-slate-400')} />
                <span className="truncate">{label}</span>
                {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#0052CC]" />}
              </Link>
            )
          })}

          {user.role === 'admin' && (
            <>
              <p className="text-[11px] font-semibold text-slate-400 px-3 pt-4 pb-1.5">
                Administration
              </p>
              <Link
                href="/admin"
                className={clsx(
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] transition-all',
                  isAdmin
                    ? 'bg-[#002B5B] text-white font-semibold shadow-sm'
                    : 'text-[#002B5B] font-semibold bg-[#F4F7FC] hover:bg-[#EBF2FF]'
                )}
              >
                <ShieldCheck size={16} className="flex-shrink-0" />
                <span>Admin Command</span>
              </Link>
            </>
          )}

          <p className="text-[11px] font-semibold text-slate-400 px-3 pt-4 pb-1.5">
            Developer
          </p>
          <Link
            href="/docs"
            className={clsx(
              'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] transition-all',
              pathname.startsWith('/docs')
                ? 'bg-[#EBF2FF] text-[#0052CC] font-semibold'
                : 'text-slate-600 font-medium hover:bg-[#F4F7FC] hover:text-[#002B5B]'
            )}
          >
            <BookOpen size={16} className={clsx('flex-shrink-0', pathname.startsWith('/docs') ? 'text-[#0052CC]' : 'text-slate-400')} />
            <span className="truncate">API Docs</span>
          </Link>
        </nav>

        {/* PayDay-inspired Mobile App / Security Card */}
        <div className="mx-3.5 mb-3 p-4 rounded-2xl brand-card-gradient text-white relative overflow-hidden flex-shrink-0 shadow-brand">
          <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-white/10" />
          <div className="flex items-center gap-2.5 mb-2 relative">
            <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
              <Smartphone size={15} className="text-blue-200" />
            </div>
            <div>
              <p className="text-xs font-display font-bold text-white leading-tight">Blue ridge App</p>
              <p className="text-[10px] text-blue-200">Quick mobile access</p>
            </div>
          </div>
          <button
            onClick={() => triggerPwaInstall()}
            className="w-full mt-1 py-2 px-3 rounded-xl bg-white text-[#002B5B] hover:bg-blue-50 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer relative"
            title="Install Blue ridge Bank on this device"
          >
            <Download size={13} />
            <span>Install App</span>
          </button>
        </div>

        {/* Client Footer */}
        <div className="px-4 py-3.5 border-t border-slate-100 flex-shrink-0 bg-white">
          <div className="flex items-center gap-3">
            {(user as any).profilePicture ? (
              <img
                src={(user as any).profilePicture}
                alt={user.firstName}
                className="w-9 h-9 rounded-full object-cover flex-shrink-0 ring-2 ring-[#EBF2FF]"
              />
            ) : (
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #002B5B 0%, #0052CC 100%)' }}
              >
                {user.firstName[0]}{user.lastName[0]}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[#002B5B] text-xs font-semibold truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-[11px] truncate text-slate-400">{user.email}</p>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 bg-[#F4F7FC] hover:bg-red-50 hover:text-red-600 transition-colors flex-shrink-0 cursor-pointer"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Mobile Frosted Overlay + Deep Brand Gradient Slide-Out Drawer (Image 3) ── */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-[#00142B]/55 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}
      <aside
        className={clsx(
          'fixed top-0 left-0 h-screen w-[290px] max-w-[85vw] z-[60] flex flex-col transition-transform duration-300 lg:hidden rounded-r-3xl brand-card-gradient text-white shadow-2xl overflow-hidden',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-white/10 flex-shrink-0">
          <Link href="/dashboard" onClick={() => setOpen(false)}>
            <BrandLogo variant="light" size="sm" />
          </Link>
          <button
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            onClick={() => setOpen(false)}
            aria-label="Close Menu"
          >
            <X size={16} />
          </button>
        </div>

        {/* Glass Balance Card */}
        <div className="mx-4 mt-4 p-4 rounded-2xl glass flex-shrink-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-medium text-blue-200">Available Liquidity</span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/15 text-white">USD</span>
          </div>
          <p className="font-mono font-bold text-xl text-white truncate">{fmtUSD(user.balance)}</p>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-3.5 py-4 space-y-1">
          <p className="text-[11px] font-semibold text-blue-200/80 px-3 pb-1">Banking Operations</p>
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = href === '/dashboard' ? pathname === href : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={clsx(
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all',
                  active
                    ? 'bg-white text-[#002B5B] shadow-sm'
                    : 'text-blue-100 hover:bg-white/10 hover:text-white'
                )}
              >
                <Icon size={16} className="flex-shrink-0" />
                <span className="truncate">{label}</span>
                {active && <ChevronRight size={14} className="ml-auto flex-shrink-0 text-[#0052CC]" />}
              </Link>
            )
          })}

          {user.role === 'admin' && (
            <>
              <p className="text-[11px] font-semibold text-blue-200/80 px-3 pt-4 pb-1">Administration</p>
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className={clsx(
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all',
                  isAdmin ? 'bg-white text-[#002B5B]' : 'bg-white/15 text-white hover:bg-white/20'
                )}
              >
                <ShieldCheck size={16} className="flex-shrink-0" />
                <span>Admin Command</span>
              </Link>
            </>
          )}

          <p className="text-[11px] font-semibold text-blue-200/80 px-3 pt-4 pb-1">Developer</p>
          <Link
            href="/docs"
            onClick={() => setOpen(false)}
            className={clsx(
              'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all',
              pathname.startsWith('/docs')
                ? 'bg-white text-[#002B5B]'
                : 'text-blue-100 hover:bg-white/10 hover:text-white'
            )}
          >
            <BookOpen size={16} className="flex-shrink-0" />
            <span className="truncate">API Docs</span>
          </Link>
        </nav>

        {/* Bottom PWA & Profile */}
        <div className="p-4 border-t border-white/10 space-y-3 flex-shrink-0 bg-[#001F42]/45">
          <button
            onClick={() => triggerPwaInstall()}
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-white bg-white/15 hover:bg-white/25 transition-colors cursor-pointer"
          >
            <Smartphone size={14} />
            <span>Install Blue ridge App</span>
          </button>

          <div className="flex items-center gap-3">
            {(user as any).profilePicture ? (
              <img
                src={(user as any).profilePicture}
                alt={user.firstName}
                className="w-9 h-9 rounded-full object-cover flex-shrink-0 border border-white/30"
              />
            ) : (
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 bg-[#0052CC]">
                {user.firstName[0]}{user.lastName[0]}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-[11px] truncate text-blue-200">{user.email}</p>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-red-500 text-white flex items-center justify-center transition-colors flex-shrink-0"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main Content Area ───────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0 overflow-x-hidden lg:ml-[264px]">
        {/* Desktop Header */}
        <header className="hidden lg:flex sticky top-0 z-30 items-center justify-between px-8 h-[72px] bg-[#F4F7FC]/85 backdrop-blur-md border-b border-slate-200/60 flex-shrink-0">
          <div className="min-w-0">
            <h2 className="font-display font-bold text-xl text-[#002B5B] truncate">
              {title}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 min-h-[16px]">
              {clockText || 'Blue ridge Bank · Personal & Commercial Portal'}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Search Pill */}
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={topSearch}
                onChange={e => setTopSearch(e.target.value)}
                placeholder="Search transactions…"
                className="w-56 xl:w-64 pl-9 pr-4 py-2 rounded-full bg-white border border-slate-200/80 text-xs outline-none focus:border-[#0052CC] focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-700"
              />
            </form>

            {/* Balance Pill */}
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-white border border-slate-200/80 shadow-sm">
              <Wallet size={14} className="text-[#0052CC]" />
              <span className="font-mono font-bold text-xs text-[#002B5B]">
                {fmtUSD(user.balance)}
              </span>
            </div>

            <NotificationPopup unread={unread} onUnreadChange={setUnread} />

            <Link href="/profile" title="Client Profile">
              {(user as any).profilePicture ? (
                <img
                  src={(user as any).profilePicture}
                  alt={user.firstName}
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0 cursor-pointer ring-2 ring-white shadow-sm hover:ring-[#0052CC] transition-all"
                />
              ) : (
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 cursor-pointer shadow-sm"
                  style={{ background: 'linear-gradient(135deg, #002B5B 0%, #0052CC 100%)' }}
                >
                  {user.firstName[0]}{user.lastName[0]}
                </div>
              )}
            </Link>
          </div>
        </header>

        {/* Mobile Header */}
        <header className="flex lg:hidden sticky top-0 z-30 items-center justify-between px-4 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/70 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/profile" className="flex-shrink-0">
              {(user as any).profilePicture ? (
                <img
                  src={(user as any).profilePicture}
                  alt={user.firstName}
                  className="w-9 h-9 rounded-full object-cover ring-2 ring-[#EBF2FF]"
                />
              ) : (
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ background: 'linear-gradient(135deg, #002B5B 0%, #0052CC 100%)' }}
                >
                  {user.firstName[0]}{user.lastName[0]}
                </div>
              )}
            </Link>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-[#0052CC] leading-none mb-0.5 truncate">
                Blue ridge Bank
              </p>
              <h2 className="font-display font-bold text-sm text-[#002B5B] truncate">
                {title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <NotificationPopup unread={unread} onUnreadChange={setUnread} />
            <button
              className="w-10 h-10 rounded-full bg-[#F4F7FC] border border-slate-200/80 text-[#002B5B] flex items-center justify-center flex-shrink-0 active:scale-95 transition-transform"
              onClick={() => setOpen(true)}
              aria-label="Open Navigation"
            >
              <Menu size={18} />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-28 lg:pb-10 w-full max-w-[1440px] mx-auto overflow-x-hidden">
          {/* Persistent Compliance / KYC Alert Banner */}
          {(user as any).accountType === 'business' && (user as any).businessDetails?.complianceStatus !== 'Verified' ? (
            <div className="mb-6 rounded-2xl bg-red-50 border-2 border-red-400 shadow-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center flex-shrink-0">
                  <AlertTriangle size={20} />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm text-red-900 uppercase tracking-wide">
                    {(user as any).businessDetails?.complianceStatus === 'Pending'
                      ? 'Business Compliance Under Review — Receive-Only Mode Active'
                      : 'Action Required: Business Account Restricted to Receive-Only Mode'}
                  </p>
                  <p className="text-xs text-red-800 mt-0.5 leading-relaxed">
                    {(user as any).businessDetails?.complianceStatus === 'Pending'
                      ? 'Your corporate documents are being reviewed. You can receive funds now, while outbound transfers, withdrawals, and bill payments remain locked until approval.'
                      : 'Your business account can currently only receive money. Submit your company registration, director/UBO IDs & proof of address, board resolution, and business activity to activate outbound transactions.'}
                  </p>
                </div>
              </div>
              <Link
                href="/business-compliance"
                className="px-5 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold text-center transition-all flex-shrink-0 whitespace-nowrap"
              >
                {(user as any).businessDetails?.complianceStatus === 'Pending' ? 'View Status' : 'Complete Business Compliance'}
              </Link>
            </div>
          ) : ((user as any).kyc === 'Not Started' || (user as any).kyc === 'Rejected') ? (
            <div className="mb-6 rounded-2xl bg-white border border-blue-100 shadow-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-[#EBF2FF] text-[#0052CC] flex items-center justify-center flex-shrink-0">
                  <ShieldCheck size={20} />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-[#002B5B]">
                    Identity Verification Required
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Complete quick KYC compliance verification to unlock full settlement limits and card issuance.
                  </p>
                </div>
              </div>
              <Link
                href="/kyc"
                className="px-5 py-2.5 rounded-full text-white text-xs font-semibold text-center transition-all shadow-brand hover:opacity-95 flex-shrink-0 whitespace-nowrap"
                style={{ background: 'linear-gradient(135deg, #0052CC 0%, #003D99 100%)' }}
              >
                Verify Identity
              </Link>
            </div>
          ) : null}

          {/* Buy Debit Card Banner */}
          {user.role !== 'admin' && (user as any).cardStatus === 'Not Requested' && (
            <div className="mb-6 rounded-2xl bg-amber-50 border border-amber-300 shadow-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0">
                  <CreditCard size={20} />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-amber-950">
                    Purchase a Debit Card to Enable Card Withdrawals
                  </p>
                  <p className="text-xs text-amber-800 mt-0.5">
                    You do not have a bank card yet. Buy a Visa or Mastercard commercial debit card and transfer funds into it for card withdrawals.
                  </p>
                </div>
              </div>
              <Link
                href="/card"
                className="px-5 py-2.5 rounded-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold text-center transition-all flex-shrink-0 whitespace-nowrap"
              >
                Buy Debit Card
              </Link>
            </div>
          )}

          {children}
        </main>

        {/* ── Mobile Frosted Bottom Navigation Dock with Elevated Center FAB (Image 3) ── */}
        <nav
          className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/80 shadow-[0_-8px_30px_rgba(0,43,91,0.08)] pb-safe"
          aria-label="Mobile Primary Navigation"
        >
          <div className="grid grid-cols-5 h-[68px] items-center px-1">
            {[
              { href: '/dashboard', label: 'Home',     icon: LayoutDashboard },
              { href: '/account',   label: 'Accounts', icon: Building2 },
            ].map(({ href, label, icon: Icon }) => {
              const active = href === '/dashboard' ? pathname === href : pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={clsx(
                    'flex flex-col items-center justify-center gap-1 py-1 transition-colors',
                    active ? 'text-[#0052CC]' : 'text-slate-400 hover:text-[#002B5B]'
                  )}
                >
                  <Icon size={19} />
                  <span className="text-[11px] font-semibold truncate">{label}</span>
                </Link>
              )
            })}

            {/* Center Elevated Circular Action FAB */}
            <Link
              href="/transfer"
              onClick={() => setOpen(false)}
              className="flex flex-col items-center justify-center -mt-6"
            >
              <div
                className="w-[52px] h-[52px] rounded-full flex items-center justify-center text-white shadow-brand border-4 border-white transition-transform active:scale-95"
                style={{ background: 'linear-gradient(135deg, #0052CC 0%, #002B5B 100%)' }}
              >
                <Send size={20} />
              </div>
              <span
                className={clsx(
                  'text-[11px] font-semibold mt-0.5',
                  pathname.startsWith('/transfer') ? 'text-[#0052CC]' : 'text-[#002B5B]'
                )}
              >
                Transfer
              </span>
            </Link>

            <Link
              href="/history"
              onClick={() => setOpen(false)}
              className={clsx(
                'flex flex-col items-center justify-center gap-1 py-1 transition-colors',
                pathname.startsWith('/history') ? 'text-[#0052CC]' : 'text-slate-400 hover:text-[#002B5B]'
              )}
            >
              <List size={19} />
              <span className="text-[11px] font-semibold truncate">History</span>
            </Link>

            <button
              type="button"
              onClick={() => setOpen(true)}
              className="flex flex-col items-center justify-center gap-1 py-1 text-slate-400 hover:text-[#002B5B] transition-colors cursor-pointer"
            >
              <Menu size={19} />
              <span className="text-[11px] font-semibold truncate">Menu</span>
            </button>
          </div>
        </nav>

        {/* Chat Widget */}
        {user.role !== 'admin' && <ChatWidget />}
      </div>
    </div>
  )
}
