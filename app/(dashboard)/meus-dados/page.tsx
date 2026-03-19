'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Download, 
  Eye, 
  Trash2, 
  Shield, 
  AlertTriangle,
  FileJson,
  CheckCircle,
  Users,
  Building2,
  Mail,
  Calendar
} from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import Link from 'next/link'

export default function MeusDadosPage() {
  const [isExporting, setIsExporting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Buscar dados do usuário
  const { data: userData, isLoading } = useQuery({
    queryKey: ['user-data'],
    queryFn: async () => {
      const [profileRes, orgRes, statsRes, clientsRes, ordersRes, servicesRes] = await Promise.all([
        fetch('/api/profile'),
        fetch('/api/settings/organization'),
        fetch('/api/clients/stats'),
        fetch('/api/clients'),
        fetch('/api/orders'),
        fetch('/api/services'),
      ])

      const profile = profileRes.ok ? await profileRes.json() : {}
      const org = orgRes.ok ? await orgRes.json() : {}
      const stats = statsRes.ok ? await statsRes.json() : {}
      const clients = clientsRes.ok ? await clientsRes.json() : []
      const orders = ordersRes.ok ? await ordersRes.json() : []
      const services = servicesRes.ok ? await servicesRes.json() : []

      return {
        user: { id: profile.id, email: profile.email, created_at: profile.created_at },
        profile: {
          full_name: profile.full_name,
          email: profile.email,
          role: profile.role,
          created_at: profile.created_at,
          organization: { name: org.name, plan: org.plan },
        },
        clients,
        clientsCount: stats.totalClients ?? clients.length,
        orders,
        ordersCount: orders.length,
        services,
        servicesCount: services.length,
      }
    },
  })

  const handleExportData = async () => {
    if (!userData) return

    setIsExporting(true)
    try {
      const exportData = {
        export_info: {
          date: new Date().toISOString(),
          format: 'JSON',
          lgpd_compliance: true,
          user_id: userData.user.id,
        },
        user: {
          id: userData.user.id,
          email: userData.user.email,
          created_at: userData.user.created_at,
        },
        profile: {
          full_name: userData.profile.full_name,
          email: userData.profile.email,
          role: userData.profile.role,
          created_at: userData.profile.created_at,
        },
        organization: userData.profile.organization,
        statistics: {
          total_clients: userData.clientsCount,
          total_orders: userData.ordersCount,
          total_services: userData.servicesCount,
        },
        clients: userData.clients,
        orders: userData.orders,
        services: userData.services,
      }

      // Criar blob e download
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `meus-dados-meu-atelier-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success('Dados exportados com sucesso!')
    } catch (error) {
      console.error('Erro ao exportar:', error)
      toast.error('Erro ao exportar dados')
    } finally {
      setIsExporting(false)
    }
  }

  const handleDeleteAccount = async () => {
    setIsDeleting(true)
    try {
      // Enviar email para DPO
      const mailtoLink = `mailto:dpo@meuatelier.com.br?subject=Solicitação de Exclusão de Conta&body=Olá, gostaria de solicitar a exclusão da minha conta.%0D%0A%0D%0AEmail: ${userData?.user.email}%0D%0AData: ${new Date().toLocaleString('pt-BR')}`
      
      window.location.href = mailtoLink
      
      toast.success('Solicitação enviada! Você receberá um retorno em até 15 dias úteis.')
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao processar solicitação')
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            Meus Dados e Direitos LGPD
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Controle total sobre suas informações pessoais conforme a Lei 13.709/2018
          </p>
        </div>
      </div>

      {/* Banner Informativo */}
      <Alert variant="info">
        <Shield className="h-4 w-4" />
        <AlertTitle>Seus Direitos Garantidos</AlertTitle>
        <AlertDescription>
          A LGPD garante que você tenha total controle sobre seus dados. Você pode acessar, corrigir,
          exportar ou solicitar exclusão a qualquer momento.
        </AlertDescription>
      </Alert>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Clientes</p>
                <p className="text-2xl font-bold">{userData?.clientsCount || 0}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Ordens</p>
                <p className="text-2xl font-bold">{userData?.ordersCount || 0}</p>
              </div>
              <FileJson className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Serviços</p>
                <p className="text-2xl font-bold">{userData?.servicesCount || 0}</p>
              </div>
              <Building2 className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Membro desde</p>
                <p className="text-sm font-semibold">
                  {userData?.user.created_at
                    ? new Date(userData.user.created_at).toLocaleDateString('pt-BR')
                    : '-'}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Seção: Ver Meus Dados */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <CardTitle>1. Acessar Meus Dados</CardTitle>
          </div>
          <CardDescription>
            Veja quais informações armazenamos sobre você
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Dados Pessoais</h4>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Nome:</span>
                  <span className="font-medium dark:text-gray-200">{userData?.profile.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Email:</span>
                  <span className="font-medium dark:text-gray-200">{userData?.user.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Função:</span>
                  <span className="font-medium capitalize">{userData?.profile.role}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Organização</h4>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Nome:</span>
                  <span className="font-medium dark:text-gray-200">{userData?.profile.organization?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Plano:</span>
                  <span className="font-medium capitalize">{userData?.profile.organization?.plan}</span>
                </div>
              </div>
            </div>
          </div>

          <Alert variant="info">
            <AlertDescription>
              <strong>Informação:</strong> Estes são seus dados principais. Para ver dados de clientes
              que você cadastrou, acesse as respectivas páginas do sistema.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Seção: Exportar Dados */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5 text-green-600 dark:text-green-400" />
            <CardTitle>2. Portabilidade de Dados</CardTitle>
          </div>
          <CardDescription>
            Baixe todos os seus dados em formato estruturado (JSON)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Você receberá um arquivo JSON contendo:
          </p>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 ml-6 list-disc">
            <li>Informações da sua conta</li>
            <li>Dados da organização</li>
            <li>Lista completa de clientes ({userData?.clientsCount || 0})</li>
            <li>Lista completa de ordens de serviço ({userData?.ordersCount || 0})</li>
            <li>Lista completa de serviços ({userData?.servicesCount || 0})</li>
          </ul>

          <Button 
            onClick={handleExportData}
            disabled={isExporting}
            className="w-full md:w-auto"
          >
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Exportando...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Exportar Meus Dados (JSON)
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Seção: Corrigir Dados */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <CardTitle>3. Corrigir Dados</CardTitle>
          </div>
          <CardDescription>
            Atualize informações incorretas ou desatualizadas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Você pode atualizar seus dados diretamente nas páginas do sistema:
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/profile">
              <Button variant="outline">
                Editar Perfil
              </Button>
            </Link>
            <Link href="/configuracoes">
              <Button variant="outline">
                Configurações da Organização
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Seção: Excluir Conta */}
      <Card className="border-red-200 dark:border-red-900">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
            <CardTitle className="text-red-900 dark:text-red-400">4. Excluir Minha Conta</CardTitle>
          </div>
          <CardDescription>
            Solicite a exclusão permanente dos seus dados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Atenção: Esta ação é irreversível!</AlertTitle>
            <AlertDescription>
              <ul className="space-y-1 list-disc ml-4">
                <li>Todos os seus dados serão anonimizados</li>
                <li>Você perderá acesso a todos os clientes e ordens cadastradas</li>
                <li>O processo leva até 30 dias para ser concluído</li>
                <li>Após 30 dias, os dados não poderão ser recuperados</li>
              </ul>
            </AlertDescription>
          </Alert>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isDeleting}>
                <Trash2 className="h-4 w-4 mr-2" />
                Solicitar Exclusão de Conta
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. Isto irá solicitar a exclusão permanente de sua conta 
                  e remover seus dados de nossos servidores após 30 dias.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Sim, excluir minha conta
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      {/* Seção: Contato */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <CardTitle>Precisa de Ajuda?</CardTitle>
          </div>
          <CardDescription>
            Entre em contato com nosso Encarregado de Dados (DPO)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-linear-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg p-6 space-y-3">
            <p className="text-gray-700 dark:text-gray-300">
              <strong>Email DPO:</strong>{' '}
              <a 
                href="mailto:dpo@meuatelier.com.br" 
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                dpo@meuatelier.com.br
              </a>
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              <strong>Prazo de Resposta:</strong> Até 15 dias úteis
            </p>
            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                📚 Para mais informações, consulte nossa{' '}
                <Link href="/privacidade" className="text-blue-600 dark:text-blue-400 hover:underline">
                  Política de Privacidade
                </Link>
                {' '}ou{' '}
                <Link href="/lgpd" className="text-blue-600 dark:text-blue-400 hover:underline">
                  Página LGPD
                </Link>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
