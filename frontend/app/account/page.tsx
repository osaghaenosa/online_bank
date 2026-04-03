'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/store/auth'
import { api, fmtUSD, maskCard } from '@/lib/api'
import { Card, StatCard, SectionHeader, Button, Badge, StatusBadge, Divider } from '@/components/ui'
import { Eye, EyeOff, CheckCircle, TrendingUp, TrendingDown, Shield, Zap, Gift, Building, Smartphone, Lock } from 'lucide-react'

const FEATURES = [
  { icon: Zap,        label: 'Instant Transfers',    desc: 'Send money in seconds' },
  { icon: Shield,     label: 'Fraud Protection',     desc: '24/7 monitoring' },
  { icon: Gift,       label: 'Cashback Rewards',     desc: 'Up to 2% on purchases' },
  { icon: Building,   label: 'Free ATM Network',     desc: '50,000+ ATMs nationwide' },
  { icon: Smartphone, label: 'Mobile Banking',       desc: 'iOS & Android app' },
  { icon: Lock,       label: '2FA Security',         desc: 'Extra account protection' },
]

export default function AccountPage() {
  const { user } = useAuth()
  const [reveal, setReveal] = useState(false)
  const [stats, setStats] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.tx.list({ limit: '100' }).then(d => setStats(d.stats)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const totalIn  = stats?.credit?.total || 0
  const totalOut = stats?.debit?.total  || 0
  const txCount  = (stats?.credit?.count || 0) + (stats?.debit?.count || 0)

  if (!user) return null

  const DETAILS = [
    { label: 'Account Type',         value: 'Standard Business Account' },
    { label: 'Account Status',        value: <StatusBadge status={user.status} /> },
    { label: 'Account Number',        value: <span className="font-mono">{reveal ? user.accountNumber : '•••• •••• ' + String(user.accountNumber || '').slice(-4)}</span> },
    { label: 'Routing Number',        value: <span className="font-mono">{user.routingNumber || '021000021'}</span> },
    { label: 'Card Number',           value: <span className="font-mono">{reveal ? user.cardNumber : maskCard(user.cardNumber || '0000000000000000')}</span> },
    { label: 'Card Expiry',           value: <span className="font-mono">{user.cardExpiry}</span> },
    { label: 'KYC Status',            value: <StatusBadge status={user.kyc} /> },
    { label: 'Overdraft Protection',  value: <Badge variant="green">Enabled</Badge> },
    { label: 'Daily Transfer Limit',  value: fmtUSD(10000) },
    { label: 'Daily ATM Limit',       value: fmtUSD(1500) },
    { label: 'FDIC Insured',          value: <Badge variant="blue">Up to $250,000</Badge> },
    { label: 'Account Holder',        value: `${user.firstName} ${user.lastName}` },
    { label: 'Email',                 value: user.email },
    { label: 'Phone',                 value: user.phone || 'Not set' },
  ]

  return (
    <div className="max-w-5xl space-y-6 fade-up">
      {/* Summary stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Available Balance" value={fmtUSD(user.balance)} sub="Business Account"
          iconBg="bg-emerald-100" icon={<TrendingUp size={16} className="text-emerald-600" />} />
        <StatCard label="Total Deposited" value={fmtUSD(totalIn)} sub="All time completed"
          iconBg="bg-blue-100" icon={<TrendingUp size={16} className="text-blue-600" />} />
        <StatCard label="Total Withdrawn" value={fmtUSD(totalOut)} sub="All time completed"
          iconBg="bg-red-100" icon={<TrendingDown size={16} className="text-red-500" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Account details */}
        <Card className="p-6">
          <SectionHeader title="Account Details" action={
            <Button variant="secondary" size="sm" onClick={() => setReveal(!reveal)}>
              {reveal ? <EyeOff size={13} /> : <Eye size={13} />}
              {reveal ? 'Hide' : 'Reveal'}
            </Button>
          } />
          <div className="space-y-0">
            {DETAILS.map(({ label, value }, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b last:border-0"
                style={{ borderColor: 'var(--color-border)', background: i % 2 !== 0 ? 'var(--color-bg)' : 'transparent', margin: i % 2 !== 0 ? '0 -24px' : '', padding: '12px 24px' }}>
                <span className="text-xs font-semibold" style={{ color: 'var(--color-muted)' }}>{label}</span>
                <span className="text-sm font-semibold">{value}</span>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-5">
          {/* Features */}
          <Card className="p-6">
            <SectionHeader title="Account Features" />
            {FEATURES.map(({ icon: Icon, label, desc }, i) => (
              <div key={i} className="flex items-center gap-4 py-3 border-b last:border-0"
                style={{ borderColor: 'var(--color-border)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--color-bg)' }}>
                  <Icon size={17} style={{ color: '#10B981' }} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{label}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>{desc}</p>
                </div>
                <CheckCircle size={15} style={{ color: '#10B981' }} />
              </div>
            ))}
          </Card>

          {/* Monthly summary */}
          <Card className="p-6">
            <SectionHeader title="Account Summary" />
            <div className="space-y-3">
              <div className="flex justify-between"><span className="text-sm" style={{ color: 'var(--color-muted)' }}>Total Credits</span><span className="font-mono text-sm font-bold text-emerald-600">{fmtUSD(totalIn)}</span></div>
              <div className="flex justify-between"><span className="text-sm" style={{ color: 'var(--color-muted)' }}>Total Debits</span><span className="font-mono text-sm font-bold text-red-500">{fmtUSD(totalOut)}</span></div>
              <div className="flex justify-between"><span className="text-sm" style={{ color: 'var(--color-muted)' }}>Total Transactions</span><span className="font-mono text-sm font-bold">{txCount}</span></div>
              <Divider />
              <div className="flex justify-between">
                <span className="text-sm font-semibold">Net Change</span>
                <span className={`font-mono text-sm font-bold ${totalIn - totalOut >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{fmtUSD(totalIn - totalOut)}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
