import clsx from 'clsx'
import { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes } from 'react'

// ─── Card ─────────────────────────────────────────────────────────────────
interface CardProps { children: ReactNode; className?: string; style?: React.CSSProperties }
export function Card({ children, className, style }: CardProps) {
  return (
    <div
      className={clsx('rounded-2xl border', className)}
      style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', ...style }}
    >
      {children}
    </div>
  )
}

// ─── Button ───────────────────────────────────────────────────────────────
interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
  accentColor?: string
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  className,
  accentColor,
  style,
  ...props
}: BtnProps) {
  const sizes = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2.5 text-sm gap-2',
    lg: 'px-6 py-3 text-sm gap-2',
  }

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: { background: accentColor ?? 'var(--color-accent)', color: '#fff' },
    secondary: { background: 'var(--color-bg)', border: '1.5px solid var(--color-border)', color: 'var(--color-text)' },
    danger: { background: '#EF4444', color: '#fff' },
    ghost: { background: 'transparent', color: 'var(--color-muted)' },
  }

  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center font-semibold rounded-xl transition-all cursor-pointer font-sans disabled:opacity-50 disabled:cursor-not-allowed',
        sizes[size],
        className
      )}
      style={{ ...variantStyles[variant], ...style }}
      {...props}
    >
      {children}
    </button>
  )
}

// ─── Badge ────────────────────────────────────────────────────────────────
interface BadgeProps { children: ReactNode; variant: 'green' | 'yellow' | 'red' | 'blue' | 'gray'; className?: string }
export function Badge({ children, variant, className }: BadgeProps) {
  const styles = {
    green: 'bg-emerald-100 text-emerald-700',
    yellow: 'bg-amber-100 text-amber-700',
    red: 'bg-red-100 text-red-700',
    blue: 'bg-blue-100 text-blue-700',
    gray: 'bg-slate-100 text-slate-600',
  }
  return (
    <span className={clsx('inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold', styles[variant], className)}>
      {children}
    </span>
  )
}

// ─── StatusBadge ──────────────────────────────────────────────────────────
export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, BadgeProps['variant']> = {
    completed: 'green',
    pending: 'yellow',
    failed: 'red',
    active: 'green',
    suspended: 'red',
    Verified: 'green',
    Pending: 'yellow',
    Rejected: 'red',
  }
  return <Badge variant={map[status] ?? 'gray'}>{status}</Badge>
}

// ─── Input ────────────────────────────────────────────────────────────────
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  prefix?: string
  hint?: string
}
export function Input({ label, prefix, hint, className, ...props }: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-semibold">{label}</label>}
      <div className="relative">
        {prefix && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-sm" style={{ color: 'var(--color-muted)' }}>
            {prefix}
          </span>
        )}
        <input
          className={clsx(
            'w-full rounded-xl border text-sm font-sans outline-none transition-all',
            'px-3.5 py-2.5',
            prefix && 'pl-7',
            className
          )}
          style={{
            background: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-text)',
          }}
          onFocus={e => (e.target.style.borderColor = 'var(--color-accent)')}
          onBlur={e => (e.target.style.borderColor = 'var(--color-border)')}
          {...props}
        />
      </div>
      {hint && <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{hint}</p>}
    </div>
  )
}

// ─── Select ───────────────────────────────────────────────────────────────
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  children: ReactNode
}
export function Select({ label, children, className, ...props }: SelectProps) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-semibold">{label}</label>}
      <select
        className={clsx('w-full rounded-xl border text-sm font-sans outline-none px-3.5 py-2.5', className)}
        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
        {...props}
      >
        {children}
      </select>
    </div>
  )
}

// ─── Divider ──────────────────────────────────────────────────────────────
export function Divider({ className }: { className?: string }) {
  return <div className={clsx('h-px', className)} style={{ background: 'var(--color-border)' }} />
}

// ─── Section Header ───────────────────────────────────────────────────────
interface SectionHeaderProps { title: string; action?: ReactNode }
export function SectionHeader({ title, action }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-5">
      <h3 className="font-bold text-base">{title}</h3>
      {action}
    </div>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────
interface EmptyProps { icon: ReactNode; message: string }
export function Empty({ icon, message }: EmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3" style={{ color: 'var(--color-muted)' }}>
      <div className="opacity-30">{icon}</div>
      <p className="text-sm font-medium">{message}</p>
    </div>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────
interface StatCardProps { label: string; value: string; sub?: string; iconBg?: string; icon?: ReactNode }
export function StatCard({ label, value, sub, iconBg, icon }: StatCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
          {label}
        </p>
        {icon && (
          <div className={clsx('w-9 h-9 rounded-xl flex items-center justify-center', iconBg)}>
            {icon}
          </div>
        )}
      </div>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
      {sub && <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>{sub}</p>}
    </Card>
  )
}

// ─── Success Screen ───────────────────────────────────────────────────────
interface SuccessProps {
  title: string
  subtitle: string
  extra?: ReactNode
  onAgain: () => void
  againLabel?: string
}
export function SuccessScreen({ title, subtitle, extra, onAgain, againLabel = 'Do Another' }: SuccessProps) {
  return (
    <div className="max-w-md mx-auto">
      <Card className="p-8 text-center">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{ background: '#D1FAE5' }}
        >
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <polyline
              points="8,21 16,29 32,13"
              stroke="#10B981"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="check-animate"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-2">{title}</h2>
        <p className="text-sm mb-6" style={{ color: 'var(--color-muted)' }}>{subtitle}</p>
        {extra && <div className="mb-6">{extra}</div>}
        <Button variant="primary" className="w-full justify-center" onClick={onAgain}>
          {againLabel}
        </Button>
      </Card>
    </div>
  )
}

// ─── Toggle ───────────────────────────────────────────────────────────────
interface ToggleProps { checked: boolean; onChange: () => void; accentColor?: string }
export function Toggle({ checked, onChange, accentColor }: ToggleProps) {
  return (
    <button
      onClick={onChange}
      className="relative inline-flex h-6 w-11 items-center rounded-full transition-all"
      style={{ background: checked ? (accentColor ?? 'var(--color-accent)') : 'var(--color-border)' }}
    >
      <span
        className="inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200"
        style={{ transform: checked ? 'translateX(1.5rem)' : 'translateX(0.25rem)' }}
      />
    </button>
  )
}

// ─── Confirm Modal ────────────────────────────────────────────────────────
interface ConfirmModalProps {
  title: string
  message: string
  confirmLabel?: string
  variant?: 'danger' | 'primary'
  onConfirm: () => void
  onCancel: () => void
}
export function ConfirmModal({ title, message, confirmLabel = 'Confirm', variant = 'danger', onConfirm, onCancel }: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40">
      <Card className="p-6 max-w-sm w-full">
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
