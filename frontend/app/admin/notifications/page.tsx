'use client'
import { useEffect, useState } from 'react'
import { api, fmtDateTime } from '@/lib/api'
import { Card, Button, SectionHeader, Badge } from '@/components/ui'
import { Send, Bell } from 'lucide-react'
import { useAuth } from '@/store/auth'

const TEMPLATES = [
  'Your deposit has been confirmed and credited to your account.',
  'Your account has been flagged for suspicious activity. Please contact support immediately.',
  'Scheduled maintenance on Saturday 2–4 AM UTC. Services may be briefly unavailable.',
  'Your KYC verification is complete. All features are now unlocked.',
  'A new payment method has been linked to your account.',
  'Your withdrawal request has been processed successfully.',
]

export default function AdminNotificationsPage() {
  const { toast } = useAuth()
  const [users, setUsers]     = useState<any[]>([])
  const [target, setTarget]   = useState('all')
  const [title, setTitle]     = useState('')
  const [msg, setMsg]         = useState('')
  const [type, setType]       = useState('system')
  const [sending, setSending] = useState(false)
  const [history, setHistory] = useState<any[]>([])

  useEffect(() => {
    api.admin.users({ limit: '100' }).then(d => setUsers(d.users)).catch(() => {})
  }, [])

  const handleSend = async () => {
    if (!title.trim() || !msg.trim()) { toast('Enter title and message', 'error'); return }
    setSending(true)
    try {
      const body: any = { title, message: msg, type }
      if (target === 'all') body.userId = 'all'
      else body.userId = target
      const d = await api.admin.sendNotif(body)
      const sentTo = target === 'all' ? `All ${d.sent} users` : users.find(u => u._id === target)?.firstName + ' ' + users.find(u => u._id === target)?.lastName
      toast(`Notification sent to ${sentTo}`, 'success')
      setHistory(p => [{ id: Date.now(), title, msg, target, sentAt: new Date().toISOString(), sent: d.sent }, ...p])
      setTitle(''); setMsg('')
    } catch (err: any) { toast(err.message, 'error') }
    finally { setSending(false) }
  }

  return (
    <div className="max-w-4xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Compose */}
        <Card className="p-6">
          <SectionHeader title="Send Notification" />
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5">Send To</label>
              <select value={target} onChange={e => setTarget(e.target.value)}
                className="w-full rounded-xl border px-3.5 py-2.5 text-sm font-sans outline-none"
                style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
                <option value="all">All Users</option>
                {users.map(u => <option key={u._id} value={u._id}>{u.firstName} {u.lastName} ({u.email})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">Type</label>
              <select value={type} onChange={e => setType(e.target.value)}
                className="w-full rounded-xl border px-3.5 py-2.5 text-sm font-sans outline-none"
                style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
                <option value="system">System</option>
                <option value="transaction">Transaction</option>
                <option value="security">Security</option>
                <option value="alert">Alert</option>
                <option value="promotion">Promotion</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">Title</label>
              <input value={title} onChange={e => setTitle(e.target.value)}
                placeholder="Notification title"
                className="w-full rounded-xl border px-3.5 py-2.5 text-sm font-sans outline-none"
                style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">Message</label>
              <textarea value={msg} onChange={e => setMsg(e.target.value)}
                placeholder="Write your notification message..."
                rows={4}
                className="w-full rounded-xl border px-3.5 py-2.5 text-sm font-sans outline-none resize-none"
                style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
            </div>
            <Button variant="primary" className="w-full justify-center" onClick={handleSend} loading={sending}>
              <Send size={14} /> Send Notification
            </Button>
          </div>

          {/* Templates */}
          <div className="mt-6">
            <p className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
              Quick Templates
            </p>
            <div className="space-y-2">
              {TEMPLATES.map(t => (
                <button key={t} onClick={() => setMsg(t)}
                  className="w-full text-left px-3 py-2.5 rounded-xl border text-xs font-medium hover:opacity-70 transition-opacity font-sans"
                  style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* History */}
        <Card className="p-6">
          <SectionHeader title={`Send History (${history.length})`} />
          {history.length === 0 ? (
            <div className="text-center py-10">
              <Bell size={32} className="mx-auto mb-3 opacity-20" />
              <p className="text-sm" style={{ color: 'var(--color-muted)' }}>No notifications sent yet</p>
            </div>
          ) : (
            <div className="space-y-0 max-h-[580px] overflow-y-auto">
              {history.map(h => (
                <div key={h.id} className="py-3.5 border-b last:border-0" style={{ borderColor: 'var(--color-border)' }}>
                  <div className="flex items-center justify-between mb-1 gap-2">
                    <div className="flex items-center gap-2">
                      <Bell size={12} style={{ color: 'var(--color-muted)' }} />
                      <span className="text-xs font-semibold" style={{ color: 'var(--color-muted)' }}>
                        To: {h.target === 'all' ? `All Users (${h.sent})` : users.find(u => u._id === h.target)?.firstName || 'User'}
                      </span>
                    </div>
                    <Badge variant="green">Sent</Badge>
                  </div>
                  <p className="text-sm font-semibold">{h.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>{h.msg}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>{fmtDateTime(h.sentAt)}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
