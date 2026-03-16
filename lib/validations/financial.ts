import { z } from 'zod'

// Schema para Categoria Financeira
export const financialCategorySchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  tipo: z.enum(['receita', 'despesa'], {
    message: 'Tipo é obrigatório',
  }),
  cor: z.string().optional(),
  descricao: z.string().optional(),
  ativo: z.boolean().default(true),
})

export type FinancialCategoryInput = z.infer<typeof financialCategorySchema>

export interface FinancialCategory extends FinancialCategoryInput {
  id: string
  organization_id: string
  created_at: string
  updated_at: string
}

// Schema para Método de Pagamento
export const paymentMethodSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  tipo: z.enum(['dinheiro', 'cartao_credito', 'cartao_debito', 'pix', 'transferencia', 'boleto', 'outro']).optional(),
  ativo: z.boolean().default(true),
})

export type PaymentMethodInput = z.infer<typeof paymentMethodSchema>

export interface PaymentMethod extends PaymentMethodInput {
  id: string
  organization_id: string
  created_at: string
}

// Schema para Conta a Receber
export const receivableSchema = z.object({
  service_order_id: z.string().optional(),
  client_id: z.string().optional(),
  descricao: z.string().min(3, 'Descrição deve ter pelo menos 3 caracteres'),
  valor: z.string().min(1, 'Valor é obrigatório'),
  data_vencimento: z.string().min(1, 'Data de vencimento é obrigatória'),
  data_recebimento: z.string().optional(),
  status: z.enum(['pendente', 'recebido', 'atrasado', 'cancelado']).default('pendente'),
  category_id: z.string().optional(),
  payment_method_id: z.string().optional(),
  observacoes: z.string().optional(),
})

export type ReceivableInput = z.infer<typeof receivableSchema>

export interface Receivable {
  id: string
  organization_id: string
  service_order_id: string | null
  client_id: string | null
  descricao: string
  valor: number
  data_vencimento: string
  data_recebimento: string | null
  status: 'pendente' | 'recebido' | 'atrasado' | 'cancelado'
  category_id: string | null
  payment_method_id: string | null
  forma_pagamento: string | null
  observacoes: string | null
  created_at: string
  updated_at: string
}

// Schema para Conta a Pagar
export const payableSchema = z.object({
  supplier_id: z.string().optional(),
  category_id: z.string().optional(),
  descricao: z.string().min(3, 'Descrição deve ter pelo menos 3 caracteres'),
  valor: z.string().min(1, 'Valor é obrigatório'),
  data_vencimento: z.string().min(1, 'Data de vencimento é obrigatória'),
  data_pagamento: z.string().optional(),
  status: z.enum(['pendente', 'pago', 'atrasado', 'cancelado']).default('pendente'),
  categoria: z.string().optional(),
  forma_pagamento: z.string().optional(),
  observacoes: z.string().optional(),
})

export type PayableInput = z.infer<typeof payableSchema>

export interface Payable {
  id: string
  organization_id: string
  supplier_id: string | null
  fornecedor: string | null
  category_id: string | null
  descricao: string
  valor: number
  data_vencimento: string
  data_pagamento: string | null
  status: 'pendente' | 'pago' | 'atrasado' | 'cancelado'
  categoria: string | null
  forma_pagamento: string | null
  observacoes: string | null
  created_at: string
  updated_at: string
}

// Schema para Transação
export const transactionSchema = z.object({
  tipo: z.enum(['entrada', 'saida'], {
    message: 'Tipo é obrigatório',
  }),
  descricao: z.string().min(3, 'Descrição deve ter pelo menos 3 caracteres'),
  valor: z.string().min(1, 'Valor é obrigatório'),
  data_transacao: z.string().min(1, 'Data é obrigatória'),
  category_id: z.string().optional(),
  payment_method_id: z.string().optional(),
  receivable_id: z.string().optional(),
  payable_id: z.string().optional(),
  observacoes: z.string().optional(),
})

export type TransactionInput = z.infer<typeof transactionSchema>

export interface Transaction {
  id: string
  organization_id: string
  tipo: 'entrada' | 'saida'
  descricao: string
  valor: number
  data_transacao: string
  category_id: string | null
  payment_method_id: string | null
  receivable_id: string | null
  payable_id: string | null
  observacoes: string | null
  created_at: string
}
