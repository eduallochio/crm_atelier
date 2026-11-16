import { NextResponse } from 'next/server'
import { requireMasterFast } from '@/lib/auth/session'
import { buildReengajamentoHtml } from '@/lib/email'
import { logServerError } from '@/lib/log-error'

// GET — devolve o HTML do email de reengajamento sem enviar nada, para a
// tela mostrar num preview antes de disparar de verdade
export async function GET() {
  try {
    await requireMasterFast()
    const html = await buildReengajamentoHtml('Maria')
    return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED' || (error as Error).message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }
    logServerError('[GET /api/admin/campaigns/reengagement/preview]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
