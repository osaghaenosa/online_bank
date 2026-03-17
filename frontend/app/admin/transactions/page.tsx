'use client'
import { useEffect, useState, useCallback } from 'react'
import { api, fmtUSD, fmtDateTime } from '@/lib/api'
import { Card, Button, SectionHeader, StatusBadge, ConfirmModal } from '@/components/ui'
import { Check, X, Plus, ArrowLeft, ArrowRight } from 'lucide-react'
import { useAuth } from '@/store/auth'

const FILTERS = ['all','completed','pending','failed']

export default function AdminTransactionsPage() {
  const { toast } = useAuth()
  const [txs, setTxs]         = useState<any[]>([])
  const [loading, setLoading]  = useState(true)
  const [filter, setFilter]    = useState('all')
  const [page, setPage]        = useState(1)
  const [pagination, setPag]   = useState({ pages: 1, total: 0 })
  const [confirm, setConfirm]  = useState<any>(null)
  const [addModal, setAddModal] = useState(false)
  const [addForm, setAddForm]  = useState({ userId: '', type: 'credit', amount: '', description: '', status: 'completed' })
  const [users, setUsers]      = useState<any[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string,string> = { page: String(page), limit: '20' }
      if (filter !== 'all') params.status = filter
      const d = await api.admin.transactions(params)
      setTxs(d.transactions); setPag(d.pagination)
    } catch {} finally { setLoading(false) }
  }, [page, filter])

  useEffect(() => { load() }, [load])
  useEffect(() => { api.admin.users({ limit: '100' }).then(d => { setUsers(d.users); setAddForm(p => ({ ...p, userId: d.users[0]?._id || '' })) }).catch(() => {}) }, [])

  const updateStatus = async (txId: string, status: string) => {
    try {
      await api.admin.updateTxStatus(txId, { status })
      setTxs(p => p.map(t => t._id === txId ? { ...t, status } : t))
      toast(`Transaction marked as ${status}`, 'success')
    } catch (err: any) { toast(err.message, 'error') }
    finally { setConfirm(null) }
  }

  return (
    <div className="space-y-5">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div className="flex gap-2 flex-wrap">
            {FILTERS.map(f => (
              <button key={f} onClick={() => { setFilter(f); setPage(1) }}
                className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all font-sans cursor-pointer capitalize"
                style={{ background: filter === f ? '#0F1C35' : 'var(--color-surface)', borderColor: filter === f ? '#0F1C35' : 'var(--color-border)', color: filter === f ? '#fff' : 'var(--color-muted)' }}>
                {f === 'all' ? 'All' : f}
              </button>
            ))}
          </div>
          <Button variant="primary" size="sm" onClick={() => setAddModal(true)}>
            <Plus size={14} /> Add Transaction
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                {['Description','User','Amount','Date','Status','Actions'].map(h => (
                  <th key={h} className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({length:6}).map((_,i) => (
                    <tr key={i}><td colSpan={6} className="py-2 px-3"><div className="shimmer h-10 rounded-xl" /></td></tr>
                  ))
                : txs.map(tx => {
                    const u = tx.userId
                    return (
                      <tr key={tx._id} className="border-b transition-colors hover:opacity-80" style={{ borderColor: 'var(--color-border)' }}>
                        <td className="py-3 px-3 font-medium text-sm max-w-[180px] truncate">{tx.description}</td>
                        <td className="py-3 px-3 text-xs" style={{ color: 'var(--color-muted)' }}>{u ? `${u.firstName} ${u.lastName}` : '—'}</td>
                        <td className="py-3 px-3">
                          <span className={`font-mono font-bold text-xs ${tx.type === 'credit' ? 'text-emerald-600' : 'text-red-500'}`}>
                            {tx.type === 'credit' ? '+' : '-'}{fmtUSD(tx.amount)}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-xs" style={{ color: 'var(--color-muted)' }}>{fmtDateTime(tx.createdAt)}</td>
                        <td className="py-3 px-3"><StatusBadge status={tx.status} /></td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5">
                            {tx.status === 'pending' && (
                              <>
                                <Button variant="secondary" size="xs" style={{ color: '#10B981', borderColor: '#10B981' }}
                                  onClick={() => setConfirm({ txId: tx._id, status: 'completed', label: 'Approve' })}>
                                  <Check size={11} /> Approve
                                </Button>
                                <Button variant="secondary" size="xs" style={{ color: '#EF4444', borderColor: '#EF4444' }}
                                  onClick={() => setConfirm({ txId: tx._id, status: 'failed', label: 'Reject' })}>
                                  <X size={11} /> Reject
                                </Button>
                              </>
                            )}
                            {tx.status === 'completed' && (
                              <Button variant="secondary" size="xs"
                                onClick={() => setConfirm({ txId: tx._id, status: 'failed', label: 'Fail' })}>
                                <X size={11} /> Fail
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
            </tbody>
          </table>
        </div>

        {pagination.pages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-5 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}><ArrowLeft size={14} /></Button>
            <span className="text-sm" style={{ color: 'var(--color-muted)' }}>Page {page} of {pagination.pages} ({pagination.total} total)</span>
            <Button variant="secondary" size="sm" disabled={page === pagination.pages} onClick={() => setPage(p => p + 1)}><ArrowRight size={14} /></Button>
          </div>
        )}
      </Card>

      {/* Add modal */}
      {addModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40">
          <div className="rounded-2xl p-6 max-w-md w-full border" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            <h3 className="font-bold text-lg mb-1">Add Manual Transaction</h3>
            <p className="text-sm mb-5" style={{ color: 'var(--color-muted)' }}>Credit or debit any account</p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold mb-1.5">User</label>
                <select value={addForm.userId} onChange={e => setAddForm(p => ({ ...p, userId: e.target.value }))}
                  className="w-full rounded-xl border px-3.5 py-2.5 text-sm font-sans outline-none"
                  style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
                  {users.map(u => <option key={u._id} value={u._id}>{u.firstName} {u.lastName}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Type</label>
                  <select value={addForm.type} onChange={e => setAddForm(p => ({ ...p, type: e.target.value }))}
                    className="w-full rounded-xl border px-3.5 py-2.5 text-sm font-sans outline-none"
                    style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
                    <option value="credit">Credit (Add)</option>
                    <option value="debit">Debit (Remove)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Status</label>
                  <select value={addForm.status} onChange={e => setAddForm(p => ({ ...p, status: e.target.value }))}
                    className="w-full rounded-xl border px-3.5 py-2.5 text-sm font-sans outline-none"
                    style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Description</label>
                <input value={addForm.description} onChange={e => setAddForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Transaction description"
                  className="w-full rounded-xl border px-3.5 py-2.5 text-sm font-sans outline-none"
                  style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Amount (USD)</label>
                <input type="number" value={addForm.amount} onChange={e => setAddForm(p => ({ ...p, amount: e.target.value }))}
                  placeholder="0.00"
                  className="w-full rounded-xl border px-3.5 py-2.5 text-sm font-mono outline-none"
                  style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="secondary" className="flex-1 justify-center" onClick={() => setAddModal(false)}>Cancel</Button>
                <Button variant="primary" className="flex-1 justify-center" onClick={async () => {
                  if (!addForm.userId || !addForm.amount || !addForm.description) { toast('Fill all fields','error'); return }
                  try {
                    await api.admin.adjustBalance({ userId: addForm.userId, amount: parseFloat(addForm.amount), type: addForm.type, description: addForm.description })
                    toast('Transaction added','success'); setAddModal(false); load()
                  } catch (err: any) { toast(err.message,'error') }
                }}>Add Transaction</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirm && (
        <ConfirmModal title={`${confirm.label} Transaction?`}
          message={`Mark this transaction as ${confirm.status}? This action cannot be easily undone.`}
          confirmLabel={confirm.label}
          variant={confirm.status === 'completed' ? 'primary' : 'danger'}
          onConfirm={() => updateStatus(confirm.txId, confirm.status)}
          onCancel={() => setConfirm(null)} />
      )}
    </div>
  )
}
