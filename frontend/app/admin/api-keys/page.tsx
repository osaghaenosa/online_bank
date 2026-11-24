'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { useAuth } from '@/store/auth'
import {
  Card, Button, Input, Select, Toggle, Badge, StatusBadge,
  SectionHeader, StatCard, ConfirmModal, Empty, Divider
} from '@/components/ui'
import {
  Key, Plus, Search, Copy, Check, RefreshCw, Trash2, Shield,
  ShieldCheck, ShieldAlert, Lock, Activity, Clock, ExternalLink,
  X, AlertTriangle, Users, Globe, BookOpen, CheckCircle
} from 'lucide-react'

interface PermMeta {
  key: string
  label: string
  group: string
  description: string
}

interface ScopeMeta {
  value: 'all' | 'owned' | 'single_user'
  label: string
  description: string
}

const SCOPE_LABELS: Record<string, string> = {
  all: 'All Accounts',
  owned: 'Owned Accounts',
  single_user: 'Single Client',
}

const CORE_BANKING_PERMS = [
  'accounts:read', 'accounts:write',
  'transactions:read', 'transactions:deposit', 'transactions:withdraw',
  'transactions:transfer', 'transactions:bill_pay',
  'cards:read', 'cards:write', 'bank:read',
]

function getApiV1Base() {
  const envBase = process.env.NEXT_PUBLIC_BASE_URL?.trim()
  if (envBase) return envBase.replace(/\/$/, '') + '/api/v1'
  if (typeof window !== 'undefined') return `${window.location.origin}/api/v1`
  return 'https://theblueridges.com/api/v1'
}

export default function AdminApiKeysPage() {
  const { toast } = useAuth()

  const [keys, setKeys] = useState<any[]>([])
  const [stats, setStats] = useState<any>({ total: 0, active: 0, suspended: 0, revoked: 0, totalRequests: 0, requests24h: 0 })
  const [permissionsMeta, setPermissionsMeta] = useState<PermMeta[]>([])
  const [scopesMeta, setScopesMeta] = useState<ScopeMeta[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended' | 'revoked'>('all')
  const [selected, setSelected] = useState<any>(null)
  const [inspectorTab, setInspectorTab] = useState<'config' | 'logs'>('config')
  const [logs, setLogs] = useState<any[]>([])
  const [logsLoading, setLogsLoading] = useState(false)

  // Edit state for selected key
  const [editForm, setEditForm] = useState<any>(null)
  const [savingEdit, setSavingEdit] = useState(false)

  // Create modal state
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [clientMode, setClientMode] = useState<'client' | 'partner'>('partner')
  const [clientSearch, setClientSearch] = useState('')
  const [createForm, setCreateForm] = useState({
    name: '',
    ownerName: '',
    ownerEmail: '',
    userId: '',
    accountScope: 'all' as 'all' | 'owned' | 'single_user',
    environment: 'live' as 'live' | 'test',
    rateLimitPerMinute: '120',
    expiresAt: '',
    ipWhitelist: '',
    notes: '',
    enforcePinAndTtn: false,
    instantWithdrawal: false,
    permissions: [] as string[],
  })

  // One-time reveal modal
  const [revealedSecret, setRevealedSecret] = useState<{ rawKey: string; keyName: string; isRotation: boolean } | null>(null)
  const [copiedKey, setCopiedKey] = useState(false)
  const [copiedCurl, setCopiedCurl] = useState(false)

  // Confirmation modals
  const [confirmRotate, setConfirmRotate] = useState<any>(null)
  const [confirmRevoke, setConfirmRevoke] = useState<any>(null)
  const [confirmDelete, setConfirmDelete] = useState<any>(null)

  const apiV1Base = useMemo(() => getApiV1Base(), [])

  const loadKeys = useCallback(async () => {
    try {
      const params: Record<string, string> = {}
      if (statusFilter !== 'all') params.status = statusFilter
      if (search.trim()) params.search = search.trim()
      const data = await api.admin.apiKeys.list(params)
      setKeys(data.apiKeys || [])
      if (data.stats) setStats(data.stats)
    } catch (err: any) {
      toast(err.message || 'Failed to load API keys', 'error')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, search, toast])

  useEffect(() => {
    api.admin.apiKeys.meta()
      .then((d) => {
        const perms = d.permissions || []
        setPermissionsMeta(perms)
        setScopesMeta(d.scopes || [])
        setCreateForm((prev) => ({
          ...prev,
          permissions: prev.permissions.length ? prev.permissions : perms.map((p: PermMeta) => p.key),
        }))
      })
      .catch(() => {})

    api.admin.users({ limit: '100' })
      .then((d) => setClients(d.users || []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    loadKeys()
  }, [loadKeys])

  const syncEditForm = useCallback((keyObj: any) => {
    if (!keyObj) {
      setEditForm(null)
      return
    }
    setEditForm({
      name: keyObj.name || '',
      ownerName: keyObj.ownerName || '',
      ownerEmail: keyObj.ownerEmail || '',
      userId: keyObj.userId?._id || keyObj.userId || '',
      accountScope: keyObj.accountScope || 'all',
      rateLimitPerMinute: String(keyObj.rateLimitPerMinute || 120),
      expiresAt: keyObj.expiresAt ? new Date(keyObj.expiresAt).toISOString().slice(0, 10) : '',
      ipWhitelist: Array.isArray(keyObj.ipWhitelist) ? keyObj.ipWhitelist.join(', ') : '',
      notes: keyObj.notes || '',
      enforcePinAndTtn: !!keyObj.enforcePinAndTtn,
      instantWithdrawal: !!keyObj.instantWithdrawal,
      permissions: Array.isArray(keyObj.permissions) ? [...keyObj.permissions] : [],
    })
  }, [])

  const selectKey = async (keyObj: any) => {
    setSelected(keyObj)
    setInspectorTab('config')
    syncEditForm(keyObj)
    setLogsLoading(true)
    try {
      const detail = await api.admin.apiKeys.get(keyObj._id)
      if (detail.apiKey) {
        setSelected(detail.apiKey)
        syncEditForm(detail.apiKey)
      }
      setLogs(detail.logs || [])
    } catch {
      setLogs([])
    } finally {
      setLogsLoading(false)
    }
  }

  const refreshLogs = async () => {
    if (!selected) return
    setLogsLoading(true)
    try {
      const detail = await api.admin.apiKeys.get(selected._id)
      setLogs(detail.logs || [])
      if (detail.apiKey) {
        setSelected(detail.apiKey)
      }
    } catch (err: any) {
      toast(err.message || 'Failed to refresh logs', 'error')
    } finally {
      setLogsLoading(false)
    }
  }

  const groupedPermissions = useMemo(() => {
    const map: Record<string, PermMeta[]> = {}
    for (const p of permissionsMeta) {
      if (!map[p.group]) map[p.group] = []
      map[p.group].push(p)
    }
    return Object.entries(map)
  }, [permissionsMeta])

  const filteredClients = useMemo(() => {
    const q = clientSearch.trim().toLowerCase()
    if (!q) return clients
    return clients.filter((c) =>
      `${c.firstName} ${c.lastName} ${c.email} ${c.accountNumber}`.toLowerCase().includes(q)
    )
  }, [clients, clientSearch])

  const applyCreatePreset = (preset: 'full' | 'core' | 'read') => {
    const allKeys = permissionsMeta.map((p) => p.key)
    let next: string[] = []
    if (preset === 'full') next = allKeys
    else if (preset === 'core') next = allKeys.filter((k) => CORE_BANKING_PERMS.includes(k))
    else next = allKeys.filter((k) => k.endsWith(':read'))

    if (createForm.accountScope === 'single_user') {
      next = next.filter((k) => k !== 'accounts:create')
    }
    setCreateForm((p) => ({ ...p, permissions: next }))
  }

  const applyEditPreset = (preset: 'full' | 'core' | 'read') => {
    if (!editForm) return
    const allKeys = permissionsMeta.map((p) => p.key)
    let next: string[] = []
    if (preset === 'full') next = allKeys
    else if (preset === 'core') next = allKeys.filter((k) => CORE_BANKING_PERMS.includes(k))
    else next = allKeys.filter((k) => k.endsWith(':read'))

    if (editForm.accountScope === 'single_user') {
      next = next.filter((k) => k !== 'accounts:create')
    }
    setEditForm((p: any) => ({ ...p, permissions: next }))
  }

  const openCreateModal = () => {
    setClientMode('partner')
    setClientSearch('')
    setCreateForm({
      name: '',
      ownerName: '',
      ownerEmail: '',
      userId: '',
      accountScope: 'all',
      environment: 'live',
      rateLimitPerMinute: '120',
      expiresAt: '',
      ipWhitelist: '',
      notes: '',
      enforcePinAndTtn: false,
      instantWithdrawal: false,
      permissions: permissionsMeta.map((p) => p.key),
    })
    setShowCreate(true)
  }

  const handleSelectCreateClient = (uid: string) => {
    const found = clients.find((c) => c._id === uid)
    setCreateForm((prev) => ({
      ...prev,
      userId: uid,
      ownerName: found ? `${found.firstName} ${found.lastName}` : prev.ownerName,
      ownerEmail: found ? found.email : prev.ownerEmail,
      name: prev.name || (found ? `${found.firstName} ${found.lastName} API Key` : ''),
    }))
  }

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createForm.name.trim()) {
      toast('Enter a label for this API key', 'error')
      return
    }
    if (createForm.accountScope === 'single_user' && !createForm.userId) {
      toast('Select a bank client for single_user scope', 'error')
      return
    }
    if (!createForm.ownerName.trim() || !createForm.ownerEmail.trim()) {
      toast('Owner name and email are required', 'error')
      return
    }

    setCreating(true)
    try {
      const payload: any = {
        name: createForm.name.trim(),
        ownerName: createForm.ownerName.trim(),
        ownerEmail: createForm.ownerEmail.trim(),
        userId: createForm.userId || null,
        accountScope: createForm.accountScope,
        environment: createForm.environment,
        rateLimitPerMinute: Number(createForm.rateLimitPerMinute) || 120,
        expiresAt: createForm.expiresAt || null,
        ipWhitelist: createForm.ipWhitelist,
        notes: createForm.notes,
        enforcePinAndTtn: createForm.enforcePinAndTtn,
        instantWithdrawal: createForm.instantWithdrawal,
        permissions: createForm.permissions,
      }
      const res = await api.admin.apiKeys.create(payload)
      setShowCreate(false)
      setRevealedSecret({ rawKey: res.rawKey, keyName: res.apiKey.name, isRotation: false })
      setCopiedKey(false)
      setCopiedCurl(false)
      await loadKeys()
      setSelected(res.apiKey)
      syncEditForm(res.apiKey)
      toast('API key generated successfully', 'success')
    } catch (err: any) {
      toast(err.message || 'Failed to generate API key', 'error')
    } finally {
      setCreating(false)
    }
  }

  const handleSaveEdit = async () => {
    if (!selected || !editForm) return
    if (editForm.accountScope === 'single_user' && !editForm.userId) {
      toast('single_user scope requires an assigned bank client', 'error')
      return
    }
    setSavingEdit(true)
    try {
      const res = await api.admin.apiKeys.update(selected._id, {
        name: editForm.name,
        ownerName: editForm.ownerName,
        ownerEmail: editForm.ownerEmail,
        userId: editForm.userId || null,
        accountScope: editForm.accountScope,
        rateLimitPerMinute: Number(editForm.rateLimitPerMinute) || 120,
        expiresAt: editForm.expiresAt || null,
        ipWhitelist: editForm.ipWhitelist,
        notes: editForm.notes,
        enforcePinAndTtn: editForm.enforcePinAndTtn,
        instantWithdrawal: editForm.instantWithdrawal,
        permissions: editForm.permissions,
      })
      setSelected(res.apiKey)
      syncEditForm(res.apiKey)
      setKeys((prev) => prev.map((k) => (k._id === res.apiKey._id ? res.apiKey : k)))
      toast('API key settings updated', 'success')
    } catch (err: any) {
      toast(err.message || 'Update failed', 'error')
    } finally {
      setSavingEdit(false)
    }
  }

  const handleToggleSuspend = async (keyObj: any) => {
    const nextStatus = keyObj.status === 'active' ? 'suspended' : 'active'
    try {
      const res = await api.admin.apiKeys.setStatus(keyObj._id, nextStatus)
      setSelected(res.apiKey)
      setKeys((prev) => prev.map((k) => (k._id === res.apiKey._id ? res.apiKey : k)))
      await loadKeys()
      toast(`API key ${nextStatus}`, 'success')
    } catch (err: any) {
      toast(err.message || 'Status update failed', 'error')
    }
  }

  const handleRotate = async () => {
    if (!confirmRotate) return
    try {
      const res = await api.admin.apiKeys.rotate(confirmRotate._id)
      setConfirmRotate(null)
      setSelected(res.apiKey)
      syncEditForm(res.apiKey)
      setRevealedSecret({ rawKey: res.rawKey, keyName: res.apiKey.name, isRotation: true })
      setCopiedKey(false)
      setCopiedCurl(false)
      await loadKeys()
      toast('API key rotated — copy the new secret key now', 'success')
    } catch (err: any) {
      toast(err.message || 'Rotation failed', 'error')
      setConfirmRotate(null)
    }
  }

  const handleRevoke = async () => {
    if (!confirmRevoke) return
    try {
      const res = await api.admin.apiKeys.setStatus(confirmRevoke._id, 'revoked')
      setConfirmRevoke(null)
      setSelected(res.apiKey)
      await loadKeys()
      toast('API key permanently revoked', 'warning')
    } catch (err: any) {
      toast(err.message || 'Revoke failed', 'error')
      setConfirmRevoke(null)
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    try {
      await api.admin.apiKeys.remove(confirmDelete._id)
      setConfirmDelete(null)
      setSelected(null)
      setEditForm(null)
      await loadKeys()
      toast('API key deleted', 'success')
    } catch (err: any) {
      toast(err.message || 'Delete failed', 'error')
      setConfirmDelete(null)
    }
  }

  const copyText = (text: string, type: 'key' | 'curl') => {
    navigator.clipboard?.writeText(text).catch(() => {})
    if (type === 'key') {
      setCopiedKey(true)
      setTimeout(() => setCopiedKey(false), 2000)
      toast('API key copied to clipboard', 'success')
    } else {
      setCopiedCurl(true)
      setTimeout(() => setCopiedCurl(false), 2000)
      toast('cURL command copied', 'success')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <Card className="p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-widest font-bold mb-1" style={{ color: '#0052CC' }}>
              EXTERNAL INTEGRATION GOVERNANCE
            </p>
            <h1 className="font-display text-xl sm:text-2xl font-bold" style={{ color: '#002B5B' }}>
              Bank API Access &amp; Key Management
            </h1>
            <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
              Authorize external applications or bank clients to connect via <span className="font-code font-semibold">/api/v1</span>. Control scopes, rate limits, IP allowlists, and transaction policies.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 flex-shrink-0">
            <Link href="/docs" target="_blank">
              <Button variant="outline" size="sm">
                <BookOpen size={14} /> Open Public API Docs <ExternalLink size={12} />
              </Button>
            </Link>
            <Button variant="primary" size="sm" onClick={openCreateModal}>
              <Plus size={14} /> Generate API Key
            </Button>
          </div>
        </div>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Total API Keys"
          value={String(stats.total || 0)}
          sub={`${stats.suspended || 0} suspended · ${stats.revoked || 0} revoked`}
          iconBg="bg-blue-50"
          icon={<Key size={16} style={{ color: '#0052CC' }} />}
        />
        <StatCard
          label="Active Integrations"
          value={String(stats.active || 0)}
          sub="Authorized right now"
          iconBg="bg-emerald-50"
          icon={<ShieldCheck size={16} className="text-emerald-600" />}
        />
        <StatCard
          label="Total API Calls"
          value={Number(stats.totalRequests || 0).toLocaleString()}
          sub="Lifetime billed requests"
          iconBg="bg-indigo-50"
          icon={<Activity size={16} className="text-indigo-600" />}
        />
        <StatCard
          label="Requests (24h)"
          value={Number(stats.requests24h || 0).toLocaleString()}
          sub="Audited in last 24h"
          iconBg="bg-amber-50"
          icon={<Clock size={16} className="text-amber-600" />}
        />
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by label, owner name, email, or key prefix..."
              className="w-full border pl-10 pr-3.5 py-2 text-sm outline-none"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {(['all', 'active', 'suspended', 'revoked'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className="px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider border transition-colors"
                style={{
                  background: statusFilter === st ? '#002B5B' : '#F8FAFC',
                  borderColor: statusFilter === st ? '#002B5B' : '#CBD5E1',
                  color: statusFilter === st ? '#FFFFFF' : '#002B5B',
                }}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Master-Detail Keys Directory + Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left List */}
        <div className="lg:col-span-5 space-y-2.5">
          {loading ? (
            <div className="space-y-2.5">
              {[1, 2, 3].map((i) => <div key={i} className="shimmer h-28" />)}
            </div>
          ) : keys.length === 0 ? (
            <Empty
              icon={<Key size={36} />}
              message="No API Keys Found"
              sub="Generate an API key to authorize external developers or bank clients."
            />
          ) : (
            keys.map((k) => {
              const isSelected = selected?._id === k._id
              return (
                <div
                  key={k._id}
                  onClick={() => selectKey(k)}
                  className="p-4 border cursor-pointer transition-all"
                  style={{
                    background: isSelected ? '#EBF2FF' : '#FFFFFF',
                    borderColor: isSelected ? '#0052CC' : '#CBD5E1',
                    borderLeft: isSelected ? '4px solid #0052CC' : '4px solid #002B5B',
                  }}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <p className="font-bold text-sm truncate" style={{ color: '#002B5B' }}>{k.name}</p>
                      <p className="text-xs truncate" style={{ color: 'var(--color-muted)' }}>
                        {k.ownerName} · {k.ownerEmail}
                      </p>
                    </div>
                    <StatusBadge status={k.status} />
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                    <span className="font-code text-[11px] px-2 py-0.5 border font-semibold" style={{ background: '#0F172A', color: '#93C5FD', borderColor: '#1E293B' }}>
                      {k.keyPrefix}••••
                    </span>
                    <Badge variant={k.environment === 'live' ? 'blue' : 'yellow'}>
                      {k.environment}
                    </Badge>
                    <Badge variant="gray">{SCOPE_LABELS[k.accountScope] || k.accountScope}</Badge>
                  </div>

                  {k.userId && (
                    <p className="text-[11px] font-semibold mb-2 truncate" style={{ color: '#0052CC' }}>
                      Bound Client: {k.userId.firstName} {k.userId.lastName} ({k.userId.accountNumber})
                    </p>
                  )}

                  <div className="flex items-center justify-between text-[11px] pt-2 border-t" style={{ borderColor: '#E2E8F0', color: 'var(--color-muted)' }}>
                    <span>{Number(k.usageCount || 0).toLocaleString()} calls · {k.permissions?.length || 0} scopes</span>
                    <span>{k.lastUsedAt ? `Used ${new Date(k.lastUsedAt).toLocaleDateString()}` : 'Never used'}</span>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Right Inspector */}
        <div className="lg:col-span-7">
          {!selected || !editForm ? (
            <Card className="p-8 text-center">
              <Key size={40} className="mx-auto mb-3 opacity-30" style={{ color: '#002B5B' }} />
              <p className="font-bold text-sm uppercase tracking-wider" style={{ color: '#002B5B' }}>
                Select an API Key to Inspect
              </p>
              <p className="text-xs mt-1 mb-5" style={{ color: 'var(--color-muted)' }}>
                Click any key on the left to adjust permissions, rate limits, policies, rotate secrets, or view live audit logs.
              </p>
              <Button variant="primary" size="sm" onClick={openCreateModal}>
                <Plus size={14} /> Generate New API Key
              </Button>
            </Card>
          ) : (
            <Card className="p-5 sm:p-6 space-y-5">
              {/* Top Inspector Summary */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-display text-lg font-bold" style={{ color: '#002B5B' }}>{selected.name}</h2>
                    <StatusBadge status={selected.status} />
                    <Badge variant={selected.environment === 'live' ? 'blue' : 'yellow'}>{selected.environment}</Badge>
                  </div>
                  <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
                    Prefix: <span className="font-code font-bold text-slate-800">{selected.keyPrefix}••••••••••••••••</span> ·
                    Calls: <strong>{Number(selected.usageCount || 0).toLocaleString()}</strong> ·
                    Last IP: <span className="font-code">{selected.lastUsedIp || '—'}</span>
                  </p>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => setInspectorTab('config')}
                    className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider border"
                    style={{
                      background: inspectorTab === 'config' ? '#0052CC' : '#F8FAFC',
                      borderColor: inspectorTab === 'config' ? '#0052CC' : '#CBD5E1',
                      color: inspectorTab === 'config' ? '#FFFFFF' : '#002B5B',
                    }}
                  >
                    Configuration
                  </button>
                  <button
                    onClick={() => setInspectorTab('logs')}
                    className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider border"
                    style={{
                      background: inspectorTab === 'logs' ? '#0052CC' : '#F8FAFC',
                      borderColor: inspectorTab === 'logs' ? '#0052CC' : '#CBD5E1',
                      color: inspectorTab === 'logs' ? '#FFFFFF' : '#002B5B',
                    }}
                  >
                    Audit Logs ({logs.length})
                  </button>
                </div>
              </div>

              {inspectorTab === 'config' ? (
                <div className="space-y-5">
                  {/* Lifecycle Actions Bar */}
                  <div className="flex flex-wrap gap-2 p-3 border" style={{ background: '#F8FAFC', borderColor: '#CBD5E1' }}>
                    {selected.status !== 'revoked' && (
                      <Button
                        variant="secondary"
                        size="xs"
                        onClick={() => handleToggleSuspend(selected)}
                      >
                        {selected.status === 'active' ? 'Suspend Key' : 'Reactivate Key'}
                      </Button>
                    )}
                    {selected.status !== 'revoked' && (
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => setConfirmRotate(selected)}
                      >
                        <RefreshCw size={12} /> Rotate Secret
                      </Button>
                    )}
                    {selected.status !== 'revoked' && (
                      <Button
                        variant="danger"
                        size="xs"
                        onClick={() => setConfirmRevoke(selected)}
                      >
                        <ShieldAlert size={12} /> Revoke Permanently
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => setConfirmDelete(selected)}
                      className="text-red-600 ml-auto"
                    >
                      <Trash2 size={12} /> Delete
                    </Button>
                  </div>

                  {/* Metadata Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Key Label"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    />
                    <Input
                      label="Rate Limit (Req / Min)"
                      type="number"
                      min="1"
                      max="10000"
                      value={editForm.rateLimitPerMinute}
                      onChange={(e) => setEditForm({ ...editForm, rateLimitPerMinute: e.target.value })}
                    />
                    <Input
                      label="Owner / Partner Name"
                      value={editForm.ownerName}
                      onChange={(e) => setEditForm({ ...editForm, ownerName: e.target.value })}
                    />
                    <Input
                      label="Owner Email"
                      type="email"
                      value={editForm.ownerEmail}
                      onChange={(e) => setEditForm({ ...editForm, ownerEmail: e.target.value })}
                    />
                    <Select
                      label="Account Access Scope"
                      value={editForm.accountScope}
                      onChange={(e) => {
                        const nextScope = e.target.value
                        setEditForm((prev: any) => ({
                          ...prev,
                          accountScope: nextScope,
                          permissions: nextScope === 'single_user'
                            ? prev.permissions.filter((p: string) => p !== 'accounts:create')
                            : prev.permissions,
                        }))
                      }}
                    >
                      {scopesMeta.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </Select>
                    <Select
                      label="Assigned Bank Client (Optional unless Single Client)"
                      value={editForm.userId}
                      onChange={(e) => setEditForm({ ...editForm, userId: e.target.value })}
                    >
                      <option value="">— No bound client —</option>
                      {clients.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.firstName} {c.lastName} ({c.email} · {c.accountNumber})
                        </option>
                      ))}
                    </Select>
                    <Input
                      label="Expiration Date (Optional)"
                      type="date"
                      value={editForm.expiresAt}
                      onChange={(e) => setEditForm({ ...editForm, expiresAt: e.target.value })}
                    />
                    <Input
                      label="IP Whitelist (Comma-separated)"
                      placeholder="Leave empty to allow all IPs"
                      value={editForm.ipWhitelist}
                      onChange={(e) => setEditForm({ ...editForm, ipWhitelist: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: '#002B5B' }}>
                      Admin Notes
                    </label>
                    <textarea
                      rows={2}
                      value={editForm.notes}
                      onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                      className="w-full border px-3 py-2 text-sm outline-none"
                      style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
                    />
                  </div>

                  {/* Transaction Policies */}
                  <div className="p-4 border space-y-3" style={{ background: '#F8FAFC', borderColor: '#CBD5E1' }}>
                    <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#002B5B' }}>
                      Transaction Execution Policies
                    </p>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold" style={{ color: '#002B5B' }}>Enforce PIN, KYC &amp; Track Token (TTN)</p>
                        <p className="text-[11px]" style={{ color: 'var(--color-muted)' }}>
                          Require transaction PIN, verified KYC, TTN, and 10 security tokens per API transaction.
                        </p>
                      </div>
                      <Toggle
                        checked={editForm.enforcePinAndTtn}
                        onChange={() => setEditForm({ ...editForm, enforcePinAndTtn: !editForm.enforcePinAndTtn })}
                      />
                    </div>
                    <Divider />
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold" style={{ color: '#002B5B' }}>Instant Withdrawal Settlement</p>
                        <p className="text-[11px]" style={{ color: 'var(--color-muted)' }}>
                          When enabled, API withdrawals debit immediately instead of waiting in Pending Admin Approval.
                        </p>
                      </div>
                      <Toggle
                        checked={editForm.instantWithdrawal}
                        onChange={() => setEditForm({ ...editForm, instantWithdrawal: !editForm.instantWithdrawal })}
                      />
                    </div>
                  </div>

                  {/* Permission Scopes */}
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#002B5B' }}>
                        API Permission Scopes ({editForm.permissions.length}/{permissionsMeta.length})
                      </p>
                      <div className="flex gap-1.5">
                        <button type="button" onClick={() => applyEditPreset('full')} className="px-2.5 py-1 text-[11px] font-bold uppercase border bg-white hover:bg-blue-50" style={{ borderColor: '#CBD5E1', color: '#002B5B' }}>Full Access</button>
                        <button type="button" onClick={() => applyEditPreset('core')} className="px-2.5 py-1 text-[11px] font-bold uppercase border bg-white hover:bg-blue-50" style={{ borderColor: '#CBD5E1', color: '#002B5B' }}>Core Banking</button>
                        <button type="button" onClick={() => applyEditPreset('read')} className="px-2.5 py-1 text-[11px] font-bold uppercase border bg-white hover:bg-blue-50" style={{ borderColor: '#CBD5E1', color: '#002B5B' }}>Read Only</button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {groupedPermissions.map(([group, items]) => (
                        <div key={group} className="p-3 border" style={{ borderColor: '#CBD5E1', background: '#FFFFFF' }}>
                          <p className="text-[11px] font-mono font-bold uppercase tracking-wider mb-2" style={{ color: '#0052CC' }}>
                            {group}
                          </p>
                          <div className="space-y-2">
                            {items.map((p) => {
                              const checked = editForm.permissions.includes(p.key)
                              const disabled = editForm.accountScope === 'single_user' && p.key === 'accounts:create'
                              return (
                                <label key={p.key} className={`flex items-start gap-2 text-xs ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}>
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    disabled={disabled}
                                    onChange={() => {
                                      setEditForm((prev: any) => ({
                                        ...prev,
                                        permissions: checked
                                          ? prev.permissions.filter((x: string) => x !== p.key)
                                          : [...prev.permissions, p.key],
                                      }))
                                    }}
                                    className="mt-0.5"
                                  />
                                  <span>
                                    <span className="font-semibold block" style={{ color: '#002B5B' }}>{p.label}</span>
                                    <span className="font-code text-[10px]" style={{ color: 'var(--color-muted)' }}>{p.key}</span>
                                  </span>
                                </label>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button variant="primary" className="w-full" loading={savingEdit} onClick={handleSaveEdit}>
                    Save API Key Configuration
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#002B5B' }}>
                      Recent Requests (Last 50)
                    </p>
                    <Button variant="secondary" size="xs" onClick={refreshLogs} loading={logsLoading}>
                      <RefreshCw size={12} /> Refresh
                    </Button>
                  </div>

                  {logsLoading ? (
                    <div className="shimmer h-40" />
                  ) : logs.length === 0 ? (
                    <Empty icon={<Activity size={30} />} message="No Requests Recorded Yet" sub="Calls made with this key will appear here in real time." />
                  ) : (
                    <div className="overflow-x-auto border" style={{ borderColor: '#CBD5E1' }}>
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr style={{ background: '#002B5B', color: '#FFFFFF' }}>
                            <th className="py-2.5 px-3 font-mono uppercase">Method</th>
                            <th className="py-2.5 px-3 font-mono uppercase">Endpoint</th>
                            <th className="py-2.5 px-3 font-mono uppercase">Status</th>
                            <th className="py-2.5 px-3 font-mono uppercase">Latency</th>
                            <th className="py-2.5 px-3 font-mono uppercase">IP</th>
                            <th className="py-2.5 px-3 font-mono uppercase">Time</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y" style={{ borderColor: '#E2E8F0' }}>
                          {logs.map((log) => (
                            <tr key={log._id} className="hover:bg-slate-50">
                              <td className="py-2 px-3 font-code font-bold" style={{ color: '#0052CC' }}>{log.method}</td>
                              <td className="py-2 px-3 font-code text-[11px] max-w-[220px] truncate" title={log.path}>{log.path}</td>
                              <td className="py-2 px-3">
                                <Badge variant={log.statusCode < 300 ? 'green' : log.statusCode < 500 ? 'yellow' : 'red'}>
                                  {log.statusCode}{log.errorCode ? ` · ${log.errorCode}` : ''}
                                </Badge>
                              </td>
                              <td className="py-2 px-3 font-mono">{log.responseTimeMs}ms</td>
                              <td className="py-2 px-3 font-code text-[11px]">{log.ip || '—'}</td>
                              <td className="py-2 px-3 text-[11px]" style={{ color: 'var(--color-muted)' }}>
                                {new Date(log.createdAt).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </Card>
          )}
        </div>
      </div>

      {/* ── Generate API Key Modal ──────────────────────────────────────────────── */}
      {showCreate && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 overflow-y-auto">
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto p-5 sm:p-6 fade-up">
            <div className="flex items-center justify-between pb-3 mb-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
              <div>
                <p className="text-[10px] font-mono uppercase font-bold" style={{ color: '#0052CC' }}>
                  NEW EXTERNAL CREDENTIAL
                </p>
                <h2 className="font-display text-lg font-bold" style={{ color: '#002B5B' }}>
                  Generate Bank API Key
                </h2>
              </div>
              <button onClick={() => setShowCreate(false)} className="p-1.5 border hover:bg-slate-100" style={{ borderColor: '#CBD5E1' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-5">
              {/* Mode Toggle */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setClientMode('partner')
                    setCreateForm((p) => ({ ...p, accountScope: 'all', userId: '' }))
                  }}
                  className="p-3 border text-left transition-all"
                  style={{
                    background: clientMode === 'partner' ? '#EBF2FF' : '#FFFFFF',
                    borderColor: clientMode === 'partner' ? '#0052CC' : '#CBD5E1',
                  }}
                >
                  <div className="flex items-center gap-2 font-bold text-xs uppercase" style={{ color: '#002B5B' }}>
                    <Globe size={14} style={{ color: '#0052CC' }} /> External Developer / Partner
                  </div>
                  <p className="text-[11px] mt-1" style={{ color: 'var(--color-muted)' }}>
                    Issue a platform or partner key for third-party apps connecting to the bank.
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setClientMode('client')
                    setCreateForm((p) => ({
                      ...p,
                      accountScope: 'single_user',
                      permissions: p.permissions.filter((x) => x !== 'accounts:create'),
                    }))
                  }}
                  className="p-3 border text-left transition-all"
                  style={{
                    background: clientMode === 'client' ? '#EBF2FF' : '#FFFFFF',
                    borderColor: clientMode === 'client' ? '#0052CC' : '#CBD5E1',
                  }}
                >
                  <div className="flex items-center gap-2 font-bold text-xs uppercase" style={{ color: '#002B5B' }}>
                    <Users size={14} style={{ color: '#0052CC' }} /> Existing Bank Client
                  </div>
                  <p className="text-[11px] mt-1" style={{ color: 'var(--color-muted)' }}>
                    Bind API access directly to an existing Blue ridge Bank client account.
                  </p>
                </button>
              </div>

              {clientMode === 'client' && (
                <div className="p-3.5 border space-y-2.5" style={{ background: '#F8FAFC', borderColor: '#CBD5E1' }}>
                  <Input
                    label="Filter Bank Clients"
                    placeholder="Type name, email, or account number..."
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                  />
                  <Select
                    label="Select Bank Client"
                    value={createForm.userId}
                    onChange={(e) => handleSelectCreateClient(e.target.value)}
                  >
                    <option value="">— Select a client account —</option>
                    {filteredClients.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.firstName} {c.lastName} · {c.email} · Acct {c.accountNumber}
                      </option>
                    ))}
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="API Key Label *"
                  placeholder="e.g. Acme Treasury Production"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  required
                />
                <Select
                  label="Environment"
                  value={createForm.environment}
                  onChange={(e) => setCreateForm({ ...createForm, environment: e.target.value as 'live' | 'test' })}
                >
                  <option value="live">Live (brb_live_...)</option>
                  <option value="test">Test / Sandbox (brb_test_...)</option>
                </Select>
                <Input
                  label="Authorized Person / Company Name *"
                  placeholder="e.g. Jane Doe / FinTech Corp"
                  value={createForm.ownerName}
                  onChange={(e) => setCreateForm({ ...createForm, ownerName: e.target.value })}
                  required
                />
                <Input
                  label="Authorized Contact Email *"
                  type="email"
                  placeholder="developer@company.com"
                  value={createForm.ownerEmail}
                  onChange={(e) => setCreateForm({ ...createForm, ownerEmail: e.target.value })}
                  required
                />
                <Select
                  label="Account Access Scope"
                  value={createForm.accountScope}
                  onChange={(e) => {
                    const nextScope = e.target.value as 'all' | 'owned' | 'single_user'
                    setCreateForm((p) => ({
                      ...p,
                      accountScope: nextScope,
                      permissions: nextScope === 'single_user'
                        ? p.permissions.filter((x) => x !== 'accounts:create')
                        : p.permissions,
                    }))
                  }}
                >
                  {scopesMeta.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </Select>
                <Input
                  label="Rate Limit (Requests / Minute)"
                  type="number"
                  min="1"
                  max="10000"
                  value={createForm.rateLimitPerMinute}
                  onChange={(e) => setCreateForm({ ...createForm, rateLimitPerMinute: e.target.value })}
                />
                <Input
                  label="Expiration Date (Optional)"
                  type="date"
                  value={createForm.expiresAt}
                  onChange={(e) => setCreateForm({ ...createForm, expiresAt: e.target.value })}
                />
                <Input
                  label="IP Whitelist (Optional, Comma-Separated)"
                  placeholder="e.g. 203.0.113.10, 198.51.100.4"
                  value={createForm.ipWhitelist}
                  onChange={(e) => setCreateForm({ ...createForm, ipWhitelist: e.target.value })}
                />
              </div>

              {/* Scope hint */}
              {scopesMeta.find((s) => s.value === createForm.accountScope) && (
                <div className="p-3 border-l-4 text-xs" style={{ background: '#EBF2FF', borderColor: '#0052CC', color: '#002B5B' }}>
                  <strong>Scope Rule:</strong> {scopesMeta.find((s) => s.value === createForm.accountScope)?.description}
                </div>
              )}

              {/* Policies */}
              <div className="p-4 border space-y-3" style={{ background: '#F8FAFC', borderColor: '#CBD5E1' }}>
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#002B5B' }}>
                  Transaction Execution Policies
                </p>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold" style={{ color: '#002B5B' }}>Enforce PIN, KYC &amp; Track Token (TTN)</p>
                    <p className="text-[11px]" style={{ color: 'var(--color-muted)' }}>
                      Require transaction PIN, Verified KYC, TTN, and 10 tokens per money-moving call.
                    </p>
                  </div>
                  <Toggle
                    checked={createForm.enforcePinAndTtn}
                    onChange={() => setCreateForm({ ...createForm, enforcePinAndTtn: !createForm.enforcePinAndTtn })}
                  />
                </div>
                <Divider />
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold" style={{ color: '#002B5B' }}>Instant Withdrawal Settlement</p>
                    <p className="text-[11px]" style={{ color: 'var(--color-muted)' }}>
                      Settle withdrawals immediately via API instead of queuing them for manual approval.
                    </p>
                  </div>
                  <Toggle
                    checked={createForm.instantWithdrawal}
                    onChange={() => setCreateForm({ ...createForm, instantWithdrawal: !createForm.instantWithdrawal })}
                  />
                </div>
              </div>

              {/* Permissions */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#002B5B' }}>
                    Permission Scopes ({createForm.permissions.length}/{permissionsMeta.length})
                  </p>
                  <div className="flex gap-1.5">
                    <button type="button" onClick={() => applyCreatePreset('full')} className="px-2.5 py-1 text-[11px] font-bold uppercase border bg-white hover:bg-blue-50" style={{ borderColor: '#CBD5E1', color: '#002B5B' }}>Full Access</button>
                    <button type="button" onClick={() => applyCreatePreset('core')} className="px-2.5 py-1 text-[11px] font-bold uppercase border bg-white hover:bg-blue-50" style={{ borderColor: '#CBD5E1', color: '#002B5B' }}>Core Banking</button>
                    <button type="button" onClick={() => applyCreatePreset('read')} className="px-2.5 py-1 text-[11px] font-bold uppercase border bg-white hover:bg-blue-50" style={{ borderColor: '#CBD5E1', color: '#002B5B' }}>Read Only</button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {groupedPermissions.map(([group, items]) => (
                    <div key={group} className="p-3 border" style={{ borderColor: '#CBD5E1', background: '#FFFFFF' }}>
                      <p className="text-[11px] font-mono font-bold uppercase tracking-wider mb-2" style={{ color: '#0052CC' }}>
                        {group}
                      </p>
                      <div className="space-y-1.5">
                        {items.map((p) => {
                          const checked = createForm.permissions.includes(p.key)
                          const disabled = createForm.accountScope === 'single_user' && p.key === 'accounts:create'
                          return (
                            <label key={p.key} className={`flex items-start gap-2 text-xs ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}>
                              <input
                                type="checkbox"
                                checked={checked}
                                disabled={disabled}
                                onChange={() => {
                                  setCreateForm((prev) => ({
                                    ...prev,
                                    permissions: checked
                                      ? prev.permissions.filter((x) => x !== p.key)
                                      : [...prev.permissions, p.key],
                                  }))
                                }}
                                className="mt-0.5"
                              />
                              <span>
                                <span className="font-semibold block" style={{ color: '#002B5B' }}>{p.label}</span>
                                <span className="font-code text-[10px]" style={{ color: 'var(--color-muted)' }}>{p.key}</span>
                              </span>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowCreate(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" className="flex-1" loading={creating}>
                  <Key size={14} /> Generate Secret API Key
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ── One-Time Secret Reveal Modal ────────────────────────────────────────── */}
      {revealedSecret && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70">
          <Card className="w-full max-w-xl p-6 fade-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 flex items-center justify-center text-white" style={{ background: '#0052CC' }}>
                <Key size={20} />
              </div>
              <div>
                <p className="text-[10px] font-mono uppercase font-bold" style={{ color: '#0052CC' }}>
                  {revealedSecret.isRotation ? 'KEY ROTATED' : 'KEY PROVISIONED'}
                </p>
                <h3 className="font-display text-lg font-bold" style={{ color: '#002B5B' }}>
                  {revealedSecret.keyName}
                </h3>
              </div>
            </div>

            <div className="p-3.5 border-l-4 mb-4 flex items-start gap-2.5 text-xs" style={{ background: '#FEF3C7', borderColor: '#D97706', color: '#78350F' }}>
              <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
              <div>
                <strong>Copy and store this key securely now.</strong> For security, Blue ridge Bank stores only a SHA-256 hash — this full secret key will never be shown again.
              </div>
            </div>

            <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#002B5B' }}>
              Secret API Key
            </label>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex-1 p-3 font-code text-xs sm:text-sm break-all border" style={{ background: '#0F172A', color: '#60A5FA', borderColor: '#1E293B' }}>
                {revealedSecret.rawKey}
              </div>
              <Button variant="primary" size="sm" onClick={() => copyText(revealedSecret.rawKey, 'key')}>
                {copiedKey ? <Check size={14} /> : <Copy size={14} />}
                {copiedKey ? 'Copied' : 'Copy'}
              </Button>
            </div>

            <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#002B5B' }}>
              Quick Verification Command
            </label>
            <div className="relative mb-5">
              <pre className="p-3 font-code text-xs overflow-x-auto border" style={{ background: '#0F172A', color: '#E2E8F0', borderColor: '#1E293B' }}>
                {`curl -X GET "${apiV1Base}/key" \\\n  -H "X-API-Key: ${revealedSecret.rawKey}"`}
              </pre>
              <button
                type="button"
                onClick={() => copyText(`curl -X GET "${apiV1Base}/key" -H "X-API-Key: ${revealedSecret.rawKey}"`, 'curl')}
                className="absolute top-2 right-2 px-2 py-1 text-[10px] font-bold uppercase border"
                style={{ background: '#1E293B', color: '#FFFFFF', borderColor: '#334155' }}
              >
                {copiedCurl ? 'Copied' : 'Copy'}
              </button>
            </div>

            <Button variant="primary" className="w-full" onClick={() => setRevealedSecret(null)}>
              I Have Stored This Key Safely
            </Button>
          </Card>
        </div>
      )}

      {confirmRotate && (
        <ConfirmModal
          title="Rotate Secret API Key?"
          message={`Rotating "${confirmRotate.name}" will immediately invalidate the current secret key and issue a brand new one. Existing integrations must be updated.`}
          confirmLabel="Rotate Key"
          variant="primary"
          onConfirm={handleRotate}
          onCancel={() => setConfirmRotate(null)}
        />
      )}

      {confirmRevoke && (
        <ConfirmModal
          title="Permanently Revoke API Key?"
          message={`Revoking "${confirmRevoke.name}" permanently disables API access for ${confirmRevoke.ownerName}. This action cannot be undone.`}
          confirmLabel="Revoke Key"
          variant="danger"
          onConfirm={handleRevoke}
          onCancel={() => setConfirmRevoke(null)}
        />
      )}

      {confirmDelete && (
        <ConfirmModal
          title="Delete API Key & Logs?"
          message={`This will permanently delete "${confirmDelete.name}" and all of its request audit logs.`}
          confirmLabel="Delete Permanently"
          variant="danger"
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  )
}
