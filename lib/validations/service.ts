import { z } from 'zod'

export const serviceMaterialSchema = z.object({
  product_id: z.string().nullable().optional(),
  produto_nome: z.string().min(1),
  quantidade: z.number().min(0.001),
  unidade: z.string(),
  preco_custo: z.number().min(0).optional(),
})

export type ServiceMaterial = z.infer<typeof serviceMaterialSchema>

export const serviceSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  descricao: z.string().optional(),
  preco: z.string().min(1, 'Preço é obrigatório'),
  categoria: z.string().optional(),
  tempo_estimado: z.string().optional(),
  materiais_produtos: z.array(serviceMaterialSchema).optional(),
  observacoes_tecnicas: z.string().optional(),
  nivel_dificuldade: z.enum(['facil', 'medio', 'dificil', '']).optional(),
  tempo_minimo: z.string().optional(),
  tempo_maximo: z.string().optional(),
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
  materiais: string | null
  custo_materiais: number | null
  materiais_json: string | null
  materiais_produtos?: ServiceMaterial[]
  observacoes_tecnicas: string | null
  nivel_dificuldade: string | null
  tempo_minimo: string | null
  tempo_maximo: string | null
  imagens: string[] | null
  ativo: boolean
  created_at: string
}
