// src/components/ui/Pagination.tsx
import { cn } from '@/lib/utils'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

export function Pagination({ currentPage, totalPages, onPageChange, className }: PaginationProps) {
  const pages: (number | '...')[] = []
  
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (currentPage > 3) pages.push('...')
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i)
    if (currentPage < totalPages - 2) pages.push('...')
    pages.push(totalPages)
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <span style={{ fontSize: 12, color: 'var(--c-muted-fg)', marginRight: 'auto' }}>
        Página {currentPage} de {totalPages}
      </span>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        style={{
          minWidth: 34, height: 34, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: 'var(--radius)', border: '1px solid var(--c-border)',
          background: 'var(--c-surface)', fontSize: 13, color: 'var(--c-muted-fg)',
          cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.4 : 1,
        }}
      >
        ←
      </button>
      {pages.map((page, i) =>
        page === '...' ? (
          <span key={`dots-${i}`} style={{ padding: '0 4px', color: 'var(--c-muted-fg)', fontSize: 13 }}>…</span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            style={{
              minWidth: 34, height: 34, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 'var(--radius)', border: '1px solid var(--c-border)',
              background: currentPage === page ? 'var(--c-primary)' : 'var(--c-surface)',
              color: currentPage === page ? '#fff' : 'var(--c-muted-fg)',
              fontWeight: currentPage === page ? 700 : 400,
              fontSize: 13, cursor: 'pointer',
            }}
          >
            {page}
          </button>
        )
      )}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        style={{
          minWidth: 34, height: 34, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: 'var(--radius)', border: '1px solid var(--c-border)',
          background: 'var(--c-surface)', fontSize: 13, color: 'var(--c-muted-fg)',
          cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.4 : 1,
        }}
      >
        →
      </button>
    </div>
  )
}
