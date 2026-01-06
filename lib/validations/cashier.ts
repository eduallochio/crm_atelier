import { z } from 'zod'

// Schema para Caixa
export const cashierSchema = z.object({
  id: z.string().uuid().optional(),
  organization_id: z.string().uuid().optional(),
  nome: z.string().min(1, 'Nome é obrigatório').max(100),
  descricao: z.string().optional(),
  ativo: z.boolean().default(true),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
})

export type Cashier = z.infer<typeof cashierSchema>

// Tipo estendido com relações
export type CashierWithRelations = Cashier & {
  org_cashiers?: { nome: string }
}

// Schema para Sessão de Caixa
export const cashierSessionSchema = z.object({
  id: z.string().uuid().optional(),
  organization_id: z.string().uuid().optional(),
  caixa_id: z.string().uuid({ message: 'Caixa é obrigatório' }),
  usuario_abertura_id: z.string().uuid().optional(),
  usuario_fechamento_id: z.string().uuid().optional().nullable(),
  data_abertura: z.string().optional(),
  data_fechamento: z.string().optional().nullable(),
  saldo_inicial: z.number().min(0, 'Saldo inicial não pode ser negativo'),
  saldo_esperado: z.number().optional().nullable(),
  saldo_real: z.number().optional().nullable(),
  diferenca: z.number().optional().nullable(),
  status: z.enum(['aberto', 'fechado']).default('aberto'),
  observacoes_abertura: z.string().optional(),
  observacoes_fechamento: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
})

export type CashierSession = z.infer<typeof cashierSessionSchema>

// Tipo estendido com relações
export type CashierSessionWithRelations = CashierSession & {
  org_cashiers?: { nome: string }
}

// Schema para Movimentação de Caixa
export const cashierMovementSchema = z.object({
  id: z.string().uuid().optional(),
  organization_id: z.string().uuid().optional(),
  sessao_id: z.string().uuid({ message: 'Sessão de caixa é obrigatória' }),
  tipo: z.enum(['entrada', 'saida', 'sangria', 'reforco'], {
    message: 'Tipo deve ser entrada, saida, sangria ou reforco'
  }),
  valor: z.number().positive('Valor deve ser positivo'),
  descricao: z.string().min(1, 'Descrição é obrigatória'),
  metodo_pagamento_id: z.string().uuid().optional().nullable(),
  referencia_id: z.string().uuid().optional().nullable(),
  referencia_tipo: z.string().optional().nullable(),
  usuario_id: z.string().uuid().optional(),
  data_movimento: z.string().optional(),
  observacoes: z.string().optional(),
  created_at: z.string().optional(),
})

export type CashierMovement = z.infer<typeof cashierMovementSchema>

// Schema para Conferência de Caixa
export const cashierReconciliationSchema = z.object({
  id: z.string().uuid().optional(),
  organization_id: z.string().uuid().optional(),
  sessao_id: z.string().uuid({ message: 'Sessão de caixa é obrigatória' }),
  metodo_pagamento_id: z.string().uuid({ message: 'Método de pagamento é obrigatório' }),
  valor_esperado: z.number().default(0),
  valor_informado: z.number().min(0, 'Valor não pode ser negativo'),
  diferenca: z.number().optional(),
  observacoes: z.string().optional(),
  created_at: z.string().optional(),
})

export type CashierReconciliation = z.infer<typeof cashierReconciliationSchema>

// Schemas para inputs (sem campos gerados/opcionais)
export const cashierInputSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(100),
  descricao: z.string().optional(),
  ativo: z.boolean().default(true),
})

export const cashierSessionInputSchema = z.object({
  caixa_id: z.string().uuid({ message: 'Caixa é obrigatório' }),
  saldo_inicial: z.number().min(0, 'Saldo inicial não pode ser negativo'),
  saldo_real: z.number().optional().nullable(),
  status: z.enum(['aberto', 'fechado']).default('aberto'),
  observacoes_abertura: z.string().optional(),
  observacoes_fechamento: z.string().optional(),
})

export const cashierMovementInputSchema = z.object({
  sessao_id: z.string().uuid({ message: 'Sessão de caixa é obrigatória' }),
  tipo: z.enum(['entrada', 'saida', 'sangria', 'reforco'], {
    message: 'Tipo deve ser entrada, saida, sangria ou reforco'
  }),
  valor: z.number().positive('Valor deve ser positivo'),
  descricao: z.string().min(1, 'Descrição é obrigatória'),
  metodo_pagamento_id: z.string().uuid().optional().nullable(),
  referencia_id: z.string().uuid().optional().nullable(),
  referencia_tipo: z.string().optional().nullable(),
  observacoes: z.string().optional(),
})

export const cashierReconciliationInputSchema = z.object({
  sessao_id: z.string().uuid({ message: 'Sessão de caixa é obrigatória' }),
  metodo_pagamento_id: z.string().uuid({ message: 'Método de pagamento é obrigatório' }),
  valor_esperado: z.number().default(0),
  valor_informado: z.number().min(0, 'Valor não pode ser negativo'),
  observacoes: z.string().optional(),
})

export type CashierInput = z.infer<typeof cashierInputSchema>
export type CashierSessionInput = z.infer<typeof cashierSessionInputSchema>
export type CashierMovementInput = z.infer<typeof cashierMovementInputSchema>
export type CashierReconciliationInput = z.infer<typeof cashierReconciliationInputSchema>
