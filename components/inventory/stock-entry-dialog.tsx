'use client'

import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Plus, Trash2, Upload, CheckCircle2, AlertCircle, Loader2, UserPlus,
} from 'lucide-react'
import { useCreateStockEntry, useProducts, type StockEntryItem } from '@/hooks/use-inventory'
import { useActiveSuppliers, useCreateSupplier } from '@/hooks/use-suppliers'
import { parseNFe, type NFeParsed } from '@/lib/utils/nfe-parser'
import { SupplierDialog } from '@/components/forms/supplier-dialog'

const schema = z.object({
  tipo: z.enum(['manual', 'NFe', 'NFCe']).default('manual'),
  supplier_id: z.string().optional(),
  numero_nota: z.string().optional(),
  serie_nota: z.string().optional(),
  chave_acesso: z.string().optional(),
  emitente_cnpj: z.string().optional(),
  emitente_nome: z.string().optional(),
  data_emissao: z.string().optional(),
  valor_total: z.coerce.number().min(0).optional(),
  observacoes: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface ItemRow {
  product_id?: string
  produto_nome: string
  quantidade: number
  unidade: string
  preco_unitario?: number
  preco_total?: number
}

const UNIDADES = ['un', 'kg', 'g', 'm', 'cm', 'L', 'ml', 'par', 'rolo', 'pacote']

interface StockEntryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type XmlImportStatus =
  | { state: 'idle' }
  | { state: 'loading' }
  | { state: 'success'; nfe: NFeParsed }
  | { state: 'error'; message: string }

type SupplierLookupStatus =
  | { state: 'idle' }
  | { state: 'found'; id: string; nome: string }
  | { state: 'not_found'; cnpj: string; nome: string }

export function StockEntryDialog({ open, onOpenChange }: StockEntryDialogProps) {
  const createEntry = useCreateStockEntry()
  const createSupplier = useCreateSupplier()
  const { data: products = [] } = useProducts()
  const { data: suppliers = [] } = useActiveSuppliers()
  const xmlInputRef = useRef<HTMLInputElement>(null)

  const [items, setItems] = useState<ItemRow[]>([
    { produto_nome: '', quantidade: 1, unidade: 'un' },
  ])
  const [xmlStatus, setXmlStatus] = useState<XmlImportStatus>({ state: 'idle' })
  const [supplierStatus, setSupplierStatus] = useState<SupplierLookupStatus>({ state: 'idle' })
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false)
  const [newSupplierData, setNewSupplierData] = useState<{ nome: string; cnpj: string } | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { tipo: 'manual' },
  })

  const tipo = watch('tipo')

  useEffect(() => {
    if (open) {
      reset({ tipo: 'manual' })
      setItems([{ produto_nome: '', quantidade: 1, unidade: 'un' }])
      setXmlStatus({ state: 'idle' })
      setSupplierStatus({ state: 'idle' })
      setNewSupplierData(null)
    }
  }, [open, reset])

  // Quando o tipo muda para manual, limpa dados de NF
  useEffect(() => {
    if (tipo === 'manual') {
      setXmlStatus({ state: 'idle' })
      setSupplierStatus({ state: 'idle' })
    }
  }, [tipo])

  // ─── Importação XML ───────────────────────────────────────────────────────────

  const handleXmlFile = async (file: File) => {
    if (!file.name.endsWith('.xml')) {
      toast.error('Selecione um arquivo XML de NF-e ou NF-Ce')
      return
    }

    setXmlStatus({ state: 'loading' })

    try {
      const text = await file.text()
      const nfe = parseNFe(text)

      // Detecta tipo e ajusta o campo
      setValue('tipo', nfe.tipo)

      // Dados da nota
      setValue('numero_nota', nfe.numero_nota)
      setValue('serie_nota', nfe.serie_nota)
      setValue('chave_acesso', nfe.chave_acesso)
      setValue('emitente_cnpj', nfe.emitente.cnpj)
      setValue('emitente_nome', nfe.emitente.nome)
      setValue('data_emissao', nfe.data_emissao.split('T')[0]) // YYYY-MM-DD
      setValue('valor_total', nfe.valor_total)

      // Monta itens da nota
      const importedItems: ItemRow[] = nfe.itens.map(item => {
        // Tenta encontrar produto já cadastrado pelo nome
        const produtoNomeLower = item.nome.toLowerCase()
        const found = products.find(p =>
          p.nome.toLowerCase().includes(produtoNomeLower) ||
          produtoNomeLower.includes(p.nome.toLowerCase())
        )
        return {
          product_id: found?.id,
          produto_nome: found?.nome || item.nome,
          quantidade: item.quantidade,
          unidade: found?.unidade || item.unidade,
          preco_unitario: item.preco_unitario,
          preco_total: item.preco_total,
        }
      })
      setItems(importedItems.length ? importedItems : [{ produto_nome: '', quantidade: 1, unidade: 'un' }])

      setXmlStatus({ state: 'success', nfe })

      // Busca fornecedor pelo CNPJ
      if (nfe.emitente.cnpj) {
        await lookupSupplierByCnpj(nfe.emitente.cnpj, nfe.emitente.nome)
      }

      toast.success(`XML importado: ${nfe.itens.length} ${nfe.itens.length === 1 ? 'item' : 'itens'} encontrados`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao processar o arquivo XML'
      setXmlStatus({ state: 'error', message: msg })
      toast.error(msg)
    }
  }

  const lookupSupplierByCnpj = async (cnpj: string, nome: string) => {
    try {
      const cnpjClean = cnpj.replace(/\D/g, '')
      const res = await fetch(`/api/suppliers/by-cnpj?cnpj=${cnpjClean}`)
      if (!res.ok) return

      const supplier = await res.json()
      if (supplier?.id) {
        setValue('supplier_id', supplier.id)
        setSupplierStatus({ state: 'found', id: supplier.id, nome: supplier.nome })
      } else {
        setSupplierStatus({ state: 'not_found', cnpj, nome })
        setNewSupplierData({ cnpj, nome })
      }
    } catch {
      // silently fail
    }
  }

  const handleCreateSupplierFromXml = () => {
    setSupplierDialogOpen(true)
  }

  // ─── Manipulação de itens ─────────────────────────────────────────────────────

  const updateItem = (index: number, field: keyof ItemRow, value: string | number | undefined) => {
    setItems(prev => {
      const next = [...prev]
      const item = { ...next[index], [field]: value }

      if (field === 'quantidade' || field === 'preco_unitario') {
        const q = field === 'quantidade' ? Number(value) : item.quantidade
        const p = field === 'preco_unitario' ? Number(value) : item.preco_unitario
        if (q && p) item.preco_total = parseFloat((q * p).toFixed(2))
      }

      if (field === 'product_id' && value) {
        const prod = products.find(p => p.id === value)
        if (prod) {
          item.produto_nome = prod.nome
          item.unidade = prod.unidade
        }
      }

      if (field === 'product_id' && !value) {
        item.produto_nome = ''
      }

      next[index] = item
      return next
    })
  }

  const addItem = () => setItems(prev => [...prev, { produto_nome: '', quantidade: 1, unidade: 'un' }])

  const removeItem = (index: number) => {
    if (items.length === 1) return
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  const totalGeral = items.reduce((acc, item) => acc + (item.preco_total || 0), 0)

  const formatChaveAcesso = (value: string) =>
    value.replace(/\s/g, '').match(/.{1,4}/g)?.join(' ') || value

  // ─── Submit ───────────────────────────────────────────────────────────────────

  const onSubmit = async (values: FormValues) => {
    const validItems = items.filter(i => i.produto_nome.trim())
    if (!validItems.length) {
      toast.error('Adicione ao menos um item')
      return
    }

    try {
      await createEntry.mutateAsync({
        ...values,
        supplier_id: values.supplier_id || undefined,
        itens: validItems,
      } as Parameters<typeof createEntry.mutateAsync>[0])
      onOpenChange(false)
    } catch {
      // handled by hook
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Entrada de Estoque</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* ─── Tipo de entrada ───────────────────────────────────────────── */}
            <div className="space-y-2">
              <Label>Tipo de entrada</Label>
              <div className="flex gap-4">
                {(['manual', 'NFe', 'NFCe'] as const).map(t => (
                  <label key={t} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value={t}
                      {...register('tipo')}
                      className="accent-primary"
                    />
                    <span className="text-sm font-medium">
                      {t === 'manual' ? 'Manual' : t === 'NFe' ? 'NF-e' : 'NF-Ce'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* ─── Importar XML (NF-e / NF-Ce) ──────────────────────────────── */}
            {tipo !== 'manual' && (
              <div className="border border-border rounded-lg p-4 space-y-3 bg-muted/20">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">Importar arquivo XML</p>
                  {xmlStatus.state === 'idle' && (
                    <p className="text-xs text-muted-foreground">Opcional — ou preencha manualmente abaixo</p>
                  )}
                </div>

                {/* Botão de upload */}
                <div className="flex items-center gap-3">
                  <input
                    ref={xmlInputRef}
                    type="file"
                    accept=".xml"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0]
                      if (file) handleXmlFile(file)
                      e.target.value = '' // reset para permitir reimportar mesmo arquivo
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => xmlInputRef.current?.click()}
                    disabled={xmlStatus.state === 'loading'}
                    className="gap-2"
                  >
                    {xmlStatus.state === 'loading' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    {xmlStatus.state === 'loading' ? 'Processando...' : 'Selecionar XML da nota'}
                  </Button>

                  {xmlStatus.state === 'success' && (
                    <span className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400 font-medium">
                      <CheckCircle2 className="h-4 w-4" />
                      {xmlStatus.nfe.itens.length} {xmlStatus.nfe.itens.length === 1 ? 'item importado' : 'itens importados'}
                    </span>
                  )}

                  {xmlStatus.state === 'error' && (
                    <span className="flex items-center gap-1.5 text-sm text-red-500">
                      <AlertCircle className="h-4 w-4" />
                      {xmlStatus.message}
                    </span>
                  )}
                </div>

                {/* Feedback do fornecedor após importação */}
                {xmlStatus.state === 'success' && (
                  <>
                    {supplierStatus.state === 'found' && (
                      <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        Fornecedor encontrado e vinculado: <strong>{supplierStatus.nome}</strong>
                      </div>
                    )}
                    {supplierStatus.state === 'not_found' && (
                      <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg px-3 py-2">
                        <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                        <div className="flex-1 text-sm">
                          <span className="text-amber-800 dark:text-amber-300">
                            Fornecedor <strong>{supplierStatus.nome}</strong> não cadastrado.
                          </span>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={handleCreateSupplierFromXml}
                          className="shrink-0 gap-1.5 text-xs"
                        >
                          <UserPlus className="h-3.5 w-3.5" />
                          Cadastrar fornecedor
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ─── Fornecedor ────────────────────────────────────────────────── */}
            <div className="space-y-1.5">
              <Label htmlFor="supplier_id">Fornecedor (opcional)</Label>
              <select
                id="supplier_id"
                {...register('supplier_id')}
                className="w-full px-3 py-2 border border-input rounded-md text-sm bg-background text-foreground"
              >
                <option value="">— Selecionar fornecedor —</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.nome}</option>
                ))}
              </select>
            </div>

            {/* ─── Dados da Nota Fiscal (manual ou pós-XML) ─────────────────── */}
            {tipo !== 'manual' && (
              <div className="border border-border rounded-lg p-4 space-y-4 bg-muted/30">
                <p className="text-sm font-semibold text-foreground">Dados da Nota Fiscal</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="numero_nota">Número da nota</Label>
                    <Input id="numero_nota" {...register('numero_nota')} placeholder="000001" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="serie_nota">Série</Label>
                    <Input id="serie_nota" {...register('serie_nota')} placeholder="001" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="chave_acesso">Chave de acesso (44 dígitos)</Label>
                  <Input
                    id="chave_acesso"
                    {...register('chave_acesso')}
                    placeholder="0000 0000 0000 0000 0000 0000 0000 0000 0000 0000 0000"
                    className="font-mono text-xs"
                    onChange={e => {
                      const raw = e.target.value.replace(/\s/g, '').slice(0, 44)
                      e.target.value = formatChaveAcesso(raw)
                    }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="emitente_cnpj">CNPJ emitente</Label>
                    <Input id="emitente_cnpj" {...register('emitente_cnpj')} placeholder="00.000.000/0000-00" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="emitente_nome">Razão social emitente</Label>
                    <Input id="emitente_nome" {...register('emitente_nome')} placeholder="Empresa Ltda" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="data_emissao">Data de emissão</Label>
                    <Input id="data_emissao" type="date" {...register('data_emissao')} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="valor_total">Valor total (R$)</Label>
                    <Input
                      id="valor_total"
                      type="number"
                      step="0.01"
                      min="0"
                      {...register('valor_total')}
                      placeholder="0,00"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ─── Itens ────────────────────────────────────────────────────── */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">
                  Itens *
                  {xmlStatus.state === 'success' && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      Importados do XML
                    </Badge>
                  )}
                </Label>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Adicionar item
                </Button>
              </div>

              <div className="space-y-2">
                {items.map((item, index) => (
                  <div key={index} className="border border-border rounded-lg p-3 space-y-3 bg-card">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">Item {index + 1}</span>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="text-destructive hover:text-destructive/80 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Produto (select do catálogo ou nome avulso) */}
                      <div className="space-y-1.5 col-span-2">
                        <Label className="text-xs">Produto do catálogo (opcional)</Label>
                        <select
                          value={item.product_id || ''}
                          onChange={e => updateItem(index, 'product_id', e.target.value || undefined)}
                          className="w-full px-3 py-2 border border-input rounded-md text-sm bg-background text-foreground"
                        >
                          <option value="">— Produto avulso (digitar nome abaixo) —</option>
                          {products.filter(p => p.ativo).map(p => (
                            <option key={p.id} value={p.id}>{p.nome}</option>
                          ))}
                        </select>
                      </div>

                      {/* Nome do produto (sempre visível) */}
                      <div className="space-y-1.5 col-span-2">
                        <Label className="text-xs">Nome do produto *</Label>
                        <Input
                          value={item.produto_nome}
                          onChange={e => updateItem(index, 'produto_nome', e.target.value)}
                          placeholder={item.product_id ? 'Preenchido automaticamente' : 'Nome do produto'}
                          readOnly={!!item.product_id}
                          className={item.product_id ? 'bg-muted text-muted-foreground' : ''}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs">Quantidade *</Label>
                        <Input
                          type="number"
                          step="0.001"
                          min="0.001"
                          value={item.quantidade}
                          onChange={e => updateItem(index, 'quantidade', Number(e.target.value))}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs">Unidade</Label>
                        <select
                          value={item.unidade}
                          onChange={e => updateItem(index, 'unidade', e.target.value)}
                          className="w-full px-3 py-2 border border-input rounded-md text-sm bg-background text-foreground"
                        >
                          {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs">Preço unitário (R$)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.preco_unitario ?? ''}
                          onChange={e => updateItem(index, 'preco_unitario', e.target.value ? Number(e.target.value) : undefined)}
                          placeholder="0,00"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs">Total (R$)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.preco_total ?? ''}
                          readOnly
                          className="bg-muted text-muted-foreground"
                          placeholder="0,00"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {totalGeral > 0 && (
                <div className="flex justify-end">
                  <span className="text-sm font-semibold text-foreground">
                    Total geral: R$ {totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
            </div>

            {/* ─── Observações ──────────────────────────────────────────────── */}
            <div className="space-y-1.5">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                {...register('observacoes')}
                placeholder="Observações sobre esta entrada..."
                rows={3}
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : 'Registrar Entrada'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de cadastro rápido de fornecedor a partir do XML */}
      <SupplierDialog
        open={supplierDialogOpen}
        onOpenChange={setSupplierDialogOpen}
        supplier={newSupplierData ? {
          id: undefined as any,
          organization_id: '',
          nome: newSupplierData.nome,
          cpf_cnpj: newSupplierData.cnpj,
          ativo: true,
          created_at: '',
          updated_at: '',
        } : null}
        onSaved={saved => {
          setValue('supplier_id', saved.id)
          setSupplierStatus({ state: 'found', id: saved.id, nome: saved.nome })
          setNewSupplierData(null)
        }}
      />
    </>
  )
}
