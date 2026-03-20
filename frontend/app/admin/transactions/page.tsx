'use client'
import { useEffect, useState, useCallback } from 'react'
import { api, fmtUSD, fmtDateTime } from '@/lib/api'
import { Card, Button, SectionHeader, StatusBadge, ConfirmModal, Input } from '@/components/ui'
import { Check, X, Plus, ArrowLeft, ArrowRight, Clock, AlertCircle, Edit2, Trash2, Search, User } from 'lucide-react'
import { useAuth } from '@/store/auth'

const FILTERS   = ['all','pending','completed','failed']
const TX_CATS   = ['deposit','withdrawal','transfer_in','transfer_out','bill','crypto','shopping','salary','other']
const TX_TYPES  = ['credit','debit']
const TX_STATUS = ['pending','completed','failed','processing','cancelled']
const TX_METHODS = ['bank_transfer','ach','wire','card','crypto_btc','crypto_eth','crypto_usdt','crypto_bnb','crypto_sol','paypal','cashapp','venmo','zelle','internal']

export default function AdminTransactionsPage() {
  const { toast } = useAuth()

  // ── Global list ──────────────────────────────────────────────────────────
  const [txs,       setTxs]      = useState<any[]>([])
  const [loading,   setLoading]  = useState(true)
  const [filter,    setFilter]   = useState('pending')
  const [page,      setPage]     = useState(1)
  const [pagination, setPag]     = useState({ pages: 1, total: 0 })

  // ── User-drill-down mode ──────────────────────────────────────────────────
  const [users,     setUsers]    = useState<any[]>([])
  const [selectedUser, setSelUser] = useState<any>(null)
  const [userTxs,   setUserTxs]  = useState<any[]>([])
  const [userTxPage, setUTxPage] = useState(1)
  const [userTxPag,  setUTPag]   = useState({ pages: 1, total: 0 })
  const [loadingUser, setLU]     = useState(false)
  const [userSearch, setUS]      = useState('')

  // ── Edit modal ───────────────────────────────────────────────────────────
  const [editTx,    setEditTx]   = useState<any>(null)
  const [editForm,  setEditForm] = useState<any>({})
  const [savingEdit, setSavingEdit] = useState(false)
  const [confirm,   setConfirm]  = useState<any>(null)
  const [processing, setProc]    = useState(false)

  // ── Add modal ────────────────────────────────────────────────────────────
  const [addModal,  setAddModal] = useState(false)
  const [addForm,   setAddForm]  = useState({ userId:'', type:'credit', amount:'', description:'' })

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
      .then(d => { setUsers(d.users); setAddForm(p => ({ ...p, userId: d.users[0]?._id||'' })) })
      .catch(() => {})
  }, [])

  const loadUserTxs = useCallback(async (userId: string) => {
    setLU(true)
    try {
      const d = await api.admin.userTransactions(userId, { page: String(userTxPage), limit: '20' })
      setUserTxs(d.transactions); setUTPag(d.pagination)
    } catch (err: any) { toast(err.message,'error') }
    finally { setLU(false) }
  }, [userTxPage])

  useEffect(() => {
    if (selectedUser) loadUserTxs(selectedUser._id)
  }, [selectedUser, userTxPage])

  const updateStatus = async (txId: string, status: string, reason?: string) => {
    setProc(true)
    try {
      const d = await api.admin.updateTxStatus(txId, { status, reason })
      if (d.approved)  toast(`Withdrawal approved — ${fmtUSD(d.transaction.amount)} deducted`, 'success')
      else if (d.rejected) toast('Withdrawal rejected — no funds deducted', 'success')
      else             toast(`Marked as ${status}`, 'success')
      load()
      if (selectedUser) loadUserTxs(selectedUser._id)
    } catch (err: any) { toast(err.message,'error') }
    finally { setProc(false); setConfirm(null) }
  }

  const openEdit = (tx: any) => {
    setEditTx(tx)
    setEditForm({
      description: tx.description,
      amount:      tx.amount,
      fee:         tx.fee || 0,
      type:        tx.type,
      category:    tx.category,
      method:      tx.method,
      status:      tx.status,
      note:        tx.note || '',
      date:        tx.createdAt ? new Date(tx.createdAt).toISOString().slice(0,16) : '',
    })
  }

  const saveEdit = async () => {
    if (!editTx) return
    setSavingEdit(true)
    try {
      await api.admin.editTransaction(editTx._id, editForm)
      toast('Transaction updated', 'success')
      setEditTx(null)
      load()
      if (selectedUser) loadUserTxs(selectedUser._id)
    } catch (err: any) { toast(err.message,'error') }
    finally { setSavingEdit(false) }
  }

  const deleteTx = async (txId: string) => {
    try {
      await api.admin.deleteTransaction(txId)
      toast('Transaction deleted', 'success')
      setConfirm(null)
      load()
      if (selectedUser) loadUserTxs(selectedUser._id)
    } catch (err: any) { toast(err.message,'error') }
  }

  const pendingWds = txs.filter(t => t.status === 'pending' && t.category === 'withdrawal')

  const filteredUsers = users.filter(u =>
    (u.firstName + ' ' + u.lastName + ' ' + u.email).toLowerCase().includes(userSearch.toLowerCase())
  )

  // ── TX row shared between global and user views ─────────────────────────
  const TxEditRow = ({ tx }: { tx: any }) => {
    const u = tx.userId
    const isPendingWd = tx.status === 'pending' && tx.category === 'withdrawal'
    return (
      <tr className="border-b transition-colors hover:opacity-90"
        style={{ borderColor:'var(--color-border)', background: isPendingWd ? 'rgba(245,158,11,.03)' : 'transparent' }}>
        <td className="py-2.5 px-3 max-w-[150px]">
          <div className="flex items-center gap-1">
            {isPendingWd && <Clock size={10} className="text-amber-500 flex-shrink-0"/>}
            <span className="text-xs truncate font-medium">{tx.description}</span>
          </div>
          {tx.note && <p className="text-[10px] truncate mt-0.5" style={{ color:'var(--color-muted)' }}>{tx.note}</p>}
        </td>
        {!selectedUser && (
          <td className="py-2.5 px-3 text-xs" style={{ color:'var(--color-muted)' }}>
            {u ? `${u.firstName} ${u.lastName}` : '—'}
          </td>
        )}
        <td className="py-2.5 px-3">
          <span className={`font-mono font-bold text-xs ${tx.type==='credit'?'text-emerald-600':'text-red-500'}`}>
            {tx.type==='credit'?'+':'-'}{fmtUSD(tx.amount)}
          </span>
        </td>
        <td className="py-2.5 px-3">
          <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold" style={{ background:'var(--color-bg)', color:'var(--color-muted)' }}>
            {tx.category?.replace(/_/g,' ')}
          </span>
        </td>
        <td className="py-2.5 px-3 text-[10px]" style={{ color:'var(--color-muted)' }}>
          {fmtDateTime(tx.createdAt)}
        </td>
        <td className="py-2.5 px-3"><StatusBadge status={tx.status}/></td>
        <td className="py-2.5 px-3">
          <div className="flex items-center gap-1">
            {/* Approve/Reject for pending withdrawals */}
            {isPendingWd && (
              <>
                <Button variant="secondary" size="xs" style={{ color:'#10B981', borderColor:'#10B981' }}
                  onClick={() => setConfirm({ txId:tx._id, status:'completed', label:'Approve', variant:'primary',
                    msg:`Approve withdrawal of ${fmtUSD(tx.amount)} for ${u?.firstName}? This will deduct ${fmtUSD(tx.amount+(tx.fee||0))} from their balance.` })}>
                  <Check size={10}/> OK
                </Button>
                <Button variant="secondary" size="xs" style={{ color:'#EF4444', borderColor:'#EF4444' }}
                  onClick={() => setConfirm({ txId:tx._id, status:'failed', label:'Reject', variant:'danger',
                    msg:`Reject withdrawal of ${fmtUSD(tx.amount)}? No funds deducted.` })}>
                  <X size={10}/> No
                </Button>
              </>
            )}
            {/* Edit */}
            <Button variant="secondary" size="xs" onClick={() => openEdit(tx)}>
              <Edit2 size={10}/> Edit
            </Button>
            {/* Delete */}
            <Button variant="secondary" size="xs" style={{ color:'#EF4444', borderColor:'#EF4444' }}
              onClick={() => setConfirm({ action:'delete', txId:tx._id, label:'Delete', variant:'danger',
                msg:'Permanently delete this transaction? This cannot be undone.' })}>
              <Trash2 size={10}/>
            </Button>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Pending alert */}
      {filter !== 'pending' && pendingWds.length > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl cursor-pointer"
          style={{ background:'rgba(245,158,11,.08)', border:'1px solid rgba(245,158,11,.35)' }}
          onClick={() => { setFilter('pending'); setPage(1) }}>
          <Clock size={15} className="text-amber-500 flex-shrink-0"/>
          <p className="text-sm font-medium text-amber-700 flex-1">
            <strong>{pendingWds.length}</strong> pending withdrawal{pendingWds.length>1?'s':''} awaiting approval.
          </p>
          <span className="text-xs font-semibold text-amber-600">Review →</span>
        </div>
      )}

      {/* ── User drill-down panel ─────────────────────────────────── */}
      <Card className="p-4 sm:p-5">
        <SectionHeader title="Browse by User" sub="Select a user to view and edit their full transaction history"/>
        <div className="relative mb-3">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color:'var(--color-muted)' }}/>
          <input value={userSearch} onChange={e => setUS(e.target.value)} placeholder="Search users…"
            className="w-full pl-8 pr-4 py-2 rounded-xl border text-xs font-sans outline-none"
            style={{ background:'var(--color-bg)', borderColor:'var(--color-border)', color:'var(--color-text)' }}/>
        </div>
        <div className="flex gap-2 flex-wrap max-h-32 overflow-y-auto">
          {filteredUsers.slice(0,20).map(u => (
            <button key={u._id} onClick={() => { setSelUser(u); setUTxPage(1) }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all"
              style={{
                background: selectedUser?._id===u._id ? '#0F1C35' : 'var(--color-surface)',
                borderColor: selectedUser?._id===u._id ? '#0F1C35' : 'var(--color-border)',
                color: selectedUser?._id===u._id ? '#fff' : 'var(--color-text)',
              }}>
              <User size={10}/> {u.firstName} {u.lastName}
            </button>
          ))}
        </div>

        {selectedUser && (
          <div className="mt-4 border-t pt-4" style={{ borderColor:'var(--color-border)' }}>
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div>
                <p className="text-sm font-bold">{selectedUser.firstName} {selectedUser.lastName}</p>
                <p className="text-xs" style={{ color:'var(--color-muted)' }}>{selectedUser.email} · Balance: {fmtUSD(selectedUser.balance)}</p>
              </div>
              <button onClick={() => { setSelUser(null); setUserTxs([]) }}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                style={{ background:'var(--color-bg)', color:'var(--color-muted)' }}>
                Clear ×
              </button>
            </div>

            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full text-sm min-w-[580px]">
                <thead>
                  <tr style={{ borderBottom:'2px solid var(--color-border)' }}>
                    {['Description','Amount','Category','Date','Status','Actions'].map(h=>(
                      <th key={h} className="text-left py-2 px-3 text-[10px] font-semibold uppercase tracking-wider" style={{ color:'var(--color-muted)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loadingUser
                    ? Array.from({length:4}).map((_,i)=>(<tr key={i}><td colSpan={6} className="py-2 px-3"><div className="shimmer h-8 rounded-xl"/></td></tr>))
                    : userTxs.length===0
                      ? <tr><td colSpan={6} className="text-center py-8 text-xs" style={{ color:'var(--color-muted)' }}>No transactions for this user</td></tr>
                      : userTxs.map(tx => <TxEditRow key={tx._id} tx={tx}/>)
                  }
                </tbody>
              </table>
            </div>

            {userTxPag.pages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-3 pt-3 border-t" style={{ borderColor:'var(--color-border)' }}>
                <Button variant="secondary" size="xs" disabled={userTxPage===1} onClick={()=>setUTxPage(p=>p-1)}><ArrowLeft size={12}/></Button>
                <span className="text-xs" style={{ color:'var(--color-muted)' }}>{userTxPage}/{userTxPag.pages}</span>
                <Button variant="secondary" size="xs" disabled={userTxPage===userTxPag.pages} onClick={()=>setUTxPage(p=>p+1)}><ArrowRight size={12}/></Button>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* ── Global transaction list ────────────────────────────────── */}
      <Card className="p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex gap-2 flex-wrap">
            {FILTERS.map(f=>(
              <button key={f} onClick={()=>{setFilter(f);setPage(1)}}
                className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all font-sans cursor-pointer capitalize relative"
                style={{ background:filter===f?'#0F1C35':'var(--color-surface)', borderColor:filter===f?'#0F1C35':'var(--color-border)', color:filter===f?'#fff':'var(--color-muted)' }}>
                {f==='all'?'All':f.charAt(0).toUpperCase()+f.slice(1)}
                {f==='pending'&&pendingWds.length>0&&filter!=='pending'&&(
                  <span className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-400 text-white text-[9px] font-bold">{pendingWds.length}</span>
                )}
              </button>
            ))}
          </div>
          <Button variant="primary" size="sm" onClick={()=>setAddModal(true)}><Plus size={13}/> Add</Button>
        </div>

        {filter==='pending' && (
          <div className="flex items-start gap-2 p-3 rounded-xl mb-4"
            style={{ background:'rgba(245,158,11,.06)', border:'1px solid rgba(245,158,11,.2)' }}>
            <AlertCircle size={13} className="text-amber-500 flex-shrink-0 mt-0.5"/>
            <p className="text-xs text-amber-700">Pending withdrawal requests — approve to deduct funds, reject to cancel with no deduction.</p>
          </div>
        )}

        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full text-sm min-w-[620px]">
            <thead>
              <tr style={{ borderBottom:'2px solid var(--color-border)' }}>
                {['Description','User','Amount','Category','Date','Status','Actions'].map(h=>(
                  <th key={h} className="text-left py-2.5 px-3 text-[10px] font-semibold uppercase tracking-wider" style={{ color:'var(--color-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({length:6}).map((_,i)=>(<tr key={i}><td colSpan={7} className="py-2 px-3"><div className="shimmer h-10 rounded-xl"/></td></tr>))
                : txs.length===0
                  ? <tr><td colSpan={7} className="text-center py-12 text-sm" style={{ color:'var(--color-muted)' }}>
                      {filter==='pending'?'✅ No pending transactions':'No transactions found'}
                    </td></tr>
                  : txs.map(tx=><TxEditRow key={tx._id} tx={tx}/>)
              }
            </tbody>
          </table>
        </div>

        {pagination.pages>1 && (
          <div className="flex items-center justify-center gap-3 mt-4 pt-4 border-t" style={{ borderColor:'var(--color-border)' }}>
            <Button variant="secondary" size="sm" disabled={page===1} onClick={()=>setPage(p=>p-1)}><ArrowLeft size={13}/></Button>
            <span className="text-xs sm:text-sm" style={{ color:'var(--color-muted)' }}>Page {page} of {pagination.pages} ({pagination.total} total)</span>
            <Button variant="secondary" size="sm" disabled={page===pagination.pages} onClick={()=>setPage(p=>p+1)}><ArrowRight size={13}/></Button>
          </div>
        )}
      </Card>

      {/* ── Edit transaction modal ─────────────────────────────────── */}
      {editTx && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50">
          <div className="rounded-2xl p-5 sm:p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto border"
            style={{ background:'var(--color-surface)', borderColor:'var(--color-border)' }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-lg">Edit Transaction</h3>
                <p className="text-xs" style={{ color:'var(--color-muted)' }}>{editTx.transactionId}</p>
              </div>
              <button onClick={()=>setEditTx(null)} className="p-1.5 rounded-lg hover:opacity-70" style={{ background:'var(--color-bg)' }}>
                <X size={16}/>
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1.5">Description</label>
                <input value={editForm.description||''} onChange={e=>setEditForm((p:any)=>({...p,description:e.target.value}))}
                  className="w-full rounded-xl border px-3 py-2.5 text-sm font-sans outline-none"
                  style={{ background:'var(--color-surface)', borderColor:'var(--color-border)', color:'var(--color-text)' }}/>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5">Note / Memo</label>
                <input value={editForm.note||''} onChange={e=>setEditForm((p:any)=>({...p,note:e.target.value}))}
                  placeholder="Optional note"
                  className="w-full rounded-xl border px-3 py-2.5 text-sm font-sans outline-none"
                  style={{ background:'var(--color-surface)', borderColor:'var(--color-border)', color:'var(--color-text)' }}/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Amount (USD)</label>
                  <input type="number" min="0.01" step="0.01" value={editForm.amount||''}
                    onChange={e=>setEditForm((p:any)=>({...p,amount:e.target.value}))}
                    className="w-full rounded-xl border px-3 py-2.5 text-sm font-mono outline-none"
                    style={{ background:'var(--color-surface)', borderColor:'var(--color-border)', color:'var(--color-text)' }}/>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Fee (USD)</label>
                  <input type="number" min="0" step="0.01" value={editForm.fee||0}
                    onChange={e=>setEditForm((p:any)=>({...p,fee:e.target.value}))}
                    className="w-full rounded-xl border px-3 py-2.5 text-sm font-mono outline-none"
                    style={{ background:'var(--color-surface)', borderColor:'var(--color-border)', color:'var(--color-text)' }}/>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Type</label>
                  <select value={editForm.type||'debit'} onChange={e=>setEditForm((p:any)=>({...p,type:e.target.value}))}
                    className="w-full rounded-xl border px-3 py-2.5 text-sm font-sans outline-none"
                    style={{ background:'var(--color-surface)', borderColor:'var(--color-border)', color:'var(--color-text)' }}>
                    {TX_TYPES.map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Status</label>
                  <select value={editForm.status||'pending'} onChange={e=>setEditForm((p:any)=>({...p,status:e.target.value}))}
                    className="w-full rounded-xl border px-3 py-2.5 text-sm font-sans outline-none"
                    style={{ background:'var(--color-surface)', borderColor:'var(--color-border)', color:'var(--color-text)' }}>
                    {TX_STATUS.map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Category</label>
                  <select value={editForm.category||'other'} onChange={e=>setEditForm((p:any)=>({...p,category:e.target.value}))}
                    className="w-full rounded-xl border px-3 py-2.5 text-sm font-sans outline-none"
                    style={{ background:'var(--color-surface)', borderColor:'var(--color-border)', color:'var(--color-text)' }}>
                    {TX_CATS.map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Method</label>
                  <select value={editForm.method||'internal'} onChange={e=>setEditForm((p:any)=>({...p,method:e.target.value}))}
                    className="w-full rounded-xl border px-3 py-2.5 text-sm font-sans outline-none"
                    style={{ background:'var(--color-surface)', borderColor:'var(--color-border)', color:'var(--color-text)' }}>
                    {TX_METHODS.map(m=><option key={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5">Date & Time</label>
                <input type="datetime-local" value={editForm.date||''}
                  onChange={e=>setEditForm((p:any)=>({...p,date:e.target.value}))}
                  className="w-full rounded-xl border px-3 py-2.5 text-sm font-sans outline-none"
                  style={{ background:'var(--color-surface)', borderColor:'var(--color-border)', color:'var(--color-text)' }}/>
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <Button variant="secondary" className="flex-1 justify-center" onClick={()=>setEditTx(null)}>Cancel</Button>
              <Button variant="primary"   className="flex-1 justify-center" loading={savingEdit} onClick={saveEdit}>
                <Check size={14}/> Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add transaction modal ─────────────────────────────────── */}
      {addModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40">
          <div className="rounded-2xl p-5 sm:p-6 max-w-md w-full border"
            style={{ background:'var(--color-surface)', borderColor:'var(--color-border)' }}>
            <h3 className="font-bold text-lg mb-4">Add Manual Transaction</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1.5">User</label>
                <select value={addForm.userId} onChange={e=>setAddForm(p=>({...p,userId:e.target.value}))}
                  className="w-full rounded-xl border px-3.5 py-2.5 text-sm font-sans outline-none"
                  style={{ background:'var(--color-surface)', borderColor:'var(--color-border)', color:'var(--color-text)' }}>
                  {users.map(u=><option key={u._id} value={u._id}>{u.firstName} {u.lastName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5">Type</label>
                <select value={addForm.type} onChange={e=>setAddForm(p=>({...p,type:e.target.value}))}
                  className="w-full rounded-xl border px-3.5 py-2.5 text-sm font-sans outline-none"
                  style={{ background:'var(--color-surface)', borderColor:'var(--color-border)', color:'var(--color-text)' }}>
                  <option value="credit">Credit (Add Funds)</option>
                  <option value="debit">Debit (Remove Funds)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5">Description</label>
                <input value={addForm.description} onChange={e=>setAddForm(p=>({...p,description:e.target.value}))}
                  placeholder="Transaction description"
                  className="w-full rounded-xl border px-3.5 py-2.5 text-sm font-sans outline-none"
                  style={{ background:'var(--color-surface)', borderColor:'var(--color-border)', color:'var(--color-text)' }}/>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5">Amount (USD)</label>
                <input type="number" value={addForm.amount} onChange={e=>setAddForm(p=>({...p,amount:e.target.value}))}
                  placeholder="0.00"
                  className="w-full rounded-xl border px-3.5 py-2.5 text-sm font-mono outline-none"
                  style={{ background:'var(--color-surface)', borderColor:'var(--color-border)', color:'var(--color-text)' }}/>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="secondary" className="flex-1 justify-center" onClick={()=>setAddModal(false)}>Cancel</Button>
                <Button variant="primary" className="flex-1 justify-center" onClick={async()=>{
                  if(!addForm.userId||!addForm.amount||!addForm.description){toast('Fill all fields','error');return}
                  try{
                    await api.admin.adjustBalance({ userId:addForm.userId, amount:parseFloat(addForm.amount), type:addForm.type, description:addForm.description })
                    toast('Transaction added','success'); setAddModal(false); load()
                  }catch(err:any){toast(err.message,'error')}
                }}>Add Transaction</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm modal ─────────────────────────────────────────── */}
      {confirm && (
        <ConfirmModal
          title={`${confirm.label} Transaction?`}
          message={confirm.msg}
          confirmLabel={confirm.label}
          variant={confirm.variant||'danger'}
          onConfirm={() => {
            if (confirm.action==='delete') deleteTx(confirm.txId)
            else updateStatus(confirm.txId, confirm.status, confirm.reason)
          }}
          onCancel={()=>setConfirm(null)}
        />
      )}
    </div>
  )
}
