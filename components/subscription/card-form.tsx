'use client'

import { forwardRef, useId } from 'react'
import { Lock } from 'lucide-react'

const SERIF = { fontFamily: "var(--font-cormorant), 'Cormorant Garamond', Georgia, serif" }

export type CardData = {
  holderName: string
  number: string        // com espaços a cada 4
  expiry: string        // MM/AA ou MM/AAAA
  ccv: string
  cpf: string           // 000.000.000-00
  phone: string         // (00) 00000-0000
  postalCode: string    // 00000-000
  addressNumber: string
}

export const EMPTY_CARD: CardData = {
  holderName: '', number: '', expiry: '', ccv: '', cpf: '', phone: '', postalCode: '', addressNumber: '',
}

export type CardErrors = Partial<Record<keyof CardData, string>>

const digits = (v: string) => v.replace(/\D/g, '')

/** bandeira pelo início do número (só para mostrar; quem valida de verdade é o Asaas) */
export function cardBrand(num: string): string | null {
  const n = digits(num)
  if (/^4/.test(n)) return 'Visa'
  if (/^(5[1-5]|2[2-7])/.test(n)) return 'Mastercard'
  if (/^3[47]/.test(n)) return 'Amex'
  if (/^(4011|4312|4389|4514|4576|5041|5066|5067|509|6277|6362|6363|650|6516|6550)/.test(n)) return 'Elo'
  if (/^(606282|3841)/.test(n)) return 'Hipercard'
  return null
}

function luhn(n: string) {
  let sum = 0
  for (let i = 0; i < n.length; i++) {
    let d = Number(n[n.length - 1 - i])
    if (i % 2 === 1) { d *= 2; if (d > 9) d -= 9 }
    sum += d
  }
  return sum % 10 === 0
}

function validCpf(v: string) {
  const c = digits(v)
  if (c.length !== 11 || /^(\d)\1{10}$/.test(c)) return false
  const calc = (len: number) => {
    let s = 0
    for (let i = 0; i < len; i++) s += Number(c[i]) * (len + 1 - i)
    const r = (s * 10) % 11
    return r === 10 ? 0 : r
  }
  return calc(9) === Number(c[9]) && calc(10) === Number(c[10])
}

/** mês e ano com 4 dígitos, como o Asaas pede */
export function splitExpiry(expiry: string): { month: string; year: string } {
  const [m = '', y = ''] = expiry.split('/')
  return { month: m.trim(), year: y.trim().length === 2 ? `20${y.trim()}` : y.trim() }
}

/** Mensagens por campo, na ordem em que aparecem na tela */
export function validateCard(c: CardData): CardErrors {
  const e: CardErrors = {}
  if (c.holderName.trim().split(/\s+/).length < 2) e.holderName = 'Escreva o nome como está no cartão (nome e sobrenome).'
  const num = digits(c.number)
  if (num.length < 13 || !luhn(num)) e.number = 'Confira o número do cartão.'
  const { month, year } = splitExpiry(c.expiry)
  const m = Number(month), y = Number(year)
  const now = new Date()
  if (!m || m > 12 || year.length !== 4) e.expiry = 'Use mês e ano, ex.: 08/29.'
  else if (y < now.getFullYear() || (y === now.getFullYear() && m < now.getMonth() + 1)) e.expiry = 'Este cartão está vencido.'
  if (!/^\d{3,4}$/.test(c.ccv)) e.ccv = 'São os 3 ou 4 números atrás do cartão.'
  if (!validCpf(c.cpf)) e.cpf = 'Confira o CPF do titular.'
  if (digits(c.phone).length < 10) e.phone = 'Informe o telefone com DDD.'
  if (digits(c.postalCode).length !== 8) e.postalCode = 'O CEP tem 8 números.'
  if (!c.addressNumber.trim()) e.addressNumber = 'Informe o número (ou S/N).'
  return e
}

// ── máscaras ────────────────────────────────────────────────────────────────
const maskNumber = (v: string) => digits(v).slice(0, 19).replace(/(\d{4})(?=\d)/g, '$1 ')
const maskExpiry = (v: string) => { const d = digits(v).slice(0, 6); return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d }
const maskCpf = (v: string) => digits(v).slice(0, 11)
  .replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2')
const maskPhone = (v: string) => {
  const d = digits(v).slice(0, 11)
  if (d.length <= 2) return d.length ? `(${d}` : ''
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}
const maskCep = (v: string) => { const d = digits(v).slice(0, 8); return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d }

// ── campo ───────────────────────────────────────────────────────────────────
type FieldProps = React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; hint?: string }

const Field = forwardRef<HTMLInputElement, FieldProps>(function Field({ label, error, hint, className, id, ...props }, ref) {
  const auto = useId()
  const fid = id ?? auto
  const msgId = `${fid}-msg`
  return (
    <label htmlFor={fid} className={`block ${className ?? ''}`}>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <input
        ref={ref}
        id={fid}
        aria-invalid={!!error || undefined}
        aria-describedby={error || hint ? msgId : undefined}
        className="mt-1.5 h-11 w-full rounded-lg border border-border bg-background px-3 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-[#C8714A] focus:ring-3 focus:ring-[#C8714A]/15 aria-[invalid=true]:border-[#B3261E] aria-[invalid=true]:ring-[#B3261E]/10 sm:text-sm"
        {...props}
      />
      {(error || hint) && (
        <span id={msgId} className={`mt-1 block text-[12px] ${error ? 'text-[#B3261E] dark:text-red-400' : 'text-muted-foreground'}`}>
          {error ?? hint}
        </span>
      )}
    </label>
  )
})

/**
 * Dados do cartão no padrão do Atelier: um cartão de linho costurado mostra o que está sendo
 * digitado (bandeira, número, nome, validade) e os campos ficam em dois grupos, Cartão e Titular.
 * Erros aparecem embaixo de cada campo; quem chama decide quando mostrar (ex.: depois de tentar assinar).
 */
export function CardForm({ value, onChange, errors = {}, disabled }: {
  value: CardData
  onChange: (next: CardData) => void
  errors?: CardErrors
  disabled?: boolean
}) {
  const set = <K extends keyof CardData>(k: K, v: CardData[K]) => onChange({ ...value, [k]: v })
  const brand = cardBrand(value.number)
  const num = digits(value.number)
  const shown = num ? `•••• ${num.slice(-4).padStart(4, '•')}` : '•••• •••• •••• ••••'

  return (
    <div className="space-y-5" aria-disabled={disabled || undefined}>
      {/* cartão de linho: só mostra, não é campo */}
      <div
        aria-hidden="true"
        className="relative mx-auto aspect-[1.586] w-full max-w-[330px] overflow-hidden rounded-2xl p-5 text-[#F7F0E6] shadow-lg"
        style={{ background: 'repeating-linear-gradient(0deg, rgba(255,248,240,.035) 0 1px, transparent 1px 4px), repeating-linear-gradient(90deg, rgba(255,248,240,.03) 0 1px, transparent 1px 5px), #2C1810' }}
      >
        <span className="pointer-events-none absolute inset-2 rounded-xl border border-dashed border-[#D4A85A]/55" />
        <div className="relative flex h-full flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="h-7 w-10 rounded-md bg-gradient-to-br from-[#E9C887] to-[#B98A3E] opacity-90" />
            <span className="text-[13px] font-semibold tracking-[0.12em] text-[#E9C887]">{brand ?? ''}</span>
          </div>
          <p className="text-[21px] tracking-[0.14em]" style={{ ...SERIF, fontVariantNumeric: 'lining-nums tabular-nums' }}>{shown}</p>
          <div className="flex items-end justify-between gap-3 text-[11px] uppercase tracking-[0.12em]">
            <span className="min-w-0">
              <span className="block text-[9px] text-[#F7F0E6]/55">Titular</span>
              <span className="block truncate text-[12px]">{value.holderName.trim() || 'Seu nome'}</span>
            </span>
            <span className="shrink-0 text-right">
              <span className="block text-[9px] text-[#F7F0E6]/55">Validade</span>
              <span className="block text-[12px] tabular-nums">{value.expiry || 'MM/AA'}</span>
            </span>
          </div>
        </div>
      </div>

      <fieldset className="space-y-3" disabled={disabled}>
        <legend className="fin-cap mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Cartão</legend>
        <Field label="Nome impresso no cartão" placeholder="NOME SOBRENOME" autoComplete="cc-name" autoCapitalize="characters"
          value={value.holderName} onChange={(e) => set('holderName', e.target.value.toUpperCase())} error={errors.holderName}
          className="[&_input]:uppercase" />
        <Field label="Número do cartão" placeholder="0000 0000 0000 0000" inputMode="numeric" autoComplete="cc-number" maxLength={23}
          value={value.number} onChange={(e) => set('number', maskNumber(e.target.value))} error={errors.number}
          hint={brand ? `Bandeira ${brand}` : undefined} className="[&_input]:tracking-[0.08em] [&_input]:tabular-nums" />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Validade" placeholder="MM/AA" inputMode="numeric" autoComplete="cc-exp" maxLength={7}
            value={value.expiry} onChange={(e) => set('expiry', maskExpiry(e.target.value))} error={errors.expiry} />
          <Field label="CVV" placeholder="123" inputMode="numeric" autoComplete="cc-csc" maxLength={4} type="password"
            value={value.ccv} onChange={(e) => set('ccv', digits(e.target.value).slice(0, 4))} error={errors.ccv}
            hint={errors.ccv ? undefined : 'Atrás do cartão'} />
        </div>
      </fieldset>

      <fieldset className="space-y-3" disabled={disabled}>
        <legend className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Titular do cartão</legend>
        <p className="-mt-1 text-[12px] text-muted-foreground">O Asaas pede esses dados para o banco aprovar a cobrança.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="CPF" placeholder="000.000.000-00" inputMode="numeric" autoComplete="off"
            value={value.cpf} onChange={(e) => set('cpf', maskCpf(e.target.value))} error={errors.cpf} />
          <Field label="Telefone" placeholder="(00) 00000-0000" inputMode="tel" autoComplete="tel-national"
            value={value.phone} onChange={(e) => set('phone', maskPhone(e.target.value))} error={errors.phone} />
        </div>
        <div className="grid grid-cols-[1fr_7.5rem] gap-3">
          <Field label="CEP" placeholder="00000-000" inputMode="numeric" autoComplete="postal-code" maxLength={9}
            value={value.postalCode} onChange={(e) => set('postalCode', maskCep(e.target.value))} error={errors.postalCode} />
          <Field label="Número" placeholder="123" autoComplete="address-line2"
            value={value.addressNumber} onChange={(e) => set('addressNumber', e.target.value.slice(0, 10))} error={errors.addressNumber} />
        </div>
      </fieldset>

      <p className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
        <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        Os dados do cartão vão direto para o Asaas e não ficam salvos no Meu Atelier.
      </p>
    </div>
  )
}
