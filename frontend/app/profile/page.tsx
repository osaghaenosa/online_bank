'use client'
import { useState } from 'react'
import { useAuth } from '@/store/auth'
import { api, fmtUSD, maskCard } from '@/lib/api'
import { Card, Button, Input, SectionHeader, StatusBadge, Badge, Toggle, Divider } from '@/components/ui'
import { Edit, Lock, LogOut, CreditCard, Bitcoin, Settings, Key, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export default function ProfilePage() {
  const { user, logout, refreshUser, toast } = useAuth()
  const [editing,      setEditing]  = useState(false)
  const [form,         setForm]     = useState({ firstName: user?.firstName||'', lastName: user?.lastName||'', phone: user?.phone||'' })
  const [savingProfile, setSP]      = useState(false)
  const [pwForm,        setPwForm]  = useState({ currentPassword:'', newPassword:'', confirm:'' })
  const [savingPw,      setSPw]     = useState(false)

  const saveProfile = async () => {
    setSP(true)
    try {
      await api.auth.updateProfile(form)
      await refreshUser()
      setEditing(false)
      toast('Profile updated!', 'success')
    } catch (err: any) { toast(err.message, 'error') }
    finally { setSP(false) }
  }

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pwForm.newPassword !== pwForm.confirm) { toast('Passwords do not match', 'error'); return }
    setSPw(true)
    try {
      await api.auth.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword })
      setPwForm({ currentPassword:'', newPassword:'', confirm:'' })
      toast('Password changed!', 'success')
    } catch (err: any) { toast(err.message, 'error') }
    finally { setSPw(false) }
  }

  if (!user) return null

  const u = user as any
  const crypto   = (u.cryptoAssets   ||[]).reduce((s:number,a:any)=>s+(a.valueUSD||0),0)
  const treasury = (u.treasuryAssets ||[]).reduce((s:number,a:any)=>s+(a.totalValue||0),0)
  const invest   = (u.investments    ||[]).reduce((s:number,a:any)=>s+(a.currentValue||0),0)
  const linked   = (u.linkedAccounts ||[]).reduce((s:number,a:any)=>s+(a.balance||0),0)
  const trust    = u.trust?.balance  || 0
  const netWorth = user.balance + crypto + treasury + invest + linked + trust
  const hasWealth = netWorth > user.balance

  return (
    <div className="max-w-5xl space-y-4 sm:space-y-5 fade-up">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">

        {/* ── Left column ─────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-5">

          {/* Profile card */}
          <Card className="p-4 sm:p-6">
            <div className="flex items-start sm:items-center gap-3 sm:gap-4 mb-5">
              {(user as any).profilePicture ? (
                <img src={(user as any).profilePicture} alt={user.firstName}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover flex-shrink-0 border-2"
                  style={{ borderColor: 'var(--color-accent)' }} />
              ) : (
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-white text-lg sm:text-xl font-bold flex-shrink-0"
                  style={{ background: '#0F1C35' }}>
                  {user.firstName[0]}{user.lastName[0]}
                </div>
              )}
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-bold truncate">{user.firstName} {user.lastName}</h2>
                <p className="text-xs sm:text-sm truncate" style={{ color:'var(--color-muted)' }}>{user.email}</p>
                <div className="flex gap-1.5 mt-1.5 flex-wrap">
                  <StatusBadge status={user.kyc} />
                  <StatusBadge status={user.status} />
                  {user.role === 'admin' && <Badge variant="purple">Admin</Badge>}
                  {hasWealth && <Badge variant="yellow">HNW Client</Badge>}
                </div>
              </div>
            </div>

            {!editing ? (
              <>
                {[
                  ['First Name', user.firstName],
                  ['Last Name',  user.lastName],
                  ['Email',      user.email],
                  ['Phone',      user.phone || 'Not set'],
                ].map(([l,v]) => (
                  <div key={l} className="flex justify-between py-2.5 sm:py-3 border-b last:border-0 gap-3"
                    style={{ borderColor:'var(--color-border)' }}>
                    <span className="text-xs font-semibold flex-shrink-0" style={{ color:'var(--color-muted)' }}>{l}</span>
                    <span className="text-xs sm:text-sm font-semibold text-right truncate">{v}</span>
                  </div>
                ))}
                <Button variant="secondary" className="w-full justify-center mt-4" onClick={() => setEditing(true)}>
                  <Edit size={14} /> Edit Profile
                </Button>
              </>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input label="First Name" value={form.firstName}
                    onChange={e => setForm(p => ({...p, firstName: e.target.value}))} />
                  <Input label="Last Name"  value={form.lastName}
                    onChange={e => setForm(p => ({...p, lastName:  e.target.value}))} />
                </div>
                <Input label="Phone" value={form.phone}
                  onChange={e => setForm(p => ({...p, phone: e.target.value}))}
                  placeholder="+1 555-0100" />
                <div className="flex gap-2">
                  <Button variant="secondary" className="flex-1 justify-center" onClick={() => setEditing(false)}>Cancel</Button>
                  <Button variant="primary"   className="flex-1 justify-center" onClick={saveProfile} loading={savingProfile}>Save</Button>
                </div>
              </div>
            )}
          </Card>

          {/* Security */}
          <Card className="p-4 sm:p-6">
            <SectionHeader title="Security" />
            <form onSubmit={changePassword} className="space-y-3">
              <Input label="Current Password" type="password" placeholder="••••••••"
                value={pwForm.currentPassword}
                onChange={e => setPwForm(p => ({...p, currentPassword: e.target.value}))} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input label="New Password"  type="password" placeholder="Min. 8 chars"
                  value={pwForm.newPassword}
                  onChange={e => setPwForm(p => ({...p, newPassword: e.target.value}))} />
                <Input label="Confirm New"   type="password" placeholder="Repeat"
                  value={pwForm.confirm}
                  onChange={e => setPwForm(p => ({...p, confirm: e.target.value}))} />
              </div>
              <Button type="submit" variant="secondary" className="w-full justify-center" loading={savingPw}>
                <Key size={14} /> Change Password
              </Button>
            </form>
            <Divider className="my-5" />
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3 text-sm">
                <Lock size={15} style={{ color:'var(--color-muted)' }}/>
                Two-Factor Authentication
              </div>
              <Toggle checked={false} onChange={() => toast('2FA setup coming soon!', 'info')} />
            </div>
            <Divider className="my-3" />
            <Button variant="danger" className="w-full justify-center mt-2" onClick={logout}>
              <LogOut size={14} /> Sign Out
            </Button>
          </Card>

          {/* Account details */}
          <Card className="p-4 sm:p-6">
            <SectionHeader title="Account Details" />
            {[
              ['Account Number', '****'+String(user.accountNumber||'').slice(-4)],
              ['Routing Number',  user.routingNumber||'021000021'],
              ['Card Number',     maskCard(user.cardNumber||'0000000000000000')],
              ['Card Expiry',     user.cardExpiry||'N/A'],
              ['Daily Limit',     '$10,000'],
              ['FDIC Insured',    'Up to $250,000'],
            ].map(([l,v]) => (
              <div key={l} className="flex justify-between py-2.5 sm:py-3 border-b last:border-0 gap-3"
                style={{ borderColor:'var(--color-border)' }}>
                <span className="text-xs font-semibold flex-shrink-0" style={{ color:'var(--color-muted)' }}>{l}</span>
                <span className="text-xs sm:text-sm font-semibold font-mono text-right truncate">{v}</span>
              </div>
            ))}
          </Card>
        </div>

        {/* ── Right column ─────────────────────────────────────────── */}
        <div className="space-y-4 sm:space-y-5">

          {/* Balance */}
          <Card className="p-4 sm:p-5" style={{ background:'#0F1C35' }}>
            <p className="text-xs text-white/40 mb-1">Available Balance</p>
            <p className="font-mono text-xl sm:text-2xl font-bold text-white break-all">{fmtUSD(user.balance)}</p>
            {hasWealth && (
              <>
                <Divider className="my-3 bg-white/10" />
                <p className="text-xs text-white/40 mb-1">Total Net Worth</p>
                <p className="font-mono text-lg sm:text-xl font-bold break-all" style={{ color:'#F59E0B' }}>
                  {fmtUSD(netWorth)}
                </p>
              </>
            )}
          </Card>

          {/* Wealth shortcut */}
          {hasWealth && (
            <Link href="/wealth">
              <div className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5 rounded-2xl cursor-pointer hover:opacity-90 transition-opacity"
                style={{ background:'linear-gradient(135deg,#0F2A1A,#0A1628)', border:'1px solid rgba(16,185,129,.25)' }}>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background:'rgba(16,185,129,.2)' }}>
                  <TrendingUp size={18} style={{ color:'#10B981' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-sm">Wealth Overview</p>
                  <p className="text-white/50 text-xs">Crypto · Treasury · Investments</p>
                </div>
                <span className="text-xs font-mono font-bold flex-shrink-0" style={{ color:'#10B981' }}>
                  {fmtUSD(netWorth)}
                </span>
              </div>
            </Link>
          )}

          {/* Payment methods */}
          <Card className="p-4 sm:p-5">
            <SectionHeader title="Payment Methods" />
            {[
              { icon: CreditCard, label:'Visa Debit',    sub: maskCard(user.cardNumber||'0000000000000000') },
              { icon: Settings,   label:'Bank Account',  sub: '****'+String(user.accountNumber||'').slice(-4) },
              { icon: Bitcoin,    label:'Crypto Wallet', sub: 'BTC · ETH · USDT' },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex items-center gap-3 py-3 border-b last:border-0"
                style={{ borderColor:'var(--color-border)' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background:'var(--color-bg)' }}>
                  <Icon size={15} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{label}</p>
                  <p className="text-xs font-mono truncate" style={{ color:'var(--color-muted)' }}>{sub}</p>
                </div>
                <Badge variant="green">Active</Badge>
              </div>
            ))}
          </Card>

          {/* Admin link */}
          {user.role === 'admin' && (
            <Link href="/admin">
              <div className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5 rounded-2xl cursor-pointer hover:opacity-90 transition-opacity"
                style={{ background:'#0F1C35' }}>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center bg-white/10 flex-shrink-0">
                  <Settings size={18} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
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
