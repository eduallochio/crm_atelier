import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { profiles, orgDeletionLog } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { logServerError } from '@/lib/log-error'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await requireAuth()

    if (!user.isOwner) {
      return NextResponse.json({ error: 'Apenas o proprietário pode alterar permissões' }, { status: 403 })
    }

    const { role } = await req.json()
    const validRoles = ['admin', 'member']
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Cargo inválido' }, { status: 400 })
    }

    // Não permite alterar o próprio cargo nem o do owner
    const check = await db
      .select({ id: profiles.id, isOwner: profiles.isOwner })
      .from(profiles)
      .where(and(eq(profiles.id, id), eq(profiles.organizationId, user.organizationId)))
      .limit(1)

    if (check.length === 0) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }
    if (check[0].isOwner) {
      return NextResponse.json({ error: 'Não é possível alterar o cargo do proprietário' }, { status: 403 })
    }

    await db
      .update(profiles)
      .set({ role })
      .where(and(eq(profiles.id, id), eq(profiles.organizationId, user.organizationId)))

    return NextResponse.json({ success: true })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    logServerError('[PUT /api/users/[id]]', error); console.error('[PUT /api/users/[id]]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  let organizationId: string | undefined
  try {
    const { id } = await params
    const user = await requireAuth()
    organizationId = user.organizationId

    if (!user.isOwner) {
      return NextResponse.json({ error: 'Apenas o proprietário pode remover usuários' }, { status: 403 })
    }

    if (id === user.id) {
      return NextResponse.json({ error: 'Você não pode remover a si mesmo' }, { status: 400 })
    }

    const check = await db
      .select({ id: profiles.id, isOwner: profiles.isOwner, fullName: profiles.fullName, role: profiles.role })
      .from(profiles)
      .where(and(eq(profiles.id, id), eq(profiles.organizationId, user.organizationId)))
      .limit(1)

    if (check.length === 0) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }
    if (check[0].isOwner) {
      return NextResponse.json({ error: 'Não é possível remover o proprietário' }, { status: 403 })
    }

    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Delete from Supabase Auth first (cascades to profiles via trigger) — só
    // grava o log depois de confirmar que a exclusão realmente aconteceu,
    // senão uma falha aqui deixaria um registro de auditoria falso.
    // "User not found" (status 404) é tratado como sucesso: o profile existe
    // mas o registro correspondente em auth.users já não existe (ex: removido
    // por fora, ou um estado inconsistente anterior) — sem esse caso, a
    // exclusão fica travada num loop de "Erro interno" pra sempre, já que o
    // profile nunca vai ter um auth.users pra deletar. O profile órfão ainda
    // precisa ser limpo manualmente abaixo, pois sem auth.users o trigger de
    // cascata nunca dispara.
    const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(id)
    const authErrorInfo = deleteAuthError as { status?: number; code?: string } | null
    const isAlreadyGone = !!authErrorInfo && (authErrorInfo.status === 404 || authErrorInfo.code === 'user_not_found')
    if (deleteAuthError && !isAlreadyGone) throw deleteAuthError
    if (isAlreadyGone) {
      try {
        await db
          .delete(profiles)
          .where(and(eq(profiles.id, id), eq(profiles.organizationId, user.organizationId)))
      } catch (profileDeleteError) {
        // Violação de FK (ex: usuário já abriu/fechou um caixa, registrou
        // movimento ou concluiu uma OS) — mensagem específica em vez de
        // "Erro interno" genérico, já que não há como resolver sozinho pela
        // tela: precisa de intervenção manual pra desvincular esses registros.
        // Loga o estado (profile órfão que não pôde ser limpo) pra ficar
        // rastreável em /admin/errors — não grava em orgDeletionLog porque a
        // exclusão de fato não aconteceu
        logServerError('[DELETE /api/users/[id]] profile órfão com FK pendente', profileDeleteError, undefined, organizationId)
        return NextResponse.json(
          { error: 'Este usuário tem registros vinculados (ex: caixa ou ordens de serviço) que impedem a remoção completa. Fale com o suporte.' },
          { status: 409 }
        )
      }
    }

    await db.insert(orgDeletionLog).values({
      organizationId: user.organizationId,
      userId:         user.id,
      userEmail:      user.email,
      resourceType:   'user',
      resourceId:     id,
      snapshot: {
        nome: check[0].fullName,
        role: check[0].role,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    logServerError('[DELETE /api/users/[id]]', error, undefined, organizationId); console.error('[DELETE /api/users/[id]]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
