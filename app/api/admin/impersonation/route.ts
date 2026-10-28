import { NextResponse } from 'next/server'
import { clearImpersonationCookie, getImpersonationPayload } from '@/lib/auth/impersonation'
import { logServerError } from '@/lib/log-error'

// GET: estado atual da impersonation (usado pelo banner no layout do dashboard)
export async function GET() {
  const payload = await getImpersonationPayload()
  return NextResponse.json({
    active: !!payload,
    organizationName: payload?.organizationName ?? null,
  })
}

// DELETE: encerra a impersonation — a sessão master (cookies sb-*) nunca foi
// tocada, então o admin volta a ver seus próprios dados automaticamente
export async function DELETE() {
  try {
    await clearImpersonationCookie()
    return NextResponse.json({ ok: true })
  } catch (error) {
    logServerError('[DELETE /api/admin/impersonation]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
