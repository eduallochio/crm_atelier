import type { Client } from '@/lib/validations/client'

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

/** "2026-10-12" ou ISO → partes [ano, mês(1-12), dia] sem mexer com fuso */
function ymd(value: string): [number, number, number] | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null
}

export function initialsOf(nome: string) {
  return nome.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?'
}

/** 12 out 2026 (ou só 12 out) */
export function formatDayMonthYear(value: string | null | undefined, short = false) {
  if (!value) return '—'
  const p = ymd(value)
  if (!p) return '—'
  return short ? `${p[2]} ${MESES[p[1] - 1]}` : `${p[2]} ${MESES[p[1] - 1]} ${p[0]}`
}

export function formatBRL(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function isBirthdayThisMonth(c: Client, now = new Date()) {
  const p = c.data_nascimento ? ymd(c.data_nascimento) : null
  return !!p && p[1] === now.getMonth() + 1
}

export function isNewThisMonth(c: Client, now = new Date()) {
  const p = c.data_cadastro ? ymd(c.data_cadastro) : null
  return !!p && p[0] === now.getFullYear() && p[1] === now.getMonth() + 1
}

/** 14 out */
export function birthdayLabel(c: Client) {
  const p = c.data_nascimento ? ymd(c.data_nascimento) : null
  return p ? `${p[2]} ${MESES[p[1] - 1]}` : ''
}

export function addressOf(c: Client) {
  const rua = [c.logradouro, c.numero].filter(Boolean).join(', ')
  const cidade = [c.cidade, c.estado].filter(Boolean).join('/')
  return [rua, c.complemento, c.bairro, cidade].filter(Boolean).join(' · ')
}

/** bairro · cidade (linha curta da lista) */
export function placeOf(c: Client) {
  return [c.bairro, c.cidade].filter(Boolean).join(' · ')
}

export function openWhatsApp(c: Client) {
  if (!c.telefone) return
  const tel = c.telefone.replace(/\D/g, '')
  const numero = tel.startsWith('55') ? tel : `55${tel}`
  const mensagem = encodeURIComponent(`Olá ${c.nome}!\n\nComo você está? Estou entrando em contato para...`)
  window.open(`https://wa.me/${numero}?text=${mensagem}`, '_blank')
}
