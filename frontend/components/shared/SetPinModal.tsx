import { useState } from 'react'
import { Lock, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/store/auth'

export function SetPinModal() {
  const { toast } = useAuth()
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pin.length < 4) return toast('PIN must be at least 4 digits', 'error')
    if (pin !== confirmPin) return toast('PINs do not match', 'error')

    try {
      setLoading(true)
      await api.user.setPin(pin)
      toast('Transaction PIN set successfully', 'success')
      window.location.reload()
    } catch (err: any) {
      toast(err.message || 'Failed to set PIN', 'error')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4">
      <div
        className="bg-white p-6 sm:p-8 max-w-sm w-full shadow-2xl relative border-2"
        style={{ borderColor: '#002B5B', borderTop: '5px solid #0052CC' }}
      >
        <div className="flex justify-center mb-5">
          <div
            className="w-14 h-14 flex items-center justify-center text-white"
            style={{ background: '#002B5B' }}
          >
            <Lock size={26} />
          </div>
        </div>

        <h2 className="text-xl font-bold font-display text-center mb-2" style={{ color: '#002B5B' }}>
          Establish Transaction PIN
        </h2>
        <p className="text-center text-slate-600 mb-6 text-xs leading-relaxed">
          A numeric security PIN is required to authorize transfers, deposits, and withdrawals on your Blue ridge Bank account.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#002B5B' }}>
              New Security PIN (4–6 Digits)
            </label>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              className="w-full px-4 py-3 border border-slate-300 focus:border-[#0052CC] outline-none transition-all text-center text-2xl font-mono tracking-widest"
              placeholder="••••"
              required
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#002B5B' }}>
              Confirm Security PIN
            </label>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
              className="w-full px-4 py-3 border border-slate-300 focus:border-[#0052CC] outline-none transition-all text-center text-2xl font-mono tracking-widest"
              placeholder="••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || pin.length < 4 || confirmPin.length < 4}
            className="w-full py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ background: '#0052CC' }}
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Activate Security PIN'}
          </button>
        </form>
      </div>
    </div>
  )
}
