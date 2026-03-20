'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard, Building2, Download, Upload, Send, List,
  User, Menu, X, LogOut, ChevronRight, ShieldCheck, Wallet, TrendingUp,
} from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '@/store/auth'
import { fmtUSD, api } from '@/lib/api'
import { NotificationPopup } from '@/components/shared/NotificationPopup'
import { ChatWidget } from '@/components/shared/ChatWidget'

const NAV = [
  { href: '/dashboard', label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/account',   label: 'My Account',  icon: Building2 },
  { href: '/wealth',    label: 'Wealth',       icon: TrendingUp },
  { href: '/deposit',   label: 'Deposit',      icon: Download },
  { href: '/withdraw',  label: 'Withdraw',     icon: Upload },
  { href: '/transfer',  label: 'Transfer',     icon: Send },
  { href: '/history',   label: 'Transactions', icon: List },
  { href: '/profile',   label: 'Profile',      icon: User },
]

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':           'Dashboard',
  '/account':             'Checking Account',
  '/wealth':              'Wealth Overview',
  '/wealth/crypto':       'Crypto Assets',
  '/wealth/treasury':     'Treasury & Assets',
  '/wealth/investments':  'Investments',
  '/wealth/trust':        'Trust Fund',
  '/deposit':             'Deposit Funds',
  '/withdraw':            'Withdraw Funds',
  '/transfer':            'Send Money',
  '/history':             'Transaction History',
  '/profile':             'My Profile',
  '/receipts':            'Receipt',
  '/admin':               'Admin Panel',
  '/admin/users':         'User Management',
  '/admin/transactions':  'Transactions',
  '/admin/settings':      'App Settings',
  '/admin/notifications': 'Notifications',
  '/admin/accounts':      'Account Editor',
  '/admin/controls':      'Controls',
  '/admin/chat':          'Live Chat',
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const [open,   setOpen]   = useState(false)
  const [unread, setUnread] = useState(0)

  const isAdmin = pathname.startsWith('/admin')
  const title = Object.entries(PAGE_TITLES)
    .sort((a, b) => b[0].length - a[0].length)
    .find(([k]) => pathname.startsWith(k))?.[1] ?? 'NexaBank'

  useEffect(() => {
    api.user.notifications().then(d => setUnread(d.unreadCount)).catch(() => {})
  }, [pathname])

  // Prevent body scroll when mobile sidebar open
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else      document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!user) return null

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--color-bg)' }}>
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setOpen(false)} />
      )}

      {/* ── Sidebar ──────────────────────────────────────────────────── */}
      <aside className={clsx(
        'fixed top-0 left-0 h-full w-64 z-50 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto',
        open ? 'translate-x-0' : '-translate-x-full'
      )} style={{ background: '#0F1C35' }}>

        {/* Logo */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-white font-display font-bold text-xl">
              <span style={{ color: '#10B981' }}>N</span>exaBank
            </h1>
            <p className="text-white/40 text-xs mt-0.5">Personal Banking</p>
          </div>
          <button className="lg:hidden text-white/60 hover:text-white p-1.5 rounded-lg"
            onClick={() => setOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {/* Balance pill */}
        <div className="mx-4 mt-4 rounded-xl p-4"
          style={{ background: 'rgba(16,185,129,.1)', border: '1px solid rgba(16,185,129,.2)' }}>
          <p className="text-xs text-white/50 mb-0.5">Available Balance</p>
          <p className="font-mono font-bold text-xl text-white">{fmtUSD(user.balance)}</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 mt-2 space-y-0.5">
          <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest px-3 py-2">Menu</p>
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = href === '/dashboard' ? pathname === href : pathname.startsWith(href)
            return (
              <Link key={href} href={href} onClick={() => setOpen(false)}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                  active ? 'text-white' : 'text-white/55 hover:text-white hover:bg-white/8'
                )}
                style={active ? { background: '#10B981' } : {}}>
                <Icon size={16} className="flex-shrink-0" />
                <span className="truncate">{label}</span>
                {active && <ChevronRight size={13} className="ml-auto opacity-70 flex-shrink-0" />}
              </Link>
            )
          })}

          {user.role === 'admin' && (
            <>
              <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest px-3 pt-5 pb-2">Admin</p>
              <Link href="/admin" onClick={() => setOpen(false)}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                  isAdmin ? 'text-white' : 'text-white/55 hover:text-white hover:bg-white/8'
                )}
                style={isAdmin ? { background: '#F59E0B' } : {}}>
                <ShieldCheck size={16} className="flex-shrink-0" />
                <span>Admin Panel</span>
              </Link>
            </>
          )}
        </nav>

        {/* User footer */}
        <div className="p-4 border-t border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            {(user as any).profilePicture ? (
              <img src={(user as any).profilePicture} alt={user.firstName}
                className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ background: '#10B981' }}>
                {user.firstName[0]}{user.lastName[0]}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate">{user.firstName} {user.lastName}</p>
              <p className="text-white/40 text-xs truncate">{user.email}</p>
            </div>
            <button onClick={logout} className="text-white/40 hover:text-red-400 transition-colors flex-shrink-0 p-1">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main area ────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0 overflow-x-hidden">

        {/* Top header */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 h-14 sm:h-16 border-b flex-shrink-0"
          style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>

          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button className="lg:hidden p-2 rounded-lg flex-shrink-0"
              style={{ background: 'var(--color-bg)' }}
              onClick={() => setOpen(true)}>
              <Menu size={18} />
            </button>
            <h2 className="font-bold text-base sm:text-lg font-display truncate">{title}</h2>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
            {/* Balance — hidden on xs */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl"
              style={{ background: 'var(--color-bg)' }}>
              <Wallet size={14} style={{ color: '#10B981' }} />
              <span className="font-mono font-bold text-sm" style={{ color: '#10B981' }}>
                {fmtUSD(user.balance)}
              </span>
            </div>

            {/* Notification popup */}
            <NotificationPopup unread={unread} onUnreadChange={setUnread} />

            {/* Avatar -> profile */}
            <Link href="/profile">
              {(user as any).profilePicture ? (
                <img src={(user as any).profilePicture} alt={user.firstName}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity" />
              ) : (
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                  style={{ background: '#0F1C35' }}>
                  {user.firstName[0]}{user.lastName[0]}
                </div>
              )}
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto overflow-x-hidden">
          {children}
        </main>
        {/* Chat widget — only for non-admin users */}
        {user.role !== 'admin' && <ChatWidget />}
      </div>
    </div>
  )
}
