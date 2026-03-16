'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { UserPlus, Trash2, Shield, User, Crown, Loader2, Eye, EyeOff } from 'lucide-react'

interface OrgUser {
  id: string
  full_name: string
  email: string
  role: 'owner' | 'admin' | 'member'
  is_owner: boolean
  created_at: string
}

const ROLE_LABELS: Record<string, string> = {
  owner: 'Proprietário',
  admin: 'Administrador',
  member: 'Membro',
}

const ROLE_COLORS: Record<string, string> = {
  owner: 'bg-violet-100 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800',
  admin: 'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  member: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
}

export function UsersManagementForm() {
  const queryClient = useQueryClient()
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role: 'member' })
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const { data: users = [], isLoading } = useQuery<OrgUser[]>({
    queryKey: ['org-users'],
    queryFn: async () => {
      const res = await fetch('/api/users')
      if (!res.ok) throw new Error('Falha ao buscar usuários')
      return res.json()
    },
  })

  const inviteMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erro ao criar usuário')
      return json
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-users'] })
      toast.success('Usuário criado com sucesso!')
      setForm({ full_name: '', email: '', password: '', role: 'member' })
      setShowInviteForm(false)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const rolesMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erro ao alterar cargo')
      return json
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-users'] })
      toast.success('Cargo atualizado!')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erro ao remover usuário')
      return json
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-users'] })
      toast.success('Usuário removido.')
      setDeletingId(null)
    },
    onError: (err: Error) => {
      toast.error(err.message)
      setDeletingId(null)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    inviteMutation.mutate(form)
  }

  const owner = users.find(u => u.is_owner)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-foreground">Membros da equipe</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            {users.length} {users.length === 1 ? 'usuário' : 'usuários'} na organização
          </p>
        </div>
        {!showInviteForm && (
          <Button onClick={() => setShowInviteForm(true)} size="sm" className="gap-1.5">
            <UserPlus className="h-3.5 w-3.5" />
            Novo Usuário
          </Button>
        )}
      </div>

      {/* Formulário de convite */}
      {showInviteForm && (
        <form
          onSubmit={handleSubmit}
          className="relative bg-card rounded-2xl overflow-hidden border border-border/60 shadow-sm p-5 space-y-4"
        >
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-indigo-500" />
          <p className="text-sm font-semibold text-foreground">Criar novo usuário</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Nome completo</Label>
              <Input
                placeholder="João da Silva"
                value={form.full_name}
                onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="joao@exemplo.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Senha inicial</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 6 caracteres"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="pr-9"
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Cargo</Label>
              <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="member">Membro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Button type="submit" size="sm" disabled={inviteMutation.isPending} className="gap-1.5">
              {inviteMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Criar Usuário
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => { setShowInviteForm(false); setForm({ full_name: '', email: '', password: '', role: 'member' }) }}
            >
              Cancelar
            </Button>
          </div>
        </form>
      )}

      {/* Lista de usuários */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="h-16 bg-muted rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {users.map(u => (
            <div
              key={u.id}
              className="relative bg-card rounded-2xl overflow-hidden border border-border/60 shadow-sm"
            >
              <div className={`absolute top-0 left-0 right-0 h-[3px] ${u.is_owner ? 'bg-violet-500' : u.role === 'admin' ? 'bg-blue-500' : 'bg-slate-400'}`} />
              <div className="p-4 flex items-center gap-4">
                {/* Avatar */}
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${u.is_owner ? 'bg-violet-100 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                  {u.full_name?.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?'}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground truncate">{u.full_name}</p>
                    {u.is_owner && <Crown className="h-3.5 w-3.5 text-violet-500 shrink-0" />}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                </div>

                {/* Role selector ou badge */}
                {u.is_owner ? (
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${ROLE_COLORS.owner}`}>
                    {ROLE_LABELS.owner}
                  </span>
                ) : (
                  <Select
                    value={u.role}
                    onValueChange={role => rolesMutation.mutate({ id: u.id, role })}
                    disabled={rolesMutation.isPending}
                  >
                    <SelectTrigger className="w-36 h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">
                        <div className="flex items-center gap-1.5">
                          <Shield className="h-3.5 w-3.5 text-blue-500" />
                          Administrador
                        </div>
                      </SelectItem>
                      <SelectItem value="member">
                        <div className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-slate-500" />
                          Membro
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}

                {/* Delete */}
                {!u.is_owner && (
                  deletingId === u.id ? (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-xs text-muted-foreground">Confirmar?</span>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => deleteMutation.mutate(u.id)}
                        disabled={deleteMutation.isPending}
                      >
                        {deleteMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Sim'}
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setDeletingId(null)}>
                        Não
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 shrink-0"
                      onClick={() => setDeletingId(u.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Free plan notice */}
      {owner && users.length === 1 && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-4 py-3">
          <span className="text-lg">✨</span>
          <div>
            <p className="text-sm font-medium text-amber-900 dark:text-amber-300">Plano Gratuito — 1 usuário</p>
            <p className="text-xs text-amber-700 dark:text-amber-400">
              Faça upgrade para adicionar mais membros à sua equipe.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
