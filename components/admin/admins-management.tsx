'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { MoreVertical, UserPlus, Trash2, Loader2, Shield } from 'lucide-react'
import { toast } from 'sonner'

interface Admin {
  id: string
  name: string
  email: string
  role: 'super_admin' | 'admin' | 'support' | 'billing'
  createdAt: string
}

interface AdminsManagementProps {
  admins: Admin[]
  onRefresh?: () => void
}

export function AdminsManagement({ admins, onRefresh }: AdminsManagementProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [newName, setNewName] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)

  const handleAddAdmin = async () => {
    if (!newEmail || !newPassword) {
      toast.error('Email e senha são obrigatórios')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail, name: newName, password: newPassword }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro ao adicionar admin')
      toast.success(data.promoted ? 'Usuário promovido a admin!' : 'Admin criado com sucesso!')
      setIsAddDialogOpen(false)
      setNewEmail('')
      setNewName('')
      setNewPassword('')
      onRefresh?.()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async (id: string, email: string) => {
    if (!confirm('Remover privilégios de admin de ' + email + '?')) return
    setRemovingId(id)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? 'Erro ao remover admin')
      }
      toast.success('Admin removido com sucesso')
      onRefresh?.()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <>
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold">Administradores</h3>
            <p className="text-sm text-muted-foreground">
              {admins.length > 0
                ? `${admins.length} admin${admins.length !== 1 ? 's' : ''} com acesso master`
                : 'Nenhum administrador cadastrado'}
            </p>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Adicionar Admin
          </Button>
        </div>

        {admins.length > 0 ? (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4 text-sm font-medium">Nome</th>
                  <th className="text-left p-4 text-sm font-medium">Email</th>
                  <th className="text-left p-4 text-sm font-medium">Nível</th>
                  <th className="text-left p-4 text-sm font-medium">Criado em</th>
                  <th className="text-right p-4 text-sm font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {admins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-muted/50 transition-colors">
                    <td className="p-4 font-medium">{admin.name}</td>
                    <td className="p-4 text-sm text-muted-foreground">{admin.email}</td>
                    <td className="p-4">
                      <Badge className="bg-purple-500 text-white hover:bg-purple-600">
                        <Shield className="w-3 h-3 mr-1" />
                        Master
                      </Badge>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {new Date(admin.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="p-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" disabled={removingId === admin.id}>
                            {removingId === admin.id
                              ? <Loader2 className="h-4 w-4 animate-spin" />
                              : <MoreVertical className="h-4 w-4" />}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleRemove(admin.id, admin.email)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remover Admin
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="border-2 border-dashed border-muted rounded-lg p-12 text-center">
            <p className="text-muted-foreground mb-4">Nenhum administrador cadastrado</p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Adicionar Primeiro Admin
            </Button>
          </div>
        )}
      </Card>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Administrador</DialogTitle>
            <DialogDescription>
              Crie um novo admin ou promova um usuário existente pelo email.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome Completo</Label>
              <Input
                placeholder="João Silva"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                placeholder="joao@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Se o email já existir no sistema, o usuário será promovido a admin.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Senha * (apenas para novos usuários)</Label>
              <Input
                type="password"
                placeholder="Mínimo 8 caracteres"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleAddAdmin} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Adicionar Admin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
