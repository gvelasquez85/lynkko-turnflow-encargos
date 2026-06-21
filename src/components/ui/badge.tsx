// src/components/ui/Badge.tsx
import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'destructive' | 'muted'
  className?: string
}

const variants: Record<string, { bg: string; fg: string; border?: string }> = {
  default:    { bg: 'var(--c-primary)', fg: '#fff' },
  secondary:  { bg: 'var(--secondary)', fg: '#fff' },
  outline:    { bg: 'transparent', fg: 'var(--c-fg)', border: 'var(--c-border)' },
  success:    { bg: 'var(--c-success-bg)', fg: 'var(--c-success-fg)' },
  warning:    { bg: 'var(--c-warning-bg)', fg: 'var(--c-warning-fg)' },
  destructive:{ bg: 'var(--c-destructive-bg)', fg: 'var(--c-destructive-fg)' },
  muted:      { bg: 'var(--c-muted)', fg: 'var(--c-muted-fg)' },
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  const v = variants[variant]
  return (
    <span className={cn('inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold', className)}
      style={{ background: v.bg, color: v.fg, border: v.border ? `1px solid ${v.border}` : 'none' }}>
      {children}
    </span>
  )
}
