'use client'
import { useState } from 'react'
import { useStore } from '@/store'
import { Transaction, TxCat, TxStatus, TxType, genId } from '@/store'
import { Card, Button, SectionHeader, StatusBadge, ConfirmModal } from '@/components/ui'
import { fmtUSD, fmtDate } from '@/lib/utils'
import { Plus, Check, X } from 'lucide-react'

const FILTERS: { label: string; val: 'all' | TxStatus }[] = [
  { label: 'All', val: 'all' },
  { label: 'Completed', val: 'completed' },
  { label: 'Pending', val: 'pending' },
  { label: 'Failed', val: 'failed' },
]

export default function AdminTransactionsPage() {
  const { state, dispatch, toast } = useStore()
  const { transactions, users, theme } = state
  const [filter, setFilter] = useState<'all' | TxStatus>('all')
  const [addModal, setAddModal] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{ txId: string; status: TxStatus; label: string } | null>(null)
  const [addForm, setAddForm] = useState({
    userId: 'u1',
    type: 'credit' as TxType,
    cat: 'transfer' as TxCat,
    desc: '',
    amount: '',
    status: 'completed' as TxStatus,
  })

  const filtered = filter === 'all' ? transactions : transactions.filter(t => t.status === filter)

  const updateStatus = (txId: string, status: TxStatus) => {
    dispatch({ type: 'UPDATE_TX_STATUS', txId, status })
    toast(`Transaction marked as ${status}`, 'success')
    setConfirmAction(null)
  }

  const addManual = () => {
    if (!addForm.desc || !addForm.amount) { toast('Fill all fields', 'error'); return }
    const tx: Transaction = {
      id: genId(),
      userId: addForm.userId,
      type: addForm.type,
      cat: addForm.cat,
      desc: addForm.desc,
      amount: parseFloat(addForm.amount),
      status: addForm.status,
      date: new Date().toISOString(),
      ref: genId(),
    }
    dispatch({ type: 'ADD_ADMIN_TX', tx })
    setAddModal(false)
    toast('Transaction added successfully', 'success')
    setAddForm({ userId: 'u1', type: 'credit', cat: 'transfer', desc: '', amount: '', status: 'completed' })
  }

  return (
    <div className="space-y-5">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div className="flex gap-2 flex-wrap">
            {FILTERS.map(f => (
              <button
                key={f.val}
                onClick={() => setFilter(f.val)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all font-sans cursor-pointer capitalize"
                style={{
                  background: filter === f.val ? theme.primaryColor : 'var(--color-surface)',
                  borderColor: filter === f.val ? theme.primaryColor : 'var(--color-border)',
                  color: filter === f.val ? '#fff' : 'var(--color-muted)',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
          <Button variant="primary" size="sm" onClick={() => setAddModal(true)} accentColor={theme.accentColor}>
            <Plus size={14} /> Add Transaction
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                {['Description', 'User', 'Amount', 'Date', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 25).map(tx => {
                const u = users.find(u => u.id === tx.userId)
                return (
                  <tr
                    key={tx.id}
                    className="border-b transition-colors hover:opacity-80"
                    style={{ borderColor: 'var(--color-border)' }}
                  >
                    <td className="py-3 px-3 font-medium">{tx.desc}</td>
                    <td className="py-3 px-3 text-xs" style={{ color: 'var(--color-muted)' }}>{u?.name}</td>
                    <td className="py-3 px-3">
                      <span className={`font-mono font-bold text-xs ${tx.type === 'credit' ? 'text-emerald-600' : 'text-red-500'}`}>
                        {tx.type === 'credit' ? '+' : '-'}{fmtUSD(tx.amount)}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-xs" style={{ color: 'var(--color-muted)' }}>{fmtDate(tx.date)}</td>
                    <td className="py-3 px-3"><StatusBadge status={tx.status} /></td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        {tx.status === 'pending' && (
                          <>
                            <Button
                              variant="secondary"
                              size="sm"
                              style={{ color: '#10B981', borderColor: '#10B981' }}
                              onClick={() => setConfirmAction({ txId: tx.id, status: 'completed', label: 'Approve' })}
                            >
                              <Check size={12} /> Approve
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              style={{ color: '#EF4444', borderColor: '#EF4444' }}
                              onClick={() => setConfirmAction({ txId: tx.id, status: 'failed', label: 'Reject' })}
                            >
                              <X size={12} /> Reject
                            </Button>
                          </>
                        )}
                        {tx.status === 'completed' && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setConfirmAction({ txId: tx.id, status: 'failed', label: 'Mark Failed' })}
                          >
                            <X size={12} /> Fail
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
      </Card>

      {/* Add Modal */}
      {addModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40">
          <div
            className="rounded-2xl p-6 max-w-md w-full border"
            style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
          >
            <h3 className="font-bold text-lg mb-1">Add Manual Transaction</h3>
            <p className="text-sm mb-5" style={{ color: 'var(--color-muted)' }}>Credit or debit any user account</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5">User</label>
                <select
                  className="w-full rounded-xl border px-3.5 py-2.5 text-sm font-sans outline-none"
                  style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                  value={addForm.userId}
                  onChange={e => setAddForm(p => ({ ...p, userId: e.target.value }))}
                >
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Type</label>
                  <select
                    className="w-full rounded-xl border px-3.5 py-2.5 text-sm font-sans outline-none"
                    style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                    value={addForm.type}
                    onChange={e => setAddForm(p => ({ ...p, type: e.target.value as TxType }))}
                  >
                    <option value="credit">Credit (Add)</option>
                    <option value="debit">Debit (Remove)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Status</label>
                  <select
                    className="w-full rounded-xl border px-3.5 py-2.5 text-sm font-sans outline-none"
                    style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                    value={addForm.status}
                    onChange={e => setAddForm(p => ({ ...p, status: e.target.value as TxStatus }))}
                  >
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5">Description</label>
                <input
                  className="w-full rounded-xl border px-3.5 py-2.5 text-sm font-sans outline-none"
                  style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                  placeholder="Transaction description"
                  value={addForm.desc}
                  onChange={e => setAddForm(p => ({ ...p, desc: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5">Amount (USD)</label>
                <input
                  type="number"
                  className="w-full rounded-xl border px-3.5 py-2.5 text-sm font-mono outline-none"
                  style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                  placeholder="0.00"
                  value={addForm.amount}
                  onChange={e => setAddForm(p => ({ ...p, amount: e.target.value }))}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="secondary" className="flex-1 justify-center" onClick={() => setAddModal(false)}>Cancel</Button>
                <Button variant="primary" className="flex-1 justify-center" onClick={addManual} accentColor={theme.accentColor}>
                  Add Transaction
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm action modal */}
      {confirmAction && (
        <ConfirmModal
          title={`${confirmAction.label} Transaction?`}
          message={`Are you sure you want to mark this transaction as ${confirmAction.status}? This action cannot be easily undone.`}
          confirmLabel={confirmAction.label}
          variant={confirmAction.status === 'completed' ? 'primary' : 'danger'}
          onConfirm={() => updateStatus(confirmAction.txId, confirmAction.status)}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  )
}
