'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import AuthShell from '@/components/auth/auth-shell'
import { completarPerfil } from '@/app/(auth)/actions'

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2')
  }
  return digits.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2')
}

export default function CompletarPerfilPage() {
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    const formData = new FormData()
    formData.append('phone', phone)
    try {
      const result = await completarPerfil(formData)
      if (result?.error) {
        setError(result.error)
        toast.error(result.error)
      }
    } catch (err) {
      // NEXT_REDIRECT é lançado pelo redirect() em sucesso — repassar
      if (err instanceof Error && err.message.startsWith('NEXT_REDIRECT')) throw err
      toast.error('Erro de conexão com o servidor. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthShell
      headline={<>Só mais <em>um passo</em></>}
      sub="Precisamos do seu telefone para enviar avisos importantes sobre o seu ateliê e dar suporte quando precisar."
    >
      <div className="lp-form-box">
        <p className="lp-eyebrow">Quase lá</p>
        <h1 className="lp-title">Complete seu <em>perfil</em></h1>
        <p className="lp-desc">Informe seu telefone/WhatsApp para continuar — é só essa vez.</p>

        <form onSubmit={onSubmit}>
          <div className="lp-field">
            <label className="lp-label" htmlFor="phone">
              Telefone / WhatsApp <span className="lp-req" aria-hidden="true">*</span>
            </label>
            <input
              id="phone" type="tel" inputMode="tel" className="lp-input" placeholder="(11) 99999-9999" autoComplete="tel-national" required
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
              maxLength={16}
              aria-invalid={!!error}
              autoFocus
            />
            {error && <p className="lp-err">{error}</p>}
          </div>

          <button type="submit" className="lp-btn" disabled={isLoading}>
            {isLoading ? <span className="lp-spinner" aria-hidden="true" /> : 'Continuar'}
          </button>
        </form>
      </div>
    </AuthShell>
  )
}
