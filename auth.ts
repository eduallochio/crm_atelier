import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { getPool, sql } from '@/lib/db'

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        try {
          const pool = await getPool()
          const result = await pool
            .request()
            .input('email', sql.NVarChar, credentials.email as string)
            .query(`
              SELECT id, email, password_hash, full_name, organization_id, [role], is_owner, is_master
              FROM users
              WHERE email = @email
            `)

          const user = result.recordset[0]
          if (!user) {
            console.error('[auth] Usuário não encontrado:', credentials.email)
            return null
          }

          const valid = await bcrypt.compare(credentials.password as string, user.password_hash)
          if (!valid) {
            console.error('[auth] Senha incorreta para:', credentials.email)
            return null
          }

          return {
            id: user.id,
            email: user.email,
            name: user.full_name,
            organizationId: user.organization_id,
            role: user.role,
            isOwner: user.is_owner === true || user.is_owner === 1,
            isMaster: user.is_master === true || user.is_master === 1,
          }
        } catch (error) {
          console.error('[auth] Erro na query de autenticação:', error)
          return null
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string
        token.organizationId = (user as any).organizationId as string
        token.role = (user as any).role as string
        token.isOwner = (user as any).isOwner as boolean
        token.isMaster = (user as any).isMaster as boolean
      }
      return token
    },
    session({ session, token }) {
      session.user.id = token.id as string
      session.user.organizationId = token.organizationId as string
      session.user.role = token.role as string
      session.user.isOwner = token.isOwner as boolean
      session.user.isMaster = token.isMaster as boolean
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
  },
})
