'use client'
import { useState } from 'react'
import { useStore, genId } from '@/store'
import { Card, Button, SectionHeader, Badge } from '@/components/ui'
import { Send, Bell } from 'lucide-react'
import { fmtDate, fmtTime } from '@/lib/utils'

export default function AdminNotificationsPage() {
  const { state, dispatch, toast } = useStore()
  const { users, notifications, theme } = state
  const [target, setTarget] = useState('all')
  const [msg, setMsg] = useState('')

  const handleSend = () => {
    if (!msg.trim()) { toast('Enter a message', 'error'); return }

    if (target === 'all') {
      users.forEach(u => {
        dispatch({
          type: 'ADD_NOTIFICATION',
          notif: { id: genId(), userId: u.id, msg, read: false, createdAt: new Date().toISOString() },
        })
      })
      toast(`Notification sent to all ${users.length} users`, 'success')
    } else {
      dispatch({
        type: 'ADD_NOTIFICATION',
        notif: { id: genId(), userId: target, msg, read: false, createdAt: new Date().toISOString() },
      })
      const user = users.find(u => u.id === target)
      toast(`Notification sent to ${user?.name}`, 'success')
    }
    setMsg('')
  }

  return (
    <div className="max-w-4xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="p-6">
          <SectionHeader title="Send Notification" />

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5">Send To</label>
              <select
                className="w-full rounded-xl border px-3.5 py-2.5 text-sm font-sans outline-none"
                style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                value={target}
                onChange={e => setTarget(e.target.value)}
              >
                <option value="all">All Users</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5">Message</label>
              <textarea
                className="w-full rounded-xl border px-3.5 py-2.5 text-sm font-sans outline-none resize-none"
                style={{
                  background: 'var(--color-surface)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text)',
                  height: 100,
                }}
                placeholder="Type your notification message..."
                value={msg}
                onChange={e => setMsg(e.target.value)}
              />
            </div>

            <Button
              variant="primary"
              className="w-full justify-center"
              onClick={handleSend}
              accentColor={theme.accentColor}
            >
              <Send size={15} /> Send Notification
            </Button>
          </div>

          {/* Quick templates */}
          <div className="mt-6">
            <p className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
              Quick Templates
            </p>
            <div className="space-y-2">
              {[
                'Your deposit has been confirmed.',
                'Your account has been flagged for suspicious activity. Please contact support.',
                'Scheduled maintenance on Saturday 2–4 AM UTC.',
                'Your KYC verification is complete. All features unlocked.',
              ].map(t => (
                <button
                  key={t}
                  className="w-full text-left px-3 py-2.5 rounded-xl border text-xs font-medium hover:opacity-70 transition-opacity font-sans"
                  style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                  onClick={() => setMsg(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <SectionHeader title={`Notification History (${notifications.length})`} />
          {notifications.length === 0 ? (
            <p className="text-sm text-center py-10" style={{ color: 'var(--color-muted)' }}>
              No notifications sent yet
            </p>
          ) : (
            [...notifications].reverse().slice(0, 15).map((n, i) => {
              const u = users.find(u => u.id === n.userId)
              return (
                <div
                  key={n.id}
                  className="py-3 border-b last:border-b-0"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  <div className="flex items-center justify-between mb-1 gap-2">
                    <div className="flex items-center gap-2">
                      <Bell size={13} style={{ color: 'var(--color-muted)' }} />
                      <span className="text-xs font-semibold" style={{ color: 'var(--color-muted)' }}>
                        To: {u ? u.name : 'All Users'}
                      </span>
                    </div>
                    <Badge variant={n.read ? 'green' : 'yellow'}>
                      {n.read ? 'Read' : 'Unread'}
                    </Badge>
                  </div>
                  <p className="text-sm">{n.msg}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
                    {fmtDate(n.createdAt)} {fmtTime(n.createdAt)}
                  </p>
                </div>
              )
            })
          )}
        </Card>
      </div>
    </div>
  )
}
