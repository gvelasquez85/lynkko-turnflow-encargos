// src/components/ui/Chip.tsx
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

interface ChipProps {
  children: React.ReactNode
  selected?: boolean
  onRemove?: () => void
  onClick?: () => void
  className?: string
}

export function Chip({ children, selected = false, onRemove, onClick, className }: ChipProps) {
  return (
    <span
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border-[1.5px] select-none',
        onClick && 'cursor-pointer',
        className,
      )}
      style={{
        borderColor: selected ? 'var(--c-primary)' : 'var(--c-border)',
        background: selected ? 'var(--c-primary-50)' : 'var(--c-surface)',
        color: selected ? 'var(--c-primary)' : 'var(--c-muted-fg)',
      }}
    >
      {children}
      {onRemove && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove() }}
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'inherit', opacity: 0.6, display: 'inline-flex', marginLeft: 2 }}
        >
          <X size={14} />
        </button>
      )}
    </span>
  )
}
