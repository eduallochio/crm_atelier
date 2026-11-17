import { NextResponse } from 'next/server'
import { requireMasterFast } from '@/lib/auth/session'
import { buildReengajamentoHtml, buildUsoBaixoHtml, buildBonusAcabandoHtml, buildNovidadesHtml } from '@/lib/email'
import { logServerError } from '@/lib/log-error'
import { isCampaignType } from '@/lib/campaigns/registry'

// GET — devolve o HTML do email sem enviar nada, para a tela mostrar num
// preview antes de disparar de verdade. A campanha de novidades recebe o
// conteúdo (título, descrição, cta) por query string, já que não tem texto
// fixo no código — ver app/admin/campaigns/page.tsx
export async function GET(request: Request, { params }: { params: Promise<{ type: string }> }) {
  try {
    await requireMasterFast()
    const { type } = await params
    if (!isCampaignType(type)) {
      return NextResponse.json({ error: 'Tipo de campanha inválido' }, { status: 400 })
    }

    let html: string
    switch (type) {
      case 'reengagement':
        html = await buildReengajamentoHtml('Maria')
        break
      case 'low-usage':
        html = await buildUsoBaixoHtml('Maria')
        break
      case 'bonus-ending':
        html = await buildBonusAcabandoHtml('Maria', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'))
        break
      case 'product-news': {
        const { searchParams } = new URL(request.url)
        html = await buildNovidadesHtml('Maria', {
          titulo: searchParams.get('titulo') || 'Título da novidade',
          descricao: searchParams.get('descricao') || 'Descrição da novidade que será enviada.',
          ctaTexto: searchParams.get('ctaTexto') || 'Ver novidade',
          ctaUrl: searchParams.get('ctaUrl') || (process.env.NEXT_PUBLIC_APP_URL ?? 'https://meuateliersistema.com.br'),
        })
        break
      }
      default:
        return NextResponse.json({ error: 'Tipo de campanha inválido' }, { status: 400 })
    }

    return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED' || (error as Error).message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }
    logServerError('[GET /api/admin/campaigns/[type]/preview]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
