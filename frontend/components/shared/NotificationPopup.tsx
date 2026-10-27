'use client'
import { useEffect, useRef, useState } from 'react'
import { api, fmtDateTime } from '@/lib/api'
import { Bell, X, CheckCheck, AlertCircle, Info, DollarSign, Shield, Trash2 } from 'lucide-react'
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
  transaction: <DollarSign size={13} style={{ color: '#0052CC' }} />,
  security:    <Shield     size={13} className="text-red-600" />,
  system:      <Info       size={13} style={{ color: '#002B5B' }} />,
  alert:       <AlertCircle size={13} className="text-amber-600" />,
}
const TYPE_BG: Record<string, string> = {
  transaction: 'bg-blue-50',
  security:    'bg-red-50',
  system:      'bg-slate-100',
  alert:       'bg-amber-50',
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

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

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

  const deleteNotif = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    try {
      await api.user.deleteNotif(id)
      setNotifs(p => p.filter(n => n._id !== id))
      const newCount = notifs.filter(n => !n.read && n._id !== id).length
      onUnreadChange(newCount)
      toast('Notification deleted', 'success')
    } catch (err: any) {
      toast(err.message || 'Failed to delete notification', 'error')
    }
  }

  return (
    <div className="relative" ref={popupRef}>
      <button
        onClick={openPopup}
        className="relative w-9 h-9 flex items-center justify-center border transition-all hover:opacity-80"
        style={{
          borderColor: open ? '#002B5B' : '#CBD5E1',
          background: open ? '#002B5B' : '#F8FAFC',
        }}
        aria-label="Notifications"
      >
        <Bell size={16} style={{ color: open ? '#FFFFFF' : '#002B5B' }} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-red-600 text-white text-[10px] font-bold px-1 leading-none">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-[90] bg-black/30 sm:hidden" onClick={() => setOpen(false)} />

          <div
            className="fixed sm:absolute z-[100] left-0 right-0 bottom-0 sm:bottom-auto sm:left-auto sm:right-0 sm:top-[calc(100%+8px)] w-full sm:w-[360px] max-h-[70vh] sm:max-h-[480px] flex flex-col overflow-hidden shadow-2xl border-2"
            style={{ background: '#FFFFFF', borderColor: '#002B5B' }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0"
              style={{ background: '#002B5B', borderColor: '#0052CC', color: '#FFFFFF' }}
            >
              <div className="flex items-center gap-2">
                <Bell size={14} style={{ color: '#60A5FA' }} />
                <h3 className="font-bold text-xs uppercase tracking-wider text-white">Ledger Alerts</h3>
                {unread > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-mono font-bold" style={{ background: '#0052CC', color: '#FFFFFF' }}>
                    {unread} NEW
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                {unread > 0 && (
                  <button
                    onClick={markAllRead}
                    className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white border"
                    style={{ background: '#0052CC', borderColor: '#60A5FA' }}
                  >
                    <CheckCheck size={11} /> Mark Read
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="w-7 h-7 flex items-center justify-center text-white/80 hover:text-white"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="space-y-3 p-4">
                  {[1, 2, 3].map(i => <div key={i} className="shimmer h-16" />)}
                </div>
              ) : notifs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 gap-2" style={{ color: '#64748B' }}>
                  <Bell size={22} className="opacity-40" />
                  <p className="text-xs font-bold uppercase tracking-wider">No Active Alerts</p>
                </div>
              ) : (
                <div>
                  {notifs.map(n => (
                    <div
                      key={n._id}
                      onClick={() => !n.read && markOne(n._id)}
                      className="flex gap-3 px-4 py-3.5 border-b cursor-pointer transition-colors hover:bg-slate-50"
                      style={{
                        borderColor: '#E2E8F0',
                        background: n.read ? '#FFFFFF' : '#EBF2FF',
                        opacity: n.read ? 0.75 : 1,
                      }}
                    >
                      <div className={`w-8 h-8 flex items-center justify-center flex-shrink-0 mt-0.5 border border-slate-200 ${TYPE_BG[n.type] || 'bg-slate-100'}`}>
                        {TYPE_ICON[n.type] || <Bell size={13} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-bold leading-tight" style={{ color: '#002B5B' }}>{n.title}</p>
                          <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
                            {!n.read && (
                              <div className="w-2 h-2" style={{ background: '#0052CC' }} />
                            )}
                            <button
                              onClick={e => deleteNotif(e, n._id)}
                              className="text-red-500 hover:text-red-700 transition-colors"
                              title="Delete notification"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                        <p className="text-xs mt-0.5 leading-relaxed" style={{ color: '#475569' }}>
                          {n.message}
                        </p>
                        <p className="text-[10px] font-mono mt-1" style={{ color: '#64748B' }}>
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
