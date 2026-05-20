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
  const supabase = await createClient()

  const email      = formData.get('email')       as string
  const password   = formData.get('password')    as string
  const fullName   = formData.get('fullName')    as string
  const atelierName = formData.get('atelierName') as string | null
  const document   = formData.get('document')    as string | null
  const phone      = formData.get('phone')       as string | null
  const city       = formData.get('city')        as string | null
  const state      = formData.get('state')       as string | null

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: atelierName?.trim() || fullName,
      },
    },
  })

  if (error) {
    if (error.message.includes('already registered')) {
      return { error: 'Este email já está cadastrado.' }
    }
    return { error: 'Erro ao criar sua conta. Tente novamente.' }
  }

  // Após signup, atualiza a organização criada pelo trigger com os dados extras
  // Aguarda breve instante para o trigger handle_new_user ter tempo de executar
  if (atelierName || document || phone || city || state) {
    try {
      const { db } = await import('@/lib/db')
      const { organizations, profiles } = await import('@/lib/db/schema')
      const { eq } = await import('drizzle-orm')

      // Busca o user recém-criado para obter o organization_id via profile
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Aguarda até 2s o trigger criar o profile
        let orgId: string | null = null
        for (let i = 0; i < 4; i++) {
          const [profile] = await db
            .select({ organizationId: profiles.organizationId })
            .from(profiles)
            .where(eq(profiles.id, user.id))
            .limit(1)
          if (profile?.organizationId) { orgId = profile.organizationId; break }
          await new Promise(r => setTimeout(r, 500))
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
      }
    } catch {
      // Não bloqueia o cadastro se a atualização falhar
    }
  }

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
  const supabase = await createClient()
  const email = formData.get('email') as string

  if (!email) return { error: 'Informe seu e-mail.' }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/redefinir-senha`,
  })

  if (error) return { error: 'Erro ao enviar e-mail. Tente novamente.' }

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
  const supabase = await createClient()
  const email = formData.get('email') as string

  if (!email) return { error: 'Informe seu e-mail.' }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo: `${siteUrl}/dashboard`,
    },
  })

  if (error) return { error: 'Erro ao reenviar e-mail. Tente novamente.' }

  return { success: true }
}
