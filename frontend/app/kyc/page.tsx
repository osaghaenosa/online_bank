'use client'
import { useState, useRef } from 'react'
import { UploadCloud, ShieldCheck, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { useAuth } from '@/store/auth'
import { api } from '@/lib/api'
import clsx from 'clsx'

export default function KycPage() {
  const { user, toast } = useAuth()
  const [loading, setLoading] = useState(false)
  const [ssnOrBvn, setSsnOrBvn] = useState('')
  const [idCardFile, setIdCardFile] = useState<File | null>(null)
  const [otherDocFile, setOtherDocFile] = useState<File | null>(null)
  const idInputRef = useRef<HTMLInputElement>(null)
  const otherInputRef = useRef<HTMLInputElement>(null)

  const kycStatus = (user as any)?.kyc

  const handleUpload = async (file: File) => {
    // Re-use the admin profile picture upload endpoint but via the generic image upload.
    // Actually we added api.admin.uploadImage, but it's protected by adminOnly.
    // Wait, the generic image upload might be admin only... I should check that.
    // We can use a base64 string for now to avoid the admin requirement, or update the generic uploader to be public.
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ssnOrBvn) return toast('SSN or BVN is required', 'error')
    if (!idCardFile) return toast('ID Card is required', 'error')
    if (!otherDocFile) return toast('Other Verification Document is required', 'error')

    try {
      const token = localStorage.getItem('nexabank_token')
      if (!token) {
        toast('Authentication token missing. Please log in again.', 'error')
        setTimeout(() => window.location.href = '/auth/login', 2000)
        return
      }
      setLoading(true)

      const formData = new FormData()
      formData.append('ssnOrBvn', ssnOrBvn)
      formData.append('idCard', idCardFile)
      formData.append('otherVerification', otherDocFile)

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
      const res = await fetch(`${baseUrl}/users/kyc`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || data.message || 'Failed to submit KYC')

      toast('KYC Submitted Successfully', 'success')
      window.location.href = '/dashboard'
    } catch (err: any) {
      toast(err.message || 'Failed to submit KYC', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (kycStatus === 'Verified') {
    return (
      <div className="max-w-2xl mx-auto mt-12 text-center">
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mx-auto mb-6">
          <CheckCircle2 size={40} />
        </div>
        <h2 className="text-3xl font-bold font-display text-gray-900 mb-4">KYC Verified</h2>
        <p className="text-gray-500">Your account is fully verified. You have access to all banking features.</p>
      </div>
    )
  }

  if (kycStatus === 'Pending') {
    return (
      <div className="max-w-2xl mx-auto mt-12 text-center">
        <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 mx-auto mb-6">
          <AlertCircle size={40} />
        </div>
        <h2 className="text-3xl font-bold font-display text-gray-900 mb-4">Verification Pending</h2>
        <p className="text-gray-500">Your KYC documents are currently under review by our team. We will notify you once your account is verified.</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-display text-gray-900 flex items-center gap-3">
          <ShieldCheck className="text-[#10B981]" size={32} />
          KYC Verification
        </h1>
        <p className="text-gray-500 mt-2">Please provide your details below to verify your identity and unlock all account features.</p>
      </div>

      {/* Why KYC */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 mb-6">
        <h3 className="text-sm font-bold text-blue-900 mb-2 flex items-center gap-2">
          <ShieldCheck size={15} className="text-blue-600" />
          Why do we need to verify your identity?
        </h3>
        <p className="text-sm text-blue-800 mb-3">
          KYC (Know Your Customer) is a regulatory requirement that helps us prevent fraud, money laundering, and financial crime. It is required by financial regulators worldwide for all banking services.
        </p>
        <p className="text-sm text-blue-700 font-medium mb-2">Completing KYC unlocks:</p>
        <ul className="text-sm text-blue-700 space-y-1 list-none">
          <li className="flex items-center gap-2">✅ Withdrawals &amp; international transfers</li>
          <li className="flex items-center gap-2">✅ Virtual &amp; physical debit card</li>
          <li className="flex items-center gap-2">✅ Higher transaction limits</li>
          <li className="flex items-center gap-2">✅ Access to Wealth &amp; Investment features</li>
          <li className="flex items-center gap-2">✅ Full account protection &amp; insurance</li>
        </ul>
        <p className="text-xs text-blue-600 mt-3">🔒 Your documents are encrypted, stored securely, and never shared with third parties without your consent.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* SSN / BVN */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">SSN or BVN (9 - 11 digits)</label>
              <input
                type="text"
                value={ssnOrBvn}
                onChange={(e) => setSsnOrBvn(e.target.value)}
                placeholder="Enter your SSN or BVN"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] outline-none transition-all"
                required
              />
            </div>

            {/* ID Card */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Government Issued ID Card</label>
              <p className="text-xs text-gray-500 mb-4">Upload a clear photo of your Driver's License, Passport, or National ID.</p>
              
              <div 
                onClick={() => idInputRef.current?.click()}
                className={clsx(
                  "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors",
                  idCardFile ? "border-[#10B981] bg-emerald-50" : "border-gray-300 hover:border-[#10B981] hover:bg-gray-50"
                )}
              >
                <input 
                  type="file" 
                  ref={idInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={(e) => setIdCardFile(e.target.files?.[0] || null)}
                />
                <UploadCloud className={clsx("mx-auto mb-3", idCardFile ? "text-[#10B981]" : "text-gray-400")} size={32} />
                <p className="font-medium text-gray-900">{idCardFile ? idCardFile.name : 'Click to upload ID Card'}</p>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB</p>
              </div>
            </div>

            {/* Other Verification */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Other Verification Document (Utility Bill)</label>
              <p className="text-xs text-gray-500 mb-4">Upload a recent utility bill or bank statement showing your address.</p>
              
              <div 
                onClick={() => otherInputRef.current?.click()}
                className={clsx(
                  "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors",
                  otherDocFile ? "border-[#10B981] bg-emerald-50" : "border-gray-300 hover:border-[#10B981] hover:bg-gray-50"
                )}
              >
                <input 
                  type="file" 
                  ref={otherInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={(e) => setOtherDocFile(e.target.files?.[0] || null)}
                />
                <UploadCloud className={clsx("mx-auto mb-3", otherDocFile ? "text-[#10B981]" : "text-gray-400")} size={32} />
                <p className="font-medium text-gray-900">{otherDocFile ? otherDocFile.name : 'Click to upload Document'}</p>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB</p>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading || !ssnOrBvn || !idCardFile || !otherDocFile}
                className="w-full py-4 px-6 bg-[#10B981] hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : 'Submit Verification'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
