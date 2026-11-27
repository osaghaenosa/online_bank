'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { api, fmtUSD } from '@/lib/api'
import { Card, StatCard, SectionHeader, Button, StatusBadge, Badge } from '@/components/ui'
import { TxRow } from '@/components/shared/TxRow'
import { useAuth } from '@/store/auth'
import { Users, Wallet, AlertCircle, TrendingUp, ArrowRight, ShieldCheck, X } from 'lucide-react'

export default function AdminDashboardPage() {
  const { toast } = useAuth()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [previewDoc, setPreviewDoc] = useState<{ label: string; url: string } | null>(null)
  const [actingId, setActingId] = useState<string | null>(null)

  const loadDashboard = useCallback(() => {
    api.admin.dashboard()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const handleQuickApprove = async (u: any, status: 'Verified' | 'Rejected') => {
    setActingId(u._id)
    try {
      if (u.accountType === 'business') {
        await api.admin.updateBusinessCompliance(u._id, {
          status,
          reason: status === 'Rejected' ? 'Incomplete or invalid business compliance documents.' : '',
        })
      } else {
        await api.admin.updateKyc(u._id, {
          status,
          reason: status === 'Rejected' ? 'Incomplete or invalid KYC documents.' : '',
        })
      }
      toast(`${u.firstName} ${u.lastName} ${status === 'Verified' ? 'approved' : 'rejected'}`, 'success')
      loadDashboard()
    } catch (err: any) {
      toast(err.message || 'Action failed', 'error')
    } finally {
      setActingId(null)
    }
  }

  if (loading) return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="shimmer h-28 rounded-2xl" />)}</div>
      <div className="shimmer h-64 rounded-2xl" />
    </div>
  )

  const { stats, recentTransactions, recentUsers, pendingKycUsers = [] } = data || {}

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Total Users"    value={String(stats?.totalUsers || 0)}    sub="Registered"       iconBg="bg-blue-100"    icon={<Users size={16} className="text-blue-600" />} />
        <StatCard label="System Balance" value={fmtUSD(stats?.systemBalance || 0)} sub="All accounts"     iconBg="bg-emerald-100" icon={<Wallet size={16} className="text-emerald-600" />} />
        <StatCard label="Total Deposits" value={fmtUSD(stats?.txVolume?.credit?.total || 0)} sub="Completed" iconBg="bg-violet-100" icon={<TrendingUp size={16} className="text-violet-600" />} />
        <StatCard label="Pending"        value={String(stats?.pendingTxs || 0)}    sub="Awaiting review"  iconBg="bg-amber-100"   icon={<AlertCircle size={16} className="text-amber-600" />} />
      </div>

      {/* Pending KYC & Business Compliance Submissions with Document Previews */}
      <Card className="p-4 sm:p-6">
        <SectionHeader
          title={`Pending KYC & Business Compliance (${pendingKycUsers.length})`}
          sub="Review uploaded identification and corporate documents directly from the dashboard"
          action={
            <Link href="/admin/kyc">
              <Button variant="secondary" size="sm">View All KYC <ArrowRight size={14} /></Button>
            </Link>
          }
        />

        {pendingKycUsers.length === 0 ? (
          <p className="text-xs py-6 text-center" style={{ color: 'var(--color-muted)' }}>
            No pending KYC or business compliance submissions right now.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingKycUsers.map((u: any) => {
              const isBiz = u.accountType === 'business'
              const docs: Array<{ label: string; url: string }> = []
              if (u.kycDetails?.idCard) docs.push({ label: 'ID Card', url: u.kycDetails.idCard })
              if (u.kycDetails?.otherVerification) docs.push({ label: 'Proof of Address', url: u.kycDetails.otherVerification })
              if (u.businessDetails?.registrationDocs) docs.push({ label: 'Reg Docs', url: u.businessDetails.registrationDocs })
              if (u.businessDetails?.directorIdAndProof) docs.push({ label: 'Director IDs', url: u.businessDetails.directorIdAndProof })
              if (u.businessDetails?.boardResolution) docs.push({ label: 'Board Resolution', url: u.businessDetails.boardResolution })

              return (
                <div key={u._id} className="p-4 rounded-xl border space-y-3" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)' }}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-sm truncate" style={{ color: '#002B5B' }}>
                          {isBiz && u.businessDetails?.companyName ? u.businessDetails.companyName : `${u.firstName} ${u.lastName}`}
                        </p>
                        <Badge variant={isBiz ? 'purple' : 'blue'}>{isBiz ? 'Business' : 'Personal'}</Badge>
                      </div>
                      <p className="text-xs truncate" style={{ color: 'var(--color-muted)' }}>
                        {u.firstName} {u.lastName} · {u.email}
                      </p>
                      {u.kycDetails?.ssnOrBvn && (
                        <p className="text-[11px] font-mono mt-0.5" style={{ color: 'var(--color-muted)' }}>
                          SSN/BVN: {u.kycDetails.ssnOrBvn}
                        </p>
                      )}
                    </div>
                    <StatusBadge status={isBiz ? (u.businessDetails?.complianceStatus || 'Pending') : u.kyc} />
                  </div>

                  {docs.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {docs.map((doc) => {
                        const isPdf = doc.url.startsWith('data:application/pdf') || doc.url.toLowerCase().includes('.pdf')
                        return (
                          <button
                            key={doc.label}
                            type="button"
                            onClick={() => setPreviewDoc({ label: `${u.firstName} ${u.lastName} — ${doc.label}`, url: doc.url })}
                            className="p-1.5 rounded-lg border bg-white text-left hover:border-[#0052CC] transition-colors cursor-pointer"
                            style={{ borderColor: 'var(--color-border)' }}
                          >
                            {isPdf ? (
                              <div className="h-16 flex items-center justify-center bg-slate-100 rounded text-[11px] font-bold text-[#002B5B]">
                                PDF Document
                              </div>
                            ) : (
                              <img src={doc.url} alt={doc.label} className="w-full h-16 object-cover rounded" />
                            )}
                            <p className="text-[10px] font-semibold mt-1 truncate text-[#002B5B]">{doc.label}</p>
                          </button>
                        )
                      })}
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    <Button
                      variant="primary"
                      size="xs"
                      className="flex-1"
                      loading={actingId === u._id}
                      onClick={() => handleQuickApprove(u, 'Verified')}
                    >
                      <ShieldCheck size={12} /> Approve
                    </Button>
                    <Button
                      variant="danger"
                      size="xs"
                      className="flex-1"
                      loading={actingId === u._id}
                      onClick={() => handleQuickApprove(u, 'Rejected')}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        <div className="lg:col-span-2">
          <Card className="p-4 sm:p-6">
            <SectionHeader title="Recent Transactions (All Users)" action={
              <Link href="/admin/transactions">
                <Button variant="secondary" size="sm">View All <ArrowRight size={14} /></Button>
              </Link>
            } />
            {(recentTransactions || []).slice(0, 8).map((tx: any) => (
              <TxRow key={tx._id} tx={tx} showUser={tx.userId ? `${tx.userId.firstName} ${tx.userId.lastName}` : undefined} compact />
            ))}
          </Card>
        </div>
        <div>
          <Card className="p-4 sm:p-6">
            <SectionHeader title="Recent Users" action={
              <Link href="/admin/users">
                <Button variant="secondary" size="sm">All <ArrowRight size={14} /></Button>
              </Link>
            } />
            {(recentUsers || []).map((u: any) => (
              <div key={u._id} className="flex items-center gap-3 py-3 border-b last:border-0" style={{ borderColor: 'var(--color-border)' }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ background: '#002B5B' }}>
                  {u.firstName[0]}{u.lastName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{u.firstName} {u.lastName}</p>
                  <p className="text-xs truncate" style={{ color: 'var(--color-muted)' }}>{u.email}</p>
                </div>
                <span className="text-xs font-mono font-bold">{fmtUSD(u.balance)}</span>
              </div>
            ))}
          </Card>
        </div>
      </div>

      {previewDoc && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/75" onClick={() => setPreviewDoc(null)}>
          <div className="bg-white rounded-2xl max-w-3xl w-full p-4 sm:p-5 space-y-3" onClick={(e) => e.stopPropagation()}>
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
              <iframe src={previewDoc.url} title={previewDoc.label} className="w-full h-[70vh] border rounded-lg" />
            ) : (
              <div className="max-h-[75vh] overflow-auto flex items-center justify-center bg-slate-50 rounded-xl p-2">
                <img src={previewDoc.url} alt={previewDoc.label} className="max-w-full max-h-[70vh] object-contain rounded" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
