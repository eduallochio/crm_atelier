import Link from 'next/link'
import { ArrowLeft, FileText, Shield, Ban, AlertTriangle, Scale } from 'lucide-react'

export const metadata = {
  title: 'Termos de Uso - Meu Atelier Sistema',
  description: 'Termos e Condições de Uso do Meu Atelier Sistema',
}

const terra   = '#c8714a'
const dourado = '#d4a85a'

function Section({ icon: Icon, title, children }: { icon?: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <section style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 32, marginTop: 32 }}>
      <h2 style={{ color: '#f0e6d0', fontSize: 20, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
        {Icon && <Icon size={18} style={{ color: terra, flexShrink: 0 }} />}
        {title}
      </h2>
      <div style={{ color: '#aaa', fontSize: 14, lineHeight: 1.8 }}>
        {children}
      </div>
    </section>
  )
}

function InfoBox({ children, warning }: { children: React.ReactNode; warning?: boolean }) {
  return (
    <div style={{
      background: warning ? 'rgba(200,113,74,0.08)' : 'rgba(255,255,255,0.04)',
      border: `1px solid ${warning ? 'rgba(200,113,74,0.25)' : 'rgba(255,255,255,0.08)'}`,
      borderRadius: 10,
      padding: '16px 20px',
      marginTop: 12,
      color: '#ccc',
      fontSize: 14,
      lineHeight: 1.8,
    }}>
      {children}
    </div>
  )
}

function Ul({ items }: { items: string[] }) {
  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: '8px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map((item, i) => (
        <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span style={{ color: terra, marginTop: 2, flexShrink: 0 }}>›</span>
          <span dangerouslySetInnerHTML={{ __html: item }} />
        </li>
      ))}
    </ul>
  )
}

export default function TermosPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0f0a06', color: '#aaa', fontFamily: 'Inter, sans-serif' }}>
      {/* Nav */}
      <nav style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#888', textDecoration: 'none', fontSize: 13 }}>
          <ArrowLeft size={16} />
          Voltar
        </Link>
        <span style={{ color: '#333' }}>|</span>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <span style={{ color: dourado, fontWeight: 700, fontSize: 15, fontStyle: 'italic', fontFamily: "'Playfair Display', serif" }}>
            Meu Atelier Sistema
          </span>
        </Link>
      </nav>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px 80px' }}>
        {/* Header */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(200,113,74,0.15)', border: '1px solid rgba(200,113,74,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Scale size={20} style={{ color: terra }} />
            </div>
            <h1 style={{ color: '#f0e6d0', fontSize: 28, fontWeight: 800, margin: 0, fontFamily: "'Playfair Display', serif" }}>
              Termos de Uso
            </h1>
          </div>
          <p style={{ color: '#555', fontSize: 13, margin: 0 }}>Última atualização: 10 de janeiro de 2026</p>
        </div>

        {/* Aviso de aceitação */}
        <InfoBox warning>
          <strong style={{ color: '#f0e6d0' }}>Importante:</strong> Ao criar uma conta, você confirma ter lido e aceito integralmente estes Termos de Uso e nossa{' '}
          <Link href="/privacidade" style={{ color: terra }}>Política de Privacidade</Link>.
          Se não concordar, não utilize o serviço.
        </InfoBox>

        <Section icon={FileText} title="1. Aceitação dos Termos">
          <p>Ao acessar e usar o <strong style={{ color: '#f0e6d0' }}>Meu Atelier Sistema</strong>, você concorda com estes Termos de Uso. O uso continuado após qualquer alteração constitui aceitação das novas condições.</p>
        </Section>

        <Section title="2. Descrição do Serviço">
          <p style={{ marginBottom: 12 }}>O <strong style={{ color: '#f0e6d0' }}>Meu Atelier Sistema</strong> é uma plataforma SaaS para gestão de ateliês, oferecendo:</p>
          <Ul items={[
            'Cadastro e gestão de clientes',
            'Controle de ordens de serviço',
            'Gerenciamento financeiro (caixa, contas a pagar/receber)',
            'Catálogo de serviços e estoque',
            'Dashboards e relatórios',
            'Notificações e lembretes',
          ]} />
        </Section>

        <Section title="3. Elegibilidade">
          <p style={{ marginBottom: 12 }}>Para usar o sistema, você deve:</p>
          <Ul items={[
            'Ter pelo menos 18 anos de idade',
            'Possuir capacidade legal para celebrar contratos',
            'Fornecer informações verdadeiras e completas',
            'Não ter sido previamente banido do serviço',
          ]} />
        </Section>

        <Section icon={Shield} title="4. Conta e Segurança">
          <p style={{ marginBottom: 12 }}><strong style={{ color: '#f0e6d0' }}>4.1 Criação de conta</strong></p>
          <Ul items={[
            'Você é responsável por manter sua senha segura',
            'Não compartilhe credenciais com terceiros',
            'Notifique-nos imediatamente sobre uso não autorizado',
            'Uma conta por pessoa/organização',
          ]} />
          <p style={{ marginTop: 16 }}><strong style={{ color: '#f0e6d0' }}>4.2 Responsabilidade:</strong> Você é totalmente responsável por todas as atividades realizadas em sua conta.</p>
        </Section>

        <Section title="5. Planos e Pagamentos">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '16px' }}>
              <p style={{ color: '#f0e6d0', fontWeight: 700, margin: '0 0 8px' }}>Plano Free</p>
              <Ul items={['Gratuito permanentemente', 'Até 50 clientes', 'Recursos básicos']} />
            </div>
            <div style={{ background: 'rgba(200,113,74,0.06)', border: '1px solid rgba(200,113,74,0.2)', borderRadius: 10, padding: '16px' }}>
              <p style={{ color: dourado, fontWeight: 700, margin: '0 0 8px' }}>Plano Pro</p>
              <Ul items={['R$ 59,90/mês', 'Clientes ilimitados', 'Até 3 usuários', 'Recursos avançados', 'Cancele a qualquer momento']} />
            </div>
          </div>
          <p><strong style={{ color: '#f0e6d0' }}>Cancelamento:</strong> Você pode cancelar a qualquer momento. Não há reembolso proporcional. O acesso permanece até o fim do período pago.</p>
        </Section>

        <Section icon={Ban} title="6. Uso Aceitável">
          <p style={{ marginBottom: 12 }}>Você concorda em <strong style={{ color: '#f0e6d0' }}>NÃO</strong>:</p>
          <Ul items={[
            'Violar leis ou regulamentos brasileiros',
            'Fazer engenharia reversa do software',
            'Tentar acessar sistemas não autorizados',
            'Enviar spam ou conteúdo malicioso',
            'Usar o serviço para atividades ilegais',
            'Revender ou sublicenciar o serviço',
            'Interferir no funcionamento do sistema',
            'Coletar dados de outros usuários sem consentimento',
          ]} />
        </Section>

        <Section title="7. Propriedade Intelectual">
          <p style={{ marginBottom: 12 }}><strong style={{ color: '#f0e6d0' }}>Nossa propriedade:</strong> O Meu Atelier Sistema, incluindo código, design, marca e conteúdo, é propriedade exclusiva da Omega Sistem. Todos os direitos reservados.</p>
          <p><strong style={{ color: '#f0e6d0' }}>Seus dados:</strong> Você mantém propriedade total sobre os dados inseridos (clientes, ordens, etc.). Concedemos uma licença limitada para armazená-los e processá-los apenas para prestação do serviço.</p>
        </Section>

        <Section icon={AlertTriangle} title="8. Limitação de Responsabilidade">
          <InfoBox warning>
            <p style={{ color: '#f0e6d0', fontWeight: 700, margin: '0 0 8px' }}>Importante</p>
            <Ul items={[
              'O serviço é fornecido "como está", sem garantias expressas',
              'Não garantimos disponibilidade 100% do tempo',
              'Não somos responsáveis por perda de dados causada pelo usuário',
              'Recomendamos backup regular de informações críticas',
              'Nossa responsabilidade total está limitada ao valor pago nos últimos 12 meses',
            ]} />
          </InfoBox>
        </Section>

        <Section title="9. Rescisão">
          <p style={{ marginBottom: 12 }}><strong style={{ color: '#f0e6d0' }}>Por você:</strong> Cancele sua conta a qualquer momento nas configurações ou pelo suporte.</p>
          <p style={{ marginBottom: 12 }}><strong style={{ color: '#f0e6d0' }}>Por nós:</strong> Podemos suspender ou encerrar sua conta se:</p>
          <Ul items={[
            'Você violar estes Termos de Uso',
            'Houver suspeita de fraude ou uso ilegal',
            'Houver inadimplência (planos pagos)',
            'Por decisão comercial (com aviso prévio de 30 dias)',
          ]} />
          <p style={{ marginTop: 16 }}><strong style={{ color: '#f0e6d0' }}>Após cancelamento:</strong> Seus dados ficam disponíveis por 30 dias para recuperação, depois são anonimizados conforme LGPD.</p>
        </Section>

        <Section title="10. Modificações">
          <p>Podemos modificar estes termos a qualquer momento. Mudanças significativas serão notificadas por email com 15 dias de antecedência.</p>
        </Section>

        <Section icon={Scale} title="11. Lei Aplicável e Foro">
          <p>Estes termos são regidos pelas leis da República Federativa do Brasil. Qualquer disputa será resolvida no foro da comarca de residência do usuário.</p>
        </Section>

        <Section title="12. Contato">
          <InfoBox>
            <p style={{ margin: '4px 0' }}><strong style={{ color: '#f0e6d0' }}>Suporte:</strong> contato@omegasistem.com.br</p>
            <p style={{ margin: '4px 0' }}><strong style={{ color: '#f0e6d0' }}>Website:</strong> <a href="https://omegasistem.com.br" style={{ color: terra }}>omegasistem.com.br</a></p>
            <p style={{ margin: '4px 0' }}><strong style={{ color: '#f0e6d0' }}>LGPD:</strong> <a href="mailto:dpo@meuateliersistema.com.br" style={{ color: terra }}>dpo@meuateliersistema.com.br</a></p>
          </InfoBox>
        </Section>

        {/* Footer */}
        <div style={{ marginTop: 48, paddingTop: 32, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ color: '#555', fontSize: 13, marginBottom: 16 }}>Ao usar o Meu Atelier Sistema, você concorda com estes Termos de Uso.</p>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <Link href="/privacidade" style={{ color: '#666', fontSize: 13, textDecoration: 'none' }}>Política de Privacidade</Link>
            <Link href="/lgpd" style={{ color: '#666', fontSize: 13, textDecoration: 'none' }}>Direitos LGPD</Link>
            <Link href="/" style={{ color: '#666', fontSize: 13, textDecoration: 'none' }}>Voltar ao Início</Link>
          </div>
        </div>
        <p style={{ marginTop: 16, color: '#333', fontSize: 12 }}>© {new Date().getFullYear()} Meu Atelier Sistema · Omega Sistem</p>
      </div>
    </div>
  )
}
