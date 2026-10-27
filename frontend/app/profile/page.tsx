'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/store/auth'
import { api, fmtUSD, maskCard } from '@/lib/api'
import { Card, Button, Input, SectionHeader, StatusBadge, Badge, Toggle, Divider } from '@/components/ui'
import { Edit, Lock, LogOut, CreditCard, Bitcoin, Settings, Key, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export default function ProfilePage() {
  const { user, logout, refreshUser, toast } = useAuth()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    country: user?.address?.country || '',
    location: user?.location || user?.address?.city || '',
  })
  const [savingProfile, setSP] = useState(false)
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [savingPw, setSPw] = useState(false)

  useEffect(() => {
    if (!user) return
    setForm({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      phone: user.phone || '',
      country: user.address?.country || '',
      location: user.location || user.address?.city || '',
    })
  }, [user])

  const saveProfile = async () => {
    setSP(true)
    try {
      await api.auth.updateProfile(form)
      await refreshUser()
      setEditing(false)
      toast('Profile updated!', 'success')
    } catch (err: any) {
      toast(err.message, 'error')
    } finally {
      setSP(false)
    }
  }

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pwForm.newPassword !== pwForm.confirm) {
      toast('Passwords do not match', 'error')
      return
    }
    setSPw(true)
    try {
      await api.auth.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword })
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' })
      toast('Password changed!', 'success')
    } catch (err: any) {
      toast(err.message, 'error')
    } finally {
      setSPw(false)
    }
  }

  if (!user) return null

  const u = user as any
  const crypto    = (u.cryptoAssets   || []).reduce((s: number, a: any) => s + (a.valueUSD || 0), 0)
  const treasury  = (u.treasuryAssets || []).reduce((s: number, a: any) => s + (a.totalValue || 0), 0)
  const invest    = (u.investments    || []).reduce((s: number, a: any) => s + (a.currentValue || 0), 0)
  const linked    = (u.linkedAccounts || []).reduce((s: number, a: any) => s + (a.balance || 0), 0)
  const trust     = u.trust?.balance  || 0
  const netWorth  = user.balance + crypto + treasury + invest + linked + trust
  const hasWealth = netWorth > user.balance

  return (
    <div className="max-w-5xl space-y-5 fade-up">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ── Left column ─────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">
          {/* Profile card */}
          <Card className="p-4 sm:p-6">
            <div className="flex items-start sm:items-center gap-3.5 sm:gap-4 pb-4 sm:pb-5 mb-4 sm:mb-5 border-b" style={{ borderColor: '#E2E8F0' }}>
              {(user as any).profilePicture ? (
                <img
                  src={(user as any).profilePicture}
                  alt={user.firstName}
                  className="w-13 h-13 sm:w-16 sm:h-16 object-cover flex-shrink-0 border-2"
                  style={{ borderColor: '#002B5B' }}
                />
              ) : (
                <div
                  className="w-13 h-13 sm:w-16 sm:h-16 px-3.5 py-3 flex items-center justify-center text-white text-base sm:text-xl font-bold flex-shrink-0"
                  style={{ background: '#002B5B' }}
                >
                  {user.firstName[0]}{user.lastName[0]}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h2 className="text-base sm:text-xl font-bold font-display truncate" style={{ color: '#002B5B' }}>
                  {user.firstName} {user.lastName}
                </h2>
                <p className="text-xs sm:text-sm break-all sm:truncate mt-0.5" style={{ color: 'var(--color-muted)' }}>
                  {user.email}
                </p>
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  <StatusBadge status={user.kyc} />
                  <StatusBadge status={user.status} />
                  {user.role === 'admin' && <Badge variant="blue">Administrator</Badge>}
                  {hasWealth && <Badge variant="blue">Private Client</Badge>}
                </div>
              </div>
            </div>

            {!editing ? (
              <>
                <div className="divide-y border" style={{ borderColor: 'var(--color-border)' }}>
                  {[
                    ['Legal First Name', user.firstName],
                    ['Legal Last Name', user.lastName],
                    ['Registered Email', user.email],
                    ['Telephone Number', user.phone || 'Not set'],
                    ['Country of Residence', user.address?.country || 'Not set'],
                    ['City / Location', user.location || user.address?.city || 'Not set'],
                  ].map(([l, v], i) => (
                    <div
                      key={l}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 px-3.5 py-2.5 sm:py-3"
                      style={{
                        background: i % 2 !== 0 ? '#F8FAFC' : '#FFFFFF',
                        borderColor: 'var(--color-border)',
                      }}
                    >
                      <span className="text-[11px] font-semibold uppercase tracking-wider flex-shrink-0" style={{ color: 'var(--color-muted)' }}>
                        {l}
                      </span>
                      <span className="text-xs sm:text-sm font-semibold sm:text-right break-words" style={{ color: '#002B5B' }}>
                        {v}
                      </span>
                    </div>
                  ))}
                </div>
                <Button variant="secondary" className="w-full justify-center mt-4 sm:mt-5" onClick={() => setEditing(true)}>
                  <Edit size={14} /> Update Profile Information
                </Button>
              </>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="First Name"
                    value={form.firstName}
                    onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))}
                  />
                  <Input
                    label="Last Name"
                    value={form.lastName}
                    onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))}
                  />
                </div>
                <Input
                  label="Phone"
                  value={form.phone}
                  onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                  placeholder="+1 555-0100"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Country"
                    value={form.country}
                    onChange={e => setForm(p => ({ ...p, country: e.target.value }))}
                    placeholder="e.g. United States"
                  />
                  <Input
                    label="City / Location"
                    value={form.location}
                    onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                    placeholder="e.g. New York"
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" className="flex-1 justify-center" onClick={() => setEditing(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" className="flex-1 justify-center" onClick={saveProfile} loading={savingProfile}>
                    Save Changes
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* Security */}
          <Card className="p-4 sm:p-6">
            <SectionHeader title="Security & Access Credentials" />
            <form onSubmit={changePassword} className="space-y-3">
              <Input
                label="Current Password"
                type="password"
                placeholder="••••••••"
                value={pwForm.currentPassword}
                onChange={e => setPwForm(p => ({ ...p, currentPassword: e.target.value }))}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="New Password"
                  type="password"
                  placeholder="Min. 8 chars"
                  value={pwForm.newPassword}
                  onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))}
                />
                <Input
                  label="Confirm New Password"
                  type="password"
                  placeholder="Repeat"
                  value={pwForm.confirm}
                  onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
                />
              </div>
              <Button type="submit" variant="secondary" className="w-full justify-center" loading={savingPw}>
                <Key size={14} /> Update Security Password
              </Button>
            </form>
            <Divider className="my-4 sm:my-5" />
            <div className="flex items-center justify-between gap-3 py-2">
              <div className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider min-w-0" style={{ color: '#002B5B' }}>
                <Lock size={15} className="flex-shrink-0" style={{ color: '#0052CC' }} />
                <span className="leading-snug">Two-Factor Authentication (2FA)</span>
              </div>
              <Toggle checked={false} onChange={() => toast('Hardware 2FA enrollment available via Support Desk', 'info')} />
            </div>
            <Divider className="my-3" />
            <Button variant="danger" className="w-full justify-center mt-2" onClick={logout}>
              <LogOut size={14} /> Sign Out of Banking Portal
            </Button>
          </Card>

          {/* Account details */}
          <Card className="p-4 sm:p-6">
            <SectionHeader title="Ledger & Routing Credentials" />
            <div className="divide-y border" style={{ borderColor: 'var(--color-border)' }}>
              {[
                ['Account Number', '•••• ' + String(user.accountNumber || '').slice(-4)],
                ['ABA Routing Number', user.routingNumber || '021000021'],
                ['Linked Debit Card', maskCard(user.cardNumber || '0000000000000000')],
                ['Card Expiration', user.cardExpiry || 'N/A'],
                ['Daily Withdrawal Cap', fmtUSD(user?.withdrawalLimit || 10000)],
                ['FDIC Coverage', 'Up to $250,000'],
              ].map(([l, v], i) => (
                <div
                  key={l}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 px-3.5 py-2.5 sm:py-3"
                  style={{
                    background: i % 2 !== 0 ? '#F8FAFC' : '#FFFFFF',
                    borderColor: 'var(--color-border)',
                  }}
                >
                  <span className="text-[11px] font-semibold uppercase tracking-wider flex-shrink-0" style={{ color: 'var(--color-muted)' }}>
                    {l}
                  </span>
                  <span className="text-xs sm:text-sm font-bold font-mono sm:text-right" style={{ color: '#002B5B' }}>
                    {v}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* ── Right column ─────────────────────────────────────────── */}
        <div className="space-y-5">
          {/* Balance */}
          <div
            className="p-4 sm:p-5 border-2"
            style={{ background: '#002B5B', borderColor: '#0052CC', color: '#FFFFFF' }}
          >
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#93C5FD' }}>
              AVAILABLE LIQUIDITY
            </p>
            <p className="font-mono text-xl sm:text-2xl font-bold text-white truncate">{fmtUSD(user.balance)}</p>
            {hasWealth && (
              <div className="mt-4 pt-4 border-t" style={{ borderColor: '#1E3A5F' }}>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#93C5FD' }}>
                  TOTAL PORTFOLIO NET WORTH
                </p>
                <p className="font-mono text-lg sm:text-xl font-bold truncate" style={{ color: '#60A5FA' }}>
                  {fmtUSD(netWorth)}
                </p>
              </div>
            )}
          </div>

          {/* Wealth shortcut */}
          {hasWealth && (
            <Link href="/wealth">
              <div
                className="flex items-center justify-between gap-3 p-4 sm:p-5 border-2 cursor-pointer transition-opacity hover:opacity-95"
                style={{ background: '#001F42', borderColor: '#0052CC' }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center flex-shrink-0 text-white"
                    style={{ background: '#0052CC' }}
                  >
                    <TrendingUp size={17} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-bold text-xs uppercase tracking-wider truncate">Wealth &amp; Reserves</p>
                    <p className="text-[11px] truncate" style={{ color: '#93C5FD' }}>Crypto · Treasury · Investments</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold whitespace-nowrap flex-shrink-0" style={{ color: '#60A5FA' }}>
                  {fmtUSD(netWorth)}
                </span>
              </div>
            </Link>
          )}

          {/* Payment methods */}
          <Card className="p-4 sm:p-5">
            <SectionHeader title="Active Settlement Channels" />
            <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
              {[
                { icon: CreditCard, label: 'Commercial Debit', sub: maskCard(user.cardNumber || '0000000000000000') },
                { icon: Settings,   label: 'Checking Ledger',  sub: '•••• ' + String(user.accountNumber || '').slice(-4) },
                { icon: Bitcoin,    label: 'Digital Asset Custody', sub: 'BTC · ETH · USDT' },
              ].map(({ icon: Icon, label, sub }) => (
                <div
                  key={label}
                  className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-9 h-9 flex items-center justify-center flex-shrink-0 text-white"
                      style={{ background: '#002B5B' }}
                    >
                      <Icon size={15} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-wider truncate" style={{ color: '#002B5B' }}>{label}</p>
                      <p className="text-xs font-mono truncate" style={{ color: 'var(--color-muted)' }}>{sub}</p>
                    </div>
                  </div>
                  <Badge variant="blue" className="flex-shrink-0">Active</Badge>
                </div>
              ))}
            </div>
          </Card>

          {/* Admin link */}
          {user.role === 'admin' && (
            <Link href="/admin">
              <div
                className="flex items-center gap-3.5 p-4 sm:p-5 border-2 cursor-pointer hover:opacity-95 transition-opacity"
                style={{ background: '#002B5B', borderColor: '#0052CC' }}
              >
                <div
                  className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center flex-shrink-0 text-white"
                  style={{ background: '#0052CC' }}
                >
                  <Settings size={17} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-xs uppercase tracking-wider">Administrative Command</p>
                  <p className="text-xs truncate" style={{ color: '#93C5FD' }}>Manage client accounts &amp; ledgers</p>
                </div>
              </div>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
