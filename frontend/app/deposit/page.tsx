'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/store/auth'
import { api, fmtUSD, COIN_PRICES } from '@/lib/api'
import { Card, Button, Input, Select, SectionHeader, SuccessScreen } from '@/components/ui'
import { Building, CreditCard, Bitcoin, DollarSign, Smartphone, Copy, Check, Shield, AlertTriangle } from 'lucide-react'

const ICON_MAP: Record<string, React.ElementType> = {
  bitcoin: Bitcoin, building: Building, card: CreditCard,
  dollar: DollarSign, phone: Smartphone
}

const DEFAULT_METHODS = [
  { id:'bank_transfer', label:'Bank Transfer',     icon:'building', fee:'0',    feeType:'fixed',   category:'bank',    enabled:true,
    details:{ bankName:'NexaBank Federal', accountNumber:'0012349876', routingNumber:'021000021', swiftCode:'NEXAUS33', reference:'Use your account number as reference' },
    instructions:'Transfer funds directly from your bank. Allow 1-3 business days.', image:'' },
  { id:'ach',           label:'ACH Transfer',      icon:'building', fee:'0',    feeType:'fixed',   category:'bank',    enabled:true,
    details:{ routingNumber:'021000021', accountNumber:'0012349876', accountType:'Checking' },
    instructions:'ACH transfers settle in 1-2 business days.', image:'' },
  { id:'wire',          label:'Wire Transfer',     icon:'building', fee:'15',   feeType:'fixed',   category:'bank',    enabled:true,
    details:{ bankName:'NexaBank Federal', routingNumber:'021000021', accountNumber:'0012349876', swiftCode:'NEXAUS33', address:'100 NexaBank Plaza, New York, NY 10001' },
    instructions:'Wire transfers are same-day domestic and 1-2 days international.', image:'' },
  { id:'card',          label:'Debit/Credit Card', icon:'card',     fee:'2.5',  feeType:'percent', category:'card',    enabled:true,
    details:{}, instructions:'Instant credit to your account. 2.5% processing fee applies.', image:'' },
  { id:'crypto_btc',   label:'Bitcoin (BTC)',      icon:'bitcoin',  fee:'2.50', feeType:'fixed',   category:'crypto',  enabled:true,
    details:{ walletAddress:'1A1zP1eP5QGefi2DMPTfTL5SLmv7Divfna', network:'Bitcoin Mainnet', confirmations:'3 confirmations required', minDeposit:'$10' },
    instructions:'Send BTC to the address above. Credited after 3 network confirmations (~30 min).', image:'' },
  { id:'crypto_eth',   label:'Ethereum (ETH)',     icon:'bitcoin',  fee:'2.50', feeType:'fixed',   category:'crypto',  enabled:true,
    details:{ walletAddress:'0x742d35Cc6634C0532925a3b8D4C9D5E123', network:'Ethereum Mainnet (ERC-20)', confirmations:'12 confirmations required', minDeposit:'$10' },
    instructions:'Send ETH to the address above. Credited after 12 confirmations (~3 min).', image:'' },
  { id:'crypto_usdt',  label:'USDT (Tether)',      icon:'bitcoin',  fee:'2.50', feeType:'fixed',   category:'crypto',  enabled:true,
    details:{ walletAddress:'TMuA6YqfCeX8EkvNsmwk9jMDHBHe2bGaAi', network:'TRC-20 (Tron)', confirmations:'20 confirmations required', minDeposit:'$10' },
    instructions:'Send USDT (TRC-20) only. Using ERC-20 will result in loss of funds.', image:'' },
  { id:'crypto_sol',   label:'Solana (SOL)',       icon:'bitcoin',  fee:'2.50', feeType:'fixed',   category:'crypto',  enabled:true,
    details:{ walletAddress:'4Nd1maDLH4SXCvCeXAE8zx4L7KxCFy1kHgr1', network:'Solana Mainnet', confirmations:'32 confirmations required', minDeposit:'$10' },
    instructions:'Send SOL to the address above. Credited in ~30 seconds.', image:'' },
  { id:'paypal',       label:'PayPal',             icon:'dollar',   fee:'0',    feeType:'fixed',   category:'digital', enabled:true,
    details:{ email:'deposits@nexabank.com', note:'Include your NexaBank account number in the note' },
    instructions:'Send to our PayPal email. Include your account number as the note.', image:'' },
  { id:'cashapp',      label:'Cash App',           icon:'dollar',   fee:'0',    feeType:'fixed',   category:'digital', enabled:true,
    details:{ cashtag:'$NexaBankDeposit', note:'Include your NexaBank account number' },
    instructions:'Send to our $Cashtag with your account number in the note.', image:'' },
  { id:'zelle',        label:'Zelle',              icon:'phone',    fee:'0',    feeType:'fixed',   category:'digital', enabled:true,
    details:{ email:'zelle@nexabank.com', phone:'+1 (888) 639-2265' },
    instructions:'Send via Zelle using our email or phone number.', image:'' },
  { id:'venmo',        label:'Venmo',              icon:'phone',    fee:'0',    feeType:'fixed',   category:'digital', enabled:true,
    details:{ username:'@NexaBankDeposits', note:'Include your NexaBank account number' },
    instructions:'Send to @NexaBankDeposits with your account number in the note.', image:'' },
]

const COINS    = ['BTC','ETH','USDT','BNB','SOL']
const NETWORKS = ['ERC-20','TRC-20','BEP-20','Native']

export default function DepositPage() {
  const { user, refreshUser, toast } = useAuth()
  const [methods,  setMethods]  = useState(DEFAULT_METHODS)
  const [method,   setMethod]   = useState('bank_transfer')
  const [amount,   setAmount]   = useState('')
  const [note,     setNote]     = useState('')
  const [coin,     setCoin]     = useState('BTC')
  const [network,  setNetwork]  = useState('ERC-20')
  const [copied,   setCopied]   = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [result,   setResult]   = useState<any>(null)

  // Load admin-configured deposit settings — public endpoint (no admin auth required)
  useEffect(() => {
    api.settings.depositMethods()
      .then(d => { if (d.settings && Array.isArray(d.settings) && d.settings.length > 0) setMethods(d.settings) })
      .catch(() => {}) // silently fall back to DEFAULT_METHODS
  }, [])

  const enabled = methods.filter(m => m.enabled)
  const sel     = methods.find(m => m.id === method) || methods[0]
  const isCrypto = method.startsWith('crypto_')
  const num     = parseFloat(amount) || 0

  // Fee calc from settings
  const fee = sel
    ? sel.feeType === 'percent' ? parseFloat((num * parseFloat(sel.fee) / 100).toFixed(2)) : parseFloat(sel.fee || '0')
    : 0

  // Wallet address from details
  const walletAddr = (sel?.details as any)?.walletAddress || ''
  const coinAmt    = num > 0 ? (num / (COIN_PRICES[coin as keyof typeof COIN_PRICES] || 1)).toFixed(6) : '0'

  const copyAddr = () => {
    navigator.clipboard?.writeText(walletAddr).catch(() => {})
    setCopied(true); setTimeout(() => setCopied(false), 2000)
    toast('Wallet address copied!', 'success')
  }

  const handleDeposit = async () => {
    if (!num || num <= 0) { toast('Enter a valid amount', 'error'); return }
    if (num < 1) { toast('Minimum deposit is $1.00', 'error'); return }
    setLoading(true)
    try {
      const body: any = { amount: num, method, note }
      if (isCrypto) body.cryptoDetails = { coin, coinAmount: parseFloat(coinAmt), network, walletAddress: walletAddr }
      const data = await api.tx.deposit(body)
      setResult(data)
      await refreshUser()
    } catch (err: any) { toast(err.message || 'Deposit failed', 'error') }
    finally { setLoading(false) }
  }

  if (result) return (
    <SuccessScreen
      title="Deposit Initiated!"
      subtitle={`${fmtUSD(num)} will be credited to your account`}
      receiptUrl={result.receiptUrl ? `http://nexabanking.com/${result.receiptUrl}` : undefined}
      txId={result.transaction?.transactionId}
      extra={
        <div className="text-sm rounded-xl p-4 space-y-2.5 text-left" style={{ background:'var(--color-bg)' }}>
          <div className="flex justify-between"><span style={{ color:'var(--color-muted)' }}>Amount</span><span className="font-mono font-bold text-emerald-600">+{fmtUSD(num)}</span></div>
          <div className="flex justify-between"><span style={{ color:'var(--color-muted)' }}>Fee</span><span className="font-mono">{fmtUSD(fee)}</span></div>
          <div className="flex justify-between"><span style={{ color:'var(--color-muted)' }}>New Balance</span><span className="font-mono font-bold">{fmtUSD(result.newBalance)}</span></div>
          <div className="flex justify-between"><span style={{ color:'var(--color-muted)' }}>Ref</span><span className="font-mono text-xs">{result.transaction?.transactionId}</span></div>
        </div>
      }
      onAgain={() => { setResult(null); setAmount('') }}
      againLabel="Make Another Deposit"
    />
  )

  return (
    <div className="max-w-5xl space-y-4 sm:space-y-5 fade-up">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        <div className="lg:col-span-2 space-y-4 sm:space-y-5">

          {/* Method picker */}
          <Card className="p-4 sm:p-6">
            <SectionHeader title="Select Deposit Method" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5">
              {enabled.map(m => {
                const Icon = ICON_MAP[m.icon] || Building
                const feeLabel = m.feeType === 'percent' ? `${m.fee}%` : m.fee === '0' ? 'Free' : `$${m.fee}`
                return (
                  <button key={m.id} onClick={() => setMethod(m.id)}
                    className="flex items-center gap-2 sm:gap-2.5 p-2.5 sm:p-3 rounded-xl border-2 text-xs font-semibold text-left transition-all font-sans cursor-pointer"
                    style={{
                      borderColor: method===m.id ? '#10B981' : 'var(--color-border)',
                      background:  method===m.id ? 'rgba(16,185,129,.08)' : 'var(--color-surface)',
                      color:       method===m.id ? '#10B981' : 'var(--color-muted)',
                    }}>
                    <Icon size={14} className="flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{m.label}</p>
                      <p className="text-[10px] opacity-60">{feeLabel}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </Card>

          {/* Details */}
          <Card className="p-4 sm:p-6">
            <SectionHeader title={`${sel?.label || ''} Details`} />

            {/* Instructions */}
            {sel?.instructions && (
              <div className="flex gap-2.5 p-3 rounded-xl mb-5"
                style={{ background:'rgba(16,185,129,.06)', border:'1px solid rgba(16,185,129,.2)' }}>
                <Shield size={13} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-emerald-700">{sel.instructions}</p>
              </div>
            )}

            {/* Admin-configured detail fields */}
            {sel && Object.keys(sel.details || {}).length > 0 && (
              <div className="rounded-xl border divide-y mb-5"
                style={{ borderColor:'var(--color-border)' }}>
                {Object.entries(sel.details || {}).map(([key, val]) => (
                  <div key={key} className="flex items-center justify-between gap-3 px-4 py-3 flex-wrap">
                    <span className="text-xs font-semibold capitalize flex-shrink-0"
                      style={{ color:'var(--color-muted)' }}>
                      {key.replace(/_/g,' ')}
                    </span>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-xs break-all text-right">{String(val)}</span>
                      {(key.toLowerCase().includes('address') || key.toLowerCase().includes('wallet') || key.toLowerCase().includes('account') || key.toLowerCase().includes('email') || key.toLowerCase().includes('cashtag') || key.toLowerCase().includes('username')) && (
                        <button onClick={() => {
                          navigator.clipboard?.writeText(String(val)).catch(()=>{})
                          toast(`${key} copied!`, 'success')
                        }} className="flex-shrink-0 opacity-50 hover:opacity-80">
                          <Copy size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* QR / image if uploaded */}
            {sel?.image && (
              <div className="flex flex-col items-center mb-5">
                <p className="text-xs font-semibold mb-2" style={{ color:'var(--color-muted)' }}>Scan to Pay</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={sel.image} alt="Payment QR code"
                  className="w-40 h-40 object-contain rounded-2xl border p-2"
                  style={{ borderColor:'var(--color-border)', background:'var(--color-surface)' }} />
              </div>
            )}

            {/* Crypto-specific extras */}
            {isCrypto && (
              <div className="space-y-3 mb-5">
                <div className="grid grid-cols-2 gap-3">
                  <Select label="Coin" value={coin} onChange={e => setCoin(e.target.value)}>
                    {COINS.map(c => <option key={c}>{c}</option>)}
                  </Select>
                  <Select label="Network" value={network} onChange={e => setNetwork(e.target.value)}>
                    {NETWORKS.map(n => <option key={n}>{n}</option>)}
                  </Select>
                </div>
                {walletAddr && (
                  <div>
                    <p className="text-sm font-semibold mb-2">Deposit Address</p>
                    <div className="flex items-center gap-3 p-3 rounded-xl border-2 border-dashed"
                      style={{ borderColor:'var(--color-border)', background:'var(--color-bg)' }}>
                      <p className="font-mono text-xs flex-1 break-all" style={{ color:'var(--color-muted)' }}>{walletAddr}</p>
                      <button onClick={copyAddr} className="flex-shrink-0">
                        {copied ? <Check size={15} className="text-emerald-500"/> : <Copy size={15} style={{ color:'var(--color-muted)' }}/>}
                      </button>
                    </div>
                  </div>
                )}
                {num > 0 && (
                  <p className="text-xs" style={{ color:'var(--color-muted)' }}>
                    ≈ <strong className="font-mono">{coinAmt} {coin}</strong> at current rate
                  </p>
                )}
                <div className="flex gap-2.5 p-3 rounded-xl" style={{ background:'rgba(245,158,11,.06)', border:'1px solid rgba(245,158,11,.2)' }}>
                  <AlertTriangle size={13} className="text-amber-600 flex-shrink-0 mt-0.5"/>
                  <p className="text-xs text-amber-700">Only send the correct coin on the correct network. Incorrect network = permanent loss of funds.</p>
                </div>
              </div>
            )}

            {/* Card form */}
            {method === 'card' && (
              <div className="space-y-3 mb-5">
                <Input label="Card Number" placeholder="1234 5678 9012 3456" className="font-mono"/>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Expiry" placeholder="MM/YY" className="font-mono"/>
                  <Input label="CVV"    placeholder="•••"   className="font-mono"/>
                </div>
                <Input label="Cardholder Name" placeholder="Full name on card"/>
              </div>
            )}

            {/* Amount */}
            <div className="space-y-4">
              <Input label="Amount (USD)" type="number" min="1" step="0.01" placeholder="0.00"
                prefix="$" value={amount} onChange={e => setAmount(e.target.value)} className="font-mono"
                hint={`Balance after: ${fmtUSD((user?.balance||0)+num)}`}/>
              <div className="rounded-xl p-4 text-sm space-y-2" style={{ background:'var(--color-bg)' }}>
                <div className="flex justify-between">
                  <span style={{ color:'var(--color-muted)' }}>Processing Fee</span>
                  <span className="font-mono">{fee > 0 ? fmtUSD(fee) : 'Free'}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Net Deposit</span>
                  <span className="font-mono text-emerald-600">{fmtUSD(Math.max(0,num-fee))}</span>
                </div>
              </div>
              <Input label="Note (optional)" placeholder="Reference or description" value={note} onChange={e=>setNote(e.target.value)}/>
              <Button variant="primary" size="lg" className="w-full" onClick={handleDeposit} loading={loading}>
                Deposit {num>0?fmtUSD(num):'Funds'}
              </Button>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card className="p-4 sm:p-5">
            <SectionHeader title="Deposit Limits"/>
            {[['Minimum','$1.00'],['Per Transaction','$50,000'],['Daily','$50,000'],['Monthly','$250,000']].map(([l,v])=>(
              <div key={l} className="flex justify-between py-2.5 border-b last:border-0" style={{ borderColor:'var(--color-border)' }}>
                <span className="text-xs" style={{ color:'var(--color-muted)' }}>{l}</span>
                <span className="text-xs font-bold font-mono">{v}</span>
              </div>
            ))}
          </Card>
          <div className="flex gap-3 p-4 rounded-xl bg-emerald-50">
            <Shield size={15} className="text-emerald-700 flex-shrink-0 mt-0.5"/>
            <p className="text-xs text-emerald-700">All deposits are FDIC insured up to $250,000 and protected with 256-bit encryption.</p>
          </div>
          <Card className="p-4 sm:p-5">
            <SectionHeader title="Current Balance"/>
            <p className="text-xl sm:text-2xl font-bold font-mono" style={{ color:'#10B981' }}>{fmtUSD(user?.balance||0)}</p>
            {num>0 && <p className="text-xs mt-1" style={{ color:'var(--color-muted)' }}>After deposit: <strong>{fmtUSD((user?.balance||0)+Math.max(0,num-fee))}</strong></p>}
          </Card>
        </div>
      </div>
    </div>
  )
}