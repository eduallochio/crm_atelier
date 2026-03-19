'use client'

import { useState, useRef, useEffect } from 'react'
import { Target, Pencil, Check, X } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'

interface MonthlyGoalProps {
  currentRevenue: number
  isLoading?: boolean
}

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function parseCurrencyInput(raw: string): number {
  // Remove tudo que não é dígito ou vírgula/ponto
  const clean = raw.replace(/[^\d,\.]/g, '').replace(',', '.')
  return parseFloat(clean) || 0
}

export function MonthlyGoal({ currentRevenue, isLoading }: MonthlyGoalProps) {
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const { data } = useQuery({
    queryKey: ['monthly-goal'],
    queryFn: async () => {
      const res = await fetch('/api/settings/goals')
      if (!res.ok) return { monthly_revenue_goal: 0 }
      return res.json()
    },
    staleTime: 5 * 60 * 1000,
  })

  const goal: number = data?.monthly_revenue_goal ?? 0

  const mutation = useMutation({
    mutationFn: async (newGoal: number) => {
      const res = await fetch('/api/settings/goals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monthly_revenue_goal: newGoal }),
      })
      if (!res.ok) throw new Error('Falha ao salvar meta')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monthly-goal'] })
      toast.success('Meta atualizada!')
      setIsEditing(false)
    },
    onError: () => toast.error('Erro ao salvar meta'),
  })

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleEdit = () => {
    setInputValue(goal > 0 ? goal.toFixed(2).replace('.', ',') : '')
    setIsEditing(true)
  }

  const handleSave = () => {
    const newGoal = parseCurrencyInput(inputValue)
    mutation.mutate(newGoal)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setInputValue('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave()
    if (e.key === 'Escape') handleCancel()
  }

  const pct = goal > 0 ? Math.min((currentRevenue / goal) * 100, 100) : 0
  const overshoot = goal > 0 && currentRevenue > goal
  const remaining = goal > 0 ? Math.max(goal - currentRevenue, 0) : 0

  const barColor =
    overshoot ? 'bg-emerald-500' :
    pct >= 80   ? 'bg-emerald-500' :
    pct >= 50   ? 'bg-amber-500'   :
    pct > 0     ? 'bg-red-500'     :
                  'bg-slate-300 dark:bg-slate-700'

  const pctColor =
    overshoot ? 'text-emerald-600 dark:text-emerald-400' :
    pct >= 80  ? 'text-emerald-600 dark:text-emerald-400' :
    pct >= 50  ? 'text-amber-600 dark:text-amber-400'     :
                 'text-red-600 dark:text-red-400'

  const message =
    overshoot        ? 'Meta superada! Excelente trabalho.' :
    pct >= 80        ? 'Quase lá! Continue assim.' :
    pct >= 50        ? 'Bom progresso, mantenha o ritmo.' :
    pct > 0          ? 'Ainda há muito para recuperar.' :
    goal > 0         ? 'Nenhuma receita registrada ainda.' :
                       'Defina uma meta para acompanhar seu progresso.'

  return (
    <div className="relative bg-card rounded-2xl overflow-hidden border border-border/60 shadow-sm">
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-violet-500" />
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Meta do Mês
            </p>
            <p className="text-lg font-bold text-foreground leading-tight mt-0.5">
              {goal > 0 ? formatCurrency(goal) : 'Sem meta definida'}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!isEditing && (
              <button
                onClick={handleEdit}
                className="p-2 rounded-xl bg-violet-500 shadow-sm hover:bg-violet-600 transition-colors"
                title="Editar meta"
              >
                <Pencil className="h-3.5 w-3.5 text-white" />
              </button>
            )}
            {isEditing && (
              <>
                <button
                  onClick={handleSave}
                  disabled={mutation.isPending}
                  className="p-2 rounded-xl bg-emerald-500 shadow-sm hover:bg-emerald-600 transition-colors disabled:opacity-60"
                  title="Salvar"
                >
                  <Check className="h-3.5 w-3.5 text-white" />
                </button>
                <button
                  onClick={handleCancel}
                  className="p-2 rounded-xl bg-slate-400 shadow-sm hover:bg-slate-500 transition-colors"
                  title="Cancelar"
                >
                  <X className="h-3.5 w-3.5 text-white" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Input de edição */}
        {isEditing && (
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground shrink-0">R$</span>
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ex: 5000,00"
                className="flex-1 bg-muted/50 border border-border rounded-lg px-3 py-1.5 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500"
              />
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5">Enter para salvar · Esc para cancelar</p>
          </div>
        )}

        {/* Barra de progresso */}
        <Separator className="mb-4" />

        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-2 rounded-full" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] text-muted-foreground">
                {formatCurrency(currentRevenue)} recebidos
              </span>
              {goal > 0 && (
                <span className={cn('text-[12px] font-bold tabular-nums', pctColor)}>
                  {overshoot ? `+${(pct - 100).toFixed(0)}%` : `${pct.toFixed(0)}%`}
                </span>
              )}
            </div>

            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all duration-700', barColor)}
                style={{ width: `${pct}%` }}
              />
            </div>

            <div className="flex items-start gap-2 mt-3">
              <Target className={cn('h-3.5 w-3.5 shrink-0 mt-px', goal > 0 ? pctColor : 'text-muted-foreground')} />
              <p className="text-[11.5px] text-muted-foreground leading-snug">
                {message}
                {!overshoot && remaining > 0 && (
                  <span className="font-medium text-foreground"> Faltam {formatCurrency(remaining)}.</span>
                )}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
