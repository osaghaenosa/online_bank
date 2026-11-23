'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/store/auth'
import { api, fmtUSD } from '@/lib/api'
import { Card, Button, Input, SectionHeader, SuccessScreen, Divider } from '@/components/ui'
import { ArrowRight, Info, ShieldAlert, CheckCircle, Clock } from 'lucide-react'
import { TransactionAuthModal } from '@/components/shared/TransactionAuthModal'

interface Restrictions {
  transfersEnabled: boolean
  transfersBlockReason: string
  transferRequirements: Array<{ _id: string; type: string; label: string; fulfilled: boolean; notes: string }>
}

export default function TransferPage() {
  const { user, refreshUser, toast } = useAuth()

  const [restrictions, setRestrictions] = useState<Restrictions | null>(null)
  const [showRestrictions, setShowRestrictions] = useState(false)

  const [recipEmail, setRecipEmail] = useState('')
  const [amount,     setAmount]     = useState('')
  const [note,       setNote]       = useState('')
  const [loading,    setLoading]    = useState(false)
  const [result,     setResult]     = useState<any>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const sp = new URLSearchParams(window.location.search)
    const to = sp.get('to')
    const amt = sp.get('amount')
    if (to) setRecipEmail(to)
    if (amt) setAmount(amt)
  }, [])

  const num = parseFloat(amount) || 0

  const handleSend = async () => {
    if (!recipEmail) {
      toast('Enter recipient email', 'error')
      return
    }

    if (!num || num <= 0) {
      toast('Enter a valid amount', 'error')
      return
    }

    if (num > (user?.balance || 0)) {
      toast('Insufficient funds', 'error')
      return
    }

    setShowAuthModal(true)
  }

  const executeSend = async (pin: string, trackTokenNumber?: string) => {
    setLoading(true)

    try {
      const data = await api.tx.transfer({
        amount: num,
        recipientEmail: recipEmail || undefined,
        note,
        pin,
        trackTokenNumber
      })

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

  if (result) return (
    <SuccessScreen
      title="Transfer Complete!"
      subtitle={`${fmtUSD(num)} sent successfully`}
      receiptUrl={result.receiptUrl ? `http://localhost:5000${result.receiptUrl}` : undefined}
      txId={result.transaction?.transactionId}
      extra={
        <div className="text-sm rounded-2xl p-4 space-y-2.5 text-left bg-[#F4F7FC]">
          <div className="flex justify-between"><span className="text-slate-500">To</span><span className="font-semibold text-[#002B5B]">{result.transaction?.recipientName || recipEmail}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Amount</span><span className="font-mono font-bold text-red-500">-{fmtUSD(num)}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Recipient</span><span className="text-[#002B5B]">{result.recipientFound ? '✓ Blue ridge Bank user' : 'External transfer'}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">New Balance</span><span className="font-mono font-bold text-[#002B5B]">{fmtUSD(result.newBalance)}</span></div>
          {note && <div className="flex justify-between"><span className="text-slate-500">Note</span><span className="text-[#002B5B]">{note}</span></div>}
          <div className="flex justify-between"><span className="text-slate-500">Ref</span><span className="font-mono text-xs text-slate-600">{result.transaction?.transactionId}</span></div>
        </div>
      }
      onAgain={() => {
        setResult(null)
        setAmount('')
        setNote('')
        setRecipEmail('')
        setShowRestrictions(false)
      }}
      againLabel="Send Another"
    />
  )

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
            <SectionHeader title="Send Money" sub="Transfer to any Blue ridge Bank user instantly — free" />
            <div className="space-y-4">
              <Input
                label="Recipient Email"
                type="email"
                placeholder="recipient@example.com"
                value={recipEmail}
                onChange={e => setRecipEmail(e.target.value)}
              />
              <div>
                <Input
                  label="Amount (USD)"
                  type="number"
                  min="0.01"
                  max="5000"
                  step="0.01"
                  placeholder="0.00"
                  prefix="$"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="font-mono text-base font-bold"
                  hint={`Available: ${fmtUSD(user?.balance || 0)}`}
                  error={num > (user?.balance || 0) ? 'Insufficient balance' : ''}
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {[50, 100, 500, 1000].map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setAmount(String(p))}
                      className="px-3 py-1 rounded-full text-xs font-semibold bg-[#F4F7FC] hover:bg-[#EBF2FF] text-[#002B5B] border border-slate-200/80 transition-colors cursor-pointer"
                    >
                      ${p.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>
              <Input
                label="Note (optional)"
                placeholder="What's this for?"
                value={note}
                onChange={e => setNote(e.target.value)}
              />

              {/* Fee summary */}
              <div className="rounded-2xl p-4 text-sm space-y-2 bg-[#F4F7FC]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Transfer Fee</span>
                  <span className="font-mono font-semibold text-[#059669]">Free</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Processing Time</span>
                  <span className="font-semibold text-[#002B5B]">Instant</span>
                </div>
                <Divider />
                <div className="flex justify-between font-semibold">
                  <span className="text-[#002B5B]">Total</span>
                  <span className="font-mono text-[#002B5B]">{fmtUSD(num)}</span>
                </div>
              </div>

              <Button
                variant="primary"
                size="lg"
                className="w-full justify-center rounded-full"
                onClick={handleSend}
                loading={loading}
                disabled={!recipEmail || num <= 0 || num > (user?.balance || 0)}
              >
                Send {num > 0 ? fmtUSD(num) : 'Money'} <ArrowRight size={16} />
              </Button>
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
            {[['Single Transfer','$100,000'],['Daily','$200,000'],['Monthly','$1,000,000']].map(([l,v]) => (
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
      <TransactionAuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} onConfirm={executeSend} />
    </div>
  )
}
