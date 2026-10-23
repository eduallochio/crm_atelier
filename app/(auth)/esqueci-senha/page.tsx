'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { forgotPassword } from '../actions'
import AuthShell from '@/components/auth/auth-shell'

export default function EsqueciSenhaPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!email) { setError('Informe seu e-mail.'); return }
    setError('')
    setIsLoading(true)
    const formData = new FormData()
    formData.append('email', email)
    try {
      const result = await forgotPassword(formData)
      if (result?.error) toast.error(result.error)
      else setSent(true)
    } catch {
      toast.error('Erro de conexão com o servidor. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthShell
      sewKey={sent ? 'sent' : 'form'}
      headline={<>Recupere seu<br />acesso com<br /><em>segurança.</em></>}
      sub="Enviamos um link seguro para o seu e-mail para você criar uma nova senha."
    >
      <div className="lp-form-box">
        <p className="lp-eyebrow">Recuperação de acesso</p>
        {sent ? (
          <>
            <h1 className="lp-title lp-serif">Confira seu<br /><em>e-mail.</em></h1>
            <div className="lp-ok" role="status">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /><path d="m16 19 2 2 4-4" />
              </svg>
              <div>
                <b>Link enviado</b>
                <p>Se existe uma conta com <strong>{email}</strong>, o link para criar uma nova senha chega em instantes. Olhe também a caixa de spam.</p>
              </div>
            </div>
            <button type="button" className="lp-btn-ghost" onClick={() => setSent(false)}>Usar outro e-mail</button>
          </>
        ) : (
          <>
            <h1 className="lp-title lp-serif">Esqueceu<br /><em>sua senha?</em></h1>
            <p className="lp-desc">Informe o e-mail da sua conta e enviaremos um link para criar uma nova senha.</p>
            <form onSubmit={handleSubmit} noValidate>
              <div className="lp-field">
                <label className="lp-label" htmlFor="email">E-mail</label>
                <div className="lp-input-wrap">
                  <input id="email" type="email" inputMode="email" className="lp-input" placeholder="seu@email.com" autoComplete="email"
                    value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading}
                    aria-invalid={error ? 'true' : 'false'} aria-describedby={error ? 'email-err' : undefined} />
                </div>
                {error && <p id="email-err" className="lp-err">{error}</p>}
              </div>
              <button type="submit" className="lp-btn" disabled={isLoading}>
                {isLoading ? <><span className="lp-spinner" aria-hidden="true" />Enviando...</> : 'Enviar link de recuperação'}
              </button>
            </form>
          </>
        )}
        <p className="lp-register">Lembrou a senha? <Link href="/login">Voltar ao login</Link></p>
      </div>
    </AuthShell>
  )
}
