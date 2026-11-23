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
  transaction: <DollarSign size={14} style={{ color: '#0052CC' }} />,
  security:    <Shield     size={14} className="text-red-600" />,
  system:      <Info       size={14} style={{ color: '#002B5B' }} />,
  alert:       <AlertCircle size={14} className="text-amber-600" />,
}
const TYPE_BG: Record<string, string> = {
  transaction: 'bg-[#EBF2FF]',
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
        className="relative w-10 h-10 rounded-full flex items-center justify-center border transition-all hover:shadow-sm cursor-pointer"
        style={{
          borderColor: open ? '#0052CC' : '#E2E8F0',
          background: open ? '#0052CC' : '#FFFFFF',
        }}
        aria-label="Notifications"
      >
        <Bell size={17} style={{ color: open ? '#FFFFFF' : '#002B5B' }} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full flex items-center justify-center bg-red-500 text-white text-[10px] font-bold px-1 leading-none ring-2 ring-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-[90] bg-[#00142B]/40 backdrop-blur-sm sm:hidden" onClick={() => setOpen(false)} />

          <div
            className="fixed sm:absolute z-[100] left-0 right-0 bottom-0 sm:bottom-auto sm:left-auto sm:right-0 sm:top-[calc(100%+10px)] w-full sm:w-[376px] max-h-[75vh] sm:max-h-[480px] flex flex-col overflow-hidden shadow-float rounded-t-3xl sm:rounded-3xl border border-slate-200/80 bg-white slide-up"
          >
            {/* Mobile Drag Handle */}
            <div className="sm:hidden flex justify-center pt-2.5 pb-1 bg-[#002B5B]">
              <div className="w-10 h-1 rounded-full bg-white/30" />
            </div>

            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-3.5 flex-shrink-0 brand-card-gradient text-white"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
                  <Bell size={15} className="text-blue-200" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm text-white leading-tight">Notifications</h3>
                  <p className="text-[11px] text-blue-200">
                    {unread > 0 ? `${unread} unread alert${unread > 1 ? 's' : ''}` : 'All caught up'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {unread > 0 && (
                  <button
                    onClick={markAllRead}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-semibold text-white bg-white/15 hover:bg-white/25 transition-colors"
                  >
                    <CheckCheck size={12} /> Mark read
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/15 transition-colors"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {loading ? (
                <div className="space-y-3 p-3">
                  {[1, 2, 3].map(i => <div key={i} className="shimmer h-16" />)}
                </div>
              ) : notifs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 gap-2.5 text-slate-400">
                  <div className="w-12 h-12 rounded-full bg-[#F4F7FC] flex items-center justify-center text-[#0052CC]">
                    <Bell size={20} />
                  </div>
                  <p className="text-xs font-semibold text-[#002B5B]">No active alerts</p>
                </div>
              ) : (
                notifs.map(n => (
                  <div
                    key={n._id}
                    onClick={() => !n.read && markOne(n._id)}
                    className="flex gap-3 p-3 rounded-2xl cursor-pointer transition-all hover:bg-[#F4F7FC]"
                    style={{
                      background: n.read ? 'transparent' : '#F4F8FF',
                      opacity: n.read ? 0.78 : 1,
                    }}
                  >
                    <div className={`w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 mt-0.5 ${TYPE_BG[n.type] || 'bg-slate-100'}`}>
                      {TYPE_ICON[n.type] || <Bell size={14} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-semibold leading-tight text-[#002B5B]">{n.title}</p>
                        <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
                          {!n.read && (
                            <span className="w-2 h-2 rounded-full bg-[#0052CC]" />
                          )}
                          <button
                            onClick={e => deleteNotif(e, n._id)}
                            className="text-slate-400 hover:text-red-500 transition-colors"
                            title="Delete notification"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs mt-1 leading-relaxed text-slate-500">
                        {n.message}
                      </p>
                      <p className="text-[10px] font-mono mt-1.5 text-slate-400">
                        {fmtDateTime(n.createdAt)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
