import clsx from 'clsx'
import { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes } from 'react'

// ── Card ──────────────────────────────────────────────────────────────────────
export function Card({ children, className, style }: { children: ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={clsx('rounded-2xl border', className)}
      style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', ...style }}>
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
  const sizes = { xs: 'px-2.5 py-1 text-xs gap-1', sm: 'px-3 py-1.5 text-xs gap-1.5', md: 'px-4 py-2.5 text-sm gap-2', lg: 'px-6 py-3.5 text-sm gap-2' }
  const vars: Record<string, React.CSSProperties> = {
    primary:   { background: 'var(--color-accent)',   color: '#fff' },
    secondary: { background: 'var(--color-bg)',       border: '1.5px solid var(--color-border)', color: 'var(--color-text)' },
    danger:    { background: '#EF4444',               color: '#fff' },
    ghost:     { background: 'transparent',           color: 'var(--color-muted)' },
    outline:   { background: 'transparent',           border: '1.5px solid var(--color-accent)', color: 'var(--color-accent)' },
  }
  return (
    <button disabled={disabled || loading} {...p}
      className={clsx('inline-flex items-center justify-center font-semibold rounded-xl transition-all cursor-pointer font-sans disabled:opacity-50 disabled:cursor-not-allowed', sizes[size], className)}
      style={{ ...vars[variant], ...style }}>
      {loading ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : children}
    </button>
  )
}

// ── Badge ─────────────────────────────────────────────────────────────────────
const BADGE_STYLES = {
  green: 'bg-emerald-100 text-emerald-700', yellow: 'bg-amber-100 text-amber-700',
  red:   'bg-red-100 text-red-700',         blue:   'bg-blue-100 text-blue-700',
  gray:  'bg-slate-100 text-slate-600',     purple: 'bg-violet-100 text-violet-700',
}
export function Badge({ children, variant, className }: { children: ReactNode; variant: keyof typeof BADGE_STYLES; className?: string }) {
  return <span className={clsx('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold', BADGE_STYLES[variant], className)}>{children}</span>
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
      {label && <label className="block text-sm font-semibold">{label}</label>}
      <div className="relative">
        {prefix && <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: 'var(--color-muted)' }}>{prefix}</span>}
        <input {...p} className={clsx(
          'w-full rounded-xl border text-sm font-sans outline-none transition-all px-3.5 py-2.5',
          prefix && 'pl-7', suffix && 'pr-10', error && 'border-red-400', className
        )} style={{ background: 'var(--color-surface)', borderColor: error ? '#F87171' : 'var(--color-border)', color: 'var(--color-text)' }}
          onFocus={e => { if (!error) e.target.style.borderColor = 'var(--color-accent)' }}
          onBlur={e => { if (!error) e.target.style.borderColor = 'var(--color-border)' }} />
        {suffix && <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold" style={{ color: 'var(--color-muted)' }}>{suffix}</span>}
      </div>
      {hint  && <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{hint}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

// ── Select ────────────────────────────────────────────────────────────────────
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> { label?: string; children: ReactNode }
export function Select({ label, children, className, ...p }: SelectProps) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-semibold">{label}</label>}
      <select {...p} className={clsx('w-full rounded-xl border text-sm font-sans outline-none px-3.5 py-2.5', className)}
        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
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
    <div className="flex items-start justify-between mb-5">
      <div>
        <h3 className="font-bold text-base">{title}</h3>
        {sub && <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>{sub}</p>}
      </div>
      {action}
    </div>
  )
}

// ── Toggle ────────────────────────────────────────────────────────────────────
export function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} className="relative inline-flex h-6 w-11 items-center rounded-full transition-all"
      style={{ background: checked ? 'var(--color-accent)' : 'var(--color-border)' }}>
      <span className="inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200"
        style={{ transform: checked ? 'translateX(1.5rem)' : 'translateX(0.25rem)' }} />
    </button>
  )
}

// ── StatCard ──────────────────────────────────────────────────────────────────
export function StatCard({ label, value, sub, icon, iconBg, trend }: {
  label: string; value: string; sub?: string; icon?: ReactNode; iconBg?: string; trend?: 'up' | 'down'
}) {
  return (
    <Card className="p-5 stat-card">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>{label}</p>
        {icon && <div className={clsx('w-9 h-9 rounded-xl flex items-center justify-center', iconBg)}>{icon}</div>}
      </div>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
      {sub && <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>{sub}</p>}
    </Card>
  )
}

// ── Empty ─────────────────────────────────────────────────────────────────────
export function Empty({ icon, message, sub }: { icon: ReactNode; message: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 gap-3" style={{ color: 'var(--color-muted)' }}>
      <div className="opacity-20">{icon}</div>
      <p className="text-sm font-semibold">{message}</p>
      {sub && <p className="text-xs opacity-70">{sub}</p>}
    </div>
  )
}

// ── SuccessScreen ─────────────────────────────────────────────────────────────
export function SuccessScreen({ title, subtitle, extra, onAgain, againLabel = 'Do another', receiptUrl, txId }: {
  title: string; subtitle: string; extra?: ReactNode; onAgain: () => void; againLabel?: string; receiptUrl?: string; txId?: string
}) {
  return (
    <div className="max-w-md mx-auto fade-up">
      <Card className="p-8 text-center">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 bg-emerald-50">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <polyline points="8,21 16,29 32,13" stroke="#10B981" strokeWidth="3"
              strokeLinecap="round" strokeLinejoin="round" className="check-draw" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-2">{title}</h2>
        <p className="text-sm mb-6" style={{ color: 'var(--color-muted)' }}>{subtitle}</p>
        {extra && <div className="mb-6">{extra}</div>}
        <div className="flex gap-3">
          {receiptUrl && txId && (
            <a href={receiptUrl} target="_blank" rel="noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}>
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
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50">
      <Card className="p-6 max-w-sm w-full fade-up">
        <h3 className="font-bold text-lg mb-2">{title}</h3>
        <p className="text-sm mb-6" style={{ color: 'var(--color-muted)' }}>{message}</p>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onCancel}>Cancel</Button>
          <Button variant={variant} className="flex-1" onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </Card>
    </div>
  )
}
