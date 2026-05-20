import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { logServerError } from '@/lib/log-error'

// org_service_price_history table does not exist in the Drizzle/Supabase schema.
// Return an empty array to keep the API contract intact without errors.

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth()
    // Price history table not available in current schema
    return NextResponse.json([])
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    logServerError('[GET /api/services/:id/price-history]', error); console.error('[GET /api/services/:id/price-history]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
