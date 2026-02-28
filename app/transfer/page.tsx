'use client'
import { useState } from 'react'
import { useStore } from '@/store'
import { Card, Button, Input, SectionHeader, SuccessScreen, Divider } from '@/components/ui'
import { fmtUSD } from '@/lib/utils'
import { ArrowRight, User } from 'lucide-react'

export default function TransferPage() {
  const { addTx, toast, state, me, myTxs } = useStore()
  const [recipName, setRecipName] = useState('')
  const [recipAcct, setRecipAcct] = useState('')
  const [routing, setRouting] = useState('')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [success, setSuccess] = useState(false)

  const { theme } = state
  const numAmount = parseFloat(amount) || 0

  const handleSend = () => {
    if (!recipName) { toast('Enter recipient name', 'error'); return }
    if (!numAmount || numAmount <= 0) { toast('Enter a valid amount', 'error'); return }
    if (numAmount > me.balance) { toast('Insufficient funds', 'error'); return }
    addTx('debit', 'transfer', `Transfer to ${recipName}`, numAmount, 'completed', note)
    setSuccess(true)
  }

  if (success) return (
    <SuccessScreen
      title="Transfer Complete!"
      subtitle={`${fmtUSD(numAmount)} sent to ${recipName}`}
      extra={
        <div className="text-sm rounded-xl p-4 space-y-2 text-left" style={{ background: 'var(--color-bg)' }}>
          <div className="flex justify-between"><span style={{ color: 'var(--color-muted)' }}>To</span><span className="font-semibold">{recipName}</span></div>
          <div className="flex justify-between"><span style={{ color: 'var(--color-muted)' }}>Amount</span><span className="font-mono font-bold text-red-500">-{fmtUSD(numAmount)}</span></div>
          {note && <div className="flex justify-between"><span style={{ color: 'var(--color-muted)' }}>Note</span><span>{note}</span></div>}
          <div className="flex justify-between"><span style={{ color: 'var(--color-muted)' }}>Processing</span><span>Instant</span></div>
        </div>
      }
      onAgain={() => { setSuccess(false); setAmount(''); setRecipName(''); setNote('') }}
      againLabel="Send Another"
    />
  )

  return (
    <div className="max-w-4xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <Card className="p-6">
            <SectionHeader title="Send Money" />
            <div className="space-y-4">
              <Input
                label="Recipient Name"
                placeholder="Full name"
                value={recipName}
                onChange={e => setRecipName(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Account Number"
                  placeholder="1234567890"
                  value={recipAcct}
                  onChange={e => setRecipAcct(e.target.value)}
                  className="font-mono"
                />
                <Input
                  label="Routing Number"
                  placeholder="021000021"
                  value={routing}
                  onChange={e => setRouting(e.target.value)}
                  className="font-mono"
                />
              </div>
              <Input
                label="Amount (USD)"
                type="number"
                min="0"
                placeholder="0.00"
                prefix="$"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="font-mono"
                hint={`Available: ${fmtUSD(me.balance)}`}
              />
              <Input
                label="Note (Optional)"
                placeholder="What's this for?"
                value={note}
                onChange={e => setNote(e.target.value)}
              />

              <div className="rounded-xl p-4 text-sm space-y-2" style={{ background: 'var(--color-bg)' }}>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--color-muted)' }}>Transfer Fee</span>
                  <span className="font-mono">$0.00</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--color-muted)' }}>Processing Time</span>
                  <span>Instant</span>
                </div>
              </div>

              <Button
                variant="primary"
                size="lg"
                className="w-full justify-center"
                onClick={handleSend}
                accentColor={theme.accentColor}
              >
                Send {numAmount > 0 ? fmtUSD(numAmount) : 'Money'} <ArrowRight size={16} />
              </Button>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          {/* Recent recipients from other users */}
          <Card className="p-5">
            <SectionHeader title="Quick Select" />
            {state.users.filter(u => u.id !== me.id).map(u => (
              <button
                key={u.id}
                className="flex items-center gap-3 w-full py-3 border-b last:border-b-0 hover:opacity-70 transition-opacity text-left"
                style={{ borderColor: 'var(--color-border)' }}
                onClick={() => setRecipName(u.name)}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ background: theme.primaryColor }}
                >
                  {u.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{u.name}</p>
                  <p className="text-xs font-mono truncate" style={{ color: 'var(--color-muted)' }}>
                    ••••{u.accountNo.replace(/ /g, '').slice(-4)}
                  </p>
                </div>
                <ArrowRight size={14} style={{ color: 'var(--color-muted)' }} />
              </button>
            ))}
          </Card>

          <Card className="p-5">
            <SectionHeader title="Transfer Limits" />
            {[
              ['Daily', '$10,000'],
              ['Single Transfer', '$5,000'],
              ['Monthly', '$50,000'],
            ].map(([l, v]) => (
              <div key={l} className="flex justify-between py-2.5 border-b last:border-b-0" style={{ borderColor: 'var(--color-border)' }}>
                <span className="text-xs" style={{ color: 'var(--color-muted)' }}>{l}</span>
                <span className="text-xs font-bold font-mono">{v}</span>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  )
}
