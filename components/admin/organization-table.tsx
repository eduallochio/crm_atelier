'use client'

import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { MoreHorizontal, Eye, Edit } from 'lucide-react'
import Link from 'next/link'
import { PlanBadge, StateBadge } from './subscription-badge'
import { Button } from '@/components/ui/button'

interface Organization {
  id: string
  name: string
  plan: 'free' | 'pro'
  state: 'active' | 'trial' | 'cancelled' | 'suspended'
  created_at: string
  users_count: number
  clients_count: number
  mrr: number
}

interface OrganizationTableProps {
  organizations: Organization[]
  loading: boolean
  selectedOrgs: string[]
  onSelectOrgs: (ids: string[]) => void
  onRefresh: () => void
}

export function OrganizationTable({
  organizations,
  loading,
  selectedOrgs,
  onSelectOrgs,
}: OrganizationTableProps) {
  const toggleSelectAll = () => {
    if (selectedOrgs.length === organizations.length) {
      onSelectOrgs([])
    } else {
      onSelectOrgs(organizations.map((o) => o.id))
    }
  }

  const toggleSelectOrg = (id: string) => {
    if (selectedOrgs.includes(id)) {
      onSelectOrgs(selectedOrgs.filter((i) => i !== id))
    } else {
      onSelectOrgs([...selectedOrgs, id])
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-12">
        <p className="text-center text-gray-600 dark:text-gray-400">Carregando organizações...</p>
      </div>
    )
  }

  if (organizations.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-12">
        <p className="text-center text-gray-600 dark:text-gray-400">
          Nenhuma organização encontrada
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedOrgs.length === organizations.length}
                  onChange={toggleSelectAll}
                  className="rounded border-gray-300 dark:border-gray-700"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Organização
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Plano
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Usuários
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Clientes
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                MRR
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Cadastro
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {organizations.map((org) => (
              <tr
                key={org.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedOrgs.includes(org.id)}
                    onChange={() => toggleSelectOrg(org.id)}
                    className="rounded border-gray-300 dark:border-gray-700"
                  />
                </td>
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{org.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{org.id.slice(0, 8)}...</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <PlanBadge plan={org.plan} />
                </td>
                <td className="px-6 py-4">
                  <StateBadge state={org.state} />
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                  {org.users_count}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                  {org.clients_count}
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                  {org.mrr > 0 ? `R$ ${org.mrr.toFixed(2)}` : '-'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {format(new Date(org.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/admin/organizations/${org.id}`}>
                        <Eye className="w-4 h-4" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer com paginação */}
      <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Total: <span className="font-medium">{organizations.length}</span> organizações
        </p>
      </div>
    </div>
  )
}
