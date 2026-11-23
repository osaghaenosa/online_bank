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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#00142B]/60 backdrop-blur-sm p-4">
      <div className="bg-white p-6 sm:p-8 max-w-sm w-full shadow-float relative rounded-3xl border border-slate-200/80 fade-up">
        <div className="flex justify-center mb-5">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-white shadow-brand"
            style={{ background: 'linear-gradient(135deg, #002B5B 0%, #0052CC 100%)' }}
          >
            <Lock size={26} />
          </div>
        </div>

        <h2 className="text-xl font-bold font-display text-center mb-2" style={{ color: '#002B5B' }}>
          Establish Transaction PIN
        </h2>
        <p className="text-center text-slate-500 mb-6 text-xs leading-relaxed">
          A numeric security PIN is required to authorize transfers, deposits, and withdrawals on your Blue ridge Bank account.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              New Security PIN (4–6 Digits)
            </label>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-[#F8FAFC] focus:bg-white focus:border-[#0052CC] focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-center text-2xl font-mono tracking-widest"
              placeholder="••••"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Confirm Security PIN
            </label>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-[#F8FAFC] focus:bg-white focus:border-[#0052CC] focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-center text-2xl font-mono tracking-widest"
              placeholder="••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || pin.length < 4 || confirmPin.length < 4}
            className="w-full py-3.5 px-4 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-brand cursor-pointer"
            style={{ background: 'linear-gradient(135deg, #0052CC 0%, #003D99 100%)' }}
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Activate Security PIN'}
          </button>
        </form>
      </div>
    </div>
  )
}
