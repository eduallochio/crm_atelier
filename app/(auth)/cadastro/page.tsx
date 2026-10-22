'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import AuthShell, { EyeIcon, GoogleIcon } from '@/components/auth/auth-shell'
import { signup } from '../actions'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useTrack, usePageView } from '@/hooks/use-track'
import { buscarCnpj, isAtiva, getTelefone } from '@/lib/services/brasilcnpj'

// ─── Validações ───────────────────────────────────────────────────────────────

function validateCpfCnpj(value: string): boolean {
  const digits = value.replace(/\D/g, '')
  if (digits.length === 11) return isValidCPF(digits)
  if (digits.length === 14) return isValidCNPJ(digits)
  return false
}

function isValidCPF(cpf: string): boolean {
  if (/^(\d)\1+$/.test(cpf)) return false
  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(cpf[i]) * (10 - i)
  let rest = (sum * 10) % 11
  if (rest === 10 || rest === 11) rest = 0
  if (rest !== parseInt(cpf[9])) return false
  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(cpf[i]) * (11 - i)
  rest = (sum * 10) % 11
  if (rest === 10 || rest === 11) rest = 0
  return rest === parseInt(cpf[10])
}

function isValidCNPJ(cnpj: string): boolean {
  if (/^(\d)\1+$/.test(cnpj)) return false
  const calc = (cnpj: string, weights: number[]) =>
    weights.reduce((sum, w, i) => sum + parseInt(cnpj[i]) * w, 0)
  const mod = (n: number) => { const r = n % 11; return r < 2 ? 0 : 11 - r }
  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  return mod(calc(cnpj, w1)) === parseInt(cnpj[12]) && mod(calc(cnpj, w2)) === parseInt(cnpj[13])
}

function formatCpfCnpj(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 14)
  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }
  return digits
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2')
  }
  return digits.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2')
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Step1 { fullName: string; email: string; password: string; confirmPassword: string }
interface Step2 { atelierName: string; document: string; phone: string; city: string; state: string }
interface Errors { [key: string]: string }

const ESTADOS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']

// ─── Componente principal ─────────────────────────────────────────────────────

export default function CadastroPage() {
  const [step, setStep] = useState<1 | 2>(1)
  const [step1, setStep1] = useState<Step1>({ fullName: '', email: '', password: '', confirmPassword: '' })
  const [step2, setStep2] = useState<Step2>({ atelierName: '', document: '', phone: '', city: '', state: '' })
  const [errors, setErrors] = useState<Errors>({})
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [terms, setTerms] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isCnpjLoading, setIsCnpjLoading] = useState(false)
  const [cnpjFound, setCnpjFound] = useState(false)
  const [docType, setDocType] = useState<'CPF' | 'CNPJ' | ''>('')
  const track = useTrack()
  usePageView('/cadastro')
  const titleRef = useRef<HTMLHeadingElement>(null)
  const firstRender = useRef(true)

  // ao trocar de etapa, o foco vai para o título (leitor de tela anuncia a nova etapa)
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return }
    titleRef.current?.focus()
  }, [step])

  // leva o foco ao primeiro campo com erro
  function focusFirstError(e: Errors) {
    const first = Object.keys(e)[0]
    if (first) requestAnimationFrame(() => document.getElementById(first)?.focus())
  }

  // ── Etapa 1: validação ──
  function validateStep1(): boolean {
    const e: Errors = {}
    if (!step1.fullName.trim() || step1.fullName.trim().length < 2) e.fullName = 'Nome deve ter ao menos 2 caracteres'
    if (!step1.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(step1.email)) e.email = 'E-mail inválido'
    if (!step1.password || step1.password.length < 6) e.password = 'Senha deve ter ao menos 6 caracteres'
    if (step1.password !== step1.confirmPassword) e.confirmPassword = 'As senhas não coincidem'
    if (!terms) e.terms = 'Aceite os Termos para continuar'
    setErrors(e)
    focusFirstError(e)
    return Object.keys(e).length === 0
  }

  function handleStep1Submit(e: React.FormEvent) {
    e.preventDefault()
    if (validateStep1()) {
      track('signup_step1_completed')
      setStep(2)
    }
  }

  // ── Etapa 2: validação ──
  function validateStep2(): boolean {
    const e: Errors = {}
    if (!step2.atelierName.trim() || step2.atelierName.trim().length < 2) e.atelierName = 'Nome do ateliê deve ter ao menos 2 caracteres'
    if (step2.document) {
      if (!validateCpfCnpj(step2.document)) e.document = `${docType || 'CPF/CNPJ'} inválido`
    }
    if (step2.phone) {
      const digits = step2.phone.replace(/\D/g, '')
      if (digits.length < 10) e.phone = 'Telefone inválido'
    }
    setErrors(e)
    focusFirstError(e)
    return Object.keys(e).length === 0
  }

  async function onGoogle() {
    setIsGoogleLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    })
    if (error) { toast.error('Erro ao iniciar cadastro com Google.'); setIsGoogleLoading(false) }
  }

  // props de acessibilidade de um campo com possível erro
  const a11y = (k: string) => ({
    'aria-invalid': errors[k] ? ('true' as const) : ('false' as const),
    'aria-describedby': errors[k] ? `${k}-err` : undefined,
  })
  const Err = ({ k }: { k: string }) => (errors[k] ? <p id={`${k}-err`} className="lp-err">{errors[k]}</p> : null)

  async function handleStep2Submit(e: React.FormEvent) {
    e.preventDefault()
    if (!validateStep2()) return

    setIsLoading(true)
    track('signup_started')

    // 1. Criar conta Supabase
    const formData = new FormData()
    formData.append('fullName', step1.fullName)
    formData.append('email', step1.email)
    formData.append('password', step1.password)
    formData.append('atelierName', step2.atelierName)
    formData.append('document', step2.document.replace(/\D/g, ''))
    formData.append('phone', step2.phone.replace(/\D/g, ''))
    formData.append('city', step2.city)
    formData.append('state', step2.state)

    const result = await signup(formData)

    if (result?.error) {
      toast.error(result.error)
      if (result.error.includes('email') || result.error.includes('cadastrado')) {
        setStep(1)
      }
      setIsLoading(false)
    } else {
      track('signup_completed')
      // redirect happens inside signup()
    }
  }

  async function handleDocChange(value: string) {
    const digits = value.replace(/\D/g, '')
    const newType = digits.length <= 11 ? 'CPF' : 'CNPJ'
    setDocType(newType)
    setCnpjFound(false)
    setStep2(p => ({ ...p, document: formatCpfCnpj(value) }))

    // Busca automática quando CNPJ completo e válido
    if (newType === 'CNPJ' && digits.length === 14 && isValidCNPJ(digits)) {
      setIsCnpjLoading(true)
      try {
        const data = await buscarCnpj(digits)

        const nome = data.nome_fantasia?.trim() || data.razao_social?.trim() || ''
        const tel  = getTelefone(data)

        setStep2(p => ({
          ...p,
          atelierName: p.atelierName || nome,
          phone:       p.phone       || formatPhone(tel),
          city:        p.city        || data.municipio || '',
          state:       p.state       || data.uf        || '',
        }))

        if (!isAtiva(data)) {
          toast.warning(`CNPJ ${data.descricao_situacao_cadastral ?? 'inativo'} na Receita Federal`)
        } else {
          setCnpjFound(true)
          toast.success(`${data.razao_social} encontrado!`)
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro ao consultar CNPJ'
        toast.error(msg)
      } finally {
        setIsCnpjLoading(false)
      }
    }
  }

  const STEPS = ['Sua conta', 'Seu ateliê']

  return (
    <AuthShell
      sewKey={step}
      headline={<>Comece a<br />gerir seu<br /><em>ateliê hoje.</em></>}
      sub="Gratuito para sempre para até 50 clientes. Sem cartão de crédito."
      panelFooter={
        <ol className="su-steps" aria-label="Etapas do cadastro">
          {STEPS.map((label, i) => {
            const n = i + 1
            const state = n < step ? 'done' : n === step ? 'active' : 'pending'
            return (
              <li key={label} className={`su-step ${state}`} aria-current={state === 'active' ? 'step' : undefined}>
                <span className="su-num lp-serif">{state === 'done' ? <Check size={14} strokeWidth={2.6} aria-hidden="true" /> : n}</span>
                <span className="su-label">{label}</span>
                {i < STEPS.length - 1 && <span className="su-thread" aria-hidden="true"><span style={{ transform: `scaleX(${step > n ? 1 : 0})` }} /></span>}
              </li>
            )
          })}
        </ol>
      }
    >
      <style>{SU_CSS}</style>
      <div className="lp-form-box lp-wide" key={step}>
        <p className="lp-eyebrow">Etapa {step} de 2</p>
        <div className="su-progress" aria-hidden="true"><span style={{ transform: `scaleX(${step / 2})` }} /></div>

        {/* ───── ETAPA 1 ───── */}
        {step === 1 && (
          <>
            <h1 ref={titleRef} tabIndex={-1} className="lp-title lp-serif">Crie sua<br /><em>conta</em></h1>
            <p className="lp-desc">Comece grátis em segundos.</p>

            <button type="button" className="lp-btn-google" disabled={isGoogleLoading} onClick={onGoogle}>
              {isGoogleLoading ? <span className="lp-spinner dark" aria-hidden="true" /> : <GoogleIcon />}
              {isGoogleLoading ? 'Redirecionando...' : 'Cadastrar com Google'}
            </button>

            <div className="lp-or"><span>ou preencha os dados</span></div>

            <form onSubmit={handleStep1Submit} noValidate>
              <div className="lp-field">
                <label className="lp-label" htmlFor="fullName">Nome completo <span className="lp-req" aria-hidden="true">*</span></label>
                <input
                  id="fullName" type="text" className="lp-input" placeholder="Maria da Silva" autoComplete="name" required
                  value={step1.fullName}
                  onChange={e => setStep1(p => ({ ...p, fullName: e.target.value }))}
                  {...a11y('fullName')}
                />
                <Err k="fullName" />
              </div>

              <div className="lp-field">
                <label className="lp-label" htmlFor="email">E-mail <span className="lp-req" aria-hidden="true">*</span></label>
                <input
                  id="email" type="email" inputMode="email" className="lp-input" placeholder="seu@email.com" autoComplete="email" required
                  value={step1.email}
                  onChange={e => setStep1(p => ({ ...p, email: e.target.value }))}
                  {...a11y('email')}
                />
                <Err k="email" />
              </div>

              <div className="lp-grid-2">
                <div className="lp-field">
                  <label className="lp-label" htmlFor="password">Senha <span className="lp-req" aria-hidden="true">*</span></label>
                  <div className="lp-input-wrap">
                    <input
                      id="password" type={showPass ? 'text' : 'password'} className="lp-input" placeholder="••••••••" autoComplete="new-password" required
                      value={step1.password}
                      onChange={e => setStep1(p => ({ ...p, password: e.target.value }))}
                      {...a11y('password')}
                    />
                    <button type="button" className="lp-eye" onClick={() => setShowPass(p => !p)} aria-label="Mostrar senha" aria-pressed={showPass} aria-controls="password">
                      <EyeIcon open={showPass} />
                    </button>
                  </div>
                  <Err k="password" />
                </div>

                <div className="lp-field">
                  <label className="lp-label" htmlFor="confirmPassword">Confirmar senha <span className="lp-req" aria-hidden="true">*</span></label>
                  <div className="lp-input-wrap">
                    <input
                      id="confirmPassword" type={showConfirm ? 'text' : 'password'} className="lp-input" placeholder="••••••••" autoComplete="new-password" required
                      value={step1.confirmPassword}
                      onChange={e => setStep1(p => ({ ...p, confirmPassword: e.target.value }))}
                      {...a11y('confirmPassword')}
                    />
                    <button type="button" className="lp-eye" onClick={() => setShowConfirm(p => !p)} aria-label="Mostrar confirmação de senha" aria-pressed={showConfirm} aria-controls="confirmPassword">
                      <EyeIcon open={showConfirm} />
                    </button>
                  </div>
                  <Err k="confirmPassword" />
                </div>
              </div>

              <div className="lp-terms">
                <input type="checkbox" id="terms" checked={terms} onChange={e => setTerms(e.target.checked)} {...a11y('terms')} />
                <label htmlFor="terms">
                  Li e aceito a{' '}
                  <Link href="/privacidade" target="_blank">Política de Privacidade</Link>
                  {' '}e os{' '}
                  <Link href="/termos" target="_blank">Termos de Uso</Link>.
                  Autorizo o tratamento dos meus dados conforme a LGPD.
                </label>
              </div>
              <Err k="terms" />

              <button type="submit" className="lp-btn" style={{ marginTop: 28 }}>
                Continuar <ArrowRight size={16} aria-hidden="true" />
              </button>
            </form>

            <p className="lp-register">
              Já tem uma conta?{' '}
              <Link href="/login">Fazer login</Link>
            </p>
          </>
        )}

        {/* ───── ETAPA 2 ───── */}
        {step === 2 && (
          <>
            <h1 ref={titleRef} tabIndex={-1} className="lp-title lp-serif">Seu<br /><em>ateliê</em></h1>
            <p className="lp-desc">Essas informações serão usadas nas ordens de serviço e relatórios. Pode alterar depois.</p>

            <form onSubmit={handleStep2Submit} noValidate>
              <div className="lp-field">
                <label className="lp-label" htmlFor="atelierName">Nome do ateliê <span className="lp-req" aria-hidden="true">*</span></label>
                <input
                  id="atelierName" type="text" className="lp-input" placeholder="Ateliê da Maria" autoComplete="organization" required
                  value={step2.atelierName}
                  onChange={e => setStep2(p => ({ ...p, atelierName: e.target.value }))}
                  {...a11y('atelierName')}
                />
                <Err k="atelierName" />
              </div>

              <div className="lp-field">
                <label className="lp-label" htmlFor="document">
                  CPF ou CNPJ
                  <span className="lp-optional">(opcional)</span>
                  {docType && <span className="su-doctype">{docType}</span>}
                </label>
                <div className="lp-input-wrap">
                  <input
                    id="document" type="text" inputMode="numeric" className="lp-input"
                    placeholder="Só os números"
                    value={step2.document}
                    onChange={e => handleDocChange(e.target.value)}
                    maxLength={18}
                    disabled={isCnpjLoading}
                    {...a11y('document')}
                    aria-describedby={errors.document ? 'document-err' : 'document-hint'}
                  />
                  {isCnpjLoading && <span className="lp-input-status"><span className="lp-spinner gold" aria-hidden="true" /></span>}
                </div>
                <Err k="document" />
                <p id="document-hint" className={`lp-hint${cnpjFound ? ' ok' : ''}`} aria-live="polite">
                  {!errors.document && isCnpjLoading && 'Consultando Receita Federal...'}
                  {!errors.document && !isCnpjLoading && step2.document && validateCpfCnpj(step2.document) && (
                    cnpjFound ? '✓ CNPJ encontrado — dados preenchidos automaticamente' : `✓ ${docType} válido`
                  )}
                </p>
              </div>

              <div className="lp-field">
                <label className="lp-label" htmlFor="phone">
                  Telefone / WhatsApp
                  <span className="lp-optional">(opcional)</span>
                </label>
                <input
                  id="phone" type="tel" inputMode="tel" className="lp-input" placeholder="(11) 99999-9999" autoComplete="tel-national"
                  value={step2.phone}
                  onChange={e => setStep2(p => ({ ...p, phone: formatPhone(e.target.value) }))}
                  maxLength={16}
                  {...a11y('phone')}
                />
                <Err k="phone" />
              </div>

              <div className="lp-grid-2">
                <div className="lp-field">
                  <label className="lp-label" htmlFor="city">
                    Cidade
                    <span className="lp-optional">(opcional)</span>
                  </label>
                  <input
                    id="city" type="text" className="lp-input" placeholder="São Paulo" autoComplete="address-level2"
                    value={step2.city}
                    onChange={e => setStep2(p => ({ ...p, city: e.target.value }))}
                  />
                </div>

                <div className="lp-field">
                  <label className="lp-label" htmlFor="state">
                    Estado
                    <span className="lp-optional">(opcional)</span>
                  </label>
                  <select
                    id="state" className="lp-select" autoComplete="address-level1"
                    value={step2.state}
                    onChange={e => setStep2(p => ({ ...p, state: e.target.value }))}
                  >
                    <option value="">UF</option>
                    {ESTADOS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                  </select>
                </div>
              </div>

              <button type="submit" className="lp-btn" disabled={isLoading} style={{ marginTop: 8 }}>
                {isLoading
                  ? <><span className="lp-spinner" aria-hidden="true" />Criando sua conta...</>
                  : <>Criar minha conta grátis</>
                }
              </button>

              <button type="button" className="lp-btn-ghost" onClick={() => setStep(1)} disabled={isLoading}>
                <ArrowLeft size={15} aria-hidden="true" /> Voltar
              </button>
            </form>

            <p className="lp-register">
              Já tem uma conta?{' '}
              <Link href="/login">Fazer login</Link>
            </p>
          </>
        )}
      </div>
    </AuthShell>
  )
}

const SU_CSS = `
  .su-steps { list-style: none; margin: 0; padding: 0; display: flex; align-items: center; gap: 14px; }
  .su-step { display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0; }
  .su-step:last-child { flex: none; }
  .su-num { flex: none; width: 34px; height: 34px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 17px; font-weight: 500; border: 1.5px solid rgba(212,168,90,.45); color: rgba(247,240,230,.6); transition: background-color .4s, color .4s, border-color .4s; }
  .su-step.active .su-num { background: var(--terra); border-color: var(--terra); color: var(--card); }
  .su-step.done .su-num { background: rgba(212,168,90,.18); border-color: var(--gold); color: var(--gold); }
  .su-label { font-size: 14px; color: rgba(247,240,230,.6); white-space: nowrap; }
  .su-step.active .su-label { color: var(--cream); font-weight: 500; }
  .su-step.done .su-label { color: rgba(212,168,90,.9); }
  .su-thread { flex: 1; height: 2px; min-width: 24px; background: repeating-linear-gradient(90deg, rgba(212,168,90,.25) 0 7px, transparent 7px 11px); }
  .su-thread > span { display: block; height: 100%; transform-origin: left; background: repeating-linear-gradient(90deg, var(--gold) 0 7px, transparent 7px 11px); transition: transform .8s cubic-bezier(.4,0,.2,1); }
  .su-progress { height: 2px; margin: 0 0 22px; background: repeating-linear-gradient(90deg, rgba(200,113,74,.2) 0 7px, transparent 7px 11px); }
  .su-progress > span { display: block; height: 100%; transform-origin: left; background: repeating-linear-gradient(90deg, var(--terra) 0 7px, transparent 7px 11px); transition: transform .8s cubic-bezier(.4,0,.2,1); }
  .su-doctype { margin-left: 8px; font-size: 10px; font-weight: 600; letter-spacing: .1em; color: var(--terra-dark); }
  @media (prefers-reduced-motion: reduce) { .su-thread > span, .su-progress > span { transition: none; } }
`
