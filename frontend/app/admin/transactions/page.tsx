'use client'
import { useEffect, useState, useCallback } from 'react'
import { api, fmtUSD, fmtDateTime } from '@/lib/api'
import { Card, Button, SectionHeader, StatusBadge, ConfirmModal } from '@/components/ui'
import { Check, X, Plus, ArrowLeft, ArrowRight, Clock, AlertCircle } from 'lucide-react'
import { useAuth } from '@/store/auth'

const FILTERS = ['all', 'pending', 'completed', 'failed']

export default function AdminTransactionsPage() {
  const { toast } = useAuth()
  const [txs,      setTxs]     = useState<any[]>([])
  const [loading,  setLoading] = useState(true)
  const [filter,   setFilter]  = useState('pending') // default to pending so withdrawals are front & centre
  const [page,     setPage]    = useState(1)
  const [pagination, setPag]   = useState({ pages: 1, total: 0 })
  const [confirm,  setConfirm] = useState<any>(null)
  const [processing, setProc]  = useState(false)
  const [addModal, setAddModal] = useState(false)
  const [addForm,  setAddForm] = useState({ userId: '', type: 'credit', amount: '', description: '' })
  const [users,    setUsers]   = useState<any[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string,string> = { page: String(page), limit: '25' }
      if (filter !== 'all') params.status = filter
      const d = await api.admin.transactions(params)
      setTxs(d.transactions); setPag(d.pagination)
    } catch {} finally { setLoading(false) }
  }, [page, filter])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    api.admin.users({ limit: '100' })
      .then(d => { setUsers(d.users); setAddForm(p => ({ ...p, userId: d.users[0]?._id || '' })) })
      .catch(() => {})
  }, [])

  const updateStatus = async (txId: string, status: string, reason?: string) => {
    setProc(true)
    try {
      const d = await api.admin.updateTxStatus(txId, { status, reason })
      if (d.approved) {
        toast(`Withdrawal approved — ${fmtUSD(d.transaction.amount)} deducted from user balance`, 'success')
      } else if (d.rejected) {
        toast('Withdrawal rejected — no funds deducted', 'success')
      } else {
        toast(`Transaction marked as ${status}`, 'success')
      }
      load() // reload to reflect changes
    } catch (err: any) { toast(err.message, 'error') }
    finally { setProc(false); setConfirm(null) }
  }

  const pendingWithdrawals = txs.filter(t => t.status === 'pending' && t.category === 'withdrawal')

  return (
    <div className="space-y-4 sm:space-y-5">

      {/* Pending withdrawals alert banner */}
      {filter !== 'pending' && pendingWithdrawals.length > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl cursor-pointer"
          style={{ background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.35)' }}
          onClick={() => { setFilter('pending'); setPage(1) }}>
          <Clock size={16} className="text-amber-500 flex-shrink-0" />
          <p className="text-sm font-medium text-amber-700 flex-1">
            <strong>{pendingWithdrawals.length} pending withdrawal{pendingWithdrawals.length > 1 ? 's' : ''}</strong> awaiting your approval.
          </p>
          <span className="text-xs font-semibold text-amber-600 hover:text-amber-800">Review →</span>
        </div>
      )}

      <Card className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div className="flex gap-2 flex-wrap">
            {FILTERS.map(f => (
              <button key={f} onClick={() => { setFilter(f); setPage(1) }}
                className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all font-sans cursor-pointer capitalize relative"
                style={{
                  background:   filter === f ? '#0F1C35' : 'var(--color-surface)',
                  borderColor:  filter === f ? '#0F1C35' : 'var(--color-border)',
                  color:        filter === f ? '#fff'    : 'var(--color-muted)'
                }}>
                {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                {f === 'pending' && pendingWithdrawals.length > 0 && filter !== 'pending' && (
                  <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-400 text-white text-[9px] font-bold">
                    {pendingWithdrawals.length}
                  </span>
                )}
              </button>
            ))}
          </div>
          <Button variant="primary" size="sm" onClick={() => setAddModal(true)}>
            <Plus size={14} /> Add Transaction
          </Button>
        </div>

        {/* Pending explanation */}
        {filter === 'pending' && (
          <div className="flex items-start gap-3 p-3 rounded-xl mb-4"
            style={{ background: 'rgba(245,158,11,.06)', border: '1px solid rgba(245,158,11,.2)' }}>
            <AlertCircle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              <strong>Withdrawal requests</strong> are held here pending your approval. 
              Approving deducts the amount from the user's balance. Rejecting cancels with no deduction.
            </p>
          </div>
        )}

        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                {['Description','User','Amount','Category','Date','Status','Actions'].map(h => (
                  <th key={h} className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--color-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}><td colSpan={7} className="py-2 px-3">
                      <div className="shimmer h-10 rounded-xl" />
                    </td></tr>
                  ))
                : txs.length === 0
                  ? <tr><td colSpan={7} className="text-center py-12 text-sm" style={{ color: 'var(--color-muted)' }}>
                      {filter === 'pending' ? '✅ No pending transactions' : 'No transactions found'}
                    </td></tr>
                  : txs.map(tx => {
                      const u = tx.userId
                      const isPendingWithdrawal = tx.status === 'pending' && tx.category === 'withdrawal'
                      return (
                        <tr key={tx._id}
                          className="border-b transition-colors hover:opacity-90"
                          style={{
                            borderColor: 'var(--color-border)',
                            background: isPendingWithdrawal ? 'rgba(245,158,11,.03)' : 'transparent'
                          }}>
                          <td className="py-3 px-3 font-medium text-xs max-w-[160px]">
                            <div className="flex items-center gap-1.5">
                              {isPendingWithdrawal && <Clock size={11} className="text-amber-500 flex-shrink-0" />}
                              <span className="truncate">{tx.description}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-xs" style={{ color: 'var(--color-muted)' }}>
                            {u ? `${u.firstName} ${u.lastName}` : '—'}
                          </td>
                          <td className="py-3 px-3">
                            <span className={`font-mono font-bold text-xs ${tx.type === 'credit' ? 'text-emerald-600' : 'text-red-500'}`}>
                              {tx.type === 'credit' ? '+' : '-'}{fmtUSD(tx.amount)}
                            </span>
                            {tx.fee > 0 && (
                              <p className="text-[10px]" style={{ color: 'var(--color-muted)' }}>
                                +{fmtUSD(tx.fee)} fee
                              </p>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                              style={{ background: 'var(--color-bg)', color: 'var(--color-muted)' }}>
                              {tx.category?.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-xs" style={{ color: 'var(--color-muted)' }}>
                            {fmtDateTime(tx.createdAt)}
                          </td>
                          <td className="py-3 px-3"><StatusBadge status={tx.status} /></td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1.5">
                              {isPendingWithdrawal && (
                                <>
                                  <Button variant="secondary" size="xs"
                                    style={{ color: '#10B981', borderColor: '#10B981' }}
                                    onClick={() => setConfirm({
                                      txId: tx._id, status: 'completed', label: 'Approve',
                                      msg: `Approve withdrawal of ${fmtUSD(tx.amount)} for ${u?.firstName}? This will deduct ${fmtUSD(tx.amount + (tx.fee||0))} from their balance.`,
                                      variant: 'primary'
                                    })}>
                                    <Check size={11} /> Approve
                                  </Button>
                                  <Button variant="secondary" size="xs"
                                    style={{ color: '#EF4444', borderColor: '#EF4444' }}
                                    onClick={() => setConfirm({
                                      txId: tx._id, status: 'failed', label: 'Reject',
                                      msg: `Reject withdrawal of ${fmtUSD(tx.amount)} for ${u?.firstName}? No funds will be deducted.`,
                                      variant: 'danger'
                                    })}>
                                    <X size={11} /> Reject
                                  </Button>
                                </>
                              )}
                              {tx.status === 'pending' && tx.category !== 'withdrawal' && (
                                <>
                                  <Button variant="secondary" size="xs"
                                    style={{ color: '#10B981', borderColor: '#10B981' }}
                                    onClick={() => setConfirm({
                                      txId: tx._id, status: 'completed', label: 'Complete',
                                      msg: 'Mark this transaction as completed?', variant: 'primary'
                                    })}>
                                    <Check size={11} /> Complete
                                  </Button>
                                  <Button variant="secondary" size="xs"
                                    style={{ color: '#EF4444', borderColor: '#EF4444' }}
                                    onClick={() => setConfirm({
                                      txId: tx._id, status: 'failed', label: 'Fail',
                                      msg: 'Mark this transaction as failed?', variant: 'danger'
                                    })}>
                                    <X size={11} /> Fail
                                  </Button>
                                </>
                              )}
                              {tx.status === 'completed' && (
                                <Button variant="secondary" size="xs"
                                  style={{ color: '#EF4444', borderColor: '#EF4444' }}
                                  onClick={() => setConfirm({
                                    txId: tx._id, status: 'failed', label: 'Mark Failed',
                                    msg: 'Mark this completed transaction as failed?', variant: 'danger'
                                  })}>
                                  <X size={11} /> Fail
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })
              }
            </tbody>
          </table>
        </div>

        {pagination.pages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-5 pt-4 border-t"
            style={{ borderColor: 'var(--color-border)' }}>
            <Button variant="secondary" size="sm" disabled={page === 1}
              onClick={() => setPage(p => p - 1)}>
              <ArrowLeft size={14} />
            </Button>
            <span className="text-xs sm:text-sm" style={{ color: 'var(--color-muted)' }}>
              Page {page} of {pagination.pages} ({pagination.total} total)
            </span>
            <Button variant="secondary" size="sm" disabled={page === pagination.pages}
              onClick={() => setPage(p => p + 1)}>
              <ArrowRight size={14} />
            </Button>
          </div>
        )}
      </Card>

      {/* Add manual transaction modal */}
      {addModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40">
          <div className="rounded-2xl p-5 sm:p-6 max-w-md w-full border"
            style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            <h3 className="font-bold text-lg mb-1">Add Manual Transaction</h3>
            <p className="text-sm mb-5" style={{ color: 'var(--color-muted)' }}>Credit or debit any account</p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold mb-1.5">User</label>
                <select value={addForm.userId}
                  onChange={e => setAddForm(p => ({ ...p, userId: e.target.value }))}
                  className="w-full rounded-xl border px-3.5 py-2.5 text-sm font-sans outline-none"
                  style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
                  {users.map(u => <option key={u._id} value={u._id}>{u.firstName} {u.lastName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Type</label>
                <select value={addForm.type}
                  onChange={e => setAddForm(p => ({ ...p, type: e.target.value }))}
                  className="w-full rounded-xl border px-3.5 py-2.5 text-sm font-sans outline-none"
                  style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
                  <option value="credit">Credit (Add Funds)</option>
                  <option value="debit">Debit (Remove Funds)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Description</label>
                <input value={addForm.description}
                  onChange={e => setAddForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Transaction description"
                  className="w-full rounded-xl border px-3.5 py-2.5 text-sm font-sans outline-none"
                  style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Amount (USD)</label>
                <input type="number" value={addForm.amount}
                  onChange={e => setAddForm(p => ({ ...p, amount: e.target.value }))}
                  placeholder="0.00"
                  className="w-full rounded-xl border px-3.5 py-2.5 text-sm font-mono outline-none"
                  style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="secondary" className="flex-1 justify-center"
                  onClick={() => setAddModal(false)}>Cancel</Button>
                <Button variant="primary" className="flex-1 justify-center"
                  onClick={async () => {
                    if (!addForm.userId || !addForm.amount || !addForm.description) {
                      toast('Fill all fields', 'error'); return
                    }
                    try {
                      await api.admin.adjustBalance({
                        userId: addForm.userId,
                        amount: parseFloat(addForm.amount),
                        type: addForm.type,
                        description: addForm.description
                      })
                      toast('Transaction added', 'success')
                      setAddModal(false)
                      load()
                    } catch (err: any) { toast(err.message, 'error') }
                  }}>
                  Add Transaction
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm modal */}
      {confirm && (
        <ConfirmModal
          title={`${confirm.label} Transaction?`}
          message={confirm.msg}
          confirmLabel={confirm.label}
          variant={confirm.variant || 'danger'}
          onConfirm={() => updateStatus(confirm.txId, confirm.status, confirm.reason)}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  )
}
