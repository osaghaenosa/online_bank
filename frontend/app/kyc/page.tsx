'use client'
import { useState, useRef } from 'react'
import { UploadCloud, ShieldCheck, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { useAuth } from '@/store/auth'
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
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
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
      <div className="max-w-2xl mx-auto mt-12 p-8 bg-white border-2 text-center" style={{ borderColor: '#002B5B', borderTop: '5px solid #0052CC' }}>
        <div className="w-16 h-16 flex items-center justify-center text-white mx-auto mb-5" style={{ background: '#0052CC' }}>
          <CheckCircle2 size={32} />
        </div>
        <h2 className="text-2xl font-bold font-display mb-2" style={{ color: '#002B5B' }}>KYC Compliance Verified</h2>
        <p className="text-sm text-slate-600">Your identity verification is complete. You have full access to all Blue ridge Bank features.</p>
      </div>
    )
  }

  if (kycStatus === 'Pending') {
    return (
      <div className="max-w-2xl mx-auto mt-12 p-8 bg-white border-2 text-center" style={{ borderColor: '#002B5B', borderTop: '5px solid #0052CC' }}>
        <div className="w-16 h-16 flex items-center justify-center text-white mx-auto mb-5" style={{ background: '#002B5B' }}>
          <AlertCircle size={32} />
        </div>
        <h2 className="text-2xl font-bold font-display mb-2" style={{ color: '#002B5B' }}>Verification Under Review</h2>
        <p className="text-sm text-slate-600">Your KYC documents are currently under review by our compliance team. We will notify you once approved.</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6 pb-4 border-b-2" style={{ borderColor: '#002B5B' }}>
        <p className="text-[11px] font-mono uppercase tracking-widest font-bold mb-1" style={{ color: '#0052CC' }}>
          REGULATORY COMPLIANCE
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold font-display flex items-center gap-3" style={{ color: '#002B5B' }}>
          <ShieldCheck style={{ color: '#0052CC' }} size={28} />
          Identity Verification (KYC)
        </h1>
        <p className="text-sm mt-1" style={{ color: '#475569' }}>
          Submit your identification documents below to unlock full settlement limits and card issuance.
        </p>
      </div>

      {/* Why KYC */}
      <div className="p-5 mb-6 border-l-4" style={{ background: '#EBF2FF', borderColor: '#0052CC' }}>
        <h3 className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2" style={{ color: '#002B5B' }}>
          <ShieldCheck size={15} style={{ color: '#0052CC' }} />
          Regulatory Compliance Notice
        </h3>
        <p className="text-xs leading-relaxed mb-3" style={{ color: '#1E3A5F' }}>
          Know Your Customer (KYC) verification is required by international banking regulations to protect client accounts and prevent unauthorized activity.
        </p>
        <p className="text-xs font-bold mb-1.5" style={{ color: '#002B5B' }}>Completing KYC unlocks:</p>
        <ul className="text-xs space-y-1 list-none" style={{ color: '#1E3A5F' }}>
          <li>• Domestic &amp; international wire withdrawals</li>
          <li>• Virtual &amp; commercial debit card provisioning</li>
          <li>• Elevated daily and monthly transaction limits</li>
          <li>• Full Wealth, Reserve, &amp; Trust Fund access</li>
        </ul>
      </div>

      <div className="bg-white border" style={{ borderColor: '#CBD5E1', borderTop: '4px solid #002B5B' }}>
        <div className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#002B5B' }}>
                SSN / Tax ID / National Identification Number
              </label>
              <input
                type="text"
                value={ssnOrBvn}
                onChange={(e) => setSsnOrBvn(e.target.value)}
                placeholder="Enter your SSN, Tax ID, or National ID number"
                className="w-full px-4 py-3 bg-white border border-slate-300 focus:border-[#0052CC] outline-none transition-all text-sm font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: '#002B5B' }}>
                Government-Issued Photo Identification
              </label>
              <p className="text-xs text-slate-500 mb-3">Upload a clear scan or photo of your Passport, Driver&apos;s License, or National ID Card.</p>

              <div
                onClick={() => idInputRef.current?.click()}
                className={clsx(
                  'border-2 border-dashed p-7 text-center cursor-pointer transition-colors',
                  idCardFile ? 'border-[#0052CC] bg-[#EBF2FF]' : 'border-slate-300 hover:border-[#0052CC] hover:bg-slate-50'
                )}
              >
                <input
                  type="file"
                  ref={idInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => setIdCardFile(e.target.files?.[0] || null)}
                />
                <UploadCloud className="mx-auto mb-2" style={{ color: idCardFile ? '#0052CC' : '#64748B' }} size={28} />
                <p className="font-bold text-sm" style={{ color: '#002B5B' }}>
                  {idCardFile ? idCardFile.name : 'Click to Select Photo ID Document'}
                </p>
                <p className="text-xs text-slate-500 mt-1">PNG or JPG up to 5MB</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: '#002B5B' }}>
                Proof of Address Document (Utility Bill or Bank Statement)
              </label>
              <p className="text-xs text-slate-500 mb-3">Upload a recent utility bill or statement displaying your residential address.</p>

              <div
                onClick={() => otherInputRef.current?.click()}
                className={clsx(
                  'border-2 border-dashed p-7 text-center cursor-pointer transition-colors',
                  otherDocFile ? 'border-[#0052CC] bg-[#EBF2FF]' : 'border-slate-300 hover:border-[#0052CC] hover:bg-slate-50'
                )}
              >
                <input
                  type="file"
                  ref={otherInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => setOtherDocFile(e.target.files?.[0] || null)}
                />
                <UploadCloud className="mx-auto mb-2" style={{ color: otherDocFile ? '#0052CC' : '#64748B' }} size={28} />
                <p className="font-bold text-sm" style={{ color: '#002B5B' }}>
                  {otherDocFile ? otherDocFile.name : 'Click to Select Proof of Address'}
                </p>
                <p className="text-xs text-slate-500 mt-1">PNG or JPG up to 5MB</p>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || !ssnOrBvn || !idCardFile || !otherDocFile}
                className="w-full py-4 px-6 text-white text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: '#0052CC' }}
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : 'Submit Compliance Documents'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
