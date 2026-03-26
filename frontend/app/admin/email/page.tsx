'use client'
import { useEffect, useState, useCallback } from 'react'
import { api } from '@/lib/api'
import { Card, Button, SectionHeader, Badge } from '@/components/ui'
import { useAuth } from '@/store/auth'
import {
  Send, Mail, Users, User, AtSign, Check, X, Eye, EyeOff,
  TrendingUp, TrendingDown, Shield, Newspaper, Tag, Info,
  Wifi, WifiOff, ChevronDown, ChevronUp, Clock
} from 'lucide-react'

// ── Email types ───────────────────────────────────────────────────────────────
const EMAIL_TYPES = [
  { id: 'credit',      label: 'Credit Alert',    icon: TrendingUp,   color: '#10B981', desc: 'Notify user funds were added' },
  { id: 'debit',       label: 'Debit Alert',     icon: TrendingDown, color: '#EF4444', desc: 'Notify user funds were deducted' },
  { id: 'security',    label: 'Security Alert',  icon: Shield,       color: '#F59E0B', desc: 'Security warning or notice' },
  { id: 'information', label: 'Information',     icon: Info,         color: '#0EA5E9', desc: 'General account information' },
  { id: 'newsletter',  label: 'Newsletter',      icon: Newspaper,    color: '#3B82F6', desc: 'Bank news & updates' },
  { id: 'article',     label: 'Article',         icon: Newspaper,    color: '#8B5CF6', desc: 'Financial education content' },
  { id: 'promotion',   label: 'Promotion',       icon: Tag,          color: '#EC4899', desc: 'Special offers & promotions' },
  { id: 'system',      label: 'System Notice',   icon: Info,         color: '#6B7280', desc: 'System maintenance & updates' },
  { id: 'custom',      label: 'Custom',          icon: Mail,         color: '#10B981', desc: 'Fully custom email' },
]

// ── Quick templates ───────────────────────────────────────────────────────────
const TEMPLATES = [
  {
    label: 'Credit Alert',
    type: 'credit',
    subject: 'Your account has been credited',
    body: `Your NexaBank account has been successfully credited.\n\nThe funds are now available in your account and ready to use. If you did not initiate this transaction or have any questions, please contact our support team immediately.\n\nThank you for banking with NexaBank.`,
  },
  {
    label: 'Debit Alert',
    type: 'debit',
    subject: 'Transaction notification — debit',
    body: `A debit has been processed on your NexaBank account.\n\nIf you recognise this transaction, no action is required. If you did not authorise this debit, please contact our support team immediately and we will investigate.\n\nYour account security is our priority.`,
  },
  {
    label: 'Welcome',
    type: 'information',
    subject: 'Welcome to NexaBank — your account is ready',
    body: `Welcome to NexaBank!\n\nYour account has been successfully created and is ready to use. You can now deposit funds, make transfers, and access all of our banking services.\n\nHere's how to get started:\n• Deposit funds using bank transfer, card, or crypto\n• Set up your profile and complete KYC verification\n• Explore investment and wealth management features\n\nIf you need any help, our support team is available 24/7.`,
  },
  {
    label: 'KYC Verified',
    type: 'security',
    subject: 'Identity verification complete ✅',
    body: `Great news! Your identity verification (KYC) has been successfully completed.\n\nYour account is now fully verified and all features are unlocked, including higher transaction limits, international transfers, and investment products.\n\nThank you for helping us keep NexaBank safe and secure for everyone.`,
  },
  {
    label: 'Maintenance Notice',
    type: 'system',
    subject: 'Scheduled maintenance — brief downtime expected',
    body: `We will be performing scheduled maintenance on our banking platform.\n\nDuring this period, some services may be temporarily unavailable. We apologise for any inconvenience.\n\nMaintenance window: Saturday, 2:00 AM – 4:00 AM UTC\n\nAll services will be fully restored after the maintenance window. Thank you for your patience.`,
  },
  {
    label: 'Security Warning',
    type: 'security',
    subject: '⚠️ Important security notice for your account',
    body: `We have detected unusual activity on your NexaBank account and have temporarily placed a security hold as a precaution.\n\nTo restore full access to your account, please:\n• Log in to your account immediately\n• Review your recent transaction history\n• Contact our security team if you notice any unauthorised activity\n\nYour account security is our highest priority. We are here to help 24/7.`,
  },
  {
    label: 'Newsletter',
    type: 'newsletter',
    subject: 'NexaBank Monthly Update — Market insights & news',
    body: `Welcome to this month's NexaBank newsletter.\n\nMarket Highlights\nGlobal markets have shown resilience this quarter, with technology and financial sectors leading gains. Our investment portfolios have outperformed the benchmark index.\n\nNew Features\nWe're excited to announce several new features coming to your NexaBank account this month, including enhanced crypto trading, improved wealth management dashboards, and faster international transfers.\n\nFinancial Tip of the Month\nDiversification remains the cornerstone of sound investing. Consider spreading your investments across different asset classes to manage risk effectively.\n\nAs always, our team is here to support your financial journey.`,
  },
]

type SendResult = { email: string; success: boolean; error?: string }
type HistoryItem = { id: number; subject: string; type: string; target: string; sent: number; failed: number; sentAt: string }

export default function AdminEmailPage() {
  const { toast } = useAuth()
  const [users,        setUsers]        = useState<any[]>([])
  const [smtpStatus,   setSmtpStatus]   = useState<'unknown'|'ok'|'error'>('unknown')
  const [smtpError,    setSmtpError]    = useState('')

  // Recipient
  const [recipientMode, setRecipientMode] = useState<'all'|'user'|'custom'>('user')
  const [selectedUser,  setSelectedUser]  = useState('')
  const [customEmail,   setCustomEmail]   = useState('')
  const [userSearch,    setUserSearch]    = useState('')

  // Compose
  const [emailType,  setEmailType]  = useState('information')
  const [subject,    setSubject]    = useState('')
  const [body,       setBody]       = useState('')
  const [amount,     setAmount]     = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [sending,    setSending]    = useState(false)
  const [lastResults, setLastResults] = useState<SendResult[] | null>(null)

  // History
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [showHistory, setShowHistory] = useState(true)

  // Load users + verify SMTP on mount
  useEffect(() => {
    api.admin.users({ limit: '200' }).then(d => {
      setUsers(d.users)
      if (d.users.length > 0) setSelectedUser(d.users[0]._id)
    }).catch(() => {})

    api.email.verify().then((d: any) => {
      if (d.connected) { setSmtpStatus('ok') }
      else             { setSmtpStatus('error'); setSmtpError(d.error || 'SMTP not connected') }
    }).catch(() => { setSmtpStatus('error'); setSmtpError('Could not reach SMTP server') })
  }, [])

  const applyTemplate = (t: typeof TEMPLATES[0]) => {
    setEmailType(t.type)
    setSubject(t.subject)
    setBody(t.body)
    toast(`Template "${t.label}" applied`, 'success')
  }

  const recipientLabel = () => {
    if (recipientMode === 'all') return `All users (${users.length})`
    if (recipientMode === 'custom') return customEmail || 'Enter email below'
    const u = users.find(u => u._id === selectedUser)
    return u ? `${u.firstName} ${u.lastName} (${u.email})` : '—'
  }

  const handleSend = async () => {
    if (!subject.trim()) { toast('Subject is required', 'error'); return }
    if (!body.trim())    { toast('Email body is required', 'error'); return }
    if (recipientMode === 'custom' && !customEmail.includes('@')) { toast('Enter a valid email address', 'error'); return }
    if (recipientMode === 'user'   && !selectedUser) { toast('Select a user', 'error'); return }

    setSending(true)
    setLastResults(null)
    try {
      const payload: any = {
        subject: subject.trim(),
        type:    emailType,
        bodyHTML: body,
        ...(amount ? { amount: parseFloat(amount) } : {}),
      }

      if (recipientMode === 'all') {
        payload.target = 'all'
      } else if (recipientMode === 'custom') {
        payload.target      = 'custom'
        payload.customEmail = customEmail.trim()
      } else {
        payload.target = selectedUser
      }

      const d = await api.email.send(payload) as any
      setLastResults(d.results)
      setHistory(p => [{
        id: Date.now(), subject, type: emailType,
        target: recipientLabel(), sent: d.sent, failed: d.failed,
        sentAt: new Date().toISOString(),
      }, ...p])

      if (d.failed === 0) {
        toast(`✅ Email sent to ${d.sent} recipient${d.sent > 1 ? 's' : ''}`, 'success')
      } else {
        toast(`Sent: ${d.sent}, Failed: ${d.failed}`, 'warning')
      }
    } catch (err: any) {
      if (err.message?.includes('SMTP not configured')) {
        toast('SMTP not configured — set SMTP_USER and SMTP_PASS in backend .env', 'error')
      } else {
        toast(err.message || 'Send failed', 'error')
      }
    } finally {
      setSending(false)
    }
  }

  const filteredUsers = users.filter(u =>
    (u.firstName + ' ' + u.lastName + ' ' + u.email).toLowerCase().includes(userSearch.toLowerCase())
  )

  const selectedType = EMAIL_TYPES.find(t => t.id === emailType)!

  return (
    <div className="space-y-5 max-w-7xl">

      {/* SMTP status banner */}
      <div className={`flex items-center gap-3 p-3.5 rounded-xl text-sm font-medium flex-wrap`}
        style={{
          background: smtpStatus === 'ok' ? 'rgba(16,185,129,.08)' : smtpStatus === 'error' ? 'rgba(239,68,68,.08)' : 'rgba(245,158,11,.08)',
          border: `1px solid ${smtpStatus === 'ok' ? 'rgba(16,185,129,.3)' : smtpStatus === 'error' ? 'rgba(239,68,68,.3)' : 'rgba(245,158,11,.3)'}`,
        }}>
        {smtpStatus === 'ok'
          ? <><Wifi size={15} className="text-emerald-500 flex-shrink-0"/><span className="text-emerald-700">SMTP connected — emails will be delivered via <strong>{process.env.NEXT_PUBLIC_SMTP_USER || 'your configured SMTP server'}</strong></span></>
          : smtpStatus === 'error'
          ? <><WifiOff size={15} className="text-red-500 flex-shrink-0"/><span className="text-red-700">SMTP not configured — set <code className="bg-red-50 px-1 rounded">SMTP_USER</code> and <code className="bg-red-50 px-1 rounded">SMTP_PASS</code> in backend <code className="bg-red-50 px-1 rounded">.env</code>. {smtpError}</span></>
          : <><div className="w-3 h-3 rounded-full bg-amber-400 animate-pulse flex-shrink-0"/><span className="text-amber-700">Checking SMTP connection…</span></>
        }
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* ── LEFT: Composer ───────────────────────────────────────────── */}
        <div className="xl:col-span-2 space-y-5">

          {/* Recipient */}
          <Card className="p-4 sm:p-6">
            <SectionHeader title="Recipients" />

            {/* Mode toggle */}
            <div className="flex gap-1 p-1 rounded-xl mb-4"
              style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
              {([['user','Specific User',User], ['all','All Users',Users], ['custom','Custom Email',AtSign]] as const).map(([mode, label, Icon]) => (
                <button key={mode} onClick={() => setRecipientMode(mode)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    background: recipientMode === mode ? '#0F1C35' : 'transparent',
                    color:      recipientMode === mode ? '#fff'    : 'var(--color-muted)',
                  }}>
                  <Icon size={13} /> {label}
                </button>
              ))}
            </div>

            {recipientMode === 'user' && (
              <div className="space-y-2">
                <input value={userSearch} onChange={e => setUserSearch(e.target.value)}
                  placeholder="Search users…"
                  className="w-full rounded-xl border px-3 py-2 text-sm font-sans outline-none"
                  style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
                <div className="max-h-44 overflow-y-auto rounded-xl border"
                  style={{ borderColor: 'var(--color-border)' }}>
                  {filteredUsers.map(u => (
                    <button key={u._id} onClick={() => setSelectedUser(u._id)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors border-b last:border-0"
                      style={{
                        background: selectedUser === u._id ? 'rgba(16,185,129,.06)' : 'var(--color-surface)',
                        borderColor: 'var(--color-border)',
                      }}>
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                        style={{ background: '#0F1C35' }}>
                        {u.firstName[0]}{u.lastName[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate">{u.firstName} {u.lastName}</p>
                        <p className="text-[10px] truncate" style={{ color: 'var(--color-muted)' }}>{u.email}</p>
                      </div>
                      {selectedUser === u._id && <Check size={13} className="text-emerald-500 flex-shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {recipientMode === 'all' && (
              <div className="flex items-center gap-3 p-4 rounded-xl"
                style={{ background: 'rgba(59,130,246,.06)', border: '1px solid rgba(59,130,246,.2)' }}>
                <Users size={16} className="text-blue-500 flex-shrink-0" />
                <p className="text-sm text-blue-700">
                  This email will be sent to <strong>all {users.length} users</strong> in the database.
                </p>
              </div>
            )}

            {recipientMode === 'custom' && (
              <div className="space-y-2">
                <input type="email" value={customEmail} onChange={e => setCustomEmail(e.target.value)}
                  placeholder="recipient@example.com"
                  className="w-full rounded-xl border px-3.5 py-2.5 text-sm font-sans outline-none"
                  style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
                <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                  Send to anyone — even non-users. Separate multiple emails with commas.
                </p>
              </div>
            )}
          </Card>

          {/* Compose */}
          <Card className="p-4 sm:p-6">
            <SectionHeader title="Compose Email" />

            {/* Email type */}
            <div className="mb-4">
              <label className="block text-xs font-semibold mb-2">Email Type</label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {EMAIL_TYPES.map(t => (
                  <button key={t.id} onClick={() => setEmailType(t.id)}
                    title={t.desc}
                    className="flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 text-[10px] font-semibold transition-all"
                    style={{
                      borderColor: emailType === t.id ? t.color : 'var(--color-border)',
                      background:  emailType === t.id ? t.color + '12' : 'var(--color-surface)',
                      color:       emailType === t.id ? t.color : 'var(--color-muted)',
                    }}>
                    <t.icon size={14} />
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Amount (credit/debit only) */}
            {(emailType === 'credit' || emailType === 'debit') && (
              <div className="mb-4">
                <label className="block text-xs font-semibold mb-1.5">
                  Transaction Amount <span className="font-normal" style={{ color: 'var(--color-muted)' }}>(shown prominently in email)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold"
                    style={{ color: 'var(--color-muted)' }}>$</span>
                  <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-xl border pl-7 pr-4 py-2.5 text-sm font-mono outline-none"
                    style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
                </div>
              </div>
            )}

            {/* Subject */}
            <div className="mb-4">
              <label className="block text-xs font-semibold mb-1.5">Subject Line</label>
              <input value={subject} onChange={e => setSubject(e.target.value)}
                placeholder="Enter email subject…"
                className="w-full rounded-xl border px-3.5 py-2.5 text-sm font-sans outline-none"
                style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
            </div>

            {/* Body */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold">Email Body</label>
                <span className="text-[10px]" style={{ color: 'var(--color-muted)' }}>
                  Plain text — blank lines = new paragraph
                </span>
              </div>
              <textarea value={body} onChange={e => setBody(e.target.value)}
                placeholder="Write your email content here…&#10;&#10;Use blank lines to separate paragraphs."
                rows={10}
                className="w-full rounded-xl border px-3.5 py-3 text-sm font-sans outline-none resize-y"
                style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)', minHeight: '200px' }} />
            </div>

            {/* Preview + Send */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="secondary" className="flex-1 justify-center"
                onClick={() => setShowPreview(v => !v)}>
                {showPreview ? <EyeOff size={14}/> : <Eye size={14}/>}
                {showPreview ? 'Hide Preview' : 'Preview Email'}
              </Button>
              <Button variant="primary" className="flex-1 justify-center"
                loading={sending} disabled={smtpStatus === 'error' || !subject || !body}
                onClick={handleSend}>
                <Send size={14} />
                Send to {recipientMode === 'all' ? `All ${users.length}` : recipientMode === 'custom' ? customEmail || 'recipient' : recipientLabel().split(' ')[0]}
              </Button>
            </div>

            {/* Send results */}
            {lastResults && (
              <div className="mt-4 space-y-1">
                {lastResults.map((r, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg"
                    style={{ background: r.success ? 'rgba(16,185,129,.06)' : 'rgba(239,68,68,.06)' }}>
                    {r.success
                      ? <Check size={12} className="text-emerald-500 flex-shrink-0"/>
                      : <X     size={12} className="text-red-500    flex-shrink-0"/>
                    }
                    <span className="truncate">{r.email}</span>
                    <span className="ml-auto" style={{ color: r.success ? '#059669' : '#EF4444' }}>
                      {r.success ? 'Delivered' : r.error}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Email preview */}
          {showPreview && (
            <Card className="overflow-hidden">
              <div className="p-4 border-b flex items-center justify-between"
                style={{ borderColor: 'var(--color-border)' }}>
                <div className="flex items-center gap-2">
                  <Eye size={14} style={{ color: 'var(--color-muted)' }}/>
                  <p className="text-sm font-semibold">Email Preview</p>
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: selectedType.color + '18', color: selectedType.color }}>
                    {selectedType.label}
                  </span>
                </div>
                <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                  Actual email may vary slightly
                </span>
              </div>

              {/* Mock email preview */}
              <div className="p-4" style={{ background: '#F0F2F7' }}>
                <div className="max-w-xl mx-auto rounded-2xl overflow-hidden shadow-sm"
                  style={{ background: '#fff' }}>

                  {/* Header */}
                  <div className="px-8 py-6" style={{ background: '#0F1C35' }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-bold text-lg">
                          <span style={{ color: '#10B981' }}>N</span>exaBank
                        </p>
                        <p className="text-white/40 text-xs">Personal Banking</p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-bold"
                        style={{ background: selectedType.color + '20', color: selectedType.color }}>
                        {selectedType.label}
                      </span>
                    </div>
                  </div>
                  <div style={{ height: 4, background: selectedType.color }} />

                  {/* Body */}
                  <div className="px-8 py-6">
                    <p className="font-semibold mb-4" style={{ color: '#0F1C35' }}>Hello! 👋</p>

                    {(emailType === 'credit' || emailType === 'debit') && amount && (
                      <div className="rounded-xl p-4 mb-5 text-center"
                        style={{
                          background: selectedType.color + '10',
                          border: `1.5px solid ${selectedType.color}22`
                        }}>
                        <p className="text-xs font-bold uppercase tracking-wider mb-1"
                          style={{ color: selectedType.color }}>
                          Amount {emailType === 'credit' ? 'Credited' : 'Debited'}
                        </p>
                        <p className="text-3xl font-bold font-mono"
                          style={{ color: selectedType.color }}>
                          {emailType === 'credit' ? '+' : '-'}${parseFloat(amount || '0').toFixed(2)}
                        </p>
                      </div>
                    )}

                    <div className="text-sm leading-relaxed space-y-3" style={{ color: '#374151' }}>
                      {body.split('\n\n').map((para, i) => para.trim() && (
                        <p key={i}>{para}</p>
                      ))}
                    </div>
                  </div>

                  <hr style={{ borderColor: '#E5E7EB', margin: '0 32px' }} />

                  {/* CTA */}
                  <div className="px-8 py-5 text-center">
                    <span className="inline-block px-6 py-2.5 rounded-xl text-white text-sm font-bold"
                      style={{ background: '#0F1C35' }}>
                      Go to My Account →
                    </span>
                  </div>

                  {/* Footer */}
                  <div className="px-8 py-5 text-center text-xs text-gray-400"
                    style={{ background: '#F9FAFB', borderTop: '1px solid #E5E7EB' }}>
                    <p>Sent by <strong style={{ color: '#0F1C35' }}>NexaBank</strong> · support@nexabank.com</p>
                    <p className="mt-1">© 2025 NexaBank. All rights reserved.</p>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* ── RIGHT: Templates + History ───────────────────────────────── */}
        <div className="space-y-5">

          {/* Quick templates */}
          <Card className="p-4 sm:p-5">
            <SectionHeader title="Quick Templates" sub="Click to fill composer" />
            <div className="space-y-2">
              {TEMPLATES.map(t => {
                const tp = EMAIL_TYPES.find(e => e.id === t.type)!
                return (
                  <button key={t.label} onClick={() => applyTemplate(t)}
                    className="w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all hover:opacity-80"
                    style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)' }}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: tp.color + '18' }}>
                      <tp.icon size={13} style={{ color: tp.color }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold">{t.label}</p>
                      <p className="text-[10px] truncate mt-0.5" style={{ color: 'var(--color-muted)' }}>
                        {t.subject}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </Card>

          {/* Send history */}
          <Card className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4 cursor-pointer"
              onClick={() => setShowHistory(v => !v)}>
              <div className="flex items-center gap-2">
                <Clock size={14} style={{ color: 'var(--color-muted)' }}/>
                <h3 className="font-bold text-sm">Send History ({history.length})</h3>
              </div>
              {showHistory ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
            </div>

            {showHistory && (
              history.length === 0 ? (
                <div className="text-center py-8">
                  <Mail size={28} className="mx-auto mb-2 opacity-20" />
                  <p className="text-xs" style={{ color: 'var(--color-muted)' }}>No emails sent yet</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {history.map(h => {
                    const tp = EMAIL_TYPES.find(e => e.id === h.type)!
                    return (
                      <div key={h.id} className="p-3 rounded-xl"
                        style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <tp.icon size={11} style={{ color: tp.color, flexShrink: 0 }}/>
                            <p className="text-xs font-semibold truncate">{h.subject}</p>
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            {h.sent > 0 && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold">
                                {h.sent} sent
                              </span>
                            )}
                            {h.failed > 0 && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 font-bold">
                                {h.failed} failed
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-[10px] truncate" style={{ color: 'var(--color-muted)' }}>
                          To: {h.target}
                        </p>
                        <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-muted)' }}>
                          {new Date(h.sentAt).toLocaleString('en-US', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })}
                        </p>
                      </div>
                    )
                  })}
                </div>
              )
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
