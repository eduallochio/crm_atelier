import Link from 'next/link'
import { ArrowLeft, Shield, Lock, Eye, Download, Trash2, FileText } from 'lucide-react'

export const metadata = {
  title: 'Política de Privacidade - Meu Atelier Sistema',
  description: 'Política de Privacidade e Proteção de Dados do Meu Atelier Sistema conforme LGPD',
}

const terra  = '#c8714a'
const dourado = '#d4a85a'

function Section({ id, icon: Icon, title, children }: { id?: string; icon?: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <section id={id} style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 32, marginTop: 32 }}>
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

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '16px 20px', marginTop: 12, color: '#ccc', fontSize: 14, lineHeight: 1.8 }}>
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

export default function PrivacidadePage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0f0a06', color: '#aaa', fontFamily: 'Inter, sans-serif' }}>
      {/* Nav */}
      <nav style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#888', textDecoration: 'none', fontSize: 13, transition: 'color .15s' }}>
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
            <div style={{ width: 44, height: 44, borderRadius: 12, background: `rgba(200,113,74,0.15)`, border: `1px solid rgba(200,113,74,0.3)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={20} style={{ color: terra }} />
            </div>
            <h1 style={{ color: '#f0e6d0', fontSize: 28, fontWeight: 800, margin: 0, fontFamily: "'Playfair Display', serif" }}>
              Política de Privacidade
            </h1>
          </div>
          <p style={{ color: '#555', fontSize: 13, margin: 0 }}>Última atualização: 10 de janeiro de 2026 · LGPD — Lei 13.709/2018</p>
        </div>

        {/* Índice */}
        <div style={{ background: 'rgba(200,113,74,0.06)', border: '1px solid rgba(200,113,74,0.15)', borderRadius: 12, padding: '20px 24px', marginBottom: 8 }}>
          <p style={{ color: dourado, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Índice</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 24px' }}>
            {[
              ['#controlador', '1. Identificação do Controlador'],
              ['#dpo', '2. Encarregado de Dados (DPO)'],
              ['#dados', '3. Dados Coletados'],
              ['#finalidades', '4. Finalidades do Tratamento'],
              ['#base-legal', '5. Base Legal'],
              ['#compartilhamento', '6. Compartilhamento'],
              ['#retencao', '7. Retenção de Dados'],
              ['#direitos', '8. Seus Direitos'],
              ['#seguranca', '9. Segurança'],
              ['#cookies', '10. Cookies'],
              ['#alteracoes', '11. Alterações'],
              ['#contato', '12. Contato'],
            ].map(([href, label]) => (
              <a key={href} href={href} style={{ color: '#888', fontSize: 13, textDecoration: 'none' }}>{label}</a>
            ))}
          </div>
        </div>

        <Section id="controlador" icon={FileText} title="1. Identificação do Controlador">
          <p>O <strong style={{ color: '#f0e6d0' }}>Meu Atelier Sistema</strong> é desenvolvido e operado por:</p>
          <InfoBox>
            <p style={{ margin: '4px 0' }}><strong style={{ color: '#f0e6d0' }}>Razão Social:</strong> Omega Sistem</p>
            <p style={{ margin: '4px 0' }}><strong style={{ color: '#f0e6d0' }}>Website:</strong> <a href="https://omegasistem.com.br" style={{ color: terra }}>omegasistem.com.br</a></p>
            <p style={{ margin: '4px 0' }}><strong style={{ color: '#f0e6d0' }}>Email:</strong> contato@omegasistem.com.br</p>
          </InfoBox>
        </Section>

        <Section id="dpo" icon={Eye} title="2. Encarregado de Dados (DPO)">
          <p>Para questões sobre proteção de dados, entre em contato com nosso Encarregado:</p>
          <InfoBox>
            <p style={{ margin: '4px 0' }}><strong style={{ color: '#f0e6d0' }}>Email:</strong> <a href="mailto:dpo@meuateliersistema.com.br" style={{ color: terra }}>dpo@meuateliersistema.com.br</a></p>
            <p style={{ margin: '4px 0' }}><strong style={{ color: '#f0e6d0' }}>Prazo de resposta:</strong> Até 15 dias úteis</p>
          </InfoBox>
        </Section>

        <Section id="dados" icon={Lock} title="3. Dados Coletados">
          <p style={{ marginBottom: 12 }}><strong style={{ color: '#f0e6d0' }}>3.1 Dados de Cadastro</strong></p>
          <Ul items={['Nome completo', 'Email', 'Senha (armazenada com criptografia bcrypt)']} />
          <p style={{ marginTop: 16, marginBottom: 12 }}><strong style={{ color: '#f0e6d0' }}>3.2 Dados de Clientes (inseridos por você)</strong></p>
          <Ul items={['Nome, telefone, email', 'Endereço completo', 'Data de nascimento (opcional)', 'Notas e observações']} />
          <p style={{ marginTop: 16, marginBottom: 12 }}><strong style={{ color: '#f0e6d0' }}>3.3 Dados da Organização</strong></p>
          <Ul items={['Nome fantasia, CNPJ (opcional)', 'Email e telefone', 'Endereço, logo']} />
          <p style={{ marginTop: 16, marginBottom: 12 }}><strong style={{ color: '#f0e6d0' }}>3.4 Dados Técnicos Automáticos</strong></p>
          <Ul items={['Endereço IP', 'Tipo de navegador e sistema operacional', 'Cookies essenciais de autenticação', 'Logs de acesso']} />
        </Section>

        <Section id="finalidades" title="4. Finalidades do Tratamento">
          <Ul items={[
            '<strong style="color:#f0e6d0">Prestação do serviço:</strong> Gerenciar clientes, OS e finanças',
            '<strong style="color:#f0e6d0">Autenticação:</strong> Garantir acesso seguro à conta',
            '<strong style="color:#f0e6d0">Suporte:</strong> Responder dúvidas e resolver problemas',
            '<strong style="color:#f0e6d0">Segurança:</strong> Prevenir fraudes e abusos',
            '<strong style="color:#f0e6d0">Melhoria:</strong> Analisar uso para evoluir o sistema',
          ]} />
        </Section>

        <Section id="base-legal" title="5. Base Legal">
          <Ul items={[
            '<strong style="color:#f0e6d0">Consentimento (Art. 7º, I):</strong> Para dados opcionais',
            '<strong style="color:#f0e6d0">Execução de contrato (Art. 7º, V):</strong> Para prestação do serviço',
            '<strong style="color:#f0e6d0">Legítimo interesse (Art. 7º, IX):</strong> Para segurança e melhorias',
            '<strong style="color:#f0e6d0">Obrigação legal (Art. 7º, II):</strong> Para conformidade fiscal',
          ]} />
        </Section>

        <Section id="compartilhamento" title="6. Compartilhamento de Dados">
          <p style={{ marginBottom: 12 }}>Compartilhamos dados apenas com infraestrutura essencial:</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              ['Supabase', 'Banco de dados com criptografia e isolamento por organização'],
              ['Vercel', 'Hospedagem e CDN'],
              ['Stripe', 'Processamento de pagamentos (quando aplicável)'],
            ].map(([name, desc]) => (
              <div key={name} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '12px 16px' }}>
                <span style={{ color: terra, fontWeight: 700, minWidth: 70, fontSize: 13 }}>{name}</span>
                <span style={{ fontSize: 13 }}>{desc}</span>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 16, fontSize: 13, color: '#666' }}>⚠ Não vendemos, alugamos ou compartilhamos dados com terceiros para marketing.</p>
        </Section>

        <Section id="retencao" title="7. Retenção de Dados">
          <Ul items={[
            '<strong style="color:#f0e6d0">Conta ativa:</strong> enquanto a conta existir',
            '<strong style="color:#f0e6d0">Após cancelamento:</strong> 30 dias para recuperação, depois anonimizados',
            '<strong style="color:#f0e6d0">Dados fiscais:</strong> 5 anos (obrigação legal)',
            '<strong style="color:#f0e6d0">Logs de segurança:</strong> 6 meses',
          ]} />
        </Section>

        <Section id="direitos" icon={Download} title="8. Seus Direitos (Art. 18, LGPD)">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
            {[
              [Download, 'Acessar dados', 'Obter cópia de todos os dados'],
              [FileText, 'Corrigir dados', 'Atualizar informações incorretas'],
              [Trash2, 'Excluir dados', 'Solicitar anonimização ou exclusão'],
              [Download, 'Portabilidade', 'Exportar dados em formato estruturado'],
            ].map(([Icon, title, desc], i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 6 }}>
                  <Icon size={14} style={{ color: terra }} />
                  <span style={{ color: '#f0e6d0', fontWeight: 600, fontSize: 13 }}>{title as string}</span>
                </div>
                <p style={{ margin: 0, fontSize: 12, color: '#666' }}>{desc as string}</p>
              </div>
            ))}
          </div>
          <InfoBox>
            <strong style={{ color: '#f0e6d0' }}>Como exercer seus direitos:</strong> Envie email para{' '}
            <a href="mailto:dpo@meuateliersistema.com.br" style={{ color: terra }}>dpo@meuateliersistema.com.br</a>{' '}
            ou acesse <Link href="/lgpd" style={{ color: terra }}>nossa página LGPD</Link>.
          </InfoBox>
        </Section>

        <Section id="seguranca" icon={Shield} title="9. Segurança">
          <Ul items={[
            'Criptografia SSL/TLS em trânsito',
            'Senhas com hash bcrypt',
            'Row Level Security (RLS) — isolamento entre organizações',
            'Backup automático diário',
            'Autenticação via Supabase Auth',
            'Logout automático por inatividade (30 minutos)',
          ]} />
        </Section>

        <Section id="cookies" title="10. Cookies">
          <Ul items={[
            '<strong style="color:#f0e6d0">Essenciais:</strong> Manter autenticação ativa',
            '<strong style="color:#f0e6d0">Preferências:</strong> Lembrar tema escuro/claro',
          ]} />
          <p style={{ marginTop: 12, fontSize: 13 }}>Não utilizamos cookies de rastreamento, analytics ou publicidade.</p>
        </Section>

        <Section id="alteracoes" title="11. Alterações nesta Política">
          <p>Podemos atualizar esta política periodicamente. Notificaremos alterações significativas por email ou aviso no sistema. A data de última atualização estará sempre visível no topo desta página.</p>
        </Section>

        <Section id="contato" title="12. Contato">
          <InfoBox>
            <p style={{ margin: '4px 0' }}><strong style={{ color: '#f0e6d0' }}>DPO (Proteção de Dados):</strong> <a href="mailto:dpo@meuateliersistema.com.br" style={{ color: terra }}>dpo@meuateliersistema.com.br</a></p>
            <p style={{ margin: '4px 0' }}><strong style={{ color: '#f0e6d0' }}>Suporte:</strong> contato@omegasistem.com.br</p>
            <p style={{ margin: '4px 0' }}><strong style={{ color: '#f0e6d0' }}>LGPD:</strong> <Link href="/lgpd" style={{ color: terra }}>meuateliersistema.com.br/lgpd</Link></p>
          </InfoBox>
        </Section>

        {/* Footer */}
        <div style={{ marginTop: 48, paddingTop: 32, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <Link href="/termos" style={{ color: '#666', fontSize: 13, textDecoration: 'none' }}>Termos de Uso</Link>
          <Link href="/lgpd" style={{ color: '#666', fontSize: 13, textDecoration: 'none' }}>Direitos LGPD</Link>
          <Link href="/" style={{ color: '#666', fontSize: 13, textDecoration: 'none' }}>Voltar ao Início</Link>
        </div>
        <p style={{ marginTop: 16, color: '#333', fontSize: 12 }}>© {new Date().getFullYear()} Meu Atelier Sistema · Em conformidade com a Lei 13.709/2018 (LGPD)</p>
      </div>
    </div>
  )
}
