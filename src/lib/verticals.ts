export type BusinessType =
  | 'lavanderia'
  | 'zapateria'
  | 'sastreria'
  | 'tintoreria'
  | 'otros'

export interface VerticalLabels {
  cliente: string
  clientes: string
  asesor: string
  asesores: string
  turno: string
  turnos: string
  cita: string
  citas: string
  motivo: string
  venta: string
  ventas: string
  producto: string
  productos: string
  historial: string
  encargo: string
  encargos: string
  servicio: string
  servicios: string
}

const VERTICAL_MAP: Record<BusinessType, VerticalLabels> = {
  lavanderia: {
    cliente: 'cliente',
    clientes: 'clientes',
    asesor: 'operario',
    asesores: 'operarios',
    turno: 'turno',
    turnos: 'turnos',
    cita: 'cita',
    citas: 'citas',
    motivo: 'tipo de prenda',
    venta: 'venta',
    ventas: 'ventas',
    producto: 'servicio',
    productos: 'servicios',
    historial: 'historial de encargos',
    encargo: 'encargo',
    encargos: 'encargos',
    servicio: 'servicio',
    servicios: 'servicios',
  },
  zapateria: {
    cliente: 'cliente',
    clientes: 'clientes',
    asesor: 'zapatero',
    asesores: 'zapateros',
    turno: 'turno',
    turnos: 'turnos',
    cita: 'cita',
    citas: 'citas',
    motivo: 'tipo de calzado',
    venta: 'venta',
    ventas: 'ventas',
    producto: 'reparación',
    productos: 'reparaciones',
    historial: 'historial de reparaciones',
    encargo: 'encargo',
    encargos: 'encargos',
    servicio: 'reparación',
    servicios: 'reparaciones',
  },
  sastreria: {
    cliente: 'cliente',
    clientes: 'clientes',
    asesor: 'sastre',
    asesores: 'sastres',
    turno: 'turno',
    turnos: 'turnos',
    cita: 'cita',
    citas: 'citas',
    motivo: 'tipo de prenda',
    venta: 'venta',
    ventas: 'ventas',
    producto: 'ajuste',
    productos: 'ajustes',
    historial: 'historial de ajustes',
    encargo: 'encargo',
    encargos: 'encargos',
    servicio: 'ajuste',
    servicios: 'ajustes',
  },
  tintoreria: {
    cliente: 'cliente',
    clientes: 'clientes',
    asesor: 'operario',
    asesores: 'operarios',
    turno: 'turno',
    turnos: 'turnos',
    cita: 'cita',
    citas: 'citas',
    motivo: 'tipo de prenda',
    venta: 'venta',
    ventas: 'ventas',
    producto: 'servicio',
    productos: 'servicios',
    historial: 'historial de encargos',
    encargo: 'encargo',
    encargos: 'encargos',
    servicio: 'servicio',
    servicios: 'servicios',
  },
  otros: {
    cliente: 'cliente',
    clientes: 'clientes',
    asesor: 'asesor',
    asesores: 'asesores',
    turno: 'turno',
    turnos: 'turnos',
    cita: 'cita',
    citas: 'citas',
    motivo: 'motivo de visita',
    venta: 'venta',
    ventas: 'ventas',
    producto: 'producto',
    productos: 'productos',
    historial: 'historial de visitas',
    encargo: 'encargo',
    encargos: 'encargos',
    servicio: 'servicio',
    servicios: 'servicios',
  },
}

export function getVerticalLabels(businessType: string | null | undefined): VerticalLabels {
  const key = (businessType ?? 'otros') as BusinessType
  return VERTICAL_MAP[key] ?? VERTICAL_MAP['otros']
}

// Vertical definition for marketplace / onboarding
export interface VerticalModule {
  key: string
  label: string
  included: boolean
  isNew: boolean
}

export interface Vertical {
  key: string
  label: string
  tagline: string
  description: string
  icon: string
  color: string
  colorLight: string
  priceMonthly: number
  transactionFeePercent?: number
  pricingNote?: string
  subtypes: string[]
  modules: VerticalModule[]
  comingSoon?: boolean
}

const BASE_MODULES: VerticalModule[] = [
  { key: 'clientes',  label: 'CRM / Clientes',     included: true, isNew: false },
  { key: 'sales',     label: 'Ventas',              included: true, isNew: false },
  { key: 'inventory', label: 'Inventario',          included: true, isNew: false },
  { key: 'mensajes',  label: 'Mensajería WhatsApp', included: true, isNew: false },
  { key: 'reports',   label: 'Reportes',            included: true, isNew: false },
]

export const ENCARGO_VERTICAL: Vertical = {
  key: 'encargos',
  label: 'TurnFlow Encargos',
  tagline: 'Tu cliente deja, vuelve y recoge — sin perder nada',
  description: 'Gestión de prendas, calzado y artículos para arreglo o lavado.',
  icon: 'Shirt',
  color: 'bg-amber-500',
  colorLight: 'bg-amber-50 border-amber-200',
  priceMonthly: 79900,
  subtypes: ['Lavandería', 'Zapatería', 'Sastrería', 'Tintorería'],
  modules: [
    ...BASE_MODULES,
    { key: 'orders_intake',  label: 'Registro de encargos',    included: true, isNew: false },
    { key: 'pickup_notify',  label: 'Aviso WhatsApp al cliente', included: true, isNew: false },
  ],
}

// Array de verticales disponibles (para compatibilidad con código existente)
export const VERTICALS: Vertical[] = [ENCARGO_VERTICAL]
