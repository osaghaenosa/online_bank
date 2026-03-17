'use client'
import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/store/auth'
import { AppShell } from '@/components/layout/AppShell'
import { LayoutDashboard, Users, List, Settings, Bell, FileEdit } from 'lucide-react'
import clsx from 'clsx'

const ADMIN_NAV = [
  { href: '/admin',                 label: 'Dashboard',    icon: LayoutDashboard, exact: true },
  { href: '/admin/users',           label: 'Users',        icon: Users },
  { href: '/admin/accounts',        label: 'Accounts',     icon: FileEdit },
  { href: '/admin/transactions',    label: 'Transactions', icon: List },
  { href: '/admin/settings',        label: 'Customization',icon: Settings },
  { href: '/admin/notifications',   label: 'Notifications',icon: Bell },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router   = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading && !user)                  router.replace('/auth/login')
    if (!loading && user && user.role !== 'admin') router.replace('/dashboard')
  }, [user, loading, router])

  if (loading || !user) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#080E1C' }}>
      <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
    </div>
  )

  return (
    <AppShell>
      <div className="max-w-7xl">
        <div className="mb-5 p-3 rounded-xl flex items-center gap-3"
          style={{ background: '#FEF3C7', border: '1px solid #FCD34D' }}>
          <Settings size={15} className="text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-700 font-medium">
            Admin Panel — changes affect all users in real time.
          </p>
        </div>
        {/* Sub-nav */}
        <div className="flex gap-1 p-1.5 rounded-2xl mb-6 overflow-x-auto"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          {ADMIN_NAV.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href)
            return (
              <Link key={href} href={href}
                className={clsx('flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all',
                  active ? 'text-white' : 'hover:opacity-70')}
                style={active ? { background: '#0F1C35' } : { color: 'var(--color-muted)' }}>
                <Icon size={14} />
                {label}
              </Link>
            )
          })}
        </div>
        {children}
      </div>
    </AppShell>
  )
}
