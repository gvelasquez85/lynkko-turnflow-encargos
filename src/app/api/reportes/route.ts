import { NextRequest, NextResponse } from 'next/server'
import { getContext } from '@/lib/context'
import { tickets, attentions, sales, customers, users } from '@/lib/db/schema'
import { eq, and, gte, count, sum, sql } from '@lynkko/db'

type Periodo = 'hoy' | 'semana' | 'mes' | '30d'

function getDateRange(periodo: Periodo): Date {
  const now = new Date()
  switch (periodo) {
    case 'hoy': {
      const s = new Date(now); s.setHours(0, 0, 0, 0); return s
    }
    case 'semana': {
      const s = new Date(now); s.setDate(now.getDate() - now.getDay()); s.setHours(0, 0, 0, 0); return s
    }
    case 'mes': return new Date(now.getFullYear(), now.getMonth(), 1)
    case '30d': {
      const s = new Date(now); s.setDate(now.getDate() - 30); s.setHours(0, 0, 0, 0); return s
    }
  }
}

export async function GET(req: NextRequest) {
  try {
    const { brandId, establishmentId, db } = await getContext()
    const { searchParams } = new URL(req.url)
    const periodo = (searchParams.get('periodo') ?? 'hoy') as Periodo

    const since = getDateRange(periodo)
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)

    // Tickets
    const ticketConditions = [gte(tickets.createdAt, since)]
    if (establishmentId) ticketConditions.push(eq(tickets.establishmentId, establishmentId))

    const [ticketData] = await db
      .select({
        total:     count(),
        atendidos: sql<number>`count(*) filter (where ${tickets.status} = 'attended' or ${tickets.status} = 'completed')`,
        cancelados: sql<number>`count(*) filter (where ${tickets.status} = 'cancelled')`,
      })
      .from(tickets)
      .where(and(...ticketConditions))

    // Avg attention time (minutes)
    const attConditions = [gte(attentions.createdAt, since)]
    if (establishmentId) attConditions.push(eq(attentions.establishmentId, establishmentId))

    const [avgTimeRow] = await db
      .select({
        avgMin: sql<number>`avg(extract(epoch from (${attentions.completedAt} - ${attentions.createdAt})) / 60)`,
      })
      .from(attentions)
      .where(and(...attConditions))

    const tiempoPromedioMin = Math.round(Number(avgTimeRow?.avgMin ?? 0))

    // Ventas
    const ventaConditions = [eq(sales.brandId, brandId), gte(sales.createdAt, since)]
    if (establishmentId) ventaConditions.push(eq(sales.establishmentId, establishmentId))

    const [ventaData] = await db
      .select({
        total:       count(),
        monto:       sum(sales.total),
        cotizaciones: sql<number>`count(*) filter (where ${sales.type} = 'quote')`,
      })
      .from(sales)
      .where(and(...ventaConditions))

    // Clientes
    const [clienteTotal] = await db
      .select({ total: count() })
      .from(customers)
      .where(eq(customers.brandId, brandId))

    const [clienteHoy] = await db
      .select({ nuevosHoy: count() })
      .from(customers)
      .where(and(eq(customers.brandId, brandId), gte(customers.createdAt, todayStart)))

    // Top asesores
    const topRows = await db
      .select({ advisorId: attentions.advisorId, atendidos: count() })
      .from(attentions)
      .where(and(...attConditions))
      .groupBy(attentions.advisorId)
      .orderBy(sql`count(*) desc`)
      .limit(5)

    const advisorIds = topRows.map((r) => r.advisorId).filter(Boolean) as string[]
    const userRows = advisorIds.length
      ? await db
          .select({ id: users.id, name: users.name })
          .from(users)
          .where(sql`${users.id} = any(${advisorIds})`)
      : []

    const userMap = Object.fromEntries(userRows.map((u) => [u.id, u.name]))

    return NextResponse.json({
      tickets: {
        total:           Number(ticketData?.total     ?? 0),
        atendidos:       Number(ticketData?.atendidos  ?? 0),
        cancelados:      Number(ticketData?.cancelados ?? 0),
        tiempoPromedioMin,
      },
      ventas: {
        total:        Number(ventaData?.total        ?? 0),
        monto:        Number(ventaData?.monto        ?? 0),
        cotizaciones: Number(ventaData?.cotizaciones ?? 0),
      },
      clientes: {
        total:     Number(clienteTotal?.total    ?? 0),
        nuevosHoy: Number(clienteHoy?.nuevosHoy  ?? 0),
      },
      topAsesores: topRows.map((r) => ({
        advisorId: r.advisorId,
        name:      userMap[r.advisorId ?? ''] ?? 'Desconocido',
        atendidos: Number(r.atendidos),
      })),
    })
  } catch (error) {
    console.error('[GET /api/reportes]', error)
    return NextResponse.json({ error: 'Error al obtener reportes' }, { status: 500 })
  }
}
