'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/store/auth'
import { api, fmtUSD, COIN_PRICES } from '@/lib/api'
import { Card, Button, Input, Select, SectionHeader, Divider } from '@/components/ui'
import { Building, CreditCard, Bitcoin, AlertTriangle, ShieldAlert, Clock, CheckCircle, ArrowRight } from 'lucide-react'
import Link from 'next/link'

const METHODS = [
  { id: 'ach',         label: 'ACH Transfer',   icon: Building,   fee: 0,    feeLabel: 'Free'  },
  { id: 'wire',        label: 'Wire Transfer',   icon: Building,   fee: 25,   feeLabel: '$25'   },
  { id: 'card',        label: 'Debit Card',      icon: CreditCard, fee: 1.50, feeLabel: '$1.50' },
  { id: 'crypto_btc',  label: 'Bitcoin (BTC)',   icon: Bitcoin,    fee: 5,    feeLabel: '$5.00' },
  { id: 'crypto_eth',  label: 'Ethereum (ETH)',  icon: Bitcoin,    fee: 5,    feeLabel: '$5.00' },
  { id: 'crypto_usdt', label: 'USDT',            icon: Bitcoin,    fee: 5,    feeLabel: '$5.00' },
  { id: 'crypto_sol',  label: 'Solana (SOL)',    icon: Bitcoin,    fee: 5,    feeLabel: '$5.00' },
]

const COINS    = ['BTC','ETH','USDT','BNB','SOL']
const NETWORKS = ['ERC-20','TRC-20','BEP-20','Native']

export default function WithdrawPage() {
  const { user, toast } = useAuth()

  const [method,  setMethod]  = useState('ach')
  const [amount,  setAmount]  = useState('')
  const [wallet,  setWallet]  = useState('')
  const [coin,    setCoin]    = useState('BTC')
  const [network, setNetwork] = useState('ERC-20')
  const [loading, setLoading] = useState(false)
  const [result,  setResult]  = useState<any>(null)

  const [restrictions,        setRestrictions]        = useState<any>(null)
  const [loadingRestrictions, setLoadingRestrictions] = useState(true)

  useEffect(() => {
    api.restrictions.get()
      .then(d => setRestrictions(d))
      .catch(() => setRestrictions(null))
      .finally(() => setLoadingRestrictions(false))
  }, [])

  const num      = parseFloat(amount) || 0
  const sel      = METHODS.find(m => m.id === method)!
  const isCrypto = method.startsWith('crypto_')
  const fee      = sel.fee
  const total    = num + fee
  const coinAmt  = num > 0
    ? (num / COIN_PRICES[coin as keyof typeof COIN_PRICES]).toFixed(6)
    : '0'

  const handleWithdraw = async () => {
    if (!num || num <= 0)             { toast('Enter a valid amount', 'error'); return }
    if (total > (user?.balance || 0)) { toast(`Insufficient funds. You need ${fmtUSD(total)}`, 'error'); return }
    if (isCrypto && !wallet)          { toast('Enter recipient wallet address', 'error'); return }
    setLoading(true)
    try {
      const body: any = { amount: num, method }
      if (isCrypto) body.cryptoDetails = { coin, coinAmount: parseFloat(coinAmt), network, walletAddress: wallet }
      const data = await api.tx.withdraw(body)
      setResult(data)
      // ⚠️  Do NOT call refreshUser — balance hasn't changed yet
    } catch (err: any) {
      toast(err.message || 'Withdrawal failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  // ── PENDING APPROVAL screen ────────────────────────────────────────────────
  if (result) return (
    <div className="max-w-md mx-auto fade-up">
      <Card className="p-6 sm:p-8 text-center">
        {/* Pending icon */}
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{ background: 'rgba(245,158,11,.1)' }}>
          <Clock size={40} style={{ color: '#F59E0B' }} />
        </div>

        <h2 className="text-xl sm:text-2xl font-bold mb-2">Withdrawal Submitted</h2>
        <p className="text-sm mb-6" style={{ color: 'var(--color-muted)' }}>
          Your request is now <strong className="text-amber-500">pending admin approval</strong>. 
          Your balance will only be deducted once approved.
        </p>

        {/* Summary */}
        <div className="rounded-xl p-4 space-y-2.5 text-left mb-6"
          style={{ background: 'var(--color-bg)' }}>
          <div className="flex justify-between gap-3">
            <span className="text-xs" style={{ color: 'var(--color-muted)' }}>Amount Requested</span>
            <span className="font-mono font-bold text-sm">{fmtUSD(num)}</span>
          </div>
          {fee > 0 && (
            <div className="flex justify-between gap-3">
              <span className="text-xs" style={{ color: 'var(--color-muted)' }}>Fee</span>
              <span className="font-mono text-sm">{fmtUSD(fee)}</span>
            </div>
          )}
          <div className="flex justify-between gap-3">
            <span className="text-xs" style={{ color: 'var(--color-muted)' }}>Total on Approval</span>
            <span className="font-mono font-bold text-sm text-red-500">-{fmtUSD(total)}</span>
          </div>
          <Divider />
          <div className="flex justify-between gap-3">
            <span className="text-xs" style={{ color: 'var(--color-muted)' }}>Current Balance</span>
            <span className="font-mono font-bold text-sm text-emerald-600">{fmtUSD(result.currentBalance ?? user?.balance ?? 0)}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-xs" style={{ color: 'var(--color-muted)' }}>Status</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
              Pending Approval
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-xs" style={{ color: 'var(--color-muted)' }}>Reference</span>
            <span className="font-mono text-xs truncate max-w-[180px]">{result.transaction?.transactionId}</span>
          </div>
        </div>

        {/* Info note */}
        <div className="flex gap-2.5 p-3 rounded-xl mb-6 text-left"
          style={{ background: 'rgba(59,130,246,.06)', border: '1px solid rgba(59,130,246,.2)' }}>
          <AlertTriangle size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-600">
            You will receive a notification once your withdrawal is approved or rejected by an administrator.
            <strong> No funds have been deducted</strong> from your account yet.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/history" className="flex-1">
            <Button variant="secondary" className="w-full justify-center">
              View in History
            </Button>
          </Link>
          <Button variant="primary" className="flex-1 justify-center"
            onClick={() => { setResult(null); setAmount(''); setWallet('') }}>
            New Withdrawal <ArrowRight size={14} />
          </Button>
        </div>
      </Card>
    </div>
  )

  // ── BLOCKED STATE ─────────────────────────────────────────────────────────
  if (!loadingRestrictions && restrictions && !restrictions.withdrawalsEnabled) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 sm:space-y-5 fade-up">
        <div className="rounded-2xl p-6 sm:p-8 text-center relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg,#1a0c0a,#2a1505)', border: '2px solid rgba(249,115,22,.35)' }}>
          <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full opacity-10 pointer-events-none"
            style={{ background: 'radial-gradient(circle,#F97316,transparent 70%)' }} />
          <div className="relative z-10">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(249,115,22,.2)' }}>
              <ShieldAlert size={28} style={{ color: '#F97316' }} />
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-bold mb-2" style={{ color: '#FED7AA' }}>
              Withdrawals Blocked
            </h2>
            <p className="text-sm leading-relaxed max-w-md mx-auto" style={{ color: 'rgba(254,215,170,.7)' }}>
              {restrictions.withdrawalsBlockReason || 'Withdrawal capability is currently restricted on this account.'}
            </p>
          </div>
        </div>

        {(restrictions.withdrawalRequirements || []).length > 0 && (
          <div className="rounded-2xl border p-4 sm:p-6"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
            <h3 className="font-bold text-sm mb-4">Requirements to Restore Withdrawals</h3>
            <div className="space-y-3">
              {restrictions.withdrawalRequirements.map((req: any, i: number) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: 'var(--color-bg)' }}>
                  {req.fulfilled
                    ? <CheckCircle size={15} className="text-emerald-500 flex-shrink-0" />
                    : <Clock       size={15} className="text-amber-500  flex-shrink-0" />
                  }
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{req.label}</p>
                    {req.notes && (
                      <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>{req.notes}</p>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${
                    req.fulfilled ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {req.fulfilled ? 'Done' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 p-4 rounded-xl"
          style={{ background: 'rgba(59,130,246,.06)', border: '1px solid rgba(59,130,246,.2)' }}>
          <p className="text-xs text-blue-600">
            <strong>Deposits remain available.</strong>{' '}
            Contact support at <strong>+1 (888) 639-2265</strong> or <strong>compliance@nexabank.com</strong>.
          </p>
        </div>
      </div>
    )
  }

  // ── Normal form ───────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl space-y-4 sm:space-y-5 fade-up">
      {/* Pending approval notice 
      <div className="flex items-start gap-3 p-4 rounded-xl"
        style={{ background: 'rgba(245,158,11,.06)', border: '1px solid rgba(245,158,11,.3)' }}>
        <Clock size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs sm:text-sm text-amber-700 font-medium leading-relaxed">
          <strong>Withdrawals require admin approval.</strong> Your request will be submitted as pending — 
          your balance will only be deducted once an administrator approves it.
        </p>
      </div>
      */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        <div className="lg:col-span-2 space-y-4 sm:space-y-5">

          {/* Method picker */}
          <Card className="p-4 sm:p-6">
            <SectionHeader title="Withdrawal Method" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5">
              {METHODS.map(m => (
                <button key={m.id} onClick={() => setMethod(m.id)}
                  className="flex items-center gap-2 sm:gap-2.5 p-2.5 sm:p-3 rounded-xl border-2 text-xs font-semibold transition-all font-sans cursor-pointer"
                  style={{
                    borderColor: method === m.id ? '#10B981' : 'var(--color-border)',
                    background:  method === m.id ? 'rgba(16,185,129,.08)' : 'var(--color-surface)',
                    color:       method === m.id ? '#10B981' : 'var(--color-muted)',
                  }}>
                  <m.icon size={14} className="flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{m.label}</p>
                    <p className="opacity-60">{m.feeLabel}</p>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          {/* Details form */}
          <Card className="p-4 sm:p-6">
            <SectionHeader title="Withdrawal Details" />

            {(method === 'ach' || method === 'wire') && (
              <div className="space-y-4 mb-5">
                <Input label="Bank Name" placeholder="Recipient bank" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  <Input label="CVV"    placeholder="•••"   className="font-mono" />
                </div>
              </div>
            )}

            {isCrypto && (
              <div className="space-y-4 mb-5">
                <div className="grid grid-cols-2 gap-3">
                  <Select label="Coin"    value={coin}    onChange={e => setCoin(e.target.value)}>
                    {COINS.map(c => <option key={c}>{c}</option>)}
                  </Select>
                  <Select label="Network" value={network} onChange={e => setNetwork(e.target.value)}>
                    {NETWORKS.map(n => <option key={n}>{n}</option>)}
                  </Select>
                </div>
                <Input label="Recipient Wallet Address" placeholder="0x…" value={wallet}
                  onChange={e => setWallet(e.target.value)} className="font-mono" />
                <div className="flex gap-2.5 p-3 rounded-xl bg-amber-50">
                  <AlertTriangle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">
                    Crypto withdrawals are <strong>irreversible</strong>. Double-check the wallet address.
                  </p>
                </div>
              </div>
            )}

            <Input label="Amount (USD)" type="number" min="0.01" step="0.01" placeholder="0.00"
              prefix="$" value={amount} onChange={e => setAmount(e.target.value)} className="font-mono"
              hint={isCrypto && num > 0 ? `≈ ${coinAmt} ${coin}` : `Available: ${fmtUSD(user?.balance || 0)}`} />

            {/* Fee summary */}
            <div className="mt-4 rounded-xl p-4 text-sm space-y-2" style={{ background: 'var(--color-bg)' }}>
              <div className="flex justify-between">
                <span style={{ color: 'var(--color-muted)' }}>Amount</span>
                <span className="font-mono">{fmtUSD(num)}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--color-muted)' }}>Network Fee</span>
                <span className="font-mono">{fmtUSD(fee)}</span>
              </div>
              <Divider />
              <div className="flex justify-between font-semibold">
                <span>Total (on approval)</span>
                <span className="font-mono text-red-500">{fmtUSD(total)}</span>
              </div>
              {total > (user?.balance || 0) && (
                <p className="text-xs text-red-500 font-medium">⚠ Insufficient balance</p>
              )}
            </div>

            <Button variant="primary" size="lg" className="w-full mt-4"
              onClick={handleWithdraw} loading={loading}
              disabled={total > (user?.balance || 0) || num <= 0}>
              Submit Withdrawal Request
            </Button>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card className="p-4 sm:p-5">
            <SectionHeader title="How it works" />
            <div className="space-y-3">
              {[
                { step: '1', label: 'Submit request', desc: 'Your withdrawal is submitted as pending' },
                { step: '2', label: 'Admin reviews',  desc: 'An administrator approves or rejects' },
                { step: '3', label: 'Funds deducted', desc: 'Balance only debited upon approval' },
              ].map(({ step, label, desc }) => (
                <div key={step} className="flex gap-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5"
                    style={{ background: '#10B981' }}>
                    {step}
                  </div>
                  <div>
                    <p className="text-xs font-semibold">{label}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4 sm:p-5">
            <SectionHeader title="Limits" />
            {[
              ['Per Request', '$10,000'],
              ['Daily',       '$25,000'],
              ['Monthly',     '$100,000'],
            ].map(([l, v]) => (
              <div key={l} className="flex justify-between py-2.5 border-b last:border-0"
                style={{ borderColor: 'var(--color-border)' }}>
                <span className="text-xs" style={{ color: 'var(--color-muted)' }}>{l}</span>
                <span className="text-xs font-bold font-mono">{v}</span>
              </div>
            ))}
          </Card>

          <Card className="p-4 sm:p-5" style={{ background: 'var(--color-bg)' }}>
            <p className="text-xs font-semibold mb-1" style={{ color: 'var(--color-muted)' }}>
              Current Balance
            </p>
            <p className="text-xl sm:text-2xl font-bold font-mono" style={{ color: '#10B981' }}>
              {fmtUSD(user?.balance || 0)}
            </p>
            {num > 0 && num <= (user?.balance || 0) && (
              <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
                Balance after approval:{' '}
                <strong className="text-red-500">{fmtUSD((user?.balance || 0) - total)}</strong>
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
