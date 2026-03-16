import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, FileText, Scale, Shield, Ban, AlertTriangle } from 'lucide-react'

export const metadata = {
  title: 'Termos de Uso - Meu Atelier',
  description: 'Termos e Condições de Uso do Meu Atelier',
}

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-linear-to-r from-gray-50 to-blue-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link href="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Início
          </Button>
        </Link>

        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 space-y-8">
          <div className="border-b pb-6">
            <div className="flex items-center gap-3 mb-4">
              <Scale className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                Termos de Uso
              </h1>
            </div>
            <p className="text-gray-600 text-lg">
              Última atualização: 10 de janeiro de 2026
            </p>
          </div>

          {/* Aceitação */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="h-6 w-6 text-blue-600" />
              1. Aceitação dos Termos
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Ao acessar e usar o <strong>Meu Atelier</strong>, você concorda com estes Termos de Uso e com nossa{' '}
              <Link href="/privacidade" className="text-blue-600 hover:underline">Política de Privacidade</Link>.
              Se você não concordar, não use o serviço.
            </p>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <p className="text-sm text-gray-800">
                <strong>Importante:</strong> Ao criar uma conta, você confirma ter lido e aceito integralmente estes termos.
              </p>
            </div>
          </section>

          {/* Descrição do Serviço */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">2. Descrição do Serviço</h2>
            <p className="text-gray-700 leading-relaxed">
              O Meu Atelier é uma plataforma SaaS (Software as a Service) para gestão de ateliês de costura e artesanato, 
              oferecendo funcionalidades de:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Cadastro e gestão de clientes</li>
              <li>Controle de ordens de serviço</li>
              <li>Gerenciamento financeiro (caixa, contas a pagar/receber)</li>
              <li>Catálogo de serviços</li>
              <li>Dashboards e relatórios</li>
              <li>Notificações e lembretes</li>
            </ul>
          </section>

          {/* Elegibilidade */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">3. Elegibilidade</h2>
            <p className="text-gray-700 leading-relaxed">
              Para usar o Meu Atelier, você deve:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Ter pelo menos 18 anos de idade</li>
              <li>Possuir capacidade legal para celebrar contratos</li>
              <li>Fornecer informações verdadeiras e completas</li>
              <li>Não ter sido previamente banido do serviço</li>
            </ul>
          </section>

          {/* Conta e Segurança */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Shield className="h-6 w-6 text-blue-600" />
              4. Conta e Segurança
            </h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mt-4">4.1. Criação de Conta</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Você é responsável por manter sua senha segura</li>
              <li>Não compartilhe credenciais com terceiros</li>
              <li>Notifique-nos imediatamente sobre uso não autorizado</li>
              <li>Uma conta por pessoa/organização</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-4">4.2. Responsabilidade</h3>
            <p className="text-gray-700">
              Você é totalmente responsável por todas as atividades realizadas em sua conta.
            </p>
          </section>

          {/* Planos e Pagamentos */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">5. Planos e Pagamentos</h2>
            
            <h3 className="text-xl font-semibold text-gray-800">5.1. Plano Free</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Gratuito permanentemente</li>
              <li>Até 50 clientes cadastrados</li>
              <li>Recursos básicos incluídos</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-4">5.2. Plano Pro</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Cobrança mensal de R$ 59,90</li>
              <li>Até 200 clientes cadastrados</li>
              <li>Recursos avançados incluídos</li>
              <li>Cancelamento a qualquer momento</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-4">5.3. Política de Cancelamento</h3>
            <p className="text-gray-700">
              Você pode cancelar seu plano pago a qualquer momento. Não há reembolso proporcional. 
              O acesso aos recursos pagos permanece até o fim do período já pago.
            </p>
          </section>

          {/* Uso Aceitável */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Ban className="h-6 w-6 text-red-600" />
              6. Uso Aceitável
            </h2>
            <p className="text-gray-700">Você concorda em NÃO:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Violar leis ou regulamentos</li>
              <li>Fazer engenharia reversa do software</li>
              <li>Tentar acessar sistemas não autorizados</li>
              <li>Enviar spam ou conteúdo malicioso</li>
              <li>Usar o serviço para atividades ilegais</li>
              <li>Revender ou sublicenciar o serviço</li>
              <li>Interferir no funcionamento do sistema</li>
              <li>Coletar dados de outros usuários sem consentimento</li>
            </ul>
          </section>

          {/* Propriedade Intelectual */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">7. Propriedade Intelectual</h2>
            
            <h3 className="text-xl font-semibold text-gray-800">7.1. Nossa Propriedade</h3>
            <p className="text-gray-700">
              O Meu Atelier, incluindo código, design, marca e conteúdo, é propriedade exclusiva da Omega Sistem. 
              Todos os direitos reservados.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mt-4">7.2. Seus Dados</h3>
            <p className="text-gray-700">
              Você mantém propriedade total sobre os dados inseridos no sistema (clientes, ordens, etc.). 
              Concedemos uma licença limitada para armazenar e processar esses dados apenas para prestação do serviço.
            </p>
          </section>

          {/* Limitação de Responsabilidade */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
              8. Limitação de Responsabilidade
            </h2>
            
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <p className="text-sm text-gray-800 font-semibold mb-2">IMPORTANTE:</p>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                <li>O serviço é fornecido &quot;como está&quot;, sem garantias</li>
                <li>Não garantimos disponibilidade 100% do tempo</li>
                <li>Não somos responsáveis por perda de dados causada por você</li>
                <li>Faça backups regulares de informações críticas</li>
                <li>Não somos responsáveis por decisões tomadas com base nos relatórios</li>
              </ul>
            </div>

            <p className="text-gray-700 leading-relaxed mt-4">
              Nossa responsabilidade total está limitada ao valor pago nos últimos 12 meses.
            </p>
          </section>

          {/* Rescisão */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">9. Rescisão</h2>
            
            <h3 className="text-xl font-semibold text-gray-800">9.1. Por Você</h3>
            <p className="text-gray-700">
              Você pode cancelar sua conta a qualquer momento através das configurações ou contato com suporte.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mt-4">9.2. Por Nós</h3>
            <p className="text-gray-700">
              Podemos suspender ou encerrar sua conta se:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Você violar estes Termos de Uso</li>
              <li>Houver suspeita de fraude ou uso ilegal</li>
              <li>Houver inadimplência de pagamento (planos pagos)</li>
              <li>Por decisão comercial (com aviso prévio de 30 dias)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-4">9.3. Após Cancelamento</h3>
            <p className="text-gray-700">
              Seus dados ficam disponíveis por 30 dias para recuperação. Após isso, são anonimizados conforme LGPD.
            </p>
          </section>

          {/* Modificações */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">10. Modificações</h2>
            <p className="text-gray-700 leading-relaxed">
              Podemos modificar estes termos a qualquer momento. Mudanças significativas serão notificadas por email 
              com 15 dias de antecedência. O uso continuado após as mudanças constitui aceitação.
            </p>
          </section>

          {/* Lei Aplicável */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">11. Lei Aplicável e Foro</h2>
            <p className="text-gray-700 leading-relaxed">
              Estes termos são regidos pelas leis da República Federativa do Brasil. 
              Qualquer disputa será resolvida no foro da sua comarca de residência.
            </p>
          </section>

          {/* Contato */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">12. Contato</h2>
            <div className="bg-linear-to-r from-blue-50 to-indigo-50 rounded-lg p-6 space-y-3">
              <p className="text-gray-700"><strong>Suporte:</strong> contato@omegasistem.com.br</p>
              <p className="text-gray-700"><strong>Website:</strong> <a href="https://omegasistem.com.br" className="text-blue-600 hover:underline">omegasistem.com.br</a></p>
            </div>
          </section>

          {/* Footer */}
          <div className="border-t pt-6 mt-12 text-center">
            <p className="text-sm text-gray-500 mb-4">
              Ao usar o Meu Atelier, você concorda com estes Termos de Uso
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/privacidade">
                <Button variant="outline" size="sm">Política de Privacidade</Button>
              </Link>
              <Link href="/lgpd">
                <Button variant="outline" size="sm">Direitos LGPD</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
