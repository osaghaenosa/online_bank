'use client'
import { useAuth } from '@/store/auth'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import clsx from 'clsx'

const CFG = {
  success: { icon: CheckCircle, border: 'border-l-emerald-500', icon_cls: 'text-emerald-500' },
  error:   { icon: XCircle,     border: 'border-l-red-500',     icon_cls: 'text-red-500' },
  warning: { icon: AlertTriangle,border:'border-l-amber-500',   icon_cls: 'text-amber-500' },
  info:    { icon: Info,         border: 'border-l-blue-500',    icon_cls: 'text-blue-500' },
}

export function ToastContainer() {
  const { toasts } = useAuth()
  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => {
        const { icon: Icon, border, icon_cls } = CFG[t.type]
        return (
          <div key={t.id} className={clsx(
            'toast-in pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border-l-4 min-w-[300px] max-w-sm',
            border
          )}
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <Icon size={16} className={clsx('flex-shrink-0', icon_cls)} />
            <span className="flex-1 text-sm font-medium">{t.msg}</span>
          </div>
        )
      })}
    </div>
  )
}
