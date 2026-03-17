'use client'
import { useEffect, useState } from 'react'
import { api, fmtUSD } from '@/lib/api'
import { Card, Button, Input, SectionHeader, StatusBadge, Divider, ConfirmModal } from '@/components/ui'
import { TxRow } from '@/components/shared/TxRow'
import { Search } from 'lucide-react'
import { useAuth } from '@/store/auth'

export default function AdminUsersPage() {
  const { toast } = useAuth()
  const [users, setUsers]         = useState<any[]>([])
  const [selected, setSelected]   = useState<any>(null)
  const [userTxs, setUserTxs]     = useState<any[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [adjAmt, setAdjAmt]       = useState('')
  const [adjType, setAdjType]     = useState<'credit'|'debit'>('credit')
  const [adjDesc, setAdjDesc]     = useState('')
  const [adjLoading, setAdjLoading] = useState(false)
  const [confirmToggle, setConfirmToggle] = useState<any>(null)

  useEffect(() => {
    api.admin.users({ search }).then(d => setUsers(d.users)).catch(() => {}).finally(() => setLoading(false))
  }, [search])

  const selectUser = async (u: any) => {
    setSelected(u)
    try { const d = await api.admin.userDetail(u._id); setUserTxs(d.transactions) } catch {}
  }

  const handleAdjust = async () => {
    if (!selected || !adjAmt || parseFloat(adjAmt) <= 0) { toast('Enter a valid amount', 'error'); return }
    setAdjLoading(true)
    try {
      const d = await api.admin.adjustBalance({ userId: selected._id, amount: parseFloat(adjAmt), type: adjType, description: adjDesc })
      setSelected(d.user)
      setUsers(p => p.map(u => u._id === d.user._id ? d.user : u))
      setAdjAmt(''); setAdjDesc('')
      toast(`Balance ${adjType === 'credit' ? 'credited' : 'debited'}: ${fmtUSD(parseFloat(adjAmt))}`, 'success')
    } catch (err: any) { toast(err.message, 'error') }
    finally { setAdjLoading(false) }
  }

  const handleToggle = async (u: any) => {
    try {
      const d = await api.admin.toggleStatus(u._id)
      setUsers(p => p.map(x => x._id === d.user._id ? d.user : x))
      if (selected?._id === d.user._id) setSelected(d.user)
      toast(`Account ${d.user.status === 'active' ? 'activated' : 'suspended'}`, 'success')
    } catch (err: any) { toast(err.message, 'error') }
    finally { setConfirmToggle(null) }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* User list */}
      <Card className="p-6">
        <SectionHeader title={`All Users (${users.length})`} />
        <div className="relative mb-4">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-muted)' }} />
          <input placeholder="Search users..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none font-sans"
            style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {loading ? <div className="space-y-3">{Array.from({length:5}).map((_,i)=><div key={i} className="shimmer h-16 rounded-xl"/>)}</div> : (
          <div className="space-y-0 max-h-[520px] overflow-y-auto pr-1">
            {users.map(u => (
              <div key={u._id}
                className="flex items-center gap-3 py-3.5 border-b last:border-0 cursor-pointer rounded-xl px-2 -mx-2 transition-all hover:opacity-80"
                style={{ borderColor: 'var(--color-border)', background: selected?._id === u._id ? 'var(--color-bg)' : undefined }}
                onClick={() => selectUser(u)}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                  style={{ background: '#0F1C35' }}>
                  {u.firstName[0]}{u.lastName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{u.firstName} {u.lastName}</p>
                  <p className="text-xs truncate" style={{ color: 'var(--color-muted)' }}>{u.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono font-bold">{fmtUSD(u.balance)}</p>
                  <StatusBadge status={u.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* User detail */}
      {selected ? (
        <div className="space-y-5">
          <Card className="p-6">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold flex-shrink-0"
                style={{ background: '#0F1C35' }}>
                {selected.firstName[0]}{selected.lastName[0]}
              </div>
              <div>
                <p className="text-lg font-bold">{selected.firstName} {selected.lastName}</p>
                <p className="text-sm" style={{ color: 'var(--color-muted)' }}>{selected.email}</p>
              </div>
            </div>
            {[
              ['Balance',  fmtUSD(selected.balance)],
              ['Account',  '****' + String(selected.accountNumber || '').slice(-4)],
              ['KYC',      <StatusBadge key="k" status={selected.kyc} />],
              ['Status',   <StatusBadge key="s" status={selected.status} />],
              ['Role',     selected.role],
            ].map(([l, v], i) => (
              <div key={i} className="flex justify-between py-2.5 border-b last:border-0" style={{ borderColor: 'var(--color-border)' }}>
                <span className="text-xs" style={{ color: 'var(--color-muted)' }}>{l}</span>
                <span className="text-sm font-semibold">{v}</span>
              </div>
            ))}

            <Divider className="my-4" />
            <p className="text-sm font-bold mb-3">Adjust Balance</p>
            <div className="flex gap-2 mb-3">
              {(['credit','debit'] as const).map(t => (
                <button key={t} onClick={() => setAdjType(t)}
                  className="flex-1 py-2 rounded-xl text-sm font-semibold capitalize border-2 transition-all font-sans cursor-pointer"
                  style={{
                    borderColor: adjType === t ? '#10B981' : 'var(--color-border)',
                    background: adjType === t ? 'rgba(16,185,129,.1)' : 'var(--color-surface)',
                    color: adjType === t ? '#10B981' : 'var(--color-text)',
                  }}>
                  {t}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              <input type="number" placeholder="Amount" value={adjAmt} onChange={e => setAdjAmt(e.target.value)}
                className="w-full rounded-xl border px-3.5 py-2.5 text-sm font-mono outline-none"
                style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
              <input placeholder="Description (optional)" value={adjDesc} onChange={e => setAdjDesc(e.target.value)}
                className="w-full rounded-xl border px-3.5 py-2.5 text-sm font-sans outline-none"
                style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
              <Button variant="primary" className="w-full justify-center" onClick={handleAdjust} loading={adjLoading}>Apply</Button>
            </div>

            <Button variant={selected.status === 'active' ? 'danger' : 'secondary'}
              className="w-full justify-center mt-4"
              onClick={() => setConfirmToggle(selected)}>
              {selected.status === 'active' ? 'Suspend Account' : 'Activate Account'}
            </Button>
          </Card>

          <Card className="p-6">
            <SectionHeader title="Recent Transactions" />
            {userTxs.length === 0
              ? <p className="text-sm text-center py-6" style={{ color: 'var(--color-muted)' }}>No transactions</p>
              : userTxs.slice(0, 5).map(tx => <TxRow key={tx._id} tx={tx} compact />)}
          </Card>
        </div>
      ) : (
        <Card className="p-6 flex items-center justify-center min-h-48">
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Select a user to view details</p>
        </Card>
      )}

      {confirmToggle && (
        <ConfirmModal
          title={confirmToggle.status === 'active' ? 'Suspend Account?' : 'Activate Account?'}
          message={`Are you sure you want to ${confirmToggle.status === 'active' ? 'suspend' : 'activate'} ${confirmToggle.firstName}'s account?`}
          confirmLabel={confirmToggle.status === 'active' ? 'Suspend' : 'Activate'}
          variant={confirmToggle.status === 'active' ? 'danger' : 'primary'}
          onConfirm={() => handleToggle(confirmToggle)}
          onCancel={() => setConfirmToggle(null)}
        />
      )}
    </div>
  )
}
