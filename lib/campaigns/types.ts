// Uma organização candidata a uma campanha, com os dados que a tela de
// /admin/campaigns precisa pra listar, filtrar e identificar quem é
// candidata de verdade (is_candidate) vs. só exibida por contexto.
export interface CampaignCandidate {
  organization_id: string
  organization_name: string
  plan: string
  created_at: string
  owner_id: string | null
  owner_name: string | null
  owner_email: string | null
  ever_paid: boolean
  last_campaign_sent_at: string | null
  is_candidate: boolean
  // Campos extras específicos de cada tipo de campanha (ex: dias sem
  // atividade, data de vencimento do bônus) — a tela decide o que mostrar
  extra?: Record<string, unknown>
}
