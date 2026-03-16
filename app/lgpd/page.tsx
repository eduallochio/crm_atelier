import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Shield, Eye, Download, Edit, Trash2, FileText, Mail, CheckCircle } from 'lucide-react'

export const metadata = {
  title: 'LGPD - Seus Direitos - Meu Atelier',
  description: 'Exercite seus direitos conforme a Lei Geral de Proteção de Dados (LGPD)',
}

export default function LGPDPage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-blue-50">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <Link href="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Início
          </Button>
        </Link>

        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 space-y-8">
          <div className="border-b pb-6">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                Seus Direitos LGPD
              </h1>
            </div>
            <p className="text-gray-600 text-lg">
              Lei Geral de Proteção de Dados (Lei 13.709/2018)
            </p>
          </div>

          {/* Introdução */}
          <div className="bg-blue-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-blue-900 mb-3">O que é a LGPD?</h2>
            <p className="text-blue-800 leading-relaxed">
              A LGPD é a lei brasileira que protege seus dados pessoais. Ela garante que você tenha controle 
              sobre suas informações e saiba como elas são usadas. Abaixo, explicamos seus direitos de forma simples 
              e como exercê-los.
            </p>
          </div>

          {/* Grid de Direitos */}
          <div className="grid md:grid-cols-2 gap-6 mt-8">
            {/* Direito 1: Acesso */}
            <Card className="border-2 hover:border-blue-300 transition-colors">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Eye className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl">1. Acessar Seus Dados</CardTitle>
                </div>
                <CardDescription>
                  Você pode ver quais dados pessoais armazenamos sobre você
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600">
                  <strong>O que você pode saber:</strong>
                </p>
                <ul className="text-sm text-gray-600 space-y-1 ml-4 list-disc">
                  <li>Quais dados temos</li>
                  <li>Como os usamos</li>
                  <li>Com quem compartilhamos</li>
                </ul>
                <Link href="mailto:dpo@meuatelier.com.br?subject=Solicitação de Acesso aos Dados">
                  <Button className="w-full mt-4" variant="outline">
                    <Mail className="h-4 w-4 mr-2" />
                    Solicitar Acesso
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Direito 2: Correção */}
            <Card className="border-2 hover:border-green-300 transition-colors">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Edit className="h-6 w-6 text-green-600" />
                  </div>
                  <CardTitle className="text-xl">2. Corrigir Dados</CardTitle>
                </div>
                <CardDescription>
                  Atualize informações incorretas ou incompletas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600">
                  Seus dados estão desatualizados? Você pode corrigi-los diretamente no sistema.
                </p>
                <Link href="/login">
                  <Button className="w-full mt-4" variant="outline">
                    <Edit className="h-4 w-4 mr-2" />
                    Acessar Perfil
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Direito 3: Exclusão */}
            <Card className="border-2 hover:border-red-300 transition-colors">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <Trash2 className="h-6 w-6 text-red-600" />
                  </div>
                  <CardTitle className="text-xl">3. Excluir Dados</CardTitle>
                </div>
                <CardDescription>
                  Solicite a anonimização ou exclusão dos seus dados
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600">
                  Queremos parar de usar o Meu Atelier? Podemos excluir ou anonimizar seus dados.
                </p>
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3">
                  <p className="text-xs text-gray-700">
                    <strong>Atenção:</strong> Após 30 dias do cancelamento, os dados são anonimizados. 
                    Esta ação é irreversível.
                  </p>
                </div>
                <Link href="mailto:dpo@meuatelier.com.br?subject=Solicitação de Exclusão de Dados">
                  <Button className="w-full mt-4" variant="outline">
                    <Mail className="h-4 w-4 mr-2" />
                    Solicitar Exclusão
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Direito 4: Portabilidade */}
            <Card className="border-2 hover:border-purple-300 transition-colors">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Download className="h-6 w-6 text-purple-600" />
                  </div>
                  <CardTitle className="text-xl">4. Exportar Dados</CardTitle>
                </div>
                <CardDescription>
                  Baixe todos os seus dados em formato estruturado
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600">
                  Receba uma cópia de todos os seus dados em JSON/CSV para usar em outro sistema.
                </p>
                <Link href="mailto:dpo@meuatelier.com.br?subject=Solicitação de Portabilidade de Dados">
                  <Button className="w-full mt-4" variant="outline">
                    <Mail className="h-4 w-4 mr-2" />
                    Solicitar Exportação
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Direito 5: Informação sobre Compartilhamento */}
            <Card className="border-2 hover:border-orange-300 transition-colors">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <FileText className="h-6 w-6 text-orange-600" />
                  </div>
                  <CardTitle className="text-xl">5. Compartilhamento</CardTitle>
                </div>
                <CardDescription>
                  Saiba com quem compartilhamos seus dados
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600">
                  Seus dados são compartilhados apenas com:
                </p>
                <ul className="text-sm text-gray-600 space-y-1 ml-4 list-disc">
                  <li><strong>Supabase:</strong> Banco de dados</li>
                  <li><strong>Vercel:</strong> Hospedagem</li>
                </ul>
                <Link href="/privacidade#compartilhamento">
                  <Button className="w-full mt-4" variant="outline">
                    <FileText className="h-4 w-4 mr-2" />
                    Ver Detalhes
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Direito 6: Revogação */}
            <Card className="border-2 hover:border-pink-300 transition-colors">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-pink-600" />
                  </div>
                  <CardTitle className="text-xl">6. Revogar Consentimento</CardTitle>
                </div>
                <CardDescription>
                  Retire seu consentimento para tratamento de dados
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600">
                  Você pode retirar o consentimento para notificações, marketing ou outros usos opcionais.
                </p>
                <Link href="mailto:dpo@meuatelier.com.br?subject=Revogação de Consentimento">
                  <Button className="w-full mt-4" variant="outline">
                    <Mail className="h-4 w-4 mr-2" />
                    Revogar Consentimento
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Como Exercer */}
          <div className="bg-linear-to-r from-blue-50 to-indigo-50 rounded-lg p-8 mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Como Exercer Seus Direitos</h2>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center shrink-0 font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Entre em Contato</h3>
                  <p className="text-sm text-gray-600">
                    Envie email para <a href="mailto:dpo@meuatelier.com.br" className="text-blue-600 hover:underline font-medium">dpo@meuatelier.com.br</a> informando 
                    qual direito deseja exercer
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center shrink-0 font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Identificação</h3>
                  <p className="text-sm text-gray-600">
                    Para sua segurança, precisamos confirmar sua identidade. Inclua seu email cadastrado.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center shrink-0 font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Prazo de Resposta</h3>
                  <p className="text-sm text-gray-600">
                    Respondemos em <strong>até 15 dias úteis</strong> conforme estabelecido pela LGPD
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contato DPO */}
          <div className="border-t pt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Encarregado de Dados (DPO)</h2>
            <div className="bg-gray-50 rounded-lg p-6">
              <p className="text-gray-700 mb-4">
                Nosso Encarregado de Proteção de Dados é o responsável por garantir a conformidade com a LGPD 
                e atender suas solicitações.
              </p>
              <div className="space-y-2">
                <p className="text-gray-900">
                  <strong>Email:</strong>{' '}
                  <a href="mailto:dpo@meuatelier.com.br" className="text-blue-600 hover:underline">
                    dpo@meuatelier.com.br
                  </a>
                </p>
                <p className="text-gray-900">
                  <strong>Tempo de Resposta:</strong> Até 15 dias úteis
                </p>
              </div>
            </div>
          </div>

          {/* Links Úteis */}
          <div className="border-t pt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Links Úteis</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <Link href="/privacidade">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-base">Política de Privacidade</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">
                      Veja como tratamos seus dados
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/termos">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-base">Termos de Uso</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">
                      Condições de uso do serviço
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <a href="https://www.gov.br/anpd/" target="_blank" rel="noopener noreferrer">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-base">ANPD</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">
                      Autoridade Nacional de Proteção de Dados
                    </p>
                  </CardContent>
                </Card>
              </a>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t pt-6 mt-8 text-center">
            <p className="text-sm text-gray-500">
              Esta página está em conformidade com a Lei 13.709/2018 (LGPD)
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
