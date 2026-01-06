import { z } from 'zod'

export const serviceSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  descricao: z.string().optional(),
  preco: z.string().min(1, 'Preço é obrigatório'),
  categoria: z.string().optional(),
  tempo_estimado: z.string().optional(),
  ativo: z.boolean(),
})

export type ServiceInput = z.infer<typeof serviceSchema>

export interface Service {
  id: string
  organization_id: string
  nome: string
  descricao: string | null
  preco: number
  categoria: string | null
  tempo_estimado: string | null
  ativo: boolean
  created_at: string
}
