import { timingSafeEqual } from 'crypto'

// Comparação em tempo constante do header Authorization de um Vercel Cron
// contra CRON_SECRET — evita timing attack, mesmo padrão usado para o token
// do webhook do Asaas (app/api/webhooks/asaas/route.ts)
export function validateCronSecret(authHeader: string | null): boolean {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return false

  const expected = `Bearer ${cronSecret}`
  const headerBuf = Buffer.from(authHeader ?? '')
  const expectedBuf = Buffer.from(expected)
  if (headerBuf.length !== expectedBuf.length) return false
  return timingSafeEqual(headerBuf, expectedBuf)
}
