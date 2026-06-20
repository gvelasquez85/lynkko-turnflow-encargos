import { NextRequest, NextResponse } from 'next/server'
import { getContext } from '@/lib/context'
import { tickets, attentions, visitReasons, users, establishments } from '@/lib/db/schema'
import { eq, and, gte, lte, inArray } from '@lynkko/db'

export async function GET(req: NextRequest) {
  try {
    const { db, brandId } = await getContext()
    const { searchParams } = new URL(req.url)

    const startParam = searchParams.get('start')
    const endParam   = searchParams.get('end')
    const estId      = searchParams.get('establishmentId')
    const estIds     = searchParams.get('establishmentIds')

    if (!startParam || !endParam) {
      return NextResponse.json({ error: 'start y end son requeridos' }, { status: 400 })
    }

    const start = new Date(startParam + 'T00:00:00')
    const end   = new Date(endParam   + 'T23:59:59')

    // Verify establishments belong to this brand
    const brandEstabs = await db
      .select({ id: establishments.id, name: establishments.name })
      .from(establishments)
      .where(and(eq(establishments.brandId, brandId), eq(establishments.active, true)))

    const brandEstabIds = brandEstabs.map(e => e.id)

    // Determine which establishment IDs to filter by
    let filterIds: string[] = brandEstabIds
    if (estId) {
      filterIds = brandEstabIds.includes(estId) ? [estId] : []
    } else if (estIds) {
      const ids = estIds.split(',').filter(id => brandEstabIds.includes(id))
      if (ids.length > 0) filterIds = ids
    }

    if (filterIds.length === 0) {
      return NextResponse.json({ tickets: [], establishments: brandEstabs })
    }

    // Load tickets with visit reason and advisor
    const ticketRows = await db
      .select({
        id:             tickets.id,
        queueNumber:    tickets.queueNumber,
        customerName:   tickets.customerName,
        customerPhone:  tickets.customerPhone,
        customerEmail:  tickets.customerEmail,
        status:         tickets.status,
        createdAt:      tickets.createdAt,
        attendedAt:     tickets.attendedAt,
        completedAt:    tickets.completedAt,
        advisorId:      tickets.advisorId,
        establishmentId: tickets.establishmentId,
        visitReasonId:  tickets.visitReasonId,
        visitReasonName: visitReasons.name,
        advisorName:    users.name,
      })
      .from(tickets)
      .leftJoin(visitReasons, eq(tickets.visitReasonId, visitReasons.id))
      .leftJoin(users, eq(tickets.advisorId, users.id))
      .where(and(
        inArray(tickets.establishmentId, filterIds),
        gte(tickets.createdAt, start),
        lte(tickets.createdAt, end),
      ))
      .orderBy(tickets.createdAt)

    return NextResponse.json({ tickets: ticketRows, establishments: brandEstabs })
  } catch (e) {
    console.error('[GET /api/reportes/atencion]', e)
    return NextResponse.json({ error: 'Error al cargar datos' }, { status: 500 })
  }
}
