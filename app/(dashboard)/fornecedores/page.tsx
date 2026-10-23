'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Building2, Ellipsis, Landmark, Mail, MapPin, MessageCircle, Pencil, Phone, Plus, Power, Search, SearchX, Truck, User } from 'lucide-react'
import { Header } from '@/components/layouts/header'
import { SupplierDialog } from '@/components/forms/supplier-dialog'
import { useDeleteSupplier, useSuppliers, type Supplier } from '@/hooks/use-suppliers'
import { useStockEntries } from '@/hooks/use-inventory'
import { usePayables } from '@/hooks/use-financial'
import { STOCK_CSS, StockTabs } from '@/components/inventory/stock-ui'
import { MASTER_DETAIL_CSS } from '@/components/dashboard/master-detail-css'
import { initialsOf } from '@/components/dashboard/client-utils'
import { FIN_CSS, brl, isOpenBill, shortDate } from '@/components/financeiro/finance-ui'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { whatsappNumber } from '@/lib/utils/whatsapp'

type Chip = '' | 'pj' | 'pf' | 'inactive'
const placeOf = (s: Supplier) => [s.cidade, s.estado].filter(Boolean).join('/')

/** Fornecedores à esquerda, ficha do fornecedor à direita: contato, pagamento, compras e contas */
export default function FornecedoresPage() {
  const { data: suppliers = [], isLoading } = useSuppliers()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Supplier | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [mobileDetail, setMobileDetail] = useState(false)
  const [query, setQuery] = useState('')
  const [chip, setChip] = useState<Chip>('')

  const counts = useMemo(() => ({
    pj: suppliers.filter((s) => s.ativo && (s.tipo_pessoa === 'juridica' || (s.cpf_cnpj ?? '').replace(/\D/g, '').length > 11)).length,
    pf: suppliers.filter((s) => s.ativo && s.tipo_pessoa === 'fisica').length,
    inactive: suppliers.filter((s) => !s.ativo).length,
  }), [suppliers])

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return suppliers
      .filter((s) => {
        if (q && !`${s.nome} ${s.nome_fantasia ?? ''} ${s.cpf_cnpj ?? ''} ${s.email ?? ''} ${s.telefone ?? ''}`.toLowerCase().includes(q)) return false
        if (chip === 'inactive') return !s.ativo
        if (!s.ativo) return false
        if (chip === 'pj') return s.tipo_pessoa === 'juridica' || (s.cpf_cnpj ?? '').replace(/\D/g, '').length > 11
        if (chip === 'pf') return s.tipo_pessoa === 'fisica'
        return true
      })
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  }, [suppliers, query, chip])

  const selected = list.find((s) => s.id === selectedId) ?? list[0] ?? null
  const handleNew = () => { setEditing(null); setDialogOpen(true) }

  return (
    <div className="flex h-full flex-col">
      <style>{MASTER_DETAIL_CSS + FIN_CSS + STOCK_CSS}</style>
      <Header
        title="Estoque"
        description="Fornecedores do ateliê"
        action={<button type="button" className="cli-primary" onClick={handleNew}><Plus className="h-4 w-4" aria-hidden="true" /><span className="hidden sm:inline">Novo fornecedor</span><span className="sm:hidden">Novo</span></button>}
      />
      <StockTabs />

      <div className="flex min-h-0 flex-1">
        <section aria-label="Lista de fornecedores" className={`flex min-h-0 w-full flex-col border-border/70 bg-card lg:w-[400px] lg:shrink-0 lg:border-r xl:w-[430px] ${mobileDetail ? 'hidden lg:flex' : 'flex'}`}>
          <div className="border-b border-dashed border-border px-4 pt-4 pb-3 sm:px-5">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nome, CNPJ, telefone ou e-mail" aria-label="Buscar fornecedores"
                className="h-11 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-[15px] outline-none focus:border-[#C8714A] focus:ring-3 focus:ring-[#C8714A]/15" />
            </label>
            <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="Filtros">
              {([['pj', 'Empresas'], ['pf', 'Pessoas físicas'], ['inactive', 'Inativos']] as const).map(([k, l]) => (
                <button key={k} type="button" className="cli-chip" aria-pressed={chip === k} onClick={() => setChip(chip === k ? '' : k)}>{l}{counts[k] ? <span className="tabular-nums opacity-70">{counts[k]}</span> : null}</button>
              ))}
            </div>
            <p className="mt-3 text-[13px] text-muted-foreground" aria-live="polite">{isLoading ? 'Carregando...' : `${list.length} ${list.length === 1 ? 'fornecedor' : 'fornecedores'}`}</p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
            {isLoading ? (
              <ul className="space-y-1 px-1">{Array.from({ length: 6 }, (_, i) => <li key={i} className="h-14 animate-pulse rounded-lg bg-muted/60" />)}</ul>
            ) : suppliers.length === 0 ? (
              <div className="px-6 py-14 text-center text-sm text-muted-foreground">
                <Truck className="mx-auto h-7 w-7 text-[#C8A27A]" aria-hidden="true" />
                <p className="mt-3 mb-1 font-serif-display text-2xl text-foreground">Nenhum fornecedor ainda</p>
                Cadastre o armarinho, a loja de tecidos e quem mais fornece para o ateliê. Ao importar uma nota, o fornecedor é encontrado pelo CNPJ.
                <div className="mt-4"><button type="button" onClick={handleNew} className="cli-primary"><Plus className="h-4 w-4" aria-hidden="true" />Novo fornecedor</button></div>
              </div>
            ) : list.length === 0 ? (
              <div className="px-6 py-14 text-center text-sm text-muted-foreground">
                <SearchX className="mx-auto h-7 w-7 text-[#C8A27A]" aria-hidden="true" />
                <p className="mt-3 mb-1 font-serif-display text-2xl text-foreground">Nada encontrado</p>
                <div className="mt-4"><button type="button" onClick={() => { setQuery(''); setChip('') }} className="cli-ghost">Limpar busca e filtros</button></div>
              </div>
            ) : (
              <ul>
                {list.map((s) => {
                  const on = selected?.id === s.id
                  return (
                    <li key={s.id}>
                      <button type="button" onClick={() => { setSelectedId(s.id); setMobileDetail(true) }} aria-current={on ? 'true' : undefined} className={`cli-row ${on ? 'is-on' : ''}`}>
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#C8714A]/15 text-[13px] font-semibold text-[#8A4B2C] dark:text-[#E39B78]" aria-hidden="true">{initialsOf(s.nome_fantasia || s.nome)}</span>
                        <span className="min-w-0 flex-1">
                          <b className={`block truncate text-[14.5px] font-semibold ${s.ativo ? 'text-foreground' : 'text-muted-foreground'}`}>{s.nome_fantasia || s.nome}</b>
                          <span className="block truncate text-[12.5px] text-muted-foreground">{s.telefone || s.email || placeOf(s) || s.cpf_cnpj || 'Sem contato'}</span>
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </section>

        <section aria-label="Ficha do fornecedor" className={`min-h-0 flex-1 overflow-y-auto ${mobileDetail ? 'block' : 'hidden lg:block'}`}>
          {selected ? (
            <SupplierDetail key={selected.id} s={selected} onEdit={() => { setEditing(selected); setDialogOpen(true) }} onBack={() => setMobileDetail(false)} onOff={() => { setSelectedId(null); setMobileDetail(false) }} />
          ) : !isLoading && suppliers.length > 0 ? <p className="p-10 text-sm text-muted-foreground">Escolha um fornecedor na lista.</p> : null}
        </section>
      </div>

      <SupplierDialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditing(null) }} supplier={editing} />
    </div>
  )
}

function SupplierDetail({ s, onEdit, onBack, onOff }: { s: Supplier; onEdit: () => void; onBack: () => void; onOff: () => void }) {
  const { data: entries = [] } = useStockEntries()
  const { data: payables = [] } = usePayables()
  const deleteSupplier = useDeleteSupplier()
  const [confirmOff, setConfirmOff] = useState(false)
  const compras = entries.filter((e) => e.supplier_id === s.id).sort((a, b) => b.created_at.localeCompare(a.created_at))
  const contas = payables.filter((p) => p.supplier_id === s.id && isOpenBill(p))
  const totalCompras = compras.reduce((t, e) => t + (Number(e.valor_total) || 0), 0)
  const tel = s.telefone?.replace(/\D/g, '')
  const pj = s.tipo_pessoa === 'juridica' || (s.cpf_cnpj ?? '').replace(/\D/g, '').length > 11
  const endereco = [[s.logradouro, s.numero].filter(Boolean).join(', '), s.complemento, s.bairro, placeOf(s), s.cep].filter(Boolean).join(' · ')
  const banco = [s.banco, s.agencia && `ag. ${s.agencia}`, s.conta && `conta ${s.conta}`].filter(Boolean).join(' · ')

  const box = 'rounded-xl border border-border/70 bg-card px-4 py-3.5'
  const boxTitle = 'mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground'

  return (
    <div className="cli-det px-4 py-5 sm:px-7 sm:py-7">
      <button type="button" onClick={onBack} className="mb-4 -ml-1 inline-flex min-h-11 items-center gap-2 rounded-md px-1 text-sm text-muted-foreground hover:text-foreground lg:hidden">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Fornecedores
      </button>
      <div className="flex items-center gap-4">
        <span className="flex h-15 w-15 shrink-0 items-center justify-center rounded-full bg-[#C8714A]/15 text-lg font-semibold text-[#8A4B2C] dark:text-[#E39B78]" aria-hidden="true">{initialsOf(s.nome_fantasia || s.nome)}</span>
        <div className="min-w-0">
          <h2 className="truncate font-serif-display text-[30px] leading-[1.05] sm:text-[34px]">{s.nome_fantasia || s.nome}</h2>
          <p className="mt-1 flex items-center gap-1.5 text-[13px] text-muted-foreground">
            {pj ? <Building2 className="h-3.5 w-3.5" aria-hidden="true" /> : <User className="h-3.5 w-3.5" aria-hidden="true" />}
            {s.nome_fantasia ? s.nome : pj ? 'Pessoa jurídica' : 'Pessoa física'}{s.cpf_cnpj ? ` · ${s.cpf_cnpj}` : ''}
            {!s.ativo && <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold">Inativo</span>}
          </p>
        </div>
      </div>

      <div className="mt-5 mb-6 flex flex-wrap gap-2">
        {tel && (
          <a href={`https://wa.me/${whatsappNumber(tel)}`} target="_blank" rel="noopener noreferrer" className="cli-primary" style={{ minHeight: 44 }}>
            <MessageCircle className="h-4 w-4" aria-hidden="true" />WhatsApp
          </a>
        )}
        <button type="button" className="cli-ghost" onClick={onEdit}><Pencil className="h-4 w-4" aria-hidden="true" />Editar</button>
        {s.ativo && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className="cli-ghost" style={{ paddingLeft: 12, paddingRight: 12 }} aria-label="Mais ações"><Ellipsis className="h-4 w-4" aria-hidden="true" /></button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onSelect={() => setConfirmOff(true)} className="cursor-pointer text-red-600 focus:text-red-600"><Power className="mr-2 h-4 w-4" aria-hidden="true" /> Desativar fornecedor</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="mb-5 grid grid-cols-3 gap-2.5 sm:gap-3">
        {[
          { l: 'Compras', v: String(compras.length) },
          { l: 'Total comprado', v: brl(totalCompras), small: true },
          { l: 'Contas em aberto', v: contas.length ? brl(contas.reduce((t, p) => t + (Number(p.valor) || 0), 0)) : '—', small: true, accent: contas.length > 0 },
        ].map((x) => (
          <div key={x.l} className={box}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{x.l}</p>
            <p className={`fin-num mt-1.5 ${x.small ? 'pt-1 text-[19px] sm:text-[26px]' : 'text-[30px]'} ${x.accent ? 'text-[#C8714A]' : ''}`}>{x.v}</p>
          </div>
        ))}
      </div>

      <div className="mb-5 grid gap-2.5 sm:grid-cols-2 sm:gap-3">
        <div className={box}>
          <h3 className={boxTitle}>Contato</h3>
          <div className="space-y-1.5 text-sm">
            {s.telefone && <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" aria-hidden="true" />{s.telefone}</p>}
            {s.email && <p className="flex items-center gap-2 break-all"><Mail className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />{s.email}</p>}
            {!s.telefone && !s.email && <p className="text-muted-foreground">Sem contato cadastrado</p>}
          </div>
        </div>
        <div className={box}>
          <h3 className={boxTitle}>Endereço</h3>
          <p className="flex items-start gap-2 text-sm">{endereco ? <><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />{endereco}</> : <span className="text-muted-foreground">Não informado</span>}</p>
        </div>
        <div className={box}>
          <h3 className={boxTitle}>Pagamento</h3>
          <div className="space-y-1 text-sm">
            {s.pix && <p className="break-all"><b className="font-semibold">PIX</b> {s.pix}</p>}
            {banco && <p className="flex items-center gap-2"><Landmark className="h-4 w-4 text-muted-foreground" aria-hidden="true" />{banco}</p>}
            {!s.pix && !banco && <p className="text-muted-foreground">Sem dados bancários</p>}
          </div>
        </div>
        <div className={box}>
          <h3 className={boxTitle}>Observações</h3>
          <p className="whitespace-pre-line text-sm">{s.observacoes || <span className="text-muted-foreground">Nenhuma</span>}</p>
        </div>
      </div>

      <div className={box}>
        <h3 className={`${boxTitle} flex items-center justify-between`}>Últimas compras {compras.length > 0 && <Link href="/estoque/entradas" className="normal-case tracking-normal text-[13px] font-semibold text-[#8A4B2C] hover:underline dark:text-[#E39B78]">Ver entradas</Link>}</h3>
        {compras.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma entrada de estoque ligada a este fornecedor.</p> : (
          <ul className="divide-y divide-dashed divide-border">
            {compras.slice(0, 6).map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span className="min-w-0 truncate">{shortDate(e.created_at)} · {e.numero_nota ? `Nota ${e.numero_nota}` : 'Entrada manual'} · {e.itens?.length ?? 0} {(e.itens?.length ?? 0) === 1 ? 'item' : 'itens'}</span>
                <b className="shrink-0 font-semibold tabular-nums">{e.valor_total != null ? brl(Number(e.valor_total)) : '—'}</b>
              </li>
            ))}
          </ul>
        )}
      </div>

      <AlertDialog open={confirmOff} onOpenChange={setConfirmOff}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar o fornecedor &ldquo;{s.nome}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>Ele deixa de aparecer nas listas, mas as compras e contas continuam guardadas.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); deleteSupplier.mutateAsync(s.id).then(() => { setConfirmOff(false); onOff() }).catch(() => {}) }}
              disabled={deleteSupplier.isPending} className="bg-red-600 text-white hover:bg-red-700">
              {deleteSupplier.isPending ? 'Desativando...' : 'Desativar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
