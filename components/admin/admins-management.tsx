'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { MoreVertical, UserPlus, Shield, Trash2 } from 'lucide-react'

interface Admin {
  id: string
  name: string
  email: string
  role: 'super_admin' | 'admin' | 'support' | 'billing'
  createdAt: string
  lastLogin?: string
}

interface AdminsManagementProps {
  admins: Admin[]
}

const roleConfig = {
  super_admin: { label: 'Super Admin', variant: 'default' as const, color: 'bg-purple-500' },
  admin: { label: 'Admin', variant: 'secondary' as const, color: 'bg-blue-500' },
  support: { label: 'Suporte', variant: 'outline' as const, color: 'bg-green-500' },
  billing: { label: 'Financeiro', variant: 'outline' as const, color: 'bg-yellow-500' },
}

export function AdminsManagement({ admins }: AdminsManagementProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newAdminEmail, setNewAdminEmail] = useState('')
  const [newAdminName, setNewAdminName] = useState('')
  const [newAdminRole, setNewAdminRole] = useState<string>('admin')

  const hasData = admins.length > 0

  const handleAddAdmin = () => {
    // TODO: Implementar adição de admin
    console.log('Adicionar admin:', { newAdminEmail, newAdminName, newAdminRole })
    setIsAddDialogOpen(false)
    setNewAdminEmail('')
    setNewAdminName('')
    setNewAdminRole('admin')
  }

  const handleChangeRole = (adminId: string, newRole: string) => {
    // TODO: Implementar mudança de role
    console.log('Mudar role:', { adminId, newRole })
  }

  const handleRemoveAdmin = (adminId: string) => {
    // TODO: Implementar remoção de admin
    console.log('Remover admin:', adminId)
  }

  return (
    <>
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold">Administradores</h3>
            <p className="text-sm text-muted-foreground">
              {hasData ? `${admins.length} administradores` : 'Nenhum administrador cadastrado'}
            </p>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Adicionar Admin
          </Button>
        </div>

        {hasData ? (
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-4 text-sm font-medium">Nome</th>
                    <th className="text-left p-4 text-sm font-medium">Email</th>
                    <th className="text-left p-4 text-sm font-medium">Role</th>
                    <th className="text-left p-4 text-sm font-medium">Criado em</th>
                    <th className="text-left p-4 text-sm font-medium">Último Login</th>
                    <th className="text-right p-4 text-sm font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {admins.map((admin) => {
                    const role = roleConfig[admin.role]
                    return (
                      <tr key={admin.id} className="hover:bg-muted/50 transition-colors">
                        <td className="p-4">
                          <div className="font-medium">{admin.name}</div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm text-muted-foreground">{admin.email}</div>
                        </td>
                        <td className="p-4">
                          <Badge variant={role.variant}>{role.label}</Badge>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {new Date(admin.createdAt).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {admin.lastLogin
                            ? new Date(admin.lastLogin).toLocaleDateString('pt-BR')
                            : 'Nunca'
                          }
                        </td>
                        <td className="p-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleChangeRole(admin.id, 'admin')}>
                                <Shield className="h-4 w-4 mr-2" />
                                Alterar Permissão
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleRemoveAdmin(admin.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Remover Admin
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="border-2 border-dashed border-muted rounded-lg p-12 text-center">
            <p className="text-muted-foreground mb-4">
              Nenhum administrador cadastrado
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Adicionar Primeiro Admin
            </Button>
          </div>
        )}
      </Card>

      {/* Dialog de Adicionar Admin */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Administrador</DialogTitle>
            <DialogDescription>
              Convide um novo administrador para o sistema
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input
                id="name"
                placeholder="João Silva"
                value={newAdminName}
                onChange={(e) => setNewAdminName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="joao@example.com"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Nível de Acesso</Label>
              <Select value={newAdminRole} onValueChange={setNewAdminRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="super_admin">Super Admin (Acesso Total)</SelectItem>
                  <SelectItem value="admin">Admin (Gestão Completa)</SelectItem>
                  <SelectItem value="support">Suporte (Visualização e Suporte)</SelectItem>
                  <SelectItem value="billing">Financeiro (Apenas Billing)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddAdmin}>
              Adicionar Admin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
