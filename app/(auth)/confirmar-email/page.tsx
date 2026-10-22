'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { resendConfirmation } from '../actions'
import AuthShell from '@/components/auth/auth-shell'

const STEPS = [
  'Abra o seu aplicativo de e-mail',
  'Procure o e-mail do "Meu Atelier"',
  'Clique em "Confirmar conta"',
  'Você entra no sistema automaticamente',
]

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
    try {
      const result = await resendConfirmation(formData)
      if (result?.error) toast.error(result.error)
      else { setSent(true); toast.success('E-mail reenviado com sucesso!') }
    } catch {
      toast.error('Erro de conexão com o servidor. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthShell
      headline={<>Quase<br />pronto para<br /><em>começar.</em></>}
      sub="Só falta confirmar o seu e-mail. Depois disso, o ateliê inteiro fica a um clique."
    >
      <div className="lp-form-box">
        <p className="lp-eyebrow">Verifique seu e-mail</p>
        <h1 className="lp-title lp-serif">Confirme a<br /><em>sua conta.</em></h1>
        <p className="lp-desc">Enviamos um link de confirmação para o seu e-mail.</p>
        <ol className="lp-steps">{STEPS.map((s) => <li key={s}>{s}</li>)}</ol>

        <p className="lp-label" style={{ marginBottom: 4 }}>Não recebeu o e-mail?</p>
        {sent ? (
          <div className="lp-ok" role="status">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
            <div><p>E-mail reenviado para <strong>{email}</strong>. Olhe também a caixa de spam.</p></div>
          </div>
        ) : (
          <form onSubmit={handleResend} noValidate className="lp-row">
            <div className="lp-field">
              <label className="lp-label" htmlFor="email" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>E-mail</label>
              <div className="lp-input-wrap">
                <input id="email" type="email" inputMode="email" className="lp-input" placeholder="seu@email.com" autoComplete="email"
                  value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} />
              </div>
            </div>
            <button type="submit" className="lp-btn" disabled={isLoading}>
              {isLoading ? <span className="lp-spinner" aria-hidden="true" /> : 'Reenviar'}
            </button>
          </form>
        )}

        <p className="lp-register"><Link href="/login">Voltar ao login</Link> · <Link href="/cadastro">Criar nova conta</Link></p>
      </div>
    </AuthShell>
  )
}
