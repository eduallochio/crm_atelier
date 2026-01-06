import { z } from 'zod'

export const serviceOrderItemSchema = z.object({
  service_id: z.string().uuid(),
  service_nome: z.string(),
  quantidade: z.number().min(1),
  valor_unitario: z.number(),
  valor_total: z.number(),
})

export const serviceOrderSchema = z.object({
  client_id: z.string().uuid('Selecione um cliente'),
  status: z.enum(['pendente', 'em_andamento', 'concluido', 'cancelado']),
  data_prevista: z.string().optional(),
  observacoes: z.string().optional(),
  valor_entrada: z.number().min(0, 'Valor de entrada deve ser positivo').default(0),
  desconto_valor: z.number().min(0, 'Desconto deve ser positivo').default(0),
  desconto_percentual: z.number().min(0).max(100, 'Desconto deve ser entre 0 e 100%').default(0),
  notas_internas: z.string().optional(),
  items: z.array(serviceOrderItemSchema).min(1, 'Adicione pelo menos um serviço'),
})

export type ServiceOrderItemInput = z.infer<typeof serviceOrderItemSchema>
export type ServiceOrderInput = z.infer<typeof serviceOrderSchema>

// Interfaces para histórico e notas
export interface ServiceOrderHistory {
  id: string
  order_id: string
  organization_id: string
  user_email: string
  campo_alterado: string
  valor_anterior: string | null
  valor_novo: string | null
  created_at: string
}

export interface ServiceOrderNote {
  id: string
  order_id: string
  organization_id: string
  user_email: string
  nota: string
  created_at: string
}

export interface ServiceOrderItem {
  id: string
  order_id: string
  service_id: string | null
  service_nome: string
  quantidade: number
  valor_unitario: number
  valor_total: number
  created_at: string
}

export interface ServiceOrder {
  id: string
  numero: number
  organization_id: string
  client_id: string | null
  status: 'pendente' | 'em_andamento' | 'concluido' | 'cancelado'
  valor_total: number
  valor_entrada: number
  valor_pago: number
  status_pagamento: 'pendente' | 'parcial' | 'pago'
  desconto_valor: number
  desconto_percentual: number
  data_abertura: string
  data_prevista: string | null
  data_conclusao: string | null
  observacoes: string | null
  fotos: string[] | null
  notas_internas: string | null
  created_at: string
  client?: {
    id: string
    nome: string
    telefone: string | null
    email: string | null
  }
  items?: ServiceOrderItem[]
}
