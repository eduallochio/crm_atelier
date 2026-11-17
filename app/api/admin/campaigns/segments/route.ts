import { NextResponse } from 'next/server'
import { requireMasterFast } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { campaignSegments } from '@/lib/db/schema'
import { desc } from 'drizzle-orm'
import { logServerError } from '@/lib/log-error'

// GET — lista os segmentos salvos (filtros nomeados e reutilizáveis),
// mais recentes primeiro
export async function GET() {
  try {
    await requireMasterFast()
    const segments = await db
      .select()
      .from(campaignSegments)
      .orderBy(desc(campaignSegments.createdAt))
    return NextResponse.json(segments)
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED' || (error as Error).message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }
    logServerError('[GET /api/admin/campaigns/segments]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// POST — salva o estado atual dos filtros da tela como um segmento nomeado
// (body: { name: string, criteria: object })
export async function POST(request: Request) {
  try {
    await requireMasterFast()
    const { name, criteria } = await request.json()
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Nome do segmento é obrigatório' }, { status: 400 })
    }
    if (!criteria || typeof criteria !== 'object') {
      return NextResponse.json({ error: 'Critério do segmento é obrigatório' }, { status: 400 })
    }

    const [segment] = await db
      .insert(campaignSegments)
      .values({ name: name.trim(), criteria })
      .returning()

    return NextResponse.json(segment)
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED' || (error as Error).message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }
    logServerError('[POST /api/admin/campaigns/segments]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
