'use client'

import { useQuery } from '@tanstack/react-query'
import { Clock, TrendingUp, TrendingDown } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface PriceHistory {
  id: string
  old_price: number
  new_price: number
  changed_at: string
  change_reason: string | null
}

interface ServicePriceHistoryProps {
  serviceId: string
  serviceName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ServicePriceHistory({ 
  serviceId, 
  serviceName, 
  open, 
  onOpenChange 
}: ServicePriceHistoryProps) {
  const { data: history = [], isLoading } = useQuery({
    queryKey: ['service-price-history', serviceId],
    queryFn: async () => {
      const res = await fetch(`/api/services/${serviceId}/price-history`)
      if (!res.ok) throw new Error('Erro ao buscar histórico de preços')
      return res.json() as Promise<PriceHistory[]>
    },
    enabled: open,
  })

  const formatPrice = (price: number) => {
    return price.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getPriceChange = (oldPrice: number, newPrice: number) => {
    const diff = newPrice - oldPrice
    const percentage = ((diff / oldPrice) * 100).toFixed(1)
    return { diff, percentage }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-150">
        <DialogHeader>
          <DialogTitle>Histórico de Preços</DialogTitle>
          <DialogDescription>
            Alterações de preço do serviço: {serviceName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-125 overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
              <p className="mt-4 text-gray-500">Carregando histórico...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Nenhuma alteração de preço registrada</p>
              <p className="text-sm text-gray-400 mt-1">
                As mudanças de preço serão registradas automaticamente
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((entry) => {
                const { diff, percentage } = getPriceChange(entry.old_price, entry.new_price)
                const isIncrease = diff > 0

                return (
                  <div
                    key={entry.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {isIncrease ? (
                          <div className="p-2 bg-red-50 rounded-lg">
                            <TrendingUp className="h-4 w-4 text-red-600" />
                          </div>
                        ) : (
                          <div className="p-2 bg-green-50 rounded-lg">
                            <TrendingDown className="h-4 w-4 text-green-600" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900">
                            {isIncrease ? 'Aumento' : 'Redução'} de preço
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(entry.changed_at)}
                          </p>
                        </div>
                      </div>
                      <div className={`text-right ${isIncrease ? 'text-red-600' : 'text-green-600'}`}>
                        <p className="text-sm font-medium">
                          {isIncrease ? '+' : ''}{percentage}%
                        </p>
                        <p className="text-xs">
                          {isIncrease ? '+' : ''}{formatPrice(diff)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-3 pt-3 border-t">
                      <div>
                        <p className="text-xs text-gray-500">Preço Anterior</p>
                        <p className="text-sm font-semibold text-gray-700">
                          {formatPrice(entry.old_price)}
                        </p>
                      </div>
                      <div className="text-gray-400">→</div>
                      <div>
                        <p className="text-xs text-gray-500">Novo Preço</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {formatPrice(entry.new_price)}
                        </p>
                      </div>
                    </div>

                    {entry.change_reason && (
                      <div className="mt-2 pt-2 border-t">
                        <p className="text-xs text-gray-500">Motivo:</p>
                        <p className="text-sm text-gray-700">{entry.change_reason}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
