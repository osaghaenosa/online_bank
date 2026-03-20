'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { api, fmtUSD } from '@/lib/api'
import { Card, Button, SectionHeader, StatusBadge } from '@/components/ui'
import {
  Search, Edit, Check, X, ChevronDown, ChevronUp,
  Lock, Mail, Eye, EyeOff, Shield, Camera, Trash2, Upload, UserCircle
} from 'lucide-react'
import { useAuth } from '@/store/auth'

type EditMode = 'name' | 'credentials' | 'photo' | null

export default function AdminAccountsPage() {
  const { toast } = useAuth()
  const [users,      setUsers]    = useState<any[]>([])
  const [loading,    setLoading]  = useState(true)
  const [search,     setSearch]   = useState('')
  const [editingId,  setEditId]   = useState<string | null>(null)
  const [editMode,   setEditMode] = useState<EditMode>(null)
  const [saving,     setSaving]   = useState(false)
  const [expanded,   setExpanded] = useState<string | null>(null)
  const [showPw,     setShowPw]   = useState(false)
  const [nameForm,   setNameForm] = useState({ firstName: '', lastName: '' })
  const [credForm,   setCredForm] = useState({ email: '', password: '', confirmPw: '' })

  // Photo upload state
  const [photoPreview,  setPhotoPreview]  = useState<string | null>(null)
  const [photoFile,     setPhotoFile]     = useState<File | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const d = await api.admin.users({ search, limit: '50' })
      setUsers(d.users)
    } catch (err: any) { toast(err.message, 'error') }
    finally { setLoading(false) }
  }, [search])

  useEffect(() => { load() }, [load])

  const startEdit = (u: any, mode: EditMode) => {
    setEditId(u._id); setEditMode(mode); setShowPw(false)
    setPhotoPreview(null); setPhotoFile(null)
    if (mode === 'name')        setNameForm({ firstName: u.firstName, lastName: u.lastName })
    if (mode === 'credentials') setCredForm({ email: u.email, password: '', confirmPw: '' })
  }
  const cancelEdit = () => {
    setEditId(null); setEditMode(null)
    setPhotoPreview(null); setPhotoFile(null)
  }

  const saveName = async (userId: string) => {
    if (!nameForm.firstName.trim() || !nameForm.lastName.trim()) { toast('Both names required', 'error'); return }
    setSaving(true)
    try {
      const d = await api.admin.editName(userId, nameForm)
      setUsers(p => p.map(u => u._id === userId ? { ...u, ...d.user } : u))
      cancelEdit(); toast('Name updated', 'success')
    } catch (err: any) { toast(err.message, 'error') }
    finally { setSaving(false) }
  }

  const saveCredentials = async (userId: string) => {
    if (!credForm.email.trim() && !credForm.password) { toast('Enter email or new password', 'error'); return }
    if (credForm.password && credForm.password !== credForm.confirmPw) { toast('Passwords do not match', 'error'); return }
    if (credForm.password && credForm.password.length < 8) { toast('Password must be at least 8 characters', 'error'); return }
    setSaving(true)
    try {
      const body: any = {}
      if (credForm.email.trim()) body.email    = credForm.email.trim()
      if (credForm.password)     body.password = credForm.password
      const d = await api.admin.editCredentials(userId, body)
      setUsers(p => p.map(u => u._id === userId ? { ...u, ...d.user } : u))
      cancelEdit(); toast('Credentials updated', 'success')
    } catch (err: any) { toast(err.message, 'error') }
    finally { setSaving(false) }
  }

  // ── Photo handlers ────────────────────────────────────────────────────────
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast('Image must be under 5 MB', 'error'); return }
    setPhotoFile(file)
    const reader = new FileReader()
    reader.onload = ev => setPhotoPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const uploadPhoto = async (userId: string) => {
    if (!photoFile) { toast('Select an image first', 'error'); return }
    setUploadingPhoto(true)
    try {
      const d = await api.admin.uploadUserPhoto(userId, photoFile)
      setUsers(p => p.map(u => u._id === userId ? { ...u, profilePicture: d.profilePicture } : u))
      cancelEdit()
      toast('Profile photo uploaded to ImageKit ✓', 'success')
    } catch (err: any) {
      // Surface ImageKit config errors clearly
      if (err.message?.includes('ImageKit environment')) {
        toast('ImageKit not configured — set IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY and IMAGEKIT_URL_ENDPOINT in backend .env', 'error')
      } else {
        toast(err.message || 'Upload failed', 'error')
      }
    } finally { setUploadingPhoto(false) }
  }

  const removePhoto = async (userId: string) => {
    try {
      const d = await api.admin.deleteUserPhoto(userId)
      setUsers(p => p.map(u => u._id === userId ? { ...u, profilePicture: null } : u))
      toast('Profile photo removed', 'success')
    } catch (err: any) { toast(err.message, 'error') }
  }

  // ── Net worth helper ─────────────────────────────────────────────────────
  const netWorth = (u: any) =>
    u.balance
    + (u.cryptoAssets   || []).reduce((s: number, a: any) => s + (a.valueUSD    || 0), 0)
    + (u.treasuryAssets || []).reduce((s: number, a: any) => s + (a.totalValue  || 0), 0)
    + (u.investments    || []).reduce((s: number, a: any) => s + (a.currentValue|| 0), 0)
    + (u.linkedAccounts || []).reduce((s: number, a: any) => s + (a.balance     || 0), 0)
    + (u.trust?.balance || 0)

  // ── Avatar component ─────────────────────────────────────────────────────
  const Avatar = ({ u, size = 'md' }: { u: any; size?: 'sm' | 'md' | 'lg' }) => {
    const dim = size === 'sm' ? 'w-8 h-8 text-xs' : size === 'lg' ? 'w-16 h-16 text-xl' : 'w-10 h-10 text-sm'
    if (u.profilePicture) {
      return (
        <img src={u.profilePicture} alt={u.firstName}
          className={`${dim} rounded-full object-cover flex-shrink-0`} />
      )
    }
    return (
      <div className={`${dim} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}
        style={{ background: '#0F1C35' }}>
        {u.firstName[0]}{u.lastName[0]}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <Card className="p-4 sm:p-6">
        <SectionHeader title="Account Editor"
          sub="Edit name, email, password and profile photo for any user" />

        <div className="relative mb-5">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--color-muted)' }} />
          <input placeholder="Search by name or email…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none font-sans"
            style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="shimmer h-20 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {users.map(u => {
              const isEditing  = editingId === u._id
              const isExpanded = expanded  === u._id
              const nw         = netWorth(u)
              const hasWealth  = nw > u.balance

              return (
                <div key={u._id} className="rounded-2xl border overflow-hidden"
                  style={{ borderColor: 'var(--color-border)' }}>

                  {/* ── Header row ─────────────────────────────────── */}
                  <div className="flex items-center gap-3 p-3 sm:p-4"
                    style={{ background: 'var(--color-surface)' }}>
                    <Avatar u={u} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-sm font-semibold truncate">{u.firstName} {u.lastName}</p>
                        <StatusBadge status={u.status} />
                        {hasWealth && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                            style={{ background: 'rgba(245,158,11,.12)', color: '#F59E0B' }}>HNW</span>
                        )}
                      </div>
                      <p className="text-xs truncate" style={{ color: 'var(--color-muted)' }}>{u.email}</p>
                    </div>
                    <div className="text-right hidden sm:block flex-shrink-0">
                      <p className="text-xs font-mono font-bold">{fmtUSD(u.balance)}</p>
                      {hasWealth && (
                        <p className="text-[10px] font-mono" style={{ color: '#F59E0B' }}>NW: {fmtUSD(nw)}</p>
                      )}
                    </div>
                    <button onClick={() => setExpanded(isExpanded ? null : u._id)}
                      className="p-2 rounded-lg hover:opacity-70 flex-shrink-0"
                      style={{ background: 'var(--color-bg)' }}>
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>

                  {/* ── Expanded panel ─────────────────────────────── */}
                  {isExpanded && (
                    <div className="border-t" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)' }}>

                      {/* ── Default view — action cards ───────────── */}
                      {!isEditing && (
                        <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">

                          {/* Profile Photo card */}
                          <div className="p-4 rounded-2xl border"
                            style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <Camera size={13} style={{ color: 'var(--color-accent)' }} />
                                <p className="text-sm font-semibold">Profile Photo</p>
                              </div>
                              <Button variant="secondary" size="sm"
                                onClick={() => startEdit(u, 'photo')}>
                                <Camera size={11} /> {u.profilePicture ? 'Change' : 'Upload'}
                              </Button>
                            </div>
                            <div className="flex items-center gap-3">
                              <Avatar u={u} size="lg" />
                              <div className="min-w-0">
                                {u.profilePicture ? (
                                  <>
                                    <p className="text-xs text-emerald-600 font-semibold">Photo set ✓</p>
                                    <p className="text-[10px] mt-0.5 truncate" style={{ color: 'var(--color-muted)' }}>
                                      Hosted on ImageKit
                                    </p>
                                    <button onClick={() => removePhoto(u._id)}
                                      className="text-[10px] text-red-500 hover:text-red-700 mt-1 font-semibold flex items-center gap-1">
                                      <Trash2 size={10} /> Remove
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <p className="text-xs font-medium" style={{ color: 'var(--color-muted)' }}>No photo</p>
                                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-muted)' }}>Initials shown</p>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Name card */}
                          <div className="p-4 rounded-2xl border"
                            style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <Edit size={13} style={{ color: 'var(--color-accent)' }} />
                                <p className="text-sm font-semibold">Display Name</p>
                              </div>
                              <Button variant="secondary" size="sm" onClick={() => startEdit(u, 'name')}>
                                <Edit size={11} /> Edit
                              </Button>
                            </div>
                            <p className="text-sm font-semibold">{u.firstName} {u.lastName}</p>
                          </div>

                          {/* Credentials card */}
                          <div className="p-4 rounded-2xl border"
                            style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <Shield size={13} className="text-red-500" />
                                <p className="text-sm font-semibold">Login Credentials</p>
                              </div>
                              <Button variant="secondary" size="sm"
                                style={{ color: '#EF4444', borderColor: '#EF4444' }}
                                onClick={() => startEdit(u, 'credentials')}>
                                <Lock size={11} /> Change
                              </Button>
                            </div>
                            <p className="text-xs truncate font-mono"
                              style={{ color: 'var(--color-muted)' }}>{u.email}</p>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>Password: ••••••••</p>
                          </div>
                        </div>
                      )}

                      {/* ── PHOTO UPLOAD FORM ─────────────────────── */}
                      {isEditing && editMode === 'photo' && (
                        <div className="p-4">
                          <div className="p-5 rounded-2xl border"
                            style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
                            <div className="flex items-center gap-2 mb-4">
                              <Camera size={15} style={{ color: 'var(--color-accent)' }} />
                              <p className="text-sm font-semibold">Upload Profile Photo</p>
                            </div>

                            {/* Preview + picker */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 mb-5">
                              {/* Current / preview */}
                              <div className="relative flex-shrink-0">
                                {photoPreview ? (
                                  <img src={photoPreview} alt="Preview"
                                    className="w-24 h-24 rounded-2xl object-cover border-2"
                                    style={{ borderColor: 'var(--color-accent)' }} />
                                ) : u.profilePicture ? (
                                  <img src={u.profilePicture} alt={u.firstName}
                                    className="w-24 h-24 rounded-2xl object-cover border-2"
                                    style={{ borderColor: 'var(--color-border)' }} />
                                ) : (
                                  <div className="w-24 h-24 rounded-2xl flex items-center justify-center text-white text-2xl font-bold"
                                    style={{ background: '#0F1C35' }}>
                                    {u.firstName[0]}{u.lastName[0]}
                                  </div>
                                )}
                                {photoPreview && (
                                  <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                                    style={{ background: 'var(--color-accent)' }}>✓</div>
                                )}
                              </div>

                              {/* Upload area */}
                              <div className="flex-1 min-w-0">
                                <input type="file" accept="image/jpeg,image/png,image/webp,image/gif"
                                  ref={fileInputRef} className="hidden" onChange={handleFileSelect} />

                                <button onClick={() => fileInputRef.current?.click()}
                                  className="w-full border-2 border-dashed rounded-xl p-5 text-center transition-all hover:opacity-80 cursor-pointer"
                                  style={{ borderColor: photoFile ? 'var(--color-accent)' : 'var(--color-border)' }}>
                                  <Upload size={20} className="mx-auto mb-2"
                                    style={{ color: photoFile ? 'var(--color-accent)' : 'var(--color-muted)' }} />
                                  {photoFile ? (
                                    <div>
                                      <p className="text-sm font-semibold" style={{ color: 'var(--color-accent)' }}>
                                        {photoFile.name}
                                      </p>
                                      <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
                                        {(photoFile.size / 1024).toFixed(0)} KB · Click to change
                                      </p>
                                    </div>
                                  ) : (
                                    <div>
                                      <p className="text-sm font-semibold" style={{ color: 'var(--color-muted)' }}>
                                        Click to select photo
                                      </p>
                                      <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
                                        JPEG, PNG, WebP — max 5 MB
                                      </p>
                                    </div>
                                  )}
                                </button>

                                {/* ImageKit badge */}
                                <div className="flex items-center gap-2 mt-3 p-2.5 rounded-xl"
                                  style={{ background: 'rgba(16,185,129,.06)', border: '1px solid rgba(16,185,129,.2)' }}>
                                  <span className="text-emerald-500 font-bold text-xs">IK</span>
                                  <p className="text-xs text-emerald-700">
                                    Uploaded directly to <strong>ImageKit CDN</strong> — no local storage used
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="flex gap-3">
                              <Button variant="secondary" className="flex-1 justify-center" onClick={cancelEdit}>
                                Cancel
                              </Button>
                              <Button variant="primary" className="flex-1 justify-center"
                                loading={uploadingPhoto}
                                disabled={!photoFile}
                                onClick={() => uploadPhoto(u._id)}>
                                <Upload size={14} /> Upload to ImageKit
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* ── NAME FORM ──────────────────────────────── */}
                      {isEditing && editMode === 'name' && (
                        <div className="p-4">
                          <div className="p-4 rounded-2xl border"
                            style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
                            <p className="text-sm font-semibold mb-4 flex items-center gap-2">
                              <Edit size={13} style={{ color: 'var(--color-accent)' }} />
                              Edit Display Name
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                              <div>
                                <label className="block text-xs font-semibold mb-1.5">First Name</label>
                                <input value={nameForm.firstName}
                                  onChange={e => setNameForm(p => ({ ...p, firstName: e.target.value }))}
                                  className="w-full rounded-xl border px-3 py-2.5 text-sm font-sans outline-none"
                                  style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold mb-1.5">Last Name</label>
                                <input value={nameForm.lastName}
                                  onChange={e => setNameForm(p => ({ ...p, lastName: e.target.value }))}
                                  className="w-full rounded-xl border px-3 py-2.5 text-sm font-sans outline-none"
                                  style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="secondary" className="flex-1 justify-center" onClick={cancelEdit}>Cancel</Button>
                              <Button variant="primary" className="flex-1 justify-center" loading={saving}
                                onClick={() => saveName(u._id)}>
                                <Check size={13} /> Save
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* ── CREDENTIALS FORM ──────────────────────── */}
                      {isEditing && editMode === 'credentials' && (
                        <div className="p-4">
                          <div className="p-4 rounded-2xl border"
                            style={{ borderColor: '#FCA5A5', background: 'rgba(239,68,68,.03)' }}>
                            <div className="flex items-center gap-2 mb-1">
                              <Shield size={13} className="text-red-500" />
                              <p className="text-sm font-semibold text-red-700">Edit Login Credentials</p>
                            </div>
                            <p className="text-xs mb-4" style={{ color: 'var(--color-muted)' }}>
                              Leave password blank to keep current. User will be notified of any changes.
                            </p>
                            <div className="space-y-3 mb-4">
                              <div>
                                <label className="block text-sm font-semibold mb-1.5 flex items-center gap-1.5">
                                  <Mail size={12} /> Email Address
                                </label>
                                <input type="email" value={credForm.email}
                                  onChange={e => setCredForm(p => ({ ...p, email: e.target.value }))}
                                  placeholder={u.email}
                                  className="w-full rounded-xl border px-3.5 py-2.5 text-sm font-sans outline-none"
                                  style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
                              </div>
                              <div>
                                <label className="block text-sm font-semibold mb-1.5">
                                  New Password
                                  <span className="text-xs font-normal ml-1"
                                    style={{ color: 'var(--color-muted)' }}>(blank = keep current)</span>
                                </label>
                                <div className="relative">
                                  <input type={showPw ? 'text' : 'password'}
                                    value={credForm.password}
                                    onChange={e => setCredForm(p => ({ ...p, password: e.target.value }))}
                                    placeholder="Min. 8 characters"
                                    className="w-full rounded-xl border px-3.5 py-2.5 pr-10 text-sm font-sans outline-none"
                                    style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
                                  <button type="button" onClick={() => setShowPw(v => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-80">
                                    {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                                  </button>
                                </div>
                              </div>
                              {credForm.password && (
                                <div>
                                  <label className="block text-sm font-semibold mb-1.5">Confirm Password</label>
                                  <input type={showPw ? 'text' : 'password'}
                                    value={credForm.confirmPw}
                                    onChange={e => setCredForm(p => ({ ...p, confirmPw: e.target.value }))}
                                    placeholder="Repeat new password"
                                    className="w-full rounded-xl border px-3.5 py-2.5 text-sm font-sans outline-none"
                                    style={{
                                      background: 'var(--color-surface)', color: 'var(--color-text)',
                                      borderColor: credForm.confirmPw && credForm.confirmPw !== credForm.password
                                        ? '#EF4444' : 'var(--color-border)'
                                    }} />
                                  {credForm.confirmPw && credForm.confirmPw !== credForm.password && (
                                    <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button variant="secondary" className="flex-1 justify-center" onClick={cancelEdit}>Cancel</Button>
                              <Button variant="danger" className="flex-1 justify-center" loading={saving}
                                onClick={() => saveCredentials(u._id)}>
                                <Lock size={13} /> Update Credentials
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* ── Stats row ────────────────────────────── */}
                      {!isEditing && (
                        <div className="p-4 pt-0">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {[
                              { label: 'Checking',    value: fmtUSD(u.balance), color: '#10B981' },
                              { label: 'Crypto',      value: fmtUSD((u.cryptoAssets||[]).reduce((s:number,a:any)=>s+(a.valueUSD||0),0)), color: '#F59E0B' },
                              { label: 'Investments', value: fmtUSD((u.investments||[]).reduce((s:number,a:any)=>s+(a.currentValue||0),0)), color: '#3B82F6' },
                              { label: 'Net Worth',   value: fmtUSD(netWorth(u)), color: '#10B981' },
                            ].map(({ label, value, color }) => (
                              <div key={label} className="p-3 rounded-xl text-center"
                                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                                <p className="text-[10px] mb-1" style={{ color: 'var(--color-muted)' }}>{label}</p>
                                <p className="text-xs font-bold font-mono" style={{ color }}>{value}</p>
                              </div>
                            ))}
                          </div>
                          <div className="flex flex-wrap gap-3 mt-3 text-xs" style={{ color: 'var(--color-muted)' }}>
                            <span>Acct: ****{String(u.accountNumber || '').slice(-4)}</span>
                            <span>KYC: <strong style={{ color: u.kyc === 'Verified' ? '#10B981' : '#F59E0B' }}>{u.kyc}</strong></span>
                            <span>Joined: {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            {u.profilePicture && <span className="text-emerald-600 font-semibold">📷 Photo set</span>}
                          </div>
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
