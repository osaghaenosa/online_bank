import clsx from 'clsx'
import { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes } from 'react'

// ── Card ──────────────────────────────────────────────────────────────────────
export function Card({ children, className, style }: { children: ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={clsx('rounded-none border border-t-2', className)}
      style={{
        background: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
        borderTopColor: '#0052CC',
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
    xs: 'px-2.5 py-1 text-xs gap-1',
    sm: 'px-3.5 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2.5 text-sm gap-2',
    lg: 'px-6 py-3.5 text-sm gap-2',
  }
  const vars: Record<string, React.CSSProperties> = {
    primary:   { background: '#0052CC', color: '#FFFFFF', border: '1px solid #003D99' },
    secondary: { background: '#F2F5F9', border: '1px solid #CBD5E1', color: '#002B5B' },
    danger:    { background: '#DC2626', color: '#FFFFFF', border: '1px solid #B91C1C' },
    ghost:     { background: 'transparent', color: 'var(--color-muted)' },
    outline:   { background: 'transparent', border: '1.5px solid #0052CC', color: '#0052CC' },
  }
  return (
    <button
      disabled={disabled || loading}
      {...p}
      className={clsx(
        'inline-flex items-center justify-center font-bold uppercase tracking-wider rounded-none transition-colors cursor-pointer font-sans disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-95',
        sizes[size],
        className
      )}
      style={{ ...vars[variant], ...style }}
    >
      {loading ? <span className="w-4 h-4 border-2 border-white/40 border-t-white animate-spin" /> : children}
    </button>
  )
}

// ── Badge ─────────────────────────────────────────────────────────────────────
const BADGE_STYLES = {
  green:  'bg-blue-50 text-[#0052CC] border border-blue-200',
  yellow: 'bg-amber-50 text-amber-800 border border-amber-300',
  red:    'bg-red-50 text-red-700 border border-red-200',
  blue:   'bg-[#EBF2FF] text-[#002B5B] border border-blue-300',
  gray:   'bg-slate-100 text-slate-700 border border-slate-300',
  purple: 'bg-indigo-50 text-indigo-800 border border-indigo-200',
}
export function Badge({ children, variant, className }: { children: ReactNode; variant: keyof typeof BADGE_STYLES; className?: string }) {
  return (
    <span className={clsx('inline-flex items-center px-2.5 py-0.5 rounded-none text-[11px] font-bold uppercase tracking-wider', BADGE_STYLES[variant], className)}>
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
  return <Badge variant={map[status] ?? 'gray'}>{status}</Badge>
}

// ── Input ─────────────────────────────────────────────────────────────────────
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string; prefix?: string; suffix?: string; hint?: string; error?: string
}
export function Input({ label, prefix, suffix, hint, error, className, ...p }: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-xs font-bold uppercase tracking-wider" style={{ color: '#002B5B' }}>{label}</label>}
      <div className="relative">
        {prefix && <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: 'var(--color-muted)' }}>{prefix}</span>}
        <input
          {...p}
          className={clsx(
            'w-full rounded-none border text-sm font-sans outline-none transition-colors px-3.5 py-2.5',
            prefix && 'pl-7',
            suffix && 'pr-10',
            error && 'border-red-500',
            className
          )}
          style={{
            background: 'var(--color-surface)',
            borderColor: error ? '#DC2626' : 'var(--color-border)',
            color: 'var(--color-text)',
          }}
          onFocus={e => { if (!error) e.target.style.borderColor = '#0052CC' }}
          onBlur={e => { if (!error) e.target.style.borderColor = 'var(--color-border)' }}
        />
        {suffix && <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold" style={{ color: 'var(--color-muted)' }}>{suffix}</span>}
      </div>
      {hint  && <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{hint}</p>}
      {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
    </div>
  )
}

// ── Select ────────────────────────────────────────────────────────────────────
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> { label?: string; children: ReactNode }
export function Select({ label, children, className, ...p }: SelectProps) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-xs font-bold uppercase tracking-wider" style={{ color: '#002B5B' }}>{label}</label>}
      <select
        {...p}
        className={clsx('w-full rounded-none border text-sm font-sans outline-none px-3.5 py-2.5', className)}
        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
      >
        {children}
      </select>
    </div>
  )
}

// ── Divider ───────────────────────────────────────────────────────────────────
export function Divider({ className }: { className?: string }) {
  return <div className={clsx('h-px', className)} style={{ background: 'var(--color-border)' }} />
}

// ── SectionHeader ─────────────────────────────────────────────────────────────
export function SectionHeader({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2.5 mb-4 sm:mb-5 pb-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-4 flex-shrink-0" style={{ background: '#0052CC' }} />
          <h3 className="font-bold text-xs sm:text-sm uppercase tracking-wider leading-snug" style={{ color: '#002B5B' }}>{title}</h3>
        </div>
        {sub && <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>{sub}</p>}
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
      className="relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-none border transition-all"
      style={{
        background: checked ? '#0052CC' : '#E2E8F0',
        borderColor: checked ? '#003D99' : '#CBD5E1',
      }}
    >
      <span
        className="inline-block h-4 w-4 rounded-none bg-white shadow transition-transform duration-150"
        style={{ transform: checked ? 'translateX(1.35rem)' : 'translateX(0.2rem)' }}
      />
    </button>
  )
}

// ── StatCard ──────────────────────────────────────────────────────────────────
export function StatCard({ label, value, sub, icon, iconBg, trend }: {
  label: string; value: string; sub?: string; icon?: ReactNode; iconBg?: string; trend?: 'up' | 'down'
}) {
  return (
    <Card className="p-3.5 sm:p-5 stat-card">
      <div className="flex items-start justify-between gap-2 mb-1.5 sm:mb-2">
        <p className="text-[11px] font-bold uppercase tracking-wider leading-tight" style={{ color: 'var(--color-muted)' }}>{label}</p>
        {icon && (
          <div className={clsx('w-7 h-7 sm:w-8 sm:h-8 rounded-none flex items-center justify-center border flex-shrink-0', iconBg)} style={{ borderColor: '#CBD5E1' }}>
            {icon}
          </div>
        )}
      </div>
      <p className="text-lg sm:text-2xl font-bold font-mono tracking-tight truncate" style={{ color: '#002B5B' }}>{value}</p>
      {sub && <p className="text-[11px] sm:text-xs mt-1 font-medium truncate" style={{ color: 'var(--color-muted)' }}>{sub}</p>}
    </Card>
  )
}

// ── Empty ─────────────────────────────────────────────────────────────────────
export function Empty({ icon, message, sub }: { icon: ReactNode; message: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 gap-3 border border-dashed" style={{ color: 'var(--color-muted)', borderColor: 'var(--color-border)' }}>
      <div className="opacity-30">{icon}</div>
      <p className="text-sm font-bold uppercase tracking-wider">{message}</p>
      {sub && <p className="text-xs opacity-80">{sub}</p>}
    </div>
  )
}

// ── SuccessScreen ─────────────────────────────────────────────────────────────
export function SuccessScreen({ title, subtitle, extra, onAgain, againLabel = 'Do another', receiptUrl, txId }: {
  title: string; subtitle: string; extra?: ReactNode; onAgain: () => void; againLabel?: string; receiptUrl?: string; txId?: string
}) {
  return (
    <div className="max-w-md mx-auto fade-up">
      <Card className="p-6 sm:p-8 text-center">
        <div className="w-16 h-16 rounded-none flex items-center justify-center mx-auto mb-5 border-2" style={{ background: '#EBF2FF', borderColor: '#0052CC' }}>
          <svg width="36" height="36" viewBox="0 0 40 40" fill="none">
            <polyline points="8,21 16,29 32,13" stroke="#0052CC" strokeWidth="3.5"
              strokeLinecap="square" strokeLinejoin="miter" className="check-draw" />
          </svg>
        </div>
        <h2 className="text-xl font-bold uppercase tracking-wider mb-2" style={{ color: '#002B5B' }}>{title}</h2>
        <p className="text-sm mb-6" style={{ color: 'var(--color-muted)' }}>{subtitle}</p>
        {extra && <div className="mb-6">{extra}</div>}
        <div className="flex gap-3">
          {receiptUrl && txId && (
            <a
              href={receiptUrl}
              target="_blank"
              rel="noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-none border text-xs font-bold uppercase tracking-wider transition-colors"
              style={{ borderColor: '#002B5B', background: '#FFFFFF', color: '#002B5B' }}
            >
              📄 Receipt
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
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60">
      <Card className="p-6 max-w-sm w-full fade-up">
        <h3 className="font-bold text-base uppercase tracking-wider mb-2" style={{ color: '#002B5B' }}>{title}</h3>
        <p className="text-sm mb-6" style={{ color: 'var(--color-muted)' }}>{message}</p>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onCancel}>Cancel</Button>
          <Button variant={variant} className="flex-1" onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </Card>
    </div>
  )
}
