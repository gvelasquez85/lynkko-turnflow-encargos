export type BusinessType =
  | 'banco'
  | 'clinica'
  | 'gobierno'
  | 'retail'
  | 'restaurante'
  | 'concesionario'
  | 'telecomunicaciones'
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
}

const VERTICAL_MAP: Record<BusinessType, VerticalLabels> = {
  banco: {
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
  },
  clinica: {
    cliente: 'paciente',
    clientes: 'pacientes',
    asesor: 'médico',
    asesores: 'médicos',
    turno: 'turno',
    turnos: 'turnos',
    cita: 'consulta',
    citas: 'consultas',
    motivo: 'motivo de consulta',
    venta: 'servicio',
    ventas: 'servicios',
    producto: 'tratamiento',
    productos: 'tratamientos',
    historial: 'historial médico',
  },
  gobierno: {
    cliente: 'ciudadano',
    clientes: 'ciudadanos',
    asesor: 'funcionario',
    asesores: 'funcionarios',
    turno: 'trámite',
    turnos: 'trámites',
    cita: 'cita',
    citas: 'citas',
    motivo: 'tipo de trámite',
    venta: '',
    ventas: '',
    producto: 'trámite',
    productos: 'trámites',
    historial: 'historial de trámites',
  },
  retail: {
    cliente: 'cliente',
    clientes: 'clientes',
    asesor: 'vendedor',
    asesores: 'vendedores',
    turno: 'turno',
    turnos: 'turnos',
    cita: 'cita',
    citas: 'citas',
    motivo: 'motivo de visita',
    venta: 'venta',
    ventas: 'ventas',
    producto: 'producto',
    productos: 'productos',
    historial: 'historial de compras',
  },
  restaurante: {
    cliente: 'cliente',
    clientes: 'clientes',
    asesor: 'mesero',
    asesores: 'meseros',
    turno: 'pedido',
    turnos: 'pedidos',
    cita: 'reserva',
    citas: 'reservas',
    motivo: 'tipo de pedido',
    venta: 'venta',
    ventas: 'ventas',
    producto: 'ítem',
    productos: 'ítems',
    historial: 'historial de pedidos',
  },
  concesionario: {
    cliente: 'cliente',
    clientes: 'clientes',
    asesor: 'asesor',
    asesores: 'asesores',
    turno: 'turno',
    turnos: 'turnos',
    cita: 'cita de prueba',
    citas: 'citas de prueba',
    motivo: 'motivo de visita',
    venta: 'venta',
    ventas: 'ventas',
    producto: 'vehículo/servicio',
    productos: 'vehículos/servicios',
    historial: 'historial de visitas',
  },
  telecomunicaciones: {
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
  },
}

export function getVerticalLabels(businessType: string | null | undefined): VerticalLabels {
  const key = (businessType ?? 'otros') as BusinessType
  return VERTICAL_MAP[key] ?? VERTICAL_MAP['otros']
}

// ─── Vertical definitions (membership / billing tab) ─────────────────────────

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

export const VERTICALS: Vertical[] = [
  { key: 'belleza', label: 'TurnFlow Belleza', tagline: 'Tu salón, organizado de pies a cabeza', description: 'Gestiona citas, clientes y servicios en un solo lugar.', icon: 'Scissors', color: 'bg-pink-500', colorLight: 'bg-pink-50 border-pink-200', priceMonthly: 89900, subtypes: ['Spa', 'Salón de uñas', 'Peluquería', 'Barbería', 'Estética'], modules: [...BASE_MODULES, { key: 'appointments', label: 'Citas y agendamiento', included: true, isNew: false }, { key: 'queue', label: 'Cola de espera', included: true, isNew: false }, { key: 'treatment_history', label: 'Historial de tratamientos', included: true, isNew: false }] },
  { key: 'tienda', label: 'TurnFlow Tienda', tagline: 'Vende más, gestiona menos', description: 'Control total de tu tienda: inventario, clientes frecuentes y facturación.', icon: 'ShoppingBag', color: 'bg-indigo-500', colorLight: 'bg-indigo-50 border-indigo-200', priceMonthly: 109900, subtypes: ['Tienda de ropa', 'Ferretería', 'Droguería', 'Papelería'], modules: [...BASE_MODULES, { key: 'queue', label: 'Cola de espera', included: true, isNew: false }, { key: 'inventory_advanced', label: 'Inventario avanzado', included: true, isNew: false }] },
  { key: 'restaurante', label: 'TurnFlow Restaurante', tagline: 'De la mesa al pago, sin fricciones', description: 'Menú digital, gestión de mesas y pedidos desde el celular.', icon: 'UtensilsCrossed', color: 'bg-orange-500', colorLight: 'bg-orange-50 border-orange-200', priceMonthly: 129900, subtypes: ['Restaurante', 'Bar', 'Cafetería', 'Comidas rápidas'], modules: [...BASE_MODULES, { key: 'menu', label: 'Menú digital', included: true, isNew: false }, { key: 'table_management', label: 'Gestión de mesas', included: true, isNew: false }] },
  { key: 'salud', label: 'TurnFlow Salud', tagline: 'Cuida a tus pacientes, no el papeleo', description: 'Historia clínica, agenda médica y seguimiento de pacientes.', icon: 'Stethoscope', color: 'bg-emerald-500', colorLight: 'bg-emerald-50 border-emerald-200', priceMonthly: 149900, subtypes: ['Consultorio médico', 'Clínica', 'Odontología', 'Psicología', 'Veterinaria'], modules: [...BASE_MODULES, { key: 'appointments', label: 'Citas médicas', included: true, isNew: false }, { key: 'clinical_history', label: 'Historia clínica', included: true, isNew: false }] },
  { key: 'copropiedad', label: 'TurnFlow Copropiedad', tagline: 'Administra tu conjunto, sin complicaciones', description: 'Recaudo de cuotas, comunicados a residentes y reserva de zonas comunes.', icon: 'Building2', color: 'bg-slate-600', colorLight: 'bg-slate-50 border-slate-200', priceMonthly: 179900, subtypes: ['Conjunto residencial', 'Edificio', 'Centro empresarial'], modules: [...BASE_MODULES, { key: 'copropiedades', label: 'Módulo de copropiedad', included: true, isNew: false }, { key: 'amenity_booking', label: 'Reserva de zonas comunes', included: true, isNew: false }] },
  { key: 'consultoria', label: 'TurnFlow Consultoría', tagline: 'Enfócate en tus clientes, no en la operación', description: 'Gestión de proyectos, seguimiento de horas y propuestas comerciales.', icon: 'Briefcase', color: 'bg-violet-500', colorLight: 'bg-violet-50 border-violet-200', priceMonthly: 119900, subtypes: ['Consultoría', 'Agencia', 'Freelancer', 'Servicios profesionales'], modules: [...BASE_MODULES, { key: 'project_management', label: 'Gestión de proyectos', included: true, isNew: false }, { key: 'proposals', label: 'Propuestas y cotizaciones', included: true, isNew: false }] },
  { key: 'encargos', label: 'TurnFlow Encargos', tagline: 'Tu cliente deja, vuelve y recoge — sin perder nada', description: 'Gestión de prendas, calzado y artículos para arreglo o lavado.', icon: 'Package', color: 'bg-amber-500', colorLight: 'bg-amber-50 border-amber-200', priceMonthly: 79900, subtypes: ['Lavandería', 'Zapatería', 'Sastrería', 'Tintorería'], modules: [...BASE_MODULES, { key: 'orders_intake', label: 'Registro de encargos', included: true, isNew: false }, { key: 'pickup_notify', label: 'Aviso WhatsApp al cliente', included: true, isNew: false }] },
  { key: 'dropshipping', label: 'TurnFlow Dropshipping', tagline: 'Vende sin stock, escala sin límites', description: 'Gestiona proveedores, pedidos y márgenes en un solo lugar.', icon: 'Truck', color: 'bg-teal-500', colorLight: 'bg-teal-50 border-teal-200', priceMonthly: 119900, subtypes: ['Dropshipping', 'Tienda online', 'Importador'], modules: [...BASE_MODULES, { key: 'suppliers', label: 'Gestión de proveedores', included: true, isNew: false }, { key: 'dropship_orders', label: 'Pedidos de clientes', included: true, isNew: false }] },
  { key: 'hospitalidad', label: 'TurnFlow Hospitalidad', tagline: 'Llena tu hotel, gestiona cada huésped', description: 'Reservas online, gestión de habitaciones y consumos por estancia.', icon: 'BedDouble', color: 'bg-cyan-600', colorLight: 'bg-cyan-50 border-cyan-200', priceMonthly: 199900, transactionFeePercent: 2, pricingNote: '+ 2 % por reserva (pago local)', subtypes: ['Hotel boutique', 'Hostal', 'Apart-hotel', 'Casa campestre'], modules: [...BASE_MODULES, { key: 'room_manager', label: 'Gestión de habitaciones', included: true, isNew: false }, { key: 'reservations', label: 'Calendario de reservas', included: true, isNew: false }, { key: 'booking_widget', label: 'Widget embebible para tu web', included: true, isNew: false }] },
]

export function getVertical(key: string): Vertical | undefined {
  return VERTICALS.find(v => v.key === key)
}
