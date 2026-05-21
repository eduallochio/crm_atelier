import Link from 'next/link'
import { ArrowLeft, Shield, Eye, Download, Edit, Trash2, FileText, Mail, CheckCircle } from 'lucide-react'

export const metadata = {
  title: 'Seus Direitos LGPD - Meu Atelier Sistema',
  description: 'Exercite seus direitos conforme a Lei Geral de Proteção de Dados (LGPD) — Lei 13.709/2018',
}

const terra   = '#c8714a'
const dourado = '#d4a85a'

const direitos = [
  {
    icon: Eye,
    num: '1',
    title: 'Acessar Seus Dados',
    desc: 'Veja quais dados pessoais armazenamos sobre você.',
    items: ['Quais dados temos', 'Como os usamos', 'Com quem compartilhamos'],
    action: 'Solicitar Acesso',
    href: 'mailto:dpo@meuateliersistema.com.br?subject=Solicitação de Acesso aos Dados',
  },
  {
    icon: Edit,
    num: '2',
    title: 'Corrigir Dados',
    desc: 'Atualize informações incorretas ou incompletas diretamente no seu perfil.',
    items: [],
    action: 'Acessar Perfil',
    href: '/profile',
  },
  {
    icon: Trash2,
    num: '3',
    title: 'Excluir Dados',
    desc: 'Solicite a anonimização ou exclusão. Após 30 dias do cancelamento os dados são anonimizados — ação irreversível.',
    items: [],
    action: 'Solicitar Exclusão',
    href: 'mailto:dpo@meuateliersistema.com.br?subject=Solicitação de Exclusão de Dados',
  },
  {
    icon: Download,
    num: '4',
    title: 'Exportar Dados',
    desc: 'Receba cópia de todos os seus dados em JSON/CSV para usar em outro sistema.',
    items: [],
    action: 'Solicitar Exportação',
    href: 'mailto:dpo@meuateliersistema.com.br?subject=Solicitação de Portabilidade de Dados',
  },
  {
    icon: FileText,
    num: '5',
    title: 'Compartilhamento',
    desc: 'Seus dados são compartilhados apenas com infraestrutura essencial:',
    items: ['Supabase — banco de dados', 'Vercel — hospedagem'],
    action: 'Ver Detalhes',
    href: '/privacidade#compartilhamento',
  },
  {
    icon: CheckCircle,
    num: '6',
    title: 'Revogar Consentimento',
    desc: 'Retire seu consentimento para notificações ou outros usos opcionais.',
    items: [],
    action: 'Revogar Consentimento',
    href: 'mailto:dpo@meuateliersistema.com.br?subject=Revogação de Consentimento',
  },
]

export default function LGPDPage() {
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

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px 80px' }}>
        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(200,113,74,0.15)', border: '1px solid rgba(200,113,74,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={20} style={{ color: terra }} />
            </div>
            <h1 style={{ color: '#f0e6d0', fontSize: 28, fontWeight: 800, margin: 0, fontFamily: "'Playfair Display', serif" }}>
              Seus Direitos LGPD
            </h1>
          </div>
          <p style={{ color: '#555', fontSize: 13, margin: 0 }}>Lei Geral de Proteção de Dados — Lei 13.709/2018</p>
        </div>

        {/* O que é a LGPD */}
        <div style={{ background: 'rgba(200,113,74,0.06)', border: '1px solid rgba(200,113,74,0.15)', borderRadius: 12, padding: '20px 24px', marginBottom: 40 }}>
          <p style={{ color: dourado, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>O que é a LGPD?</p>
          <p style={{ color: '#ccc', fontSize: 14, lineHeight: 1.8, margin: 0 }}>
            A LGPD é a lei brasileira que protege seus dados pessoais. Ela garante que você tenha controle sobre suas informações e saiba como elas são usadas. Abaixo explicamos seus direitos de forma simples e como exercê-los.
          </p>
        </div>

        {/* Grid de Direitos */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16, marginBottom: 48 }}>
          {direitos.map((d) => {
            const Icon = d.icon
            return (
              <div key={d.num} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Icon + título */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(200,113,74,0.12)', border: '1px solid rgba(200,113,74,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={16} style={{ color: terra }} />
                  </div>
                  <div>
                    <span style={{ color: '#444', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em' }}>{d.num}.</span>
                    <p style={{ color: '#f0e6d0', fontSize: 14, fontWeight: 700, margin: 0 }}>{d.title}</p>
                  </div>
                </div>

                {/* Descrição */}
                <p style={{ color: '#888', fontSize: 13, lineHeight: 1.7, margin: 0, flex: 1 }}>{d.desc}</p>

                {/* Lista opcional */}
                {d.items.length > 0 && (
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {d.items.map((item, i) => (
                      <li key={i} style={{ display: 'flex', gap: 8, fontSize: 12, color: '#777' }}>
                        <span style={{ color: terra }}>›</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                )}

                {/* Botão */}
                <a href={d.href} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(200,113,74,0.3)', background: 'rgba(200,113,74,0.06)', color: terra, fontSize: 12, fontWeight: 600, textDecoration: 'none', transition: 'all .15s' }}>
                  <Mail size={12} />
                  {d.action}
                </a>
              </div>
            )
          })}
        </div>

        {/* Como exercer */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '28px', marginBottom: 32 }}>
          <p style={{ color: dourado, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20 }}>Como Exercer Seus Direitos</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {[
              ['1', 'Entre em Contato', <>Envie email para <a href="mailto:dpo@meuateliersistema.com.br" style={{ color: terra }}>dpo@meuateliersistema.com.br</a> informando qual direito deseja exercer.</>],
              ['2', 'Identificação', 'Para sua segurança, precisamos confirmar sua identidade. Inclua seu email cadastrado no sistema.'],
              ['3', 'Prazo de Resposta', 'Respondemos em até 15 dias úteis conforme estabelecido pela LGPD.'],
            ].map(([num, title, desc]) => (
              <div key={num as string} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(200,113,74,0.15)', border: '1px solid rgba(200,113,74,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: terra, fontSize: 12, fontWeight: 700 }}>
                  {num as string}
                </div>
                <div>
                  <p style={{ color: '#f0e6d0', fontWeight: 700, fontSize: 14, margin: '0 0 4px' }}>{title as string}</p>
                  <p style={{ color: '#777', fontSize: 13, lineHeight: 1.7, margin: 0 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* DPO */}
        <div style={{ background: 'rgba(200,113,74,0.06)', border: '1px solid rgba(200,113,74,0.15)', borderRadius: 12, padding: '20px 24px', marginBottom: 32 }}>
          <p style={{ color: dourado, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Encarregado de Dados (DPO)</p>
          <p style={{ color: '#ccc', fontSize: 14, marginBottom: 12 }}>Nosso DPO é o responsável por garantir a conformidade com a LGPD e atender suas solicitações.</p>
          <p style={{ margin: '4px 0', fontSize: 14, color: '#aaa' }}><strong style={{ color: '#f0e6d0' }}>Email:</strong> <a href="mailto:dpo@meuateliersistema.com.br" style={{ color: terra }}>dpo@meuateliersistema.com.br</a></p>
          <p style={{ margin: '4px 0', fontSize: 14, color: '#aaa' }}><strong style={{ color: '#f0e6d0' }}>Prazo:</strong> Até 15 dias úteis</p>
        </div>

        {/* Links úteis */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 40 }}>
          {[
            ['/privacidade', 'Política de Privacidade', 'Como tratamos seus dados'],
            ['/termos', 'Termos de Uso', 'Condições de uso do serviço'],
            ['https://www.gov.br/anpd/', 'ANPD', 'Autoridade Nacional de Proteção de Dados'],
          ].map(([href, title, desc]) => (
            <a key={href} href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" style={{ flex: '1 1 200px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '16px', textDecoration: 'none' }}>
              <p style={{ color: '#f0e6d0', fontWeight: 700, fontSize: 13, margin: '0 0 4px' }}>{title}</p>
              <p style={{ color: '#666', fontSize: 12, margin: 0 }}>{desc}</p>
            </a>
          ))}
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 24 }}>
          <p style={{ color: '#333', fontSize: 12, margin: 0 }}>© {new Date().getFullYear()} Meu Atelier Sistema · Em conformidade com a Lei 13.709/2018 (LGPD)</p>
        </div>
      </div>
    </div>
  )
}
