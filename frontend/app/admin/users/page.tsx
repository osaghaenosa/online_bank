'use client'
import { useEffect, useState } from 'react'
import { api, fmtUSD, PLATFORM_LABELS, CATEGORY_ICONS, INVESTMENT_ICONS } from '@/lib/api'
import { Card, Button, Input, Select, Toggle, SectionHeader, StatusBadge, Divider, ConfirmModal } from '@/components/ui'
import { TxRow } from '@/components/shared/TxRow'
import { Search, Bitcoin, TrendingUp, Shield, Lock, Building, ChevronDown, ChevronUp, Plus, Trash2, Edit, X } from 'lucide-react'
import { useAuth } from '@/store/auth'

export default function AdminUsersPage() {
  const { toast } = useAuth()
  const [users, setUsers]         = useState<any[]>([])
  const [selected, setSelected]   = useState<any>(null)
  const [userTxs, setUserTxs]     = useState<any[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [adjAmt, setAdjAmt]       = useState('')
  const [adjType, setAdjType]     = useState<'credit'|'debit'|'reversal'>('credit')
  const [adjDesc, setAdjDesc]     = useState('')
  const [adjEmailSubject, setAdjEmailSubject] = useState('Reversal Notice')
  const [adjEmailBody, setAdjEmailBody] = useState('A reversal has been credited to your account.')
  const [adjSendMail, setAdjSendMail] = useState(true)
  const [adjLoading, setAdjLoading] = useState(false)
  const [confirmToggle, setConfirmToggle] = useState<any>(null)

  // Wealth Management States
  const [activeTab, setActiveTab] = useState<'overview' | 'wealth'>('overview')
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const [editingCategory, setEditingCategory] = useState<string | null>(null)
  const [editingAsset, setEditingAsset] = useState<any>(null)
  const [wealthLoading, setWealthLoading] = useState(false)
  const [confirmDeleteAsset, setConfirmDeleteAsset] = useState<{ type: string; id: string; name: string } | null>(null)

  useEffect(() => {
    api.admin.users({ search }).then(d => setUsers(d.users)).catch(() => {}).finally(() => setLoading(false))
  }, [search])

  const selectUser = async (u: any) => {
    setSelected(u)
    setActiveTab('overview')
    setExpandedCategory(null)
    setEditingCategory(null)
    setEditingAsset(null)
    try { const d = await api.admin.userDetail(u._id); setUserTxs(d.transactions) } catch {}
  }

  const handleAdjust = async () => {
    if (!selected || !adjAmt || parseFloat(adjAmt) <= 0) { toast('Enter a valid amount', 'error'); return }
    setAdjLoading(true)
    try {
      if (adjType === 'reversal') {
        if (!adjDesc.trim()) { toast('Description is required for reversals', 'error'); setAdjLoading(false); return; }
        const d = await api.admin.addReversal({ 
          userId: selected._id, 
          amount: parseFloat(adjAmt), 
          description: adjDesc,
          sendMail: adjSendMail,
          emailSubject: adjEmailSubject,
          emailBody: adjEmailBody
        })
        setSelected(d.user)
        setUsers(p => p.map(u => u._id === d.user._id ? d.user : u))
        setAdjAmt(''); setAdjDesc('')
        toast(`Reversal of ${fmtUSD(parseFloat(adjAmt))} applied successfully`, 'success')
      } else {
        const d = await api.admin.adjustBalance({ userId: selected._id, amount: parseFloat(adjAmt), type: adjType, description: adjDesc })
        setSelected(d.user)
        setUsers(p => p.map(u => u._id === d.user._id ? d.user : u))
        setAdjAmt(''); setAdjDesc('')
        toast(`Balance ${adjType === 'credit' ? 'credited' : 'debit'}: ${fmtUSD(parseFloat(adjAmt))}`, 'success')
      }
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

  const handleKycVerify = async (u: any) => {
    try {
      const d = await api.admin.verifyKyc(u._id)
      setUsers(p => p.map(x => x._id === d.user._id ? d.user : x))
      if (selected?._id === d.user._id) setSelected(d.user)
      toast(`KYC for ${d.user.firstName} verified`, 'success')
    } catch (err: any) { toast(err.message, 'error') }
  }

  // Wealth Update handler
  const handleWealthUpdate = async (type: string, action: string, assetId?: string, data?: any) => {
    if (!selected) return
    setWealthLoading(true)
    try {
      const d = await api.admin.updateUserWealth(selected._id, { type, action, assetId, data })
      setSelected(d.user)
      setUsers(p => p.map(u => u._id === d.user._id ? d.user : u))
      setEditingCategory(null)
      setEditingAsset(null)
      toast(`User portfolio updated successfully`, 'success')
    } catch (err: any) {
      toast(err.message, 'error')
    } finally {
      setWealthLoading(false)
    }
  }

  const startAddAsset = (category: string) => {
    setEditingCategory(category)
    if (category === 'trust') {
      setEditingAsset(selected.trust || { enabled: false, name: '', balance: 0, type: '', trustee: '', beneficiary: '', established: null, notes: '' })
    } else {
      setEditingAsset({})
    }
  }

  const startEditAsset = (category: string, asset: any) => {
    setEditingCategory(category)
    setEditingAsset({ ...asset })
  }

  // Wealth Totals
  const cryptoTotal   = (selected?.cryptoAssets    || []).reduce((s: number, a: any) => s + (a.valueUSD || 0), 0)
  const treasuryTotal = (selected?.treasuryAssets  || []).reduce((s: number, a: any) => s + (a.totalValue || 0), 0)
  const investTotal   = (selected?.investments     || []).reduce((s: number, a: any) => s + (a.currentValue || 0), 0)
  const linkedTotal   = (selected?.linkedAccounts  || []).reduce((s: number, a: any) => s + (a.balance || 0), 0)
  const trustTotal    = selected?.trust?.enabled ? (selected?.trust?.balance || 0) : 0

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* User list */}
      <Card className="p-4 sm:p-6">
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
          <Card className="p-4 sm:p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold flex-shrink-0"
                style={{ background: '#0F1C35' }}>
                {selected.firstName[0]}{selected.lastName[0]}
              </div>
              <div>
                <p className="text-lg font-bold">{selected.firstName} {selected.lastName}</p>
                <p className="text-sm" style={{ color: 'var(--color-muted)' }}>{selected.email}</p>
              </div>
            </div>

            {/* Custom Premium Tabs */}
            <div className="flex gap-4 border-b mb-5" style={{ borderColor: 'var(--color-border)' }}>
              <button onClick={() => setActiveTab('overview')}
                className="pb-2.5 px-1 text-sm font-semibold transition-all border-b-2 cursor-pointer"
                style={{
                  borderColor: activeTab === 'overview' ? 'var(--color-accent)' : 'transparent',
                  color: activeTab === 'overview' ? 'var(--color-text)' : 'var(--color-muted)',
                }}>
                Overview & Balance
              </button>
              <button onClick={() => setActiveTab('wealth')}
                className="pb-2.5 px-1 text-sm font-semibold transition-all border-b-2 cursor-pointer"
                style={{
                  borderColor: activeTab === 'wealth' ? 'var(--color-accent)' : 'transparent',
                  color: activeTab === 'wealth' ? 'var(--color-text)' : 'var(--color-muted)',
                }}>
                Portfolio & Wealth
              </button>
            </div>

            {activeTab === 'overview' ? (
              <>
                {[
                  ['Balance',  fmtUSD(selected.balance)],
                  ['Account',  '****' + String(selected.accountNumber || '').slice(-4)],
                  ['KYC',      <div key="k" className="flex items-center gap-2">
                                 <StatusBadge status={selected.kyc} />
                                 {selected.kyc === 'pending' && (
                                   <button onClick={() => handleKycVerify(selected)} className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-bold hover:bg-emerald-200 transition-all cursor-pointer">
                                     Verify
                                   </button>
                                 )}
                               </div>],
                  ['Status',   <StatusBadge key="s" status={selected.status} />],
                  ['Role',     selected.role],
                ].map(([l, v], i) => (
                  <div key={i} className="flex justify-between py-2.5 border-b last:border-0" style={{ borderColor: 'var(--color-border)' }}>
                    <span className="text-xs" style={{ color: 'var(--color-muted)' }}>{l}</span>
                    <span className="text-sm font-semibold">{v}</span>
                  </div>
                ))}

                <Divider className="my-4" />
                <p className="text-sm font-bold mb-3">Adjust Balance & Reversals</p>
                <div className="flex gap-2 mb-3">
                  {(['credit','debit','reversal'] as const).map(t => (
                    <button key={t} onClick={() => setAdjType(t)}
                      className="flex-1 py-2 rounded-xl text-sm font-semibold capitalize border-2 transition-all font-sans cursor-pointer"
                      style={{
                        borderColor: adjType === t ? (t === 'reversal' ? '#8B5CF6' : '#10B981') : 'var(--color-border)',
                        background: adjType === t ? (t === 'reversal' ? 'rgba(139,92,246,.1)' : 'rgba(16,185,129,.1)') : 'var(--color-surface)',
                        color: adjType === t ? (t === 'reversal' ? '#8B5CF6' : '#10B981') : 'var(--color-text)',
                      }}>
                      {t}
                    </button>
                  ))}
                </div>
                <div className="space-y-2">
                  <input type="number" placeholder="Amount" value={adjAmt} onChange={e => setAdjAmt(e.target.value)}
                    className="w-full rounded-xl border px-3.5 py-2.5 text-sm font-mono outline-none"
                    style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
                  <input placeholder="Description (optional for credit/debit)" value={adjDesc} onChange={e => setAdjDesc(e.target.value)}
                    className="w-full rounded-xl border px-3.5 py-2.5 text-sm font-sans outline-none"
                    style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
                  
                  {adjType === 'reversal' && (
                    <div className="p-3 rounded-xl border mt-2 space-y-3" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)' }}>
                      <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                        <input type="checkbox" checked={adjSendMail} onChange={e => setAdjSendMail(e.target.checked)} className="rounded" />
                        Send Reversal Email to User
                      </label>
                      {adjSendMail && (
                        <div className="space-y-2">
                          <input placeholder="Email Subject" value={adjEmailSubject} onChange={e => setAdjEmailSubject(e.target.value)}
                            className="w-full rounded-lg border px-3 py-2 text-xs font-sans outline-none"
                            style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
                          <textarea placeholder="Email Body..." value={adjEmailBody} onChange={e => setAdjEmailBody(e.target.value)} rows={3}
                            className="w-full rounded-lg border px-3 py-2 text-xs font-sans outline-none resize-none"
                            style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
                        </div>
                      )}
                    </div>
                  )}

                  <Button variant="primary" className="w-full justify-center mt-2" onClick={handleAdjust} loading={adjLoading}>
                    {adjType === 'reversal' ? 'Process Reversal' : 'Apply'}
                  </Button>
                </div>

                <Button variant={selected.status === 'active' ? 'danger' : 'secondary'}
                  className="w-full justify-center mt-4"
                  onClick={() => setConfirmToggle(selected)}>
                  {selected.status === 'active' ? 'Suspend Account' : 'Activate Account'}
                </Button>
              </>
            ) : (
              <div className="space-y-4">
                <SectionHeader title="Portfolio Management" sub="Manage investments, assets, cryptos, and linked accounts" />

                {/* 1. INVESTMENTS SECTION */}
                <Card className="p-3.5 sm:p-4 hover:shadow-sm transition-all border" style={{ borderColor: 'var(--color-border)' }}>
                  <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpandedCategory(expandedCategory === 'investments' ? null : 'investments')}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-blue-50 text-blue-600">
                        <TrendingUp size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-bold">Investments</p>
                        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{(selected.investments || []).length} holdings · {fmtUSD(investTotal)}</p>
                      </div>
                    </div>
                    {expandedCategory === 'investments' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>

                  {expandedCategory === 'investments' && (
                    <div className="mt-4 pt-4 border-t space-y-3" style={{ borderColor: 'var(--color-border)' }}>
                      {(selected.investments || []).map((inv: any) => {
                        const icon = INVESTMENT_ICONS[inv.type] || '📈'
                        return (
                          <div key={inv._id} className="flex items-center justify-between p-2.5 rounded-xl text-xs" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{icon}</span>
                              <div>
                                <p className="font-bold">{inv.name}</p>
                                <p className="text-[10px]" style={{ color: 'var(--color-muted)' }}>Broker: {inv.broker || 'N/A'} · Status: {inv.status}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="font-bold font-mono">{fmtUSD(inv.currentValue)}</p>
                                <p className="text-[10px] font-semibold text-emerald-600">+{inv.returnPct}% return</p>
                              </div>
                              <div className="flex gap-1.5">
                                <button className="p-1.5 hover:bg-emerald-50 rounded-lg text-emerald-600 transition-all cursor-pointer" onClick={() => startEditAsset('investments', inv)}>
                                  <Edit size={14} />
                                </button>
                                <button className="p-1.5 hover:bg-red-50 rounded-lg text-red-500 transition-all cursor-pointer" onClick={() => setConfirmDeleteAsset({ type: 'investments', id: inv._id, name: inv.name })}>
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      })}

                      {editingCategory !== 'investments' ? (
                        <Button variant="outline" size="sm" className="w-full text-xs font-semibold" onClick={() => startAddAsset('investments')}>
                          <Plus size={14} /> Add Investment
                        </Button>
                      ) : (
                        <div className="space-y-4 p-4 rounded-xl border mt-3" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)' }}>
                          <p className="text-xs font-bold flex items-center justify-between">
                            <span>{editingAsset._id ? 'Edit Investment' : 'Add Investment'}</span>
                            <X size={14} className="cursor-pointer" onClick={() => { setEditingCategory(null); setEditingAsset(null); }} />
                          </p>
                          <div className="grid grid-cols-2 gap-3">
                            <Input label="Name" value={editingAsset.name || ''} onChange={e => setEditingAsset({...editingAsset, name: e.target.value})} required placeholder="e.g. Apple Inc" />
                            <Select label="Type" value={editingAsset.type || 'stocks'} onChange={e => setEditingAsset({...editingAsset, type: e.target.value})}>
                              <option value="stocks">Stocks 📈</option>
                              <option value="bonds">Bonds 📄</option>
                              <option value="real_estate">Real Estate 🏠</option>
                              <option value="startup">Startup 🚀</option>
                              <option value="etf">ETF 📊</option>
                              <option value="mutual_fund">Mutual Fund 🏛</option>
                              <option value="private_equity">Private Equity 💼</option>
                              <option value="commodity">Commodity 🏅</option>
                            </Select>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <Input label="Ticker / Symbol" value={editingAsset.ticker || ''} onChange={e => setEditingAsset({...editingAsset, ticker: e.target.value})} placeholder="e.g. AAPL" />
                            <Input label="Broker / Custodian" value={editingAsset.broker || ''} onChange={e => setEditingAsset({...editingAsset, broker: e.target.value})} placeholder="e.g. Fidelity" />
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            <Input label="Invested Amount" type="number" value={editingAsset.amount ?? ''} onChange={e => setEditingAsset({...editingAsset, amount: e.target.value})} prefix="$" required placeholder="0.00" />
                            <Input label="Current Value" type="number" value={editingAsset.currentValue ?? ''} onChange={e => setEditingAsset({...editingAsset, currentValue: e.target.value})} prefix="$" required placeholder="0.00" />
                            <Input label="Return % (Optional)" type="number" value={editingAsset.returnPct ?? ''} onChange={e => setEditingAsset({...editingAsset, returnPct: e.target.value})} suffix="%" placeholder="Auto" />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <Input label="Start Date" type="date" value={editingAsset.startDate ? new Date(editingAsset.startDate).toISOString().split('T')[0] : ''} onChange={e => setEditingAsset({...editingAsset, startDate: e.target.value})} />
                            <Select label="Status" value={editingAsset.status || 'active'} onChange={e => setEditingAsset({...editingAsset, status: e.target.value})}>
                              <option value="active">Active</option>
                              <option value="exited">Exited</option>
                              <option value="pending">Pending</option>
                            </Select>
                          </div>
                          <Input label="Notes" value={editingAsset.notes || ''} onChange={e => setEditingAsset({...editingAsset, notes: e.target.value})} placeholder="e.g. Core long-term holding" />
                          <div className="flex gap-2 pt-2">
                            <Button variant="secondary" size="sm" className="flex-1 text-xs" onClick={() => { setEditingCategory(null); setEditingAsset(null); }}>Cancel</Button>
                            <Button variant="primary" size="sm" className="flex-1 text-xs" loading={wealthLoading} onClick={() => handleWealthUpdate('investments', editingAsset._id ? 'edit' : 'add', editingAsset._id, editingAsset)}>Save</Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Card>

                {/* 2. CRYPTO SECTION */}
                <Card className="p-3.5 sm:p-4 hover:shadow-sm transition-all border" style={{ borderColor: 'var(--color-border)' }}>
                  <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpandedCategory(expandedCategory === 'crypto' ? null : 'crypto')}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-amber-50 text-amber-600">
                        <Bitcoin size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-bold">Crypto Assets</p>
                        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{(selected.cryptoAssets || []).length} accounts/coins · {fmtUSD(cryptoTotal)}</p>
                      </div>
                    </div>
                    {expandedCategory === 'crypto' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>

                  {expandedCategory === 'crypto' && (
                    <div className="mt-4 pt-4 border-t space-y-3" style={{ borderColor: 'var(--color-border)' }}>
                      {(selected.cryptoAssets || []).map((cry: any) => (
                        <div key={cry._id} className="flex items-center justify-between p-2.5 rounded-xl text-xs" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
                          <div>
                            <p className="font-bold">{cry.coin} ({cry.symbol})</p>
                            <p className="text-[10px]" style={{ color: 'var(--color-muted)' }}>Net: {cry.network} · {cry.quantity} units @ {fmtUSD(cry.avgBuyPrice)} avg</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="font-bold font-mono">{fmtUSD(cry.valueUSD)}</p>
                              <p className="text-[10px]" style={{ color: 'var(--color-muted)' }}>Price: {fmtUSD(cry.currentPrice)}</p>
                            </div>
                            <div className="flex gap-1.5">
                              <button className="p-1.5 hover:bg-emerald-50 rounded-lg text-emerald-600 transition-all cursor-pointer" onClick={() => startEditAsset('crypto', cry)}>
                                <Edit size={14} />
                              </button>
                              <button className="p-1.5 hover:bg-red-50 rounded-lg text-red-500 transition-all cursor-pointer" onClick={() => setConfirmDeleteAsset({ type: 'crypto', id: cry._id, name: cry.coin })}>
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}

                      {editingCategory !== 'crypto' ? (
                        <Button variant="outline" size="sm" className="w-full text-xs font-semibold" onClick={() => startAddAsset('crypto')}>
                          <Plus size={14} /> Add Crypto Account/Asset
                        </Button>
                      ) : (
                        <div className="space-y-4 p-4 rounded-xl border mt-3" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)' }}>
                          <p className="text-xs font-bold flex items-center justify-between">
                            <span>{editingAsset._id ? 'Edit Crypto Asset' : 'Add Crypto Asset'}</span>
                            <X size={14} className="cursor-pointer" onClick={() => { setEditingCategory(null); setEditingAsset(null); }} />
                          </p>
                          <div className="grid grid-cols-2 gap-3">
                            <Input label="Coin Name" value={editingAsset.coin || ''} onChange={e => setEditingAsset({...editingAsset, coin: e.target.value})} required placeholder="e.g. Bitcoin" />
                            <Select label="Symbol" value={editingAsset.symbol || 'BTC'} onChange={e => setEditingAsset({...editingAsset, symbol: e.target.value})}>
                              <option value="BTC">BTC 🪙</option>
                              <option value="ETH">ETH 🪙</option>
                              <option value="USDT">USDT 🪙</option>
                              <option value="BNB">BNB 🪙</option>
                              <option value="SOL">SOL 🪙</option>
                              <option value="USDC">USDC 🪙</option>
                              <option value="ADA">ADA 🪙</option>
                              <option value="XRP">XRP 🪙</option>
                            </Select>
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            <Input label="Quantity" type="number" step="any" value={editingAsset.quantity ?? ''} onChange={e => setEditingAsset({...editingAsset, quantity: e.target.value})} required placeholder="0.00" />
                            <Input label="Avg Buy Price" type="number" value={editingAsset.avgBuyPrice ?? ''} onChange={e => setEditingAsset({...editingAsset, avgBuyPrice: e.target.value})} prefix="$" required placeholder="0.00" />
                            <Input label="Current Price" type="number" value={editingAsset.currentPrice ?? ''} onChange={e => setEditingAsset({...editingAsset, currentPrice: e.target.value})} prefix="$" required placeholder="0.00" />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <Input label="Wallet Address" value={editingAsset.walletAddress || ''} onChange={e => setEditingAsset({...editingAsset, walletAddress: e.target.value})} placeholder="e.g. 1A1z..." />
                            <Input label="Network" value={editingAsset.network || ''} onChange={e => setEditingAsset({...editingAsset, network: e.target.value})} placeholder="e.g. Bitcoin" />
                          </div>
                          <Input label="Acquired At" type="date" value={editingAsset.acquiredAt ? new Date(editingAsset.acquiredAt).toISOString().split('T')[0] : ''} onChange={e => setEditingAsset({...editingAsset, acquiredAt: e.target.value})} />
                          <div className="flex gap-2 pt-2">
                            <Button variant="secondary" size="sm" className="flex-1 text-xs" onClick={() => { setEditingCategory(null); setEditingAsset(null); }}>Cancel</Button>
                            <Button variant="primary" size="sm" className="flex-1 text-xs" loading={wealthLoading} onClick={() => handleWealthUpdate('crypto', editingAsset._id ? 'edit' : 'add', editingAsset._id, editingAsset)}>Save</Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Card>

                {/* 3. TREASURY ASSETS SECTION */}
                <Card className="p-3.5 sm:p-4 hover:shadow-sm transition-all border" style={{ borderColor: 'var(--color-border)' }}>
                  <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpandedCategory(expandedCategory === 'treasury' ? null : 'treasury')}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-purple-50 text-purple-600">
                        <Shield size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-bold">Treasury & Physical Assets</p>
                        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{(selected.treasuryAssets || []).length} items · {fmtUSD(treasuryTotal)}</p>
                      </div>
                    </div>
                    {expandedCategory === 'treasury' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>

                  {expandedCategory === 'treasury' && (
                    <div className="mt-4 pt-4 border-t space-y-3" style={{ borderColor: 'var(--color-border)' }}>
                      {(selected.treasuryAssets || []).map((tre: any) => {
                        const icon = CATEGORY_ICONS[tre.category] || '📦'
                        return (
                          <div key={tre._id} className="flex items-center justify-between p-2.5 rounded-xl text-xs" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{icon}</span>
                              <div>
                                <p className="font-bold">{tre.name}</p>
                                <p className="text-[10px]" style={{ color: 'var(--color-muted)' }}>Loc: {tre.location || 'N/A'} · Qty: {tre.quantity}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="font-bold font-mono">{fmtUSD(tre.totalValue)}</p>
                                <p className="text-[10px]" style={{ color: 'var(--color-muted)' }}>Each: {fmtUSD(tre.unitPrice)}</p>
                              </div>
                              <div className="flex gap-1.5">
                                <button className="p-1.5 hover:bg-emerald-50 rounded-lg text-emerald-600 transition-all cursor-pointer" onClick={() => startEditAsset('treasury', tre)}>
                                  <Edit size={14} />
                                </button>
                                <button className="p-1.5 hover:bg-red-50 rounded-lg text-red-500 transition-all cursor-pointer" onClick={() => setConfirmDeleteAsset({ type: 'treasury', id: tre._id, name: tre.name })}>
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      })}

                      {editingCategory !== 'treasury' ? (
                        <Button variant="outline" size="sm" className="w-full text-xs font-semibold" onClick={() => startAddAsset('treasury')}>
                          <Plus size={14} /> Add Physical Asset
                        </Button>
                      ) : (
                        <div className="space-y-4 p-4 rounded-xl border mt-3" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)' }}>
                          <p className="text-xs font-bold flex items-center justify-between">
                            <span>{editingAsset._id ? 'Edit Physical Asset' : 'Add Physical Asset'}</span>
                            <X size={14} className="cursor-pointer" onClick={() => { setEditingCategory(null); setEditingAsset(null); }} />
                          </p>
                          <div className="grid grid-cols-2 gap-3">
                            <Input label="Asset Name" value={editingAsset.name || ''} onChange={e => setEditingAsset({...editingAsset, name: e.target.value})} required placeholder="e.g. Gold Bullion Bars" />
                            <Select label="Category" value={editingAsset.category || 'gold'} onChange={e => setEditingAsset({...editingAsset, category: e.target.value})}>
                              <option value="gold">Gold 🥇</option>
                              <option value="watch">Watch ⌚</option>
                              <option value="art">Art 🖼️</option>
                              <option value="jewelry">Jewelry 💎</option>
                              <option value="vehicle">Vehicle 🚗</option>
                              <option value="bonds">Bonds 📄</option>
                              <option value="realestate">Real Estate 🏠</option>
                              <option value="other">Other 📦</option>
                            </Select>
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            <Input label="Quantity" type="number" value={editingAsset.quantity ?? ''} onChange={e => setEditingAsset({...editingAsset, quantity: e.target.value})} required placeholder="1" />
                            <Input label="Unit Price" type="number" value={editingAsset.unitPrice ?? ''} onChange={e => setEditingAsset({...editingAsset, unitPrice: e.target.value})} prefix="$" required placeholder="0.00" />
                            <Input label="Serial Number" value={editingAsset.serialNo || ''} onChange={e => setEditingAsset({...editingAsset, serialNo: e.target.value})} placeholder="e.g. SN-123" />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <Input label="Storage Location" value={editingAsset.location || ''} onChange={e => setEditingAsset({...editingAsset, location: e.target.value})} placeholder="e.g. Swiss Vault, Zurich" />
                            <Input label="Acquired At" type="date" value={editingAsset.acquiredAt ? new Date(editingAsset.acquiredAt).toISOString().split('T')[0] : ''} onChange={e => setEditingAsset({...editingAsset, acquiredAt: e.target.value})} />
                          </div>
                          <Input label="Description" value={editingAsset.description || ''} onChange={e => setEditingAsset({...editingAsset, description: e.target.value})} placeholder="e.g. 24-karat investment grade" />
                          <Input label="Notes" value={editingAsset.notes || ''} onChange={e => setEditingAsset({...editingAsset, notes: e.target.value})} placeholder="e.g. Fully insured by Lloyds" />
                          <div className="flex gap-2 pt-2">
                            <Button variant="secondary" size="sm" className="flex-1 text-xs" onClick={() => { setEditingCategory(null); setEditingAsset(null); }}>Cancel</Button>
                            <Button variant="primary" size="sm" className="flex-1 text-xs" loading={wealthLoading} onClick={() => handleWealthUpdate('treasury', editingAsset._id ? 'edit' : 'add', editingAsset._id, editingAsset)}>Save</Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Card>

                {/* 4. LINKED BANK ACCOUNTS */}
                <Card className="p-3.5 sm:p-4 hover:shadow-sm transition-all border" style={{ borderColor: 'var(--color-border)' }}>
                  <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpandedCategory(expandedCategory === 'linked' ? null : 'linked')}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-cyan-50 text-cyan-600">
                        <Building size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-bold">Linked Accounts</p>
                        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{(selected.linkedAccounts || []).length} accounts · {fmtUSD(linkedTotal)}</p>
                      </div>
                    </div>
                    {expandedCategory === 'linked' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>

                  {expandedCategory === 'linked' && (
                    <div className="mt-4 pt-4 border-t space-y-3" style={{ borderColor: 'var(--color-border)' }}>
                      {(selected.linkedAccounts || []).map((acc: any) => {
                        const platInfo = PLATFORM_LABELS[acc.platform] || { label: acc.label, color: '#6B7A99', icon: '🏦' }
                        return (
                          <div key={acc._id} className="flex items-center justify-between p-2.5 rounded-xl text-xs" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
                            <div className="flex items-center gap-2">
                              <span className="text-base">{platInfo.icon}</span>
                              <div>
                                <p className="font-bold">{acc.label || platInfo.label} {acc.isDefault && <span className="text-[9px] px-1 rounded bg-slate-100 text-slate-500 font-semibold ml-1">Default</span>}</p>
                                <p className="text-[10px]" style={{ color: 'var(--color-muted)' }}>Account: {acc.accountId} ({acc.currency})</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <p className="font-bold font-mono">{fmtUSD(acc.balance)}</p>
                              <div className="flex gap-1.5">
                                <button className="p-1.5 hover:bg-emerald-50 rounded-lg text-emerald-600 transition-all cursor-pointer" onClick={() => startEditAsset('linked-accounts', acc)}>
                                  <Edit size={14} />
                                </button>
                                <button className="p-1.5 hover:bg-red-50 rounded-lg text-red-500 transition-all cursor-pointer" onClick={() => setConfirmDeleteAsset({ type: 'linked-accounts', id: acc._id, name: acc.label || platInfo.label })}>
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      })}

                      {editingCategory !== 'linked-accounts' ? (
                        <Button variant="outline" size="sm" className="w-full text-xs font-semibold" onClick={() => startAddAsset('linked-accounts')}>
                          <Plus size={14} /> Add Linked Account
                        </Button>
                      ) : (
                        <div className="space-y-4 p-4 rounded-xl border mt-3" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)' }}>
                          <p className="text-xs font-bold flex items-center justify-between">
                            <span>{editingAsset._id ? 'Edit Linked Account' : 'Add Linked Account'}</span>
                            <X size={14} className="cursor-pointer" onClick={() => { setEditingCategory(null); setEditingAsset(null); }} />
                          </p>
                          <div className="grid grid-cols-2 gap-3">
                            <Input label="Label" value={editingAsset.label || ''} onChange={e => setEditingAsset({...editingAsset, label: e.target.value})} required placeholder="e.g. Chase Sapphire Checking" />
                            <Select label="Platform" value={editingAsset.platform || 'paypal'} onChange={e => setEditingAsset({...editingAsset, platform: e.target.value})}>
                              <option value="paypal">PayPal</option>
                              <option value="chase">Chase Bank</option>
                              <option value="bofa">Bank of America</option>
                              <option value="hsbc">HSBC</option>
                              <option value="wells_fargo">Wells Fargo</option>
                              <option value="citibank">Citibank</option>
                              <option value="cashapp">Cash App</option>
                              <option value="venmo">Venmo</option>
                              <option value="zelle">Zelle</option>
                              <option value="apple_pay">Apple Pay</option>
                            </Select>
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            <Input label="Account ID / Number" value={editingAsset.accountId || ''} onChange={e => setEditingAsset({...editingAsset, accountId: e.target.value})} required placeholder="e.g. ****1234" />
                            <Input label="Balance" type="number" value={editingAsset.balance ?? ''} onChange={e => setEditingAsset({...editingAsset, balance: e.target.value})} prefix="$" required placeholder="0.00" />
                            <Select label="Currency" value={editingAsset.currency || 'USD'} onChange={e => setEditingAsset({...editingAsset, currency: e.target.value})}>
                              <option value="USD">USD ($)</option>
                              <option value="GBP">GBP (£)</option>
                              <option value="EUR">EUR (€)</option>
                            </Select>
                          </div>
                          <div className="p-3 rounded-xl border" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
                            <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                              <input type="checkbox" checked={!!editingAsset.isDefault} onChange={e => setEditingAsset({...editingAsset, isDefault: e.target.checked})} className="rounded" />
                              Set as Default linked account
                            </label>
                          </div>
                          <div className="flex gap-2 pt-2">
                            <Button variant="secondary" size="sm" className="flex-1 text-xs" onClick={() => { setEditingCategory(null); setEditingAsset(null); }}>Cancel</Button>
                            <Button variant="primary" size="sm" className="flex-1 text-xs" loading={wealthLoading} onClick={() => handleWealthUpdate('linked-accounts', editingAsset._id ? 'edit' : 'add', editingAsset._id, editingAsset)}>Save</Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Card>

                {/* 5. TRUST FUND SECTION */}
                <Card className="p-3.5 sm:p-4 hover:shadow-sm transition-all border" style={{ borderColor: 'var(--color-border)' }}>
                  <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpandedCategory(expandedCategory === 'trust' ? null : 'trust')}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-pink-50 text-pink-600">
                        <Lock size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-bold">Trust Fund Settings</p>
                        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{selected.trust?.enabled ? `Active · ${fmtUSD(trustTotal)}` : 'Not enabled'}</p>
                      </div>
                    </div>
                    {expandedCategory === 'trust' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>

                  {expandedCategory === 'trust' && (
                    <div className="mt-4 pt-4 border-t space-y-3" style={{ borderColor: 'var(--color-border)' }}>
                      {selected.trust?.enabled ? (
                        <div className="p-3 rounded-xl border text-xs space-y-2 mb-3" style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}>
                          <div className="flex justify-between border-b pb-1.5" style={{ borderColor: 'var(--color-border)' }}>
                            <span className="font-semibold text-slate-500">Trust Name</span>
                            <span className="font-bold">{selected.trust.name}</span>
                          </div>
                          <div className="flex justify-between border-b pb-1.5" style={{ borderColor: 'var(--color-border)' }}>
                            <span className="font-semibold text-slate-500">Trust Balance</span>
                            <span className="font-bold font-mono">{fmtUSD(selected.trust.balance)}</span>
                          </div>
                          <div className="flex justify-between border-b pb-1.5" style={{ borderColor: 'var(--color-border)' }}>
                            <span className="font-semibold text-slate-500">Trustee</span>
                            <span>{selected.trust.trustee || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between border-b pb-1.5" style={{ borderColor: 'var(--color-border)' }}>
                            <span className="font-semibold text-slate-500">Beneficiary</span>
                            <span>{selected.trust.beneficiary || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-semibold text-slate-500">Established</span>
                            <span>{selected.trust.established ? new Date(selected.trust.established).toLocaleDateString() : 'N/A'}</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-center py-4" style={{ color: 'var(--color-muted)' }}>Trust fund capability is currently disabled for this user.</p>
                      )}

                      {editingCategory !== 'trust' ? (
                        <Button variant="outline" size="sm" className="w-full text-xs font-semibold" onClick={() => startAddAsset('trust')}>
                          <Edit size={14} /> Update Trust Settings
                        </Button>
                      ) : (
                        <div className="space-y-4 p-4 rounded-xl border mt-3" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)' }}>
                          <p className="text-xs font-bold flex items-center justify-between">
                            <span>Trust Fund Configuration</span>
                            <X size={14} className="cursor-pointer" onClick={() => { setEditingCategory(null); setEditingAsset(null); }} />
                          </p>
                          <div className="p-3 rounded-xl border" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
                            <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                              <input type="checkbox" checked={!!editingAsset.enabled} onChange={e => setEditingAsset({...editingAsset, enabled: e.target.checked})} className="rounded" />
                              Enable Trust Fund for this user
                            </label>
                          </div>
                          {editingAsset.enabled && (
                            <>
                              <div className="grid grid-cols-2 gap-3">
                                <Input label="Trust Name" value={editingAsset.name || ''} onChange={e => setEditingAsset({...editingAsset, name: e.target.value})} required placeholder="e.g. Chase Family Trust" />
                                <Input label="Trust Fund Balance" type="number" value={editingAsset.balance ?? ''} onChange={e => setEditingAsset({...editingAsset, balance: e.target.value})} prefix="$" required placeholder="0.00" />
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <Input label="Trust Type" value={editingAsset.type || ''} onChange={e => setEditingAsset({...editingAsset, type: e.target.value})} placeholder="e.g. revocable / irrevocable" />
                                <Input label="Trustee(s)" value={editingAsset.trustee || ''} onChange={e => setEditingAsset({...editingAsset, trustee: e.target.value})} placeholder="e.g. Robert Chase & Margaret Chase" />
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <Input label="Beneficiary" value={editingAsset.beneficiary || ''} onChange={e => setEditingAsset({...editingAsset, beneficiary: e.target.value})} placeholder="e.g. Emily Chase" />
                                <Input label="Established Date" type="date" value={editingAsset.established ? new Date(editingAsset.established).toISOString().split('T')[0] : ''} onChange={e => setEditingAsset({...editingAsset, established: e.target.value})} />
                              </div>
                              <Input label="Notes" value={editingAsset.notes || ''} onChange={e => setEditingAsset({...editingAsset, notes: e.target.value})} placeholder="e.g. Managed by Sullivan & Cromwell" />
                            </>
                          )}
                          <div className="flex gap-2 pt-2">
                            <Button variant="secondary" size="sm" className="flex-1 text-xs" onClick={() => { setEditingCategory(null); setEditingAsset(null); }}>Cancel</Button>
                            <Button variant="primary" size="sm" className="flex-1 text-xs" loading={wealthLoading} onClick={() => handleWealthUpdate('trust', 'update', undefined, editingAsset)}>Save</Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              </div>
            )}
          </Card>

          {activeTab === 'overview' && (
            <Card className="p-4 sm:p-6">
              <SectionHeader title="Recent Transactions" />
              {userTxs.length === 0
                ? <p className="text-sm text-center py-6" style={{ color: 'var(--color-muted)' }}>No transactions</p>
                : userTxs.slice(0, 5).map(tx => <TxRow key={tx._id} tx={tx} compact />)}
            </Card>
          )}
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

      {confirmDeleteAsset && (
        <ConfirmModal
          title="Delete Asset?"
          message={`Are you sure you want to delete "${confirmDeleteAsset.name}" from the user's ${confirmDeleteAsset.type.replace('-', ' ')} portfolio?`}
          confirmLabel="Delete"
          variant="danger"
          onConfirm={() => {
            handleWealthUpdate(confirmDeleteAsset.type, 'delete', confirmDeleteAsset.id)
            setConfirmDeleteAsset(null)
          }}
          onCancel={() => setConfirmDeleteAsset(null)}
        />
      )}
    </div>
  )
}
