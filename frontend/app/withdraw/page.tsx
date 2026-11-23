'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/store/auth'
import { api, fmtUSD, COIN_PRICES } from '@/lib/api'
import { Card, Button, Input, Select, SectionHeader, Divider } from '@/components/ui'
import { Building, CreditCard, Bitcoin, AlertTriangle, ShieldAlert, Clock, CheckCircle, ArrowRight, Globe } from 'lucide-react'
import Link from 'next/link'
import { TransactionAuthModal } from '@/components/shared/TransactionAuthModal'

const METHODS = [
  { id: 'ach',           label: 'ACH Transfer',        icon: Building,  fee: 0,    feeLabel: 'Free'  },
  { id: 'wire',          label: 'Wire Transfer',        icon: Building,  fee: 25,   feeLabel: '$25'   },
  { id: 'iban',          label: 'IBAN / Int\'l Wire',   icon: Globe,     fee: 30,   feeLabel: '$30'   },
  { id: 'card',          label: 'Debit Card',           icon: CreditCard,fee: 1.50, feeLabel: '$1.50' },
  { id: 'crypto_btc',    label: 'Bitcoin (BTC)',        icon: Bitcoin,   fee: 5,    feeLabel: '$5.00' },
  { id: 'crypto_eth',    label: 'Ethereum (ETH)',       icon: Bitcoin,   fee: 5,    feeLabel: '$5.00' },
  { id: 'crypto_usdt',   label: 'USDT',                 icon: Bitcoin,   fee: 5,    feeLabel: '$5.00' },
  { id: 'crypto_sol',    label: 'Solana (SOL)',         icon: Bitcoin,   fee: 5,    feeLabel: '$5.00' },
]

const COINS    = ['BTC','ETH','USDT','BNB','SOL']
const NETWORKS = ['ERC-20','TRC-20','BEP-20','Native']

const IBAN_COUNTRIES = [
  { code: 'NO', label: 'Norway (NO)',         digits: 15 },
  { code: 'GB', label: 'United Kingdom (GB)', digits: 22 },
  { code: 'DE', label: 'Germany (DE)',         digits: 22 },
  { code: 'FR', label: 'France (FR)',          digits: 27 },
  { code: 'ES', label: 'Spain (ES)',           digits: 24 },
  { code: 'IT', label: 'Italy (IT)',           digits: 27 },
  { code: 'NL', label: 'Netherlands (NL)',     digits: 18 },
  { code: 'SE', label: 'Sweden (SE)',          digits: 24 },
  { code: 'DK', label: 'Denmark (DK)',         digits: 18 },
  { code: 'FI', label: 'Finland (FI)',         digits: 18 },
  { code: 'BE', label: 'Belgium (BE)',         digits: 16 },
  { code: 'AT', label: 'Austria (AT)',         digits: 20 },
  { code: 'CH', label: 'Switzerland (CH)',     digits: 21 },
  { code: 'PL', label: 'Poland (PL)',          digits: 28 },
  { code: 'PT', label: 'Portugal (PT)',        digits: 25 },
  { code: 'IE', label: 'Ireland (IE)',         digits: 22 },
  { code: 'OTHER', label: 'Other country',    digits: 0  },
]

function formatIBAN(raw: string) {
  const clean = raw.replace(/\s/g, '').toUpperCase().replace(/[^A-Z0-9]/g, '')
  return clean.replace(/(.{4})/g, '$1 ').trim()
}

function validateSWIFT(swift: string) {
  return /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(swift.replace(/\s/g,'').toUpperCase())
}

export default function WithdrawPage() {
  const { user, toast } = useAuth()

  const [method,  setMethod]  = useState('ach')
  const [amount,  setAmount]  = useState('')
  const [wallet,  setWallet]  = useState('')
  const [coin,    setCoin]    = useState('BTC')
  const [network, setNetwork] = useState('ERC-20')
  const [loading, setLoading] = useState(false)
  const [result,  setResult]  = useState<any>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)

  const [ibanCountry,  setIbanCountry]  = useState('')
  const [ibanNumber,   setIbanNumber]   = useState('')
  const [swiftBic,     setSwiftBic]     = useState('')
  const [beneficiary,  setBeneficiary]  = useState('')
  const [beneficiaryAddress, setBeneficiaryAddress] = useState('')
  const [accountType,  setAccountType]  = useState<'Checking' | 'Savings'>('Checking')
  const [bankName,     setBankName]     = useState('')
  const [bankAddress,  setBankAddress]  = useState('')
  const [routingNumber, setRoutingNumber] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [referenceMemo, setReferenceMemo] = useState('')

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
  const isIBAN   = method === 'iban'
  const fee      = sel.fee
  const total    = num + fee
  const coinAmt  = num > 0
    ? (num / COIN_PRICES[coin as keyof typeof COIN_PRICES]).toFixed(6)
    : '0'

  const selectedCountry = IBAN_COUNTRIES.find(c => c.code === ibanCountry)
  const ibanRaw = ibanNumber.replace(/\s/g, '')
  const expectedLen = (ibanCountry && ibanCountry !== 'OTHER' && selectedCountry) ? selectedCountry.digits : ibanRaw.length

  const ibanValid = !ibanCountry
    ? false
    : ibanCountry === 'OTHER'
      ? ibanRaw.length >= 15
      : ibanRaw.toUpperCase().startsWith(ibanCountry) && ibanRaw.length === expectedLen

  const swiftValid = swiftBic.length > 0 ? validateSWIFT(swiftBic) : false

  const handleWithdraw = async () => {
    if (!num || num <= 0)             { toast('Enter a valid amount', 'error'); return }
    if (total > (user?.balance || 0)) { toast(`Insufficient funds. You need ${fmtUSD(total)}`, 'error'); return }
    if (isCrypto && !wallet)          { toast('Enter recipient wallet address', 'error'); return }

    if (isIBAN) {
      if (!ibanCountry) { toast('Please select the recipient country', 'error'); return }
      if (!ibanValid)   { toast('Please enter a valid IBAN number', 'error'); return }
      if (!swiftValid)  { toast('Please enter a valid SWIFT/BIC code (8 or 11 characters)', 'error'); return }
      if (!beneficiary) { toast('Enter the beneficiary name', 'error'); return }
    }

    if (method === 'ach') {
      if (!beneficiary.trim())   { toast('Enter the beneficiary name', 'error'); return }
      if (!bankName.trim())      { toast('Enter the recipient bank name', 'error'); return }
      if (!routingNumber.trim()) { toast('Enter the routing number', 'error'); return }
      if (!accountNumber.trim()) { toast('Enter the account number', 'error'); return }
    }

    if (method === 'wire') {
      if (!beneficiary.trim())        { toast('Enter Beneficiary Full Legal Name', 'error'); return }
      if (!beneficiaryAddress.trim()) { toast('Enter Beneficiary Address', 'error'); return }
      if (!bankName.trim())           { toast('Enter Bank Name', 'error'); return }
      if (!bankAddress.trim())        { toast('Enter Bank physical address or branch', 'error'); return }
      if (!routingNumber.trim())      { toast('Enter ABA Wire Routing Number', 'error'); return }
      if (!accountNumber.trim())      { toast('Enter Account Number', 'error'); return }
    }

    setShowAuthModal(true)
  }

  const executeWithdraw = async (pin: string, trackTokenNumber?: string) => {
    setLoading(true)
    try {
      const body: any = { amount: num, method, pin, trackTokenNumber }
      if (isCrypto) body.cryptoDetails = { coin, coinAmount: parseFloat(coinAmt), network, walletAddress: wallet }
      if (isIBAN) body.bankDetails = {
        iban: ibanRaw.toUpperCase(),
        swiftBic: swiftBic.replace(/\s/g,'').toUpperCase(),
        beneficiaryName: beneficiary,
        bankName,
        bankAddress,
        country: ibanCountry,
      }
      if (method === 'ach' || method === 'wire') {
        body.note = referenceMemo.trim() || undefined
        body.bankDetails = {
          beneficiaryName: beneficiary.trim(),
          beneficiaryAddress: beneficiaryAddress.trim(),
          accountType,
          bankName: bankName.trim(),
          bankAddress: bankAddress.trim(),
          routingNumber: routingNumber.trim(),
          accountNumber: accountNumber.trim(),
          referenceMemo: referenceMemo.trim(),
        }
      }
      const data = await api.tx.withdraw(body)
      setResult(data)
    } catch (err: any) {
      toast(err.message || 'Withdrawal failed', 'error')
    } finally {
      setLoading(false)
      setShowAuthModal(false)
    }
  }

  if (result) return (
    <div className="max-w-md mx-auto fade-up">
      <Card className="p-6 sm:p-8 text-center rounded-3xl shadow-float">
        <div className="w-[72px] h-[72px] rounded-full flex items-center justify-center mx-auto mb-5 bg-amber-50 text-amber-500">
          <Clock size={34} />
        </div>

        <h2 className="text-xl sm:text-2xl font-display font-bold mb-2 text-[#002B5B]">Withdrawal Submitted</h2>
        <p className="text-sm mb-6 text-slate-500">
          Your request is now <strong className="text-amber-600">pending admin approval</strong>.
          Your balance will only be deducted once approved.
        </p>

        <div className="rounded-2xl p-4 space-y-2.5 text-left mb-6 bg-[#F4F7FC]">
          {isIBAN && (
            <>
              <div className="flex justify-between gap-3">
                <span className="text-xs text-slate-500">Method</span>
                <span className="text-xs font-semibold text-[#002B5B]">IBAN / International Wire</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-xs text-slate-500">IBAN</span>
                <span className="font-mono text-xs text-[#002B5B]">{formatIBAN(ibanRaw)}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-xs text-slate-500">SWIFT/BIC</span>
                <span className="font-mono text-xs text-[#002B5B]">{swiftBic.toUpperCase()}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-xs text-slate-500">Beneficiary</span>
                <span className="text-xs font-semibold truncate max-w-[180px] text-[#002B5B]">{beneficiary}</span>
              </div>
              <Divider />
            </>
          )}
          {(method === 'ach' || method === 'wire') && (
            <>
              <div className="flex justify-between gap-3">
                <span className="text-xs text-slate-500">Method</span>
                <span className="text-xs font-semibold text-[#002B5B]">{method === 'ach' ? 'ACH Transfer' : 'Wire Transfer'}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-xs text-slate-500">Beneficiary</span>
                <span className="text-xs font-semibold truncate max-w-[180px] text-[#002B5B]">{beneficiary}</span>
              </div>
              {beneficiaryAddress && (
                <div className="flex justify-between gap-3">
                  <span className="text-xs text-slate-500">Beneficiary Address</span>
                  <span className="text-xs text-right max-w-[190px] text-[#002B5B]">{beneficiaryAddress}</span>
                </div>
              )}
              <div className="flex justify-between gap-3">
                <span className="text-xs text-slate-500">Account Type</span>
                <span className="text-xs font-semibold text-[#002B5B]">{accountType}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-xs text-slate-500">Bank</span>
                <span className="text-xs font-semibold truncate max-w-[180px] text-[#002B5B]">{bankName}</span>
              </div>
              {bankAddress && (
                <div className="flex justify-between gap-3">
                  <span className="text-xs text-slate-500">Bank Branch / Address</span>
                  <span className="text-xs text-right max-w-[190px] text-[#002B5B]">{bankAddress}</span>
                </div>
              )}
              <div className="flex justify-between gap-3">
                <span className="text-xs text-slate-500">{method === 'wire' ? 'ABA Wire Routing' : 'Routing Number'}</span>
                <span className="font-mono text-xs text-[#002B5B]">{routingNumber}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-xs text-slate-500">Account No.</span>
                <span className="font-mono text-xs text-[#002B5B]">•••{accountNumber.slice(-4)}</span>
              </div>
              {referenceMemo && (
                <div className="flex justify-between gap-3">
                  <span className="text-xs text-slate-500">Reference / Memo</span>
                  <span className="text-xs text-right max-w-[190px] text-[#002B5B]">{referenceMemo}</span>
                </div>
              )}
              <Divider />
            </>
          )}
          <div className="flex justify-between gap-3">
            <span className="text-xs text-slate-500">Amount Requested</span>
            <span className="font-mono font-bold text-sm text-[#002B5B]">{fmtUSD(num)}</span>
          </div>
          {fee > 0 && (
            <div className="flex justify-between gap-3">
              <span className="text-xs text-slate-500">Fee</span>
              <span className="font-mono text-sm text-[#002B5B]">{fmtUSD(fee)}</span>
            </div>
          )}
          <div className="flex justify-between gap-3">
            <span className="text-xs text-slate-500">Total on Approval</span>
            <span className="font-mono font-bold text-sm text-red-500">-{fmtUSD(total)}</span>
          </div>
          <Divider />
          <div className="flex justify-between gap-3">
            <span className="text-xs text-slate-500">Current Balance</span>
            <span className="font-mono font-bold text-sm text-[#059669]">{fmtUSD(result.currentBalance ?? user?.balance ?? 0)}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-xs text-slate-500">Status</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
              Pending Approval
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-xs text-slate-500">Reference</span>
            <span className="font-mono text-xs truncate max-w-[180px] text-[#002B5B]">{result.transaction?.transactionId}</span>
          </div>
        </div>

        <div className="flex gap-2.5 p-3.5 rounded-2xl mb-6 text-left bg-[#EBF2FF] border border-blue-200/70">
          <AlertTriangle size={14} className="text-[#0052CC] flex-shrink-0 mt-0.5" />
          <p className="text-xs text-[#002B5B]">
            You will receive a notification once your withdrawal is approved or rejected by an administrator.
            <strong> No funds have been deducted</strong> from your account yet.
            {isIBAN && <> International IBAN transfers typically settle in <strong>1–3 business days</strong> after approval.</>}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/history" className="flex-1">
            <Button variant="secondary" className="w-full justify-center">
              View in History
            </Button>
          </Link>
          <Button variant="primary" className="flex-1 justify-center"
            onClick={() => {
              setResult(null); setAmount(''); setWallet('')
              setIbanNumber(''); setSwiftBic(''); setBeneficiary('')
              setBeneficiaryAddress(''); setAccountType('Checking')
              setBankName(''); setBankAddress('')
              setRoutingNumber(''); setAccountNumber(''); setReferenceMemo('')
            }}>
            New Withdrawal <ArrowRight size={14} />
          </Button>
        </div>
      </Card>
    </div>
  )

  const kyc = (user as any)?.kyc
  if (kyc === 'Pending') {
    return (
      <div className="max-w-xl mx-auto mt-8 fade-up">
        <Card className="p-8 text-center rounded-3xl shadow-float">
          <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 mx-auto mb-5">
            <ShieldAlert size={30} />
          </div>
          <h2 className="text-2xl font-bold font-display text-[#002B5B] mb-2">Verification Pending</h2>
          <p className="text-sm text-slate-500 mb-2">Your KYC documents are currently under review by our team.</p>
          <p className="text-slate-400 text-xs mb-6">You&apos;ll be notified once your account is verified. This usually takes 1–2 business days.</p>
          <Button variant="secondary" onClick={() => window.location.href = '/dashboard'}>Back to Dashboard</Button>
        </Card>
      </div>
    )
  }
  if (kyc !== 'Verified') {
    return (
      <div className="max-w-xl mx-auto mt-8 fade-up">
        <Card className="p-8 text-center rounded-3xl shadow-float">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center text-red-600 mx-auto mb-5">
            <ShieldAlert size={30} />
          </div>
          <h2 className="text-2xl font-bold font-display text-[#002B5B] mb-2">{kyc === 'Rejected' ? 'KYC Declined' : 'KYC Required'}</h2>
          <p className="text-sm text-slate-500 mb-8">
            {kyc === 'Rejected'
              ? 'Your KYC submission was declined. Please re-submit your documents to make withdrawals.'
              : 'You must complete KYC verification before you can make withdrawals.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="secondary" onClick={() => window.location.href = '/dashboard'}>Back to Dashboard</Button>
            <Button variant="primary" onClick={() => window.location.href = '/kyc'}>{kyc === 'Rejected' ? 'Re-submit KYC' : 'Complete KYC'}</Button>
          </div>
        </Card>
      </div>
    )
  }

  if (!loadingRestrictions && restrictions && !restrictions.withdrawalsEnabled) {
    return (
      <div className="max-w-2xl mx-auto space-y-5 fade-up">
        <div className="rounded-3xl p-6 sm:p-8 text-center brand-card-gradient text-white shadow-float">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-white/15 text-amber-300">
            <ShieldAlert size={28} />
          </div>
          <h2 className="font-display text-xl sm:text-2xl font-bold mb-2 text-white">
            Withdrawals Blocked
          </h2>
          <p className="text-sm leading-relaxed max-w-md mx-auto text-blue-100">
            {restrictions.withdrawalsBlockReason || 'Withdrawal capability is currently restricted on this account.'}
          </p>
        </div>

        {(restrictions.withdrawalRequirements || []).length > 0 && (
          <Card className="p-5 sm:p-6">
            <SectionHeader title="Requirements to Restore Withdrawals" />
            <div className="space-y-3">
              {restrictions.withdrawalRequirements.map((req: any, i: number) => (
                <div key={i} className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#F4F7FC]">
                  {req.fulfilled
                    ? <CheckCircle size={16} className="text-[#059669] flex-shrink-0" />
                    : <Clock       size={16} className="text-amber-500 flex-shrink-0" />
                  }
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#002B5B]">{req.label}</p>
                    {req.notes && (
                      <p className="text-xs mt-0.5 text-slate-500">{req.notes}</p>
                    )}
                  </div>
                  <span
                    className="text-xs px-2.5 py-0.5 rounded-full font-semibold flex-shrink-0"
                    style={{
                      background: req.fulfilled ? '#ECFDF5' : '#FFFBEB',
                      color: req.fulfilled ? '#059669' : '#B45309',
                    }}
                  >
                    {req.fulfilled ? 'Done' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}

        <div className="flex gap-3 p-4 rounded-2xl bg-[#EBF2FF] border border-blue-200/70">
          <p className="text-xs text-[#002B5B]">
            <strong>Deposits remain available.</strong>{' '}
            Contact support at <strong>+1 (888) 639-2265</strong> or <strong>support@theblueridges.com</strong>.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl space-y-5 fade-up">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {/* Method picker */}
          <Card className="p-5 sm:p-6">
            <SectionHeader title="Withdrawal Method" sub="Select your payout destination channel" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {METHODS.map(m => {
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
                    <m.icon size={15} className="flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-semibold truncate text-[#002B5B]">{m.label}</p>
                      <p className="opacity-75">{m.feeLabel}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </Card>

          {/* Details form */}
          <Card className="p-5 sm:p-6">
            <SectionHeader title="Withdrawal Details" />

            {(method === 'ach' || method === 'wire') && (
              <div className="space-y-4 mb-5">
                <div className="rounded-2xl border border-slate-200/80 p-4 space-y-3 bg-[#F4F7FC]/60">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#0052CC]">
                    Beneficiary Information
                  </p>
                  <Input
                    label={method === 'wire' ? 'Beneficiary Full Legal Name' : 'Beneficiary Full Name'}
                    placeholder="Full legal name"
                    value={beneficiary}
                    onChange={e => setBeneficiary(e.target.value)}
                  />
                  <div className={`grid grid-cols-1 gap-3 ${method === 'wire' ? 'sm:grid-cols-3' : 'sm:grid-cols-1'}`}>
                    {method === 'wire' && (
                      <div className="sm:col-span-2">
                        <Input
                          label="Beneficiary Address"
                          placeholder="Street address, city, state, postal code"
                          value={beneficiaryAddress}
                          onChange={e => setBeneficiaryAddress(e.target.value)}
                        />
                      </div>
                    )}
                    <Select
                      label="Account Type"
                      value={accountType}
                      onChange={e => setAccountType(e.target.value as 'Checking' | 'Savings')}
                    >
                      <option value="Checking">Checking</option>
                      <option value="Savings">Savings</option>
                    </Select>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200/80 p-4 space-y-3 bg-[#F4F7FC]/60">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#0052CC]">
                    Receiving Bank Information
                  </p>
                  <Input
                    label="Bank Name"
                    placeholder="Recipient bank"
                    value={bankName}
                    onChange={e => setBankName(e.target.value)}
                  />
                  {method === 'wire' && (
                    <Input
                      label="Bank Physical Address / Branch"
                      placeholder="Branch street address, city, state"
                      value={bankAddress}
                      onChange={e => setBankAddress(e.target.value)}
                    />
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      label={method === 'wire' ? 'ABA Wire Routing Number' : 'Routing Number'}
                      placeholder="021000021"
                      className="font-mono"
                      value={routingNumber}
                      onChange={e => setRoutingNumber(e.target.value)}
                    />
                    <Input
                      label="Account Number"
                      placeholder="••••••••••"
                      className="font-mono"
                      value={accountNumber}
                      onChange={e => setAccountNumber(e.target.value)}
                    />
                  </div>
                </div>

                <Input
                  label="Reference / Memo"
                  placeholder={method === 'wire' ? 'Payment reference or memo (if requested)' : 'Payment reference or memo'}
                  value={referenceMemo}
                  onChange={e => setReferenceMemo(e.target.value)}
                />
              </div>
            )}

            {isIBAN && (
              <div className="space-y-4 mb-5">
                <div className="flex gap-2.5 p-3.5 rounded-2xl bg-[#EBF2FF] border border-blue-200/70">
                  <Globe size={15} className="text-[#0052CC] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-[#002B5B]">International Bank Transfer (IBAN)</p>
                    <p className="text-xs mt-0.5 text-slate-600">
                      For international transfers using IBAN and SWIFT/BIC. Required for Norway (NO) and other European banks. Fee: $30. Settles in 1–3 business days.
                    </p>
                  </div>
                </div>

                <Select label="Recipient Country" value={ibanCountry}
                  onChange={e => {
                    const c = e.target.value;
                    setIbanCountry(c);
                    setIbanNumber(c && c !== 'OTHER' ? c : '');
                  }}>
                  <option value="" disabled>— Select country —</option>
                  {IBAN_COUNTRIES.map(c => (
                    <option key={c.code} value={c.code}>{c.label}</option>
                  ))}
                </Select>

                <div>
                  <Input
                    label={`IBAN Number${ibanCountry && ibanCountry !== 'OTHER' ? ` (${ibanCountry} · ${expectedLen} chars)` : ''}`}
                    placeholder={ibanCountry === 'NO' ? 'NO93 8601 1117 947' : ibanCountry === 'GB' ? 'GB29 NWBK 6016 1331 9268 19' : 'Enter IBAN number…'}
                    value={ibanNumber}
                    onChange={e => {
                      let val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')
                      if (ibanCountry && ibanCountry !== 'OTHER') {
                        if (!val.startsWith(ibanCountry)) {
                          const digits = val.replace(/[A-Z]/g, '')
                          val = ibanCountry + digits
                        }
                      }
                      setIbanNumber(formatIBAN(val))
                    }}
                    className="font-mono tracking-widest"
                    hint={
                      ibanNumber.length > 0
                        ? ibanValid
                          ? '✓ Valid IBAN format'
                          : ibanCountry !== 'OTHER'
                            ? `Must start with ${ibanCountry} and be ${expectedLen} characters (currently ${ibanRaw.length})`
                            : 'Enter full IBAN including country prefix'
                        : undefined
                    }
                  />
                  {ibanNumber.length > 0 && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-xs font-medium" style={{ color: ibanValid ? '#059669' : '#EF4444' }}>
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: ibanValid ? '#10B981' : '#EF4444' }} />
                      {ibanValid ? 'IBAN format looks correct' : 'IBAN format is invalid'}
                    </div>
                  )}
                </div>

                <div>
                  <Input
                    label="SWIFT / BIC Code"
                    placeholder="e.g. DNBANOKK or DNBANOKK030"
                    value={swiftBic}
                    onChange={e => setSwiftBic(e.target.value.toUpperCase())}
                    className="font-mono tracking-widest"
                    hint="8 or 11 characters — find on your bank statement or online banking"
                  />
                  {swiftBic.length > 0 && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-xs font-medium" style={{ color: swiftValid ? '#059669' : '#EF4444' }}>
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: swiftValid ? '#10B981' : '#EF4444' }} />
                      {swiftValid ? 'SWIFT/BIC format looks correct' : 'SWIFT/BIC must be 8 or 11 characters (letters/digits)'}
                    </div>
                  )}
                </div>

                <Input
                  label="Beneficiary Full Name"
                  placeholder="Full legal name as registered at the bank"
                  value={beneficiary}
                  onChange={e => setBeneficiary(e.target.value)}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Recipient Bank Name"
                    placeholder="e.g. DNB Bank ASA"
                    value={bankName}
                    onChange={e => setBankName(e.target.value)}
                  />
                  <Input
                    label="Bank Address (optional)"
                    placeholder="e.g. Dronning Eufemias gate 30, Oslo"
                    value={bankAddress}
                    onChange={e => setBankAddress(e.target.value)}
                  />
                </div>

                {ibanCountry === 'NO' && (
                  <div className="rounded-2xl p-4 space-y-1.5 bg-[#F4F7FC] border border-slate-200/70">
                    <p className="text-xs font-bold text-[#0052CC]">🇳🇴 Norway IBAN Guide</p>
                    <p className="text-xs text-slate-600">
                      • Norwegian IBANs are <strong>15 characters</strong>: <code className="font-mono px-1 rounded bg-white">NO + 2 check digits + 11-digit account number</code>
                    </p>
                    <p className="text-xs text-slate-600">
                      • Example: <code className="font-mono">NO93 8601 1117 947</code>
                    </p>
                    <p className="text-xs text-slate-600">
                      • Common SWIFT/BIC codes: <strong>DNBANOKK</strong> (DNB), <strong>SPSONO22</strong> (SpareBank), <strong>NDEANOKK</strong> (Nordea NO)
                    </p>
                  </div>
                )}

                <div className="flex gap-2.5 p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80">
                  <AlertTriangle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800">
                    Double-check the IBAN and SWIFT/BIC before submitting. Incorrect details may result in <strong>failed or misdirected transfers</strong>.
                  </p>
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
                <div className="flex gap-2.5 p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80">
                  <AlertTriangle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800">
                    Crypto withdrawals are <strong>irreversible</strong>. Double-check the wallet address.
                  </p>
                </div>
              </div>
            )}

            <Input label="Amount (USD)" type="number" min="0.01" step="0.01" placeholder="0.00"
              prefix="$" value={amount} onChange={e => setAmount(e.target.value)} className="font-mono text-base font-bold"
              hint={isCrypto && num > 0 ? `≈ ${coinAmt} ${coin}` : `Available: ${fmtUSD(user?.balance || 0)}`} />

            <div className="mt-4 rounded-2xl p-4 text-sm space-y-2 bg-[#F4F7FC]">
              <div className="flex justify-between">
                <span className="text-slate-500">Amount</span>
                <span className="font-mono text-[#002B5B]">{fmtUSD(num)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">
                  {isIBAN ? 'International Wire Fee' : 'Network Fee'}
                </span>
                <span className="font-mono text-[#002B5B]">{fmtUSD(fee)}</span>
              </div>
              <Divider />
              <div className="flex justify-between font-semibold">
                <span className="text-[#002B5B]">Total (on approval)</span>
                <span className="font-mono text-red-500">{fmtUSD(total)}</span>
              </div>
              {total > (user?.balance || 0) && (
                <p className="text-xs text-red-500 font-medium">⚠ Insufficient balance</p>
              )}
            </div>

            <Button variant="primary" size="lg" className="w-full mt-4 rounded-full"
              onClick={handleWithdraw} loading={loading}
              disabled={total > (user?.balance || 0) || num <= 0 || (isIBAN && (!ibanValid || !swiftValid || !beneficiary))}>
              Submit Withdrawal Request
            </Button>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="rounded-3xl p-5 brand-card-gradient text-white shadow-brand">
            <p className="text-xs font-medium text-blue-200 mb-1">Current Balance</p>
            <p className="text-2xl font-bold font-mono text-white">{fmtUSD(user?.balance || 0)}</p>
            {num > 0 && num <= (user?.balance || 0) && (
              <p className="text-xs mt-2 text-blue-100">
                After approval: <strong className="text-white">{fmtUSD((user?.balance || 0) - total)}</strong>
              </p>
            )}
          </div>

          <Card className="p-5">
            <SectionHeader title="How it works" />
            <div className="space-y-3">
              {[
                { step: '1', label: 'Submit request', desc: 'Your withdrawal is submitted as pending' },
                { step: '2', label: 'Admin reviews',  desc: 'An administrator approves or rejects' },
                { step: '3', label: 'Funds deducted', desc: 'Balance only debited upon approval' },
              ].map(({ step, label, desc }) => (
                <div key={step} className="flex gap-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 bg-[#0052CC]">
                    {step}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#002B5B]">{label}</p>
                    <p className="text-xs mt-0.5 text-slate-500">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <SectionHeader title="Limits" />
            {[
              ['Per Request', fmtUSD(user?.withdrawalLimit || 10000)],
              ['Daily',       '$200,000'],
              ['Monthly',     '$1,000,000'],
            ].map(([l, v]) => (
              <div key={l} className="flex justify-between py-2.5 border-b border-slate-100 last:border-0">
                <span className="text-xs text-slate-500">{l}</span>
                <span className="text-xs font-bold font-mono text-[#002B5B]">{v}</span>
              </div>
            ))}
          </Card>

          {isIBAN && (
            <Card className="p-5">
              <SectionHeader title="IBAN Transfer Info" />
              <div className="space-y-2">
                {[
                  ['Settlement', '1–3 business days'],
                  ['Fee', '$30 flat'],
                  ['Currency', 'USD sent, auto-converted'],
                  ['Supported', 'EU/EEA + international'],
                ].map(([l, v]) => (
                  <div key={l} className="flex justify-between py-1.5 border-b border-slate-100 last:border-0">
                    <span className="text-xs text-slate-500">{l}</span>
                    <span className="text-xs font-semibold text-[#002B5B]">{v}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card className="p-5">
            <SectionHeader title="Need Help?" />
            <p className="text-xs mb-1.5 text-slate-500">Contact support:</p>
            <p className="text-xs font-semibold text-[#0052CC]">support@theblueridges.com</p>
          </Card>
        </div>
      </div>
      <TransactionAuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} onConfirm={executeWithdraw} />
    </div>
  )
}
