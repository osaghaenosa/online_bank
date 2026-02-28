'use client'
import { useState } from 'react'
import { useStore } from '@/store'
import { Card, Button, Input, Select, SectionHeader, SuccessScreen } from '@/components/ui'
import { fmtUSD, COIN_PRICES, WALLET_ADDRS } from '@/lib/utils'
import { Building, CreditCard, Bitcoin, DollarSign, Copy, Check, Shield, AlertTriangle } from 'lucide-react'
import clsx from 'clsx'

const METHODS = [
  { id: 'bank', label: 'Bank Transfer', icon: Building },
  { id: 'card', label: 'Debit / Credit Card', icon: CreditCard },
  { id: 'crypto', label: 'Crypto', icon: Bitcoin },
  { id: 'paypal', label: 'PayPal', icon: DollarSign },
]

const COINS = ['BTC', 'ETH', 'USDT', 'BNB', 'SOL']
const NETWORKS = ['ERC-20', 'TRC-20', 'BEP-20', 'Native']

export default function DepositPage() {
  const { addTx, toast, state } = useStore()
  const [method, setMethod] = useState('bank')
  const [amount, setAmount] = useState('')
  const [coin, setCoin] = useState('BTC')
  const [network, setNetwork] = useState('ERC-20')
  const [copied, setCopied] = useState(false)
  const [success, setSuccess] = useState(false)

  const { theme } = state
  const numAmount = parseFloat(amount) || 0
  const coinAmt = numAmount > 0 ? (numAmount / COIN_PRICES[coin]).toFixed(6) : '0'

  const handleDeposit = () => {
    if (!numAmount || numAmount <= 0) { toast('Please enter a valid amount', 'error'); return }
    addTx('credit', 'transfer', `${METHODS.find(m => m.id === method)!.label} Deposit`, numAmount)
    setSuccess(true)
  }

  const handleCopy = () => {
    navigator.clipboard?.writeText(WALLET_ADDRS[coin] || '').catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast('Wallet address copied!', 'success')
  }

  if (success) return (
    <SuccessScreen
      title="Deposit Initiated!"
      subtitle={`${fmtUSD(numAmount)} will be added to your account`}
      extra={
        <div className="text-sm rounded-xl p-4 space-y-2" style={{ background: 'var(--color-bg)' }}>
          <div className="flex justify-between"><span style={{ color: 'var(--color-muted)' }}>Amount</span><span className="font-mono font-bold text-emerald-600">+{fmtUSD(numAmount)}</span></div>
          <div className="flex justify-between"><span style={{ color: 'var(--color-muted)' }}>Method</span><span>{METHODS.find(m => m.id === method)?.label}</span></div>
        </div>
      }
      onAgain={() => { setSuccess(false); setAmount('') }}
      againLabel="Make Another Deposit"
    />
  )

  return (
    <div className="max-w-4xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          {/* Method Selector */}
          <Card className="p-6">
            <SectionHeader title="Select Deposit Method" />
            <div className="grid grid-cols-2 gap-3">
              {METHODS.map(m => {
                const active = method === m.id
                return (
                  <button
                    key={m.id}
                    onClick={() => setMethod(m.id)}
                    className="flex items-center gap-3 p-4 rounded-xl border-2 text-sm font-semibold text-left transition-all font-sans cursor-pointer"
                    style={{
                      borderColor: active ? theme.accentColor : 'var(--color-border)',
                      background: active ? theme.accentColor + '15' : 'var(--color-surface)',
                      color: active ? theme.accentColor : 'var(--color-muted)',
                    }}
                  >
                    <m.icon size={18} />
                    {m.label}
                  </button>
                )
              })}
            </div>
          </Card>

          {/* Method Form */}
          <Card className="p-6">
            <SectionHeader title={`${METHODS.find(m => m.id === method)?.label} Deposit`} />

            {method === 'bank' && (
              <div className="space-y-4">
                <Input label="Bank Name" placeholder="e.g. Chase Bank" />
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Routing Number" placeholder="123456789" className="font-mono" />
                  <Input label="Account Number" placeholder="•••••••••" className="font-mono" />
                </div>
              </div>
            )}

            {method === 'card' && (
              <div className="space-y-4">
                <Input label="Card Number" placeholder="1234 5678 9012 3456" className="font-mono" />
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Expiry" placeholder="MM/YY" className="font-mono" />
                  <Input label="CVV" placeholder="•••" className="font-mono" />
                </div>
                <Input label="Cardholder Name" placeholder="Full name on card" />
              </div>
            )}

            {method === 'crypto' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Select label="Coin" value={coin} onChange={e => setCoin(e.target.value)}>
                    {COINS.map(c => <option key={c} value={c}>{c}</option>)}
                  </Select>
                  <Select label="Network" value={network} onChange={e => setNetwork(e.target.value)}>
                    {NETWORKS.map(n => <option key={n}>{n}</option>)}
                  </Select>
                </div>

                {/* Wallet address */}
                <div>
                  <p className="text-sm font-semibold mb-2">Your {coin} Deposit Address</p>
                  <div className="flex items-start gap-3 p-3 rounded-xl border-2 border-dashed" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)' }}>
                    <p className="font-mono text-xs flex-1 break-all" style={{ color: 'var(--color-muted)' }}>
                      {WALLET_ADDRS[coin]}
                    </p>
                    <button onClick={handleCopy} className="flex-shrink-0">
                      {copied
                        ? <Check size={16} className="text-emerald-500" />
                        : <Copy size={16} style={{ color: 'var(--color-muted)' }} />
                      }
                    </button>
                  </div>
                </div>

                {/* QR placeholder */}
                <div className="flex items-center gap-4">
                  <div className="w-32 h-32 rounded-xl border-2 flex flex-col items-center justify-center gap-2 flex-shrink-0"
                    style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-muted)' }}>
                    <svg width="60" height="60" viewBox="0 0 60 60">
                      <rect x="2" y="2" width="24" height="24" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
                      <rect x="8" y="8" width="12" height="12" rx="1" fill="currentColor" />
                      <rect x="34" y="2" width="24" height="24" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
                      <rect x="40" y="8" width="12" height="12" rx="1" fill="currentColor" />
                      <rect x="2" y="34" width="24" height="24" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
                      <rect x="8" y="40" width="12" height="12" rx="1" fill="currentColor" />
                      <rect x="34" y="34" width="5" height="5" fill="currentColor" />
                      <rect x="41" y="34" width="5" height="5" fill="currentColor" />
                      <rect x="34" y="41" width="5" height="5" fill="currentColor" />
                      <rect x="48" y="41" width="5" height="5" fill="currentColor" />
                      <rect x="41" y="48" width="5" height="5" fill="currentColor" />
                      <rect x="48" y="48" width="5" height="5" fill="currentColor" />
                    </svg>
                    <span className="text-[10px]">Scan to Pay</span>
                  </div>
                  <div className="text-xs space-y-1.5" style={{ color: 'var(--color-muted)' }}>
                    <p>⏱ Est. arrival: <strong>10–30 min</strong></p>
                    <p>🌐 Network: <strong>{network}</strong></p>
                    <p>💸 Fee: <strong>~$2.50</strong></p>
                    <p>Coin amount: <strong className="font-mono">{coinAmt} {coin}</strong></p>
                  </div>
                </div>
              </div>
            )}

            {method === 'paypal' && (
              <div className="space-y-4">
                <Input label="PayPal Email / Username" placeholder="you@paypal.com" />
              </div>
            )}

            {/* Amount */}
            <div className="mt-5 space-y-4">
              <Input
                label="Amount (USD)"
                type="number"
                min="0"
                placeholder="0.00"
                prefix="$"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="font-mono"
              />

              {/* Fee breakdown */}
              <div className="rounded-xl p-4 text-sm space-y-2" style={{ background: 'var(--color-bg)' }}>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--color-muted)' }}>Processing Fee</span>
                  <span className="font-mono">$0.00</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--color-muted)' }}>Estimated Arrival</span>
                  <span>Instant – 1 business day</span>
                </div>
              </div>

              <Button
                variant="primary"
                size="lg"
                className="w-full justify-center"
                onClick={handleDeposit}
                accentColor={theme.accentColor}
              >
                Deposit {numAmount > 0 ? fmtUSD(numAmount) : 'Funds'}
              </Button>
            </div>
          </Card>
        </div>

        {/* Info Sidebar */}
        <div className="space-y-4">
          <Card className="p-5">
            <SectionHeader title="Deposit Limits" />
            {[
              ['Daily Limit', '$25,000'],
              ['Monthly Limit', '$100,000'],
              ['Minimum', '$1.00'],
              ['Max per transaction', '$10,000'],
            ].map(([l, v]) => (
              <div key={l} className="flex justify-between py-2.5 border-b last:border-b-0" style={{ borderColor: 'var(--color-border)' }}>
                <span className="text-xs" style={{ color: 'var(--color-muted)' }}>{l}</span>
                <span className="text-xs font-bold font-mono">{v}</span>
              </div>
            ))}
          </Card>

          <div className="flex gap-3 p-4 rounded-xl" style={{ background: '#D1FAE5' }}>
            <Shield size={16} className="text-emerald-700 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-emerald-700">All deposits are FDIC insured up to $250,000 and protected by 256-bit encryption.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
