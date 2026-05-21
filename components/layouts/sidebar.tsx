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
  LucideIcon,
} from 'lucide-react'
import { logout } from '@/app/(auth)/actions'
import { useState, useEffect } from 'react'
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
    section: 'Financeiro',
    items: [
      {
        name: 'Financeiro',
        href: '/financeiro',
        icon: DollarSign,
        tourId: 'nav-financeiro',
        subitems: [
          { name: 'Caixa', href: '/financeiro', icon: Wallet },
          { name: 'Contas a Pagar', href: '/financeiro/pagar', icon: TrendingDown },
          { name: 'Contas a Receber', href: '/financeiro/receber', icon: TrendingUp },
        ],
      },
    ],
  },
  {
    section: 'Estoque',
    items: [
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

// Sidebar sempre com fundo escuro (consistente entre dark e light mode)
// No light mode o sidebar mantém o fundo #0f0f0f — padrão premium de SaaS
const theme = {
  sidebar:      'bg-[#0f0f0f] border-r border-white/[0.06]',
  header:       'border-b border-white/[0.06]',
  sectionLabel: 'text-[#3a3a3a]',
  itemInactive: 'text-[#888] hover:text-[#d0d0d0] hover:bg-white/[0.05]',
  itemActive:   'text-[#c8714a] bg-[#c8714a]/[0.12]',
  iconInactive: 'text-[#505050] group-hover:text-[#888]',
  iconActive:   'text-[#c8714a]',
  subBorder:    'border-white/[0.07]',
  footerBorder: 'border-white/[0.07]',
  orgName:      'text-[#f0e6d0]',
  orgSub:       'text-[#3a3a3a]',
  userName:     'text-[#d0d0d0]',
  userEmail:    'text-[#404040]',
  mobileToggle: 'bg-[#0f0f0f] border border-white/10 text-[#888] hover:text-white',
}

export function Sidebar() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({})

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

  const userProfile = meData ? { name: meData.name, email: meData.email, organization: meData.organizationName } : null
  const orgSettings = meData ? { name: meData.organizationName, logo_url: meData.logoUrl } : null
  const isMaster: boolean = meData?.isMaster === true
  const badges: Record<string, number> = meData?.badges ?? {}
  const alerts: Record<string, number> = meData?.alerts ?? {}

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

  const handleLogout = async () => { await logout() }

  const initials = userProfile?.name
    ?.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase() || '?'

  const SidebarContent = () => (
    <aside
      data-tour="sidebar"
      className={cn(
        'fixed top-0 left-0 z-40 h-screen w-64 flex flex-col',
        'transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
        theme.sidebar,
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}
    >
      {/* ── Header ── */}
      <div className={cn('flex items-center gap-3 h-[62px] px-4 shrink-0', theme.header)}>
        {orgSettings?.logo_url ? (
          <Image src={orgSettings.logo_url} alt="Logo" width={36} height={36}
            className="h-9 w-9 object-contain rounded-xl shrink-0" />
        ) : (
          <div className="h-9 w-9 rounded-xl shrink-0 flex items-center justify-center font-bold text-sm shadow-lg"
            style={{ background: 'linear-gradient(135deg, #c8714a, #d4a85a)', color: '#1a0f00' }}>
            <Scissors className="h-4 w-4" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h1 className={cn('text-[14px] font-bold truncate leading-tight', theme.orgName)}
            style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic' }}>
            {orgSettings?.name || 'Meu Atelier'}
          </h1>
          <p className={cn('text-[10px] mt-[1px] tracking-wide', theme.orgSub)}>Painel de Gestão</p>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-5">
        {navigation.map((group) => (
          <div key={group.section}>
            {/* Label de seção */}
            <p className={cn('px-2.5 mb-1.5 text-[9px] font-semibold uppercase tracking-[0.12em]', theme.sectionLabel)}>
              {group.section}
            </p>

            <div className="space-y-[1px]">
              {group.items.map((item) => {
                const isActive    = pathname === item.href
                const isSubActive = item.subitems?.some(s => pathname === s.href || pathname.startsWith(s.href + '/'))
                const highlighted = isActive || isSubActive
                const isExpanded  = expandedMenus[item.name] ?? highlighted
                const badge  = badges[item.href] || 0
                const alert  = alerts[item.href] || 0

                const sharedItemClass = cn(
                  'w-full flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[13px] font-medium',
                  'transition-all duration-150 group relative',
                  highlighted ? theme.itemActive : theme.itemInactive
                )

                return (
                  <div key={item.name}>
                    {item.subitems ? (
                      <button
                        data-tour={item.tourId}
                        onClick={() => setExpandedMenus(prev => ({ ...prev, [item.name]: !prev[item.name] }))}
                        className={sharedItemClass}
                      >
                        {/* Pill indicador ativo */}
                        {highlighted && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[18px] rounded-r-full bg-[#c8714a]" />
                        )}
                        <item.icon className={cn('h-4 w-4 shrink-0', highlighted ? theme.iconActive : theme.iconInactive)} />
                        <span className="flex-1 text-left">{item.name}</span>
                        {alert > 0 && (
                          <span className="text-[10px] font-bold px-1.5 py-px rounded-full bg-red-500/20 text-red-400">
                            {alert > 99 ? '99+' : alert}
                          </span>
                        )}
                        {badge > 0 && alert === 0 && (
                          <span className="text-[10px] font-bold px-1.5 py-px rounded-full text-[#c8714a]"
                            style={{ background: 'rgba(200,113,74,0.18)' }}>
                            {badge > 99 ? '99+' : badge}
                          </span>
                        )}
                        <ChevronRight className={cn(
                          'h-3.5 w-3.5 text-[#333] transition-transform duration-200',
                          isExpanded && 'rotate-90'
                        )} />
                      </button>
                    ) : (
                      <Link
                        href={item.href}
                        data-tour={item.tourId}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={sharedItemClass}
                      >
                        {isActive && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[18px] rounded-r-full bg-[#c8714a]" />
                        )}
                        <item.icon className={cn('h-4 w-4 shrink-0', highlighted ? theme.iconActive : theme.iconInactive)} />
                        <span className="flex-1">{item.name}</span>
                        {alert > 0 && (
                          <span className="text-[10px] font-bold px-1.5 py-px rounded-full bg-red-500/20 text-red-400">
                            {alert > 99 ? '99+' : alert}
                          </span>
                        )}
                        {badge > 0 && alert === 0 && (
                          <span className="text-[10px] font-bold px-1.5 py-px rounded-full text-[#c8714a]"
                            style={{ background: isActive ? 'rgba(200,113,74,0.18)' : 'rgba(255,255,255,0.06)' }}>
                            {badge > 99 ? '99+' : badge}
                          </span>
                        )}
                      </Link>
                    )}

                    {/* Submenu expandido */}
                    {item.subitems && isExpanded && (
                      <div className={cn('mt-1 ml-4 pl-3 border-l space-y-[1px]', theme.subBorder)}>
                        {item.subitems.map((sub) => {
                          const isSubItemActive = pathname === sub.href
                          const subAlert  = alerts[sub.href] || 0
                          const subBadge  = badges[sub.href] || 0
                          return (
                            <Link
                              key={sub.name}
                              href={sub.href}
                              onClick={() => setIsMobileMenuOpen(false)}
                              className={cn(
                                'flex items-center gap-2 px-2.5 py-[6px] rounded-md text-[12px] font-medium',
                                'transition-all duration-150 group relative',
                                isSubItemActive
                                  ? 'text-[#c8714a] bg-[#c8714a]/[0.10]'
                                  : 'text-[#666] hover:text-[#bbb] hover:bg-white/[0.04]'
                              )}
                            >
                              {isSubItemActive && (
                                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[14px] rounded-r-full bg-[#c8714a]" />
                              )}
                              <sub.icon className={cn('h-3.5 w-3.5 shrink-0',
                                isSubItemActive ? 'text-[#c8714a]' : 'text-[#444] group-hover:text-[#777]'
                              )} />
                              <span className="flex-1">{sub.name}</span>
                              {subAlert > 0 && (
                                <span className="text-[10px] font-bold px-1.5 py-px rounded-full bg-red-500/20 text-red-400">
                                  {subAlert > 99 ? '99+' : subAlert}
                                </span>
                              )}
                              {subBadge > 0 && subAlert === 0 && (
                                <span className="text-[10px] font-bold px-1.5 py-px rounded-full text-[#c8714a]"
                                  style={{ background: 'rgba(200,113,74,0.18)' }}>
                                  {subBadge > 99 ? '99+' : subBadge}
                                </span>
                              )}
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Footer ── */}
      <div className={cn('shrink-0 border-t', theme.footerBorder)}>
        {/* Admin + Tour */}
        <div className="px-2.5 pt-2 pb-1 flex flex-col gap-[1px]">
          {isMaster && (
            <Link href="/admin"
              className="flex items-center gap-2 px-2.5 py-[7px] rounded-lg text-[12px] font-medium text-[#d4a85a] hover:text-[#e8c46a] hover:bg-[#d4a85a]/[0.08] transition-colors">
              <Shield className="h-3.5 w-3.5 shrink-0" />
              Painel Admin
            </Link>
          )}
          <button
            onClick={() => window.dispatchEvent(new Event('start-tour'))}
            className="flex items-center gap-2 px-2.5 py-[7px] rounded-lg text-[12px] font-medium text-[#444] hover:text-[#888] hover:bg-white/[0.04] transition-colors w-full text-left"
          >
            <HelpCircle className="h-3.5 w-3.5 shrink-0" />
            Ver tour do sistema
          </button>
        </div>

        {/* User card */}
        <div className={cn('px-2.5 pb-3 pt-1 border-t', theme.footerBorder)}>
          {userProfile ? (
            <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-white/[0.04] transition-colors group cursor-default">
              <Avatar className="w-8 h-8 shrink-0">
                <AvatarFallback className="text-xs font-bold"
                  style={{ background: 'linear-gradient(135deg,#c8714a,#d4a85a)', color: '#1a0f00' }}>
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className={cn('text-[12px] font-semibold truncate leading-tight', theme.userName)}>
                  {userProfile.name}
                </p>
                <p className={cn('text-[10px] truncate mt-[1px]', theme.userEmail)}>
                  {userProfile.email}
                </p>
              </div>
              <button onClick={handleLogout} title="Sair"
                className="p-1.5 rounded-md text-[#333] hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100">
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="h-12 rounded-xl bg-white/[0.04] animate-pulse mx-2" />
          )}
        </div>
      </div>
    </aside>
  )

  return (
    <>
      {/* Mobile toggle */}
      <div className="lg:hidden fixed top-3.5 left-4 z-50">
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className={cn('w-9 h-9 flex items-center justify-center rounded-lg shadow-lg transition-colors', theme.mobileToggle)}
          aria-label="Abrir menu">
          {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {/* Top-right: Theme + Bell + Profile */}
      <div className="fixed top-3 right-4 z-50 flex items-center gap-2">
        <ThemeToggle />

        {/* Bell */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="relative w-9 h-9 flex items-center justify-center rounded-lg border border-border/70 bg-card hover:bg-accent transition-all shadow-sm" aria-label="Alertas">
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
              <button data-tour="user-menu"
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

      <SidebarContent />
    </>
  )
}
