import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getErrorMessage } from '@/lib/utils/error-message'

export interface ProductCategory {
  id: string
  nome: string
  cor?: string | null
  ativo: boolean
  products_count: number
  created_at: string
  updated_at: string
}

export type ProductCategoryInput = { nome: string; cor?: string | null; ativo?: boolean }

async function parseResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Erro ao processar categoria')
  return data as T
}

export function useProductCategories() {
  return useQuery({
    queryKey: ['product-categories'],
    queryFn: async () => {
      const res = await fetch('/api/product-categories')
      return parseResponse<ProductCategory[]>(res)
    },
  })
}

export function useCreateProductCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: ProductCategoryInput) => {
      const res = await fetch('/api/product-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      return parseResponse<ProductCategory>(res)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-categories'] })
      toast.success('Categoria criada!')
    },
    onError: (error: Error) => toast.error(getErrorMessage(error)),
  })
}

export function useUpdateProductCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ProductCategoryInput }) => {
      const res = await fetch(`/api/product-categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      return parseResponse<ProductCategory>(res)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-categories'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('Categoria atualizada!')
    },
    onError: (error: Error) => toast.error(getErrorMessage(error)),
  })
}

export function useDeleteProductCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/product-categories/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Erro ao excluir categoria')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-categories'] })
      toast.success('Categoria excluída!')
    },
    onError: (error: Error) => toast.error(getErrorMessage(error)),
  })
}
