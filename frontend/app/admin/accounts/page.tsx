'use client'
import { useEffect, useState, useCallback } from 'react'
import { api, fmtUSD } from '@/lib/api'
import { Card, Button, Input, SectionHeader, StatusBadge, Divider } from '@/components/ui'
import { Search, Edit, Check, X, ChevronDown, ChevronUp, TrendingUp } from 'lucide-react'
import { useAuth } from '@/store/auth'

export default function AdminAccountsPage() {
  const { toast } = useAuth()
  const [users, setUsers]           = useState<any[]>([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [editingId, setEditingId]   = useState<string | null>(null)
  const [editForm, setEditForm]     = useState({ firstName: '', lastName: '' })
  const [saving, setSaving]         = useState(false)
  const [expanded, setExpanded]     = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const d = await api.admin.users({ search, limit: '50' })
      setUsers(d.users)
    } catch (err: any) {
      toast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => { load() }, [load])

  const startEdit = (u: any) => {
    setEditingId(u._id)
    setEditForm({ firstName: u.firstName, lastName: u.lastName })
  }

  const saveName = async (userId: string) => {
    if (!editForm.firstName.trim() || !editForm.lastName.trim()) {
      toast('First and last name required', 'error'); return
    }
    setSaving(true)
    try {
      const d = await api.admin.editName(userId, editForm)
      setUsers(p => p.map(u => u._id === userId ? { ...u, ...d.user } : u))
      setEditingId(null)
      toast('Name updated successfully', 'success')
    } catch (err: any) {
      toast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const cancelEdit = () => setEditingId(null)

  const computeNetWorth = (u: any) => {
    const crypto   = (u.cryptoAssets   || []).reduce((s: number, a: any) => s + (a.valueUSD   || 0), 0)
    const treasury = (u.treasuryAssets || []).reduce((s: number, a: any) => s + (a.totalValue || 0), 0)
    const invest   = (u.investments    || []).reduce((s: number, a: any) => s + (a.currentValue || 0), 0)
    const linked   = (u.linkedAccounts || []).reduce((s: number, a: any) => s + (a.balance     || 0), 0)
    const trust    = u.trust?.balance  || 0
    return u.balance + crypto + treasury + invest + linked + trust
  }

  return (
    <div className="space-y-5">
      <Card className="p-6">
        <SectionHeader
          title="Account Name Editor"
          sub="Edit the display name of any user account"
        />

        {/* Search */}
        <div className="relative mb-5">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--color-muted)' }} />
          <input
            placeholder="Search by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none font-sans"
            style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
          />
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="shimmer h-16 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {users.map(u => {
              const isEditing  = editingId === u._id
              const isExpanded = expanded === u._id
              const netWorth   = computeNetWorth(u)
              const hasWealth  = netWorth > u.balance

              return (
                <div key={u._id} className="rounded-xl border overflow-hidden"
                  style={{ borderColor: 'var(--color-border)' }}>

                  {/* Main row */}
                  <div className="flex items-center gap-4 p-4"
                    style={{ background: 'var(--color-surface)' }}>

                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                      style={{ background: '#0F1C35' }}>
                      {u.firstName[0]}{u.lastName[0]}
                    </div>

                    {/* Name / edit inline */}
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          <input
                            value={editForm.firstName}
                            onChange={e => setEditForm(p => ({ ...p, firstName: e.target.value }))}
                            placeholder="First name"
                            className="rounded-lg border px-3 py-1.5 text-sm font-sans outline-none w-32"
                            style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                            onFocus={e => (e.target.style.borderColor = '#10B981')}
                            onBlur={e => (e.target.style.borderColor = 'var(--color-border)')}
                          />
                          <input
                            value={editForm.lastName}
                            onChange={e => setEditForm(p => ({ ...p, lastName: e.target.value }))}
                            placeholder="Last name"
                            className="rounded-lg border px-3 py-1.5 text-sm font-sans outline-none w-32"
                            style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                            onFocus={e => (e.target.style.borderColor = '#10B981')}
                            onBlur={e => (e.target.style.borderColor = 'var(--color-border)')}
                          />
                          <button
                            onClick={() => saveName(u._id)}
                            disabled={saving}
                            className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors disabled:opacity-50">
                            {saving ? (
                              <span className="w-4 h-4 border-2 border-emerald-400 border-t-emerald-700 rounded-full animate-spin block" />
                            ) : (
                              <Check size={14} />
                            )}
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="p-1.5 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors">
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold">{u.firstName} {u.lastName}</p>
                            <StatusBadge status={u.status} />
                            {hasWealth && (
                              <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                                style={{ background: 'rgba(245,158,11,.12)', color: '#F59E0B' }}>
                                HNW
                              </span>
                            )}
                          </div>
                          <p className="text-xs truncate" style={{ color: 'var(--color-muted)' }}>{u.email}</p>
                        </div>
                      )}
                    </div>

                    {/* Balance */}
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-mono font-bold">{fmtUSD(u.balance)}</p>
                      {hasWealth && (
                        <p className="text-xs font-mono" style={{ color: '#F59E0B' }}>
                          NW: {fmtUSD(netWorth)}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!isEditing && (
                        <Button variant="secondary" size="sm" onClick={() => startEdit(u)}>
                          <Edit size={12} /> Edit Name
                        </Button>
                      )}
                      <button
                        onClick={() => setExpanded(isExpanded ? null : u._id)}
                        className="p-2 rounded-lg transition-colors hover:opacity-70"
                        style={{ background: 'var(--color-bg)' }}>
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="border-t px-4 pb-4 pt-3 space-y-4"
                      style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)' }}>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          { label: 'Checking',   value: fmtUSD(u.balance),  color: '#10B981' },
                          { label: 'Crypto',     value: fmtUSD((u.cryptoAssets||[]).reduce((s:number,a:any)=>s+(a.valueUSD||0),0)), color: '#F59E0B' },
                          { label: 'Treasury',   value: fmtUSD((u.treasuryAssets||[]).reduce((s:number,a:any)=>s+(a.totalValue||0),0)), color: '#8B5CF6' },
                          { label: 'Investments',value: fmtUSD((u.investments||[]).reduce((s:number,a:any)=>s+(a.currentValue||0),0)), color: '#3B82F6' },
                          { label: 'Linked Accts',value: fmtUSD((u.linkedAccounts||[]).reduce((s:number,a:any)=>s+(a.balance||0),0)), color: '#06B6D4' },
                          { label: 'Trust',      value: fmtUSD(u.trust?.balance||0), color: '#EC4899' },
                          { label: 'Net Worth',  value: fmtUSD(netWorth), color: '#10B981' },
                          { label: 'KYC',        value: u.kyc, color: u.kyc==='Verified'?'#10B981':'#F59E0B' },
                        ].map(({ label, value, color }) => (
                          <div key={label} className="p-3 rounded-xl"
                            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                            <p className="text-xs mb-1" style={{ color: 'var(--color-muted)' }}>{label}</p>
                            <p className="text-sm font-bold font-mono" style={{ color }}>{value}</p>
                          </div>
                        ))}
                      </div>

                      {/* Account details */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs" style={{ color: 'var(--color-muted)' }}>
                        <span>Account: ****{String(u.accountNumber||'').slice(-4)}</span>
                        <span>Routing: {u.routingNumber || '021000021'}</span>
                        <span>Joined: {new Date(u.createdAt).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</span>
                      </div>

                      {/* Linked accounts if any */}
                      {(u.linkedAccounts||[]).length > 0 && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-muted)' }}>
                            Linked Accounts
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {u.linkedAccounts.map((la: any, i: number) => (
                              <span key={i} className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                                {la.label} · {fmtUSD(la.balance||0)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Trust */}
                      {u.trust?.enabled && (
                        <div className="p-3 rounded-xl"
                          style={{ background: 'rgba(236,72,153,.06)', border: '1px solid rgba(236,72,153,.2)' }}>
                          <p className="text-xs font-semibold" style={{ color: '#EC4899' }}>
                            🔒 {u.trust.name} — {fmtUSD(u.trust.balance)}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
                            {u.trust.type} · Trustee: {u.trust.trustee}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
