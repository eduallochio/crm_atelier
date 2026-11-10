import { NextResponse } from 'next/server'

// Rota temporária de diagnóstico — REMOVER após confirmar env vars em produção
export async function GET(request: Request) {
  const authHeader = request.headers.get('x-debug-secret')
  if (authHeader !== process.env.SETUP_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  return NextResponse.json({
    RESEND_API_KEY: !!process.env.RESEND_API_KEY,
    RESEND_API_KEY_prefix: process.env.RESEND_API_KEY?.slice(0, 6) ?? null,
    TELEGRAM_BOT_TOKEN: !!process.env.TELEGRAM_BOT_TOKEN,
    TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID ?? null,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? null,
    NODE_ENV: process.env.NODE_ENV,
  })
}
