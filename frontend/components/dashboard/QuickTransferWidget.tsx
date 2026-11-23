'use client'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Send, ArrowUpRight, Landmark, Check } from 'lucide-react'
import { api, fmtUSD } from '@/lib/api'
import { useAuth, User } from '@/store/auth'
import { TransactionAuthModal } from '@/components/shared/TransactionAuthModal'
import clsx from 'clsx'

interface Contact {
  name: string
  email: string
  initials: string
}

export function QuickTransferWidget({
  user,
  transactions,
  onSuccess,
}: {
  user: User | null
  transactions: any[]
  onSuccess: () => void
}) {
  const { toast } = useAuth()
  const [recipientEmail, setRecipientEmail] = useState('')
  const [amount, setAmount] = useState('')
  const [showAuth, setShowAuth] = useState(false)
  const [sending, setSending] = useState(false)

  const contacts: Contact[] = useMemo(() => {
    const seen = new Set<string>()
    const list: Contact[] = []
    for (const tx of transactions) {
      const m = tx.metadata || {}
      const email = m.recipientEmail || tx.recipientEmail || ''
      const name = m.recipientName || tx.recipientName || (email ? email.split('@')[0] : '')
      if (!email || seen.has(email.toLowerCase())) continue
      seen.add(email.toLowerCase())
      const parts = String(name).trim().split(/\s+/)
      const initials =
        parts.length >= 2
          ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
          : String(name).slice(0, 2).toUpperCase()
      list.push({ name: name || email, email, initials })
      if (list.length >= 5) break
    }
    return list
  }, [transactions])

  const num = parseFloat(amount) || 0

  const startTransfer = () => {
    if (!user) return
    if (user.kyc !== 'Verified') {
      toast('Complete KYC verification before sending transfers', 'warning')
      return
    }
    if (!recipientEmail.trim()) {
      toast('Enter or select a recipient email', 'error')
      return
    }
    if (num <= 0) {
      toast('Enter a valid amount', 'error')
      return
    }
    if (num > (user.balance || 0)) {
      toast('Insufficient available balance', 'error')
      return
    }
    setShowAuth(true)
  }

  const executeTransfer = async (pin: string, trackTokenNumber?: string) => {
    setSending(true)
    try {
      await api.tx.transfer({
        amount: num,
        recipientEmail: recipientEmail.trim(),
        note: 'Quick Transfer',
        pin,
        trackTokenNumber,
      })
      toast(`${fmtUSD(num)} sent to ${recipientEmail.trim()}`, 'success')
      setAmount('')
      onSuccess()
    } catch (err: any) {
      toast(err.message || 'Transfer failed — open Full Transfer for details', 'error')
    } finally {
      setSending(false)
      setShowAuth(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-bold text-base text-[#002B5B]">Send Money</h3>
        <Link
          href="/transfer"
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#0052CC] hover:text-[#002B5B] transition-colors"
        >
          <span>Full Transfer</span>
          <ArrowUpRight size={13} />
        </Link>
      </div>

      {/* Recent Contacts Avatar Strip (PayDay style) */}
      <div className="mb-4">
        <p className="text-[11px] font-medium text-slate-400 mb-2">Recent Contacts</p>
        {contacts.length > 0 ? (
          <div className="flex items-center gap-2.5 overflow-x-auto scrollbar-none pb-1">
            {contacts.map(c => {
              const selected = recipientEmail.toLowerCase() === c.email.toLowerCase()
              return (
                <button
                  key={c.email}
                  type="button"
                  onClick={() => setRecipientEmail(c.email)}
                  className="flex flex-col items-center gap-1 flex-shrink-0 group cursor-pointer"
                  title={`${c.name} (${c.email})`}
                >
                  <div
                    className={clsx(
                      'w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all relative',
                      selected
                        ? 'bg-[#0052CC] text-white ring-2 ring-[#0052CC] ring-offset-2'
                        : 'bg-[#EBF2FF] text-[#002B5B] group-hover:bg-[#D6E4FF]'
                    )}
                  >
                    {c.initials}
                    {selected && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#10B981] text-white flex items-center justify-center border-2 border-white">
                        <Check size={9} />
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-medium text-slate-600 max-w-[54px] truncate">
                    {c.name.split(' ')[0]}
                  </span>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="px-3 py-2 rounded-xl bg-[#F4F7FC] text-[11px] text-slate-500">
            Frequent transfer recipients will appear here automatically.
          </div>
        )}
      </div>

      {/* Source Account Pill */}
      <div className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-[#F4F7FC] border border-slate-200/70 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[#002B5B] text-white flex items-center justify-center flex-shrink-0">
            <Landmark size={14} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-[#002B5B] truncate">Blue ridge Checking</p>
            <p className="text-[10px] text-slate-400">•••• {String(user?.accountNumber || '').slice(-4)}</p>
          </div>
        </div>
        <span className="font-mono text-xs font-bold text-[#0052CC] flex-shrink-0">
          {fmtUSD(user?.balance || 0)}
        </span>
      </div>

      {/* Oversized Amount Box */}
      <div className="p-3.5 rounded-2xl border border-slate-200/80 bg-[#F8FAFC] focus-within:bg-white focus-within:border-[#0052CC] focus-within:ring-4 focus-within:ring-blue-500/10 transition-all mb-3">
        <label className="block text-[11px] font-medium text-slate-400 mb-1">Enter amount</label>
        <div className="flex items-center gap-1.5">
          <span className="text-xl font-bold text-[#002B5B]">$</span>
          <input
            type="number"
            min="1"
            step="0.01"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full bg-transparent text-2xl font-mono font-bold text-[#002B5B] outline-none placeholder:text-slate-300"
          />
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {[100, 500, 1000].map(preset => (
            <button
              key={preset}
              type="button"
              onClick={() => setAmount(String(preset))}
              className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white border border-slate-200/80 text-[#002B5B] hover:border-[#0052CC] hover:text-[#0052CC] transition-colors cursor-pointer"
            >
              ${preset.toLocaleString()}
            </button>
          ))}
        </div>
      </div>

      {/* Recipient Email */}
      <div className="mb-4">
        <input
          type="email"
          value={recipientEmail}
          onChange={e => setRecipientEmail(e.target.value)}
          placeholder="Recipient email address"
          className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] focus:bg-white focus:border-[#0052CC] focus:ring-4 focus:ring-blue-500/10 px-3.5 py-2.5 text-xs sm:text-sm outline-none transition-all text-[#0A192F]"
        />
      </div>

      {/* Send Money CTA */}
      <button
        type="button"
        onClick={startTransfer}
        disabled={sending}
        className="w-full py-3 rounded-full text-xs sm:text-sm font-semibold text-white flex items-center justify-center gap-2 shadow-brand transition-all hover:opacity-95 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
        style={{ background: 'linear-gradient(135deg, #0052CC 0%, #003D99 100%)' }}
      >
        <Send size={14} />
        <span>Send {num > 0 ? fmtUSD(num) : 'Money'}</span>
      </button>

      <TransactionAuthModal
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        onConfirm={executeTransfer}
      />
    </div>
  )
}
