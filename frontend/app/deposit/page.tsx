'use client'
import { useState } from 'react'
import { useAuth } from '@/store/auth'
import { api, fmtUSD, COIN_PRICES, WALLET_ADDRS } from '@/lib/api'
import { Card, Button, Input, Select, SectionHeader, SuccessScreen } from '@/components/ui'
import { Building, CreditCard, Bitcoin, DollarSign, Smartphone, Copy, Check, Shield, AlertTriangle } from 'lucide-react'
import clsx from 'clsx'

const METHODS = [
  { id: 'bank_transfer', label: 'Bank Transfer',    icon: Building,     fee: 'Free' },
  { id: 'ach',           label: 'ACH Transfer',     icon: Building,     fee: 'Free' },
  { id: 'wire',          label: 'Wire Transfer',    icon: Building,     fee: '$15' },
  { id: 'card',          label: 'Debit/Credit Card',icon: CreditCard,   fee: '2.5%' },
  { id: 'crypto_btc',    label: 'Bitcoin',          icon: Bitcoin,      fee: '$2.50' },
  { id: 'crypto_eth',    label: 'Ethereum',         icon: Bitcoin,      fee: '$2.50' },
  { id: 'crypto_usdt',   label: 'USDT',             icon: Bitcoin,      fee: '$2.50' },
  { id: 'crypto_sol',    label: 'Solana',           icon: Bitcoin,      fee: '$2.50' },
  { id: 'paypal',        label: 'PayPal',           icon: DollarSign,   fee: 'Free' },
  { id: 'cashapp',       label: 'Cash App',         icon: DollarSign,   fee: 'Free' },
  { id: 'venmo',         label: 'Venmo',            icon: Smartphone,   fee: 'Free' },
  { id: 'zelle',         label: 'Zelle',            icon: Smartphone,   fee: 'Free' },
]

const COINS = ['BTC','ETH','USDT','BNB','SOL']
const NETWORKS = ['ERC-20','TRC-20','BEP-20','Native']

export default function DepositPage() {
  const { user, refreshUser, toast } = useAuth()
  const [method, setMethod] = useState('bank_transfer')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [coin, setCoin] = useState('BTC')
  const [network, setNetwork] = useState('ERC-20')
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const num = parseFloat(amount) || 0
  const selectedMethod = METHODS.find(m => m.id === method)!
  const isCrypto = method.startsWith('crypto_')
  const coinKey = coin as keyof typeof COIN_PRICES
  const coinAmt = num > 0 ? (num / COIN_PRICES[coinKey]).toFixed(6) : '0'
  const fee = method === 'card' ? parseFloat((num * 0.025).toFixed(2))
    : method === 'wire' ? 15
    : isCrypto ? 2.50
    : 0

  const handleDeposit = async () => {
    if (!num || num <= 0) { toast('Enter a valid amount', 'error'); return }
    if (num < 1) { toast('Minimum deposit is $1.00', 'error'); return }
    setLoading(true)
    try {
      const body: any = { amount: num, method, note }
      if (isCrypto) body.cryptoDetails = { coin, coinAmount: parseFloat(coinAmt), network, walletAddress: WALLET_ADDRS[coin] }
      const data = await api.tx.deposit(body)
      setResult(data)
      await refreshUser()
    } catch (err: any) {
      toast(err.message || 'Deposit failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  const copyAddr = () => {
    navigator.clipboard?.writeText(WALLET_ADDRS[coin] || '').catch(() => {})
    setCopied(true); setTimeout(() => setCopied(false), 2000)
    toast('Wallet address copied!', 'success')
  }

  if (result) return (
    <SuccessScreen
      title="Deposit Initiated!"
      subtitle={`${fmtUSD(num)} will be credited to your account`}
      receiptUrl={result.receiptUrl ? `http://localhost:5000${result.receiptUrl}` : undefined}
      txId={result.transaction?.transactionId}
      extra={
        <div className="text-sm rounded-xl p-4 space-y-2.5 text-left" style={{ background: 'var(--color-bg)' }}>
          <div className="flex justify-between"><span style={{ color: 'var(--color-muted)' }}>Amount</span><span className="font-mono font-bold text-emerald-600">+{fmtUSD(num)}</span></div>
          <div className="flex justify-between"><span style={{ color: 'var(--color-muted)' }}>Fee</span><span className="font-mono">{fmtUSD(fee)}</span></div>
          <div className="flex justify-between"><span style={{ color: 'var(--color-muted)' }}>Method</span><span>{selectedMethod.label}</span></div>
          <div className="flex justify-between"><span style={{ color: 'var(--color-muted)' }}>New Balance</span><span className="font-mono font-bold">{fmtUSD(result.newBalance)}</span></div>
          <div className="flex justify-between"><span style={{ color: 'var(--color-muted)' }}>Ref</span><span className="font-mono text-xs">{result.transaction?.transactionId}</span></div>
        </div>
      }
      onAgain={() => { setResult(null); setAmount('') }}
      againLabel="Make Another Deposit"
    />
  )

  return (
    <div className="max-w-5xl space-y-4 sm:space-y-5 fade-up">
      <div className="grid grid-cols-1 lg:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        <div className="lg:col-span-2 space-y-5">

          {/* Method picker */}
          <Card className="p-6">
            <SectionHeader title="Select Deposit Method" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {METHODS.map(m => (
                <button key={m.id} onClick={() => setMethod(m.id)}
                  className="flex items-center gap-2.5 p-3 rounded-xl border-2 text-sm font-semibold text-left transition-all font-sans cursor-pointer"
                  style={{
                    borderColor: method === m.id ? '#10B981' : 'var(--color-border)',
                    background: method === m.id ? 'rgba(16,185,129,.08)' : 'var(--color-surface)',
                    color: method === m.id ? '#10B981' : 'var(--color-muted)',
                  }}>
                  <m.icon size={15} />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold">{m.label}</p>
                    <p className="text-[10px] opacity-60">{m.fee}</p>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          {/* Details form */}
          <Card className="p-6">
            <SectionHeader title={`${selectedMethod.label} Details`} />

            {(method === 'bank_transfer' || method === 'ach' || method === 'wire') && (
              <div className="space-y-4">
                <Input label="Bank Name" placeholder="e.g. Chase Bank" />
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Routing Number" placeholder="021000021" className="font-mono" />
                  <Input label="Account Number" placeholder="••••••••••" className="font-mono" />
                </div>
                {method === 'wire' && <div className="flex gap-2.5 p-3 rounded-xl bg-amber-50"><AlertTriangle size={15} className="text-amber-600 flex-shrink-0 mt-0.5" /><p className="text-xs text-amber-700">Wire transfers incur a $15 processing fee.</p></div>}
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

            {isCrypto && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Select label="Coin" value={coin} onChange={e => setCoin(e.target.value)}>
                    {COINS.map(c => <option key={c}>{c}</option>)}
                  </Select>
                  <Select label="Network" value={network} onChange={e => setNetwork(e.target.value)}>
                    {NETWORKS.map(n => <option key={n}>{n}</option>)}
                  </Select>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-2">Your {coin} Deposit Address</p>
                  <div className="flex items-start gap-3 p-3 rounded-xl border-2 border-dashed" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)' }}>
                    <p className="font-mono text-xs flex-1 break-all" style={{ color: 'var(--color-muted)' }}>{WALLET_ADDRS[coin]}</p>
                    <button onClick={copyAddr} className="flex-shrink-0">
                      {copied ? <Check size={15} className="text-emerald-500" /> : <Copy size={15} style={{ color: 'var(--color-muted)' }} />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-3 rounded-xl" style={{ background: 'var(--color-bg)' }}>
                  <div className="w-20 h-20 rounded-xl border-2 flex flex-col items-center justify-center gap-1 flex-shrink-0"
                    style={{ borderColor: 'var(--color-border)' }}>
                    <svg width="48" height="48" viewBox="0 0 60 60" style={{ color: 'var(--color-muted)' }}>
                      <rect x="2" y="2" width="24" height="24" rx="2" fill="none" stroke="currentColor" strokeWidth="2"/>
                      <rect x="8" y="8" width="12" height="12" rx="1" fill="currentColor"/>
                      <rect x="34" y="2" width="24" height="24" rx="2" fill="none" stroke="currentColor" strokeWidth="2"/>
                      <rect x="40" y="8" width="12" height="12" rx="1" fill="currentColor"/>
                      <rect x="2" y="34" width="24" height="24" rx="2" fill="none" stroke="currentColor" strokeWidth="2"/>
                      <rect x="8" y="40" width="12" height="12" rx="1" fill="currentColor"/>
                      <rect x="34" y="34" width="5" height="5" fill="currentColor"/>
                      <rect x="41" y="41" width="5" height="5" fill="currentColor"/>
                      <rect x="48" y="48" width="5" height="5" fill="currentColor"/>
                    </svg>
                    <span className="text-[9px]" style={{ color: 'var(--color-muted)' }}>Scan QR</span>
                  </div>
                  <div className="text-xs space-y-1.5" style={{ color: 'var(--color-muted)' }}>
                    <p>⏱ Arrival: <strong>10–30 min</strong></p>
                    <p>🌐 Network: <strong>{network}</strong></p>
                    <p>💸 Fee: <strong>$2.50</strong></p>
                    <p>≈ <strong className="font-mono">{coinAmt} {coin}</strong></p>
                  </div>
                </div>
              </div>
            )}

            {(method === 'paypal' || method === 'cashapp' || method === 'venmo' || method === 'zelle') && (
              <div className="space-y-4">
                <Input label={`${selectedMethod.label} Email / Username`} placeholder="you@email.com or $username" />
              </div>
            )}

            {/* Amount */}
            <div className="mt-6 space-y-4">
              <Input label="Amount (USD)" type="number" min="1" step="0.01" placeholder="0.00"
                prefix="$" value={amount} onChange={e => setAmount(e.target.value)} className="font-mono"
                hint={`Balance after: ${fmtUSD((user?.balance || 0) + num)}`} />

              {/* Fee breakdown */}
              <div className="rounded-xl p-4 text-sm space-y-2" style={{ background: 'var(--color-bg)' }}>
                <div className="flex justify-between"><span style={{ color: 'var(--color-muted)' }}>Processing Fee</span><span className="font-mono">{fmtUSD(fee)}</span></div>
                <div className="flex justify-between font-semibold">
                  <span>Net Deposit</span><span className="font-mono text-emerald-600">{fmtUSD(Math.max(0, num - fee))}</span>
                </div>
              </div>

              <Input label="Note (optional)" placeholder="Reference or description" value={note} onChange={e => setNote(e.target.value)} />

              <Button variant="primary" size="lg" className="w-full" onClick={handleDeposit} loading={loading}>
                Deposit {num > 0 ? fmtUSD(num) : 'Funds'}
              </Button>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card className="p-5">
            <SectionHeader title="Deposit Limits" />
            {[['Daily', '$50,000'], ['Monthly', '$250,000'], ['Minimum', '$1.00'], ['Per Transaction', '$50,000']].map(([l, v]) => (
              <div key={l} className="flex justify-between py-2.5 border-b last:border-0" style={{ borderColor: 'var(--color-border)' }}>
                <span className="text-xs" style={{ color: 'var(--color-muted)' }}>{l}</span>
                <span className="text-xs font-bold font-mono">{v}</span>
              </div>
            ))}
          </Card>
          <div className="flex gap-3 p-4 rounded-xl bg-emerald-50">
            <Shield size={15} className="text-emerald-700 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-emerald-700">All deposits are FDIC insured up to $250,000 and protected with 256-bit encryption.</p>
          </div>
          <Card className="p-5">
            <SectionHeader title="Current Balance" />
            <p className="text-2xl font-bold font-mono" style={{ color: '#10B981' }}>{fmtUSD(user?.balance || 0)}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>After deposit: <strong>{fmtUSD((user?.balance || 0) + Math.max(0, num - fee))}</strong></p>
          </Card>
        </div>
      </div>
    </div>
  )
}
