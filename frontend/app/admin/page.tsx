'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api, fmtUSD } from '@/lib/api'
import { Card, StatCard, SectionHeader, Button } from '@/components/ui'
import { TxRow } from '@/components/shared/TxRow'
import { Users, Wallet, AlertCircle, TrendingUp, ArrowRight } from 'lucide-react'

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.admin.dashboard().then(setData).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{Array.from({length:4}).map((_,i) => <div key={i} className="shimmer h-28 rounded-2xl" />)}</div>
      <div className="shimmer h-64 rounded-2xl" />
    </div>
  )

  const { stats, recentTransactions, recentUsers } = data || {}

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users"    value={String(stats?.totalUsers || 0)}    sub="Registered"       iconBg="bg-blue-100"   icon={<Users size={16} className="text-blue-600" />} />
        <StatCard label="System Balance" value={fmtUSD(stats?.systemBalance || 0)} sub="All accounts"     iconBg="bg-emerald-100" icon={<Wallet size={16} className="text-emerald-600" />} />
        <StatCard label="Total Deposits" value={fmtUSD(stats?.txVolume?.credit?.total || 0)} sub="Completed" iconBg="bg-violet-100" icon={<TrendingUp size={16} className="text-violet-600" />} />
        <StatCard label="Pending"        value={String(stats?.pendingTxs || 0)}    sub="Awaiting review"  iconBg="bg-amber-100"  icon={<AlertCircle size={16} className="text-amber-600" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <Card className="p-6">
            <SectionHeader title="Recent Transactions (All Users)" action={
              <Link href="/admin/transactions">
                <Button variant="secondary" size="sm">View All <ArrowRight size={14} /></Button>
              </Link>
            } />
            {(recentTransactions || []).slice(0, 8).map((tx: any) => (
              <TxRow key={tx._id} tx={tx} showUser={tx.userId ? `${tx.userId.firstName} ${tx.userId.lastName}` : undefined} compact />
            ))}
          </Card>
        </div>
        <div>
          <Card className="p-6">
            <SectionHeader title="Recent Users" action={
              <Link href="/admin/users">
                <Button variant="secondary" size="sm">All <ArrowRight size={14} /></Button>
              </Link>
            } />
            {(recentUsers || []).map((u: any) => (
              <div key={u._id} className="flex items-center gap-3 py-3 border-b last:border-0" style={{ borderColor: 'var(--color-border)' }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ background: '#0F1C35' }}>
                  {u.firstName[0]}{u.lastName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{u.firstName} {u.lastName}</p>
                  <p className="text-xs truncate" style={{ color: 'var(--color-muted)' }}>{u.email}</p>
                </div>
                <span className="text-xs font-mono font-bold">{fmtUSD(u.balance)}</span>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  )
}
