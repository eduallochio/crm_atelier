'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { Check } from 'lucide-react'
import { loginSchema, type LoginInput } from '@/lib/validations/auth'
import { toast } from 'sonner'
import { login } from '../actions'
import { createClient } from '@/lib/supabase/client'
import AuthShell, { EyeIcon, GoogleIcon } from '@/components/auth/auth-shell'

const FEATURES = [
  'Ordens de serviço e acompanhamento',
  'Controle financeiro completo',
  'Gestão de estoque e materiais',
  'Clientes e histórico de pedidos',
]

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true)
    const formData = new FormData()
    formData.append('email', data.email)
    formData.append('password', data.password)
    try {
      const result = await login(formData)
      if (result?.error) {
        toast.error(result.error)
      }
    } catch (error) {
      // NEXT_REDIRECT é lançado pelo redirect() em login bem-sucedido — repassar
      if (error instanceof Error && error.message.startsWith('NEXT_REDIRECT')) throw error
      toast.error('Erro de conexão com o servidor. Tente novamente.')
    } finally {
      // Reseta loading em todos os casos exceto redirect (que navega para outra página)
      setIsLoading(false)
    }
  }

  const onGoogle = async () => {
    setIsGoogleLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    })
    if (error) { toast.error('Erro ao iniciar login com Google.'); setIsGoogleLoading(false) }
  }

  return (
    <AuthShell
      headline={<>Seu ateliê,<br /><em>organizado</em><br />como merece.</>}
      sub="Do pedido ao acabamento — cada detalhe do seu negócio em um só lugar."
      panelFooter={
        <ul className="lp-features">
          {FEATURES.map((f) => (
            <li key={f}><Check size={15} strokeWidth={2.4} aria-hidden="true" />{f}</li>
          ))}
        </ul>
      }
    >
      <div className="lp-form-box">
        <p className="lp-eyebrow">Acesso à plataforma</p>
        <h1 className="lp-title lp-serif">Que bom te ver<br /><em>de novo.</em></h1>
        <p className="lp-desc">Entre com sua conta para continuar</p>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="lp-field">
            <label className="lp-label" htmlFor="email">E-mail</label>
            <div className="lp-input-wrap">
              <input
                id="email"
                type="email"
                inputMode="email"
                className="lp-input"
                placeholder="seu@email.com"
                autoComplete="email"
                aria-invalid={errors.email ? 'true' : 'false'}
                aria-describedby={errors.email ? 'email-err' : undefined}
                {...register('email')}
                disabled={isLoading}
              />
            </div>
            {errors.email && <p id="email-err" className="lp-err">{errors.email.message}</p>}
          </div>

          <div className="lp-field">
            <label className="lp-label" htmlFor="password">Senha</label>
            <div className="lp-input-wrap">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="lp-input"
                placeholder="••••••••"
                autoComplete="current-password"
                aria-invalid={errors.password ? 'true' : 'false'}
                aria-describedby={errors.password ? 'password-err' : undefined}
                {...register('password')}
                disabled={isLoading}
              />
              <button
                type="button"
                className="lp-eye"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Mostrar senha"
                aria-pressed={showPassword}
                aria-controls="password"
              >
                <EyeIcon open={showPassword} />
              </button>
            </div>
            {errors.password && <p id="password-err" className="lp-err">{errors.password.message}</p>}
          </div>

          <div className="lp-forgot">
            <Link href="/esqueci-senha">Esqueci minha senha</Link>
          </div>

          <button type="submit" className="lp-btn" disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="lp-spinner" aria-hidden="true" />
                Entrando...
              </>
            ) : 'Entrar'}
          </button>
        </form>

        <div className="lp-or"><span>ou</span></div>

        <button
          type="button"
          className="lp-btn-google"
          disabled={isGoogleLoading || isLoading}
          onClick={onGoogle}
        >
          {isGoogleLoading ? <span className="lp-spinner dark" aria-hidden="true" /> : <GoogleIcon />}
          {isGoogleLoading ? 'Redirecionando...' : 'Entrar com Google'}
        </button>

        <p className="lp-register">
          Não tem uma conta?{' '}
          <Link href="/cadastro">Cadastre-se gratuitamente</Link>
        </p>
      </div>
    </AuthShell>
  )
}
