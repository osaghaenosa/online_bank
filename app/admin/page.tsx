'use client'
import { useStore } from '@/store'
import { Card, StatCard, SectionHeader, Button } from '@/components/ui'
import { TxRow } from '@/components/shared/TxRow'
import { fmtUSD } from '@/lib/utils'
import { Users, Wallet, Download, AlertCircle, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function AdminDashboardPage() {
  const { state } = useStore()
  const { users, transactions, theme } = state

  const totalBal = users.reduce((s, u) => s + u.balance, 0)
  const totalDep = transactions.filter(t => t.type === 'credit' && t.status === 'completed').reduce((s, t) => s + t.amount, 0)
  const totalWith = transactions.filter(t => t.type === 'debit' && t.status === 'completed').reduce((s, t) => s + t.amount, 0)
  const pending = transactions.filter(t => t.status === 'pending')

  const quickLinks = [
    { href: '/admin/users', label: 'User Management', desc: 'View & manage accounts', icon: Users },
    { href: '/admin/transactions', label: 'Transactions', desc: 'Approve, reject, manage', icon: Download },
    { href: '/admin/settings', label: 'App Customization', desc: 'Theme, colors & branding', icon: AlertCircle },
    { href: '/admin/notifications', label: 'Notifications', desc: 'Send alerts to users', icon: AlertCircle },
  ]

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={String(users.length)} sub="Registered" iconBg="bg-blue-100" icon={<Users size={16} className="text-blue-600" />} />
        <StatCard label="System Balance" value={fmtUSD(totalBal)} sub="All accounts" iconBg="bg-emerald-100" icon={<Wallet size={16} className="text-emerald-600" />} />
        <StatCard label="Total Deposits" value={fmtUSD(totalDep)} sub="Completed" iconBg="bg-violet-100" icon={<Download size={16} className="text-violet-600" />} />
        <StatCard label="Pending" value={String(pending.length)} sub="Awaiting review" iconBg="bg-amber-100" icon={<AlertCircle size={16} className="text-amber-600" />} />
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quickLinks.map(l => (
          <Link key={l.href} href={l.href}>
            <Card className="p-5 flex items-center gap-4 cursor-pointer hover:shadow-sm transition-shadow">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--color-bg)' }}>
                <l.icon size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold truncate">{l.label}</p>
                <p className="text-xs truncate" style={{ color: 'var(--color-muted)' }}>{l.desc}</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* All recent transactions */}
      <Card className="p-6">
        <SectionHeader
          title="Recent Transactions (All Users)"
          action={
            <Link href="/admin/transactions">
              <Button variant="secondary" size="sm">View All <ArrowRight size={14} /></Button>
            </Link>
          }
        />
        {transactions.slice(0, 10).map(tx => {
          const u = users.find(u => u.id === tx.userId)
          return <TxRow key={tx.id} tx={tx} showUser={u?.name} />
        })}
      </Card>
    </div>
  )
}
