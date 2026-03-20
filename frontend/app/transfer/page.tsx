'use client'
import { useState } from 'react'
import { useAuth } from '@/store/auth'
import { api, fmtUSD } from '@/lib/api'
import { Card, Button, Input, SectionHeader, SuccessScreen, Divider } from '@/components/ui'
import { Send, ArrowRight, Info, ShieldAlert, CheckCircle, Clock } from 'lucide-react'

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
  const [recipAcct,  setRecipAcct]  = useState('')
  const [amount,     setAmount]     = useState('')
  const [note,       setNote]       = useState('')
  const [loading,    setLoading]    = useState(false)
  const [result,     setResult]     = useState<any>(null)

  const num = parseFloat(amount) || 0

  const handleSend = async () => {
    if (!recipEmail && !recipAcct) {
      toast('Enter recipient email or account number', 'error')
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

    setLoading(true)

    try {
      const data = await api.tx.transfer({
        amount: num,
        recipientEmail: recipEmail || undefined,
        recipientAccountNumber: recipAcct || undefined,
        note
      })

      setResult(data)
      await refreshUser()

    } catch (err: any) {

      if (err.message?.includes('pending review') || err.message?.includes('blocked')) {
        toast(err.message, 'error')

        // Fetch restrictions ONLY when needed
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
    }
  }

  // SUCCESS SCREEN
  if (result) return (
    <SuccessScreen
      title="Transfer Complete!"
      subtitle={`${fmtUSD(num)} sent successfully`}
      receiptUrl={result.receiptUrl ? `http://localhost:5000${result.receiptUrl}` : undefined}
      txId={result.transaction?.transactionId}
      extra={
        <div className="text-sm rounded-xl p-4 space-y-2.5 text-left" style={{ background: 'var(--color-bg)' }}>
          <div className="flex justify-between"><span style={{ color:'var(--color-muted)' }}>To</span><span className="font-semibold">{result.transaction?.recipientName || recipEmail || recipAcct}</span></div>
          <div className="flex justify-between"><span style={{ color:'var(--color-muted)' }}>Amount</span><span className="font-mono font-bold text-red-500">-{fmtUSD(num)}</span></div>
          <div className="flex justify-between"><span style={{ color:'var(--color-muted)' }}>Recipient</span><span>{result.recipientFound ? '✅ NexaBank user' : '⚠ External transfer'}</span></div>
          <div className="flex justify-between"><span style={{ color:'var(--color-muted)' }}>New Balance</span><span className="font-mono font-bold">{fmtUSD(result.newBalance)}</span></div>
          {note && <div className="flex justify-between"><span style={{ color:'var(--color-muted)' }}>Note</span><span>{note}</span></div>}
          <div className="flex justify-between"><span style={{ color:'var(--color-muted)' }}>Ref</span><span className="font-mono text-xs">{result.transaction?.transactionId}</span></div>
        </div>
      }
      onAgain={() => {
        setResult(null)
        setAmount('')
        setNote('')
        setRecipEmail('')
        setRecipAcct('')
        setShowRestrictions(false)
      }}
      againLabel="Send Another"
    />
  )

  // RESTRICTIONS VIEW (only shown after a blocked attempt)
  if (showRestrictions && restrictions && !restrictions.transfersEnabled) {
    const pending = restrictions.transferRequirements.filter(r => !r.fulfilled)
    const total   = restrictions.transferRequirements.length

    return (
      <div className="max-w-2xl mx-auto space-y-5 fade-up">
        <div className="rounded-2xl p-6 sm:p-8 text-center relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1a0a0a, #2a0f0f)', border: '2px solid rgba(239,68,68,.35)' }}>
          <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full opacity-10 pointer-events-none"
            style={{ background: 'radial-gradient(circle, #EF4444, transparent 70%)' }} />
          <div className="relative z-10">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(239,68,68,.2)' }}>
              <ShieldAlert size={28} style={{ color: '#EF4444' }} />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold mb-2 text-red-300">Transfers Pending Review</h2>
            <p className="text-sm leading-relaxed text-red-200 max-w-md mx-auto">
              {restrictions.transfersBlockReason}
            </p>
            <div className="mt-3 text-xs text-red-300">
              {total > 0 ? `${pending.length} of ${total} requirements pending` : 'Under review'}
            </div>
          </div>
        </div>

        {total > 0 && (
          <Card className="p-4 sm:p-6">
            <SectionHeader title="Requirements to Restore Transfers" />
            <div className="space-y-3">
              {restrictions.transferRequirements.map((req, i) => (
                <div key={req._id || i} className="flex items-start gap-3 p-3 rounded-xl border"
                  style={{
                    borderColor: req.fulfilled ? 'rgba(16,185,129,.25)' : 'var(--color-border)',
                    background:  req.fulfilled ? 'rgba(16,185,129,.04)' : 'var(--color-bg)',
                  }}>
                  {req.fulfilled
                    ? <CheckCircle size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                    : <Clock       size={16} className="text-amber-500  flex-shrink-0 mt-0.5" />
                  }
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{req.label}</p>
                    {req.notes && (
                      <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--color-muted)' }}>{req.notes}</p>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${req.fulfilled ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {req.fulfilled ? 'Done' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}

        <div className="flex gap-3 p-4 rounded-xl"
          style={{ background: 'rgba(59,130,246,.06)', border: '1px solid rgba(59,130,246,.2)' }}>
          <Info size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-600">
            <strong>Deposits remain available.</strong> Contact support at <strong>+1 (888) 639-2265</strong> or <strong>compliance@nexabank.com</strong>.
          </p>
        </div>

        <Button variant="secondary" className="w-full justify-center"
          onClick={() => setShowRestrictions(false)}>
          ← Back to Transfer Form
        </Button>
      </div>
    )
  }

  // NORMAL FORM
  return (
    <div className="max-w-4xl space-y-4 sm:space-y-5 fade-up">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        <div className="lg:col-span-2">
          <Card className="p-4 sm:p-6">
            <SectionHeader title="Send Money" sub="Transfer to any NexaBank user instantly — free" />
            <div className="space-y-4">
              <Input
                label="Recipient Email"
                type="email"
                placeholder="recipient@example.com"
                value={recipEmail}
                onChange={e => { setRecipEmail(e.target.value); if (e.target.value) setRecipAcct('') }}
              />
              <div className="flex items-center gap-3">
                <Divider className="flex-1" />
                <span className="text-xs font-medium" style={{ color: 'var(--color-muted)' }}>or</span>
                <Divider className="flex-1" />
              </div>
              <Input
                label="Account Number"
                placeholder="12-digit account number"
                className="font-mono"
                value={recipAcct}
                onChange={e => { setRecipAcct(e.target.value); if (e.target.value) setRecipEmail('') }}
              />
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
                className="font-mono"
                hint={`Available: ${fmtUSD(user?.balance || 0)}`}
                error={num > (user?.balance || 0) ? 'Insufficient balance' : ''}
              />
              <Input
                label="Note (optional)"
                placeholder="What's this for?"
                value={note}
                onChange={e => setNote(e.target.value)}
              />

              {/* Fee summary */}
              <div className="rounded-xl p-4 text-sm space-y-2" style={{ background: 'var(--color-bg)' }}>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--color-muted)' }}>Transfer Fee</span>
                  <span className="font-mono text-emerald-600">Free</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--color-muted)' }}>Processing Time</span>
                  <span>Instant</span>
                </div>
                <Divider />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span className="font-mono">{fmtUSD(num)}</span>
                </div>
              </div>

              <Button
                variant="primary"
                size="lg"
                className="w-full justify-center"
                onClick={handleSend}
                loading={loading}
                disabled={(!recipEmail && !recipAcct) || num <= 0 || num > (user?.balance || 0)}
              >
                Send {num > 0 ? fmtUSD(num) : 'Money'} <ArrowRight size={16} />
              </Button>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-4 sm:p-5">
            <SectionHeader title="Transfer Limits" />
            {[['Single Transfer','$5,000'],['Daily','$10,000'],['Monthly','$50,000']].map(([l,v]) => (
              <div key={l} className="flex justify-between py-2.5 border-b last:border-0"
                style={{ borderColor: 'var(--color-border)' }}>
                <span className="text-xs" style={{ color: 'var(--color-muted)' }}>{l}</span>
                <span className="text-xs font-bold font-mono">{v}</span>
              </div>
            ))}
          </Card>
          <Card className="p-4 sm:p-5">
            <SectionHeader title="Your Balance" />
            <p className="text-xl sm:text-2xl font-bold font-mono" style={{ color: '#10B981' }}>
              {fmtUSD(user?.balance || 0)}
            </p>
            {num > 0 && num <= (user?.balance || 0) && (
              <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
                After transfer: <strong className="text-red-500">{fmtUSD((user?.balance || 0) - num)}</strong>
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
