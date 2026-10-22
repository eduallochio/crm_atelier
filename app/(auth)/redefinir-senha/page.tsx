'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { resetPassword } from '../actions'
import AuthShell, { EyeIcon } from '@/components/auth/auth-shell'

export default function RedefinirSenhaPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [show, setShow] = useState({ password: false, confirmPassword: false })
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const mismatch = confirm.length > 0 && confirm !== password

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    setIsLoading(true)
    try {
      const result = await resetPassword(formData)
      // em caso de sucesso, resetPassword redireciona para /dashboard
      if (result?.error) { toast.error(result.error); setIsLoading(false) }
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('NEXT_REDIRECT')) throw error
      toast.error('Erro de conexão com o servidor. Tente novamente.')
      setIsLoading(false)
    }
  }

  const field = (name: 'password' | 'confirmPassword', label: string, value: string, set: (v: string) => void, extra?: React.ReactNode) => (
    <div className="lp-field">
      <label className="lp-label" htmlFor={name}>{label}</label>
      <div className="lp-input-wrap">
        <input id={name} name={name} type={show[name] ? 'text' : 'password'} className="lp-input" placeholder="••••••••" autoComplete="new-password"
          value={value} onChange={(e) => set(e.target.value)} disabled={isLoading}
          aria-invalid={name === 'confirmPassword' && mismatch ? 'true' : 'false'} aria-describedby={`${name}-hint`} />
        <button type="button" className="lp-eye" onClick={() => setShow((s) => ({ ...s, [name]: !s[name] }))}
          aria-label="Mostrar senha" aria-pressed={show[name]} aria-controls={name}>
          <EyeIcon open={show[name]} />
        </button>
      </div>
      {extra}
    </div>
  )

  return (
    <AuthShell
      headline={<>Crie uma<br />nova senha<br /><em>segura.</em></>}
      sub="Use pelo menos 6 caracteres, misturando letras, números e símbolos."
    >
      <div className="lp-form-box">
        <p className="lp-eyebrow">Redefinição de senha</p>
        <h1 className="lp-title lp-serif">Nova<br /><em>senha.</em></h1>
        <p className="lp-desc">Escolha uma senha segura para proteger a sua conta.</p>
        <form onSubmit={handleSubmit} noValidate>
          {field('password', 'Nova senha', password, setPassword,
            <p id="password-hint" className={`lp-hint ${password.length >= 6 ? 'ok' : ''}`}>{password.length >= 6 ? 'Tamanho ok' : 'Mínimo de 6 caracteres'}</p>)}
          {field('confirmPassword', 'Confirmar nova senha', confirm, setConfirm,
            mismatch ? <p id="confirmPassword-hint" className="lp-err">As senhas não conferem</p>
              : <p id="confirmPassword-hint" className={`lp-hint ${confirm && !mismatch ? 'ok' : ''}`}>{confirm ? 'As senhas conferem' : 'Digite a mesma senha de novo'}</p>)}
          <button type="submit" className="lp-btn" disabled={isLoading}>
            {isLoading ? <><span className="lp-spinner" aria-hidden="true" />Salvando...</> : 'Redefinir senha'}
          </button>
        </form>
        <p className="lp-register"><Link href="/login">Voltar ao login</Link></p>
      </div>
    </AuthShell>
  )
}
