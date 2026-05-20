'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signup } from '../actions'
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

// ─── Estilos inline compartilhados (mesmo tema do login) ──────────────────────

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,600&family=DM+Sans:wght@300;400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  .lp-root { font-family: 'DM Sans', sans-serif; min-height: 100vh; display: flex; background: #fff8f0; }
  .lp-panel { width: 44%; background: #2C1810; position: relative; display: flex; flex-direction: column; justify-content: space-between; padding: 52px 48px; overflow: hidden; flex-shrink: 0; }
  .lp-panel::before { content: ''; position: absolute; inset: 0; background-image: linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px); background-size: 48px 48px, 48px 48px, 8px 8px, 8px 8px; pointer-events: none; }
  .lp-ring { position: absolute; bottom: -100px; right: -100px; width: 480px; height: 480px; border-radius: 50%; border: 1px solid rgba(196,150,90,0.18); box-shadow: 0 0 0 50px rgba(196,150,90,0.06), 0 0 0 110px rgba(196,150,90,0.03); pointer-events: none; }
  .lp-ring2 { position: absolute; top: -60px; left: -60px; width: 200px; height: 200px; border-radius: 50%; border: 1px solid rgba(196,150,90,0.12); pointer-events: none; }
  .lp-top { position: relative; z-index: 1; }
  .lp-bottom { position: relative; z-index: 1; }
  .lp-brand { display: flex; align-items: center; gap: 11px; margin-bottom: 52px; }
  .lp-brand-mark { width: 38px; height: 38px; background: #d4a85a; border-radius: 9px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .lp-brand-name { font-family: 'Cormorant Garamond', serif; font-size: 20px; font-weight: 500; color: #fff8f0; letter-spacing: 0.06em; }
  .lp-headline { font-family: 'Cormorant Garamond', serif; font-size: 48px; font-weight: 300; line-height: 1.08; color: #fff8f0; }
  .lp-headline em { font-style: italic; color: #d4a85a; font-weight: 400; }
  .lp-sub { margin-top: 18px; font-size: 13px; font-weight: 300; color: rgba(254,252,249,0.42); line-height: 1.75; max-width: 270px; }
  .lp-divider { width: 40px; height: 1px; background: rgba(196,150,90,0.45); margin: 28px 0; }
  .lp-steps-panel { display: flex; flex-direction: column; gap: 12px; }
  .lp-step-item { display: flex; align-items: center; gap: 12px; }
  .lp-step-num { width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; }
  .lp-step-num.active { background: #d4a85a; color: #2C1810; }
  .lp-step-num.done { background: rgba(212,168,90,0.3); color: #d4a85a; }
  .lp-step-num.pending { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.3); }
  .lp-step-label { font-size: 12.5px; font-weight: 300; letter-spacing: 0.02em; }
  .lp-step-label.active { color: #fff8f0; font-weight: 500; }
  .lp-step-label.done { color: rgba(212,168,90,0.7); }
  .lp-step-label.pending { color: rgba(255,255,255,0.25); }
  .lp-form-side { flex: 1; display: flex; align-items: center; justify-content: center; padding: 48px 60px; overflow-y: auto; }
  .lp-form-box { width: 100%; max-width: 400px; animation: fadeUp 0.35s cubic-bezier(0.22,1,0.36,1) both; }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  .lp-form-eyebrow { font-size: 11px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: #d4a85a; margin-bottom: 8px; }
  .lp-form-title { font-family: 'Cormorant Garamond', serif; font-size: 36px; font-weight: 400; color: #2C1810; letter-spacing: -0.01em; line-height: 1.1; margin-bottom: 6px; }
  .lp-form-desc { font-size: 13px; font-weight: 300; color: #a07850; margin-bottom: 32px; line-height: 1.55; }
  .lp-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .lp-field { margin-bottom: 22px; }
  .lp-label { display: block; font-size: 10.5px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: #7a6a5a; margin-bottom: 8px; }
  .lp-label span { color: #C0564A; margin-left: 2px; }
  .lp-input-wrap { position: relative; }
  .lp-input { width: 100%; height: 46px; background: transparent; border: none; border-bottom: 1.5px solid #e8ddd0; padding: 0 40px 0 2px; font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 400; color: #2C1810; outline: none; transition: border-color 0.2s; border-radius: 0; }
  .lp-input::placeholder { color: #C4B8AE; font-weight: 300; }
  .lp-input:focus { border-bottom-color: #d4a85a; }
  .lp-input.error { border-bottom-color: #C0564A; }
  .lp-input-icon { position: absolute; right: 2px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #B0A49A; display: flex; align-items: center; padding: 4px; transition: color 0.2s; }
  .lp-input-icon:hover { color: #2C1810; }
  .lp-input-badge { position: absolute; right: 2px; top: 50%; transform: translateY(-50%); font-size: 10px; font-weight: 600; letter-spacing: 0.08em; color: #a07850; background: #f5ece0; padding: 2px 6px; border-radius: 4px; }
  .lp-err { margin-top: 5px; font-size: 11.5px; color: #C0564A; }
  .lp-hint { margin-top: 5px; font-size: 11.5px; color: #a07850; }
  .lp-sep { height: 1px; background: linear-gradient(to right, #E8E1D8, transparent); margin: 24px 0; }
  .lp-btn { width: 100%; height: 50px; background: #2C1810; color: #fff8f0; border: none; border-radius: 5px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer; transition: background 0.25s, transform 0.12s; display: flex; align-items: center; justify-content: center; gap: 10px; }
  .lp-btn:hover:not(:disabled) { background: #d4a85a; }
  .lp-btn:active:not(:disabled) { transform: scale(0.985); }
  .lp-btn:disabled { opacity: 0.55; cursor: not-allowed; }
  .lp-btn-outline { width: 100%; height: 42px; background: transparent; color: #7a6a5a; border: 1.5px solid #e8ddd0; border-radius: 5px; font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 500; letter-spacing: 0.08em; cursor: pointer; transition: all 0.2s; margin-bottom: 12px; }
  .lp-btn-outline:hover { border-color: #d4a85a; color: #2C1810; }
  .lp-spinner { width: 15px; height: 15px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.65s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .lp-terms { display: flex; align-items: flex-start; gap: 10px; padding: 14px; background: rgba(212,168,90,0.06); border: 1px solid rgba(212,168,90,0.2); border-radius: 8px; margin-bottom: 24px; }
  .lp-terms input[type=checkbox] { margin-top: 2px; accent-color: #d4a85a; width: 15px; height: 15px; flex-shrink: 0; cursor: pointer; }
  .lp-terms-text { font-size: 12px; color: #7a6a5a; line-height: 1.55; }
  .lp-terms-text a { color: #d4a85a; text-decoration: none; font-weight: 500; }
  .lp-terms-text a:hover { opacity: 0.7; }
  .lp-login { margin-top: 22px; text-align: center; font-size: 13px; font-weight: 300; color: #a07850; }
  .lp-login a { color: #d4a85a; text-decoration: none; font-weight: 500; }
  .lp-login a:hover { opacity: 0.7; }
  .lp-select { width: 100%; height: 46px; background: transparent; border: none; border-bottom: 1.5px solid #e8ddd0; padding: 0 2px; font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 400; color: #2C1810; outline: none; transition: border-color 0.2s; border-radius: 0; appearance: none; cursor: pointer; }
  .lp-select:focus { border-bottom-color: #d4a85a; }
  .lp-optional { font-size: 10px; font-weight: 400; color: #b0a49a; text-transform: none; letter-spacing: 0; margin-left: 4px; }
  @media (max-width: 840px) { .lp-panel { display: none; } .lp-form-side { padding: 40px 24px; } }
  @media (max-width: 480px) { .lp-grid-2 { grid-template-columns: 1fr; } }
`

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
  const [isLoading, setIsLoading] = useState(false)
  const [isCnpjLoading, setIsCnpjLoading] = useState(false)
  const [cnpjFound, setCnpjFound] = useState(false)
  const [docType, setDocType] = useState<'CPF' | 'CNPJ' | ''>('')
  const track = useTrack()
  usePageView('/cadastro')

  // ── Etapa 1: validação ──
  function validateStep1(): boolean {
    const e: Errors = {}
    if (!step1.fullName.trim() || step1.fullName.trim().length < 2) e.fullName = 'Nome deve ter ao menos 2 caracteres'
    if (!step1.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(step1.email)) e.email = 'E-mail inválido'
    if (!step1.password || step1.password.length < 6) e.password = 'Senha deve ter ao menos 6 caracteres'
    if (step1.password !== step1.confirmPassword) e.confirmPassword = 'As senhas não coincidem'
    if (!terms) e.terms = 'Aceite os Termos para continuar'
    setErrors(e)
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
    return Object.keys(e).length === 0
  }

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

  const stepConfig = [
    { label: 'Sua conta', num: 1 },
    { label: 'Seu ateliê', num: 2 },
  ]

  return (
    <>
      <style>{CSS}</style>
      <div className="lp-root">

        {/* ── Painel esquerdo ── */}
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

            <h1 className="lp-headline">Comece a<br />gerir seu<br /><em>ateliê hoje.</em></h1>
            <p className="lp-sub">Gratuito para sempre para até 50 clientes. Sem cartão de crédito.</p>
          </div>

          <div className="lp-bottom">
            <div className="lp-divider" />
            <div className="lp-steps-panel">
              {stepConfig.map(s => {
                const state = s.num < step ? 'done' : s.num === step ? 'active' : 'pending'
                return (
                  <div key={s.num} className="lp-step-item">
                    <div className={`lp-step-num ${state}`}>
                      {state === 'done' ? '✓' : s.num}
                    </div>
                    <span className={`lp-step-label ${state}`}>{s.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* ── Painel direito ── */}
        <div className="lp-form-side">
          <div className="lp-form-box" key={step}>

            {/* ───── ETAPA 1 ───── */}
            {step === 1 && (
              <>
                <p className="lp-form-eyebrow">Etapa 1 de 2</p>
                <h2 className="lp-form-title">Crie sua<br />conta</h2>
                <p className="lp-form-desc">Preencha seus dados de acesso ao sistema.</p>

                <form onSubmit={handleStep1Submit} noValidate>
                  <div className="lp-field">
                    <label className="lp-label" htmlFor="fullName">Nome completo <span>*</span></label>
                    <input
                      id="fullName"
                      type="text"
                      className={`lp-input${errors.fullName ? ' error' : ''}`}
                      placeholder="Maria da Silva"
                      autoComplete="name"
                      value={step1.fullName}
                      onChange={e => setStep1(p => ({ ...p, fullName: e.target.value }))}
                    />
                    {errors.fullName && <p className="lp-err">{errors.fullName}</p>}
                  </div>

                  <div className="lp-field">
                    <label className="lp-label" htmlFor="email">E-mail <span>*</span></label>
                    <input
                      id="email"
                      type="email"
                      className={`lp-input${errors.email ? ' error' : ''}`}
                      placeholder="seu@email.com"
                      autoComplete="email"
                      value={step1.email}
                      onChange={e => setStep1(p => ({ ...p, email: e.target.value }))}
                    />
                    {errors.email && <p className="lp-err">{errors.email}</p>}
                  </div>

                  <div className="lp-grid-2">
                    <div className="lp-field">
                      <label className="lp-label" htmlFor="password">Senha <span>*</span></label>
                      <div className="lp-input-wrap">
                        <input
                          id="password"
                          type={showPass ? 'text' : 'password'}
                          className={`lp-input${errors.password ? ' error' : ''}`}
                          placeholder="••••••••"
                          autoComplete="new-password"
                          value={step1.password}
                          onChange={e => setStep1(p => ({ ...p, password: e.target.value }))}
                        />
                        <button type="button" className="lp-input-icon" onClick={() => setShowPass(p => !p)} tabIndex={-1}>
                          {showPass
                            ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                            : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                          }
                        </button>
                      </div>
                      {errors.password && <p className="lp-err">{errors.password}</p>}
                    </div>

                    <div className="lp-field">
                      <label className="lp-label" htmlFor="confirmPassword">Confirmar <span>*</span></label>
                      <div className="lp-input-wrap">
                        <input
                          id="confirmPassword"
                          type={showConfirm ? 'text' : 'password'}
                          className={`lp-input${errors.confirmPassword ? ' error' : ''}`}
                          placeholder="••••••••"
                          autoComplete="new-password"
                          value={step1.confirmPassword}
                          onChange={e => setStep1(p => ({ ...p, confirmPassword: e.target.value }))}
                        />
                        <button type="button" className="lp-input-icon" onClick={() => setShowConfirm(p => !p)} tabIndex={-1}>
                          {showConfirm
                            ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                            : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                          }
                        </button>
                      </div>
                      {errors.confirmPassword && <p className="lp-err">{errors.confirmPassword}</p>}
                    </div>
                  </div>

                  {/* Termos */}
                  <div className="lp-terms">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={terms}
                      onChange={e => setTerms(e.target.checked)}
                    />
                    <label htmlFor="terms" className="lp-terms-text">
                      Li e aceito a{' '}
                      <Link href="/privacidade" target="_blank">Política de Privacidade</Link>
                      {' '}e os{' '}
                      <Link href="/termos" target="_blank">Termos de Uso</Link>.
                      Autorizo o tratamento dos meus dados conforme a LGPD.
                    </label>
                  </div>
                  {errors.terms && <p className="lp-err" style={{ marginTop: -16, marginBottom: 16 }}>{errors.terms}</p>}

                  <div className="lp-sep" />

                  <button type="submit" className="lp-btn">
                    Continuar
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </button>
                </form>

                <p className="lp-login">
                  Já tem uma conta?{' '}
                  <Link href="/login">Fazer login</Link>
                </p>
              </>
            )}

            {/* ───── ETAPA 2 ───── */}
            {step === 2 && (
              <>
                <p className="lp-form-eyebrow">Etapa 2 de 2</p>
                <h2 className="lp-form-title">Seu<br />ateliê</h2>
                <p className="lp-form-desc">Essas informações serão usadas nas ordens de serviço e relatórios. Pode alterar depois.</p>

                <form onSubmit={handleStep2Submit} noValidate>
                  <div className="lp-field">
                    <label className="lp-label" htmlFor="atelierName">Nome do ateliê <span>*</span></label>
                    <input
                      id="atelierName"
                      type="text"
                      className={`lp-input${errors.atelierName ? ' error' : ''}`}
                      placeholder="Ateliê da Maria"
                      value={step2.atelierName}
                      onChange={e => setStep2(p => ({ ...p, atelierName: e.target.value }))}
                    />
                    {errors.atelierName && <p className="lp-err">{errors.atelierName}</p>}
                  </div>

                  <div className="lp-field">
                    <label className="lp-label" htmlFor="document">
                      CPF ou CNPJ
                      <span className="lp-optional">(opcional)</span>
                      {docType && <span style={{ marginLeft: 6, fontSize: 10, color: '#d4a85a', fontWeight: 600 }}>{docType}</span>}
                    </label>
                    <div className="lp-input-wrap">
                      <input
                        id="document"
                        type="text"
                        inputMode="numeric"
                        className={`lp-input${errors.document ? ' error' : ''}`}
                        placeholder="000.000.000-00 ou 00.000.000/0000-00"
                        value={step2.document}
                        onChange={e => handleDocChange(e.target.value)}
                        maxLength={18}
                        disabled={isCnpjLoading}
                      />
                      {isCnpjLoading && (
                        <div className="lp-input-icon" style={{ cursor: 'default' }}>
                          <span className="lp-spinner" style={{ borderColor: 'rgba(212,168,90,0.3)', borderTopColor: '#d4a85a' }} />
                        </div>
                      )}
                    </div>
                    {errors.document && <p className="lp-err">{errors.document}</p>}
                    {!errors.document && isCnpjLoading && (
                      <p className="lp-hint">Consultando Receita Federal...</p>
                    )}
                    {!errors.document && !isCnpjLoading && step2.document && validateCpfCnpj(step2.document) && (
                      <p className="lp-hint" style={{ color: cnpjFound ? '#16a34a' : '#7a6a5a' }}>
                        {cnpjFound ? '✓ CNPJ encontrado — dados preenchidos automaticamente' : `✓ ${docType} válido`}
                      </p>
                    )}
                  </div>

                  <div className="lp-field">
                    <label className="lp-label" htmlFor="phone">
                      Telefone / WhatsApp
                      <span className="lp-optional">(opcional)</span>
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      className={`lp-input${errors.phone ? ' error' : ''}`}
                      placeholder="(11) 99999-9999"
                      value={step2.phone}
                      onChange={e => setStep2(p => ({ ...p, phone: formatPhone(e.target.value) }))}
                      maxLength={16}
                    />
                    {errors.phone && <p className="lp-err">{errors.phone}</p>}
                  </div>

                  <div className="lp-grid-2">
                    <div className="lp-field">
                      <label className="lp-label" htmlFor="city">
                        Cidade
                        <span className="lp-optional">(opcional)</span>
                      </label>
                      <input
                        id="city"
                        type="text"
                        className="lp-input"
                        placeholder="São Paulo"
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
                        id="state"
                        className="lp-select"
                        value={step2.state}
                        onChange={e => setStep2(p => ({ ...p, state: e.target.value }))}
                      >
                        <option value="">UF</option>
                        {ESTADOS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="lp-sep" />

                  <button type="submit" className="lp-btn" disabled={isLoading}>
                    {isLoading
                      ? <><span className="lp-spinner" />Criando sua conta...</>
                      : <>Criar minha conta grátis</>
                    }
                  </button>

                  <button type="button" className="lp-btn-outline" onClick={() => setStep(1)}>
                    ← Voltar
                  </button>
                </form>

                <p className="lp-login">
                  Já tem uma conta?{' '}
                  <Link href="/login">Fazer login</Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
