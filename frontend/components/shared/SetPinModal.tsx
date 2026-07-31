import { useState } from 'react'
import { Lock, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/store/auth'
import { useRouter } from 'next/navigation'

export function SetPinModal() {
  const { toast } = useAuth()
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pin.length < 4) return toast('PIN must be at least 4 digits', 'error')
    if (pin !== confirmPin) return toast('PINs do not match', 'error')

    try {
      setLoading(true)
      await api.user.setPin(pin)
      toast('Transaction PIN set successfully', 'success')
      window.location.reload() // Reload to get fresh user context
    } catch (err: any) {
      toast(err.message || 'Failed to set PIN', 'error')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-sm w-full shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-2 bg-[#10B981]" />
        
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-[#10B981]">
            <Lock size={32} />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">Create Transaction PIN</h2>
        <p className="text-center text-gray-500 mb-6 text-sm">
          A transaction PIN is required to authorize all your transfers, deposits, and withdrawals. Keep it secure.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New PIN</label>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] outline-none transition-all text-center text-2xl tracking-widest"
              placeholder="••••"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm PIN</label>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] outline-none transition-all text-center text-2xl tracking-widest"
              placeholder="••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || pin.length < 4 || confirmPin.length < 4}
            className="w-full py-3 px-4 rounded-xl font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ background: '#10B981' }}
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : 'Secure My Account'}
          </button>
        </form>
      </div>
    </div>
  )
}
