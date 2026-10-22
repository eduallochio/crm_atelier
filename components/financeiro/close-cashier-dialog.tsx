'use client'

import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AlertTriangle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

const closeCashierSchema = z.object({
  saldo_real: z.coerce.number().min(0, 'Saldo não pode ser negativo'),
  conferencia: z.object({
    dinheiro: z.coerce.number().min(0).default(0),
    pix: z.coerce.number().min(0).default(0),
    credito: z.coerce.number().min(0).default(0),
    debito: z.coerce.number().min(0).default(0),
    outros: z.coerce.number().min(0).default(0),
  }),
  observacoes_fechamento: z.string().optional(),
})

type CloseCashierInput = z.infer<typeof closeCashierSchema>

type CashierSession = {
  id: string
  caixa_id: string
  saldo_inicial: number
  status: 'aberto' | 'fechado'
}

interface CloseCashierDialogProps {
  sessao: CashierSession
  saldoEsperado: number
  onClose: () => void
  onConfirm: (data: CloseCashierInput) => Promise<void>
  isLoading?: boolean
}

export function CloseCashierDialog({ 
  sessao, 
  saldoEsperado, 
  onClose, 
  onConfirm, 
  isLoading 
}: CloseCashierDialogProps) {
  const [showDifference, setShowDifference] = useState(false)

  const form = useForm({
    resolver: zodResolver(closeCashierSchema),
    defaultValues: {
      saldo_real: saldoEsperado,
      conferencia: {
        dinheiro: 0,
        pix: 0,
        credito: 0,
        debito: 0,
        outros: 0,
      },
      observacoes_fechamento: '',
    },
  })

  const watchSaldoReal = useWatch({ control: form.control, name: 'saldo_real', defaultValue: saldoEsperado }) as number
  const watchConferencia = useWatch({ control: form.control, name: 'conferencia', defaultValue: { dinheiro: 0, pix: 0, credito: 0, debito: 0, outros: 0 } }) as { dinheiro: number; pix: number; credito: number; debito: number; outros: number }
  
  const diferenca = watchSaldoReal - saldoEsperado
  const totalConferencia = Object.values(watchConferencia).reduce((sum: number, val: number) => sum + val, 0)

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })
  }

  const handleSubmit = async (data: CloseCashierInput) => {
    if (Math.abs(diferenca) > 0.01) {
      setShowDifference(true)
      return
    }
    await onConfirm(data as CloseCashierInput)
  }

  const handleConfirmWithDifference = async () => {
    const data = form.getValues()
    await onConfirm(data as CloseCashierInput)
  }

  const CONF: { key: keyof CloseCashierInput['conferencia']; label: string }[] = [
    { key: 'dinheiro', label: 'Dinheiro' },
    { key: 'pix', label: 'PIX' },
    { key: 'credito', label: 'Crédito' },
    { key: 'debito', label: 'Débito' },
    { key: 'outros', label: 'Outros' },
  ]
  const money = (onChange: (v: number) => void) => (e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.valueAsNumber || 0)
  const ok = Math.abs(diferenca) <= 0.01

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] overflow-y-auto rounded-xl sm:max-w-150">
        <DialogHeader>
          <DialogTitle className="font-serif-display text-[28px] font-normal leading-tight" style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', Georgia, serif" }}>
            Fechar o caixa
          </DialogTitle>
          <DialogDescription>Conte o que há em cada forma de pagamento. A diferença aparece na hora, antes de fechar.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
            {/* o que o sistema esperava */}
            <div className="grid grid-cols-2 gap-3 rounded-xl border border-border/70 bg-muted/40 px-4 py-3.5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">O sistema esperava</p>
                <p className="mt-1 text-[30px] leading-none tabular-nums text-foreground" style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', Georgia, serif" }}>{formatCurrency(saldoEsperado)}</p>
              </div>
              <div className="text-right text-[13px] text-muted-foreground">
                <p>Saldo inicial</p>
                <p className="font-semibold tabular-nums text-foreground">{formatCurrency(sessao.saldo_inicial)}</p>
              </div>
            </div>

            {/* conferência por forma de pagamento */}
            <fieldset>
              <legend className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Conferência por forma de pagamento</legend>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {CONF.map((c) => (
                  <FormField key={c.key} control={form.control} name={`conferencia.${c.key}` as const}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[12.5px] font-medium text-muted-foreground">{c.label}</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" inputMode="decimal" placeholder="0,00" {...field} value={field.value as number}
                            onChange={money(field.onChange)} className="tabular-nums" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                ))}
                <div className="flex flex-col justify-end rounded-lg border border-dashed border-border px-3 py-2">
                  <span className="text-[12px] text-muted-foreground">Total conferido</span>
                  <b className="font-semibold tabular-nums">{formatCurrency(totalConferencia)}</b>
                </div>
              </div>
            </fieldset>

            {/* valor contado */}
            <FormField control={form.control} name="saldo_real"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor contado (total no caixa)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" inputMode="decimal" placeholder="0,00" {...field} value={field.value as number}
                      onChange={money(field.onChange)} className="h-12 text-lg tabular-nums" aria-describedby="close-diff" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

            <div id="close-diff" aria-live="polite"
              className={`flex items-start gap-2.5 rounded-lg px-4 py-3 text-sm ${ok ? 'bg-emerald-600/10 text-emerald-800 dark:text-emerald-300' : diferenca < 0 ? 'bg-red-600/10 text-red-700 dark:text-red-400' : 'bg-[#D4A85A]/15 text-[#7A5A1E] dark:text-[#E8C98A]'}`}>
              {!ok && <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />}
              <span>
                {ok ? 'Bateu certinho com o esperado.'
                  : diferenca < 0 ? <>Faltam <b className="tabular-nums">{formatCurrency(Math.abs(diferenca))}</b> no caixa. Confira antes de fechar ou anote o motivo.</>
                  : <>Sobram <b className="tabular-nums">{formatCurrency(diferenca)}</b> no caixa. Pode ter sido um troco não lançado.</>}
              </span>
            </div>

            <FormField control={form.control} name="observacoes_fechamento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl><Textarea placeholder="Ex.: troco separado para amanhã (opcional)" rows={2} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

            {showDifference ? (
              <div className="rounded-xl border border-dashed border-[#D4A85A] bg-[#D4A85A]/10 px-4 py-3.5">
                <p className="text-sm">
                  Fechar mesmo com <b className={diferenca > 0 ? 'text-[#7A5A1E] dark:text-[#E8C98A]' : 'text-red-700 dark:text-red-400'}>{diferenca > 0 ? 'sobra' : 'falta'} de {formatCurrency(Math.abs(diferenca))}</b>?
                </p>
                <div className="mt-3 flex justify-end gap-2">
                  <button type="button" className="cli-ghost" onClick={() => setShowDifference(false)}>Revisar</button>
                  <button type="button" className="cli-primary" style={{ minHeight: 44 }} onClick={handleConfirmWithDifference} disabled={isLoading}>
                    {isLoading ? 'Fechando...' : 'Fechar assim mesmo'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" className="cli-ghost" onClick={onClose}>Cancelar</button>
                <button type="submit" className="cli-primary" style={{ minHeight: 44 }} disabled={isLoading}>{isLoading ? 'Fechando...' : 'Fechar caixa'}</button>
              </div>
            )}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
