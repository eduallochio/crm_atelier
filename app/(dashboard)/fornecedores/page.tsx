'use client'

import { useState, useMemo } from 'react'
import { Plus, Search, Truck, Building2, Phone, Mail, Pencil, Trash2, CheckCircle, XCircle } from 'lucide-react'
import { Header } from '@/components/layouts/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { SupplierDialog } from '@/components/forms/supplier-dialog'
import { useSuppliers, useDeleteSupplier, type Supplier } from '@/hooks/use-suppliers'

export default function FornecedoresPage() {
  const { data: suppliers = [], isLoading } = useSuppliers()
  const deleteSupplier = useDeleteSupplier()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'ativos' | 'inativos'>('ativos')

  const filtered = useMemo(() => {
    return suppliers.filter(s => {
      const q = search.toLowerCase()
      const matchSearch = !search ||
        s.nome.toLowerCase().includes(q) ||
        (s.cpf_cnpj || '').toLowerCase().includes(q) ||
        (s.email || '').toLowerCase().includes(q) ||
        (s.telefone || '').toLowerCase().includes(q)
      const matchStatus =
        statusFilter === 'all' ? true :
        statusFilter === 'ativos' ? s.ativo :
        !s.ativo
      return matchSearch && matchStatus
    })
  }, [suppliers, search, statusFilter])

  const ativos = suppliers.filter(s => s.ativo)
  const comCnpj = ativos.filter(s => s.cpf_cnpj)

  const handleEdit = (supplier: Supplier) => {
    setSelectedSupplier(supplier)
    setDialogOpen(true)
  }

  const handleNew = () => {
    setSelectedSupplier(null)
    setDialogOpen(true)
  }

  const handleDelete = async (supplier: Supplier) => {
    if (!confirm(`Desativar o fornecedor "${supplier.nome}"?`)) return
    await deleteSupplier.mutateAsync(supplier.id)
  }

  return (
    <div>
      <Header
        title="Fornecedores"
        description="Gerencie os fornecedores do seu ateliê"
      />

      <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {/* Total Ativos */}
          <div className="relative bg-card rounded-2xl overflow-hidden border border-border/60 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-blue-500" />
            <div className="p-4 sm:p-5">
              <div className="flex items-start justify-between mb-3">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Total Ativos</p>
                <div className="p-2 rounded-xl bg-blue-500 shadow-sm shrink-0">
                  <Truck className="h-3.5 w-3.5 text-white" />
                </div>
              </div>
              <p className="text-3xl font-bold text-foreground mb-3">{ativos.length}</p>
              <div className="h-px bg-border/50 mb-2" />
              <p className="text-[10.5px] text-muted-foreground">fornecedores ativos</p>
            </div>
          </div>

          {/* Com CNPJ */}
          <div className="relative bg-card rounded-2xl overflow-hidden border border-border/60 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-emerald-500" />
            <div className="p-4 sm:p-5">
              <div className="flex items-start justify-between mb-3">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Com CNPJ</p>
                <div className="p-2 rounded-xl bg-emerald-500 shadow-sm shrink-0">
                  <Building2 className="h-3.5 w-3.5 text-white" />
                </div>
              </div>
              <p className="text-3xl font-bold text-foreground mb-3">{comCnpj.length}</p>
              <div className="h-px bg-border/50 mb-2" />
              <p className="text-[10.5px] text-muted-foreground">pessoa jurídica</p>
            </div>
          </div>

          {/* Total Cadastrado */}
          <div className="relative bg-card rounded-2xl overflow-hidden border border-border/60 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 col-span-2 sm:col-span-1">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-violet-500" />
            <div className="p-4 sm:p-5">
              <div className="flex items-start justify-between mb-3">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Total Cadastrado</p>
                <div className="p-2 rounded-xl bg-violet-500 shadow-sm shrink-0">
                  <Truck className="h-3.5 w-3.5 text-white" />
                </div>
              </div>
              <p className="text-3xl font-bold text-foreground mb-3">{suppliers.length}</p>
              <div className="h-px bg-border/50 mb-2" />
              <p className="text-[10.5px] text-muted-foreground">incluindo inativos</p>
            </div>
          </div>
        </div>

        {/* Barra de ações */}
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, CNPJ, telefone ou e-mail..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={handleNew} size="sm" className="shrink-0">
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Novo Fornecedor</span>
            </Button>
          </div>

          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
              className="px-3 py-2 border border-border rounded-md text-sm bg-background text-foreground hover:bg-accent"
            >
              <option value="ativos">Somente Ativos</option>
              <option value="inativos">Somente Inativos</option>
              <option value="all">Todos</option>
            </select>
          </div>
        </div>

        {/* Contador */}
        <div className="text-sm text-muted-foreground">
          {isLoading ? (
            <span>Carregando...</span>
          ) : (
            <span>
              {filtered.length} {filtered.length === 1 ? 'fornecedor' : 'fornecedores'}
              {search && ' encontrado(s)'}
            </span>
          )}
        </div>

        {/* Tabela */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <Truck className="h-12 w-12 text-muted-foreground/40" />
              <p className="text-muted-foreground font-medium">
                {search ? 'Nenhum fornecedor encontrado' : 'Nenhum fornecedor cadastrado'}
              </p>
              {!search && (
                <Button variant="outline" size="sm" onClick={handleNew}>
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Cadastrar primeiro fornecedor
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Fornecedor</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">CNPJ</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Contato</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">E-mail</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((supplier, i) => (
                    <tr
                      key={supplier.id}
                      className={`border-b border-border last:border-0 hover:bg-muted/20 transition-colors ${i % 2 === 0 ? '' : 'bg-muted/10'}`}
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-foreground">{supplier.nome}</p>
                          {supplier.telefone && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 sm:hidden">
                              <Phone className="h-3 w-3" />
                              {supplier.telefone}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="text-sm text-muted-foreground font-mono">
                          {supplier.cpf_cnpj || <span className="text-muted-foreground/40">—</span>}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="space-y-0.5">
                          {supplier.telefone && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {supplier.telefone}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {supplier.email ? (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {supplier.email}
                          </p>
                        ) : (
                          <span className="text-muted-foreground/40">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {supplier.ativo ? (
                          <Badge variant="default" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0 gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Ativo
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1">
                            <XCircle className="h-3 w-3" />
                            Inativo
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(supplier)}
                            className="h-8 w-8 p-0"
                            title="Editar"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          {supplier.ativo && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(supplier)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              title="Desativar"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <SupplierDialog
        open={dialogOpen}
        onOpenChange={open => {
          setDialogOpen(open)
          if (!open) setSelectedSupplier(null)
        }}
        supplier={selectedSupplier}
      />
    </div>
  )
}
