import clsx from 'clsx'
import { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes } from 'react'

// ── Card ──────────────────────────────────────────────────────────────────────
export function Card({ children, className, style }: { children: ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={clsx(
        'rounded-2xl border border-slate-200/80 shadow-card transition-shadow',
        className
      )}
      style={{
        background: 'var(--color-surface)',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

// ── Button ────────────────────────────────────────────────────────────────────
interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  children: ReactNode
  loading?: boolean
}
export function Button({ variant = 'primary', size = 'md', children, className, loading, disabled, style, ...p }: BtnProps) {
  const sizes = {
    xs: 'px-3 py-1.5 text-xs gap-1.5',
    sm: 'px-4 py-2 text-xs gap-1.5',
    md: 'px-5 py-2.5 text-sm gap-2',
    lg: 'px-6 py-3.5 text-sm gap-2',
  }
  const vars: Record<string, React.CSSProperties> = {
    primary: {
      background: 'linear-gradient(135deg, #0052CC 0%, #003D99 100%)',
      color: '#FFFFFF',
      boxShadow: '0 6px 18px rgba(0, 82, 204, 0.24)',
    },
    secondary: {
      background: '#F1F5FB',
      border: '1px solid #DCE5F2',
      color: '#002B5B',
    },
    danger: {
      background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
      color: '#FFFFFF',
      boxShadow: '0 6px 16px rgba(220, 38, 38, 0.22)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--color-muted)',
    },
    outline: {
      background: '#FFFFFF',
      border: '1.5px solid #0052CC',
      color: '#0052CC',
    },
  }
  return (
    <button
      disabled={disabled || loading}
      {...p}
      className={clsx(
        'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-150 cursor-pointer font-sans disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-95 active:scale-[0.98]',
        sizes[size],
        className
      )}
      style={{ ...vars[variant], ...style }}
    >
      {loading ? <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" /> : children}
    </button>
  )
}

// ── Badge ─────────────────────────────────────────────────────────────────────
const BADGE_STYLES = {
  green:  'bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]/80',
  yellow: 'bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]/90',
  red:    'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]/80',
  blue:   'bg-[#EBF2FF] text-[#0052CC] border border-[#BFDBFE]/80',
  gray:   'bg-slate-100 text-slate-600 border border-slate-200/80',
  purple: 'bg-indigo-50 text-indigo-700 border border-indigo-200/80',
}

const DOT_COLORS: Record<keyof typeof BADGE_STYLES, string> = {
  green:  '#10B981',
  yellow: '#F59E0B',
  red:    '#EF4444',
  blue:   '#0052CC',
  gray:   '#64748B',
  purple: '#6366F1',
}

export function Badge({ children, variant, className }: { children: ReactNode; variant: keyof typeof BADGE_STYLES; className?: string }) {
  return (
    <span className={clsx('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold', BADGE_STYLES[variant], className)}>
      {children}
    </span>
  )
}

// ── StatusBadge ───────────────────────────────────────────────────────────────
export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, keyof typeof BADGE_STYLES> = {
    completed: 'green', pending: 'yellow', failed: 'red', processing: 'blue',
    cancelled: 'gray',  active: 'green',   suspended: 'red', Verified: 'green',
    Pending: 'yellow',  Rejected: 'red',
  }
  const variant = map[status] ?? 'gray'
  return (
    <Badge variant={variant} className="capitalize">
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: DOT_COLORS[variant] }} />
      <span>{status}</span>
    </Badge>
  )
}

// ── Input ─────────────────────────────────────────────────────────────────────
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string; prefix?: string; suffix?: string; hint?: string; error?: string
}
export function Input({ label, prefix, suffix, hint, error, className, ...p }: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-xs font-semibold text-slate-700">{label}</label>}
      <div className="relative">
        {prefix && <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">{prefix}</span>}
        <input
          {...p}
          className={clsx(
            'w-full rounded-xl border text-sm font-sans outline-none transition-all px-3.5 py-2.5 bg-[#F8FAFC] focus:bg-white',
            prefix && 'pl-8',
            suffix && 'pr-10',
            error && 'border-red-400 bg-red-50/30',
            className
          )}
          style={{
            borderColor: error ? '#EF4444' : '#DDE5F0',
            color: 'var(--color-text)',
          }}
          onFocus={e => {
            if (!error) {
              e.target.style.borderColor = '#0052CC'
              e.target.style.boxShadow = '0 0 0 4px rgba(0, 82, 204, 0.10)'
            }
          }}
          onBlur={e => {
            if (!error) {
              e.target.style.borderColor = '#DDE5F0'
              e.target.style.boxShadow = 'none'
            }
          }}
        />
        {suffix && <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">{suffix}</span>}
      </div>
      {hint  && <p className="text-xs text-slate-500">{hint}</p>}
      {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
    </div>
  )
}

// ── Select ────────────────────────────────────────────────────────────────────
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> { label?: string; children: ReactNode }
export function Select({ label, children, className, ...p }: SelectProps) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-xs font-semibold text-slate-700">{label}</label>}
      <select
        {...p}
        className={clsx('w-full rounded-xl border text-sm font-sans outline-none px-3.5 py-2.5 bg-[#F8FAFC] focus:bg-white transition-all', className)}
        style={{ borderColor: '#DDE5F0', color: 'var(--color-text)' }}
      >
        {children}
      </select>
    </div>
  )
}

// ── Divider ───────────────────────────────────────────────────────────────────
export function Divider({ className }: { className?: string }) {
  return <div className={clsx('h-px bg-slate-200/75', className)} />
}

// ── SectionHeader ─────────────────────────────────────────────────────────────
export function SectionHeader({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2.5 mb-4 sm:mb-5">
      <div className="min-w-0 flex-1">
        <h3 className="font-display font-bold text-base sm:text-lg leading-snug" style={{ color: '#002B5B' }}>{title}</h3>
        {sub && <p className="text-xs mt-0.5 text-slate-500">{sub}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
}

// ── Toggle ────────────────────────────────────────────────────────────────────
export function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className="relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-200 cursor-pointer"
      style={{
        background: checked ? '#0052CC' : '#CBD5E1',
      }}
    >
      <span
        className="inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200"
        style={{ transform: checked ? 'translateX(1.4rem)' : 'translateX(0.25rem)' }}
      />
    </button>
  )
}

// ── StatCard ──────────────────────────────────────────────────────────────────
export function StatCard({ label, value, sub, icon, iconBg, trend }: {
  label: string; value: string; sub?: string; icon?: ReactNode; iconBg?: string; trend?: 'up' | 'down'
}) {
  return (
    <Card className="p-4 sm:p-5 stat-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-slate-500 leading-tight truncate">{label}</p>
          <p className="text-lg sm:text-2xl font-bold font-mono tracking-tight truncate mt-1.5" style={{ color: '#002B5B' }}>
            {value}
          </p>
          {sub && (
            <p className="text-[11px] sm:text-xs mt-1 font-medium text-slate-400 truncate flex items-center gap-1">
              {trend === 'up' && <span className="text-[#059669] font-semibold">↑</span>}
              {trend === 'down' && <span className="text-red-500 font-semibold">↓</span>}
              <span>{sub}</span>
            </p>
          )}
        </div>
        {icon && (
          <div className={clsx('w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center flex-shrink-0', iconBg || 'bg-[#EBF2FF]')}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  )
}

// ── Empty ─────────────────────────────────────────────────────────────────────
export function Empty({ icon, message, sub }: { icon: ReactNode; message: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 px-4 gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 text-center">
      <div className="w-14 h-14 rounded-full bg-[#EBF2FF] flex items-center justify-center text-[#0052CC] opacity-80">
        {icon}
      </div>
      <p className="text-sm font-semibold text-[#002B5B]">{message}</p>
      {sub && <p className="text-xs text-slate-500 max-w-xs">{sub}</p>}
    </div>
  )
}

// ── SuccessScreen ─────────────────────────────────────────────────────────────
export function SuccessScreen({ title, subtitle, extra, onAgain, againLabel = 'Do another', receiptUrl, txId }: {
  title: string; subtitle: string; extra?: ReactNode; onAgain: () => void; againLabel?: string; receiptUrl?: string; txId?: string
}) {
  return (
    <div className="max-w-md mx-auto fade-up">
      <Card className="p-6 sm:p-8 text-center rounded-3xl shadow-float">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 shadow-brand"
          style={{ background: 'linear-gradient(135deg, #0052CC 0%, #003D99 100%)' }}
        >
          <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
            <polyline points="9,21 17,29 31,13" stroke="#FFFFFF" strokeWidth="3.5"
              strokeLinecap="round" strokeLinejoin="round" className="check-draw" />
          </svg>
        </div>
        <h2 className="text-xl font-bold font-display mb-1.5" style={{ color: '#002B5B' }}>{title}</h2>
        <p className="text-sm text-slate-500 mb-6">{subtitle}</p>
        {extra && <div className="mb-6">{extra}</div>}
        <div className="flex gap-3">
          {receiptUrl && txId && (
            <a
              href={receiptUrl}
              target="_blank"
              rel="noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-[#F4F7FC] hover:bg-[#EBF2FF] text-xs font-semibold transition-colors"
              style={{ color: '#002B5B' }}
            >
              View Receipt
            </a>
          )}
          <Button variant="primary" className={receiptUrl ? 'flex-1' : 'w-full'} onClick={onAgain}>{againLabel}</Button>
        </div>
      </Card>
    </div>
  )
}

// ── ConfirmModal ──────────────────────────────────────────────────────────────
export function ConfirmModal({ title, message, confirmLabel = 'Confirm', variant = 'danger', onConfirm, onCancel }: {
  title: string; message: string; confirmLabel?: string; variant?: 'danger' | 'primary'; onConfirm: () => void; onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#00142B]/50 backdrop-blur-sm">
      <Card className="p-6 max-w-sm w-full fade-up rounded-3xl shadow-float">
        <h3 className="font-display font-bold text-lg mb-2" style={{ color: '#002B5B' }}>{title}</h3>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">{message}</p>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onCancel}>Cancel</Button>
          <Button variant={variant} className="flex-1" onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </Card>
    </div>
  )
}
