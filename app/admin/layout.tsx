'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'
import { Users, List, Settings, Bell, LayoutDashboard } from 'lucide-react'
import { useStore } from '@/store'
import clsx from 'clsx'

const ADMIN_NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/transactions', label: 'Transactions', icon: List },
  { href: '/admin/settings', label: 'Customization', icon: Settings },
  { href: '/admin/notifications', label: 'Notifications', icon: Bell },
]

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { state } = useStore()

  return (
    <div className="max-w-7xl">
      <div className="mb-5 p-3 rounded-xl flex items-center gap-3" style={{ background: '#FEF3C7', border: '1px solid #FCD34D' }}>
        <Settings size={16} className="text-amber-600 flex-shrink-0" />
        <p className="text-sm text-amber-700 font-medium">You are in the Admin Panel — changes affect all users in real time.</p>
      </div>

      {/* Admin sub-nav */}
      <div
        className="flex gap-1 p-1.5 rounded-2xl mb-6 overflow-x-auto"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        {ADMIN_NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all',
                active ? 'text-white' : 'hover:opacity-70'
              )}
              style={active ? { background: state.theme.primaryColor } : { color: 'var(--color-muted)' }}
            >
              <Icon size={15} />
              {label}
            </Link>
          )
        })}
      </div>

      {children}
    </div>
  )
}
