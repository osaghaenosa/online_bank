'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard, Building2, Download, Upload, Send, List,
  User, Settings, Bell, Menu, X, ChevronRight
} from 'lucide-react'
import { useStore } from '@/store'
import { fmtUSD } from '@/lib/utils'
import clsx from 'clsx'

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/account', label: 'My Account', icon: Building2 },
  { href: '/deposit', label: 'Deposit', icon: Download },
  { href: '/withdraw', label: 'Withdraw', icon: Upload },
  { href: '/transfer', label: 'Transfer', icon: Send },
  { href: '/history', label: 'Transactions', icon: List },
  { href: '/profile', label: 'Profile', icon: User },
]

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/account': 'Checking Account',
  '/deposit': 'Deposit Funds',
  '/withdraw': 'Withdraw Funds',
  '/transfer': 'Send Money',
  '/history': 'Transaction History',
  '/profile': 'My Profile',
  '/admin': 'Admin Panel',
  '/admin/users': 'User Management',
  '/admin/transactions': 'Transaction Management',
  '/admin/settings': 'App Customization',
  '/admin/notifications': 'Notifications',
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { state, me, dispatch } = useStore()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { theme } = state
  const unread = state.notifications.filter(n => !n.read).length

  const isAdmin = pathname.startsWith('/admin')
  const title = PAGE_TITLES[pathname] ?? 'NexaBank'

  if (pathname === '/') return <>{children}</>

  return (
    <div className="flex min-h-screen">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed top-0 left-0 h-full w-64 z-50 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{ background: theme.primaryColor }}
      >
        {/* Logo */}
        <div className="px-6 py-7 border-b border-white/10 flex items-center justify-between">
          <div>
            {theme.logo && (
              <img src={theme.logo} alt="logo" className="h-8 object-contain mb-1" />
            )}
            <h1 className="text-white font-bold text-xl tracking-tight">
              <span style={{ color: theme.accentColor }}>{theme.appName[0]}</span>
              {theme.appName.slice(1)}
            </h1>
            <p className="text-white/40 text-xs mt-0.5">Personal Banking</p>
          </div>
          <button
            className="lg:hidden text-white/60"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest px-3 py-3">
            Main
          </p>
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                  active
                    ? 'text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/8'
                )}
                style={active ? { background: theme.accentColor } : {}}
              >
                <Icon size={16} />
                {label}
              </Link>
            )
          })}

          <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest px-3 pt-5 pb-2">
            Admin
          </p>
          <Link
            href="/admin"
            onClick={() => setSidebarOpen(false)}
            className={clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
              isAdmin ? 'text-white' : 'text-white/60 hover:text-white hover:bg-white/8'
            )}
            style={isAdmin ? { background: theme.accentColor } : {}}
          >
            <Settings size={16} />
            Admin Panel
          </Link>
        </nav>

        {/* User pill */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
              style={{ background: theme.accentColor }}
            >
              {me?.name[0]}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-semibold truncate">
                {me?.name.split(' ')[0]}
              </p>
              <p className="text-white/40 text-xs">Checking Account</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Topbar */}
        <header
          className="sticky top-0 z-30 flex items-center justify-between px-6 h-16 border-b"
          style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        >
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 rounded-lg"
              style={{ background: 'var(--color-bg)' }}
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={18} />
            </button>
            <h2 className="font-bold text-lg">{title}</h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Balance pill */}
            <div
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold"
              style={{ background: 'var(--color-bg)', color: 'var(--color-muted)' }}
            >
              <span className="text-xs">Balance:</span>
              <span className="font-mono font-bold" style={{ color: theme.accentColor }}>
                {fmtUSD(me?.balance ?? 0)}
              </span>
            </div>

            {/* Bell */}
            <Link
              href="/profile"
              className="relative w-9 h-9 flex items-center justify-center rounded-xl border"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)' }}
              onClick={() => dispatch({ type: 'MARK_NOTIFS_READ' })}
            >
              <Bell size={16} />
              {unread > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
              )}
            </Link>

            {/* Avatar */}
            <Link href="/profile">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
                style={{ background: theme.primaryColor }}
              >
                {me?.name[0]}
              </div>
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
