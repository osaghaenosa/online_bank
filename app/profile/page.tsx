'use client'
import { useState } from 'react'
import { useStore } from '@/store'
import { Card, Button, Input, SectionHeader, StatusBadge, Badge, Toggle, Divider } from '@/components/ui'
import { Edit, Lock, LogOut, Bell, Building, CreditCard, Bitcoin, Settings, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function ProfilePage() {
  const { me, state, dispatch, toast } = useStore()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: me.name, email: me.email, phone: me.phone })
  const [tfa, setTfa] = useState(false)

  const { theme } = state
  const myNotifs = state.notifications.filter(n => !n.userId || n.userId === me.id)

  const save = () => {
    dispatch({ type: 'UPDATE_USER', userId: me.id, patch: form })
    setEditing(false)
    toast('Profile updated successfully!', 'success')
  }

  return (
    <div className="max-w-4xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Profile Card */}
        <div className="space-y-5">
          <Card className="p-6">
            <div className="flex items-center gap-4 mb-5">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0"
                style={{ background: theme.primaryColor }}
              >
                {me.name[0]}
              </div>
              <div>
                <h2 className="text-xl font-bold">{me.name}</h2>
                <p className="text-sm" style={{ color: 'var(--color-muted)' }}>{me.email}</p>
                <StatusBadge status={me.kyc} />
              </div>
            </div>

            {!editing ? (
              <>
                {[
                  ['Name', me.name],
                  ['Email', me.email],
                  ['Phone', me.phone],
                ].map(([l, v]) => (
                  <div key={l} className="flex justify-between py-3 border-b last:border-b-0" style={{ borderColor: 'var(--color-border)' }}>
                    <span className="text-xs font-medium" style={{ color: 'var(--color-muted)' }}>{l}</span>
                    <span className="text-sm font-semibold">{v}</span>
                  </div>
                ))}
                <Button
                  variant="secondary"
                  className="w-full justify-center mt-4"
                  onClick={() => setEditing(true)}
                >
                  <Edit size={14} /> Edit Profile
                </Button>
              </>
            ) : (
              <div className="space-y-3">
                <Input label="Name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                <Input label="Email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
                <Input label="Phone" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
                <div className="flex gap-2">
                  <Button variant="secondary" className="flex-1 justify-center" onClick={() => setEditing(false)}>Cancel</Button>
                  <Button variant="primary" className="flex-1 justify-center" onClick={save} accentColor={theme.accentColor}>Save Changes</Button>
                </div>
              </div>
            )}
          </Card>

          {/* Security */}
          <Card className="p-6">
            <SectionHeader title="Security" />
            <div className="space-y-0">
              <div className="flex items-center justify-between py-3.5 border-b" style={{ borderColor: 'var(--color-border)' }}>
                <div className="flex items-center gap-3 text-sm">
                  <Lock size={16} style={{ color: 'var(--color-muted)' }} />
                  Two-Factor Authentication
                </div>
                <Toggle checked={tfa} onChange={() => setTfa(!tfa)} accentColor={theme.accentColor} />
              </div>
              <div className="flex items-center justify-between py-3.5">
                <div className="flex items-center gap-3 text-sm">
                  <Lock size={16} style={{ color: 'var(--color-muted)' }} />
                  Password
                </div>
                <Button variant="secondary" size="sm" onClick={() => toast('Password reset email sent!', 'success')}>
                  Change
                </Button>
              </div>
            </div>

            <Divider className="my-4" />

            <Button
              variant="secondary"
              className="w-full justify-center"
              style={{ color: '#EF4444', borderColor: '#EF4444' }}
              onClick={() => toast('Logged out successfully', 'warning')}
            >
              <LogOut size={14} /> Log Out
            </Button>
          </Card>
        </div>

        <div className="space-y-5">
          {/* Notifications */}
          <Card className="p-6">
            <SectionHeader title="Notifications" />
            {myNotifs.length === 0 ? (
              <p className="text-sm text-center py-6" style={{ color: 'var(--color-muted)' }}>No notifications</p>
            ) : (
              myNotifs.slice(0, 6).map((n, i) => (
                <div
                  key={n.id}
                  className="flex gap-3 py-3 border-b last:border-b-0"
                  style={{ borderColor: 'var(--color-border)', opacity: n.read ? 0.5 : 1 }}
                >
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 bg-emerald-100">
                    <Bell size={14} className="text-emerald-700" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">{n.msg}</p>
                    {!n.read && (
                      <div className="w-1.5 h-1.5 rounded-full mt-1.5" style={{ background: theme.accentColor }} />
                    )}
                  </div>
                </div>
              ))
            )}
          </Card>

          {/* Linked Methods */}
          <Card className="p-6">
            <SectionHeader title="Linked Payment Methods" />
            {[
              { icon: Building, label: 'Bank Account', sub: '••••' + me.accountNo.replace(/ /g, '').slice(-4) },
              { icon: CreditCard, label: 'Visa Debit', sub: '••••' + me.cardNo.replace(/ /g, '').slice(-4) },
              { icon: Bitcoin, label: 'Crypto Wallet', sub: 'BTC · ETH · USDT' },
            ].map(({ icon: Icon, label, sub }, i) => (
              <div
                key={i}
                className="flex items-center gap-3 py-3.5 border-b last:border-b-0"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--color-bg)' }}>
                  <Icon size={16} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{label}</p>
                  <p className="text-xs font-mono" style={{ color: 'var(--color-muted)' }}>{sub}</p>
                </div>
                <Badge variant="green">Active</Badge>
              </div>
            ))}
          </Card>

          {/* Admin Access */}
          <Link href="/admin">
            <div
              className="flex items-center gap-4 p-5 rounded-2xl cursor-pointer"
              style={{ background: theme.primaryColor }}
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-white/10 flex-shrink-0">
                <Settings size={20} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="text-white font-bold">Admin Access</p>
                <p className="text-white/50 text-xs">Manage users, transactions & branding</p>
              </div>
              <ArrowRight size={16} className="text-white/60" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
