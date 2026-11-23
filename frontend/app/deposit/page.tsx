'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/store/auth'
import { api, fmtUSD, COIN_PRICES } from '@/lib/api'
import { Card, Button, Input, Select, SectionHeader, SuccessScreen } from '@/components/ui'
import { Building, CreditCard, Bitcoin, DollarSign, Smartphone, Copy, Check, Shield, AlertTriangle } from 'lucide-react'
import { TransactionAuthModal } from '@/components/shared/TransactionAuthModal'

const ICON_MAP: Record<string, React.ElementType> = {
  bitcoin: Bitcoin, building: Building, card: CreditCard,
  dollar: DollarSign, phone: Smartphone
}

const DEFAULT_METHODS = [
  { id:'bank_transfer', label:'Bank Transfer',     icon:'building', fee:'0',    feeType:'fixed',   category:'bank',    enabled:true,
    details:{ bankName:'Blue Ridge Federal', accountNumber:'0012349876', routingNumber:'021000021', swiftCode:'BRBKUS33', reference:'Use your account number as reference' },
    instructions:'Transfer funds directly from your bank. Allow 1-3 business days.', image:'' },
  { id:'ach',           label:'ACH Transfer',      icon:'building', fee:'0',    feeType:'fixed',   category:'bank',    enabled:true,
    details:{ routingNumber:'021000021', accountNumber:'0012349876', accountType:'Business' },
    instructions:'ACH transfers settle in 1-2 business days.', image:'' },
  { id:'wire',          label:'Wire Transfer',     icon:'building', fee:'15',   feeType:'fixed',   category:'bank',    enabled:true,
    details:{ bankName:'Blue Ridge Federal', routingNumber:'021000021', accountNumber:'0012349876', swiftCode:'BRBKUS33', address:'100 Blue ridge Bank Plaza, New York, NY 10001' },
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
    details:{ email:'support@theblueridges.com', note:'Include your Blue ridge Bank account number in the note' },
    instructions:'Send to our PayPal email. Include your account number as the note.', image:'' },
  { id:'cashapp',      label:'Cash App',           icon:'dollar',   fee:'0',    feeType:'fixed',   category:'digital', enabled:true,
    details:{ cashtag:'$BlueRidgeBankDeposit', note:'Include your Blue ridge Bank account number' },
    instructions:'Send to our $Cashtag with your account number in the note.', image:'' },
  { id:'zelle',        label:'Zelle',              icon:'phone',    fee:'0',    feeType:'fixed',   category:'digital', enabled:true,
    details:{ email:'support@theblueridges.com', phone:'+1 (888) 639-2265' },
    instructions:'Send via Zelle using our email or phone number.', image:'' },
  { id:'venmo',        label:'Venmo',              icon:'phone',    fee:'0',    feeType:'fixed',   category:'digital', enabled:true,
    details:{ username:'@BlueRidgeBankDeposits', note:'Include your Blue ridge Bank account number' },
    instructions:'Send to @BlueRidgeBankDeposits with your account number in the note.', image:'' },
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

  useEffect(() => {
    api.settings.depositMethods()
      .then(d => { if (d.settings && Array.isArray(d.settings) && d.settings.length > 0) setMethods(d.settings) })
      .catch(() => {})
  }, [])

  const enabled = methods.filter(m => m.enabled)
  const sel     = methods.find(m => m.id === method) || methods[0]
  const isCrypto = method.startsWith('crypto_')
  const num     = parseFloat(amount) || 0

  const fee = sel
    ? sel.feeType === 'percent' ? parseFloat((num * parseFloat(sel.fee) / 100).toFixed(2)) : parseFloat(sel.fee || '0')
    : 0

  const walletAddr = (sel?.details as any)?.walletAddress || ''
  const coinAmt    = num > 0 ? (num / (COIN_PRICES[coin as keyof typeof COIN_PRICES] || 1)).toFixed(6) : '0'

  const copyAddr = () => {
    navigator.clipboard?.writeText(walletAddr).catch(() => {})
    setCopied(true); setTimeout(() => setCopied(false), 2000)
    toast('Wallet address copied!', 'success')
  }

  const [showAuthModal, setShowAuthModal] = useState(false)

  const handleDeposit = () => {
    if (!num || num <= 0) return toast('Enter a valid amount', 'error')
    if (num < 1) return toast('Minimum deposit is $1.00', 'error')
    setShowAuthModal(true)
  }

  const executeDeposit = async (pin: string, trackTokenNumber?: string) => {
    setLoading(true)
    try {
      const body: any = { amount: num, method, note, pin, trackTokenNumber }
      if (isCrypto) body.cryptoDetails = { coin, coinAmount: parseFloat(coinAmt), network, walletAddress: walletAddr }
      const data = await api.tx.deposit(body)
      setResult(data)
      setShowAuthModal(false)
      await refreshUser()
    } catch (err: any) {
      toast(err.message || 'Deposit failed', 'error')
      setShowAuthModal(false)
      throw err
    } finally {
      setLoading(false)
    }
  }

  if (result) return (
    <SuccessScreen
      title="Deposit Initiated!"
      subtitle={`${fmtUSD(num)} will be credited to your account`}
      receiptUrl={result.receiptUrl ? `http://localhost:5000${result.receiptUrl}` : undefined}
      txId={result.transaction?.transactionId}
      extra={
        <div className="text-sm rounded-2xl p-4 space-y-2.5 text-left bg-[#F4F7FC]">
          <div className="flex justify-between"><span className="text-slate-500">Amount</span><span className="font-mono font-bold text-[#059669]">+{fmtUSD(num)}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Fee</span><span className="font-mono">{fmtUSD(fee)}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">New Balance</span><span className="font-mono font-bold text-[#002B5B]">{fmtUSD(result.newBalance)}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Ref</span><span className="font-mono text-xs">{result.transaction?.transactionId}</span></div>
        </div>
      }
      onAgain={() => { setResult(null); setAmount('') }}
      againLabel="Make Another Deposit"
    />
  )

  return (
    <div className="max-w-5xl space-y-5 fade-up">
      <TransactionAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onConfirm={executeDeposit}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {/* Method picker */}
          <Card className="p-5 sm:p-6">
            <SectionHeader title="Select Deposit Method" sub="Choose your funding channel" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {enabled.map(m => {
                const Icon = ICON_MAP[m.icon] || Building
                const feeLabel = m.feeType === 'percent' ? `${m.fee}%` : m.fee === '0' ? 'Free' : `$${m.fee}`
                const active = method === m.id
                return (
                  <button
                    key={m.id}
                    onClick={() => setMethod(m.id)}
                    className="flex items-center gap-2.5 p-3 rounded-2xl border-2 text-xs font-semibold text-left transition-all font-sans cursor-pointer"
                    style={{
                      borderColor: active ? '#0052CC' : '#E2E8F0',
                      background: active ? '#EBF2FF' : '#F8FAFC',
                      color: active ? '#0052CC' : '#475569',
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{
                        background: active ? '#0052CC' : '#FFFFFF',
                        color: active ? '#FFFFFF' : '#002B5B',
                      }}
                    >
                      <Icon size={14} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-[#002B5B]">{m.label}</p>
                      <p className="text-[10px] opacity-75">{feeLabel}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </Card>

          {/* Details */}
          <Card className="p-5 sm:p-6">
            <SectionHeader title={`${sel?.label || ''} Details`} />

            {sel?.instructions && (
              <div className="flex gap-2.5 p-3.5 rounded-2xl mb-5 bg-[#EBF2FF] border border-blue-200/70">
                <Shield size={15} className="text-[#0052CC] flex-shrink-0 mt-0.5" />
                <p className="text-xs text-[#002B5B]">{sel.instructions}</p>
              </div>
            )}

            {sel && Object.keys(sel.details || {}).length > 0 && (
              <div className="rounded-2xl border border-slate-200/80 divide-y divide-slate-100 mb-5 overflow-hidden">
                {Object.entries(sel.details || {}).map(([key, val]) => (
                  <div key={key} className="flex items-center justify-between gap-3 px-4 py-3 flex-wrap bg-white">
                    <span className="text-xs font-medium capitalize flex-shrink-0 text-slate-500">
                      {key.replace(/_/g,' ')}
                    </span>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-xs font-semibold break-all text-right text-[#002B5B]">
                        {String(key === 'bankName' && (sel.id === 'bank_transfer' || sel.id === 'wire') ? 'Blue Ridge Federal' : val)}
                      </span>
                      {(key.toLowerCase().includes('address') || key.toLowerCase().includes('wallet') || key.toLowerCase().includes('account') || key.toLowerCase().includes('email') || key.toLowerCase().includes('cashtag') || key.toLowerCase().includes('username')) && (
                        <button
                          onClick={() => {
                            navigator.clipboard?.writeText(String(val)).catch(()=>{})
                            toast(`${key} copied!`, 'success')
                          }}
                          className="flex-shrink-0 text-slate-400 hover:text-[#0052CC] transition-colors cursor-pointer"
                        >
                          <Copy size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {sel?.image && (
              <div className="flex flex-col items-center mb-5">
                <p className="text-xs font-semibold mb-2 text-slate-500">Scan to Pay</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={sel.image}
                  alt="Payment QR code"
                  className="w-40 h-40 object-contain rounded-2xl border border-slate-200 p-2 bg-white shadow-card"
                />
              </div>
            )}

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
                    <p className="text-xs font-semibold text-slate-700 mb-1.5">Deposit Address</p>
                    <div className="flex items-center gap-3 p-3.5 rounded-2xl border-2 border-dashed border-slate-200 bg-[#F4F7FC]">
                      <p className="font-mono text-xs flex-1 break-all text-slate-600">{walletAddr}</p>
                      <button onClick={copyAddr} className="flex-shrink-0 cursor-pointer">
                        {copied ? <Check size={15} className="text-[#059669]"/> : <Copy size={15} className="text-slate-400 hover:text-[#0052CC]"/>}
                      </button>
                    </div>
                  </div>
                )}
                {num > 0 && (
                  <p className="text-xs text-slate-500">
                    ≈ <strong className="font-mono text-[#002B5B]">{coinAmt} {coin}</strong> at current rate
                  </p>
                )}
                <div className="flex gap-2.5 p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80">
                  <AlertTriangle size={14} className="text-amber-600 flex-shrink-0 mt-0.5"/>
                  <p className="text-xs text-amber-800">Only send the correct coin on the correct network. Incorrect network = permanent loss of funds.</p>
                </div>
              </div>
            )}

            {method === 'card' && (
              <div className="space-y-3 mb-5">
                <Input label="Card Number" placeholder="1234 5678 9012 3456" className="font-mono"/>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Expiry" placeholder="MM/YY" className="font-mono"/>
                  <Input label="CVV" placeholder="•••" className="font-mono"/>
                </div>
                <Input label="Cardholder Name" placeholder="Full name on card"/>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <Input
                  label="Amount (USD)"
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="0.00"
                  prefix="$"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="font-mono text-base font-bold"
                  hint={`Balance after: ${fmtUSD((user?.balance||0)+num)}`}
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {[100, 500, 1000, 5000].map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setAmount(String(p))}
                      className="px-3 py-1 rounded-full text-xs font-semibold bg-[#F4F7FC] hover:bg-[#EBF2FF] text-[#002B5B] border border-slate-200/80 transition-colors cursor-pointer"
                    >
                      +${p.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl p-4 text-sm space-y-2 bg-[#F4F7FC]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Processing Fee</span>
                  <span className="font-mono text-[#002B5B]">{fee > 0 ? fmtUSD(fee) : 'Free'}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span className="text-[#002B5B]">Net Deposit</span>
                  <span className="font-mono text-[#059669]">{fmtUSD(Math.max(0,num-fee))}</span>
                </div>
              </div>
              <Input label="Note (optional)" placeholder="Reference or description" value={note} onChange={e=>setNote(e.target.value)}/>
              <Button variant="primary" size="lg" className="w-full rounded-full" onClick={handleDeposit} loading={loading}>
                Deposit {num>0?fmtUSD(num):'Funds'}
              </Button>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="rounded-3xl p-5 brand-card-gradient text-white shadow-brand">
            <p className="text-xs text-blue-200 font-medium mb-1">Current Balance</p>
            <p className="text-2xl font-bold font-mono text-white">{fmtUSD(user?.balance||0)}</p>
            {num>0 && (
              <p className="text-xs mt-2 text-blue-100">
                After deposit: <strong className="text-white">{fmtUSD((user?.balance||0)+Math.max(0,num-fee))}</strong>
              </p>
            )}
          </div>

          <Card className="p-5">
            <SectionHeader title="Deposit Limits"/>
            {[['Minimum','$1.00'],['Per Transaction','$50,000'],['Daily','$50,000'],['Monthly','$250,000']].map(([l,v])=>(
              <div key={l} className="flex justify-between py-2.5 border-b border-slate-100 last:border-0">
                <span className="text-xs text-slate-500">{l}</span>
                <span className="text-xs font-bold font-mono text-[#002B5B]">{v}</span>
              </div>
            ))}
          </Card>

          <div className="flex gap-3 p-4 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0]/70">
            <Shield size={16} className="text-[#059669] flex-shrink-0 mt-0.5"/>
            <p className="text-xs text-[#065F46]">All deposits are FDIC insured up to $250,000 and protected with 256-bit encryption.</p>
          </div>

          <Card className="p-5">
            <SectionHeader title="Need Help?" />
            <p className="text-xs mb-1.5 text-slate-500">Contact support:</p>
            <p className="text-xs font-semibold text-[#0052CC]">support@theblueridges.com</p>
          </Card>
        </div>
      </div>
    </div>
  )
}
