'use client'
import { useState } from 'react'
import { useAuth } from '@/store/auth'
import { api, fmtUSD } from '@/lib/api'
import { Card, Button, Input, SectionHeader, SuccessScreen, Divider } from '@/components/ui'
import { Send, ArrowRight, User, Info } from 'lucide-react'

export default function TransferPage() {
  const { user, refreshUser, toast } = useAuth()
  const [recipEmail, setRecipEmail] = useState('')
  const [recipAcct, setRecipAcct] = useState('')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const num = parseFloat(amount) || 0

  const handleSend = async () => {
    if (!recipEmail && !recipAcct) { toast('Enter recipient email or account number', 'error'); return }
    if (!num || num <= 0) { toast('Enter a valid amount', 'error'); return }
    if (num > (user?.balance || 0)) { toast('Insufficient funds', 'error'); return }
    setLoading(true)
    try {
      const data = await api.tx.transfer({ amount: num, recipientEmail: recipEmail || undefined, recipientAccountNumber: recipAcct || undefined, note })
      setResult(data)
      await refreshUser()
    } catch (err: any) {
      toast(err.message || 'Transfer failed', 'error')
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
          <div className="flex justify-between"><span style={{ color: 'var(--color-muted)' }}>To</span><span className="font-semibold">{result.transaction?.recipientName || recipEmail || recipAcct}</span></div>
          <div className="flex justify-between"><span style={{ color: 'var(--color-muted)' }}>Amount</span><span className="font-mono font-bold text-red-500">-{fmtUSD(num)}</span></div>
          <div className="flex justify-between"><span style={{ color: 'var(--color-muted)' }}>Recipient Found</span><span>{result.recipientFound ? '✅ NexaBank user' : '⚠ External transfer'}</span></div>
          <div className="flex justify-between"><span style={{ color: 'var(--color-muted)' }}>New Balance</span><span className="font-mono font-bold">{fmtUSD(result.newBalance)}</span></div>
          {note && <div className="flex justify-between"><span style={{ color: 'var(--color-muted)' }}>Note</span><span>{note}</span></div>}
          <div className="flex justify-between"><span style={{ color: 'var(--color-muted)' }}>Ref</span><span className="font-mono text-xs">{result.transaction?.transactionId}</span></div>
        </div>
      }
      onAgain={() => { setResult(null); setAmount(''); setNote(''); setRecipEmail(''); setRecipAcct('') }}
      againLabel="Send Another"
    />
  )

  return (
    <div className="max-w-4xl space-y-5 fade-up">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <Card className="p-6">
            <SectionHeader title="Send Money" sub="Transfer to any NexaBank user instantly — or externally" />

            <div className="space-y-4">
              <div className="p-4 rounded-xl" style={{ background: 'rgba(59,130,246,.06)', border: '1px solid rgba(59,130,246,.15)' }}>
                <div className="flex gap-2.5 items-start">
                  <Info size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-600">Enter the recipient's NexaBank email <strong>or</strong> account number. Internal transfers are instant and free.</p>
                </div>
              </div>

              <Input label="Recipient Email" type="email" placeholder="recipient@example.com"
                value={recipEmail} onChange={e => { setRecipEmail(e.target.value); if (e.target.value) setRecipAcct('') }}
                hint={recipAcct ? 'Cleared — using account number instead' : ''} />

              <div className="flex items-center gap-3">
                <Divider className="flex-1" />
                <span className="text-xs font-medium" style={{ color: 'var(--color-muted)' }}>or</span>
                <Divider className="flex-1" />
              </div>

              <Input label="Account Number" placeholder="12-digit account number" className="font-mono"
                value={recipAcct} onChange={e => { setRecipAcct(e.target.value); if (e.target.value) setRecipEmail('') }} />

              <Input label="Amount (USD)" type="number" min="0.01" max="5000" step="0.01" placeholder="0.00"
                prefix="$" value={amount} onChange={e => setAmount(e.target.value)} className="font-mono"
                hint={`Available: ${fmtUSD(user?.balance || 0)}`}
                error={num > (user?.balance || 0) ? 'Insufficient balance' : ''} />

              <Input label="Note (optional)" placeholder="What's this for?" value={note} onChange={e => setNote(e.target.value)} />

              <div className="rounded-xl p-4 text-sm space-y-2" style={{ background: 'var(--color-bg)' }}>
                <div className="flex justify-between"><span style={{ color: 'var(--color-muted)' }}>Transfer Fee</span><span className="font-mono text-emerald-600">Free</span></div>
                <div className="flex justify-between"><span style={{ color: 'var(--color-muted)' }}>Processing Time</span><span>Instant (NexaBank to NexaBank)</span></div>
                <Divider />
                <div className="flex justify-between font-semibold">
                  <span>Total</span><span className="font-mono">{fmtUSD(num)}</span>
                </div>
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
              <div key={l} className="flex justify-between py-2.5 border-b last:border-0" style={{ borderColor: 'var(--color-border)' }}>
                <span className="text-xs" style={{ color: 'var(--color-muted)' }}>{l}</span>
                <span className="text-xs font-bold font-mono">{v}</span>
              </div>
            ))}
          </Card>
          <Card className="p-5">
            <SectionHeader title="Your Balance" />
            <p className="text-2xl font-bold font-mono" style={{ color: '#10B981' }}>{fmtUSD(user?.balance || 0)}</p>
            {num > 0 && num <= (user?.balance || 0) && (
              <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
                After transfer: <strong className="text-red-500">{fmtUSD((user?.balance || 0) - num)}</strong>
              </p>
            )}
          </Card>
          <div className="p-4 rounded-xl bg-emerald-50 text-xs text-emerald-700 space-y-1">
            <p className="font-semibold">⚡ Instant NexaBank Transfers</p>
            <p>When sending to another NexaBank email or account, funds arrive instantly with no fees.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
