'use client'

import { useState } from 'react'
import Link from 'next/link'
import { resendConfirmation } from '../actions'
import { toast } from 'sonner'

export default function ConfirmarEmailPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleResend = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!email) { toast.error('Informe seu e-mail.'); return }
    setIsLoading(true)
    const formData = new FormData()
    formData.append('email', email)
    const result = await resendConfirmation(formData)
    if (result?.error) {
      toast.error(result.error)
    } else {
      setSent(true)
      toast.success('E-mail reenviado com sucesso!')
    }
    setIsLoading(false)
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,600&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .lp-root { font-family: 'DM Sans', sans-serif; min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #fff8f0; padding: 40px 24px; }
        .lp-card { width: 100%; max-width: 460px; background: #fff; border: 1px solid #e8ddd0; border-radius: 16px; padding: 48px 40px; animation: fadeUp 0.45s cubic-bezier(0.22,1,0.36,1) both; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .lp-brand { display: flex; align-items: center; gap: 10px; margin-bottom: 36px; }
        .lp-brand-mark { width: 34px; height: 34px; background: #2C1810; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .lp-brand-name { font-family: 'Cormorant Garamond', serif; font-size: 18px; font-weight: 500; color: #2C1810; letter-spacing: 0.06em; }
        .lp-icon { width: 64px; height: 64px; background: #fef9f0; border: 1px solid #f5e6c8; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; }
        .lp-eyebrow { font-size: 10.5px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: #d4a85a; margin-bottom: 8px; text-align: center; }
        .lp-title { font-family: 'Cormorant Garamond', serif; font-size: 32px; font-weight: 400; color: #2C1810; line-height: 1.15; margin-bottom: 12px; text-align: center; }
        .lp-desc { font-size: 13.5px; font-weight: 300; color: #a07850; line-height: 1.65; text-align: center; margin-bottom: 32px; }
        .lp-steps { background: #fdf8f2; border-radius: 10px; padding: 20px; margin-bottom: 32px; }
        .lp-step { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 14px; }
        .lp-step:last-child { margin-bottom: 0; }
        .lp-step-num { width: 22px; height: 22px; background: #d4a85a; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; margin-top: 1px; }
        .lp-step-text { font-size: 13px; color: #7a6a5a; line-height: 1.5; }
        .lp-divider { height: 1px; background: #e8ddd0; margin: 28px 0; }
        .lp-resend-title { font-size: 12px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #7a6a5a; margin-bottom: 14px; }
        .lp-input-row { display: flex; gap: 10px; }
        .lp-input { flex: 1; height: 44px; background: transparent; border: 1.5px solid #e8ddd0; border-radius: 6px; padding: 0 14px; font-family: 'DM Sans', sans-serif; font-size: 14px; color: #2C1810; outline: none; transition: border-color 0.2s; }
        .lp-input::placeholder { color: #C4B8AE; }
        .lp-input:focus { border-color: #d4a85a; }
        .lp-btn-sm { height: 44px; padding: 0 20px; background: #2C1810; color: #fff8f0; border: none; border-radius: 6px; font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; cursor: pointer; transition: background 0.25s; white-space: nowrap; display: flex; align-items: center; gap: 8px; }
        .lp-btn-sm:hover:not(:disabled) { background: #d4a85a; }
        .lp-btn-sm:disabled { opacity: 0.55; cursor: not-allowed; }
        .lp-spinner { width: 13px; height: 13px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.65s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .lp-back { margin-top: 24px; text-align: center; font-size: 13px; color: #a07850; }
        .lp-back a { color: #d4a85a; text-decoration: none; font-weight: 500; }
        .lp-back a:hover { opacity: 0.7; }
        .lp-success { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 14px 16px; display: flex; align-items: center; gap: 10px; margin-top: 14px; }
        .lp-success-text { font-size: 13px; color: #15803d; }
      `}</style>

      <div className="lp-root">
        <div className="lp-card">
          <div className="lp-brand">
            <div className="lp-brand-mark">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" />
                <line x1="20" y1="4" x2="8.12" y2="15.88" /><line x1="14.47" y1="14.48" x2="20" y2="20" /><line x1="8.12" y1="8.12" x2="12" y2="12" />
              </svg>
            </div>
            <span className="lp-brand-name">Meu Atelier</span>
          </div>

          <div className="lp-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d4a85a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="16" x="2" y="4" rx="2"/>
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
            </svg>
          </div>

          <p className="lp-eyebrow">Verifique seu e-mail</p>
          <h1 className="lp-title">Confirme sua<br />conta</h1>
          <p className="lp-desc">
            Enviamos um link de confirmação para o seu e-mail. Clique no link para ativar sua conta e acessar o sistema.
          </p>

          <div className="lp-steps">
            {[
              'Abra seu aplicativo de e-mail',
              'Procure o e-mail do "Meu Atelier"',
              'Clique em "Confirmar conta"',
              'Você será redirecionado automaticamente',
            ].map((text, i) => (
              <div className="lp-step" key={i}>
                <div className="lp-step-num">{i + 1}</div>
                <p className="lp-step-text">{text}</p>
              </div>
            ))}
          </div>

          <div className="lp-divider" />

          <p className="lp-resend-title">Não recebeu o e-mail?</p>
          <form onSubmit={handleResend} noValidate>
            <div className="lp-input-row">
              <input
                type="email"
                className="lp-input"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={isLoading || sent}
              />
              <button type="submit" className="lp-btn-sm" disabled={isLoading || sent}>
                {isLoading ? <span className="lp-spinner" /> : 'Reenviar'}
              </button>
            </div>
          </form>

          {sent && (
            <div className="lp-success">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5"/>
              </svg>
              <p className="lp-success-text">E-mail reenviado! Verifique também a pasta de spam.</p>
            </div>
          )}

          <p className="lp-back">
            <Link href="/login">← Voltar ao login</Link>
            {' · '}
            <Link href="/cadastro">Criar nova conta</Link>
          </p>
        </div>
      </div>
    </>
  )
}
