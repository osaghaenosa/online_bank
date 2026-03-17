'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/store/auth'
import { api, fmtUSD, fmtDateTime, maskCard } from '@/lib/api'
import { Card, Button, Input, SectionHeader, StatusBadge, Badge, Toggle, Divider } from '@/components/ui'
import { Edit, Lock, LogOut, Bell, CreditCard, Bitcoin, Settings, Key, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function ProfilePage() {
  const { user, logout, refreshUser, toast } = useAuth()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ firstName: user?.firstName || '', lastName: user?.lastName || '', phone: user?.phone || '' })
  const [savingProfile, setSavingProfile] = useState(false)
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [savingPw, setSavingPw] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    api.user.notifications().then(d => { setNotifications(d.notifications); setUnread(d.unreadCount) }).catch(() => {})
  }, [])

  const saveProfile = async () => {
    setSavingProfile(true)
    try {
      await api.auth.updateProfile(form)
      await refreshUser()
      setEditing(false)
      toast('Profile updated!', 'success')
    } catch (err: any) { toast(err.message, 'error') }
    finally { setSavingProfile(false) }
  }

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pwForm.newPassword !== pwForm.confirm) { toast('Passwords do not match', 'error'); return }
    setSavingPw(true)
    try {
      await api.auth.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword })
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' })
      toast('Password changed!', 'success')
    } catch (err: any) { toast(err.message, 'error') }
    finally { setSavingPw(false) }
  }

  const markAllRead = async () => {
    await api.user.markAllRead()
    setNotifications(p => p.map(n => ({ ...n, read: true })))
    setUnread(0)
    toast('All notifications marked as read', 'success')
  }

  if (!user) return null

  return (
    <div className="max-w-5xl space-y-5 fade-up">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── Left Column ────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Profile card */}
          <Card className="p-6">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold flex-shrink-0"
                style={{ background: '#0F1C35' }}>
                {user.firstName[0]}{user.lastName[0]}
              </div>
              <div>
                <h2 className="text-xl font-bold">{user.firstName} {user.lastName}</h2>
                <p className="text-sm" style={{ color: 'var(--color-muted)' }}>{user.email}</p>
                <div className="flex gap-2 mt-1.5">
                  <StatusBadge status={user.kyc} />
                  <StatusBadge status={user.status} />
                  {user.role === 'admin' && <Badge variant="purple">Admin</Badge>}
                </div>
              </div>
            </div>

            {!editing ? (
              <>
                {[['First Name', user.firstName], ['Last Name', user.lastName], ['Email', user.email], ['Phone', user.phone || 'Not set']].map(([l, v]) => (
                  <div key={l} className="flex justify-between py-3 border-b last:border-0" style={{ borderColor: 'var(--color-border)' }}>
                    <span className="text-xs font-semibold" style={{ color: 'var(--color-muted)' }}>{l}</span>
                    <span className="text-sm font-semibold">{v}</span>
                  </div>
                ))}
                <Button variant="secondary" className="w-full justify-center mt-4" onClick={() => setEditing(true)}>
                  <Edit size={14} /> Edit Profile
                </Button>
              </>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Input label="First Name" value={form.firstName} onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))} />
                  <Input label="Last Name"  value={form.lastName}  onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))} />
                </div>
                <Input label="Phone" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+1 555-0100" />
                <div className="flex gap-2">
                  <Button variant="secondary" className="flex-1 justify-center" onClick={() => setEditing(false)}>Cancel</Button>
                  <Button variant="primary" className="flex-1 justify-center" onClick={saveProfile} loading={savingProfile}>Save Changes</Button>
                </div>
              </div>
            )}
          </Card>

          {/* Security */}
          <Card className="p-6">
            <SectionHeader title="Security" />
            <form onSubmit={changePassword} className="space-y-3">
              <Input label="Current Password" type="password" placeholder="••••••••"
                value={pwForm.currentPassword} onChange={e => setPwForm(p => ({ ...p, currentPassword: e.target.value }))} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="New Password" type="password" placeholder="Min. 8 chars"
                  value={pwForm.newPassword} onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))} />
                <Input label="Confirm New" type="password" placeholder="Repeat"
                  value={pwForm.confirm} onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))} />
              </div>
              <Button type="submit" variant="secondary" className="w-full justify-center" loading={savingPw}>
                <Key size={14} /> Change Password
              </Button>
            </form>
            <Divider className="my-5" />
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3 text-sm"><Lock size={15} style={{ color: 'var(--color-muted)' }} /> Two-Factor Authentication</div>
              <Toggle checked={false} onChange={() => toast('2FA setup coming soon!', 'info')} />
            </div>
            <Divider className="my-3" />
            <Button variant="danger" className="w-full justify-center mt-2" onClick={logout}>
              <LogOut size={14} /> Sign Out
            </Button>
          </Card>

          {/* Account details */}
          <Card className="p-6">
            <SectionHeader title="Account Details" />
            {[
              ['Account Number', '****' + String(user.accountNumber || '').slice(-4)],
              ['Routing Number', user.routingNumber || '021000021'],
              ['Card Number', maskCard(user.cardNumber || '0000000000000000')],
              ['Card Expiry', user.cardExpiry || 'N/A'],
              ['Daily Transfer Limit', '$10,000'],
              ['FDIC Insured', 'Up to $250,000'],
            ].map(([l, v]) => (
              <div key={l} className="flex justify-between py-3 border-b last:border-0" style={{ borderColor: 'var(--color-border)' }}>
                <span className="text-xs font-semibold" style={{ color: 'var(--color-muted)' }}>{l}</span>
                <span className="text-sm font-semibold font-mono">{v}</span>
              </div>
            ))}
          </Card>
        </div>

        {/* ── Right Column ───────────────────────────────────────────── */}
        <div className="space-y-5">

          {/* Balance summary */}
          <Card className="p-5" style={{ background: '#0F1C35' }}>
            <p className="text-xs text-white/40 mb-1">Available Balance</p>
            <p className="font-mono text-2xl font-bold text-white">{fmtUSD(user.balance)}</p>
            <Divider className="my-3" style={{ background: 'rgba(255,255,255,.1)' }} />
            <div className="flex justify-between text-sm">
              <span className="text-white/40 text-xs">Savings</span>
              <span className="font-mono text-white/70 text-xs">{fmtUSD(user.savingsBalance || 0)}</span>
            </div>
          </Card>

          {/* Notifications */}
          <Card className="p-5">
            <SectionHeader title={`Notifications${unread > 0 ? ` (${unread})` : ''}`} action={
              unread > 0 ? <Button variant="ghost" size="xs" onClick={markAllRead}>Mark all read</Button> : undefined
            } />
            {notifications.length === 0 ? (
              <p className="text-sm text-center py-6" style={{ color: 'var(--color-muted)' }}>No notifications</p>
            ) : (
              notifications.slice(0, 6).map(n => (
                <div key={n._id} className="flex gap-3 py-3 border-b last:border-0"
                  style={{ borderColor: 'var(--color-border)', opacity: n.read ? 0.55 : 1 }}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 bg-emerald-100">
                    <Bell size={13} className="text-emerald-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{n.title}</p>
                    <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--color-muted)' }}>{n.message}</p>
                    <p className="text-[10px] mt-1" style={{ color: 'var(--color-muted)' }}>{fmtDateTime(n.createdAt)}</p>
                  </div>
                  {!n.read && <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0 mt-1.5" />}
                </div>
              ))
            )}
          </Card>

          {/* Linked methods */}
          <Card className="p-5">
            <SectionHeader title="Payment Methods" />
            {[
              { icon: CreditCard, label: 'Visa Debit',    sub: maskCard(user.cardNumber || '0000000000000000') },
              { icon: Settings,   label: 'Bank Account',  sub: '****' + String(user.accountNumber || '').slice(-4) },
              { icon: Bitcoin,    label: 'Crypto Wallet', sub: 'BTC · ETH · USDT' },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex items-center gap-3 py-3.5 border-b last:border-0" style={{ borderColor: 'var(--color-border)' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--color-bg)' }}>
                  <Icon size={15} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{label}</p>
                  <p className="text-xs font-mono" style={{ color: 'var(--color-muted)' }}>{sub}</p>
                </div>
                <Badge variant="green">Active</Badge>
              </div>
            ))}
          </Card>

          {/* Admin link */}
          {user.role === 'admin' && (
            <Link href="/admin">
              <div className="flex items-center gap-4 p-5 rounded-2xl cursor-pointer" style={{ background: '#0F1C35' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/10 flex-shrink-0">
                  <Settings size={18} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-bold text-sm">Admin Panel</p>
                  <p className="text-white/40 text-xs">Manage users & transactions</p>
                </div>
              </div>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
