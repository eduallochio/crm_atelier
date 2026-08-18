'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { loginSchema, type LoginInput } from '@/lib/validations/auth'
import { toast } from 'sonner'
import { login } from '../actions'
import { createClient } from '@/lib/supabase/client'

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

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,600&family=DM+Sans:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .lp-root {
          font-family: 'DM Sans', sans-serif;
          min-height: 100vh;
          display: flex;
          background: #fff8f0;
        }

        /* ── Left panel ── */
        .lp-panel {
          width: 44%;
          background: #2C1810;
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 52px 48px;
          overflow: hidden;
          flex-shrink: 0;
        }

        /* Woven grid overlay */
        .lp-panel::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px),
            linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px);
          background-size: 48px 48px, 48px 48px, 8px 8px, 8px 8px;
          pointer-events: none;
        }

        /* Decorative ring */
        .lp-ring {
          position: absolute;
          bottom: -100px;
          right: -100px;
          width: 480px;
          height: 480px;
          border-radius: 50%;
          border: 1px solid rgba(196,150,90,0.18);
          box-shadow:
            0 0 0 50px rgba(196,150,90,0.06),
            0 0 0 110px rgba(196,150,90,0.03);
          pointer-events: none;
        }

        /* Second accent ring top-left */
        .lp-ring2 {
          position: absolute;
          top: -60px;
          left: -60px;
          width: 200px;
          height: 200px;
          border-radius: 50%;
          border: 1px solid rgba(196,150,90,0.12);
          pointer-events: none;
        }

        .lp-top { position: relative; z-index: 1; }
        .lp-bottom { position: relative; z-index: 1; }

        .lp-brand {
          display: flex;
          align-items: center;
          gap: 11px;
          margin-bottom: 72px;
        }

        .lp-brand-mark {
          width: 38px;
          height: 38px;
          background: #d4a85a;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .lp-brand-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 20px;
          font-weight: 500;
          color: #fff8f0;
          letter-spacing: 0.06em;
        }

        .lp-headline {
          font-family: 'Cormorant Garamond', serif;
          font-size: 54px;
          font-weight: 300;
          line-height: 1.08;
          color: #fff8f0;
        }

        .lp-headline em {
          font-style: italic;
          color: #d4a85a;
          font-weight: 400;
        }

        .lp-sub {
          margin-top: 22px;
          font-size: 13.5px;
          font-weight: 300;
          color: rgba(254,252,249,0.42);
          line-height: 1.75;
          letter-spacing: 0.025em;
          max-width: 270px;
        }

        .lp-divider {
          width: 40px;
          height: 1px;
          background: rgba(196,150,90,0.45);
          margin: 36px 0;
        }

        .lp-features { display: flex; flex-direction: column; gap: 14px; }

        .lp-feat {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .lp-feat-dot {
          width: 5px;
          height: 5px;
          background: #d4a85a;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .lp-feat-text {
          font-size: 12.5px;
          font-weight: 300;
          color: rgba(254,252,249,0.48);
          letter-spacing: 0.03em;
        }

        /* ── Right form side ── */
        .lp-form-side {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px 60px;
        }

        .lp-form-box {
          width: 100%;
          max-width: 380px;
          animation: fadeUp 0.45s cubic-bezier(0.22,1,0.36,1) both;
          animation-delay: 0.05s;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .lp-form-eyebrow {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #d4a85a;
          margin-bottom: 10px;
        }

        .lp-form-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 40px;
          font-weight: 400;
          color: #2C1810;
          letter-spacing: -0.01em;
          line-height: 1.1;
          margin-bottom: 8px;
        }

        .lp-form-desc {
          font-size: 13.5px;
          font-weight: 300;
          color: #a07850;
          margin-bottom: 40px;
          letter-spacing: 0.01em;
        }

        .lp-field { margin-bottom: 28px; }

        .lp-label {
          display: block;
          font-size: 10.5px;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #7a6a5a;
          margin-bottom: 10px;
        }

        .lp-input-wrap { position: relative; }

        .lp-input {
          width: 100%;
          height: 46px;
          background: transparent;
          border: none;
          border-bottom: 1.5px solid #e8ddd0;
          padding: 0 40px 0 2px;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 400;
          color: #2C1810;
          outline: none;
          transition: border-color 0.2s;
          border-radius: 0;
          -webkit-appearance: none;
          appearance: none;
        }

        .lp-input::placeholder {
          color: #C4B8AE;
          font-weight: 300;
        }

        .lp-input:focus { border-bottom-color: #d4a85a; }

        .lp-eye {
          position: absolute;
          right: 2px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #B0A49A;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
          transition: color 0.2s;
        }
        .lp-eye:hover { color: #2C1810; }

        .lp-err {
          margin-top: 6px;
          font-size: 12px;
          color: #C0564A;
          font-weight: 400;
        }

        .lp-sep {
          height: 1px;
          background: linear-gradient(to right, #E8E1D8, transparent);
          margin: 36px 0;
        }

        .lp-btn {
          width: 100%;
          height: 50px;
          background: #2C1810;
          color: #fff8f0;
          border: none;
          border-radius: 5px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          cursor: pointer;
          transition: background 0.25s, transform 0.12s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .lp-btn:hover:not(:disabled) { background: #d4a85a; }
        .lp-btn:active:not(:disabled) { transform: scale(0.985); }
        .lp-btn:disabled { opacity: 0.55; cursor: not-allowed; }

        .lp-spinner {
          width: 15px;
          height: 15px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.65s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .lp-register {
          margin-top: 26px;
          text-align: center;
          font-size: 13px;
          font-weight: 300;
          color: #a07850;
        }

        .lp-register a {
          color: #d4a85a;
          text-decoration: none;
          font-weight: 500;
          transition: opacity 0.2s;
        }
        .lp-register a:hover { opacity: 0.7; }

        .lp-divider-or {
          display: flex; align-items: center; gap: 12px; margin: 24px 0;
        }
        .lp-divider-or::before, .lp-divider-or::after {
          content: ''; flex: 1; height: 1px; background: #E8E1D8;
        }
        .lp-divider-or span {
          font-size: 11px; color: #C4B8AE; letter-spacing: 0.08em; text-transform: uppercase;
        }

        .lp-btn-google {
          width: 100%; height: 46px; background: #fff; color: #2C1810;
          border: 1.5px solid #E8E1D8; border-radius: 5px;
          font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500;
          letter-spacing: 0.03em; cursor: pointer;
          transition: border-color 0.2s, background 0.2s;
          display: flex; align-items: center; justify-content: center; gap: 10px;
        }
        .lp-btn-google:hover:not(:disabled) { border-color: #d4a85a; background: #fffbf5; }
        .lp-btn-google:disabled { opacity: 0.55; cursor: not-allowed; }

        @media (max-width: 840px) {
          .lp-panel { display: none; }
          .lp-form-side { padding: 40px 24px; }
        }
      `}</style>

      <div className="lp-root">
        {/* ── Left panel ── */}
        <div className="lp-panel">
          <div className="lp-ring" />
          <div className="lp-ring2" />

          <div className="lp-top">
            <div className="lp-brand">
              <div className="lp-brand-mark">
                {/* Scissors icon */}
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none"
                  stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="6" cy="6" r="3" />
                  <circle cx="6" cy="18" r="3" />
                  <line x1="20" y1="4" x2="8.12" y2="15.88" />
                  <line x1="14.47" y1="14.48" x2="20" y2="20" />
                  <line x1="8.12" y1="8.12" x2="12" y2="12" />
                </svg>
              </div>
              <span className="lp-brand-name">Meu Atelier</span>
            </div>

            <h1 className="lp-headline">
              Gerencie seu<br />atelier com<br /><em>precisão.</em>
            </h1>
            <p className="lp-sub">
              Do pedido ao acabamento — cada detalhe do seu negócio em um só lugar.
            </p>
          </div>

          <div className="lp-bottom">
            <div className="lp-divider" />
            <div className="lp-features">
              {[
                'Ordens de serviço e acompanhamento',
                'Controle financeiro completo',
                'Gestão de estoque e materiais',
                'Clientes e histórico de pedidos',
              ].map((f) => (
                <div className="lp-feat" key={f}>
                  <div className="lp-feat-dot" />
                  <span className="lp-feat-text">{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right form ── */}
        <div className="lp-form-side">
          <div className="lp-form-box">
            <p className="lp-form-eyebrow">Acesso à plataforma</p>
            <h2 className="lp-form-title">Bem-vindo<br />de volta</h2>
            <p className="lp-form-desc">Entre com sua conta para continuar</p>

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="lp-field">
                <label className="lp-label" htmlFor="email">E-mail</label>
                <div className="lp-input-wrap">
                  <input
                    id="email"
                    type="email"
                    className="lp-input"
                    placeholder="seu@email.com"
                    autoComplete="email"
                    {...register('email')}
                    disabled={isLoading}
                  />
                </div>
                {errors.email && <p className="lp-err">{errors.email.message}</p>}
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
                    {...register('password')}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="lp-eye"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showPassword ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
                {errors.password && <p className="lp-err">{errors.password.message}</p>}
              </div>

              <div style={{ textAlign: 'right', marginTop: '-18px', marginBottom: '28px' }}>
                <Link href="/esqueci-senha" style={{ fontSize: '12px', color: '#d4a85a', textDecoration: 'none', fontWeight: 400, letterSpacing: '0.02em' }}>
                  Esqueci minha senha
                </Link>
              </div>

              <div className="lp-sep" />

              <button type="submit" className="lp-btn" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <span className="lp-spinner" />
                    Entrando...
                  </>
                ) : 'Entrar'}
              </button>
            </form>

            <div className="lp-divider-or"><span>ou</span></div>

            <button
              type="button"
              className="lp-btn-google"
              disabled={isGoogleLoading || isLoading}
              onClick={async () => {
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
              }}
            >
                {isGoogleLoading ? (
                  <span className="lp-spinner" style={{ borderColor: 'rgba(0,0,0,0.15)', borderTopColor: '#2C1810' }} />
                ) : (
                  <svg width="18" height="18" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                    <path fill="none" d="M0 0h48v48H0z"/>
                  </svg>
                )}
                {isGoogleLoading ? 'Redirecionando...' : 'Entrar com Google'}
            </button>

            <p className="lp-register">
              Não tem uma conta?{' '}
              <Link href="/cadastro">Cadastre-se gratuitamente</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
