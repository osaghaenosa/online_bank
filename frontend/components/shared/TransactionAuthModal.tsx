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
      // Small artificial delay for visual feedback of "Processing..."
      await new Promise(r => setTimeout(r, 1500))
      await onConfirm(pin, ttn)
    } finally {
      // If it throws or finishes, reset to initial state if it's still open
      // In most cases, the parent will close the modal on success or error.
      setStep('pin')
      setPin('')
      setTtn('')
    }
  }

  if (step === 'processing') {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
          <Loader2 size={48} className="animate-spin text-[#10B981] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Processing Transaction</h2>
          <p className="text-gray-500">Connecting to secure banking network... Please wait.</p>
        </div>
      </div>
    )
  }

  if (step === 'ttn') {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-sm w-full shadow-2xl relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-900">&times;</button>
          
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-[#10B981]">
              <Coins size={32} />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">Track Token Number</h2>
          <p className="text-center text-gray-500 mb-6 text-sm">
            Please enter your Track Token Number (TTN) to authorize this transaction. (Cost: 10 Tokens)
          </p>

          <form onSubmit={handleTtnSubmit} className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-700">Track Token Number (TTN)</label>
                <button type="button" onClick={() => setShowTtnHelp(true)} className="text-[#10B981] hover:text-emerald-700">
                  <HelpCircle size={16} />
                </button>
              </div>
              <input
                type="text"
                value={ttn}
                onChange={(e) => setTtn(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] outline-none transition-all text-center text-lg font-mono uppercase"
                placeholder="Enter your TTN"
                required
              />
            </div>

            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={() => setStep('pin')}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all text-sm"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={!ttn}
                className="flex-[2] py-3 px-4 rounded-xl font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                style={{ background: '#10B981' }}
              >
                Authorize
              </button>
            </div>
          </form>

          {/* TTN Help Tooltip / Popup */}
          {showTtnHelp && (
            <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-10 rounded-2xl p-6 flex flex-col text-center border border-gray-100 shadow-sm">
              <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <HelpCircle size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">What is a TTN?</h3>
              <p className="text-sm text-gray-600 mb-6 flex-1">
                A Track Token Number (TTN) is required for all outbound transactions to ensure absolute security and tracking. You can purchase tokens from your dashboard.
              </p>
              <div className="space-y-2">
                <Link href="/tokens" onClick={onClose} className="block w-full py-2.5 px-4 rounded-xl font-bold text-white bg-blue-500 hover:bg-blue-600 transition-all text-sm">
                  Buy Tokens Now
                </Link>
                <button onClick={() => setShowTtnHelp(false)} className="block w-full py-2.5 px-4 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all text-sm">
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Default: PIN view
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-sm w-full shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-900">&times;</button>
        
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-[#10B981]">
            <ShieldCheck size={32} />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">Security Check</h2>
        <p className="text-center text-gray-500 mb-6 text-sm">
          Please enter your transaction PIN to continue.
        </p>

        <form onSubmit={handlePinSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Transaction PIN</label>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] outline-none transition-all text-center text-xl tracking-widest"
              placeholder="••••"
              required
            />
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-gray-500 py-2">
            <Lock size={12} className="text-emerald-500" />
            <span>Your PIN is securely encrypted end-to-end. We do not store your raw PIN.</span>
          </div>

          <button
            type="submit"
            disabled={pin.length < 4}
            className="w-full py-3 px-4 rounded-xl font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            style={{ background: '#10B981' }}
          >
            Continue <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </div>
  )
}
