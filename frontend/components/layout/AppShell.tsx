'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard, Building2, Download, Upload, Send, List,
  User, Menu, X, LogOut, ChevronRight, ShieldCheck, Wallet, TrendingUp, CreditCard
} from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '@/store/auth'
import { fmtUSD, api } from '@/lib/api'
import { NotificationPopup } from '@/components/shared/NotificationPopup'
import { ChatWidget } from '@/components/shared/ChatWidget'
import { SetPinModal } from '@/components/shared/SetPinModal'
import { BrandLogo } from '@/components/shared/BrandLogo'

const NAV = [
  { href: '/dashboard', label: 'Account Overview',   icon: LayoutDashboard },
  { href: '/account',   label: 'Checking Ledger',    icon: Building2 },
  { href: '/wealth',    label: 'Wealth & Reserves',  icon: TrendingUp },
  { href: '/deposit',   label: 'Deposit Funds',      icon: Download },
  { href: '/withdraw',  label: 'Withdraw Funds',     icon: Upload },
  { href: '/transfer',  label: 'Wire & Transfer',    icon: Send },
  { href: '/tokens',    label: 'Security Tokens',    icon: Wallet },
  { href: '/history',   label: 'Audit History',      icon: List },
  { href: '/card',      label: 'Debit Cards',        icon: CreditCard },
  { href: '/profile',   label: 'Client Profile',     icon: User },
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
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const [open,   setOpen]   = useState(false)
  const [unread, setUnread] = useState(0)
  const [maintenance, setMaintenance] = useState(false)

  const isAdmin = pathname.startsWith('/admin')
  const title = Object.entries(PAGE_TITLES)
    .sort((a, b) => b[0].length - a[0].length)
    .find(([k]) => pathname.startsWith(k))?.[1] ?? 'Blue ridge Bank'

  useEffect(() => {
    api.user.notifications().then(d => setUnread(d.unreadCount)).catch(() => {})
    api.settings.maintenance().then(d => setMaintenance(d.maintenance)).catch(() => {})
  }, [pathname])

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else      document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!user) return null

  if (maintenance && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#002B5B', color: '#FFFFFF' }}>
        <div className="text-center max-w-md border-2 p-8" style={{ background: '#001F42', borderColor: '#0052CC' }}>
          <ShieldCheck size={56} className="mx-auto mb-5" style={{ color: '#60A5FA' }} />
          <h1 className="text-2xl font-bold font-display mb-3">Scheduled Ledger Maintenance</h1>
          <p className="text-sm mb-6" style={{ color: '#BFDBFE' }}>
            Blue ridge Bank is currently performing scheduled core ledger maintenance. Online banking access will resume shortly.
          </p>
          <button
            onClick={logout}
            className="px-6 py-2.5 text-xs font-bold uppercase tracking-wider border text-white transition-colors"
            style={{ background: '#0052CC', borderColor: '#60A5FA' }}
          >
            Sign Out Safely
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen" style={{ background: '#F2F5F9' }}>
      {!(user as any).hasPin && <SetPinModal />}

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Institutional Sidebar (Fixed on all viewports, independent of page scroll) ── */}
      <aside
        className={clsx(
          'fixed top-0 left-0 h-screen w-64 z-50 flex flex-col transition-transform duration-300 lg:translate-x-0 border-r-2 overflow-hidden',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{ background: '#002B5B', borderColor: '#0052CC' }}
      >
        {/* Brand Header */}
        <div
          className="px-5 py-4 border-b flex items-center justify-between flex-shrink-0"
          style={{ background: '#001F42', borderColor: '#1E3A5F' }}
        >
          <Link href="/dashboard" onClick={() => setOpen(false)}>
            <BrandLogo variant="light" size="sm" />
          </Link>
          <button
            className="lg:hidden text-white p-1.5 border"
            style={{ borderColor: '#1E3A5F', background: '#002B5B' }}
            onClick={() => setOpen(false)}
          >
            <X size={16} />
          </button>
        </div>

        {/* Structured Balance Box */}
        <div
          className="mx-3 mt-3 p-3.5 border flex-shrink-0"
          style={{ background: '#001F42', borderColor: '#0052CC', borderLeft: '4px solid #60A5FA' }}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider font-bold" style={{ color: '#93C5FD' }}>
              AVAILABLE LIQUIDITY
            </span>
            <span className="text-[10px] font-mono" style={{ color: '#60A5FA' }}>USD</span>
          </div>
          <p className="font-mono font-bold text-lg text-white truncate">{fmtUSD(user.balance)}</p>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
          <p
            className="text-[10px] font-mono font-bold uppercase tracking-widest px-3 py-2"
            style={{ color: '#93C5FD' }}
          >
            BANKING OPERATIONS
          </p>
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = href === '/dashboard' ? pathname === href : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors border-l-4',
                  active ? 'text-white' : 'hover:text-white'
                )}
                style={{
                  background: active ? '#0052CC' : 'transparent',
                  borderColor: active ? '#FFFFFF' : 'transparent',
                  color: active ? '#FFFFFF' : '#BFDBFE',
                }}
              >
                <Icon size={15} className="flex-shrink-0" />
                <span className="truncate">{label}</span>
                {active && <ChevronRight size={13} className="ml-auto flex-shrink-0" />}
              </Link>
            )
          })}

          {user.role === 'admin' && (
            <>
              <p
                className="text-[10px] font-mono font-bold uppercase tracking-widest px-3 pt-5 pb-2"
                style={{ color: '#93C5FD' }}
              >
                ADMINISTRATION
              </p>
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors border-l-4"
                style={{
                  background: isAdmin ? '#0052CC' : '#001F42',
                  borderColor: isAdmin ? '#FFFFFF' : '#60A5FA',
                  color: '#FFFFFF',
                }}
              >
                <ShieldCheck size={15} className="flex-shrink-0" />
                <span>Admin Command</span>
              </Link>
            </>
          )}
        </nav>

        {/* Client Footer */}
        <div
          className="p-3.5 border-t flex-shrink-0"
          style={{ background: '#001F42', borderColor: '#1E3A5F' }}
        >
          <div className="flex items-center gap-3">
            {(user as any).profilePicture ? (
              <img
                src={(user as any).profilePicture}
                alt={user.firstName}
                className="w-9 h-9 object-cover flex-shrink-0 border"
                style={{ borderColor: '#60A5FA' }}
              />
            ) : (
              <div
                className="w-9 h-9 flex items-center justify-center text-white text-xs font-mono font-bold flex-shrink-0 border"
                style={{ background: '#0052CC', borderColor: '#60A5FA' }}
              >
                {user.firstName[0]}{user.lastName[0]}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-bold uppercase truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-[11px] truncate" style={{ color: '#93C5FD' }}>{user.email}</p>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 border text-white hover:bg-red-600 transition-colors flex-shrink-0"
              style={{ borderColor: '#1E3A5F', background: '#002B5B' }}
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main Content Area (Offset by fixed sidebar on desktop) ───── */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0 overflow-x-hidden lg:ml-64">
        {/* Top Institutional Header */}
        <header
          className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 h-14 sm:h-16 border-b-2 flex-shrink-0"
          style={{ background: '#FFFFFF', borderColor: '#002B5B' }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <button
              className="lg:hidden p-2 border flex-shrink-0"
              style={{ background: '#002B5B', borderColor: '#0052CC', color: '#FFFFFF' }}
              onClick={() => setOpen(true)}
              aria-label="Open Navigation"
            >
              <Menu size={17} />
            </button>
            <div className="min-w-0">
              <p className="hidden sm:block text-[10px] font-mono uppercase tracking-widest font-bold" style={{ color: '#0052CC' }}>
                BLUE RIDGE BANK · ONLINE PORTAL
              </p>
              <h2 className="font-bold text-sm sm:text-lg font-display truncate" style={{ color: '#002B5B' }}>
                {title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Desktop Balance Indicator */}
            <div
              className="hidden md:flex items-center gap-2 px-3.5 py-1.5 border"
              style={{ background: '#EBF2FF', borderColor: '#93C5FD' }}
            >
              <Wallet size={14} style={{ color: '#0052CC' }} />
              <span className="text-[11px] font-mono uppercase font-bold" style={{ color: '#002B5B' }}>BAL:</span>
              <span className="font-mono font-bold text-sm" style={{ color: '#0052CC' }}>
                {fmtUSD(user.balance)}
              </span>
            </div>

            {/* Notification popup */}
            <NotificationPopup unread={unread} onUnreadChange={setUnread} />

            {/* Profile Link */}
            <Link href="/profile">
              {(user as any).profilePicture ? (
                <img
                  src={(user as any).profilePicture}
                  alt={user.firstName}
                  className="w-8 h-8 sm:w-9 sm:h-9 object-cover flex-shrink-0 cursor-pointer border"
                  style={{ borderColor: '#002B5B' }}
                />
              ) : (
                <div
                  className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-white text-xs font-mono font-bold flex-shrink-0 cursor-pointer"
                  style={{ background: '#002B5B' }}
                >
                  {user.firstName[0]}{user.lastName[0]}
                </div>
              )}
            </Link>
          </div>
        </header>

        {/* KYC Warning Banner */}
        {(user as any).kyc === 'Not Started' || (user as any).kyc === 'Rejected' ? (
          <div
            className="border-b px-4 sm:px-6 py-3 flex items-start sm:items-center justify-between gap-4 flex-shrink-0"
            style={{ background: '#EBF2FF', borderColor: '#93C5FD' }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-8 h-8 flex items-center justify-center text-white flex-shrink-0"
                style={{ background: '#0052CC' }}
              >
                <ShieldCheck size={16} />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-xs uppercase tracking-wider" style={{ color: '#002B5B' }}>
                  Identity Verification Required
                </p>
                <p className="text-xs truncate" style={{ color: '#1E3A5F' }}>
                  Please complete KYC compliance verification to unlock full settlement limits.
                </p>
              </div>
            </div>
            <Link
              href="/kyc"
              className="px-4 py-1.5 text-white text-xs font-bold uppercase tracking-wider transition-colors flex-shrink-0 whitespace-nowrap"
              style={{ background: '#0052CC' }}
            >
              Verify Identity
            </Link>
          </div>
        ) : null}

        {/* Page Content */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 pb-24 lg:pb-8 w-full max-w-7xl mx-auto overflow-x-hidden">
          {children}
        </main>

        {/* ── Mobile Fixed Bottom Navigation Bar (4 Primary Buttons) ──── */}
        <nav
          className="lg:hidden fixed bottom-0 left-0 right-0 z-40 h-16 grid grid-cols-4 border-t-2"
          style={{ background: '#002B5B', borderColor: '#0052CC' }}
          aria-label="Mobile Primary Navigation"
        >
          {[
            { href: '/dashboard', label: 'Home',     icon: LayoutDashboard },
            { href: '/account',   label: 'Account',  icon: Building2 },
            { href: '/transfer',  label: 'Transfer', icon: Send },
            { href: '/history',   label: 'History',  icon: List },
          ].map(({ href, label, icon: Icon }) => {
            const active = href === '/dashboard' ? pathname === href : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="flex flex-col items-center justify-center gap-1 transition-colors border-t-2"
                style={{
                  background: active ? '#0052CC' : '#002B5B',
                  borderTopColor: active ? '#FFFFFF' : 'transparent',
                  color: active ? '#FFFFFF' : '#93C5FD',
                }}
              >
                <Icon size={18} className="flex-shrink-0" />
                <span className="text-[11px] font-semibold tracking-wide truncate">{label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Chat Widget */}
        {user.role !== 'admin' && <ChatWidget />}
      </div>
    </div>
  )
}
