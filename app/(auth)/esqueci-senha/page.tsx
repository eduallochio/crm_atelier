'use client'

import { useState } from 'react'
import Link from 'next/link'
import { forgotPassword } from '../actions'
import { toast } from 'sonner'

export default function EsqueciSenhaPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [email, setEmail] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!email) { toast.error('Informe seu e-mail.'); return }
    setIsLoading(true)
    const formData = new FormData()
    formData.append('email', email)
    const result = await forgotPassword(formData)
    if (result?.error) {
      toast.error(result.error)
    } else {
      setSent(true)
    }
    setIsLoading(false)
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,600&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .lp-root { font-family: 'DM Sans', sans-serif; min-height: 100vh; display: flex; background: #fff8f0; }
        .lp-panel { width: 44%; background: #2C1810; position: relative; display: flex; flex-direction: column; justify-content: space-between; padding: 52px 48px; overflow: hidden; flex-shrink: 0; }
        .lp-panel::before { content: ''; position: absolute; inset: 0; background-image: linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px); background-size: 48px 48px; pointer-events: none; }
        .lp-ring { position: absolute; bottom: -100px; right: -100px; width: 480px; height: 480px; border-radius: 50%; border: 1px solid rgba(196,150,90,0.18); box-shadow: 0 0 0 50px rgba(196,150,90,0.06), 0 0 0 110px rgba(196,150,90,0.03); pointer-events: none; }
        .lp-ring2 { position: absolute; top: -60px; left: -60px; width: 200px; height: 200px; border-radius: 50%; border: 1px solid rgba(196,150,90,0.12); pointer-events: none; }
        .lp-top { position: relative; z-index: 1; }
        .lp-brand { display: flex; align-items: center; gap: 11px; margin-bottom: 72px; }
        .lp-brand-mark { width: 38px; height: 38px; background: #d4a85a; border-radius: 9px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .lp-brand-name { font-family: 'Cormorant Garamond', serif; font-size: 20px; font-weight: 500; color: #fff8f0; letter-spacing: 0.06em; }
        .lp-headline { font-family: 'Cormorant Garamond', serif; font-size: 54px; font-weight: 300; line-height: 1.08; color: #fff8f0; }
        .lp-headline em { font-style: italic; color: #d4a85a; font-weight: 400; }
        .lp-sub { margin-top: 22px; font-size: 13.5px; font-weight: 300; color: rgba(254,252,249,0.42); line-height: 1.75; letter-spacing: 0.025em; max-width: 270px; }
        .lp-form-side { flex: 1; display: flex; align-items: center; justify-content: center; padding: 48px 60px; }
        .lp-form-box { width: 100%; max-width: 380px; animation: fadeUp 0.45s cubic-bezier(0.22,1,0.36,1) both; animation-delay: 0.05s; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .lp-form-eyebrow { font-size: 11px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: #d4a85a; margin-bottom: 10px; }
        .lp-form-title { font-family: 'Cormorant Garamond', serif; font-size: 40px; font-weight: 400; color: #2C1810; letter-spacing: -0.01em; line-height: 1.1; margin-bottom: 8px; }
        .lp-form-desc { font-size: 13.5px; font-weight: 300; color: #a07850; margin-bottom: 40px; letter-spacing: 0.01em; line-height: 1.6; }
        .lp-field { margin-bottom: 28px; }
        .lp-label { display: block; font-size: 10.5px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: #7a6a5a; margin-bottom: 10px; }
        .lp-input { width: 100%; height: 46px; background: transparent; border: none; border-bottom: 1.5px solid #e8ddd0; padding: 0 2px; font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 400; color: #2C1810; outline: none; transition: border-color 0.2s; border-radius: 0; }
        .lp-input::placeholder { color: #C4B8AE; font-weight: 300; }
        .lp-input:focus { border-bottom-color: #d4a85a; }
        .lp-sep { height: 1px; background: linear-gradient(to right, #E8E1D8, transparent); margin: 36px 0; }
        .lp-btn { width: 100%; height: 50px; background: #2C1810; color: #fff8f0; border: none; border-radius: 5px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer; transition: background 0.25s, transform 0.12s; display: flex; align-items: center; justify-content: center; gap: 10px; }
        .lp-btn:hover:not(:disabled) { background: #d4a85a; }
        .lp-btn:disabled { opacity: 0.55; cursor: not-allowed; }
        .lp-spinner { width: 15px; height: 15px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.65s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .lp-back { margin-top: 26px; text-align: center; font-size: 13px; font-weight: 300; color: #a07850; }
        .lp-back a { color: #d4a85a; text-decoration: none; font-weight: 500; transition: opacity 0.2s; }
        .lp-back a:hover { opacity: 0.7; }
        .lp-success-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 24px; text-align: center; }
        .lp-success-icon { width: 48px; height: 48px; background: #dcfce7; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; }
        .lp-success-title { font-family: 'Cormorant Garamond', serif; font-size: 24px; font-weight: 400; color: #166534; margin-bottom: 8px; }
        .lp-success-desc { font-size: 13px; color: #15803d; line-height: 1.6; }
        @media (max-width: 840px) { .lp-panel { display: none; } .lp-form-side { padding: 40px 24px; } }
      `}</style>

      <div className="lp-root">
        <div className="lp-panel">
          <div className="lp-ring" /><div className="lp-ring2" />
          <div className="lp-top">
            <div className="lp-brand">
              <div className="lp-brand-mark">
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" />
                  <line x1="20" y1="4" x2="8.12" y2="15.88" /><line x1="14.47" y1="14.48" x2="20" y2="20" /><line x1="8.12" y1="8.12" x2="12" y2="12" />
                </svg>
              </div>
              <span className="lp-brand-name">Meu Atelier</span>
            </div>
            <h1 className="lp-headline">Recupere seu<br />acesso com<br /><em>segurança.</em></h1>
            <p className="lp-sub">Enviaremos um link seguro para o seu e-mail para que você possa criar uma nova senha.</p>
          </div>
        </div>

        <div className="lp-form-side">
          <div className="lp-form-box">
            {sent ? (
              <div className="lp-success-box">
                <div className="lp-success-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    <path d="m16 19 2 2 4-4" />
                  </svg>
                </div>
                <p className="lp-success-title">E-mail enviado!</p>
                <p className="lp-success-desc">
                  Se existe uma conta com <strong>{email}</strong>, você receberá um link para redefinir sua senha em instantes. Verifique também a pasta de spam.
                </p>
              </div>
            ) : (
              <>
                <p className="lp-form-eyebrow">Recuperação de acesso</p>
                <h2 className="lp-form-title">Esqueceu<br />sua senha?</h2>
                <p className="lp-form-desc">Informe o e-mail da sua conta e enviaremos um link para criar uma nova senha.</p>

                <form onSubmit={handleSubmit} noValidate>
                  <div className="lp-field">
                    <label className="lp-label" htmlFor="email">E-mail</label>
                    <input
                      id="email"
                      type="email"
                      className="lp-input"
                      placeholder="seu@email.com"
                      autoComplete="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="lp-sep" />
                  <button type="submit" className="lp-btn" disabled={isLoading}>
                    {isLoading ? <><span className="lp-spinner" />Enviando...</> : 'Enviar link de recuperação'}
                  </button>
                </form>
              </>
            )}

            <p className="lp-back">
              <Link href="/login">← Voltar ao login</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
