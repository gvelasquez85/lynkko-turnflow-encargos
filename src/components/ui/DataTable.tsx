// src/components/ui/DataTable.tsx
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface Column<T> {
  key: string
  label: string
  sortable?: boolean
  render?: (row: T) => React.ReactNode
  className?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyExtractor: (row: T) => string
  onRowClick?: (row: T) => void
  emptyMessage?: string
  className?: string
}

export function DataTable<T>({ columns, data, keyExtractor, onRowClick, emptyMessage = 'Sin datos', className }: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  function handleSort(key: string) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sorted = sortKey ? [...data].sort((a, b) => {
    const aVal = (a as Record<string, unknown>)[sortKey]
    const bVal = (b as Record<string, unknown>)[sortKey]
    if (aVal == null && bVal == null) return 0
    if (aVal == null) return sortDir === 'asc' ? 1 : -1
    if (bVal == null) return sortDir === 'asc' ? -1 : 1
    if (typeof aVal === 'number' && typeof bVal === 'number') return sortDir === 'asc' ? aVal - bVal : bVal - aVal
    return sortDir === 'asc' ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal))
  }) : data

  if (data.length === 0) {
    return (
      <div style={{
        border: '1px solid var(--c-border)', borderRadius: 'var(--radius-lg)',
        padding: '48px 24px', textAlign: 'center',
      }}>
        <p style={{ fontWeight: 600, fontSize: 16, color: 'var(--c-fg)', margin: '0 0 4px' }}>{emptyMessage}</p>
        <p style={{ fontSize: 14, color: 'var(--c-muted-fg)', margin: 0 }}>No hay registros para mostrar</p>
      </div>
    )
  }

  return (
    <div style={{ border: '1px solid var(--c-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr style={{ background: 'var(--c-muted)', borderBottom: '2px solid var(--c-border)' }}>
            {columns.map(col => (
              <th
                key={col.key}
                onClick={() => col.sortable && handleSort(col.key)}
                style={{
                  padding: 'var(--space-2) var(--space-4)',
                  textAlign: 'left', fontWeight: 700, fontSize: 12,
                  color: 'var(--c-muted-fg)', textTransform: 'uppercase',
                  letterSpacing: '0.06em', whiteSpace: 'nowrap',
                  cursor: col.sortable ? 'pointer' : 'default',
                }}
                className={cn(col.sortable && 'select-none', col.className)}
              >
                {col.label}
                {col.sortable && sortKey === col.key && (
                  <span style={{ marginLeft: 4 }}>{sortDir === 'asc' ? '↑' : '↓'}</span>
                )}
                {col.sortable && sortKey !== col.key && (
                  <span style={{ marginLeft: 4, opacity: 0.4 }}>↕</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => (
            <tr
              key={keyExtractor(row)}
              onClick={() => onRowClick?.(row)}
              style={{
                borderBottom: '1px solid var(--c-border)',
                background: i % 2 === 0 ? 'transparent' : 'var(--c-muted)',
                cursor: onRowClick ? 'pointer' : 'default',
              }}
            >
              {columns.map(col => (
                <td key={col.key} style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--c-fg)', verticalAlign: 'middle' }} className={col.className}>
                  {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
