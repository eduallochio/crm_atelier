import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { db } from '@/lib/db'
import { campaignSends } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'
import { logServerError } from '@/lib/log-error'

const WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET ?? ''

// Resend assina webhooks no padrão Svix: HMAC-SHA256 sobre
// "{svix-id}.{svix-timestamp}.{corpo-bruto}", usando o secret gerado no
// painel (prefixo "whsec_", o restante em base64) — mesmo princípio do
// token estático do Asaas (app/api/webhooks/asaas/route.ts), mas assinado
// por requisição em vez de comparação direta.
function validateSignature(rawBody: string, svixId: string | null, svixTimestamp: string | null, svixSignature: string | null): boolean {
  if (!WEBHOOK_SECRET || !svixId || !svixTimestamp || !svixSignature) return false

  const secretBytes = Buffer.from(WEBHOOK_SECRET.replace(/^whsec_/, ''), 'base64')
  const signedContent = `${svixId}.${svixTimestamp}.${rawBody}`
  const expectedSignature = createHmac('sha256', secretBytes).update(signedContent).digest('base64')

  // svix-signature pode trazer várias assinaturas espaço-separadas, cada uma
  // no formato "v1,<base64>" (para rotação de secret) — basta uma bater
  const candidates = svixSignature.split(' ').map((s) => s.split(',')[1]).filter(Boolean)
  const expectedBuf = Buffer.from(expectedSignature)
  return candidates.some((candidate) => {
    const candidateBuf = Buffer.from(candidate)
    if (candidateBuf.length !== expectedBuf.length) return false
    return timingSafeEqual(candidateBuf, expectedBuf)
  })
}

export async function POST(req: NextRequest) {
  try {
    if (!WEBHOOK_SECRET) {
      logServerError('[webhook/resend]', new Error('RESEND_WEBHOOK_SECRET não configurado'))
      return NextResponse.json({ error: 'não configurado' }, { status: 500 })
    }

    const rawBody = await req.text()
    const svixId = req.headers.get('svix-id')
    const svixTimestamp = req.headers.get('svix-timestamp')
    const svixSignature = req.headers.get('svix-signature')

    if (!validateSignature(rawBody, svixId, svixTimestamp, svixSignature)) {
      return NextResponse.json({ error: 'assinatura inválida' }, { status: 401 })
    }

    const body = JSON.parse(rawBody)
    const { type, data } = body
    const emailId = data?.email_id as string | undefined
    if (!emailId) return NextResponse.json({ ok: true })

    // Só a primeira ocorrência é gravada — reaberturas/recliques não movem a
    // data já registrada, a métrica conta pessoas, não eventos
    if (type === 'email.opened') {
      await db
        .update(campaignSends)
        .set({ openedAt: sql`coalesce(${campaignSends.openedAt}, now())` })
        .where(eq(campaignSends.resendEmailId, emailId))
    } else if (type === 'email.clicked') {
      await db
        .update(campaignSends)
        .set({ clickedAt: sql`coalesce(${campaignSends.clickedAt}, now())` })
        .where(eq(campaignSends.resendEmailId, emailId))
    }
    // Outros eventos (sent, delivered, bounced, complained, ...) — sem ação por enquanto

    return NextResponse.json({ ok: true })
  } catch (error) {
    logServerError('[POST /api/webhooks/resend]', error)
    return NextResponse.json({ error: 'erro interno' }, { status: 500 })
  }
}
