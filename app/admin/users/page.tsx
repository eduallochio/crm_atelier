'use client'

import { useEffect, useState, useCallback } from 'react'
import { Search, KeyRound, UserX, UserCheck, Building2, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

interface User {
  id: string
  email: string
  full_name: string | null
  role: string
  is_owner: boolean
  is_master: boolean
  created_at: string
  org_name: string
  org_plan: string
  org_state: string
  org_id: string
}

const PLAN_COLORS: Record<string, string> = {
  free: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  pro: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [resetDialog, setResetDialog] = useState<{ open: boolean; user: User | null }>({ open: false, user: null })
  const [newPassword, setNewPassword] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchUsers = useCallback(async () => {
    const res = await fetch('/api/admin/all-users')
    setUsers(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const handleAction = async (userId: string, action: string, extra?: Record<string, string>) => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/all-users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, action, ...extra }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      toast.success(
        action === 'reset_password' ? 'Senha redefinida' :
        action === 'deactivate' ? 'Usuário desativado' : 'Usuário reativado'
      )
      setResetDialog({ open: false, user: null })
      setNewPassword('')
      fetchUsers()
    } catch (e) {
      toast.error((e as Error).message || 'Erro ao executar ação')
    } finally { setSaving(false) }
  }

  const filtered = users.filter((u) => {
    const q = search.toLowerCase()
    const matchSearch = u.email.toLowerCase().includes(q) ||
      (u.full_name ?? '').toLowerCase().includes(q) ||
      u.org_name.toLowerCase().includes(q)
    const matchRole = roleFilter === 'all' || u.role === roleFilter
    return matchSearch && matchRole
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Usuários</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Todos os usuários da plataforma — {users.length} no total
        </p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Buscar por email, nome ou organização..."
            value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
          className="h-10 px-3 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white">
          <option value="all">Todos os papéis</option>
          <option value="owner">Owner</option>
          <option value="admin">Admin</option>
          <option value="member">Member</option>
          <option value="deactivated">Desativados</option>
        </select>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-gray-400">Carregando...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Usuário</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Organização</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Papel</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Cadastro</th>
                  <th className="py-3 px-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
                {filtered.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {user.full_name || '—'}
                          {user.is_master && <span className="ml-2 text-xs text-purple-500 font-mono">[master]</span>}
                        </p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-700 dark:text-gray-300">{user.org_name}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${PLAN_COLORS[user.org_plan] ?? ''}`}>
                          {user.org_plan}
                        </span>
                        <Link href={`/admin/organizations/${user.org_id}`}>
                          <ExternalLink className="w-3.5 h-3.5 text-gray-400 hover:text-blue-500" />
                        </Link>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={user.role === 'deactivated' ? 'destructive' : 'outline'} className="text-xs">
                        {user.is_owner ? 'owner' : user.role}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-xs">
                      {new Date(user.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 justify-end">
                        {!user.is_master && (
                          <>
                            <Button size="sm" variant="ghost" title="Redefinir senha"
                              onClick={() => { setResetDialog({ open: true, user }); setNewPassword('') }}>
                              <KeyRound className="w-4 h-4" />
                            </Button>
                            {user.role === 'deactivated' ? (
                              <Button size="sm" variant="ghost" className="text-green-600" title="Reativar"
                                onClick={() => handleAction(user.id, 'reactivate')}>
                                <UserCheck className="w-4 h-4" />
                              </Button>
                            ) : (
                              <Button size="sm" variant="ghost" className="text-red-500" title="Desativar"
                                onClick={() => handleAction(user.id, 'deactivate')}>
                                <UserX className="w-4 h-4" />
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" asChild title="Ver organização">
                              <Link href={`/admin/organizations/${user.org_id}`}>
                                <Building2 className="w-4 h-4" />
                              </Link>
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={5} className="py-16 text-center text-gray-400">Nenhum usuário encontrado</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={resetDialog.open} onOpenChange={(o) => !o && setResetDialog({ open: false, user: null })}>
        <DialogContent>
          <DialogHeader><DialogTitle>Redefinir senha</DialogTitle></DialogHeader>
          <div className="space-y-2 py-2">
            <p className="text-sm text-gray-500">{resetDialog.user?.email}</p>
            <Label>Nova senha</Label>
            <Input type="password" placeholder="Mínimo 6 caracteres"
              value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetDialog({ open: false, user: null })}>Cancelar</Button>
            <Button disabled={saving || newPassword.length < 6}
              onClick={() => handleAction(resetDialog.user!.id, 'reset_password', { new_password: newPassword })}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
