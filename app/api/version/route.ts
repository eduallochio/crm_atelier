import { NextResponse } from 'next/server'
import pkg from '@/package.json'

// Identificador da build atual — a Vercel injeta VERCEL_GIT_COMMIT_SHA automaticamente
// em cada deploy. Em dev local, cai no fallback 'dev' (sempre igual, nunca dispara aviso).
// Usado só para detectar "há deploy novo", não é exibido ao usuário.
const BUILD_ID = process.env.VERCEL_GIT_COMMIT_SHA || 'dev'

export async function GET() {
  return NextResponse.json(
    { buildId: BUILD_ID, version: pkg.version },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}
