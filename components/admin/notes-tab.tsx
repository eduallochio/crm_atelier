'use client'

import { useEffect, useState, useCallback } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { StickyNote, Plus, Trash2, Star, Tag } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

interface Note {
  id: string
  content: string
  tags?: string[]
  is_important: boolean
  created_by: string
  created_at: string
  admin_email?: string
}

interface NotesTabProps {
  organizationId: string
}

export function NotesTab({ organizationId }: NotesTabProps) {
  const [notes, setNotes] = useState<Note[]>([])
  const [newNote, setNewNote] = useState('')
  const [newTags, setNewTags] = useState('')
  const [isImportant, setIsImportant] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const fetchNotes = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createClient()

      // Tentar buscar notas da tabela
      const { data, error } = await supabase
        .from('admin_notes')
        .select('id, content, tags, is_important, created_by, created_at')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erro ao buscar notas:', error)
        setNotes([])
        return
      }

      // Buscar emails dos admins
      const adminIds = [...new Set((data || []).map(note => note.created_by).filter(Boolean))]
      
      let adminEmails: Record<string, string> = {}
      if (adminIds.length > 0) {
        const { data: admins } = await supabase
          .from('profiles')
          .select('id, email')
          .in('id', adminIds)

        adminEmails = (admins || []).reduce((acc, admin) => {
          acc[admin.id] = admin.email
          return acc
        }, {} as Record<string, string>)
      }

      const notesWithEmails = (data || []).map(note => ({
        ...note,
        admin_email: note.created_by ? adminEmails[note.created_by] : 'Desconhecido',
      }))

      setNotes(notesWithEmails)
    } catch (error) {
      console.error('Erro ao buscar notas:', error)
      setNotes([])
    } finally {
      setLoading(false)
    }
  }, [organizationId])

  useEffect(() => {
    fetchNotes()
  }, [fetchNotes])

  const handleAddNote = async () => {
    if (!newNote.trim()) {
      alert('Digite uma nota antes de salvar')
      return
    }

    setSaving(true)
    try {
      const supabase = createClient()

      // Buscar usuário atual
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const tags = newTags.split(',').map(t => t.trim()).filter(Boolean)

      const { data, error } = await supabase
        .from('admin_notes')
        .insert({
          organization_id: organizationId,
          content: newNote,
          tags: tags.length > 0 ? tags : null,
          is_important: isImportant,
          created_by: user.id,
        })
        .select()
        .single()

      if (error) throw error

      // Adicionar nota à lista
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', user.id)
        .single()

      setNotes([
        {
          ...data,
          admin_email: profile?.email || 'Você',
        },
        ...notes,
      ])

      // Limpar formulário
      setNewNote('')
      setNewTags('')
      setIsImportant(false)
    } catch (error) {
      console.error('Erro ao adicionar nota:', error)
      alert('Erro ao salvar nota. A tabela admin_notes pode não existir ainda.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Deseja realmente excluir esta nota?')) return

    try {
      const supabase = createClient()

      const { error } = await supabase
        .from('admin_notes')
        .delete()
        .eq('id', noteId)

      if (error) throw error

      setNotes(notes.filter(n => n.id !== noteId))
    } catch (error) {
      console.error('Erro ao excluir nota:', error)
      alert('Erro ao excluir nota')
    }
  }

  return (
    <div className="space-y-6">
      {/* Formulário de Nova Nota */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Adicionar Nova Nota
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Conteúdo da Nota
            </label>
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-950 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Digite sua nota aqui..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tags (separadas por vírgula)
            </label>
            <input
              type="text"
              value={newTags}
              onChange={(e) => setNewTags(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="ex: importante, suporte, billing"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="important"
              checked={isImportant}
              onChange={(e) => setIsImportant(e.target.checked)}
              className="rounded border-gray-300 dark:border-gray-700"
            />
            <label htmlFor="important" className="text-sm text-gray-700 dark:text-gray-300">
              Marcar como importante
            </label>
          </div>
          <Button onClick={handleAddNote} disabled={saving}>
            {saving ? 'Salvando...' : 'Adicionar Nota'}
          </Button>
        </div>
      </div>

      {/* Lista de Notas */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <StickyNote className="w-5 h-5" />
          Notas Anteriores
        </h3>

        {loading ? (
          <p className="text-center text-gray-600 dark:text-gray-400 py-8">
            Carregando notas...
          </p>
        ) : notes.length === 0 ? (
          <div className="text-center py-12">
            <StickyNote className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              Nenhuma nota registrada ainda
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notes.map((note) => (
              <div 
                key={note.id}
                className={`p-4 rounded-lg border ${
                  note.is_important 
                    ? 'border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-950'
                    : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {note.is_important && (
                      <Star className="w-4 h-4 text-yellow-600 dark:text-yellow-400 fill-current" />
                    )}
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Por <span className="font-medium">{note.admin_email}</span>
                      {' • '}
                      {format(new Date(note.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleDeleteNote(note.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                  </Button>
                </div>
                <p className="text-gray-900 dark:text-white whitespace-pre-wrap mb-2">
                  {note.content}
                </p>
                {note.tags && note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {note.tags.map((tag, idx) => (
                      <span 
                        key={idx}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 rounded-full text-xs"
                      >
                        <Tag className="w-3 h-3" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
