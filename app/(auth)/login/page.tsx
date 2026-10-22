'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Check } from 'lucide-react'
import { loginSchema, type LoginInput } from '@/lib/validations/auth'
import { toast } from 'sonner'
import { login } from '../actions'
import { createClient } from '@/lib/supabase/client'
import SewingMachine, { type SewingMachineHandle } from '@/components/landing/atelier/sewing-machine'
import { MotionProvider, useMotionPref } from '@/components/landing/atelier/motion'
import { dmSans } from '@/components/landing/atelier/fonts'

const FEATURES = [
  'Ordens de serviço e acompanhamento',
  'Controle financeiro completo',
  'Gestão de estoque e materiais',
  'Clientes e histórico de pedidos',
]

export default function LoginPage() {
  return (
    <MotionProvider>
      <Login />
    </MotionProvider>
  )
}

function Login() {
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const motion = useMotionPref()
  const machine = useRef<SewingMachineHandle>(null)
  const stitch = useRef<SVGLineElement>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  // a máquina dá só uma costurada curta quando a tela abre (tela de tarefa: movimento mínimo)
  useEffect(() => {
    if (!motion.enabled) return
    const t = setTimeout(() => machine.current?.sew(2.4, 1.8), 350)
    return () => clearTimeout(t)
  }, [motion.enabled])

  const onStitch = useCallback((off: number) => { stitch.current?.setAttribute('stroke-dashoffset', off.toFixed(2)) }, [])

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
    <div className={`${dmSans.variable} lp-root`}>
      <style>{`
        .lp-root {
          --ink: #2C1810; --cream: #F7F0E6; --terra: #C8714A; --terra-dark: #8A4B2C; --gold: #D4A85A; --mid: #6E5E4F; --card: #FFF8F0;
          --f-sans: var(--font-dm-sans), 'DM Sans', system-ui, sans-serif;
          --f-serif: var(--font-cormorant), 'Cormorant Garamond', Georgia, serif;
          font-family: var(--f-sans);
          min-height: 100vh; min-height: 100dvh;
          display: flex;
          background: var(--card);
          color: var(--ink);
        }
        .lp-root *, .lp-root *::before, .lp-root *::after { box-sizing: border-box; }
        .lp-serif { font-family: var(--f-serif); font-weight: 300; letter-spacing: -0.01em; }

        .lp-linen {
          background-color: var(--ink);
          background-image: repeating-linear-gradient(0deg, rgba(255,255,255,.014) 0 1px, transparent 1px 4px), repeating-linear-gradient(90deg, rgba(255,255,255,.014) 0 1px, transparent 1px 4px);
        }
        .lp-brand { display: inline-flex; align-items: center; gap: 10px; text-decoration: none; }
        .lp-brand img { border-radius: 8px; }
        .lp-brand span { font-size: 21px; font-weight: 600; letter-spacing: .04em; color: var(--cream); }
        .lp-brand span b { color: var(--terra); font-weight: 600; }

        /* ── painel ── */
        .lp-panel { width: 46%; max-width: 680px; position: relative; display: flex; flex-direction: column; padding: 44px clamp(32px, 4vw, 56px); overflow: hidden; flex-shrink: 0; color: var(--cream); }
        .lp-headline { margin: 56px 0 0; font-size: clamp(44px, 4.4vw, 60px); line-height: 1.02; color: var(--cream); }
        .lp-headline em { font-style: italic; color: var(--terra); }
        .lp-sub { margin: 20px 0 0; max-width: 360px; font-size: 15px; line-height: 1.7; color: rgba(247,240,230,.74); }
        .lp-machine { position: relative; margin: auto 0 0; padding-top: 28px; width: min(100%, 460px); }
        .lp-stitch { display: block; width: 100%; height: 6px; margin: 22px 0 22px; overflow: visible; }
        .lp-features { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 12px 20px; }
        .lp-features li { display: flex; gap: 10px; align-items: flex-start; font-size: 13.5px; line-height: 1.45; color: rgba(247,240,230,.78); }
        .lp-features svg { flex: none; margin-top: 2px; color: var(--gold); }

        /* ── formulário ── */
        .lp-form-side { flex: 1; display: flex; flex-direction: column; padding: 28px clamp(24px, 5vw, 64px) 40px; min-width: 0; }
        .lp-top { display: flex; align-items: center; justify-content: flex-end; gap: 16px; min-height: 44px; }
        .lp-top .lp-brand { display: none; }
        .lp-top .lp-brand span { color: var(--ink); font-size: 19px; }
        .lp-back { display: inline-flex; align-items: center; gap: 8px; min-height: 44px; font-size: 13px; color: var(--mid); text-decoration: none; letter-spacing: .02em; }
        .lp-back:hover { color: var(--ink); }
        .lp-center { flex: 1; display: flex; align-items: center; justify-content: center; padding: 24px 0; }
        .lp-form-box { width: 100%; max-width: 380px; }
        @media (prefers-reduced-motion: no-preference) {
          .lp-form-box { animation: lp-up .5s cubic-bezier(.2,.7,.2,1) .05s backwards; }
        }
        @keyframes lp-up { from { opacity: 0; transform: translateY(16px); } }

        .lp-eyebrow { margin: 0 0 10px; font-size: 11px; font-weight: 600; letter-spacing: .16em; text-transform: uppercase; color: var(--terra-dark); }
        .lp-title { margin: 0 0 10px; font-size: clamp(38px, 4vw, 46px); line-height: 1.04; color: var(--ink); }
        .lp-title em { font-style: italic; color: var(--terra); }
        .lp-desc { margin: 0 0 36px; font-size: 14.5px; color: var(--mid); }

        .lp-field { margin-bottom: 26px; }
        .lp-label { display: block; margin-bottom: 8px; font-size: 11px; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; color: var(--mid); }
        .lp-input-wrap { position: relative; }
        .lp-input {
          width: 100%; height: 48px; padding: 0 44px 0 2px;
          background: transparent; border: 0; border-bottom: 1.5px solid #D9CBB9; border-radius: 0;
          font: 400 16px var(--f-sans); color: var(--ink); outline: none;
          transition: border-color .2s; -webkit-appearance: none; appearance: none;
        }
        .lp-input::placeholder { color: #9C8C7C; font-weight: 300; }
        .lp-input:focus { border-bottom-color: var(--terra); box-shadow: 0 1.5px 0 var(--terra); }
        .lp-input[aria-invalid="true"] { border-bottom-color: #B3412F; }
        .lp-eye {
          position: absolute; right: 0; top: 50%; transform: translateY(-50%);
          width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;
          background: none; border: 0; border-radius: 6px; cursor: pointer; color: #8C7C6C; transition: color .2s;
        }
        .lp-eye:hover { color: var(--ink); }
        .lp-eye:focus-visible { outline: 2px solid var(--terra); outline-offset: 1px; }
        .lp-err { margin: 6px 0 0; font-size: 12.5px; color: #A33A2A; }

        .lp-forgot { display: flex; justify-content: flex-end; margin: -12px 0 28px; }
        .lp-forgot a { font-size: 13px; color: var(--terra-dark); text-decoration: none; padding: 4px 0; }
        .lp-forgot a:hover { text-decoration: underline; text-underline-offset: 3px; }

        .lp-btn {
          width: 100%; min-height: 50px; display: flex; align-items: center; justify-content: center; gap: 10px;
          background: var(--terra); color: var(--card); border: 1px solid transparent; border-radius: 2px;
          font: 500 13px var(--f-sans); letter-spacing: .12em; text-transform: uppercase; cursor: pointer;
          transition: background-color .3s cubic-bezier(.4,0,.2,1), transform .3s cubic-bezier(.4,0,.2,1);
        }
        .lp-btn:hover:not(:disabled) { background: #B45E37; transform: translateY(-1px); }
        .lp-btn:active:not(:disabled) { transform: scale(.985); }
        .lp-btn:disabled { opacity: .6; cursor: not-allowed; }
        .lp-btn:focus-visible, .lp-btn-google:focus-visible, .lp-back:focus-visible, .lp-forgot a:focus-visible, .lp-register a:focus-visible { outline: 2px solid var(--terra); outline-offset: 3px; }

        .lp-spinner { width: 15px; height: 15px; border: 2px solid rgba(255,255,255,.35); border-top-color: #fff; border-radius: 50%; animation: lp-spin .65s linear infinite; }
        @keyframes lp-spin { to { transform: rotate(360deg); } }

        .lp-or { display: flex; align-items: center; gap: 12px; margin: 24px 0; }
        .lp-or::before, .lp-or::after { content: ''; flex: 1; border-top: 1px dashed #D9CBB9; }
        .lp-or span { font-size: 11px; color: #8C7C6C; letter-spacing: .1em; text-transform: uppercase; }

        .lp-btn-google {
          width: 100%; min-height: 48px; display: flex; align-items: center; justify-content: center; gap: 10px;
          background: #fff; color: var(--ink); border: 1.5px solid #E2D6C6; border-radius: 2px;
          font: 500 14px var(--f-sans); cursor: pointer; transition: border-color .2s, background-color .2s;
        }
        .lp-btn-google:hover:not(:disabled) { border-color: var(--gold); background: #FFFBF5; }
        .lp-btn-google:disabled { opacity: .6; cursor: not-allowed; }

        .lp-register { margin: 26px 0 0; text-align: center; font-size: 14px; color: var(--mid); }
        .lp-register a { color: var(--terra-dark); font-weight: 600; text-decoration: none; }
        .lp-register a:hover { text-decoration: underline; text-underline-offset: 3px; }

        @media (max-width: 900px) {
          .lp-panel { display: none; }
          .lp-top { justify-content: space-between; }
          .lp-top .lp-brand { display: inline-flex; }
        }
        @media (max-width: 420px) {
          .lp-back span { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
          .lp-back { min-width: 44px; justify-content: center; }
        }
      `}</style>

      {/* ── Painel ── */}
      <aside className="lp-panel lp-linen">
        <Link href="/" className="lp-brand" aria-label="Meu Atelier — voltar ao site">
          <Image src="/logo-icon.svg" alt="" width={34} height={34} />
          <span>Meu <b>Atelier</b></span>
        </Link>

        <p className="lp-headline lp-serif">
          Seu ateliê,<br /><em>organizado</em><br />como merece.
        </p>
        <p className="lp-sub">Do pedido ao acabamento — cada detalhe do seu negócio em um só lugar.</p>

        <div className="lp-machine" aria-hidden="true">
          <SewingMachine ref={machine} animated={motion.enabled} onStitch={onStitch} />
        </div>
        <svg className="lp-stitch" aria-hidden="true">
          <line ref={stitch} x1="0" y1="3" x2="100%" y2="3" stroke="rgba(212,168,90,.7)" strokeWidth="2" strokeDasharray="11 7" strokeLinecap="round" />
        </svg>
        <ul className="lp-features">
          {FEATURES.map((f) => (
            <li key={f}><Check size={15} strokeWidth={2.4} aria-hidden="true" />{f}</li>
          ))}
        </ul>
      </aside>

      {/* ── Formulário ── */}
      <main className="lp-form-side">
        <div className="lp-top">
          <Link href="/" className="lp-brand" aria-label="Meu Atelier — página inicial">
            <Image src="/logo-icon.svg" alt="" width={30} height={30} />
            <span>Meu <b>Atelier</b></span>
          </Link>
          <Link href="/" className="lp-back">
            <ArrowLeft size={16} aria-hidden="true" /><span>Voltar ao site</span>
          </Link>
        </div>

        <div className="lp-center">
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
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
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
              {isGoogleLoading ? (
                <span className="lp-spinner" aria-hidden="true" style={{ borderColor: 'rgba(0,0,0,0.15)', borderTopColor: '#2C1810' }} />
              ) : (
                <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
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
      </main>
    </div>
  )
}
