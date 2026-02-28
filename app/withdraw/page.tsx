'use client'
import { useState } from 'react'
import { useStore } from '@/store'
import { Card, Button, Input, Select, SectionHeader, SuccessScreen, Divider } from '@/components/ui'
import { fmtUSD, COIN_PRICES } from '@/lib/utils'
import { Building, CreditCard, Bitcoin, AlertTriangle } from 'lucide-react'
import clsx from 'clsx'

const METHODS = [
  { id: 'bank', label: 'Bank / ACH', icon: Building },
  { id: 'card', label: 'Debit Card', icon: CreditCard },
  { id: 'crypto', label: 'Crypto', icon: Bitcoin },
]

const COINS = ['BTC', 'ETH', 'USDT', 'BNB', 'SOL']
const NETWORKS = ['ERC-20', 'TRC-20', 'BEP-20', 'Native']

export default function WithdrawPage() {
  const { addTx, toast, state, me } = useStore()
  const [method, setMethod] = useState('bank')
  const [amount, setAmount] = useState('')
  const [coin, setCoin] = useState('BTC')
  const [network, setNetwork] = useState('ERC-20')
  const [transferType, setTransferType] = useState<'ACH' | 'Wire'>('ACH')
  const [walletTo, setWalletTo] = useState('')
  const [success, setSuccess] = useState(false)

  const { theme } = state
  const fee = method === 'crypto' ? 5.00 : method === 'bank' && transferType === 'Wire' ? 25.00 : 0
  const numAmount = parseFloat(amount) || 0
  const total = numAmount + fee
  const coinAmt = numAmount > 0 ? (numAmount / COIN_PRICES[coin]).toFixed(6) : '0'

  const handleWithdraw = () => {
    if (!numAmount || numAmount <= 0) { toast('Please enter a valid amount', 'error'); return }
    if (total > me.balance) { toast('Insufficient funds', 'error'); return }
    if (method === 'crypto' && !walletTo) { toast('Enter a recipient wallet address', 'error'); return }
    addTx('debit', method === 'crypto' ? 'crypto' : 'transfer', `${METHODS.find(m => m.id === method)!.label} Withdrawal`, total)
    setSuccess(true)
  }

  if (success) return (
    <SuccessScreen
      title="Withdrawal Initiated!"
      subtitle={`${fmtUSD(numAmount)} withdrawal is being processed`}
      extra={
        <div className="text-sm rounded-xl p-4 space-y-2" style={{ background: 'var(--color-bg)' }}>
          <div className="flex justify-between"><span style={{ color: 'var(--color-muted)' }}>Amount</span><span className="font-mono font-bold text-red-500">-{fmtUSD(numAmount)}</span></div>
          <div className="flex justify-between"><span style={{ color: 'var(--color-muted)' }}>Fee</span><span className="font-mono">{fmtUSD(fee)}</span></div>
          <div className="flex justify-between"><span style={{ color: 'var(--color-muted)' }}>Estimated Arrival</span><span>{method === 'bank' ? '1-3 business days' : method === 'crypto' ? '10-30 minutes' : 'Instant'}</span></div>
        </div>
      }
      onAgain={() => { setSuccess(false); setAmount('') }}
      againLabel="Make Another Withdrawal"
    />
  )

  return (
    <div className="max-w-4xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          {/* Method */}
          <Card className="p-6">
            <SectionHeader title="Withdrawal Method" />
            <div className="grid grid-cols-3 gap-3">
              {METHODS.map(m => {
                const active = method === m.id
                return (
                  <button
                    key={m.id}
                    onClick={() => setMethod(m.id)}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-xs font-semibold transition-all font-sans cursor-pointer"
                    style={{
                      borderColor: active ? theme.accentColor : 'var(--color-border)',
                      background: active ? theme.accentColor + '15' : 'var(--color-surface)',
                      color: active ? theme.accentColor : 'var(--color-muted)',
                    }}
                  >
                    <m.icon size={20} />
                    {m.label}
                  </button>
                )
              })}
            </div>
          </Card>

          <Card className="p-6">
            {method === 'bank' && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold mb-2">Transfer Type</p>
                  <div className="flex gap-2">
                    {(['ACH', 'Wire'] as const).map(t => (
                      <button
                        key={t}
                        onClick={() => setTransferType(t)}
                        className="flex-1 py-2 rounded-xl border-2 text-sm font-semibold font-sans cursor-pointer transition-all"
                        style={{
                          borderColor: transferType === t ? theme.accentColor : 'var(--color-border)',
                          background: transferType === t ? theme.accentColor + '15' : 'var(--color-surface)',
                          color: transferType === t ? theme.accentColor : 'var(--color-text)',
                        }}
                      >
                        {t} {t === 'ACH' ? '(Free)' : '($25 fee)'}
                      </button>
                    ))}
                  </div>
                </div>
                <Input label="Bank Name" placeholder="Recipient bank name" />
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
              </div>
            )}

            {method === 'crypto' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Select label="Coin" value={coin} onChange={e => setCoin(e.target.value)}>
                    {COINS.map(c => <option key={c}>{c}</option>)}
                  </Select>
                  <Select label="Network" value={network} onChange={e => setNetwork(e.target.value)}>
                    {NETWORKS.map(n => <option key={n}>{n}</option>)}
                  </Select>
                </div>
                <Input
                  label="Recipient Wallet Address"
                  placeholder="0x..."
                  value={walletTo}
                  onChange={e => setWalletTo(e.target.value)}
                  className="font-mono"
                />
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
                hint={method === 'crypto' && numAmount > 0 ? `≈ ${coinAmt} ${coin}` : undefined}
              />

              <div className="rounded-xl p-4 text-sm space-y-2" style={{ background: 'var(--color-bg)' }}>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--color-muted)' }}>Amount</span>
                  <span className="font-mono">{fmtUSD(numAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--color-muted)' }}>Network Fee</span>
                  <span className="font-mono">{fmtUSD(fee)}</span>
                </div>
                <Divider />
                <div className="flex justify-between font-semibold">
                  <span>Total Deducted</span>
                  <span className="font-mono text-red-500">{fmtUSD(total)}</span>
                </div>
                <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                  Available balance: {fmtUSD(me.balance)}
                </p>
              </div>

              <Button
                variant="primary"
                size="lg"
                className="w-full justify-center"
                onClick={handleWithdraw}
                accentColor={theme.accentColor}
              >
                Withdraw {numAmount > 0 ? fmtUSD(numAmount) : 'Funds'}
              </Button>
            </div>
          </Card>
        </div>

        {/* Info */}
        <div className="space-y-4">
          <Card className="p-5">
            <SectionHeader title="Processing Times" />
            {[
              ['ACH Transfer', '1-3 business days', 'Free'],
              ['Wire Transfer', 'Same day', '$25'],
              ['Crypto', '10-30 minutes', 'Network fee'],
              ['Debit Card', 'Instant', 'Free'],
            ].map(([m, t, f], i) => (
              <div key={i} className="py-2.5 border-b last:border-b-0" style={{ borderColor: 'var(--color-border)' }}>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold">{m}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">{f}</span>
                </div>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>⏱ {t}</p>
              </div>
            ))}
          </Card>

          <div className="flex gap-3 p-4 rounded-xl bg-amber-50">
            <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">Crypto withdrawals are irreversible. Double-check the recipient address before confirming.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
