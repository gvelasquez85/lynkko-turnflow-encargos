import { NextResponse } from 'next/server'
import { getAcceptanceTokens } from '@/lib/wompi'

export async function GET() {
  try {
    const tokens = await getAcceptanceTokens()
    return NextResponse.json(tokens)
  } catch (err) {
    console.error('[billing/acceptance]', err)
    return NextResponse.json(
      { error: 'No se pudieron obtener los tokens de aceptación' },
      { status: 502 },
    )
  }
}
