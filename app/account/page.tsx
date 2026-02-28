'use client'
import { useStore } from '@/store'
import { Card, StatCard, SectionHeader, Button, Divider, StatusBadge, Badge } from '@/components/ui'
import { fmtUSD } from '@/lib/utils'
import {
  Eye, EyeOff, Zap, Shield, Gift, Building, Smartphone, Lock,
  CheckCircle, TrendingUp, TrendingDown
} from 'lucide-react'
import { useState } from 'react'

export default function AccountPage() {
  const { me, myTxs, state } = useStore()
  const [reveal, setReveal] = useState(false)

  const totalIn = myTxs.filter(t => t.type === 'credit' && t.status === 'completed').reduce((s, t) => s + t.amount, 0)
  const totalOut = myTxs.filter(t => t.type === 'debit' && t.status === 'completed').reduce((s, t) => s + t.amount, 0)
  const pending = myTxs.filter(t => t.status === 'pending').reduce((s, t) => s + t.amount, 0)

  const details = [
    { label: 'Account Type', value: 'Standard Checking Account' },
    { label: 'Account Status', value: <StatusBadge status={me.status} /> },
    { label: 'Account Number', value: <span className="font-mono">{reveal ? me.accountNo.replace(/ /g, '') : '•••• •••• •••• ' + me.accountNo.replace(/ /g, '').slice(-4)}</span> },
    { label: 'Routing Number', value: <span className="font-mono">{me.routing}</span> },
    { label: 'Card Number', value: <span className="font-mono">{reveal ? me.cardNo : '•••• •••• •••• ' + me.cardNo.replace(/ /g, '').slice(-4)}</span> },
    { label: 'CVV', value: <span className="font-mono">{reveal ? me.cvv : '•••'}</span> },
    { label: 'Expiry Date', value: <span className="font-mono">{me.expiry}</span> },
    { label: 'KYC Status', value: <StatusBadge status={me.kyc} /> },
    { label: 'Overdraft Protection', value: <Badge variant="green">Enabled</Badge> },
    { label: 'Daily Transfer Limit', value: fmtUSD(10000) },
    { label: 'Daily ATM Limit', value: fmtUSD(1500) },
    { label: 'FDIC Insured', value: <Badge variant="blue">Up to $250,000</Badge> },
    { label: 'Account Holder', value: me.name },
    { label: 'Email', value: me.email },
    { label: 'Phone', value: me.phone },
  ]

  const features = [
    { icon: Zap, label: 'Instant Transfers', desc: 'Send money in seconds' },
    { icon: Shield, label: 'Fraud Protection', desc: '24/7 monitoring' },
    { icon: Gift, label: 'Cashback Rewards', desc: 'Up to 2% on purchases' },
    { icon: Building, label: 'Free ATM Network', desc: '50,000+ ATMs nationwide' },
    { icon: Smartphone, label: 'Mobile Banking', desc: 'iOS & Android app' },
    { icon: Lock, label: '2FA Security', desc: 'Extra account protection' },
  ]

  return (
    <div className="max-w-6xl space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Available Balance"
          value={fmtUSD(me.balance)}
          sub="Checking Account"
          iconBg="bg-emerald-100"
          icon={<TrendingUp size={16} className="text-emerald-600" />}
        />
        <StatCard
          label="Pending Transactions"
          value={fmtUSD(pending)}
          sub="Processing"
          iconBg="bg-blue-100"
          icon={<TrendingDown size={16} className="text-blue-600" />}
        />
        <StatCard
          label="Total Transactions"
          value={String(myTxs.length)}
          sub="All time"
          iconBg="bg-violet-100"
          icon={<CheckCircle size={16} className="text-violet-600" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Account Details */}
        <Card className="p-6">
          <SectionHeader
            title="Account Details"
            action={
              <Button variant="secondary" size="sm" onClick={() => setReveal(!reveal)}>
                {reveal ? <EyeOff size={14} /> : <Eye size={14} />}
                {reveal ? 'Hide' : 'Reveal'}
              </Button>
            }
          />
          <div className="space-y-0">
            {details.map(({ label, value }, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-3 border-b last:border-b-0"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <span className="text-xs font-medium" style={{ color: 'var(--color-muted)' }}>{label}</span>
                <span className="text-sm font-semibold">{value}</span>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-5">
          {/* Features */}
          <Card className="p-6">
            <SectionHeader title="Account Features" />
            {features.map(({ icon: Icon, label, desc }, i) => (
              <div
                key={i}
                className="flex items-center gap-4 py-3 border-b last:border-b-0"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--color-bg)' }}>
                  <Icon size={18} style={{ color: state.theme.accentColor }} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{label}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>{desc}</p>
                </div>
                <CheckCircle size={16} style={{ color: state.theme.accentColor }} />
              </div>
            ))}
          </Card>

          {/* Monthly Summary */}
          <Card className="p-6">
            <SectionHeader title="Monthly Summary" />
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm" style={{ color: 'var(--color-muted)' }}>Total Deposits</span>
                <span className="font-mono text-sm font-bold text-emerald-600">{fmtUSD(totalIn)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm" style={{ color: 'var(--color-muted)' }}>Total Withdrawals</span>
                <span className="font-mono text-sm font-bold text-red-500">{fmtUSD(totalOut)}</span>
              </div>
              <Divider />
              <div className="flex justify-between">
                <span className="text-sm font-semibold">Net Change</span>
                <span className={`font-mono text-sm font-bold ${totalIn - totalOut >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {fmtUSD(totalIn - totalOut)}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
