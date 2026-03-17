'use client'
import { useState } from 'react'
import { useAuth } from '@/store/auth'
import { api, fmtUSD, COIN_PRICES } from '@/lib/api'
import { Card, Button, Input, Select, SectionHeader, SuccessScreen, Divider } from '@/components/ui'
import { Building, CreditCard, Bitcoin, AlertTriangle } from 'lucide-react'

const METHODS = [
  { id: 'ach',        label: 'ACH Transfer',     icon: Building,  fee: 0,    feeLabel: 'Free' },
  { id: 'wire',       label: 'Wire Transfer',     icon: Building,  fee: 25,   feeLabel: '$25' },
  { id: 'card',       label: 'Debit Card',        icon: CreditCard,fee: 1.50, feeLabel: '$1.50' },
  { id: 'crypto_btc', label: 'Bitcoin (BTC)',      icon: Bitcoin,   fee: 5,    feeLabel: '$5.00' },
  { id: 'crypto_eth', label: 'Ethereum (ETH)',     icon: Bitcoin,   fee: 5,    feeLabel: '$5.00' },
  { id: 'crypto_usdt',label: 'USDT',               icon: Bitcoin,   fee: 5,    feeLabel: '$5.00' },
  { id: 'crypto_sol', label: 'Solana (SOL)',        icon: Bitcoin,   fee: 5,    feeLabel: '$5.00' },
]

const COINS = ['BTC','ETH','USDT','BNB','SOL']
const NETWORKS = ['ERC-20','TRC-20','BEP-20','Native']

export default function WithdrawPage() {
  const { user, refreshUser, toast } = useAuth()
  const [method, setMethod] = useState('ach')
  const [amount, setAmount] = useState('')
  const [wallet, setWallet] = useState('')
  const [coin, setCoin] = useState('BTC')
  const [network, setNetwork] = useState('ERC-20')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const num = parseFloat(amount) || 0
  const sel = METHODS.find(m => m.id === method)!
  const isCrypto = method.startsWith('crypto_')
  const fee = sel.fee
  const total = num + fee
  const coinAmt = num > 0 ? (num / COIN_PRICES[coin as keyof typeof COIN_PRICES]).toFixed(6) : '0'

  const handleWithdraw = async () => {
    if (!num || num <= 0) { toast('Enter a valid amount', 'error'); return }
    if (total > (user?.balance || 0)) { toast(`Insufficient funds. You need ${fmtUSD(total)}`, 'error'); return }
    if (isCrypto && !wallet) { toast('Enter recipient wallet address', 'error'); return }
    setLoading(true)
    try {
      const body: any = { amount: num, method }
      if (isCrypto) body.cryptoDetails = { coin, coinAmount: parseFloat(coinAmt), network, walletAddress: wallet }
      const data = await api.tx.withdraw(body)
      setResult(data)
      await refreshUser()
    } catch (err: any) {
      toast(err.message || 'Withdrawal failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (result) return (
    <SuccessScreen
      title="Withdrawal Initiated!"
      subtitle={`${fmtUSD(num)} withdrawal is processing`}
      receiptUrl={result.receiptUrl ? `http://localhost:5000${result.receiptUrl}` : undefined}
      txId={result.transaction?.transactionId}
      extra={
        <div className="text-sm rounded-xl p-4 space-y-2.5 text-left" style={{ background: 'var(--color-bg)' }}>
          <div className="flex justify-between"><span style={{ color: 'var(--color-muted)' }}>Amount</span><span className="font-mono font-bold text-red-500">-{fmtUSD(num)}</span></div>
          <div className="flex justify-between"><span style={{ color: 'var(--color-muted)' }}>Fee</span><span className="font-mono">{fmtUSD(fee)}</span></div>
          <div className="flex justify-between"><span style={{ color: 'var(--color-muted)' }}>New Balance</span><span className="font-mono font-bold">{fmtUSD(result.newBalance)}</span></div>
          <div className="flex justify-between"><span style={{ color: 'var(--color-muted)' }}>Ref</span><span className="font-mono text-xs">{result.transaction?.transactionId}</span></div>
        </div>
      }
      onAgain={() => { setResult(null); setAmount('') }}
      againLabel="Make Another Withdrawal"
    />
  )

  return (
    <div className="max-w-5xl space-y-5 fade-up">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">

          <Card className="p-6">
            <SectionHeader title="Withdrawal Method" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {METHODS.map(m => (
                <button key={m.id} onClick={() => setMethod(m.id)}
                  className="flex items-center gap-2.5 p-3 rounded-xl border-2 text-xs font-semibold transition-all font-sans cursor-pointer"
                  style={{
                    borderColor: method === m.id ? '#10B981' : 'var(--color-border)',
                    background: method === m.id ? 'rgba(16,185,129,.08)' : 'var(--color-surface)',
                    color: method === m.id ? '#10B981' : 'var(--color-muted)',
                  }}>
                  <m.icon size={15} />
                  <div>
                    <p className="font-semibold">{m.label}</p>
                    <p className="opacity-60">{m.feeLabel}</p>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <SectionHeader title="Withdrawal Details" />

            {(method === 'ach' || method === 'wire') && (
              <div className="space-y-4 mb-5">
                <Input label="Bank Name" placeholder="Recipient bank" />
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Routing Number" placeholder="021000021" className="font-mono" />
                  <Input label="Account Number" placeholder="••••••••••" className="font-mono" />
                </div>
              </div>
            )}
            {method === 'card' && (
              <div className="space-y-4 mb-5">
                <Input label="Card Number" placeholder="1234 5678 9012 3456" className="font-mono" />
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Expiry" placeholder="MM/YY" className="font-mono" />
                  <Input label="CVV" placeholder="•••" className="font-mono" />
                </div>
              </div>
            )}
            {isCrypto && (
              <div className="space-y-4 mb-5">
                <div className="grid grid-cols-2 gap-3">
                  <Select label="Coin" value={coin} onChange={e => setCoin(e.target.value)}>
                    {COINS.map(c => <option key={c}>{c}</option>)}
                  </Select>
                  <Select label="Network" value={network} onChange={e => setNetwork(e.target.value)}>
                    {NETWORKS.map(n => <option key={n}>{n}</option>)}
                  </Select>
                </div>
                <Input label="Recipient Wallet Address" placeholder="0x..." value={wallet}
                  onChange={e => setWallet(e.target.value)} className="font-mono" />
                <div className="flex gap-2.5 p-3 rounded-xl bg-amber-50">
                  <AlertTriangle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">Crypto withdrawals are <strong>irreversible</strong>. Double-check the wallet address before confirming.</p>
                </div>
              </div>
            )}

            <Input label="Amount (USD)" type="number" min="0.01" step="0.01" placeholder="0.00"
              prefix="$" value={amount} onChange={e => setAmount(e.target.value)} className="font-mono"
              hint={isCrypto && num > 0 ? `≈ ${coinAmt} ${coin}` : `Available: ${fmtUSD(user?.balance || 0)}`} />

            <div className="mt-4 rounded-xl p-4 text-sm space-y-2" style={{ background: 'var(--color-bg)' }}>
              <div className="flex justify-between"><span style={{ color: 'var(--color-muted)' }}>Amount</span><span className="font-mono">{fmtUSD(num)}</span></div>
              <div className="flex justify-between"><span style={{ color: 'var(--color-muted)' }}>Network Fee</span><span className="font-mono">{fmtUSD(fee)}</span></div>
              <Divider />
              <div className="flex justify-between font-semibold">
                <span>Total Deducted</span><span className="font-mono text-red-500">{fmtUSD(total)}</span>
              </div>
              {total > (user?.balance || 0) && (
                <p className="text-xs text-red-500 font-medium">⚠ Insufficient balance</p>
              )}
            </div>

            <Button variant="primary" size="lg" className="w-full mt-4" onClick={handleWithdraw} loading={loading}
              disabled={total > (user?.balance || 0) || num <= 0}>
              Withdraw {num > 0 ? fmtUSD(num) : 'Funds'}
            </Button>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-5">
            <SectionHeader title="Processing Times" />
            {[['ACH Transfer','1–3 days','Free'],['Wire Transfer','Same day','$25'],['Debit Card','Instant','$1.50'],['Crypto','10–30 min','$5.00']].map(([m,t,f]) => (
              <div key={m} className="py-2.5 border-b last:border-0" style={{ borderColor: 'var(--color-border)' }}>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold">{m}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: f === 'Free' ? 'rgba(16,185,129,.1)' : 'rgba(245,158,11,.1)', color: f === 'Free' ? '#059669' : '#B45309' }}>{f}</span>
                </div>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>⏱ {t}</p>
              </div>
            ))}
          </Card>
          <Card className="p-5">
            <SectionHeader title="Limits" />
            {[['Per Transaction','$10,000'],['Daily','$25,000'],['Monthly','$100,000']].map(([l,v]) => (
              <div key={l} className="flex justify-between py-2.5 border-b last:border-0" style={{ borderColor: 'var(--color-border)' }}>
                <span className="text-xs" style={{ color: 'var(--color-muted)' }}>{l}</span>
                <span className="text-xs font-bold font-mono">{v}</span>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  )
}
