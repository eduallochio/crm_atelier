'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  LayoutDashboard,
  Users,
  Scissors,
  FileText,
  DollarSign,
  Wallet,
  Settings,
  LogOut,
  Menu,
  X,
  User,
  ChevronDown,
  Check,
  ChevronRight,
  Truck,
  TrendingDown,
  TrendingUp,
  Shield,
  HelpCircle,
  Package,
  PackageOpen,
  PackageMinus,
  BarChart3,
  BookOpen,
  Bell,
  ArrowLeftRight,
  LucideIcon,
} from 'lucide-react'
import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ThemeToggle } from './theme-toggle'

type MenuItem = {
  name: string
  href: string
  icon: LucideIcon
  tourId?: string
  subitems?: { name: string; href: string; icon: LucideIcon }[]
}

type NavigationSection = {
  section: string
  items: MenuItem[]
}

const navigation: NavigationSection[] = [
  {
    section: 'Principal',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, tourId: 'nav-dashboard' },
    ],
  },
  {
    section: 'Gestão',
    items: [
      { name: 'Clientes', href: '/clientes', icon: Users, tourId: 'nav-clientes' },
      { name: 'Serviços', href: '/servicos', icon: Scissors, tourId: 'nav-servicos' },
      { name: 'Ordens de Serviço', href: '/ordens-servico', icon: FileText, tourId: 'nav-ordens' },
    ],
  },
  {
    // antes eram duas seções ("Financeiro" e "Estoque") com um único item de mesmo nome
    section: 'Finanças e estoque',
    items: [
      {
        name: 'Financeiro',
        href: '/financeiro',
        icon: DollarSign,
        tourId: 'nav-financeiro',
        subitems: [
          { name: 'Caixa', href: '/financeiro', icon: Wallet },
          { name: 'Fluxo de Caixa', href: '/financeiro/fluxo-caixa', icon: ArrowLeftRight },
          { name: 'Contas a Pagar', href: '/financeiro/pagar', icon: TrendingDown },
          { name: 'Contas a Receber', href: '/financeiro/receber', icon: TrendingUp },
        ],
      },
      {
        name: 'Estoque',
        href: '/estoque',
        icon: Package,
        tourId: 'nav-estoque',
        subitems: [
          { name: 'Produtos', href: '/estoque', icon: Package },
          { name: 'Entradas', href: '/estoque/entradas', icon: PackageOpen },
          { name: 'Saídas', href: '/estoque/saidas', icon: PackageMinus },
          { name: 'Relatórios', href: '/estoque/relatorios', icon: BarChart3 },
          { name: 'Fornecedores', href: '/fornecedores', icon: Truck },
        ],
      },
    ],
  },
  {
    section: 'Sistema',
    items: [
      { name: 'Configurações', href: '/configuracoes', icon: Settings, tourId: 'nav-configuracoes' },
      { name: 'Manual do Sistema', href: '/ajuda', icon: BookOpen },
    ],
  },
]

// Sidebar no tecido da marca: tinta #2C1810 com linho, terracota para o ativo,
// dourado nos rótulos e costura tracejada (separadores, submenu e o pesponto
// que corre até o item ativo). Igual nos temas claro e escuro.
const SIDEBAR_CSS = `
.sb{position:fixed;top:0;left:0;z-index:40;width:16rem;height:100vh;height:100dvh;display:flex;flex-direction:column;color:#F7F0E6;
  background-color:#2C1810;background-image:repeating-linear-gradient(0deg,rgba(255,255,255,.014) 0 1px,transparent 1px 4px),repeating-linear-gradient(90deg,rgba(255,255,255,.014) 0 1px,transparent 1px 4px);
  border-right:1px solid rgba(212,168,90,.14);transition:transform .3s cubic-bezier(.2,0,0,1)}
.sb-head{display:flex;align-items:center;gap:12px;height:68px;padding:0 18px;border-bottom:1px dashed rgba(212,168,90,.22);flex:none}
.sb-logo{position:relative;width:38px;height:38px;flex:none;border-radius:10px;overflow:hidden}
.sb-org{min-width:0}
.sb-org-name{display:block;margin:0;font-family:var(--font-cormorant),'Cormorant Garamond',Georgia,serif;font-style:italic;font-weight:500;font-size:19px;line-height:1.15;color:#F7F0E6;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sb-org-sub{display:block;margin-top:2px;font-size:11px;letter-spacing:.06em;color:rgba(247,240,230,.62)}
.sb-nav{position:relative;flex:1;overflow-y:auto;overflow-x:hidden;padding:14px 12px;scrollbar-width:thin;scrollbar-color:rgba(212,168,90,.25) transparent}
.sb-sec+.sb-sec{margin-top:18px}
.sb-sec-l{margin:0 0 6px;padding:0 12px;font-size:10.5px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:rgba(212,168,90,.8)}
.sb-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:2px}
.sb-item{position:relative;display:flex;align-items:center;gap:12px;width:100%;min-height:42px;padding:0 12px;border:0;border-radius:8px;background:none;
  color:rgba(247,240,230,.8);font-size:14.5px;font-weight:500;text-decoration:none;text-align:left;cursor:pointer;transition:background-color .15s,color .15s}
.sb-item .sb-ic{flex:none;width:18px;height:18px;color:rgba(247,240,230,.58);transition:color .15s}
.sb-item:hover{background:rgba(247,240,230,.06);color:#F7F0E6}
.sb-item:hover .sb-ic{color:#F7F0E6}
.sb-item:focus-visible,.sb-link:focus-visible,.sb-out:focus-visible,.sb-plan:focus-visible{outline:2px solid #D4A85A;outline-offset:-2px}
.sb-item.is-on{color:#F7F0E6;background:rgba(200,113,74,.16)}
.sb-item.is-on .sb-ic{color:#E39B78}
.sb-txt{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sb-chev{flex:none;width:14px;height:14px;color:rgba(247,240,230,.5);transition:transform .25s cubic-bezier(.2,0,0,1)}
.sb-item[aria-expanded="true"] .sb-chev{transform:rotate(90deg)}
.sb-badge{flex:none;min-width:22px;height:20px;padding:0 7px;border-radius:10px;font-size:11px;font-weight:700;line-height:20px;text-align:center;font-variant-numeric:tabular-nums}
.sb-badge.alert{background:rgba(226,97,74,.22);color:#F4A08C}
.sb-badge.count{background:rgba(212,168,90,.18);color:#E8C98A}
.sb-subwrap{display:grid;grid-template-rows:0fr;transition:grid-template-rows .28s cubic-bezier(.2,0,0,1)}
.sb-subwrap.open{grid-template-rows:1fr}
.sb-sub{overflow:hidden;list-style:none;margin:0 0 0 23px;padding:0 0 0 12px;display:flex;flex-direction:column;gap:1px;border-left:1.5px dashed rgba(212,168,90,.3)}
.sb-sub>li:first-child{margin-top:4px}.sb-sub>li:last-child{margin-bottom:6px}
.sb-sub .sb-item{min-height:38px;font-size:14px}
.sb-sub .sb-ic{width:16px;height:16px}
.sb-ind{position:absolute;left:0;top:0;width:3px;height:42px;pointer-events:none;z-index:2;opacity:0;
  transition:transform .32s cubic-bezier(.2,0,0,1),height .32s cubic-bezier(.2,0,0,1),opacity .2s}
.sb-ind::before{content:'';position:absolute;inset:6px 0;border-radius:2px;background:repeating-linear-gradient(180deg,#E39B78 0 5px,transparent 5px 8px);transform-origin:top}
.sb-ind.sew::before{animation:sb-sew .45s cubic-bezier(.2,0,0,1) backwards}
@keyframes sb-sew{from{transform:scaleY(0)}}
.sb-foot{flex:none;border-top:1px dashed rgba(212,168,90,.22);padding:10px 12px 12px}
.sb-link{display:flex;align-items:center;gap:10px;width:100%;min-height:38px;padding:0 12px;border:0;border-radius:8px;background:none;color:rgba(247,240,230,.72);font-size:13.5px;text-decoration:none;text-align:left;cursor:pointer;transition:background-color .15s,color .15s}
.sb-link:hover{background:rgba(247,240,230,.06);color:#F7F0E6}
.sb-link.gold{color:#E0BC74}
.sb-link svg{flex:none;width:16px;height:16px}
.sb-user{display:flex;align-items:center;gap:10px;margin-top:6px;padding:10px;border-radius:10px;background:rgba(247,240,230,.05)}
.sb-av{width:36px;height:36px;flex:none;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#C8714A;color:#FFF8F0;font-size:13px;font-weight:600}
.sb-uinfo{flex:1;min-width:0}
.sb-uname{display:block;font-size:13.5px;font-weight:600;color:#F7F0E6;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sb-umail{display:block;font-size:11.5px;color:rgba(247,240,230,.62);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sb-plan{display:inline-flex;align-items:center;gap:4px;margin-top:5px;height:20px;padding:0 8px;border-radius:10px;font-size:10px;font-weight:700;line-height:20px;letter-spacing:.04em;white-space:nowrap;text-decoration:none}
.sb-plan.pro{border:1px solid rgba(212,168,90,.55);color:#E8C98A}
.sb-plan.free{background:rgba(200,113,74,.22);color:#F2B08F;transition:background-color .15s}
.sb-plan.free:hover{background:rgba(200,113,74,.34)}
.sb-out{width:36px;height:36px;flex:none;display:flex;align-items:center;justify-content:center;border:0;border-radius:8px;background:none;color:rgba(247,240,230,.62);cursor:pointer;transition:background-color .15s,color .15s}
.sb-out:hover{background:rgba(226,97,74,.18);color:#F4A08C}
.sb-ver{margin:8px 12px 0;font-size:10.5px;color:rgba(247,240,230,.48);font-variant-numeric:tabular-nums;user-select:none}
.sb-skel{height:56px;margin-top:6px;border-radius:10px;background:rgba(247,240,230,.05)}
@media (max-width:1023px){.sb.is-closed{transform:translateX(-100%)}.sb-head{padding-left:64px}}
@media (prefers-reduced-motion:reduce){.sb,.sb-ind,.sb-subwrap,.sb-chev{transition:none}.sb-ind.sew::before{animation:none}}
`

function Count({ alert, badge }: { alert: number; badge: number }) {
  if (alert > 0) return <span className="sb-badge alert" aria-label={`${alert} com atraso`}>{alert > 99 ? '99+' : alert}</span>
  if (badge > 0) return <span className="sb-badge count">{badge > 99 ? '99+' : badge}</span>
  return null
}

export function Sidebar() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({})
  const navRef = useRef<HTMLElement>(null)
  const indRef = useRef<HTMLSpanElement>(null)
  const lastPath = useRef<string | null>(null)
  const { data: meData } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await fetch('/api/me')
      if (!res.ok) return null
      return res.json()
    },
    staleTime: 5 * 60 * 1000,
    gcTime:    10 * 60 * 1000,
  })

  const { data: versionData } = useQuery({
    queryKey: ['version'],
    queryFn: async () => {
      const res = await fetch('/api/version', { cache: 'no-store' })
      if (!res.ok) return null
      return res.json() as Promise<{ buildId: string; version: string }>
    },
    staleTime: 60 * 60 * 1000,
    gcTime:    60 * 60 * 1000,
  })
  const shortVersion = versionData?.version ?? null

  const userProfile = meData ? { name: meData.name, email: meData.email, organization: meData.organizationName } : null
  const orgSettings = meData ? { name: meData.organizationName, logo_url: meData.logoUrl } : null
  const isMaster: boolean = meData?.isMaster === true
  const badges: Record<string, number> = meData?.badges ?? {}
  const alerts: Record<string, number> = meData?.alerts ?? {}
  const plan: string = meData?.plan ?? 'free'
  const isPro = plan === 'pro' || plan === 'enterprise'

  useEffect(() => {
    navigation.forEach(group => {
      group.items.forEach(item => {
        if (item.subitems?.some(sub => pathname === sub.href || pathname.startsWith(sub.href + '/'))) {
          setExpandedMenus(prev => ({ ...prev, [item.name]: true }))
        }
      })
    })
  }, [pathname])

  const totalAlerts = Object.values(alerts).reduce((sum, v) => sum + v, 0)
  const alertItems = [
    { href: '/ordens-servico', label: 'Ordens atrasadas', count: alerts['/ordens-servico'] || 0 },
    { href: '/financeiro/pagar', label: 'Contas a pagar vencidas', count: alerts['/financeiro/pagar'] || 0 },
    { href: '/financeiro/receber', label: 'Contas a receber vencidas', count: alerts['/financeiro/receber'] || 0 },
  ].filter(a => a.count > 0)

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  const initials = userProfile?.name
    ?.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase() || '?'

  // pesponto: corre até o item ativo (ou até o grupo, se o submenu dele estiver fechado)
  const placeIndicator = useCallback((sew: boolean) => {
    const nav = navRef.current, ind = indRef.current
    if (!nav || !ind) return
    const el = nav.querySelector<HTMLElement>('[data-ind="true"]')
    if (!el) { ind.style.opacity = '0'; return }
    const nr = nav.getBoundingClientRect(), er = el.getBoundingClientRect()
    ind.style.transform = `translate(${er.left - nr.left}px, ${er.top - nr.top + nav.scrollTop}px)`
    ind.style.height = `${er.height}px`
    ind.style.opacity = '1'
    if (sew) { ind.classList.remove('sew'); void ind.offsetWidth; ind.classList.add('sew') }
  }, [])

  useLayoutEffect(() => {
    const changed = lastPath.current !== pathname
    lastPath.current = pathname
    placeIndicator(changed)
    // acompanha o submenu abrindo/fechando (280ms)
    let raf = 0
    const t0 = performance.now()
    const follow = () => { placeIndicator(false); if (performance.now() - t0 < 320) raf = requestAnimationFrame(follow) }
    raf = requestAnimationFrame(follow)
    return () => cancelAnimationFrame(raf)
  }, [pathname, expandedMenus, isMobileMenuOpen, placeIndicator])

  useEffect(() => {
    const onResize = () => placeIndicator(false)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [placeIndicator])

  const isOn = (href: string) => pathname === href || (href !== '/dashboard' && pathname.startsWith(href + '/'))

  // função (e não componente) para o menu não ser desmontado a cada render
  // (antes a rolagem do menu voltava ao topo ao abrir um submenu)
  const renderSidebar = () => (
    <aside data-tour="sidebar" className={cn('sb', !isMobileMenuOpen && 'is-closed')} aria-label="Menu do sistema">
      {/* ── Ateliê ── */}
      <div className="sb-head">
        <div className="sb-logo">
          <Image src="/logo-icon.svg" alt="" width={38} height={38} className="h-full w-full object-cover" />
          {orgSettings?.logo_url && (
            <Image src={orgSettings.logo_url} alt="" width={38} height={38}
              className="absolute inset-0 h-full w-full object-contain bg-[#2C1810]" />
          )}
        </div>
        <div className="sb-org">
          <p className="sb-org-name">{orgSettings?.name || 'Meu Atelier'}</p>
          <span className="sb-org-sub">Painel de gestão</span>
        </div>
      </div>

      {/* ── Navegação ── */}
      <nav ref={navRef} className="sb-nav" aria-label="Menu principal" onScroll={() => placeIndicator(false)}>
        <span ref={indRef} className="sb-ind" aria-hidden="true" />
        {navigation.map((group) => (
          <div key={group.section} className="sb-sec">
            <p className="sb-sec-l">{group.section}</p>
            <ul className="sb-list">
              {group.items.map((item) => {
                const isActive    = isOn(item.href) && !item.subitems
                const isSubActive = item.subitems?.some(s => pathname === s.href || pathname.startsWith(s.href + '/')) ?? false
                const highlighted = isActive || isSubActive
                const isExpanded  = expandedMenus[item.name] ?? highlighted
                const badge  = badges[item.href] || 0
                const alert  = alerts[item.href] || 0

                if (!item.subitems) {
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        data-tour={item.tourId}
                        data-ind={isActive ? 'true' : undefined}
                        aria-current={isActive ? 'page' : undefined}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={cn('sb-item', isActive && 'is-on')}
                      >
                        <item.icon className="sb-ic" aria-hidden="true" />
                        <span className="sb-txt">{item.name}</span>
                        <Count alert={alert} badge={badge} />
                      </Link>
                    </li>
                  )
                }

                const subId = `sb-sub-${item.href.slice(1)}`
                return (
                  <li key={item.name}>
                    <button
                      type="button"
                      data-tour={item.tourId}
                      data-ind={isSubActive && !isExpanded ? 'true' : undefined}
                      aria-expanded={isExpanded}
                      aria-controls={subId}
                      onClick={() => setExpandedMenus(prev => ({ ...prev, [item.name]: !isExpanded }))}
                      className={cn('sb-item', highlighted && 'is-on')}
                    >
                      <item.icon className="sb-ic" aria-hidden="true" />
                      <span className="sb-txt">{item.name}</span>
                      <Count alert={alert} badge={badge} />
                      <ChevronRight className="sb-chev" aria-hidden="true" />
                    </button>
                    <div className={cn('sb-subwrap', isExpanded && 'open')} inert={!isExpanded}>
                      <ul id={subId} className="sb-sub">
                        {item.subitems.map((sub) => {
                          const isSubItemActive = pathname === sub.href
                          return (
                            <li key={sub.name}>
                              <Link
                                href={sub.href}
                                data-ind={isSubItemActive && isExpanded ? 'true' : undefined}
                                aria-current={isSubItemActive ? 'page' : undefined}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={cn('sb-item', isSubItemActive && 'is-on')}
                              >
                                <sub.icon className="sb-ic" aria-hidden="true" />
                                <span className="sb-txt">{sub.name}</span>
                                <Count alert={alerts[sub.href] || 0} badge={badges[sub.href] || 0} />
                              </Link>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* ── Rodapé ── */}
      <div className="sb-foot">
        {isMaster && (
          <Link href="/admin" className="sb-link gold" onClick={() => setIsMobileMenuOpen(false)}>
            <Shield aria-hidden="true" />
            Painel Admin
          </Link>
        )}
        <button type="button" className="sb-link" onClick={() => window.dispatchEvent(new Event('start-tour'))}>
          <HelpCircle aria-hidden="true" />
          Ver tour do sistema
        </button>

        {userProfile ? (
          <div className="sb-user">
            <span className="sb-av" aria-hidden="true">{initials}</span>
            <div className="sb-uinfo">
              <span className="sb-uname">{userProfile.name}</span>
              <span className="sb-umail">{userProfile.email}</span>
              {isPro ? (
                <span className="sb-plan pro"><Check className="h-[11px] w-[11px]" strokeWidth={3} aria-hidden="true" />PRO</span>
              ) : (
                <Link
                  href="/configuracoes?tab=assinatura"
                  onClick={() => setIsMobileMenuOpen(false)}
                  title="Fazer upgrade para o plano Pro"
                  className="sb-plan free"
                >
                  FREE · fazer upgrade
                </Link>
              )}
            </div>
            <button type="button" onClick={handleLogout} className="sb-out" aria-label="Sair" title="Sair">
              <LogOut className="h-[17px] w-[17px]" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <div className="sb-skel" />
        )}
        {shortVersion && <p className="sb-ver">v{shortVersion}</p>}
      </div>
    </aside>
  )

  return (
    <>
      <style>{SIDEBAR_CSS}</style>
      {/* Mobile toggle */}
      <div className="lg:hidden fixed top-3.5 left-4 z-50">
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="w-9 h-9 flex items-center justify-center rounded-lg shadow-lg transition-colors bg-[#2C1810] border border-[#D4A85A]/30 text-[#F7F0E6]/80 hover:text-[#F7F0E6]"
          aria-label={isMobileMenuOpen ? 'Fechar menu' : 'Abrir menu'} aria-expanded={isMobileMenuOpen}>
          {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {/* Top-right: Theme + Bell + Profile */}
      <div className="fixed top-3 right-4 z-50 flex items-center gap-2">
        <ThemeToggle />

        {/* Bell */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button suppressHydrationWarning className="relative w-9 h-9 flex items-center justify-center rounded-lg border border-border/70 bg-card hover:bg-accent transition-all shadow-sm" aria-label="Alertas">
              <Bell className="h-4 w-4 text-muted-foreground" />
              {totalAlerts > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center leading-none shadow-sm">
                  {totalAlerts > 99 ? '99+' : totalAlerts}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72 rounded-xl">
            <DropdownMenuLabel className="flex items-center justify-between px-4 py-2">
              <span className="font-semibold">Alertas</span>
              {totalAlerts > 0 && (
                <span className="text-[11px] font-medium text-red-500">{totalAlerts} pendente{totalAlerts !== 1 ? 's' : ''}</span>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {alertItems.length === 0 ? (
              <div className="px-4 py-5 text-center">
                <Bell className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Nenhum alerta no momento</p>
                <p className="text-xs text-muted-foreground/60 mt-0.5">Tudo em dia!</p>
              </div>
            ) : alertItems.map(({ href, label, count }) => (
              <DropdownMenuItem key={href} asChild className="px-4 py-2.5 cursor-pointer">
                <Link href={href} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                    <span className="text-sm truncate">{label}</span>
                  </div>
                  <span className="shrink-0 min-w-[22px] h-5 px-1.5 rounded-full bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 text-[11px] font-bold flex items-center justify-center">
                    {count}
                  </span>
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Profile */}
        {userProfile && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button suppressHydrationWarning data-tour="user-menu"
                className="flex items-center gap-2 h-9 px-2.5 rounded-lg border border-border/70 bg-card hover:bg-accent transition-all shadow-sm">
                <Avatar className="w-6 h-6">
                  <AvatarFallback className="text-[10px] font-bold"
                    style={{ background: 'linear-gradient(135deg,#c8714a,#d4a85a)', color: '#1a0f00' }}>
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:block text-xs font-medium text-foreground pr-0.5">
                  {userProfile.name.split(' ')[0]}
                </span>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60 rounded-xl">
              <div className="px-4 py-3">
                <p className="text-sm font-semibold text-foreground">{userProfile.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{userProfile.email}</p>
                <span className="inline-block mt-2 text-[11px] font-medium px-2 py-0.5 rounded-full text-[#c8714a]"
                  style={{ background: 'rgba(200,113,74,0.12)', border: '1px solid rgba(200,113,74,0.25)' }}>
                  {userProfile.organization}
                </span>
              </div>
              <DropdownMenuSeparator />
              {[
                { href: '/profile',    icon: User,     label: 'Meu Perfil' },
                { href: '/configuracoes', icon: Settings, label: 'Configurações' },
                { href: '/meus-dados', icon: Shield,   label: 'Meus Dados (LGPD)' },
              ].map(({ href, icon: Icon, label }) => (
                <DropdownMenuItem key={href} asChild className="cursor-pointer">
                  <Link href={href} onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    {label}
                  </Link>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}
                className="flex items-center gap-3 px-4 text-red-500 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-950/30 cursor-pointer">
                <LogOut className="h-3.5 w-3.5" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-[2px] z-40"
          onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {renderSidebar()}
    </>
  )
}
