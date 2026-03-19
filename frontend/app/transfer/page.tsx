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

  // 🔥 RESTRICTIONS (ONLY AFTER USER ACTION)
  if (showRestrictions && restrictions && !restrictions.transfersEnabled) {

    const pending  = restrictions.transferRequirements.filter(r => !r.fulfilled)
    const total    = restrictions.transferRequirements.length

    return (
      <div className="max-w-2xl mx-auto space-y-5 fade-up">

        <div className="rounded-2xl p-8 text-center"
          style={{ background: 'linear-gradient(135deg, #1a0a0a, #2a0f0f)', border: '2px solid rgba(239,68,68,.35)' }}>

          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(239,68,68,.2)' }}>
            <ShieldAlert size={32} style={{ color: '#EF4444' }} />
          </div>

          <h2 className="text-2xl font-bold mb-2 text-red-300">
            Transfers Pending Review
          </h2>

          <p className="text-sm text-red-200">
            {restrictions.transfersBlockReason}
          </p>

          <div className="mt-4 text-xs text-red-300">
            {total > 0 ? `${pending.length} of ${total} requirements pending` : 'Under review'}
          </div>
        </div>

        <Card className="p-6">
          <SectionHeader title="Requirements" />
          <div className="space-y-3">
            {restrictions.transferRequirements.map((req, i) => (
              <div key={req._id || i} className="flex gap-3 p-3 rounded-xl border">

                {req.fulfilled
                  ? <CheckCircle size={16} className="text-green-500" />
                  : <Clock size={16} className="text-yellow-500" />
                }

                <div>
                  <p className="text-sm font-semibold">{req.label}</p>
                  <p className="text-xs">{req.notes}</p>
                </div>

              </div>
            ))}
          </div>
        </Card>

      </div>
    )
  }

  // NORMAL FORM
  return (
    <div className="max-w-4xl space-y-5 fade-up">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        <div className="lg:col-span-2">
          <Card className="p-6">
            <SectionHeader title="Send Money" />

            <div className="space-y-4">

              <Input
                label="Recipient Email"
                value={recipEmail}
                onChange={e => {
                  setRecipEmail(e.target.value)
                  if (e.target.value) setRecipAcct('')
                }}
              />

              <Input
                label="Account Number"
                value={recipAcct}
                onChange={e => {
                  setRecipAcct(e.target.value)
                  if (e.target.value) setRecipEmail('')
                }}
              />

              <Input
                label="Amount"
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
              />

              <Input
                label="Note"
                value={note}
                onChange={e => setNote(e.target.value)}
              />

              <Button
                onClick={handleSend}
                loading={loading}
                disabled={(!recipEmail && !recipAcct) || num <= 0}
                className="w-full"
              >
                Send {num > 0 ? fmtUSD(num) : 'Money'}
              </Button>

            </div>
          </Card>
        </div>

        <div>
          <Card className="p-5">
            <SectionHeader title="Balance" />
            <p className="text-xl font-bold">{fmtUSD(user?.balance || 0)}</p>
          </Card>
        </div>

      </div>
    </div>
  )
}