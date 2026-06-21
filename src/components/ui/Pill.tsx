// src/components/ui/Pill.tsx
import { cn } from '@/lib/utils'

interface PillProps {
  children: React.ReactNode
  variant?: 'active' | 'info' | 'warning' | 'error' | 'neutral' | 'success'
  dot?: boolean
  className?: string
}

const variants: Record<string, { bg: string; fg: string; dotColor: string }> = {
  active:   { bg: 'var(--c-success-bg)', fg: 'var(--c-success-fg)', dotColor: 'var(--c-success)' },
  info:     { bg: 'var(--c-info-bg)', fg: 'var(--c-info-fg)', dotColor: 'var(--c-info)' },
  warning:  { bg: 'var(--c-warning-bg)', fg: 'var(--c-warning-fg)', dotColor: 'var(--c-warning)' },
  error:    { bg: 'var(--c-destructive-bg)', fg: 'var(--c-destructive-fg)', dotColor: 'var(--c-destructive)' },
  neutral:  { bg: 'var(--c-muted)', fg: 'var(--c-muted-fg)', dotColor: 'var(--c-muted-fg)' },
  success:  { bg: 'var(--c-success-bg)', fg: 'var(--c-success-fg)', dotColor: 'var(--c-success)' },
}

export function Pill({ children, variant = 'neutral', dot = true, className }: PillProps) {
  const v = variants[variant]
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold', className)}
      style={{ background: v.bg, color: v.fg }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: v.dotColor, flexShrink: 0, display: 'inline-block' }} />}
      {children}
    </span>
  )
}
