import { z } from 'zod'

export const clientSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  telefone: z.string()
    .min(1, 'Telefone é obrigatório')
    .regex(/^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/, 'Informe um telefone válido com DDD. Ex: (11) 99999-9999'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  data_nascimento: z.string().optional(),
  observacoes: z.string().optional(),
  cep: z.string().optional(),
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
})

export type ClientInput = z.infer<typeof clientSchema>

export interface Client {
  id: string
  organization_id: string
  nome: string
  telefone: string | null
  email: string | null
  data_nascimento: string | null
  observacoes: string | null
  cep: string | null
  logradouro: string | null
  numero: string | null
  complemento: string | null
  bairro: string | null
  cidade: string | null
  estado: string | null
  data_cadastro: string
  created_at: string
}
