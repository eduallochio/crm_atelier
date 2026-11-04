'use client'

import { useState } from 'react'
import { Ellipsis, Pencil, Plus, Power, Search, SearchX, Tag, Trash2 } from 'lucide-react'
import { Header } from '@/components/layouts/header'
import { STOCK_CSS, StockGate, StockTabs } from '@/components/inventory/stock-ui'
import { MASTER_DETAIL_CSS } from '@/components/dashboard/master-detail-css'
import { FIN_CSS } from '@/components/financeiro/finance-ui'
import { CategoryDialog } from '@/components/inventory/category-dialog'
import { useDeleteProductCategory, useProductCategories, useUpdateProductCategory, type ProductCategory } from '@/hooks/use-product-categories'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export default function CategoriasPage() {
  return (
    <StockGate message="O cadastro de categorias está disponível a partir do plano Pro.">
      <Categorias />
    </StockGate>
  )
}

function Categorias() {
  const { data: categories = [], isLoading } = useProductCategories()
  const updateCategory = useUpdateProductCategory()
  const deleteCategory = useDeleteProductCategory()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<ProductCategory | null>(null)
  const [deleting, setDeleting] = useState<ProductCategory | null>(null)
  const [query, setQuery] = useState('')

  const q = query.trim().toLowerCase()
  const list = categories
    .filter((c) => !q || c.nome.toLowerCase().includes(q))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))

  const handleNew = () => { setEditing(null); setDialogOpen(true) }

  return (
    <div className="flex h-full flex-col">
      <style>{MASTER_DETAIL_CSS + FIN_CSS + STOCK_CSS}</style>
      <Header
        title="Estoque"
        description="Categorias de produto"
        action={<button type="button" className="cli-primary" onClick={handleNew}><Plus className="h-4 w-4" aria-hidden="true" /><span className="hidden sm:inline">Nova categoria</span><span className="sm:hidden">Nova</span></button>}
      />
      <StockTabs />

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-7 sm:py-7">
        <label className="relative block max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar categoria" aria-label="Buscar categorias"
            className="h-11 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-[15px] outline-none focus:border-[#C8714A] focus:ring-3 focus:ring-[#C8714A]/15" />
        </label>
        <p className="mt-3 text-[13px] text-muted-foreground" aria-live="polite">{isLoading ? 'Carregando...' : `${list.length} ${list.length === 1 ? 'categoria' : 'categorias'}`}</p>

        <div className="mt-4 max-w-2xl">
          {isLoading ? (
            <ul className="space-y-2">{Array.from({ length: 4 }, (_, i) => <li key={i} className="h-16 animate-pulse rounded-xl bg-muted/60" />)}</ul>
          ) : categories.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border px-6 py-14 text-center text-sm text-muted-foreground">
              <Tag className="mx-auto h-7 w-7 text-[#C8A27A]" aria-hidden="true" />
              <p className="mt-3 mb-1 font-serif-display text-2xl text-foreground">Nenhuma categoria ainda</p>
              Organize os produtos em categorias como Tecidos, Aviamentos ou Linhas.
              <div className="mt-4"><button type="button" onClick={handleNew} className="cli-primary"><Plus className="h-4 w-4" aria-hidden="true" />Nova categoria</button></div>
            </div>
          ) : list.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border px-6 py-14 text-center text-sm text-muted-foreground">
              <SearchX className="mx-auto h-7 w-7 text-[#C8A27A]" aria-hidden="true" />
              <p className="mt-3 mb-1 font-serif-display text-2xl text-foreground">Nada encontrado</p>
              <div className="mt-4"><button type="button" onClick={() => setQuery('')} className="cli-ghost">Limpar busca</button></div>
            </div>
          ) : (
            <ul className="divide-y divide-dashed divide-border rounded-xl border border-border/70 bg-card">
              {list.map((c) => (
                <li key={c.id} className="flex items-center gap-3 px-4 py-3.5">
                  <span className="h-8 w-8 shrink-0 rounded-full" style={{ backgroundColor: c.cor || '#C8A27A' }} aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <b className={`block truncate text-[14.5px] font-semibold ${c.ativo ? 'text-foreground' : 'text-muted-foreground'}`}>{c.nome}</b>
                    <span className="block truncate text-[12.5px] text-muted-foreground">
                      {c.products_count} {c.products_count === 1 ? 'produto' : 'produtos'}
                      {!c.ativo && ' · Inativa'}
                    </span>
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button type="button" className="cli-ghost" style={{ minHeight: 36, paddingLeft: 10, paddingRight: 10 }} aria-label="Mais ações"><Ellipsis className="h-4 w-4" aria-hidden="true" /></button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                      <DropdownMenuItem onSelect={() => { setEditing(c); setDialogOpen(true) }} className="cursor-pointer"><Pencil className="mr-2 h-4 w-4" aria-hidden="true" /> Editar</DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => updateCategory.mutate({ id: c.id, data: { nome: c.nome, cor: c.cor, ativo: !c.ativo } })} className="cursor-pointer">
                        <Power className="mr-2 h-4 w-4" aria-hidden="true" /> {c.ativo ? 'Desativar' : 'Ativar'}
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => setDeleting(c)} className="cursor-pointer text-red-600 focus:text-red-600"><Trash2 className="mr-2 h-4 w-4" aria-hidden="true" /> Excluir</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <CategoryDialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditing(null) }} category={editing} />

      <AlertDialog open={!!deleting} onOpenChange={(o) => { if (!o) setDeleting(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir a categoria &ldquo;{deleting?.nome}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting && deleting.products_count > 0
                ? `Não é possível excluir: ${deleting.products_count} ${deleting.products_count === 1 ? 'produto está usando essa categoria' : 'produtos estão usando essa categoria'}. Mova ${deleting.products_count === 1 ? 'o produto' : 'os produtos'} para outra categoria antes de excluir.`
                : 'Essa ação não pode ser desfeita.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{deleting && deleting.products_count > 0 ? 'Fechar' : 'Cancelar'}</AlertDialogCancel>
            {deleting && deleting.products_count === 0 && (
              <AlertDialogAction
                onClick={(e) => { e.preventDefault(); deleteCategory.mutateAsync(deleting.id).then(() => setDeleting(null)).catch(() => {}) }}
                disabled={deleteCategory.isPending} className="bg-red-600 text-white hover:bg-red-700">
                {deleteCategory.isPending ? 'Excluindo...' : 'Excluir'}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
