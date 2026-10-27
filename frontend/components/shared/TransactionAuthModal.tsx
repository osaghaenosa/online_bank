import { useState } from 'react'
import { ShieldCheck, Loader2, Lock, HelpCircle, ArrowRight, Coins } from 'lucide-react'
import Link from 'next/link'

type Props = {
  isOpen: boolean
  onClose: () => void
  onConfirm: (pin: string, trackTokenNumber?: string) => Promise<void>
  requireTtn?: boolean
}

export function TransactionAuthModal({ isOpen, onClose, onConfirm, requireTtn = true }: Props) {
  const [pin, setPin] = useState('')
  const [ttn, setTtn] = useState('')
  const [step, setStep] = useState<'pin' | 'ttn' | 'processing'>('pin')
  const [showTtnHelp, setShowTtnHelp] = useState(false)

  if (!isOpen) return null

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pin.length >= 4) {
      if (!requireTtn) {
        setStep('processing')
        try {
          await new Promise(r => setTimeout(r, 1000))
          await onConfirm(pin)
        } finally {
          setStep('pin')
          setPin('')
        }
      } else {
        setStep('ttn')
      }
    }
  }

  const handleTtnSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ttn) return

    setStep('processing')

    try {
      await new Promise(r => setTimeout(r, 1500))
      await onConfirm(pin, ttn)
    } finally {
      setStep('pin')
      setPin('')
      setTtn('')
    }
  }

  if (step === 'processing') {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4">
        <div
          className="bg-white p-8 max-w-sm w-full text-center shadow-2xl border-2"
          style={{ borderColor: '#002B5B', borderTop: '5px solid #0052CC' }}
        >
          <Loader2 size={44} className="animate-spin mx-auto mb-4" style={{ color: '#0052CC' }} />
          <h2 className="text-xl font-bold font-display mb-2" style={{ color: '#002B5B' }}>
            Authorizing Transaction
          </h2>
          <p className="text-xs text-slate-600">
            Verifying cryptographic credentials with Blue ridge Bank clearing network...
          </p>
        </div>
      </div>
    )
  }

  if (step === 'ttn') {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4">
        <div
          className="bg-white p-6 sm:p-8 max-w-sm w-full shadow-2xl relative border-2"
          style={{ borderColor: '#002B5B', borderTop: '5px solid #0052CC' }}
        >
          <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 text-lg font-bold">&times;</button>

          <div className="flex justify-center mb-5">
            <div className="w-14 h-14 flex items-center justify-center text-white" style={{ background: '#002B5B' }}>
              <Coins size={26} />
            </div>
          </div>

          <h2 className="text-xl font-bold font-display text-center mb-2" style={{ color: '#002B5B' }}>
            Track Token Number
          </h2>
          <p className="text-center text-slate-600 mb-6 text-xs leading-relaxed">
            Enter your Track Token Number (TTN) to authorize this settlement. (10 Tokens Required)
          </p>

          <form onSubmit={handleTtnSubmit} className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider" style={{ color: '#002B5B' }}>
                  Track Token Number (TTN)
                </label>
                <button type="button" onClick={() => setShowTtnHelp(true)} style={{ color: '#0052CC' }}>
                  <HelpCircle size={15} />
                </button>
              </div>
              <input
                type="text"
                value={ttn}
                onChange={(e) => setTtn(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 focus:border-[#0052CC] outline-none transition-all text-center text-base font-mono uppercase"
                placeholder="ENTER TTN CODE"
                required
              />
            </div>

            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={() => setStep('pin')}
                className="flex-1 py-3 px-4 text-xs font-bold uppercase tracking-wider text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-all"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={!ttn}
                className="flex-[2] py-3 px-4 text-xs font-bold uppercase tracking-wider text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ background: '#0052CC' }}
              >
                Authorize Settlement
              </button>
            </div>
          </form>

          {showTtnHelp && (
            <div className="absolute inset-0 bg-white z-10 p-6 flex flex-col text-center border-2" style={{ borderColor: '#002B5B' }}>
              <div className="w-12 h-12 flex items-center justify-center mx-auto mb-4 text-white" style={{ background: '#0052CC' }}>
                <HelpCircle size={22} />
              </div>
              <h3 className="text-base font-bold font-display mb-2" style={{ color: '#002B5B' }}>What is a TTN?</h3>
              <p className="text-xs text-slate-600 mb-6 flex-1 leading-relaxed">
                A Track Token Number (TTN) is required for outbound settlements to ensure full cryptographic auditability. You can acquire tokens from the Security Tokens section.
              </p>
              <div className="space-y-2">
                <Link
                  href="/tokens"
                  onClick={onClose}
                  className="block w-full py-2.5 px-4 text-xs font-bold uppercase tracking-wider text-white"
                  style={{ background: '#0052CC' }}
                >
                  Acquire Tokens Now
                </Link>
                <button
                  onClick={() => setShowTtnHelp(false)}
                  className="block w-full py-2.5 px-4 text-xs font-bold uppercase tracking-wider text-slate-700 bg-slate-100 border border-slate-300"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4">
      <div
        className="bg-white p-6 sm:p-8 max-w-sm w-full shadow-2xl relative border-2"
        style={{ borderColor: '#002B5B', borderTop: '5px solid #0052CC' }}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 text-lg font-bold">&times;</button>

        <div className="flex justify-center mb-5">
          <div className="w-14 h-14 flex items-center justify-center text-white" style={{ background: '#002B5B' }}>
            <ShieldCheck size={28} />
          </div>
        </div>

        <h2 className="text-xl font-bold font-display text-center mb-2" style={{ color: '#002B5B' }}>
          Security Authorization
        </h2>
        <p className="text-center text-slate-600 mb-6 text-xs">
          Please enter your numeric Transaction PIN to authorize this request.
        </p>

        <form onSubmit={handlePinSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#002B5B' }}>
              Transaction PIN
            </label>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              className="w-full px-4 py-3 border border-slate-300 focus:border-[#0052CC] outline-none transition-all text-center text-xl font-mono tracking-widest"
              placeholder="••••"
              required
            />
          </div>

          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 py-1">
            <Lock size={12} style={{ color: '#0052CC' }} />
            <span>Encrypted end-to-end verification</span>
          </div>

          <button
            type="submit"
            disabled={pin.length < 4}
            className="w-full py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            style={{ background: '#0052CC' }}
          >
            Continue <ArrowRight size={15} />
          </button>
        </form>
      </div>
    </div>
  )
}
