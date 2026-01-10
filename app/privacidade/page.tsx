import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Shield, Lock, Eye, Download, Trash2, FileText } from 'lucide-react'

export const metadata = {
  title: 'Política de Privacidade - CRM Atelier',
  description: 'Política de Privacidade e Proteção de Dados do CRM Atelier conforme LGPD',
}

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-blue-50">
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
              <Shield className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                Política de Privacidade
              </h1>
            </div>
            <p className="text-gray-600 text-lg">
              Última atualização: 10 de janeiro de 2026
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Esta política está em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei 13.709/2018)
            </p>
          </div>

          {/* Índice */}
          <div className="bg-blue-50 rounded-lg p-6">
            <h2 className="font-semibold text-lg mb-4 text-blue-900">Índice</h2>
            <ol className="space-y-2 text-sm text-blue-800">
              <li><a href="#controlador" className="hover:underline">1. Identificação do Controlador</a></li>
              <li><a href="#dpo" className="hover:underline">2. Encarregado de Dados (DPO)</a></li>
              <li><a href="#dados" className="hover:underline">3. Dados Coletados</a></li>
              <li><a href="#finalidades" className="hover:underline">4. Finalidades do Tratamento</a></li>
              <li><a href="#base-legal" className="hover:underline">5. Base Legal</a></li>
              <li><a href="#compartilhamento" className="hover:underline">6. Compartilhamento de Dados</a></li>
              <li><a href="#retencao" className="hover:underline">7. Retenção de Dados</a></li>
              <li><a href="#direitos" className="hover:underline">8. Seus Direitos</a></li>
              <li><a href="#seguranca" className="hover:underline">9. Segurança</a></li>
              <li><a href="#internacional" className="hover:underline">10. Transferência Internacional</a></li>
              <li><a href="#cookies" className="hover:underline">11. Cookies</a></li>
              <li><a href="#alteracoes" className="hover:underline">12. Alterações</a></li>
              <li><a href="#contato" className="hover:underline">13. Contato</a></li>
            </ol>
          </div>

          {/* 1. Controlador */}
          <section id="controlador" className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="h-6 w-6 text-blue-600" />
              1. Identificação do Controlador
            </h2>
            <p className="text-gray-700 leading-relaxed">
              O <strong>CRM Atelier</strong> é desenvolvido e operado por:
            </p>
            <div className="bg-gray-50 rounded-lg p-6 space-y-2">
              <p><strong>Razão Social:</strong> Omega Sistem</p>
              <p><strong>Website:</strong> <a href="https://omegasistem.com.br" className="text-blue-600 hover:underline">omegasistem.com.br</a></p>
              <p><strong>Email:</strong> contato@omegasistem.com.br</p>
            </div>
          </section>

          {/* 2. DPO */}
          <section id="dpo" className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Eye className="h-6 w-6 text-blue-600" />
              2. Encarregado de Dados (DPO)
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Para questões sobre proteção de dados, entre em contato com nosso Encarregado:
            </p>
            <div className="bg-gray-50 rounded-lg p-6 space-y-2">
              <p><strong>Email:</strong> dpo@crmatelier.com.br</p>
              <p><strong>Tempo de resposta:</strong> Até 15 dias úteis</p>
            </div>
          </section>

          {/* 3. Dados Coletados */}
          <section id="dados" className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Lock className="h-6 w-6 text-blue-600" />
              3. Dados Coletados
            </h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mt-6">3.1. Dados de Cadastro (Usuários do Sistema)</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Nome completo</li>
              <li>Email</li>
              <li>Senha (armazenada com criptografia)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-6">3.2. Dados de Clientes (Inseridos por Você)</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Nome</li>
              <li>Telefone</li>
              <li>Email</li>
              <li>Endereço completo (rua, cidade, estado, CEP)</li>
              <li>Data de nascimento (opcional - dado sensível)</li>
              <li>Instagram</li>
              <li>Notas e observações</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-6">3.3. Dados da Organização</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Nome fantasia</li>
              <li>CNPJ (opcional)</li>
              <li>Email e telefone</li>
              <li>Endereço</li>
              <li>Logo (opcional)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-6">3.4. Dados Técnicos Automáticos</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Endereço IP</li>
              <li>Tipo de navegador</li>
              <li>Sistema operacional</li>
              <li>Cookies essenciais (autenticação)</li>
              <li>Logs de acesso</li>
            </ul>
          </section>

          {/* 4. Finalidades */}
          <section id="finalidades" className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">4. Finalidades do Tratamento</h2>
            <p className="text-gray-700">Utilizamos seus dados para:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li><strong>Prestação do serviço:</strong> Gerenciar seu ateliê, clientes e ordens de serviço</li>
              <li><strong>Autenticação:</strong> Garantir acesso seguro à sua conta</li>
              <li><strong>Suporte:</strong> Responder dúvidas e resolver problemas</li>
              <li><strong>Lembretes:</strong> Notificar aniversários, pagamentos e prazos (se ativado)</li>
              <li><strong>Melhoria:</strong> Analisar uso do sistema para melhorias</li>
              <li><strong>Segurança:</strong> Prevenir fraudes e abusos</li>
              <li><strong>Conformidade legal:</strong> Cumprir obrigações fiscais e legais</li>
            </ul>
          </section>

          {/* 5. Base Legal */}
          <section id="base-legal" className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">5. Base Legal</h2>
            <p className="text-gray-700">O tratamento de dados é fundamentado em:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li><strong>Consentimento (Art. 7º, I):</strong> Para dados opcionais e notificações</li>
              <li><strong>Execução de contrato (Art. 7º, V):</strong> Para prestação do serviço</li>
              <li><strong>Legítimo interesse (Art. 7º, IX):</strong> Para segurança e melhorias</li>
              <li><strong>Obrigação legal (Art. 7º, II):</strong> Para conformidade fiscal</li>
            </ul>
          </section>

          {/* 6. Compartilhamento */}
          <section id="compartilhamento" className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">6. Compartilhamento de Dados</h2>
            <p className="text-gray-700">Compartilhamos dados apenas com:</p>
            
            <div className="space-y-4 mt-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-semibold text-gray-900">Supabase (Banco de Dados)</h4>
                <p className="text-sm text-gray-600">Armazenamento seguro com criptografia</p>
              </div>
              
              <div className="border-l-4 border-green-500 pl-4">
                <h4 className="font-semibold text-gray-900">Vercel (Hospedagem)</h4>
                <p className="text-sm text-gray-600">Infraestrutura de servidor</p>
              </div>
            </div>

            <p className="text-sm text-gray-600 mt-4 italic">
              ⚠️ Não vendemos, alugamos ou compartilhamos dados com terceiros para marketing.
            </p>
          </section>

          {/* 7. Retenção */}
          <section id="retencao" className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">7. Retenção de Dados</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li><strong>Dados de conta ativa:</strong> Enquanto a conta existir</li>
              <li><strong>Dados após cancelamento:</strong> 30 dias para recuperação, depois anonimizados</li>
              <li><strong>Dados fiscais:</strong> 5 anos (obrigação legal)</li>
              <li><strong>Logs de segurança:</strong> 6 meses</li>
            </ul>
          </section>

          {/* 8. Direitos */}
          <section id="direitos" className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">8. Seus Direitos (Art. 18, LGPD)</h2>
            <p className="text-gray-700">Você tem direito a:</p>
            
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Download className="h-5 w-5 text-blue-600 mt-1 shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Acessar seus dados</h4>
                    <p className="text-sm text-gray-600">Obter cópia de todos os dados armazenados</p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-green-600 mt-1 shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Corrigir dados</h4>
                    <p className="text-sm text-gray-600">Atualizar informações incorretas</p>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Trash2 className="h-5 w-5 text-purple-600 mt-1 shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Excluir dados</h4>
                    <p className="text-sm text-gray-600">Solicitar anonimização ou exclusão</p>
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Download className="h-5 w-5 text-orange-600 mt-1 shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Portabilidade</h4>
                    <p className="text-sm text-gray-600">Exportar dados em formato estruturado</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-6">
              <p className="text-sm text-gray-800">
                <strong>Como exercer seus direitos:</strong> Entre em contato com{' '}
                <a href="mailto:dpo@crmatelier.com.br" className="text-blue-600 hover:underline">
                  dpo@crmatelier.com.br
                </a>{' '}
                ou acesse <Link href="/lgpd" className="text-blue-600 hover:underline">nossa página LGPD</Link>.
              </p>
            </div>
          </section>

          {/* 9. Segurança */}
          <section id="seguranca" className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">9. Segurança</h2>
            <p className="text-gray-700">Medidas de proteção implementadas:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>✅ Criptografia SSL/TLS em trânsito</li>
              <li>✅ Senhas com hash bcrypt</li>
              <li>✅ Row Level Security (RLS) - isolamento entre organizações</li>
              <li>✅ Backup automático diário</li>
              <li>✅ Autenticação via Supabase Auth</li>
              <li>✅ Logs de auditoria</li>
            </ul>
          </section>

          {/* 10. Transferência Internacional */}
          <section id="internacional" className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">10. Transferência Internacional</h2>
            <p className="text-gray-700 leading-relaxed">
              Seus dados podem ser armazenados em servidores localizados nos <strong>Estados Unidos</strong> (Supabase Inc.). 
              Garantimos que todos os prestadores seguem padrões adequados de segurança conforme a LGPD e possuem 
              cláusulas contratuais apropriadas (Standard Contractual Clauses).
            </p>
          </section>

          {/* 11. Cookies */}
          <section id="cookies" className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">11. Cookies</h2>
            <p className="text-gray-700">Utilizamos cookies para:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li><strong>Essenciais:</strong> Manter você autenticado</li>
              <li><strong>Preferências:</strong> Lembrar tema escuro/claro</li>
            </ul>
            <p className="text-sm text-gray-600 mt-4">
              Você pode gerenciar cookies nas configurações do seu navegador.
            </p>
          </section>

          {/* 12. Alterações */}
          <section id="alteracoes" className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">12. Alterações nesta Política</h2>
            <p className="text-gray-700 leading-relaxed">
              Podemos atualizar esta política periodicamente. Notificaremos alterações significativas por email 
              ou aviso no sistema. Recomendamos revisão periódica.
            </p>
          </section>

          {/* 13. Contato */}
          <section id="contato" className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">13. Contato</h2>
            <div className="bg-linear-to-r from-blue-50 to-indigo-50 rounded-lg p-6 space-y-3">
              <p className="text-gray-700"><strong>Email DPO:</strong> dpo@crmatelier.com.br</p>
              <p className="text-gray-700"><strong>Suporte:</strong> contato@omegasistem.com.br</p>
              <p className="text-gray-700"><strong>LGPD:</strong> <Link href="/lgpd" className="text-blue-600 hover:underline">crmatelier.com.br/lgpd</Link></p>
            </div>
          </section>

          {/* Footer */}
          <div className="border-t pt-6 mt-12 text-center">
            <p className="text-sm text-gray-500">
              Esta política está em conformidade com a Lei 13.709/2018 (LGPD)
            </p>
            <div className="flex justify-center gap-4 mt-4">
              <Link href="/termos">
                <Button variant="outline" size="sm">Ver Termos de Uso</Button>
              </Link>
              <Link href="/lgpd">
                <Button variant="outline" size="sm">Exercer Direitos LGPD</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
