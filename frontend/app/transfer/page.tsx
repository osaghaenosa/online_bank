'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/store/auth'
import { api, fmtUSD } from '@/lib/api'
import { Card, Button, Input, SectionHeader, SuccessScreen, Divider } from '@/components/ui'
import { Send, ArrowRight, Info, ShieldAlert, CheckCircle, Clock, AlertTriangle } from 'lucide-react'

interface Restrictions {
  transfersEnabled: boolean
  transfersBlockReason: string
  transferRequirements: Array<{ _id: string; type: string; label: string; fulfilled: boolean; notes: string }>
}

export default function TransferPage() {
  const { user, refreshUser, toast } = useAuth()
  const [restrictions, setRestrictions] = useState<Restrictions | null>(null)
  const [loadingRestrictions, setLoadingRestrictions] = useState(true)
  const [recipEmail, setRecipEmail] = useState('')
  const [recipAcct,  setRecipAcct]  = useState('')
  const [amount,     setAmount]     = useState('')
  const [note,       setNote]       = useState('')
  const [loading,    setLoading]    = useState(false)
  const [result,     setResult]     = useState<any>(null)

  useEffect(() => {
    api.restrictions.get()
      .then(d => setRestrictions(d))
      .catch(() => {})
      .finally(() => setLoadingRestrictions(false))
  }, [])

  const num = parseFloat(amount) || 0

  const handleSend = async () => {
    if (!recipEmail && !recipAcct) { toast('Enter recipient email or account number', 'error'); return }
    if (!num || num <= 0) { toast('Enter a valid amount', 'error'); return }
    if (num > (user?.balance || 0)) { toast('Insufficient funds', 'error'); return }
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
      // Show block message if blocked
      if (err.message?.includes('pending review') || err.message?.includes('blocked')) {
        toast(err.message, 'error')
        // Refresh restrictions
        api.restrictions.get().then(d => setRestrictions(d)).catch(() => {})
      } else {
        toast(err.message || 'Transfer failed', 'error')
      }
    } finally {
      setLoading(false)
    }
  }

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
      onAgain={() => { setResult(null); setAmount(''); setNote(''); setRecipEmail(''); setRecipAcct('') }}
      againLabel="Send Another"
    />
  )

  // ── BLOCKED STATE ──────────────────────────────────────────────────────────
  if (!loadingRestrictions && restrictions && !restrictions.transfersEnabled) {
    const pending  = (restrictions.transferRequirements || []).filter(r => !r.fulfilled)
    const done     = (restrictions.transferRequirements || []).filter(r =>  r.fulfilled)
    const total    = (restrictions.transferRequirements || []).length

    return (
      <div className="max-w-2xl mx-auto space-y-5 fade-up">
        {/* Big blocked banner */}
        <div className="rounded-2xl p-8 text-center relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1a0a0a, #2a0f0f)', border: '2px solid rgba(239,68,68,.35)' }}>
          <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #EF4444, transparent 70%)' }} />
          <div className="relative z-10">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(239,68,68,.2)' }}>
              <ShieldAlert size={32} style={{ color: '#EF4444' }} />
            </div>
            <h2 className="font-display text-2xl font-bold mb-2" style={{ color: '#FCA5A5' }}>
              Transfers Pending Review
            </h2>
            <p className="text-sm leading-relaxed max-w-md mx-auto" style={{ color: 'rgba(252,165,165,.7)' }}>
              {restrictions.transfersBlockReason}
            </p>
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold"
              style={{ background: 'rgba(239,68,68,.15)', color: '#FCA5A5', border: '1px solid rgba(239,68,68,.3)' }}>
              <Clock size={12} />
              {total > 0 ? `${pending.length} of ${total} requirements pending` : 'Under review'}
            </div>
          </div>
        </div>

        {/* Requirements list */}
        {total > 0 && (
          <Card className="p-6">
            <SectionHeader title="Requirements to Restore Transfer Capability" />
            <div className="space-y-3">
              {(restrictions.transferRequirements || []).map((req, i) => (
                <div key={req._id || i} className="flex items-start gap-4 p-4 rounded-xl"
                  style={{
                    background: req.fulfilled ? 'rgba(16,185,129,.06)' : 'var(--color-bg)',
                    border: `1px solid ${req.fulfilled ? 'rgba(16,185,129,.25)' : 'var(--color-border)'}`
                  }}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${req.fulfilled ? 'bg-emerald-100' : 'bg-amber-50'}`}>
                    {req.fulfilled
                      ? <CheckCircle size={16} className="text-emerald-600" />
                      : <Clock size={16} className="text-amber-500" />
                    }
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold">{req.label}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${req.fulfilled ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {req.fulfilled ? 'Completed' : 'Pending'}
                      </span>
                    </div>
                    {req.notes && (
                      <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--color-muted)' }}>
                        {req.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* What to do */}
        <Card className="p-6">
          <SectionHeader title="What to do next?" />
          <div className="space-y-3">
            {[
              { icon: '📞', title: 'Contact your account manager', desc: 'Call +1 (888) 639-2265 or email compliance@nexabank.com to expedite your review.' },
              { icon: '📄', title: 'Submit required documents', desc: 'Upload source of funds declaration and enhanced KYC documents via the support portal.' },
              { icon: '⏰', title: 'Allow 2-3 business days', desc: 'Our compliance team reviews all enhanced due diligence requests within 2-3 business days.' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="flex gap-3 p-4 rounded-xl" style={{ background: 'var(--color-bg)' }}>
                <span className="text-xl flex-shrink-0">{icon}</span>
                <div>
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--color-muted)' }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Alternative: they can still deposit/withdraw */}
        <div className="flex gap-3 p-4 rounded-xl" style={{ background: 'rgba(59,130,246,.06)', border: '1px solid rgba(59,130,246,.2)' }}>
          <Info size={15} className="text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-600">
            <strong>Deposits and bill payments remain available.</strong> Only outgoing transfer capability is currently restricted. Your funds are safe and accessible.
          </p>
        </div>
      </div>
    )
  }

  // ── Normal transfer form ───────────────────────────────────────────────────
  return (
    <div className="max-w-4xl space-y-5 fade-up">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <Card className="p-6">
            <SectionHeader title="Send Money" sub="Transfer to any NexaBank user instantly" />
            <div className="space-y-4">
              <div className="p-4 rounded-xl" style={{ background:'rgba(59,130,246,.06)', border:'1px solid rgba(59,130,246,.15)' }}>
                <div className="flex gap-2.5 items-start">
                  <Info size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-600">
                    Enter recipient's NexaBank email <strong>or</strong> account number. Internal transfers are instant and free.
                  </p>
                </div>
              </div>
              <Input label="Recipient Email" type="email" placeholder="recipient@example.com"
                value={recipEmail} onChange={e => { setRecipEmail(e.target.value); if (e.target.value) setRecipAcct('') }} />
              <div className="flex items-center gap-3">
                <Divider className="flex-1" />
                <span className="text-xs font-medium" style={{ color:'var(--color-muted)' }}>or</span>
                <Divider className="flex-1" />
              </div>
              <Input label="Account Number" placeholder="12-digit account number" className="font-mono"
                value={recipAcct} onChange={e => { setRecipAcct(e.target.value); if (e.target.value) setRecipEmail('') }} />
              <Input label="Amount (USD)" type="number" min="0.01" max="5000" step="0.01" placeholder="0.00"
                prefix="$" value={amount} onChange={e => setAmount(e.target.value)} className="font-mono"
                hint={`Available: ${fmtUSD(user?.balance || 0)}`}
                error={num > (user?.balance || 0) ? 'Insufficient balance' : ''} />
              <Input label="Note (optional)" placeholder="What's this for?" value={note} onChange={e => setNote(e.target.value)} />
              <div className="rounded-xl p-4 text-sm space-y-2" style={{ background:'var(--color-bg)' }}>
                <div className="flex justify-between"><span style={{ color:'var(--color-muted)' }}>Transfer Fee</span><span className="font-mono text-emerald-600">Free</span></div>
                <div className="flex justify-between"><span style={{ color:'var(--color-muted)' }}>Processing Time</span><span>Instant</span></div>
                <Divider />
                <div className="flex justify-between font-semibold"><span>Total</span><span className="font-mono">{fmtUSD(num)}</span></div>
              </div>
              <Button variant="primary" size="lg" className="w-full" onClick={handleSend} loading={loading}
                disabled={(!recipEmail && !recipAcct) || num <= 0 || num > (user?.balance || 0)}>
                Send {num > 0 ? fmtUSD(num) : 'Money'} <ArrowRight size={16} />
              </Button>
            </div>
          </Card>
        </div>
        <div className="space-y-4">
          <Card className="p-5">
            <SectionHeader title="Transfer Limits" />
            {[['Single Transfer','$5,000'],['Daily','$10,000'],['Monthly','$50,000']].map(([l,v]) => (
              <div key={l} className="flex justify-between py-2.5 border-b last:border-0" style={{ borderColor:'var(--color-border)' }}>
                <span className="text-xs" style={{ color:'var(--color-muted)' }}>{l}</span>
                <span className="text-xs font-bold font-mono">{v}</span>
              </div>
            ))}
          </Card>
          <Card className="p-5">
            <SectionHeader title="Your Balance" />
            <p className="text-2xl font-bold font-mono" style={{ color:'#10B981' }}>{fmtUSD(user?.balance || 0)}</p>
            {num > 0 && num <= (user?.balance || 0) && (
              <p className="text-xs mt-1" style={{ color:'var(--color-muted)' }}>
                After transfer: <strong className="text-red-500">{fmtUSD((user?.balance || 0) - num)}</strong>
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
