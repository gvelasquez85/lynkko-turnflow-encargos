'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart2, Users, Shirt, Clock, CheckCircle2, Package } from 'lucide-react'
import { cn } from '@/lib/utils'

const TABS = [
  { key: 'servicios', label: 'Servicios', icon: Shirt, href: '/reportes/servicios' },
  { key: 'clientes', label: 'Clientes', icon: Users, href: '/reportes/clientes' },
]

export default function ReportesPanel() {
  const pathname = usePathname()
  const currentTab = pathname.includes('/servicios') ? 'servicios' : 'clientes'

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Reportes</h1>
      <p className="text-sm text-gray-500 mb-6">Métricas y análisis de tu negocio</p>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
        {TABS.map(tab => {
          const Icon = tab.icon
          const active = currentTab === tab.key
          return (
            <Link
              key={tab.key}
              href={tab.href}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <Icon size={16} />
              {tab.label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
