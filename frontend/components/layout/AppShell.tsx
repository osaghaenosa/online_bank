'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard, Building2, Download, Upload, Send, List,
  User, Settings, Bell, Menu, X, LogOut, ChevronRight,
  ShieldCheck, Wallet, TrendingUp,
} from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '@/store/auth'
import { fmtUSD, api } from '@/lib/api'

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
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(0)

  const isAdmin = pathname.startsWith('/admin')
  const title = Object.entries(PAGE_TITLES).find(([k]) => pathname.startsWith(k))?.[1] ?? 'NexaBank'

  useEffect(() => {
    api.user.notifications().then(d => setUnread(d.unreadCount)).catch(() => {})
  }, [pathname])

  if (!user) return null

  return (
    <div className="flex min-h-screen">
      {open && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setOpen(false)} />}
      <aside className={clsx(
        'fixed top-0 left-0 h-full w-64 z-50 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto',
        open ? 'translate-x-0' : '-translate-x-full'
      )} style={{ background: '#0F1C35' }}>
        <div className="px-6 py-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <h1 className="text-white font-display font-bold text-xl">
              <span style={{ color: '#10B981' }}>N</span>exaBank
            </h1>
            <p className="text-white/40 text-xs mt-0.5">Personal Banking</p>
          </div>
          <button className="lg:hidden text-white/60" onClick={() => setOpen(false)}><X size={18} /></button>
        </div>
        <div className="mx-4 mt-4 rounded-xl p-4" style={{ background: 'rgba(16,185,129,.1)', border: '1px solid rgba(16,185,129,.2)' }}>
          <p className="text-xs text-white/50 mb-0.5">Available Balance</p>
          <p className="font-mono font-bold text-xl text-white">{fmtUSD(user.balance)}</p>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 mt-2 space-y-0.5">
          <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest px-3 py-2">Menu</p>
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = href === '/dashboard' ? pathname === href : pathname.startsWith(href)
            return (
              <Link key={href} href={href} onClick={() => setOpen(false)}
                className={clsx('flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                  active ? 'text-white' : 'text-white/55 hover:text-white hover:bg-white/8')}
                style={active ? { background: '#10B981' } : {}}>
                <Icon size={16} />
                {label}
                {active && <ChevronRight size={13} className="ml-auto opacity-70" />}
              </Link>
            )
          })}
          {user.role === 'admin' && (
            <>
              <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest px-3 pt-5 pb-2">Admin</p>
              <Link href="/admin" onClick={() => setOpen(false)}
                className={clsx('flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                  isAdmin ? 'text-white' : 'text-white/55 hover:text-white hover:bg-white/8')}
                style={isAdmin ? { background: '#F59E0B' } : {}}>
                <ShieldCheck size={16} />Admin Panel
              </Link>
            </>
          )}
        </nav>
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
              style={{ background: '#10B981' }}>
              {user.firstName[0]}{user.lastName[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate">{user.firstName} {user.lastName}</p>
              <p className="text-white/40 text-xs truncate">{user.email}</p>
            </div>
            <button onClick={logout} className="text-white/40 hover:text-red-400 transition-colors"><LogOut size={16} /></button>
          </div>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        <header className="sticky top-0 z-30 flex items-center justify-between px-6 h-16 border-b"
          style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-2 rounded-lg" style={{ background: 'var(--color-bg)' }} onClick={() => setOpen(true)}><Menu size={18} /></button>
            <h2 className="font-bold text-lg font-display">{title}</h2>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{ background: 'var(--color-bg)' }}>
              <Wallet size={14} style={{ color: '#10B981' }} />
              <span className="font-mono font-bold text-sm" style={{ color: '#10B981' }}>{fmtUSD(user.balance)}</span>
            </div>
            <Link href="/profile" className="relative w-9 h-9 flex items-center justify-center rounded-xl border"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)' }}
              onClick={() => { api.user.markAllRead(); setUnread(0) }}>
              <Bell size={16} />
              {unread > 0 && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />}
            </Link>
            <Link href="/profile">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: '#0F1C35' }}>
                {user.firstName[0]}{user.lastName[0]}
              </div>
            </Link>
          </div>
        </header>
        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  )
}
