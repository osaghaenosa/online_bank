'use client'
import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/store/auth'
import { AppShell } from '@/components/layout/AppShell'
import { LayoutDashboard, Users, List, Settings, Bell, FileEdit, ShieldAlert, MessageCircle, Download, Mail, ArrowUpRight } from 'lucide-react'
import clsx from 'clsx'

const ADMIN_NAV = [
  { href: '/admin',                  label: 'Overview',      icon: LayoutDashboard, exact: true },
  { href: '/admin/users',            label: 'Clients',       icon: Users },
  { href: '/admin/accounts',         label: 'Ledgers',       icon: FileEdit },
  { href: '/admin/controls',         label: 'Controls',      icon: ShieldAlert },
  { href: '/admin/chat',             label: 'Support Chat',  icon: MessageCircle },
  { href: '/admin/deposit-settings', label: 'Deposit Rails', icon: Download },
  { href: '/admin/email',            label: 'Email Desk',    icon: Mail },
  { href: '/admin/transactions',     label: 'Transactions',  icon: List },
  { href: '/admin/transfers',        label: 'Transfers',     icon: ArrowUpRight },
  { href: '/admin/settings',         label: 'Configuration', icon: Settings },
  { href: '/admin/notifications',    label: 'Broadcasts',    icon: Bell },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router   = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading && !user)                         router.replace('/auth/login')
    if (!loading && user && user.role !== 'admin') router.replace('/dashboard')
  }, [user, loading, router])

  if (loading || !user) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#002B5B' }}>
      <div className="w-8 h-8 border-2 border-white/30 border-t-white animate-spin" />
    </div>
  )

  return (
    <AppShell>
      <div className="max-w-7xl w-full">
        <div
          className="mb-4 p-3 border-l-4 flex items-center gap-3 flex-wrap"
          style={{ background: '#EBF2FF', borderColor: '#0052CC' }}
        >
          <Settings size={15} style={{ color: '#0052CC' }} className="flex-shrink-0" />
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#002B5B' }}>
            Administrative Command Center — changes apply across all client ledgers in real time.
          </p>
        </div>

        {/* Scrollable tab bar */}
        <div
          className="flex gap-1 p-1.5 mb-6 overflow-x-auto scrollbar-none border"
          style={{ background: '#FFFFFF', borderColor: '#CBD5E1', borderTop: '3px solid #002B5B' }}
        >
          {ADMIN_NAV.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-2 text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all flex-shrink-0',
                  active ? 'text-white' : 'hover:bg-blue-50'
                )}
                style={active ? { background: '#0052CC', color: '#FFFFFF' } : { color: '#002B5B' }}
              >
                <Icon size={13} />
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
