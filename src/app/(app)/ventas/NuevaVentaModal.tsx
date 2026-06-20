'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { X, Plus, Trash2, Search } from 'lucide-react'
import type { VerticalLabels } from '@/lib/verticals'

interface Product {
  id: string
  name: string
  sku: string | null
  price: string | number
  stock: number
  unit: string
}

interface SaleItem {
  productId: string | null
  productName: string
  productSku: string | null
  qty: number
  unitPrice: number
  discount: number
  lineTotal: number
}

interface Sale {
  id: string
  type: 'sale' | 'quote'
  status: 'completed' | 'cancelled' | 'draft' | 'sent' | 'accepted' | 'rejected' | 'converted'
  subtotal: string | number
  discount: string | number
  total: string | number
  notes: string | null
  createdAt: string | Date
  customerId: string | null
  customerName: string | null
}

interface NuevaVentaModalProps {
  type: 'sale' | 'quote'
  labels: VerticalLabels
  onClose: () => void
  onCreated: (sale: Sale) => void
}

function formatCurrency(value: number) {
  return value.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })
}

function createEmptyItem(): SaleItem {
  return { productId: null, productName: '', productSku: null, qty: 1, unitPrice: 0, discount: 0, lineTotal: 0 }
}

export default function NuevaVentaModal({ type, labels, onClose, onCreated }: NuevaVentaModalProps) {
  const [customerName, setCustomerName] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<SaleItem[]>([createEmptyItem()])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Product search
  const [productQuery, setProductQuery] = useState('')
  const [productResults, setProductResults] = useState<Product[]>([])
  const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null)
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const searchProducts = useCallback(async (q: string) => {
    if (!q.trim()) { setProductResults([]); return }
    const res = await fetch(`/api/productos?q=${encodeURIComponent(q)}&active=true`)
    if (res.ok) {
      const data = await res.json()
      setProductResults(data.products ?? [])
    }
  }, [])

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => searchProducts(productQuery), 300)
    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current) }
  }, [productQuery, searchProducts])

  function updateItem(index: number, field: keyof SaleItem, value: string | number | null) {
    setItems((prev) => {
      const next = [...prev]
      const item = { ...next[index], [field]: value }
      item.lineTotal = item.qty * item.unitPrice - item.discount
      next[index] = item
      return next
    })
  }

  function selectProduct(index: number, product: Product) {
    setItems((prev) => {
      const next = [...prev]
      const qty = next[index].qty
      const unitPrice = Number(product.price)
      next[index] = {
        productId: product.id,
        productName: product.name,
        productSku: product.sku,
        qty,
        unitPrice,
        discount: 0,
        lineTotal: qty * unitPrice,
      }
      return next
    })
    setProductQuery('')
    setProductResults([])
    setActiveItemIndex(null)
  }

  function addItem() {
    setItems((prev) => [...prev, createEmptyItem()])
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  const subtotal = items.reduce((acc, item) => acc + item.lineTotal, 0)
  const total = subtotal

  async function handleSubmit(asDraft: boolean) {
    setError('')
    const validItems = items.filter((i) => i.productName.trim())
    if (validItems.length === 0) {
      setError('Agrega al menos un ítem con nombre')
      return
    }

    setLoading(true)
    try {
      const body = {
        type,
        notes: notes || undefined,
        items: validItems.map((i) => ({
          productId: i.productId ?? undefined,
          productName: i.productName,
          productSku: i.productSku ?? undefined,
          qty: i.qty,
          unitPrice: i.unitPrice,
          discount: i.discount,
        })),
      }

      const res = await fetch('/api/ventas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Error al guardar')
      }

      const data = await res.json()
      onCreated(data.sale)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            {type === 'sale' ? `Nueva ${labels.venta}` : 'Nueva cotización'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Cliente */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{labels.cliente} (opcional)</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder={`Nombre del ${labels.cliente.toLowerCase()}`}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">{labels.productos}</label>
              <button
                onClick={addItem}
                className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
              >
                <Plus size={14} />
                Agregar ítem
              </button>
            </div>

            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={index} className="border border-gray-100 rounded-xl p-3 bg-gray-50">
                  {/* Product search */}
                  <div className="relative mb-2">
                    <div className="flex items-center gap-2">
                      <Search size={14} className="text-gray-400 shrink-0" />
                      <input
                        type="text"
                        value={activeItemIndex === index ? productQuery : item.productName}
                        onChange={(e) => {
                          setActiveItemIndex(index)
                          setProductQuery(e.target.value)
                          if (!item.productId) updateItem(index, 'productName', e.target.value)
                        }}
                        onFocus={() => setActiveItemIndex(index)}
                        placeholder="Buscar o escribir nombre del producto/servicio"
                        className="flex-1 bg-transparent text-sm focus:outline-none placeholder-gray-400"
                      />
                      {items.length > 1 && (
                        <button onClick={() => removeItem(index)} className="text-red-400 hover:text-red-600">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>

                    {activeItemIndex === index && productResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
                        {productResults.map((p) => (
                          <button
                            key={p.id}
                            onMouseDown={() => selectProduct(index, p)}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 flex items-center justify-between"
                          >
                            <span className="font-medium text-gray-800">{p.name}</span>
                            <span className="text-gray-500 text-xs">{formatCurrency(Number(p.price))}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Qty / Price / Discount / Total */}
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    <div>
                      <label className="text-gray-400 mb-0.5 block">Cantidad</label>
                      <input
                        type="number"
                        min="0.001"
                        step="0.001"
                        value={item.qty}
                        onChange={(e) => updateItem(index, 'qty', parseFloat(e.target.value) || 0)}
                        className="w-full border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-gray-400 mb-0.5 block">Precio unitario</label>
                      <input
                        type="number"
                        min="0"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className="w-full border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-gray-400 mb-0.5 block">Descuento</label>
                      <input
                        type="number"
                        min="0"
                        value={item.discount}
                        onChange={(e) => updateItem(index, 'discount', parseFloat(e.target.value) || 0)}
                        className="w-full border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-gray-400 mb-0.5 block">Total línea</label>
                      <div className="w-full border border-gray-100 bg-white rounded-lg px-2 py-1 font-semibold text-gray-700">
                        {formatCurrency(item.lineTotal)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="bg-indigo-50 rounded-xl p-4 text-sm space-y-1">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900 text-base pt-1 border-t border-indigo-100">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Notas adicionales..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => handleSubmit(true)}
            disabled={loading}
            className="px-4 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Guardar como borrador
          </button>
          <button
            onClick={() => handleSubmit(false)}
            disabled={loading}
            className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Guardando...' : type === 'sale' ? `Completar ${labels.venta}` : 'Enviar cotización'}
          </button>
        </div>
      </div>
    </div>
  )
}
