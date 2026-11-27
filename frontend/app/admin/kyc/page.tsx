'use client'
import { useEffect, useState, useCallback } from 'react'
import { api } from '@/lib/api'
import { useAuth } from '@/store/auth'
import { Card, Button, SectionHeader, StatusBadge, Badge, Empty } from '@/components/ui'
import { Search, ShieldCheck, CheckCircle, XCircle, X, FileText } from 'lucide-react'

export default function AdminKycReviewPage() {
  const { toast } = useAuth()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'all' | 'Pending' | 'Verified' | 'Rejected'>('all')
  const [search, setSearch] = useState('')
  const [reasons, setReasons] = useState<Record<string, string>>({})
  const [actingId, setActingId] = useState<string | null>(null)
  const [previewDoc, setPreviewDoc] = useState<{ label: string; url: string } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = {}
      if (statusFilter !== 'all') params.status = statusFilter
      if (search.trim()) params.search = search.trim()
      const data = await api.admin.kycSubmissions(params)
      setUsers(data.users || [])
    } catch (err: any) {
      toast(err.message || 'Failed to load KYC submissions', 'error')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, search, toast])

  useEffect(() => {
    load()
  }, [load])

  const handleAction = async (u: any, status: 'Verified' | 'Rejected') => {
    const reason = (reasons[u._id] || '').trim()
    if (status === 'Rejected' && !reason) {
      toast('Please enter a rejection reason first', 'error')
      return
    }
    setActingId(u._id)
    try {
      if (u.accountType === 'business') {
        await api.admin.updateBusinessCompliance(u._id, { status, reason })
      } else {
        await api.admin.updateKyc(u._id, { status, reason })
      }
      toast(`${u.firstName} ${u.lastName} ${status === 'Verified' ? 'approved' : 'rejected'}`, 'success')
      load()
    } catch (err: any) {
      toast(err.message || 'Failed to update KYC status', 'error')
    } finally {
      setActingId(null)
    }
  }

  return (
    <div className="space-y-5">
      <Card className="p-5">
        <SectionHeader
          title="KYC & Business Compliance Submissions"
          sub="All clients who have started personal KYC or corporate KYB verification"
        />

        <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by client, company, email, or account number..."
              className="w-full rounded-xl border pl-10 pr-3.5 py-2 text-sm outline-none"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {(['all', 'Pending', 'Verified', 'Rejected'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border transition-colors cursor-pointer"
                style={{
                  background: statusFilter === st ? '#002B5B' : '#F8FAFC',
                  borderColor: statusFilter === st ? '#002B5B' : '#CBD5E1',
                  color: statusFilter === st ? '#FFFFFF' : '#002B5B',
                }}
              >
                {st === 'all' ? 'All Started' : st}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="shimmer h-44 rounded-2xl" />)}
        </div>
      ) : users.length === 0 ? (
        <Empty
          icon={<ShieldCheck size={36} />}
          message="No KYC Submissions Found"
          sub="Clients who submit personal KYC or business compliance documents will appear here."
        />
      ) : (
        <div className="space-y-4">
          {users.map((u) => {
            const isBiz = u.accountType === 'business'
            const effectiveStatus = isBiz ? (u.businessDetails?.complianceStatus || u.kyc) : u.kyc
            const docs: Array<{ label: string; url: string }> = []
            if (u.kycDetails?.idCard) docs.push({ label: 'Government ID Card', url: u.kycDetails.idCard })
            if (u.kycDetails?.otherVerification) docs.push({ label: 'Proof of Address', url: u.kycDetails.otherVerification })
            if (u.businessDetails?.registrationDocs) docs.push({ label: 'Company Registration Docs', url: u.businessDetails.registrationDocs })
            if (u.businessDetails?.directorIdAndProof) docs.push({ label: 'Director & UBO IDs / Address', url: u.businessDetails.directorIdAndProof })
            if (u.businessDetails?.boardResolution) docs.push({ label: 'Board Resolution', url: u.businessDetails.boardResolution })

            return (
              <Card key={u._id} className="p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-base text-[#002B5B]">
                        {isBiz && u.businessDetails?.companyName ? `${u.businessDetails.companyName} (${u.firstName} ${u.lastName})` : `${u.firstName} ${u.lastName}`}
                      </h3>
                      <Badge variant={isBiz ? 'purple' : 'blue'}>{isBiz ? 'Business KYB' : 'Personal KYC'}</Badge>
                      <StatusBadge status={effectiveStatus} />
                    </div>
                    <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
                      {u.email} · Acct: <span className="font-mono">{u.accountNumber}</span>
                      {u.kycDetails?.ssnOrBvn && <> · SSN/BVN: <span className="font-mono font-semibold">{u.kycDetails.ssnOrBvn}</span></>}
                      {u.businessDetails?.registrationNumber && <> · Reg No: <span className="font-mono font-semibold">{u.businessDetails.registrationNumber}</span></>}
                    </p>
                  </div>
                  <div className="text-xs" style={{ color: 'var(--color-muted)' }}>
                    Submitted:{' '}
                    {u.kycDetails?.submittedAt || u.businessDetails?.submittedAt
                      ? new Date(u.kycDetails?.submittedAt || u.businessDetails?.submittedAt).toLocaleString()
                      : new Date(u.updatedAt).toLocaleString()}
                  </div>
                </div>

                {isBiz && u.businessDetails?.businessActivity && (
                  <div className="p-3 rounded-xl border text-xs" style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}>
                    <strong className="text-[#002B5B]">Business Activity &amp; Expected Volume:</strong>{' '}
                    {u.businessDetails.businessActivity}
                  </div>
                )}

                {docs.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {docs.map((doc) => {
                      const isPdf = doc.url.startsWith('data:application/pdf') || doc.url.toLowerCase().includes('.pdf')
                      return (
                        <div key={doc.label} className="p-2.5 rounded-xl border bg-white space-y-2" style={{ borderColor: 'var(--color-border)' }}>
                          <p className="text-xs font-bold text-[#002B5B] truncate">{doc.label}</p>
                          <button
                            type="button"
                            onClick={() => setPreviewDoc({ label: `${u.firstName} ${u.lastName} — ${doc.label}`, url: doc.url })}
                            className="block w-full overflow-hidden rounded-lg border bg-slate-50 hover:opacity-90 cursor-pointer"
                            style={{ borderColor: 'var(--color-border)' }}
                          >
                            {isPdf ? (
                              <div className="h-36 flex flex-col items-center justify-center gap-1.5 text-[#002B5B]">
                                <FileText size={28} />
                                <span className="text-xs font-semibold">Preview PDF</span>
                              </div>
                            ) : (
                              <img src={doc.url} alt={doc.label} className="w-full h-36 object-cover" />
                            )}
                          </button>
                          <div className="flex justify-between text-[11px]">
                            <button
                              type="button"
                              onClick={() => setPreviewDoc({ label: `${u.firstName} ${u.lastName} — ${doc.label}`, url: doc.url })}
                              className="font-semibold text-[#0052CC] hover:underline cursor-pointer"
                            >
                              Enlarge Preview
                            </button>
                            <a href={doc.url} target="_blank" rel="noreferrer" className="text-slate-500 hover:underline">
                              Open in Tab
                            </a>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-xs italic" style={{ color: 'var(--color-muted)' }}>No document files attached yet.</p>
                )}

                {effectiveStatus !== 'Verified' && (
                  <div className="flex flex-col sm:flex-row gap-2.5 pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
                    <input
                      placeholder="Rejection reason (required if rejecting)"
                      value={reasons[u._id] || ''}
                      onChange={(e) => setReasons((prev) => ({ ...prev, [u._id]: e.target.value }))}
                      className="flex-1 rounded-xl border px-3 py-2 text-xs outline-none"
                      style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        loading={actingId === u._id}
                        onClick={() => handleAction(u, 'Verified')}
                      >
                        <CheckCircle size={14} /> {isBiz ? 'Approve & Activate' : 'Approve KYC'}
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        loading={actingId === u._id}
                        onClick={() => handleAction(u, 'Rejected')}
                      >
                        <XCircle size={14} /> Reject
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {previewDoc && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/75" onClick={() => setPreviewDoc(null)}>
          <div className="bg-white rounded-2xl max-w-4xl w-full p-4 sm:p-5 space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b pb-2.5" style={{ borderColor: 'var(--color-border)' }}>
              <h3 className="font-bold text-sm text-[#002B5B]">{previewDoc.label}</h3>
              <div className="flex items-center gap-3">
                <a href={previewDoc.url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-[#0052CC] hover:underline">
                  Open in New Tab
                </a>
                <button type="button" onClick={() => setPreviewDoc(null)} className="p-1 rounded hover:bg-slate-100 cursor-pointer">
                  <X size={16} />
                </button>
              </div>
            </div>
            {previewDoc.url.startsWith('data:application/pdf') || previewDoc.url.toLowerCase().includes('.pdf') ? (
              <iframe src={previewDoc.url} title={previewDoc.label} className="w-full h-[75vh] border rounded-lg" />
            ) : (
              <div className="max-h-[75vh] overflow-auto flex items-center justify-center bg-slate-50 rounded-xl p-2">
                <img src={previewDoc.url} alt={previewDoc.label} className="max-w-full max-h-[72vh] object-contain rounded" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
