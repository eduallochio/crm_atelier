import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { profiles } from '@/lib/db/schema'
import type { UserPermissions } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { logServerError } from '@/lib/log-error'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await requireAuth()

    if (!user.isOwner) {
      return NextResponse.json({ error: 'Apenas o proprietário pode alterar permissões' }, { status: 403 })
    }

    // Não permite alterar permissões do próprio owner nem de outro owner
    const [target] = await db
      .select({ isOwner: profiles.isOwner, organizationId: profiles.organizationId })
      .from(profiles)
      .where(and(eq(profiles.id, id), eq(profiles.organizationId, user.organizationId)))
      .limit(1)

    if (!target) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    if (target.isOwner) {
      return NextResponse.json({ error: 'Permissões do proprietário não podem ser alteradas' }, { status: 403 })
    }

    const body = await req.json()
    const allowedKeys: (keyof UserPermissions)[] = [
      'clientes', 'ordens_servico', 'servicos', 'financeiro', 'estoque', 'fornecedores', 'configuracoes',
    ]

    const permissions: UserPermissions = {}
    for (const key of allowedKeys) {
      if (typeof body[key] === 'boolean') {
        permissions[key] = body[key]
      }
    }

    await db
      .update(profiles)
      .set({ permissions })
      .where(and(eq(profiles.id, id), eq(profiles.organizationId, user.organizationId)))

    return NextResponse.json({ success: true, permissions })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED')
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    if ((error as Error).message === 'SUSPENDED')
      return NextResponse.json({ error: 'Conta suspensa' }, { status: 403 })
    logServerError('[PUT /api/users/:id/permissions]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await requireAuth()

    if (!user.isOwner) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const [target] = await db
      .select({ permissions: profiles.permissions, isOwner: profiles.isOwner })
      .from(profiles)
      .where(and(eq(profiles.id, id), eq(profiles.organizationId, user.organizationId)))
      .limit(1)

    if (!target) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    return NextResponse.json({ permissions: target.permissions, isOwner: target.isOwner })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED')
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    logServerError('[GET /api/users/:id/permissions]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
