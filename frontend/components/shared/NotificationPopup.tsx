'use client'
import { useEffect, useRef, useState } from 'react'
import { api, fmtDateTime } from '@/lib/api'
import { Bell, X, Check, CheckCheck, AlertCircle, Info, DollarSign, Shield } from 'lucide-react'
import { useAuth } from '@/store/auth'

interface Notif {
  _id: string
  title: string
  message: string
  type: string
  priority: string
  read: boolean
  createdAt: string
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  transaction: <DollarSign size={13} className="text-emerald-600" />,
  security:    <Shield     size={13} className="text-red-500" />,
  system:      <Info       size={13} className="text-blue-500" />,
  alert:       <AlertCircle size={13} className="text-amber-500" />,
}
const TYPE_BG: Record<string, string> = {
  transaction: 'bg-emerald-100',
  security:    'bg-red-100',
  system:      'bg-blue-100',
  alert:       'bg-amber-100',
}

interface Props {
  unread: number
  onUnreadChange: (n: number) => void
}

export function NotificationPopup({ unread, onUnreadChange }: Props) {
  const { toast } = useAuth()
  const [open,   setOpen]   = useState(false)
  const [notifs, setNotifs] = useState<Notif[]>([])
  const [loading, setLoad]  = useState(false)
  const popupRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  const openPopup = async () => {
    setOpen(v => !v)
    if (!notifs.length) {
      setLoad(true)
      try {
        const d = await api.user.notifications()
        setNotifs(d.notifications || [])
      } catch { /* ignore */ }
      finally { setLoad(false) }
    }
  }

  const markAllRead = async () => {
    try {
      await api.user.markAllRead()
      setNotifs(p => p.map(n => ({ ...n, read: true })))
      onUnreadChange(0)
      toast('All notifications marked as read', 'success')
    } catch { /* ignore */ }
  }

  const markOne = async (id: string) => {
    setNotifs(p => p.map(n => n._id === id ? { ...n, read: true } : n))
    const newCount = notifs.filter(n => !n.read && n._id !== id).length
    onUnreadChange(newCount)
  }

  return (
    <div className="relative" ref={popupRef}>
      {/* Bell button */}
      <button
        onClick={openPopup}
        className="relative w-9 h-9 flex items-center justify-center rounded-xl border transition-all hover:opacity-80"
        style={{ borderColor: 'var(--color-border)', background: open ? 'var(--color-accent)' : 'var(--color-bg)' }}
        aria-label="Notifications"
      >
        <Bell size={16} style={{ color: open ? '#fff' : 'var(--color-text)' }} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1 leading-none">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Popup */}
      {open && (
        <>
          {/* Mobile backdrop */}
          <div className="fixed inset-0 z-[90] bg-black/30 sm:hidden" onClick={() => setOpen(false)} />

          <div className={`
            fixed sm:absolute z-[100]
            left-0 right-0 bottom-0 sm:bottom-auto sm:left-auto
            sm:right-0 sm:top-[calc(100%+8px)]
            w-full sm:w-[360px] max-h-[70vh] sm:max-h-[480px]
            flex flex-col overflow-hidden
            rounded-t-2xl sm:rounded-2xl shadow-2xl
          `} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0"
              style={{ borderColor: 'var(--color-border)' }}>
              <div className="flex items-center gap-2">
                <Bell size={15} style={{ color: 'var(--color-accent)' }} />
                <h3 className="font-bold text-sm">Notifications</h3>
                {unread > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-600">
                    {unread} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unread > 0 && (
                  <button onClick={markAllRead}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
                    style={{ background: 'rgba(16,185,129,.1)', color: '#059669' }}>
                    <CheckCheck size={12} /> All read
                  </button>
                )}
                <button onClick={() => setOpen(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:opacity-70 transition-opacity"
                  style={{ background: 'var(--color-bg)' }}>
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="space-y-3 p-4">
                  {[1,2,3].map(i => <div key={i} className="shimmer h-16 rounded-xl" />)}
                </div>
              ) : notifs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 gap-3"
                  style={{ color: 'var(--color-muted)' }}>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ background: 'var(--color-bg)' }}>
                    <Bell size={20} className="opacity-30" />
                  </div>
                  <p className="text-sm font-medium">No notifications</p>
                  <p className="text-xs opacity-60">You're all caught up!</p>
                </div>
              ) : (
                <div>
                  {notifs.map((n, i) => (
                    <div key={n._id}
                      onClick={() => !n.read && markOne(n._id)}
                      className={`flex gap-3 px-4 py-3.5 border-b cursor-pointer transition-colors hover:opacity-90 ${!n.read ? 'cursor-pointer' : ''}`}
                      style={{
                        borderColor: 'var(--color-border)',
                        background: n.read ? 'transparent' : 'rgba(16,185,129,.04)',
                        opacity: n.read ? 0.65 : 1,
                      }}>
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${TYPE_BG[n.type] || 'bg-slate-100'}`}>
                        {TYPE_ICON[n.type] || <Bell size={13} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-bold leading-tight">{n.title}</p>
                          {!n.read && (
                            <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--color-muted)' }}>
                          {n.message}
                        </p>
                        <p className="text-[10px] mt-1" style={{ color: 'var(--color-muted)' }}>
                          {fmtDateTime(n.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
