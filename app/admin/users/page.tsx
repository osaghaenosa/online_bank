'use client'
import { useState } from 'react'
import { useStore } from '@/store'
import { Card, Button, Input, SectionHeader, StatusBadge, Divider, ConfirmModal } from '@/components/ui'
import { TxRow } from '@/components/shared/TxRow'
import { fmtUSD } from '@/lib/utils'
import { User } from '@/store'

export default function AdminUsersPage() {
  const { state, dispatch, toast } = useStore()
  const { users, transactions, theme } = state
  const [selected, setSelected] = useState<User | null>(null)
  const [adjAmt, setAdjAmt] = useState('')
  const [adjType, setAdjType] = useState<'credit' | 'debit'>('credit')
  const [confirmToggle, setConfirmToggle] = useState<User | null>(null)

  const selectedUser = selected ? users.find(u => u.id === selected.id) ?? selected : null
  const userTxs = selectedUser ? transactions.filter(t => t.userId === selectedUser.id) : []

  const handleAdjust = () => {
    if (!selectedUser || !adjAmt || parseFloat(adjAmt) <= 0) {
      toast('Enter a valid amount', 'error')
      return
    }
    const delta = adjType === 'credit' ? parseFloat(adjAmt) : -parseFloat(adjAmt)
    dispatch({ type: 'UPDATE_BALANCE', userId: selectedUser.id, delta })
    toast(`Balance ${adjType === 'credit' ? 'credited' : 'debited'}: ${fmtUSD(parseFloat(adjAmt))}`, 'success')
    setAdjAmt('')
  }

  const handleToggle = (u: User) => {
    dispatch({ type: 'TOGGLE_USER_STATUS', userId: u.id })
    toast(`User account ${u.status === 'active' ? 'suspended' : 'activated'}`, 'success')
    setConfirmToggle(null)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* User list */}
      <Card className="p-6">
        <SectionHeader title={`All Users (${users.length})`} />
        <div className="space-y-0">
          {users.map(u => (
            <div
              key={u.id}
              className="flex items-center gap-3 py-3.5 border-b last:border-b-0 cursor-pointer rounded-xl px-2 -mx-2 transition-all hover:opacity-80"
              style={{
                borderColor: 'var(--color-border)',
                background: selectedUser?.id === u.id ? 'var(--color-bg)' : undefined,
              }}
              onClick={() => setSelected(u)}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                style={{ background: theme.primaryColor }}
              >
                {u.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{u.name}</p>
                <p className="text-xs truncate" style={{ color: 'var(--color-muted)' }}>{u.email}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-mono font-bold">{fmtUSD(u.balance)}</p>
                <StatusBadge status={u.status} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* User detail */}
      {selectedUser ? (
        <div className="space-y-5">
          <Card className="p-6">
            <div className="flex items-center gap-4 mb-5">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold flex-shrink-0"
                style={{ background: theme.primaryColor }}
              >
                {selectedUser.name[0]}
              </div>
              <div>
                <p className="text-lg font-bold">{selectedUser.name}</p>
                <p className="text-sm" style={{ color: 'var(--color-muted)' }}>{selectedUser.email}</p>
              </div>
            </div>

            {[
              ['Balance', fmtUSD(selectedUser.balance)],
              ['Routing', selectedUser.routing],
              ['Account', '••••' + selectedUser.accountNo.replace(/ /g, '').slice(-4)],
              ['KYC', <StatusBadge key="kyc" status={selectedUser.kyc} />],
              ['Status', <StatusBadge key="st" status={selectedUser.status} />],
            ].map(([l, v], i) => (
              <div key={i} className="flex justify-between py-2.5 border-b last:border-b-0" style={{ borderColor: 'var(--color-border)' }}>
                <span className="text-xs" style={{ color: 'var(--color-muted)' }}>{l}</span>
                <span className="text-sm font-semibold">{v}</span>
              </div>
            ))}

            <Divider className="my-4" />

            <p className="text-sm font-bold mb-3">Adjust Balance</p>
            <div className="flex gap-2 mb-3">
              {(['credit', 'debit'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setAdjType(t)}
                  className="flex-1 py-2 rounded-xl text-sm font-semibold capitalize border-2 transition-all font-sans cursor-pointer"
                  style={{
                    borderColor: adjType === t ? theme.accentColor : 'var(--color-border)',
                    background: adjType === t ? theme.accentColor + '15' : 'var(--color-surface)',
                    color: adjType === t ? theme.accentColor : 'var(--color-text)',
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                className="flex-1 rounded-xl border px-3.5 py-2.5 text-sm font-mono outline-none"
                style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                placeholder="Amount"
                value={adjAmt}
                onChange={e => setAdjAmt(e.target.value)}
              />
              <Button variant="primary" onClick={handleAdjust} accentColor={theme.accentColor}>
                Apply
              </Button>
            </div>

            <Button
              variant={selectedUser.status === 'active' ? 'danger' : 'secondary'}
              className="w-full justify-center mt-4"
              onClick={() => setConfirmToggle(selectedUser)}
            >
              {selectedUser.status === 'active' ? 'Suspend Account' : 'Activate Account'}
            </Button>
          </Card>

          <Card className="p-6">
            <SectionHeader title="Recent Transactions" />
            {userTxs.length === 0
              ? <p className="text-sm text-center py-6" style={{ color: 'var(--color-muted)' }}>No transactions</p>
              : userTxs.slice(0, 5).map(tx => <TxRow key={tx.id} tx={tx} />)
            }
          </Card>
        </div>
      ) : (
        <Card className="p-6 flex items-center justify-center" style={{ minHeight: 200 }}>
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Select a user to view details</p>
        </Card>
      )}

      {/* Confirm modal */}
      {confirmToggle && (
        <ConfirmModal
          title={confirmToggle.status === 'active' ? 'Suspend Account?' : 'Activate Account?'}
          message={`Are you sure you want to ${confirmToggle.status === 'active' ? 'suspend' : 'activate'} ${confirmToggle.name}'s account?`}
          confirmLabel={confirmToggle.status === 'active' ? 'Suspend' : 'Activate'}
          variant={confirmToggle.status === 'active' ? 'danger' : 'primary'}
          onConfirm={() => handleToggle(confirmToggle)}
          onCancel={() => setConfirmToggle(null)}
        />
      )}
    </div>
  )
}
