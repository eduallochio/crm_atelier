import { SupabaseClient } from '@supabase/supabase-js'
import { CampaignCandidate } from './types'
import { findReengagementCandidates } from './reengagement'
import { findLowUsageCandidates } from './low-usage'
import { findBonusEndingCandidates } from './bonus-ending'
import { findProductNewsCandidates } from './product-news'
import { sendReengajamento, sendUsoBaixo, sendBonusAcabando, sendNovidades } from '@/lib/email'

export type NovidadesContent = { titulo: string; descricao: string; ctaTexto: string; ctaUrl: string }

type SendEmailArgs = {
  to: string
  nome: string
  candidate?: CampaignCandidate
  content?: NovidadesContent
}

export type CampaignTypeConfig = {
  // Se o conteúdo do email precisa ser preenchido na tela a cada disparo
  // (ex: novidades) em vez de fixo no código
  requiresContent: boolean
  findCandidates: (supabase: SupabaseClient, options?: Record<string, unknown>) => Promise<CampaignCandidate[]>
  parseFilters?: (searchParams: URLSearchParams) => Record<string, unknown>
  sendEmail: (args: SendEmailArgs) => Promise<{ id: string | null }>
}

export const CAMPAIGN_TYPES: Record<string, CampaignTypeConfig> = {
  reengagement: {
    requiresContent: false,
    findCandidates: (supabase) => findReengagementCandidates(supabase),
    sendEmail: ({ to, nome }) => sendReengajamento(to, nome),
  },
  'low-usage': {
    requiresContent: false,
    findCandidates: (supabase, options) => findLowUsageCandidates(supabase, (options?.minDaysInactive as number) ?? 30),
    parseFilters: (searchParams) => {
      const raw = searchParams.get('minDaysInactive')
      const minDaysInactive = raw ? Number(raw) : 30
      return { minDaysInactive: Number.isFinite(minDaysInactive) && minDaysInactive > 0 ? minDaysInactive : 30 }
    },
    sendEmail: ({ to, nome }) => sendUsoBaixo(to, nome),
  },
  'bonus-ending': {
    requiresContent: false,
    findCandidates: (supabase, options) => findBonusEndingCandidates(supabase, (options?.withinDays as number) ?? 7),
    parseFilters: (searchParams) => {
      const raw = searchParams.get('withinDays')
      const withinDays = raw ? Number(raw) : 7
      return { withinDays: Number.isFinite(withinDays) && withinDays > 0 ? withinDays : 7 }
    },
    sendEmail: ({ to, nome, candidate }) => {
      const raw = candidate?.extra?.subscription_next_due_date as string | undefined
      const dataFim = raw ? new Date(raw).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : ''
      return sendBonusAcabando(to, nome, dataFim)
    },
  },
  'product-news': {
    requiresContent: true,
    findCandidates: (supabase) => findProductNewsCandidates(supabase),
    sendEmail: ({ to, nome, content }) => {
      if (!content) throw new Error('Conteúdo da campanha de novidades não informado')
      return sendNovidades(to, nome, content)
    },
  },
}

export function isCampaignType(type: string): boolean {
  return type in CAMPAIGN_TYPES
}
