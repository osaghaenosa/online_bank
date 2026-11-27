'use client'
import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/store/auth'
import { AppShell } from '@/components/layout/AppShell'
import { BrandLogo } from '@/components/shared/BrandLogo'
import { LayoutDashboard, Users, List, Settings, Bell, FileEdit, ShieldAlert, MessageCircle, Download, Mail, ArrowUpRight, Key, ShieldCheck } from 'lucide-react'
import clsx from 'clsx'

const ADMIN_NAV = [
  { href: '/admin',                  label: 'Overview',      icon: LayoutDashboard, exact: true },
  { href: '/admin/users',            label: 'Clients',       icon: Users },
  { href: '/admin/kyc',              label: 'KYC Review',    icon: ShieldCheck },
  { href: '/admin/accounts',         label: 'Ledgers',       icon: FileEdit },
  { href: '/admin/controls',         label: 'Controls',      icon: ShieldAlert },
  { href: '/admin/chat',             label: 'Support Chat',  icon: MessageCircle },
  { href: '/admin/deposit-settings', label: 'Deposit Rails', icon: Download },
  { href: '/admin/email',            label: 'Email Desk',    icon: Mail },
  { href: '/admin/transactions',     label: 'Transactions',  icon: List },
  { href: '/admin/transfers',        label: 'Transfers',     icon: ArrowUpRight },
  { href: '/admin/api-keys',         label: 'API Keys',      icon: Key },
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
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#F4F7FC' }}>
      <div className="bg-white rounded-3xl p-8 shadow-float border border-slate-200/80 text-center max-w-xs w-full">
        <div className="flex justify-center mb-5">
          <BrandLogo variant="dark" size="md" />
        </div>
        <div className="w-9 h-9 border-[3px] border-[#EBF2FF] border-t-[#0052CC] rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-medium text-slate-500">Loading Admin Command…</p>
      </div>
    </div>
  )

  return (
    <AppShell>
      <div className="max-w-7xl w-full space-y-5">
        <div className="p-3.5 rounded-2xl bg-[#EBF2FF] border border-blue-200/70 flex items-center gap-3 flex-wrap">
          <div className="w-8 h-8 rounded-xl bg-[#0052CC] text-white flex items-center justify-center flex-shrink-0">
            <Settings size={15} />
          </div>
          <p className="text-xs font-semibold text-[#002B5B]">
            Administrative Command Center — changes apply across all client ledgers in real time.
          </p>
        </div>

        {/* Scrollable pill tab bar */}
        <div className="flex gap-1.5 p-1.5 overflow-x-auto scrollbar-none rounded-2xl bg-white border border-slate-200/80 shadow-card">
          {ADMIN_NAV.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  'flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0',
                  active ? 'text-white shadow-sm' : 'text-[#002B5B] hover:bg-[#F4F7FC]'
                )}
                style={active ? { background: '#0052CC' } : undefined}
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
