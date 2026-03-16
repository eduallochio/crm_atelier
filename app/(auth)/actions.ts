'use server'

import { signIn, signOut } from '@/auth'
import { getPool, sql } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { AuthError } from 'next-auth'

export async function login(formData: FormData) {
  try {
    await signIn('credentials', {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      redirect: false,
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: 'Email ou senha incorretos.' }
    }
    throw error
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string

  const pool = await getPool()

  // Verificar se email já existe
  const existing = await pool
    .request()
    .input('email', sql.NVarChar, email)
    .query('SELECT id FROM users WHERE email = @email')

  if (existing.recordset.length > 0) {
    return { error: 'Este email já está cadastrado.' }
  }

  const passwordHash = await bcrypt.hash(password, 12)

  // Criar organização + usuário + métricas + customização em uma única transação
  const transaction = new sql.Transaction(pool)

  try {
    await transaction.begin()

    const orgSlug = `atelier-${Date.now()}`
    const orgName = `${fullName} Atelier`

    // 1. Organização
    const orgResult = await new sql.Request(transaction)
      .input('name', sql.NVarChar, orgName)
      .input('slug', sql.NVarChar, orgSlug)
      .query(`
        INSERT INTO organizations (name, slug, plan)
        OUTPUT INSERTED.id
        VALUES (@name, @slug, 'free')
      `)

    const orgId: string = orgResult.recordset[0].id

    // 2. Usuário
    await new sql.Request(transaction)
      .input('orgId', sql.UniqueIdentifier, orgId)
      .input('email', sql.NVarChar, email)
      .input('passwordHash', sql.NVarChar, passwordHash)
      .input('fullName', sql.NVarChar, fullName)
      .query(`
        INSERT INTO users (organization_id, email, password_hash, full_name, [role], is_owner)
        VALUES (@orgId, @email, @passwordHash, @fullName, 'owner', 1)
      `)

    // 3. Métricas de uso
    await new sql.Request(transaction)
      .input('orgId', sql.UniqueIdentifier, orgId)
      .query(`
        INSERT INTO usage_metrics (organization_id, clients_count, orders_count, users_count)
        VALUES (@orgId, 0, 0, 1)
      `)

    // 4. Customização padrão
    await new sql.Request(transaction)
      .input('orgId', sql.UniqueIdentifier, orgId)
      .query(`
        INSERT INTO customization_settings (organization_id, primary_color, secondary_color)
        VALUES (@orgId, '#3b82f6', '#10b981')
      `)

    await transaction.commit()
  } catch (error) {
    await transaction.rollback()
    console.error('[signup] Erro ao criar conta:', error)
    return { error: 'Erro ao criar sua conta. Tente novamente.' }
  }

  // Login automático após cadastro
  try {
    await signIn('credentials', {
      email,
      password,
      redirect: false,
    })
  } catch {
    redirect('/login')
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function logout() {
  await signOut({ redirect: false })
  revalidatePath('/', 'layout')
  redirect('/login')
}
