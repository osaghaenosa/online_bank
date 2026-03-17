'use client'
import { useEffect, useState, useCallback } from 'react'
import { api, fmtUSD } from '@/lib/api'
import { Card, Button, SectionHeader, StatusBadge, ConfirmModal } from '@/components/ui'
import { Search, ShieldAlert, ShieldCheck, CheckCircle, Clock, Plus, X, AlertTriangle } from 'lucide-react'
import { useAuth } from '@/store/auth'

const REQUIREMENT_PRESETS = [
  { type: 'kyc_upgrade',     label: 'Enhanced KYC Verification (Tier 3)', notes: 'Submit government-issued ID and proof of funds documentation' },
  { type: 'document_upload', label: 'Source of Funds Declaration',        notes: 'Provide certified documentation verifying the source of all funds' },
  { type: 'admin_review',    label: 'Compliance Team Review & Approval',  notes: 'Pending manual review by compliance officer' },
  { type: 'phone_verify',    label: 'Phone Number Verification',          notes: 'Verify mobile number via SMS code' },
  { type: 'custom',          label: 'Custom Requirement',                 notes: '' },
]

export default function AdminControlsPage() {
  const { toast } = useAuth()
  const [users,    setUsers]   = useState<any[]>([])
  const [loading,  setLoading] = useState(true)
  const [search,   setSearch]  = useState('')
  const [selected, setSelected]= useState<any>(null)
  const [actionType, setActionType] = useState<'transfer' | 'withdrawal'>('transfer')
  const [showBlockModal,  setShowBlockModal]  = useState(false)
  const [showEnableModal, setShowEnableModal] = useState(false)
  const [blockReason, setBlockReason] = useState('')
  const [selectedReqs, setSelectedReqs] = useState<string[]>([])
  const [customReqLabel, setCustomReqLabel] = useState('')
  const [processing, setProcessing] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const d = await api.admin.users({ search, limit: '50' })
      setUsers(d.users)
    } catch (err: any) { toast(err.message, 'error') }
    finally { setLoading(false) }
  }, [search])

  useEffect(() => { load() }, [load])

  const refreshUser = async (userId: string) => {
    const d = await api.admin.userDetail(userId)
    setUsers(p => p.map(u => u._id === userId ? d.user : u))
    if (selected?._id === userId) setSelected(d.user)
  }

  const handleBlock = async () => {
    if (!selected) return
    setProcessing(true)
    try {
      const reqs = selectedReqs
        .filter(r => r !== 'custom')
        .map(r => REQUIREMENT_PRESETS.find(p => p.type === r)!)
        .filter(Boolean)

      if (selectedReqs.includes('custom') && customReqLabel.trim()) {
        reqs.push({ type: 'custom', label: customReqLabel.trim(), notes: '' })
      }

      if (actionType === 'transfer') {
        await api.admin.setTransferAccess(selected._id, { enabled: false, reason: blockReason, requirements: reqs })
      } else {
        await api.admin.setWithdrawalAccess(selected._id, { enabled: false, reason: blockReason, requirements: reqs })
      }

      await refreshUser(selected._id)
      setShowBlockModal(false)
      setBlockReason(''); setSelectedReqs([]); setCustomReqLabel('')
      toast(`${actionType === 'transfer' ? 'Transfer' : 'Withdrawal'} capability blocked for ${selected.firstName}`, 'success')
    } catch (err: any) { toast(err.message, 'error') }
    finally { setProcessing(false) }
  }

  const handleEnable = async () => {
    if (!selected) return
    setProcessing(true)
    try {
      if (actionType === 'transfer') {
        await api.admin.setTransferAccess(selected._id, { enabled: true })
      } else {
        await api.admin.setWithdrawalAccess(selected._id, { enabled: true })
      }
      await refreshUser(selected._id)
      setShowEnableModal(false)
      toast(`${actionType === 'transfer' ? 'Transfer' : 'Withdrawal'} capability restored for ${selected.firstName}`, 'success')
    } catch (err: any) { toast(err.message, 'error') }
    finally { setProcessing(false) }
  }

  const handleFulfill = async (reqId: string, reqType: 'transfer' | 'withdrawal') => {
    if (!selected) return
    try {
      const d = await api.admin.fulfillRequirement(selected._id, { reqType, reqId })
      await refreshUser(selected._id)
      if (d.allRequirementsFulfilled) {
        toast(`All requirements met — ${reqType} capability auto-restored!`, 'success')
      } else {
        toast('Requirement marked as fulfilled', 'success')
      }
    } catch (err: any) { toast(err.message, 'error') }
  }

  const openBlock = (u: any, type: 'transfer' | 'withdrawal') => {
    setSelected(u); setActionType(type); setShowBlockModal(true)
    setBlockReason(''); setSelectedReqs([]); setCustomReqLabel('')
  }
  const openEnable = (u: any, type: 'transfer' | 'withdrawal') => {
    setSelected(u); setActionType(type); setShowEnableModal(true)
  }

  return (
    <div className="space-y-5">
      <Card className="p-6">
        <SectionHeader
          title="Transfer & Withdrawal Controls"
          sub="Block or restore transfer/withdrawal capabilities per account. Set requirements before re-enabling."
        />

        <div className="relative mb-5">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-muted)' }} />
          <input placeholder="Search users…" value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none font-sans"
            style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
        </div>

        {loading ? (
          <div className="space-y-3">{Array.from({length:5}).map((_,i) => <div key={i} className="shimmer h-24 rounded-xl" />)}</div>
        ) : (
          <div className="space-y-3">
            {users.map(u => {
              const txBlocked  = !u.transfersEnabled
              const wdBlocked  = !u.withdrawalsEnabled
              const txReqs     = u.transferRequirements  || []
              const wdReqs     = u.withdrawalRequirements || []

              return (
                <div key={u._id} className="rounded-2xl border overflow-hidden"
                  style={{ borderColor: 'var(--color-border)' }}>
                  {/* Header row */}
                  <div className="flex items-center gap-4 p-4"
                    style={{ background: 'var(--color-surface)' }}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                      style={{ background: '#0F1C35' }}>
                      {u.firstName[0]}{u.lastName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold">{u.firstName} {u.lastName}</p>
                        <StatusBadge status={u.status} />
                        {txBlocked && <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-red-100 text-red-600">Transfers Blocked</span>}
                        {wdBlocked && <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-orange-100 text-orange-600">Withdrawals Blocked</span>}
                      </div>
                      <p className="text-xs truncate" style={{ color: 'var(--color-muted)' }}>{u.email}</p>
                    </div>
                    <p className="text-sm font-mono font-bold hidden sm:block">{fmtUSD(u.balance)}</p>
                  </div>

                  {/* Controls */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-t"
                    style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)' }}>

                    {/* Transfer control */}
                    <div className="p-4 border-r" style={{ borderColor: 'var(--color-border)' }}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {txBlocked
                            ? <ShieldAlert size={15} className="text-red-500" />
                            : <ShieldCheck size={15} className="text-emerald-500" />
                          }
                          <span className="text-xs font-semibold">Transfers</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${txBlocked ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                            {txBlocked ? 'BLOCKED' : 'ACTIVE'}
                          </span>
                        </div>
                        {txBlocked
                          ? <Button variant="secondary" size="xs" style={{ color:'#10B981', borderColor:'#10B981' }}
                              onClick={() => openEnable(u, 'transfer')}>
                              <ShieldCheck size={11} /> Restore
                            </Button>
                          : <Button variant="secondary" size="xs" style={{ color:'#EF4444', borderColor:'#EF4444' }}
                              onClick={() => openBlock(u, 'transfer')}>
                              <ShieldAlert size={11} /> Block
                            </Button>
                        }
                      </div>
                      {txBlocked && u.transfersBlockReason && (
                        <p className="text-[10px] italic mb-2" style={{ color:'var(--color-muted)' }}>
                          Reason: {u.transfersBlockReason.slice(0, 80)}{u.transfersBlockReason.length > 80 ? '…' : ''}
                        </p>
                      )}
                      {txReqs.length > 0 && (
                        <div className="space-y-1.5">
                          {txReqs.map((req: any) => (
                            <div key={req._id} className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 min-w-0">
                                {req.fulfilled
                                  ? <CheckCircle size={11} className="text-emerald-500 flex-shrink-0" />
                                  : <Clock size={11} className="text-amber-500 flex-shrink-0" />
                                }
                                <span className="text-[10px] truncate" style={{ color:'var(--color-muted)' }}>{req.label}</span>
                              </div>
                              {!req.fulfilled && (
                                <button onClick={() => handleFulfill(req._id, 'transfer')}
                                  className="text-[10px] px-2 py-0.5 rounded font-semibold flex-shrink-0 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors">
                                  Mark Done
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Withdrawal control */}
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {wdBlocked
                            ? <ShieldAlert size={15} className="text-orange-500" />
                            : <ShieldCheck size={15} className="text-emerald-500" />
                          }
                          <span className="text-xs font-semibold">Withdrawals</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${wdBlocked ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'}`}>
                            {wdBlocked ? 'BLOCKED' : 'ACTIVE'}
                          </span>
                        </div>
                        {wdBlocked
                          ? <Button variant="secondary" size="xs" style={{ color:'#10B981', borderColor:'#10B981' }}
                              onClick={() => openEnable(u, 'withdrawal')}>
                              <ShieldCheck size={11} /> Restore
                            </Button>
                          : <Button variant="secondary" size="xs" style={{ color:'#F97316', borderColor:'#F97316' }}
                              onClick={() => openBlock(u, 'withdrawal')}>
                              <ShieldAlert size={11} /> Block
                            </Button>
                        }
                      </div>
                      {wdBlocked && u.withdrawalsBlockReason && (
                        <p className="text-[10px] italic mb-2" style={{ color:'var(--color-muted)' }}>
                          Reason: {u.withdrawalsBlockReason.slice(0, 80)}{u.withdrawalsBlockReason.length > 80 ? '…' : ''}
                        </p>
                      )}
                      {wdReqs.length > 0 && (
                        <div className="space-y-1.5">
                          {wdReqs.map((req: any) => (
                            <div key={req._id} className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 min-w-0">
                                {req.fulfilled
                                  ? <CheckCircle size={11} className="text-emerald-500 flex-shrink-0" />
                                  : <Clock size={11} className="text-amber-500 flex-shrink-0" />
                                }
                                <span className="text-[10px] truncate" style={{ color:'var(--color-muted)' }}>{req.label}</span>
                              </div>
                              {!req.fulfilled && (
                                <button onClick={() => handleFulfill(req._id, 'withdrawal')}
                                  className="text-[10px] px-2 py-0.5 rounded font-semibold flex-shrink-0 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors">
                                  Mark Done
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* ── Block modal ─────────────────────────────────────────────────── */}
      {showBlockModal && selected && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50">
          <Card className="p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto fade-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">
                Block {actionType === 'transfer' ? 'Transfers' : 'Withdrawals'} for {selected.firstName}
              </h3>
              <button onClick={() => setShowBlockModal(false)} className="hover:opacity-70 transition-opacity">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5">Block Reason <span className="text-red-500">*</span></label>
                <textarea rows={3} value={blockReason} onChange={e => setBlockReason(e.target.value)}
                  placeholder="Explain why this account's transfers are being blocked..."
                  className="w-full rounded-xl border px-3.5 py-2.5 text-sm font-sans outline-none resize-none"
                  style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Requirements to restore {actionType} capability
                  <span className="font-normal text-xs ml-1" style={{ color: 'var(--color-muted)' }}>(optional)</span>
                </label>
                <div className="space-y-2">
                  {REQUIREMENT_PRESETS.map(preset => (
                    <label key={preset.type} className="flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-colors"
                      style={{
                        background: selectedReqs.includes(preset.type) ? 'rgba(16,185,129,.06)' : 'var(--color-bg)',
                        border: `1px solid ${selectedReqs.includes(preset.type) ? 'rgba(16,185,129,.3)' : 'var(--color-border)'}`
                      }}>
                      <input type="checkbox" checked={selectedReqs.includes(preset.type)}
                        onChange={e => {
                          if (e.target.checked) setSelectedReqs(p => [...p, preset.type])
                          else setSelectedReqs(p => p.filter(r => r !== preset.type))
                        }}
                        className="mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">{preset.label}</p>
                        {preset.notes && <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>{preset.notes}</p>}
                      </div>
                    </label>
                  ))}
                  {selectedReqs.includes('custom') && (
                    <input value={customReqLabel} onChange={e => setCustomReqLabel(e.target.value)}
                      placeholder="Enter custom requirement label…"
                      className="w-full rounded-xl border px-3.5 py-2.5 text-sm font-sans outline-none ml-6"
                      style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="secondary" className="flex-1 justify-center" onClick={() => setShowBlockModal(false)}>
                  Cancel
                </Button>
                <Button variant="danger" className="flex-1 justify-center" loading={processing}
                  disabled={!blockReason.trim()} onClick={handleBlock}>
                  <ShieldAlert size={14} /> Block {actionType === 'transfer' ? 'Transfers' : 'Withdrawals'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ── Enable confirm ──────────────────────────────────────────────── */}
      {showEnableModal && selected && (
        <ConfirmModal
          title={`Restore ${actionType === 'transfer' ? 'Transfer' : 'Withdrawal'} Capability?`}
          message={`This will re-enable ${actionType} capability for ${selected.firstName} ${selected.lastName} and clear all pending requirements. Are you sure?`}
          confirmLabel={`Restore ${actionType === 'transfer' ? 'Transfers' : 'Withdrawals'}`}
          variant="primary"
          onConfirm={handleEnable}
          onCancel={() => setShowEnableModal(false)}
        />
      )}
    </div>
  )
}
