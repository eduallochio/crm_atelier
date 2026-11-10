'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })

  if (error) {
    return { error: 'Email ou senha incorretos.' }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  // Verifica se cadastros estão habilitados
  try {
    const { db } = await import('@/lib/db')
    const { adminSystemSettings } = await import('@/lib/db/schema')
    const { eq } = await import('drizzle-orm')
    const [row] = await db
      .select({ value: adminSystemSettings.value })
      .from(adminSystemSettings)
      .where(eq(adminSystemSettings.key, 'enable_signup'))
      .limit(1)
    if (row && row.value === 'false') {
      return { error: 'Novos cadastros estão temporariamente desabilitados.' }
    }
  } catch {
    // Falha silenciosa — não bloqueia o cadastro se a consulta falhar
  }

  const supabase = await createClient()

  const email      = formData.get('email')       as string
  const password   = formData.get('password')    as string
  const fullName   = formData.get('fullName')    as string
  const atelierName = formData.get('atelierName') as string | null
  const document   = formData.get('document')    as string | null
  const phone      = formData.get('phone')       as string | null
  const city       = formData.get('city')        as string | null
  const state      = formData.get('state')       as string | null

  const { data: signUpData, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name:    fullName,
        atelier_name: atelierName?.trim() || fullName,
        document:     document  || null,
        phone:        phone     || null,
        city:         city      || null,
        state:        state     || null,
      },
    },
  })

  if (error) {
    if (error.message.includes('already registered')) {
      return { error: 'Este email já está cadastrado.' }
    }
    return { error: 'Erro ao criar sua conta. Tente novamente.' }
  }

  const userId = signUpData.user?.id

  // Notificação Telegram — nova organização cadastrada (roda primeiro: não depende do pool do Drizzle)
  try {
    const { notificarTelegram } = await import('@/lib/telegram')
    const nomeAtelier = (formData.get('atelierName') as string | null)?.trim() || fullName
    const cidade = formData.get('city') as string | null
    const estado = formData.get('state') as string | null
    const localizacao = cidade ? `${cidade}${estado ? '/' + estado : ''}` : null
    await notificarTelegram(
      `🆕 <b>Nova organização cadastrada</b>\n👤 ${fullName}\n📧 ${email}\n🏪 ${nomeAtelier}${localizacao ? `\n📍 ${localizacao}` : ''}`
    )
  } catch { /* não bloqueia o cadastro */ }

  // Email de confirmação via Resend (substituindo o email padrão do Supabase)
  try {
    console.log('[signup] RESEND_API_KEY presente:', !!process.env.RESEND_API_KEY)
    const { createClient: createServiceClient } = await import('@supabase/supabase-js')
    const adminSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
    const { data: linkData } = await adminSupabase.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: { redirectTo: `${siteUrl}/dashboard` },
    })
    if (linkData?.properties?.action_link) {
      const { sendConfirmarEmail } = await import('@/lib/email')
      await sendConfirmarEmail(email, linkData.properties.action_link)
      console.log('[signup] email confirmação enviado para', email)
    }
  } catch (err) { console.error('[signup] erro email confirmação:', err) }

  // Email de boas-vindas — disparo assíncrono, não bloqueia o redirect
  try {
    const { sendBoasVindas } = await import('@/lib/email')
    await sendBoasVindas(email, fullName)
    console.log('[signup] email boas-vindas enviado para', email)
  } catch (err) { console.error('[signup] erro email boas-vindas:', err) }

  // Atualiza a organização com os dados extras usando o service role
  // (funciona mesmo com confirmação de email pendente) — roda depois das notificações
  // porque usa o pool do Drizzle e pode demorar esperando o trigger handle_new_user
  if (userId && (atelierName || document || phone || city || state)) {
    try {
      const { db } = await import('@/lib/db')
      const { organizations, profiles } = await import('@/lib/db/schema')
      const { eq } = await import('drizzle-orm')

      // Aguarda até 1.2s o trigger handle_new_user criar o profile
      let orgId: string | null = null
      for (let i = 0; i < 4; i++) {
        const [profile] = await db
          .select({ organizationId: profiles.organizationId })
          .from(profiles)
          .where(eq(profiles.id, userId))
          .limit(1)
        if (profile?.organizationId) { orgId = profile.organizationId; break }
        await new Promise(r => setTimeout(r, 300))
      }

      if (orgId) {
        await db
          .update(organizations)
          .set({
            name:      atelierName?.trim() || fullName,
            cnpj:      document || null,
            phone:     phone    || null,
            city:      city     || null,
            state:     state    || null,
            updatedAt: new Date(),
          })
          .where(eq(organizations.id, orgId))
      }
    } catch {
      // Não bloqueia o cadastro se a atualização falhar
    }
  }

  // Grava evento de conversão antes do redirect (Server Action — cliente não executa mais após redirect)
  try {
    const { db: dbInst } = await import('@/lib/db')
    const { pageEvents } = await import('@/lib/db/schema')
    await dbInst.insert(pageEvents).values({
      page:  '/cadastro',
      event: 'signup_completed',
      data:  { source: 'server_action' },
    })
  } catch { /* não bloqueia o cadastro */ }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

export async function forgotPassword(formData: FormData) {
  const email = formData.get('email') as string

  if (!email) return { error: 'Informe seu e-mail.' }

  try {
    const { createClient: createServiceClient } = await import('@supabase/supabase-js')
    const adminSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
    const { data: linkData, error } = await adminSupabase.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo: `${siteUrl}/redefinir-senha` },
    })
    if (error) return { error: 'Erro ao enviar e-mail. Tente novamente.' }
    if (linkData?.properties?.action_link) {
      const { sendRedefinirSenha } = await import('@/lib/email')
      await sendRedefinirSenha(email, linkData.properties.action_link)
    }
  } catch {
    return { error: 'Erro ao enviar e-mail. Tente novamente.' }
  }

  return { success: true }
}

export async function resetPassword(formData: FormData) {
  const supabase = await createClient()
  const password = formData.get('password') as string
  const confirm = formData.get('confirmPassword') as string

  if (!password || password.length < 6)
    return { error: 'A senha deve ter no mínimo 6 caracteres.' }
  if (password !== confirm)
    return { error: 'As senhas não coincidem.' }

  const { error } = await supabase.auth.updateUser({ password })

  if (error) return { error: 'Erro ao redefinir senha. O link pode ter expirado.' }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function resendConfirmation(formData: FormData) {
  const email = formData.get('email') as string

  if (!email) return { error: 'Informe seu e-mail.' }

  try {
    const { createClient: createServiceClient } = await import('@supabase/supabase-js')
    const adminSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
    const { data: linkData, error } = await adminSupabase.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: { redirectTo: `${siteUrl}/dashboard` },
    })
    if (error) return { error: 'Erro ao reenviar e-mail. Tente novamente.' }
    if (linkData?.properties?.action_link) {
      const { sendConfirmarEmail } = await import('@/lib/email')
      await sendConfirmarEmail(email, linkData.properties.action_link)
    }
  } catch {
    return { error: 'Erro ao reenviar e-mail. Tente novamente.' }
  }

  return { success: true }
}
