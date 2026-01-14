'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Shield, Info } from 'lucide-react'

type Permission = 'view' | 'create' | 'edit' | 'delete'
type Resource = 'organizations' | 'users' | 'billing' | 'analytics' | 'logs' | 'settings' | 'plans'

interface RolePermissions {
  [key: string]: {
    [resource in Resource]: Permission[]
  }
}

const defaultPermissions: RolePermissions = {
  super_admin: {
    organizations: ['view', 'create', 'edit', 'delete'],
    users: ['view', 'create', 'edit', 'delete'],
    billing: ['view', 'create', 'edit', 'delete'],
    analytics: ['view'],
    logs: ['view'],
    settings: ['view', 'create', 'edit', 'delete'],
    plans: ['view', 'create', 'edit', 'delete'],
  },
  admin: {
    organizations: ['view', 'create', 'edit', 'delete'],
    users: ['view', 'create', 'edit'],
    billing: ['view', 'edit'],
    analytics: ['view'],
    logs: ['view'],
    settings: ['view', 'edit'],
    plans: ['view', 'edit'],
  },
  support: {
    organizations: ['view'],
    users: ['view'],
    billing: ['view'],
    analytics: [],
    logs: ['view'],
    settings: ['view'],
    plans: ['view'],
  },
  billing: {
    organizations: ['view'],
    users: ['view'],
    billing: ['view', 'create', 'edit'],
    analytics: ['view'],
    logs: ['view'],
    settings: [],
    plans: ['view'],
  },
}

const resourceLabels: Record<Resource, string> = {
  organizations: 'Organizações',
  users: 'Usuários',
  billing: 'Faturamento',
  analytics: 'Analytics',
  logs: 'Logs',
  settings: 'Configurações',
  plans: 'Planos',
}

const permissionLabels: Record<Permission, string> = {
  view: 'Visualizar',
  create: 'Criar',
  edit: 'Editar',
  delete: 'Excluir',
}

const roleDescriptions = {
  super_admin: 'Acesso total ao sistema. Pode gerenciar admins e todas as configurações críticas.',
  admin: 'Gestão completa de organizações e usuários. Não pode gerenciar outros admins.',
  support: 'Acesso de visualização e suporte. Pode ver informações mas não pode editar dados críticos.',
  billing: 'Acesso focado em faturamento. Pode gerenciar pagamentos e faturas mas não organizações.',
}

export function PermissionsManagement() {
  const [selectedRole, setSelectedRole] = useState<string>('admin')
  const [permissions, setPermissions] = useState<RolePermissions>(defaultPermissions)
  const [hasChanges, setHasChanges] = useState(false)

  const togglePermission = (role: string, resource: Resource, permission: Permission) => {
    setPermissions((prev) => {
      const rolePerms = prev[role][resource]
      const newPerms = rolePerms.includes(permission)
        ? rolePerms.filter((p) => p !== permission)
        : [...rolePerms, permission]

      return {
        ...prev,
        [role]: {
          ...prev[role],
          [resource]: newPerms,
        },
      }
    })
    setHasChanges(true)
  }

  const hasPermission = (role: string, resource: Resource, permission: Permission) => {
    return permissions[role][resource].includes(permission)
  }

  const handleSave = () => {
    // TODO: Implementar salvamento de permissões
    console.log('Salvar permissões:', permissions)
    setHasChanges(false)
  }

  const handleReset = () => {
    setPermissions(defaultPermissions)
    setHasChanges(false)
  }

  return (
    <div className="space-y-6">
      {/* Seleção de Role e Ações */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold">Gestão de Permissões</h3>
              <p className="text-sm text-muted-foreground">
                Configure permissões detalhadas por nível de acesso
              </p>
            </div>
          </div>
          {hasChanges && (
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleReset}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                Salvar Alterações
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Seletor de Role */}
      <Card className="p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 max-w-xs">
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="super_admin">Super Admin</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="support">Suporte</SelectItem>
                <SelectItem value="billing">Financeiro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Badge variant="outline" className="flex items-center gap-2">
            <Info className="h-3 w-3" />
            {roleDescriptions[selectedRole as keyof typeof roleDescriptions]}
          </Badge>
        </div>

        {/* Matriz de Permissões */}
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 text-sm font-medium w-1/4">Recurso</th>
                <th className="text-center p-4 text-sm font-medium">Visualizar</th>
                <th className="text-center p-4 text-sm font-medium">Criar</th>
                <th className="text-center p-4 text-sm font-medium">Editar</th>
                <th className="text-center p-4 text-sm font-medium">Excluir</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(Object.keys(resourceLabels) as Resource[]).map((resource) => (
                <tr key={resource} className="hover:bg-muted/50 transition-colors">
                  <td className="p-4 font-medium">
                    {resourceLabels[resource]}
                  </td>
                  {(['view', 'create', 'edit', 'delete'] as Permission[]).map((permission) => (
                    <td key={permission} className="p-4 text-center">
                      <div className="flex items-center justify-center">
                        <Switch
                          checked={hasPermission(selectedRole, resource, permission)}
                          onCheckedChange={() =>
                            togglePermission(selectedRole, resource, permission)
                          }
                          disabled={selectedRole === 'super_admin' && permission === 'view'}
                        />
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Nota:</strong> Super Admins sempre têm acesso total. As permissões de visualização
            não podem ser desabilitadas para este nível.
          </p>
        </div>
      </Card>

      {/* Resumo de Permissões */}
      <Card className="p-6">
        <h4 className="font-medium mb-4">Resumo de Permissões por Role</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.keys(roleDescriptions).map((role) => {
            const totalPerms = Object.values(permissions[role]).reduce(
              (sum, perms) => sum + perms.length,
              0
            )
            return (
              <div
                key={role}
                className={`p-4 rounded-lg border-2 transition-colors cursor-pointer ${
                  selectedRole === role
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setSelectedRole(role)}
              >
                <div className="font-medium mb-1">
                  {role === 'super_admin' && 'Super Admin'}
                  {role === 'admin' && 'Admin'}
                  {role === 'support' && 'Suporte'}
                  {role === 'billing' && 'Financeiro'}
                </div>
                <div className="text-2xl font-bold mb-2">{totalPerms}</div>
                <div className="text-xs text-muted-foreground">permissões ativas</div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
