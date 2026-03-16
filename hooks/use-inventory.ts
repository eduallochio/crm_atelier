'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

export interface Product {
  id: string
  organization_id: string
  nome: string
  descricao?: string
  categoria?: string
  unidade: string
  quantidade_atual: number
  quantidade_minima: number
  preco_custo?: number
  codigo_barras?: string
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface StockEntryItem {
  id: string
  entry_id: string
  product_id?: string
  produto_nome: string
  quantidade: number
  unidade: string
  preco_unitario?: number
  preco_total?: number
}

export interface StockEntry {
  id: string
  organization_id: string
  supplier_id?: string
  fornecedor_nome?: string
  tipo: 'manual' | 'NFe' | 'NFCe'
  numero_nota?: string
  serie_nota?: string
  chave_acesso?: string
  emitente_cnpj?: string
  emitente_nome?: string
  data_emissao?: string
  valor_total?: number
  observacoes?: string
  created_at: string
  itens: StockEntryItem[]
}

export function useProducts() {
  return useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await fetch('/api/inventory/products')
      if (!res.ok) throw new Error('Erro ao buscar produtos')
      return res.json()
    },
  })
}

export function useCreateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<Product>) => {
      const res = await fetch('/api/inventory/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const e = await res.json()
        throw new Error(e.error)
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] })
      toast.success('Produto cadastrado!')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useUpdateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Product> & { id: string }) => {
      const res = await fetch(`/api/inventory/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const e = await res.json()
        throw new Error(e.error)
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] })
      toast.success('Produto atualizado!')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useDeleteProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/inventory/products/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const e = await res.json()
        throw new Error(e.error)
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] })
      toast.success('Produto removido!')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useStockEntries() {
  return useQuery<StockEntry[]>({
    queryKey: ['stock-entries'],
    queryFn: async () => {
      const res = await fetch('/api/inventory/entries')
      if (!res.ok) throw new Error('Erro ao buscar entradas')
      return res.json()
    },
  })
}

export function useCreateStockEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<StockEntry>) => {
      const res = await fetch('/api/inventory/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const e = await res.json()
        throw new Error(e.error)
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stock-entries'] })
      qc.invalidateQueries({ queryKey: ['products'] })
      toast.success('Entrada registrada com sucesso!')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}
