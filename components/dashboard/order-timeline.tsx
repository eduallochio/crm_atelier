'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { MessageSquare, History, Send } from 'lucide-react'
import { useOrderNotes, useOrderHistory, useCreateOrderNote } from '@/hooks/use-order-notes'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface OrderTimelineProps {
  orderId: string
}

export function OrderTimeline({ orderId }: OrderTimelineProps) {
  const [nota, setNota] = useState('')
  const { data: notes = [] } = useOrderNotes(orderId)
  const { data: history = [] } = useOrderHistory(orderId)
  const createNote = useCreateOrderNote()

  const handleSubmitNote = async () => {
    if (!nota.trim()) return

    await createNote.mutateAsync({ orderId, nota: nota.trim() })
    setNota('')
  }

  // Combinar notas e histórico em uma única timeline
  const timeline = [
    ...notes.map(note => ({
      id: note.id,
      type: 'note' as const,
      user: note.user_email,
      content: note.nota,
      date: note.created_at,
    })),
    ...history.map(item => ({
      id: item.id,
      type: 'history' as const,
      user: item.user_email,
      field: item.campo_alterado,
      oldValue: item.valor_anterior,
      newValue: item.valor_novo,
      date: item.created_at,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div className="space-y-4">
      {/* Adicionar Nova Nota */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Adicionar Nota
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Textarea
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder="Digite uma nota ou comentário sobre esta ordem..."
              rows={3}
            />
            <Button
              onClick={handleSubmitNote}
              disabled={!nota.trim() || createNote.isPending}
              size="sm"
            >
              <Send className="h-4 w-4 mr-2" />
              {createNote.isPending ? 'Enviando...' : 'Adicionar Nota'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="h-5 w-5" />
            Histórico e Notas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {timeline.length === 0 ? (
            <p className="text-center text-gray-500 py-8 text-sm">
              Nenhum registro ainda
            </p>
          ) : (
            <div className="space-y-4">
              {timeline.map((item) => (
                <div key={item.id} className="flex gap-3 border-b pb-4 last:border-0">
                  <div className="flex-shrink-0">
                    {item.type === 'note' ? (
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <MessageSquare className="h-4 w-4 text-blue-600" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <History className="h-4 w-4 text-gray-600" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-sm font-medium text-gray-900">
                        {item.user}
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(item.date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    {item.type === 'note' ? (
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {item.content}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-600">
                        Alterou <span className="font-medium">{item.field}</span>
                        {item.oldValue && (
                          <>
                            {' '}de <span className="text-red-600">{item.oldValue}</span>
                          </>
                        )}
                        {' '}para <span className="text-green-600">{item.newValue}</span>
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
