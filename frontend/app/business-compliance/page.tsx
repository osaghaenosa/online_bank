'use client'
import { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { UploadCloud, Building2, CheckCircle2, AlertTriangle, Loader2, ArrowRight, Clock } from 'lucide-react'
import { useAuth } from '@/store/auth'
import clsx from 'clsx'

export default function BusinessCompliancePage() {
  const { user, refreshUser, toast } = useAuth()
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [registrationFile, setRegistrationFile] = useState<File | null>(null)
  const [directorIdFile, setDirectorIdFile] = useState<File | null>(null)
  const [boardResolutionFile, setBoardResolutionFile] = useState<File | null>(null)
  const [businessActivity, setBusinessActivity] = useState('')

  const regInputRef = useRef<HTMLInputElement>(null)
  const dirInputRef = useRef<HTMLInputElement>(null)
  const boardInputRef = useRef<HTMLInputElement>(null)

  if (!user) return null

  const complianceStatus = user.businessDetails?.complianceStatus || 'Not Started'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!registrationFile) return toast('Company registration documents are required', 'error')
    if (!directorIdFile) return toast('ID and proof of address for directors/signatories/beneficial owners is required', 'error')
    if (!boardResolutionFile) return toast('Board resolution or authorization document is required', 'error')
    if (!businessActivity.trim()) return toast('Please describe what the business does and expected activity', 'error')

    try {
      const token = localStorage.getItem('nexabank_token')
      if (!token) {
        toast('Authentication token missing. Please log in again.', 'error')
        router.push('/auth/login')
        return
      }
      setLoading(true)

      const formData = new FormData()
      formData.append('registrationDocs', registrationFile)
      formData.append('directorIdAndProof', directorIdFile)
      formData.append('boardResolution', boardResolutionFile)
      formData.append('businessActivity', businessActivity.trim())

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
      const res = await fetch(`${baseUrl}/users/business-compliance`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || data.message || 'Failed to submit business compliance')

      await refreshUser()
      toast('Business compliance submitted for review!', 'success')
      router.push('/dashboard')
    } catch (err: any) {
      toast(err.message || 'Failed to submit business compliance', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (complianceStatus === 'Verified') {
    return (
      <div className="max-w-xl mx-auto mt-8 p-8 bg-white rounded-3xl border border-slate-200/80 shadow-float text-center fade-up">
        <div className="w-16 h-16 rounded-full flex items-center justify-center bg-[#ECFDF5] text-[#059669] mx-auto mb-5">
          <CheckCircle2 size={32} />
        </div>
        <h2 className="text-2xl font-bold font-display mb-2 text-[#002B5B]">Business Account Activated</h2>
        <p className="text-sm text-slate-500 mb-6">
          {user.businessDetails?.companyName || 'Your business'} has completed corporate KYB compliance. Full inbound and outbound banking is enabled.
        </p>
        <Link href="/dashboard" className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs font-bold uppercase text-white bg-[#0052CC]">
          Return to Dashboard <ArrowRight size={14} />
        </Link>
      </div>
    )
  }

  if (complianceStatus === 'Pending') {
    return (
      <div className="max-w-xl mx-auto mt-8 p-8 bg-white rounded-3xl border border-slate-200/80 shadow-float text-center fade-up">
        <div className="w-16 h-16 rounded-full flex items-center justify-center bg-[#EBF2FF] text-[#0052CC] mx-auto mb-5">
          <Clock size={32} />
        </div>
        <h2 className="text-2xl font-bold font-display mb-2 text-[#002B5B]">Business Compliance Under Review</h2>
        <p className="text-sm text-slate-600 mb-4">
          Your corporate documents for <strong>{user.businessDetails?.companyName}</strong> have been received and are under review by our commercial compliance desk.
        </p>
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 p-3 rounded-2xl mb-6">
          Your account remains in <strong>Receive-Only Mode</strong> until verification is approved. Outbound transfers, withdrawals, and bill payments will unlock automatically upon approval.
        </p>
        <Link href="/dashboard" className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs font-bold uppercase text-white bg-[#002B5B]">
          Go to Dashboard <ArrowRight size={14} />
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 fade-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="inline-block px-3 py-1 rounded-full text-[11px] font-semibold bg-[#EBF2FF] text-[#0052CC] mb-2">
            Corporate KYB Activation
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold font-display flex items-center gap-3 text-[#002B5B]">
            <Building2 className="text-[#0052CC]" size={28} />
            Activate Your Business Account
          </h1>
          <p className="text-sm mt-1 text-slate-500">
            {user.businessDetails?.companyName ? `Entity: ${user.businessDetails.companyName}` : 'Complete corporate verification so we can know your business.'}
          </p>
        </div>

        <Link
          href="/dashboard"
          className="px-4 py-2.5 rounded-full border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-[#002B5B] whitespace-nowrap self-start sm:self-auto"
        >
          Complete Later (Receive-Only) →
        </Link>
      </div>

      {/* Disturbing Alert Banner */}
      <div className="p-5 rounded-3xl bg-red-50 border-2 border-red-400 text-red-900">
        <div className="flex items-start gap-3">
          <AlertTriangle size={22} className="text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-red-800">
              Account Restricted: Receive-Only Mode Active
            </p>
            <p className="text-xs mt-1 leading-relaxed">
              Your business account can currently <strong>only receive funds</strong>. Outbound transfers, withdrawals, and bill payments are disabled until you submit and verify the corporate compliance documents below.
            </p>
            {complianceStatus === 'Rejected' && user.businessDetails?.rejectionReason && (
              <p className="text-xs font-semibold mt-2 text-red-700">
                Previous Submission Rejected: {user.businessDetails.rejectionReason}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. Company registration documents */}
          <div>
            <label className="block text-xs font-semibold mb-1 text-[#002B5B]">
              1. Company Registration Documents <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-slate-500 mb-3">
              Upload your certificate of incorporation, articles of association, or official registry extract.
            </p>
            <div
              onClick={() => regInputRef.current?.click()}
              className={clsx(
                'rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition-all',
                registrationFile ? 'border-[#0052CC] bg-[#EBF2FF]' : 'border-slate-200 bg-[#F8FAFC] hover:border-[#0052CC]'
              )}
            >
              <input
                type="file"
                ref={regInputRef}
                className="hidden"
                accept="image/*,.pdf"
                onChange={(e) => setRegistrationFile(e.target.files?.[0] || null)}
              />
              <UploadCloud size={22} className="mx-auto mb-2 text-[#0052CC]" />
              <p className="font-semibold text-sm text-[#002B5B]">
                {registrationFile ? registrationFile.name : 'Click to Upload Company Registration Documents'}
              </p>
              <p className="text-xs text-slate-400 mt-1">PDF, PNG, or JPG up to 15MB</p>
            </div>
          </div>

          {/* 2. ID and proof of address for directors, signatories and beneficial owners */}
          <div>
            <label className="block text-xs font-semibold mb-1 text-[#002B5B]">
              2. ID &amp; Proof of Address for Directors, Signatories &amp; Beneficial Owners <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-slate-500 mb-3">
              Upload a combined PDF or image containing government-issued ID and recent proof of address for all directors, authorized signatories, and beneficial owners.
            </p>
            <div
              onClick={() => dirInputRef.current?.click()}
              className={clsx(
                'rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition-all',
                directorIdFile ? 'border-[#0052CC] bg-[#EBF2FF]' : 'border-slate-200 bg-[#F8FAFC] hover:border-[#0052CC]'
              )}
            >
              <input
                type="file"
                ref={dirInputRef}
                className="hidden"
                accept="image/*,.pdf"
                onChange={(e) => setDirectorIdFile(e.target.files?.[0] || null)}
              />
              <UploadCloud size={22} className="mx-auto mb-2 text-[#0052CC]" />
              <p className="font-semibold text-sm text-[#002B5B]">
                {directorIdFile ? directorIdFile.name : 'Click to Upload Director / UBO IDs & Proof of Address'}
              </p>
              <p className="text-xs text-slate-400 mt-1">PDF, PNG, or JPG up to 15MB</p>
            </div>
          </div>

          {/* 3. Board resolution */}
          <div>
            <label className="block text-xs font-semibold mb-1 text-[#002B5B]">
              3. Board Resolution or Equivalent Authorization <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-slate-500 mb-3">
              Upload a signed board resolution or corporate mandate authorizing the opening and operation of this bank account.
            </p>
            <div
              onClick={() => boardInputRef.current?.click()}
              className={clsx(
                'rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition-all',
                boardResolutionFile ? 'border-[#0052CC] bg-[#EBF2FF]' : 'border-slate-200 bg-[#F8FAFC] hover:border-[#0052CC]'
              )}
            >
              <input
                type="file"
                ref={boardInputRef}
                className="hidden"
                accept="image/*,.pdf"
                onChange={(e) => setBoardResolutionFile(e.target.files?.[0] || null)}
              />
              <UploadCloud size={22} className="mx-auto mb-2 text-[#0052CC]" />
              <p className="font-semibold text-sm text-[#002B5B]">
                {boardResolutionFile ? boardResolutionFile.name : 'Click to Upload Board Resolution / Mandate'}
              </p>
              <p className="text-xs text-slate-400 mt-1">PDF, PNG, or JPG up to 15MB</p>
            </div>
          </div>

          {/* 4. Business description & expected activity */}
          <div>
            <label className="block text-xs font-semibold mb-1 text-[#002B5B]">
              4. Business Description &amp; Expected Account Activity <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-slate-500 mb-2">
              Provide a short description of what your business does, your primary markets, and the expected monthly transaction volume and activity.
            </p>
            <textarea
              rows={4}
              required
              value={businessActivity}
              onChange={(e) => setBusinessActivity(e.target.value)}
              placeholder="e.g. B2B software consulting firm serving North American clients; expecting $150,000/month in incoming client ACH/wire settlements and vendor/payroll payouts."
              className="w-full px-4 py-3 rounded-xl bg-[#F8FAFC] focus:bg-white border border-slate-200 focus:border-[#0052CC] focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm text-[#0A192F]"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              href="/dashboard"
              className="sm:w-1/3 py-3.5 px-4 rounded-full border border-slate-300 text-center text-xs font-bold text-[#002B5B] hover:bg-slate-50"
            >
              Skip for Later
            </Link>
            <button
              type="submit"
              disabled={loading || !registrationFile || !directorIdFile || !boardResolutionFile || !businessActivity.trim()}
              className="flex-1 py-3.5 px-6 rounded-full text-white text-sm font-semibold shadow-brand transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              style={{ background: 'linear-gradient(135deg, #0052CC 0%, #003D99 100%)' }}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : 'Submit Business Compliance & Activate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
