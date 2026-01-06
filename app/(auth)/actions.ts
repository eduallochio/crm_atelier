'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string

  // Criar usuário
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        fullName: fullName, // Adicionar ambos os formatos
      },
    },
  })

  if (authError) {
    console.error('Auth error:', authError)
    return { error: authError.message }
  }

  if (!authData.user) {
    return { error: 'Erro ao criar usuário' }
  }

  // Aguardar um pouco para o trigger executar
  await new Promise(resolve => setTimeout(resolve, 1500))

  // Verificar se o perfil foi criado
  let profile = null
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('*, organization:organizations(*)')
    .eq('id', authData.user.id)
    .maybeSingle()

  profile = existingProfile

  if (!profile) {
    console.log('Profile not found, creating manually...')
    
    // Usar service_role para bypass RLS na criação inicial
    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    
    try {
      // Verificar se já existe organização para esse usuário
      const { data: existingOrg } = await adminClient
        .from('organizations')
        .select('*')
        .eq('slug', `atelier-${authData.user.id.substring(0, 8)}`)
        .maybeSingle()

      let org = existingOrg

      if (!org) {
        // Criar organização com slug único usando timestamp
        const uniqueSlug = `atelier-${authData.user.id.substring(0, 8)}-${Date.now()}`
        const { data: newOrg, error: orgError } = await adminClient
          .from('organizations')
          .insert({
            name: `${fullName} Atelier`,
            slug: uniqueSlug,
            plan: 'free',
          })
          .select()
          .single()

        if (orgError) {
          console.error('Org creation error:', orgError)
          throw orgError
        }
        org = newOrg
      }

      // Verificar se perfil já existe
      const { data: existingProfileCheck } = await adminClient
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .maybeSingle()

      if (!existingProfileCheck) {
        // Criar perfil
        const { error: profileInsertError } = await adminClient
          .from('profiles')
          .insert({
            id: authData.user.id,
            organization_id: org.id,
            email: email,
            full_name: fullName,
            role: 'owner',
            is_owner: true,
          })

        if (profileInsertError) {
          console.error('Profile insert error:', profileInsertError)
          throw profileInsertError
        }
      }

      // Verificar se métricas já existem
      const { data: existingMetrics } = await adminClient
        .from('usage_metrics')
        .select('*')
        .eq('organization_id', org.id)
        .maybeSingle()

      if (!existingMetrics) {
        // Criar métricas
        const { error: metricsError } = await adminClient
          .from('usage_metrics')
          .insert({
            organization_id: org.id,
            users_count: 1,
            clients_count: 0,
            orders_count: 0,
          })

        if (metricsError) {
          console.error('Metrics error:', metricsError)
        }
      }

      // Verificar se customização já existe
      const { data: existingCustom } = await adminClient
        .from('customization_settings')
        .select('*')
        .eq('organization_id', org.id)
        .maybeSingle()

      if (!existingCustom) {
        // Criar customização
        const { error: customError } = await adminClient
          .from('customization_settings')
          .insert({
            organization_id: org.id,
            primary_color: '#3b82f6',
            secondary_color: '#10b981',
          })

        if (customError) {
          console.error('Customization error:', customError)
        }
      }

    } catch (manualError) {
      console.error('Manual creation error:', manualError)
      return { error: 'Erro ao configurar conta. Tente novamente.' }
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
