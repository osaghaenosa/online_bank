'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/store/auth'
import { api, fmtUSD, maskCard } from '@/lib/api'
import { Card, StatCard, SectionHeader, Button, Badge, StatusBadge, Divider } from '@/components/ui'
import { Eye, EyeOff, CheckCircle, TrendingUp, TrendingDown, Shield, Zap, Gift, Building, Smartphone, Lock } from 'lucide-react'

const FEATURES = [
  { icon: Zap,        label: 'Instant Transfers',     desc: 'Immediate clearing on internal & ACH rails' },
  { icon: Shield,     label: 'Fraud Protection',      desc: '24/7 automated ledger surveillance' },
  { icon: Gift,       label: 'Institutional Rebates', desc: 'Up to 2% rebate on commercial spend' },
  { icon: Building,   label: 'Global ATM Network',    desc: '50,000+ fee-free ATMs worldwide' },
  { icon: Smartphone, label: 'Portal Access',         desc: 'Desktop & mobile responsive terminal' },
  { icon: Lock,       label: '2FA & PIN Security',    desc: 'Cryptographic transaction authorization' },
]

export default function AccountPage() {
  const { user } = useAuth()
  const [reveal, setReveal] = useState(false)
  const [stats, setStats] = useState<any>({})
  const [, setLoading] = useState(true)

  useEffect(() => {
    api.tx.list({ limit: '100' }).then(d => setStats(d.stats)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const totalIn  = stats?.credit?.total || 0
  const totalOut = stats?.debit?.total  || 0
  const txCount  = (stats?.credit?.count || 0) + (stats?.debit?.count || 0)

  if (!user) return null

  const DETAILS = [
    { label: 'Account Classification', value: 'Executive Checking & Business Ledger' },
    { label: 'Account Status',         value: <StatusBadge status={user.status} /> },
    { label: 'Account Number',         value: <span className="font-mono font-bold">{reveal ? user.accountNumber : '•••• •••• ' + String(user.accountNumber || '').slice(-4)}</span> },
    { label: 'ABA Routing Number',     value: <span className="font-mono font-bold">{user.routingNumber || '021000021'}</span> },
    { label: 'Linked Card Number',     value: <span className="font-mono font-bold">{reveal ? user.cardNumber : maskCard(user.cardNumber || '0000000000000000')}</span> },
    { label: 'Card Expiration',        value: <span className="font-mono font-bold">{user.cardExpiry}</span> },
    { label: 'KYC Compliance',         value: <StatusBadge status={user.kyc} /> },
    { label: 'Overdraft Protection',   value: <Badge variant="blue">Active</Badge> },
    { label: 'Withdrawal Limit',       value: <span className="font-mono font-bold">{fmtUSD(user?.withdrawalLimit || 10000)}</span> },
    { label: 'Daily ATM Limit',        value: <span className="font-mono font-bold">{fmtUSD(1500)}</span> },
    { label: 'FDIC Insurance',         value: <Badge variant="blue">Up to $250,000</Badge> },
    { label: 'Legal Account Holder',   value: `${user.firstName} ${user.lastName}` },
    { label: 'Registered Email',       value: <span className="break-all sm:break-normal">{user.email}</span> },
    { label: 'Telephone',              value: user.phone || 'Not set' },
  ]

  return (
    <div className="max-w-5xl space-y-5 fade-up">
      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
        <StatCard
          label="Available Balance"
          value={fmtUSD(user.balance)}
          sub="Checking Ledger"
          iconBg="bg-blue-50"
          icon={<TrendingUp size={15} style={{ color: '#0052CC' }} />}
        />
        <StatCard
          label="Total Deposited"
          value={fmtUSD(totalIn)}
          sub="All time cleared"
          iconBg="bg-blue-50"
          icon={<TrendingUp size={15} style={{ color: '#002B5B' }} />}
        />
        <StatCard
          label="Total Withdrawn"
          value={fmtUSD(totalOut)}
          sub="All time cleared"
          iconBg="bg-slate-100"
          icon={<TrendingDown size={15} style={{ color: '#002B5B' }} />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Account details */}
        <Card className="p-4 sm:p-6">
          <SectionHeader
            title="Account Specifications"
            action={
              <Button variant="secondary" size="xs" onClick={() => setReveal(!reveal)}>
                {reveal ? <EyeOff size={13} /> : <Eye size={13} />}
                <span>{reveal ? 'Hide' : 'Reveal'}</span>
              </Button>
            }
          />
          <div className="divide-y border" style={{ borderColor: 'var(--color-border)' }}>
            {DETAILS.map(({ label, value }, i) => (
              <div
                key={i}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 px-3.5 py-2.5 sm:py-3"
                style={{
                  background: i % 2 !== 0 ? '#F8FAFC' : '#FFFFFF',
                  borderColor: 'var(--color-border)',
                }}
              >
                <span className="text-[11px] font-semibold uppercase tracking-wider flex-shrink-0" style={{ color: 'var(--color-muted)' }}>
                  {label}
                </span>
                <div className="text-xs sm:text-sm font-semibold sm:text-right min-w-0" style={{ color: '#002B5B' }}>
                  {value}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-5">
          {/* Features */}
          <Card className="p-4 sm:p-6">
            <SectionHeader title="Included Account Protections" />
            <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
              {FEATURES.map(({ icon: Icon, label, desc }, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3.5 py-3 first:pt-0 last:pb-0"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  <div
                    className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center flex-shrink-0"
                    style={{ background: '#002B5B', color: '#FFFFFF' }}
                  >
                    <Icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-bold truncate" style={{ color: '#002B5B' }}>{label}</p>
                    <p className="text-xs mt-0.5 leading-snug" style={{ color: 'var(--color-muted)' }}>{desc}</p>
                  </div>
                  <CheckCircle size={15} className="flex-shrink-0" style={{ color: '#0052CC' }} />
                </div>
              ))}
            </div>
          </Card>

          {/* Monthly summary */}
          <Card className="p-4 sm:p-6">
            <SectionHeader title="Ledger Flow Summary" />
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>Total Credits</span>
                <span className="font-mono text-sm font-bold whitespace-nowrap" style={{ color: '#0052CC' }}>{fmtUSD(totalIn)}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>Total Debits</span>
                <span className="font-mono text-sm font-bold whitespace-nowrap" style={{ color: '#002B5B' }}>{fmtUSD(totalOut)}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>Total Entries</span>
                <span className="font-mono text-sm font-bold whitespace-nowrap" style={{ color: '#002B5B' }}>{txCount}</span>
              </div>
              <Divider />
              <div className="flex items-center justify-between gap-2 pt-1">
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#002B5B' }}>Net Ledger Position</span>
                <span className="font-mono text-sm sm:text-base font-bold whitespace-nowrap" style={{ color: '#0052CC' }}>{fmtUSD(totalIn - totalOut)}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
