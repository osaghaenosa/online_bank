'use client'
import { useAuth } from '@/store/auth'
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react'
import clsx from 'clsx'

const CFG = {
  success: { icon: CheckCircle,   bg: 'bg-[#ECFDF5]', icon_cls: 'text-[#059669]', ring: 'border-[#A7F3D0]' },
  error:   { icon: XCircle,       bg: 'bg-red-50',      icon_cls: 'text-red-500',    ring: 'border-red-200' },
  warning: { icon: AlertTriangle, bg: 'bg-amber-50',    icon_cls: 'text-amber-500',  ring: 'border-amber-200' },
  info:    { icon: Info,          bg: 'bg-[#EBF2FF]',   icon_cls: 'text-[#0052CC]',  ring: 'border-blue-200' },
}

export function ToastContainer() {
  const { toasts } = useAuth()
  return (
    <div className="fixed top-5 right-4 sm:right-5 z-[9999] flex flex-col gap-2.5 pointer-events-none">
      {toasts.map(t => {
        const { icon: Icon, bg, icon_cls, ring } = CFG[t.type]
        return (
          <div
            key={t.id}
            className={clsx(
              'toast-in pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl shadow-float border min-w-[280px] max-w-sm bg-white/95 backdrop-blur-md',
              ring
            )}
          >
            <div className={clsx('w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0', bg)}>
              <Icon size={16} className={icon_cls} />
            </div>
            <span className="flex-1 text-sm font-medium text-slate-800">{t.msg}</span>
          </div>
        )
      })}
    </div>
  )
}
