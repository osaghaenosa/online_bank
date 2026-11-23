'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/store/auth'
import { api, fmtUSD } from '@/lib/api'
import { Card, Button, Input, Select, SectionHeader, SuccessScreen, Divider } from '@/components/ui'
import { ArrowLeft, ArrowRight, Check, CheckCircle, Clock, Info, Landmark, Search, ShieldAlert, X } from 'lucide-react'
import { TransactionAuthModal } from '@/components/shared/TransactionAuthModal'

const BANKS = [
  'Bank of America', 'Capital One', 'Chase', 'Citibank', 'Fifth Third Bank',
  'Goldman Sachs Bank USA', 'Huntington National Bank', 'JPMorgan Chase Bank',
  'KeyBank', 'PNC Bank', 'Regions Bank', 'TD Bank', 'Truist Bank',
  'U.S. Bank', 'Wells Fargo', 'Other / Enter bank name',
]

interface Recipient { _id: string; firstName: string; lastName: string; accountNumber: string; profilePicture?: string }

interface Restrictions {
  transfersEnabled: boolean
  transfersBlockReason: string
  transferRequirements: Array<{ _id: string; type: string; label: string; fulfilled: boolean; notes: string }>
}

export default function TransferPage() {
  const { user, refreshUser, toast } = useAuth()

  const [restrictions, setRestrictions] = useState<Restrictions | null>(null)
  const [showRestrictions, setShowRestrictions] = useState(false)

  const [transferMode, setTransferMode] = useState<'internal' | 'bank'>('internal')
  const [stage, setStage] = useState<'recipient' | 'amount' | 'review'>('recipient')
  const [recipientQuery, setRecipientQuery] = useState('')
  const [recipient, setRecipient] = useState<Recipient | null>(null)
  const [recipientMatches, setRecipientMatches] = useState<Recipient[]>([])
  const [searchingRecipient, setSearchingRecipient] = useState(false)
  const [showBankPicker, setShowBankPicker] = useState(false)
  const [bankSearch, setBankSearch] = useState('')
  const [isOtherBank, setIsOtherBank] = useState(false)
  const [amount,     setAmount]     = useState('')
  const [note,       setNote]       = useState('')

  const [beneficiaryName,    setBeneficiaryName]    = useState('')
  const [accountType,        setAccountType]        = useState<'Checking' | 'Savings'>('Checking')
  const [bankName,           setBankName]           = useState('')
  const [accountNumber,      setAccountNumber]      = useState('')
  const [referenceMemo,      setReferenceMemo]      = useState('')

  const [loading,    setLoading]    = useState(false)
  const [result,     setResult]     = useState<any>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const sp = new URLSearchParams(window.location.search)
    const amt = sp.get('amount')
    if (amt) setAmount(amt)
  }, [])

  const num = parseFloat(amount) || 0
  const transferLimit = user?.transferLimit || 1000000

  const searchRecipient = async () => {
    const account = recipientQuery.trim()
    if (!account) {
      toast('Enter the recipient account number', 'error')
      return
    }
    setSearchingRecipient(true)
    setRecipient(null)
    try {
      const data = await api.user.lookupAccount(account)
      setRecipientMatches(data.users || [])
      if (!data.users?.length) toast('No Blue ridge Bank account matched that number', 'error')
    } catch (err: any) {
      toast(err.message || 'Could not search accounts', 'error')
    } finally {
      setSearchingRecipient(false)
    }
  }

  const continueToAmount = () => {
    if (transferMode === 'internal') {
      if (!recipient) {
        toast('Search for and select a recipient account first', 'error')
        return
      }
    } else {
      if (!beneficiaryName.trim()) {
        toast('Enter the recipient name', 'error'); return
      }
      if (!accountNumber.trim()) {
        toast('Enter the recipient account number', 'error'); return
      }
      if (!bankName.trim()) { toast('Select the recipient bank', 'error'); return }
    }
    setStage('amount')
  }

  const continueToReview = () => {
    if (!num || num <= 0) {
      toast('Enter a valid amount', 'error')
      return
    }

    if (num > transferLimit) {
      toast(`Maximum single transfer is ${fmtUSD(transferLimit)}`, 'error')
      return
    }

    if (num > (user?.balance || 0)) {
      toast('Insufficient funds', 'error')
      return
    }
    setStage('review')
  }

  const executeSend = async (pin: string, trackTokenNumber?: string) => {
    setLoading(true)

    try {
      const payload =
        transferMode === 'bank'
          ? {
              amount: num,
              method: 'bank_transfer',
              note: referenceMemo.trim() || undefined,
              bankDetails: {
                beneficiaryName: beneficiaryName.trim(),
                accountType,
                bankName: bankName.trim(),
                accountNumber: accountNumber.trim(),
                referenceMemo: referenceMemo.trim(),
              },
              pin,
              trackTokenNumber,
            }
          : {
              amount: num,
              recipientAccountNumber: recipient?.accountNumber,
              note,
              pin,
              trackTokenNumber,
            }

      const data = await api.tx.transfer(payload)

      setResult(data)
      await refreshUser()

    } catch (err: any) {

      if (err.message?.includes('pending review') || err.message?.includes('blocked')) {
        toast(err.message, 'error')

        try {
          const data = await api.restrictions.get()
          setRestrictions(data)
          setShowRestrictions(true)
        } catch {}

      } else {
        toast(err.message || 'Transfer failed', 'error')
      }

    } finally {
      setLoading(false)
      setShowAuthModal(false)
    }
  }

  if (result) {
    const bankDetails = result.transaction?.metadata?.bankDetails
    const isBankResult = transferMode === 'bank' || result.transaction?.method === 'bank_transfer'
    return (
      <SuccessScreen
        title={isBankResult ? 'Bank Transfer Complete!' : 'Transfer Complete!'}
        subtitle={`${fmtUSD(num)} sent successfully`}
        receiptUrl={result.receiptUrl ? `http://localhost:5000${result.receiptUrl}` : undefined}
        txId={result.transaction?.transactionId}
        extra={
          <div className="text-sm rounded-2xl p-4 space-y-2.5 text-left bg-[#F4F7FC]">
            {isBankResult && bankDetails ? (
              <>
                <div className="flex justify-between gap-3"><span className="text-slate-500">Recipient</span><span className="font-semibold text-[#002B5B] text-right">{bankDetails.beneficiaryName}</span></div>
                <div className="flex justify-between gap-3"><span className="text-slate-500">Bank</span><span className="font-semibold text-[#002B5B] text-right">{bankDetails.bankName}</span></div>
                <div className="flex justify-between gap-3"><span className="text-slate-500">Account Type</span><span className="font-semibold text-[#002B5B]">{bankDetails.accountType}</span></div>
                <div className="flex justify-between gap-3"><span className="text-slate-500">Account Number</span><span className="font-mono text-xs text-[#002B5B]">••••{String(bankDetails.accountNumber).slice(-4)}</span></div>
                {bankDetails.referenceMemo && <div className="flex justify-between gap-3"><span className="text-slate-500">Reference / Memo</span><span className="text-xs text-[#002B5B] text-right">{bankDetails.referenceMemo}</span></div>}
                <Divider />
              </>
            ) : (
              <>
                <div className="flex justify-between"><span className="text-slate-500">To</span><span className="font-semibold text-[#002B5B]">{result.transaction?.recipientName || recipient?.firstName}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Account</span><span className="font-mono text-xs text-[#002B5B]">••••{recipient?.accountNumber.slice(-4)}</span></div>
                {note && <div className="flex justify-between"><span className="text-slate-500">Note</span><span className="text-[#002B5B]">{note}</span></div>}
              </>
            )}
            <div className="flex justify-between"><span className="text-slate-500">Amount</span><span className="font-mono font-bold text-red-500">-{fmtUSD(num)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">New Balance</span><span className="font-mono font-bold text-[#002B5B]">{fmtUSD(result.newBalance)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Ref</span><span className="font-mono text-xs text-slate-600">{result.transaction?.transactionId}</span></div>
          </div>
        }
        onAgain={() => {
          setResult(null)
          setAmount('')
          setNote('')
          setRecipientQuery('')
          setRecipient(null)
          setRecipientMatches([])
          setBeneficiaryName('')
          setAccountType('Checking')
          setBankName('')
          setAccountNumber('')
          setReferenceMemo('')
          setStage('recipient')
          setShowRestrictions(false)
        }}
        againLabel="Send Another"
      />
    )
  }

  if (showRestrictions && restrictions && !restrictions.transfersEnabled) {
    const pending = restrictions.transferRequirements.filter(r => !r.fulfilled)
    const total   = restrictions.transferRequirements.length

    return (
      <div className="max-w-2xl mx-auto space-y-5 fade-up">
        <div className="rounded-3xl p-6 sm:p-8 text-center brand-card-gradient text-white shadow-float">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-white/15 text-red-300">
            <ShieldAlert size={28} />
          </div>
          <h2 className="font-display text-xl sm:text-2xl font-bold mb-2 text-white">Transfers Pending Review</h2>
          <p className="text-sm leading-relaxed text-blue-100 max-w-md mx-auto">
            {restrictions.transfersBlockReason}
          </p>
          <div className="mt-4 inline-block px-3.5 py-1 rounded-full text-xs font-semibold bg-white/15 text-white">
            {total > 0 ? `${pending.length} of ${total} requirements pending` : 'Under review'}
          </div>
        </div>

        {total > 0 && (
          <Card className="p-5 sm:p-6">
            <SectionHeader title="Requirements to Restore Transfers" />
            <div className="space-y-3">
              {restrictions.transferRequirements.map((req, i) => (
                <div
                  key={req._id || i}
                  className="flex items-start gap-3 p-3.5 rounded-2xl border"
                  style={{
                    borderColor: req.fulfilled ? '#BFDBFE' : '#E2E8F0',
                    background: req.fulfilled ? '#EBF2FF' : '#F4F7FC',
                  }}
                >
                  {req.fulfilled
                    ? <CheckCircle size={16} className="text-[#059669] flex-shrink-0 mt-0.5" />
                    : <Clock       size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                  }
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#002B5B]">{req.label}</p>
                    {req.notes && (
                      <p className="text-xs mt-0.5 leading-relaxed text-slate-500">{req.notes}</p>
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
          <Info size={15} className="text-[#0052CC] flex-shrink-0 mt-0.5" />
          <p className="text-xs text-[#002B5B]">
            <strong>Deposits remain available.</strong> Contact support at <strong>+1 (888) 639-2265</strong> or <strong>support@theblueridges.com</strong>.
          </p>
        </div>

        <Button variant="secondary" className="w-full justify-center rounded-full"
          onClick={() => setShowRestrictions(false)}>
          ← Back to Transfer Form
        </Button>
      </div>
    )
  }

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
              ? 'Your KYC submission was declined. Please re-submit your documents to make transfers.'
              : 'You must complete KYC verification before you can make transfers.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="secondary" onClick={() => window.location.href = '/dashboard'}>Back to Dashboard</Button>
            <Button variant="primary" onClick={() => window.location.href = '/kyc'}>{kyc === 'Rejected' ? 'Re-submit KYC' : 'Complete KYC'}</Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl space-y-5 fade-up">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <Card className="p-5 sm:p-6">
            <SectionHeader title="Send Money" sub="Choose a destination, review the details, then authorize your payment." />

            <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-[#F4F7FC] border border-slate-200/70 mb-5">
              {([
                ['internal', 'To Blue ridge', Landmark],
                ['bank', 'To Other Banks', Landmark],
              ] as const).map(([mode, label, Icon]) => (
                <button key={mode} type="button" onClick={() => { setTransferMode(mode); setStage('recipient') }}
                  className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs font-semibold transition-all"
                  style={{ background: transferMode === mode ? '#002B5B' : 'transparent', color: transferMode === mode ? '#fff' : '#475569' }}>
                  <Icon size={15} />{label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 mb-5 text-xs">
              {(['recipient', 'amount', 'review'] as const).map((part, index) => (
                <div key={part} className="flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${stage === part ? 'bg-[#0052CC] text-white' : 'bg-slate-100 text-slate-500'}`}>{index + 1}</span>
                  <span className={stage === part ? 'font-semibold text-[#002B5B]' : 'text-slate-400'}>{part === 'recipient' ? 'Recipient' : part === 'amount' ? 'Amount' : 'Review'}</span>
                  {index < 2 && <span className="w-5 h-px bg-slate-200 mx-1" />}
                </div>
              ))}
            </div>

            {stage === 'recipient' && (transferMode === 'internal' ? (
              <div className="space-y-4">
                <p className="text-sm text-slate-500">Enter the recipient’s Blue ridge account number. We’ll find the matching account for you to select.</p>
                <div className="flex gap-2 items-end">
                  <Input label="Recipient Account Number" placeholder="Enter 12-digit account number" inputMode="numeric" maxLength={12} value={recipientQuery}
                    onChange={e => { setRecipientQuery(e.target.value.replace(/\D/g, '')); setRecipient(null); setRecipientMatches([]) }} className="font-mono" />
                  <Button variant="secondary" onClick={searchRecipient} loading={searchingRecipient} className="h-[46px] shrink-0"><Search size={15} /> Search</Button>
                </div>
                {recipientMatches.map(match => {
                  const selected = recipient?._id === match._id
                  return <button key={match._id} type="button" onClick={() => setRecipient(match)} className="w-full p-4 rounded-2xl border text-left flex items-center justify-between gap-3"
                    style={{ borderColor: selected ? '#0052CC' : '#E2E8F0', background: selected ? '#EBF2FF' : '#fff' }}>
                    <span><span className="block text-sm font-bold text-[#002B5B]">{match.firstName} {match.lastName}</span><span className="block mt-1 text-xs text-slate-500">Account ending {match.accountNumber.slice(-4)}</span></span>
                    {selected && <Check size={18} className="text-[#0052CC]" />}
                  </button>
                })}
                {recipient && <p className="text-xs text-emerald-700 flex items-center gap-1"><CheckCircle size={14} /> Recipient selected. Continue to enter an amount.</p>}
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-slate-500">Enter the recipient’s details. We won’t display personal information from another bank.</p>
                <Input label="Recipient Full Name" placeholder="Name on receiving account" value={beneficiaryName} onChange={e => setBeneficiaryName(e.target.value)} />
                <Input label="Recipient Account Number" placeholder="Enter account number" value={accountNumber} onChange={e => setAccountNumber(e.target.value.replace(/\s/g, ''))} className="font-mono" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Select label="Account Type" value={accountType} onChange={e => setAccountType(e.target.value as 'Checking' | 'Savings')}>
                    <option value="Checking">Checking</option><option value="Savings">Savings</option>
                  </Select>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Recipient Bank</label>
                    <button type="button" onClick={() => setShowBankPicker(true)} className="w-full h-[46px] px-3.5 rounded-xl border border-slate-200 bg-white text-left text-sm flex justify-between items-center">
                      <span className={bankName ? 'text-[#002B5B] font-medium truncate' : 'text-slate-400'}>{bankName || 'Choose a bank'}</span><ArrowRight size={15} className="text-slate-400" />
                    </button>
                  </div>
                </div>
                {isOtherBank && <Input label="Bank Name" placeholder="Enter bank name" value={bankName} onChange={e => setBankName(e.target.value)} />}
              </div>
            ))}

            {stage === 'amount' && <div className="space-y-5">
              <div className="rounded-2xl p-4 bg-[#F4F7FC] text-sm"><span className="text-slate-500">Sending to</span><p className="font-semibold text-[#002B5B] mt-1">{transferMode === 'internal' ? `${recipient?.firstName} ${recipient?.lastName} · ••••${recipient?.accountNumber.slice(-4)}` : `${beneficiaryName} · ${bankName}`}</p></div>
              <Input label="Amount (USD)" type="number" min="0.01" max={String(transferLimit)} step="0.01" placeholder="0.00" prefix="$" value={amount} onChange={e => setAmount(e.target.value)} className="font-mono text-base font-bold" hint={`Available: ${fmtUSD(user?.balance || 0)} · Max per transfer: ${fmtUSD(transferLimit)}`} error={num > (user?.balance || 0) ? 'Insufficient balance' : num > transferLimit ? `Maximum single transfer is ${fmtUSD(transferLimit)}` : ''} />
              <div className="flex flex-wrap gap-2">{[100, 1000, 10000, 50000].map(value => <button key={value} type="button" onClick={() => setAmount(String(value))} className="px-3 py-1.5 rounded-full text-xs font-semibold bg-[#F4F7FC] text-[#002B5B] border border-slate-200">${value.toLocaleString()}</button>)}</div>
              <Input label={transferMode === 'bank' ? 'Reference / Memo' : 'Note (optional)'} placeholder={transferMode === 'bank' ? 'Payment reference or memo' : 'What is this for?'} value={transferMode === 'bank' ? referenceMemo : note} onChange={e => transferMode === 'bank' ? setReferenceMemo(e.target.value) : setNote(e.target.value)} />
            </div>}

            {stage === 'review' && <div className="space-y-4">
              <div className="rounded-2xl p-4 bg-[#F4F7FC] space-y-3 text-sm">
                <div className="flex justify-between gap-3"><span className="text-slate-500">Transfer type</span><span className="font-semibold text-[#002B5B]">{transferMode === 'internal' ? 'To Blue ridge' : 'To Other Banks'}</span></div>
                <div className="flex justify-between gap-3"><span className="text-slate-500">Recipient</span><span className="font-semibold text-[#002B5B] text-right">{transferMode === 'internal' ? `${recipient?.firstName} ${recipient?.lastName}` : beneficiaryName}</span></div>
                {transferMode === 'internal' ? <div className="flex justify-between gap-3"><span className="text-slate-500">Account</span><span className="font-mono text-[#002B5B]">••••{recipient?.accountNumber.slice(-4)}</span></div> : <>
                  <div className="flex justify-between gap-3"><span className="text-slate-500">Bank</span><span className="font-semibold text-[#002B5B]">{bankName}</span></div>
                  <div className="flex justify-between gap-3"><span className="text-slate-500">Account type</span><span className="font-semibold text-[#002B5B]">{accountType}</span></div>
                  <div className="flex justify-between gap-3"><span className="text-slate-500">Account number</span><span className="font-mono text-[#002B5B]">••••{accountNumber.slice(-4)}</span></div>
                  {referenceMemo && <div className="flex justify-between gap-3"><span className="text-slate-500">Reference / Memo</span><span className="text-[#002B5B] text-right">{referenceMemo}</span></div>}
                </>}
                {transferMode === 'internal' && note && <div className="flex justify-between gap-3"><span className="text-slate-500">Note</span><span className="text-[#002B5B]">{note}</span></div>}
                <Divider />
                <div className="flex justify-between gap-3 font-bold"><span className="text-[#002B5B]">Total</span><span className="font-mono text-[#002B5B]">{fmtUSD(num)}</span></div>
              </div>
              <p className="text-xs text-slate-500">Confirm the details above. You can go back to edit before authorizing the payment.</p>
            </div>}

            <div className="flex gap-3 mt-6">
              {stage !== 'recipient' && <Button variant="secondary" className="flex-1 justify-center" onClick={() => setStage(stage === 'review' ? 'amount' : 'recipient')}><ArrowLeft size={15} /> Back / Edit</Button>}
              {stage === 'recipient' && <Button variant="primary" className="w-full justify-center rounded-full" onClick={continueToAmount}>Continue to Amount <ArrowRight size={16} /></Button>}
              {stage === 'amount' && <Button variant="primary" className="flex-1 justify-center rounded-full" onClick={continueToReview}>Review Transfer <ArrowRight size={16} /></Button>}
              {stage === 'review' && <Button variant="primary" className="flex-1 justify-center rounded-full" onClick={() => setShowAuthModal(true)} disabled={loading}>Pay {fmtUSD(num)} <ArrowRight size={16} /></Button>}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl p-5 brand-card-gradient text-white shadow-brand">
            <p className="text-xs font-medium text-blue-200 mb-1">Your Balance</p>
            <p className="text-2xl font-bold font-mono text-white">
              {fmtUSD(user?.balance || 0)}
            </p>
            {num > 0 && num <= (user?.balance || 0) && (
              <p className="text-xs mt-2 text-blue-100">
                After transfer: <strong className="text-white">{fmtUSD((user?.balance || 0) - num)}</strong>
              </p>
            )}
          </div>

          <Card className="p-5">
            <SectionHeader title="Transfer Limits" />
            {[['Single Transfer', fmtUSD(transferLimit)], ['Daily Limit', fmtUSD(transferLimit)], ['Transfer Fee', 'Free']].map(([l,v]) => (
              <div key={l} className="flex justify-between py-2.5 border-b border-slate-100 last:border-0">
                <span className="text-xs text-slate-500">{l}</span>
                <span className="text-xs font-bold font-mono text-[#002B5B]">{v}</span>
              </div>
            ))}
          </Card>

          <Card className="p-5">
            <SectionHeader title="Need Help?" />
            <p className="text-xs mb-1.5 text-slate-500">Contact support:</p>
            <p className="text-xs font-semibold text-[#0052CC]">support@theblueridges.com</p>
          </Card>
        </div>
      </div>
      {showBankPicker && <div className="fixed inset-0 z-[90] bg-white flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200"><button type="button" onClick={() => setShowBankPicker(false)} className="flex items-center gap-2 text-sm font-semibold text-slate-600"><X size={18} /> Cancel</button><h2 className="text-base font-bold text-[#002B5B]">Select recipient bank</h2><span className="w-14" /></div>
        <div className="max-w-2xl w-full mx-auto p-5 flex-1 overflow-y-auto"><Input label="Search banks" placeholder="Type a bank name" value={bankSearch} onChange={e => setBankSearch(e.target.value)} />
          <div className="mt-4 divide-y divide-slate-100">{BANKS.filter(bank => bank.toLowerCase().includes(bankSearch.toLowerCase())).map(bank => <button key={bank} type="button" onClick={() => { setIsOtherBank(bank.startsWith('Other')); setBankName(bank.startsWith('Other') ? '' : bank); setShowBankPicker(false); setBankSearch('') }} className="w-full py-4 text-left flex items-center justify-between text-sm font-medium text-[#002B5B]">{bank}<ArrowRight size={15} className="text-slate-400" /></button>)}
            {!BANKS.some(bank => bank.toLowerCase() === bankSearch.trim().toLowerCase()) && bankSearch.trim() && <button type="button" onClick={() => { setIsOtherBank(true); setBankName(bankSearch.trim()); setShowBankPicker(false); setBankSearch('') }} className="w-full py-4 text-left text-sm font-semibold text-[#0052CC]">Use “{bankSearch.trim()}”</button>}
          </div>
        </div>
      </div>}
      <TransactionAuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} onConfirm={executeSend} />
    </div>
  )
}
