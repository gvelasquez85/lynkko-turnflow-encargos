'use client'

import { useState } from 'react'
import {
  Building2, Search, Filter, ChevronDown, ChevronUp,
  Users, CreditCard, CheckCircle, XCircle, Eye,
  MoreHorizontal, Trash2, Edit2, Power, PowerOff,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Brand {
  id: string
  name: string
  slug: string
  active: boolean
  currentPlan: string
  businessType: string
  createdAt: Date
  onboardingCompleted: boolean
  memberCount: number
}

interface SuperadminPanelProps {
  brands: Brand[]
}

export default function SuperadminPanel({ brands: initialBrands }: SuperadminPanelProps) {
  const [brands, setBrands] = useState(initialBrands)
  const [search, setSearch] = useState('')
  const [filterPlan, setFilterPlan] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [sortField, setSortField] = useState<'name' | 'createdAt' | 'currentPlan'>('createdAt')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [expandedBrand, setExpandedBrand] = useState<string | null>(null)

  const filtered = brands
    .filter(b => {
      if (search && !b.name.toLowerCase().includes(search.toLowerCase()) && !b.slug.includes(search)) return false
      if (filterPlan !== 'all' && b.currentPlan !== filterPlan) return false
      if (filterStatus === 'active' && !b.active) return false
      if (filterStatus === 'inactive' && b.active) return false
      return true
    })
    .sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      if (sortField === 'name') return a.name.localeCompare(b.name) * dir
      if (sortField === 'createdAt') return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir
      return a.currentPlan.localeCompare(b.currentPlan) * dir
    })

  const plans = [...new Set(brands.map(b => b.currentPlan))]

  function toggleSort(field: typeof sortField) {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

  async function toggleBrandStatus(brandId: string, currentActive: boolean) {
    try {
      const res = await fetch(`/api/superadmin/brands/${brandId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentActive }),
      })
      if (res.ok) {
        setBrands(prev => prev.map(b => b.id === brandId ? { ...b, active: !currentActive } : b))
      }
    } catch (err) {
      console.error('Error toggling brand status:', err)
    }
  }

  function SortIcon({ field }: { field: typeof sortField }) {
    if (sortField !== field) return <ChevronDown size={14} className="text-gray-300" />
    return sortDir === 'asc' ? <ChevronUp size={14} className="text-indigo-500" /> : <ChevronDown size={14} className="text-indigo-500" />
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Administración de Marcas</h1>
        <p className="text-sm text-gray-500 mt-1">
          Gestiona todas las marcas con vertical Encargos contratada
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-medium text-gray-500 uppercase">Total marcas</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{brands.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-medium text-gray-500 uppercase">Activas</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{brands.filter(b => b.active).length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-medium text-gray-500 uppercase">Inactivas</p>
          <p className="text-2xl font-bold text-red-500 mt-1">{brands.filter(b => !b.active).length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-medium text-gray-500 uppercase">Total usuarios</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">{brands.reduce((sum, b) => sum + b.memberCount, 0)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o slug..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <select
            value={filterPlan}
            onChange={e => setFilterPlan(e.target.value)}
            className="text-sm rounded-lg border border-gray-200 px-3 py-2 focus:border-indigo-500 focus:outline-none"
          >
            <option value="all">Todos los planes</option>
            {plans.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="text-sm rounded-lg border border-gray-200 px-3 py-2 focus:border-indigo-500 focus:outline-none"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activas</option>
            <option value="inactive">Inactivas</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => toggleSort('name')}>
                <span className="flex items-center gap-1">Marca <SortIcon field="name" /></span>
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => toggleSort('currentPlan')}>
                <span className="flex items-center gap-1">Plan <SortIcon field="currentPlan" /></span>
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Usuarios</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => toggleSort('createdAt')}>
                <span className="flex items-center gap-1">Creada <SortIcon field="createdAt" /></span>
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-400">
                  <Building2 size={40} className="mx-auto mb-3 opacity-30" />
                  <p>No se encontraron marcas</p>
                </td>
              </tr>
            ) : (
              filtered.map(brand => (
                <tr key={brand.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
                        {brand.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{brand.name}</p>
                        <p className="text-xs text-gray-400">{brand.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                      brand.currentPlan === 'enterprise' ? 'bg-purple-100 text-purple-700' :
                      brand.currentPlan === 'professional' ? 'bg-blue-100 text-blue-700' :
                      brand.currentPlan === 'basic' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-600',
                    )}>
                      {brand.currentPlan}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5 text-sm text-gray-600">
                      <Users size={14} />
                      {brand.memberCount}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      'inline-flex items-center gap-1 text-xs font-medium',
                      brand.active ? 'text-green-600' : 'text-red-500',
                    )}>
                      {brand.active ? <CheckCircle size={14} /> : <XCircle size={14} />}
                      {brand.active ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(brand.createdAt).toLocaleDateString('es-CO')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setExpandedBrand(expandedBrand === brand.id ? null : brand.id)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                        title="Ver detalle"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={() => toggleBrandStatus(brand.id, brand.active)}
                        className={cn(
                          'p-1.5 rounded-lg hover:bg-gray-100',
                          brand.active ? 'text-red-400 hover:text-red-600' : 'text-green-400 hover:text-green-600',
                        )}
                        title={brand.active ? 'Desactivar' : 'Activar'}
                      >
                        {brand.active ? <PowerOff size={15} /> : <Power size={15} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400 mt-3 text-right">
        Mostrando {filtered.length} de {brands.length} marcas
      </p>
    </div>
  )
}
