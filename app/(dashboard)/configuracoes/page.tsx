'use client'

import { useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Bell, Building2, CreditCard, DollarSign, FileText, Settings, Users } from 'lucide-react'
import { Header } from '@/components/layouts/header'
import { OrganizationSettingsForm } from '@/components/settings/organization-settings-form'
import { FinancialSettingsForm } from '@/components/settings/financial-settings-form'
import { NotificationSettingsForm } from '@/components/settings/notification-settings-form'
import { OrderSettingsForm } from '@/components/settings/order-settings-form'
import { SystemSettingsForm } from '@/components/settings/system-settings-form'
import { UsersManagementForm } from '@/components/settings/users-management-form'
import { SubscriptionSettingsForm } from '@/components/settings/subscription-settings-form'
import { MASTER_DETAIL_CSS } from '@/components/dashboard/master-detail-css'

const SECTIONS = [
  { key: 'empresa', label: 'Empresa', icon: Building2, title: 'Empresa', desc: 'Os dados do ateliê que aparecem nas ordens, comprovantes e relatórios.', Form: OrganizationSettingsForm },
  { key: 'usuarios', label: 'Usuários', icon: Users, title: 'Usuários', desc: 'Quem tem acesso ao sistema e o cargo de cada pessoa da equipe.', Form: UsersManagementForm },
  { key: 'financeiro', label: 'Financeiro', icon: DollarSign, title: 'Financeiro', desc: 'Formas de pagamento, chave PIX e taxas.', Form: FinancialSettingsForm },
  { key: 'ordens', label: 'Ordens de serviço', icon: FileText, title: 'Ordens de serviço', desc: 'Numeração, status inicial, campos obrigatórios, prazos e impressora.', Form: OrderSettingsForm },
  { key: 'notificacoes', label: 'Notificações', icon: Bell, title: 'Notificações', desc: 'Lembretes e avisos para você e para as clientes.', Form: NotificationSettingsForm },
  { key: 'sistema', label: 'Sistema', icon: Settings, title: 'Preferências do sistema', desc: 'Formatos de data e moeda, caixa e módulos ligados.', Form: SystemSettingsForm },
  { key: 'assinatura', label: 'Assinatura', icon: CreditCard, title: 'Assinatura e pagamento', desc: 'Seu plano, o uso dos recursos e o upgrade quando precisar.', Form: SubscriptionSettingsForm },
] as const

/** Seções à esquerda (no celular, em abas roláveis), o formulário da seção à direita; a seção fica na URL (?tab=) */
export default function ConfiguracoesPage() {
  const router = useRouter()
  const params = useSearchParams()
  const current = SECTIONS.find((s) => s.key === params.get('tab')) ?? SECTIONS[0]
  const go = (key: string) => router.replace(`/configuracoes?tab=${key}`, { scroll: false })
  const navRef = useRef<HTMLElement>(null)

  // no celular as seções rolam de lado: mantém a aberta à vista
  useEffect(() => {
    navRef.current?.querySelector<HTMLElement>('[aria-current="page"]')?.scrollIntoView({ inline: 'center', block: 'nearest' })
  }, [current.key])

  return (
    <div>
      <style>{MASTER_DETAIL_CSS + CFG_CSS}</style>
      <Header title="Configurações" description="Ajuste o sistema ao jeito do seu ateliê" />

      <div className="lg:flex lg:items-start">
        {/* ── seções ── */}
        <nav ref={navRef} aria-label="Seções das configurações"
          className="cfg-nav sticky top-0 z-10 flex gap-1 overflow-x-auto border-b border-border bg-card px-3 py-2 sm:px-6 lg:top-4 lg:m-6 lg:mr-0 lg:w-[270px] lg:shrink-0 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:rounded-xl lg:border lg:p-2">
          {SECTIONS.map((s) => {
            const on = s.key === current.key
            return (
              <button key={s.key} type="button" onClick={() => go(s.key)} aria-current={on ? 'page' : undefined} className={`cfg-item ${on ? 'is-on' : ''}`}>
                <s.icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" strokeWidth={1.75} />
                <span className="min-w-0">
                  <span className="block whitespace-nowrap text-[14px] font-medium">{s.label}</span>
                  <span className="hidden truncate text-[12px] text-muted-foreground lg:block">{s.desc}</span>
                </span>
              </button>
            )
          })}
        </nav>

        {/* ── seção aberta ── */}
        <section key={current.key} aria-labelledby="cfg-title" className="cfg-panel cli-det min-w-0 flex-1 px-3 py-5 sm:px-6 lg:px-8 lg:py-7">
          <div className="mx-auto max-w-4xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Configurações</p>
            <h2 id="cfg-title" className="font-serif-display mt-1 text-[34px] leading-[1.05] text-foreground sm:text-[38px]">{current.title}</h2>
            <p className="mt-1.5 mb-6 text-sm text-muted-foreground">{current.desc}</p>
            <current.Form />
          </div>
        </section>
      </div>
    </div>
  )
}

/* Estilo da navegação e um acabamento leve nos formulários (sem mexer neles):
   cartões sem sombra, títulos em Cormorant, subtítulos como legendas e divisões pespontadas */
const CFG_CSS = `
.cfg-nav { scrollbar-width: none; }
.cfg-nav::-webkit-scrollbar { display: none; }
.cfg-item { position: relative; display: flex; flex: none; align-items: center; gap: 10px; min-height: 44px; padding: 8px 12px; border-radius: 10px; text-align: left; color: var(--muted-foreground); transition: background-color .12s, color .12s; }
.cfg-item:hover { color: var(--foreground); background: color-mix(in oklab, var(--muted) 70%, transparent); }
.cfg-item.is-on { color: var(--foreground); background: rgba(200,113,74,.1); }
.cfg-item.is-on svg { color: #C8714A; }
.cfg-item.is-on::after { content: ''; position: absolute; left: 10px; right: 10px; bottom: 2px; height: 2px; background: repeating-linear-gradient(90deg, #C8714A 0 6px, transparent 6px 9px); }
.cfg-item:focus-visible { outline: 2px solid #C8714A; outline-offset: 2px; }
@media (min-width: 1024px) {
  .cfg-item { align-items: flex-start; padding: 10px 12px; }
  .cfg-item svg { margin-top: 1px; }
  .cfg-item.is-on::after { left: 0; right: auto; top: 10px; bottom: 10px; width: 3px; height: auto; border-radius: 2px; background: repeating-linear-gradient(180deg, #C8714A 0 5px, transparent 5px 8px); }
}
.cfg-panel .rounded-xl.border.bg-card { box-shadow: none; border-color: color-mix(in oklab, var(--border) 70%, transparent); }
.cfg-panel h2.text-lg { font-family: var(--font-cormorant), 'Cormorant Garamond', Georgia, serif; font-weight: 400; font-size: 26px; line-height: 1.1; letter-spacing: -.01em; }
.cfg-panel h3.text-md, .cfg-panel h3.text-base, .cfg-panel h3.text-sm, .cfg-panel h3.text-lg { font-size: 11px; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; color: var(--muted-foreground); }
.cfg-panel .border-t { border-top-style: dashed; }
`
