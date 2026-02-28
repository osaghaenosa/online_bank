'use client'
import { useStore } from '@/store'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import clsx from 'clsx'

const ICONS = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
}

const COLORS = {
  success: 'border-l-emerald-500',
  error: 'border-l-red-500',
  warning: 'border-l-amber-500',
  info: 'border-l-blue-500',
}

const ICON_COLORS = {
  success: 'text-emerald-500',
  error: 'text-red-500',
  warning: 'text-amber-500',
  info: 'text-blue-500',
}

export function ToastContainer() {
  const { state, dispatch } = useStore()

  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
      {state.toasts.map(t => {
        const Icon = ICONS[t.type]
        return (
          <div
            key={t.id}
            className={clsx(
              'toast-animate pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border-l-4 min-w-[280px] max-w-sm',
              COLORS[t.type]
            )}
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          >
            <Icon size={16} className={clsx('flex-shrink-0', ICON_COLORS[t.type])} />
            <span className="flex-1 text-sm font-medium">{t.msg}</span>
            <button
              className="opacity-50 hover:opacity-100 transition-opacity"
              onClick={() => dispatch({ type: 'REMOVE_TOAST', id: t.id })}
            >
              <X size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
