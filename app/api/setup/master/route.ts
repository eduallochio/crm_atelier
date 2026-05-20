import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { logServerError } from '@/lib/log-error'

function getAdminClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * POST /api/setup/master
 * Cria o usuário master do sistema via Supabase Admin API.
 * Protegido por SETUP_SECRET definido em .env.local.
 *
 * Body: { secret: string, email: string, password: string, fullName?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { secret, email, password, fullName = 'Master Admin' } = body

    const setupSecret = process.env.SETUP_SECRET
    if (!setupSecret) {
      return NextResponse.json({ error: 'SETUP_SECRET não configurado no servidor.' }, { status: 500 })
    }
    if (secret !== setupSecret) {
      return NextResponse.json({ error: 'Secret inválido.' }, { status: 403 })
    }
    if (!email || !password) {
      return NextResponse.json({ error: 'email e password são obrigatórios.' }, { status: 400 })
    }

    const adminSupabase = getAdminClient()

    // Check if user already exists by listing users and finding by email
    const { data: listData, error: listError } = await adminSupabase.auth.admin.listUsers()
    if (listError) {
      console.error('[POST /api/setup/master] listUsers error', listError)
      return NextResponse.json({ error: listError.message }, { status: 500 })
    }

    const existingUser = listData.users.find(u => u.email === email)

    if (existingUser) {
      // Promote existing user to master
      const { error: updateError } = await adminSupabase.auth.admin.updateUserById(existingUser.id, {
        password,
        app_metadata: { is_master: true },
      })
      if (updateError) {
        console.error('[POST /api/setup/master] updateUserById error', updateError)
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }

      // Update profiles table if it exists
      await adminSupabase
        .from('profiles')
        .update({ is_master: true, role: 'owner' })
        .eq('id', existingUser.id)

      return NextResponse.json({
        ok: true,
        message: `Usuário ${email} promovido a master com sucesso.`,
        action: 'promoted',
      })
    }

    // Create new master user
    const { data, error: createError } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    })

    if (createError || !data.user) {
      console.error('[POST /api/setup/master] createUser error', createError)
      return NextResponse.json({ error: createError?.message ?? 'Falha ao criar usuário' }, { status: 500 })
    }

    // Set master flag in app_metadata
    const { error: metaError } = await adminSupabase.auth.admin.updateUserById(data.user.id, {
      app_metadata: { is_master: true },
    })
    if (metaError) {
      console.error('[POST /api/setup/master] updateUserById metadata error', metaError)
      return NextResponse.json({ error: metaError.message }, { status: 500 })
    }

    // Insert into profiles with isMaster=true (best-effort — trigger may have already created it)
    await adminSupabase
      .from('profiles')
      .upsert({
        id: data.user.id,
        email,
        full_name: fullName,
        role: 'owner',
        is_master: true,
      }, { onConflict: 'id' })

    return NextResponse.json({
      ok: true,
      message: `Usuário master ${email} criado com sucesso.`,
      action: 'created',
    })
  } catch (error: unknown) {
    logServerError('[POST /api/setup/master]', error); console.error('[POST /api/setup/master]', error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

/**
 * GET /api/setup/master
 * Verifica se existe algum usuário master cadastrado.
 * Não requer autenticação — útil para o setup inicial.
 */
export async function GET() {
  try {
    const adminSupabase = getAdminClient()

    const { data, error } = await adminSupabase
      .from('profiles')
      .select('id')
      .eq('is_master', true)
      .limit(1)

    if (error) {
      // profiles table may not have is_master column yet
      return NextResponse.json({ hasMaster: false, reason: error.message })
    }

    return NextResponse.json({ hasMaster: (data?.length ?? 0) > 0, count: data?.length ?? 0 })
  } catch (error: unknown) {
    logServerError('[GET /api/setup/master]', error); console.error('[GET /api/setup/master]', error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
