'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
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
  BarChart3,
  BookOpen,
  Bell,
  LucideIcon,
} from 'lucide-react'
import { logout } from '@/app/(auth)/actions'
import { useState, useEffect } from 'react'
import { ThemeToggle } from './theme-toggle'

type MenuItem = {
  name: string
  href: string
  icon: LucideIcon
  tourId?: string
  subitems?: {
    name: string
    href: string
    icon: LucideIcon
  }[]
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

export function Sidebar() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({})
  const [userProfile, setUserProfile] = useState<{
    name: string
    email: string
    organization: string
  } | null>(null)
  const [orgSettings, setOrgSettings] = useState<{
    name: string
    logo_url?: string
  } | null>(null)
  const [badges, setBadges] = useState<Record<string, number>>({})
  const [alerts, setAlerts] = useState<Record<string, number>>({})

  // Auto-expand submenu for active sub-routes
  useEffect(() => {
    navigation.forEach(group => {
      group.items.forEach(item => {
        if (item.subitems?.some(sub => pathname === sub.href || pathname.startsWith(sub.href + '/'))) {
          setExpandedMenus(prev => ({ ...prev, [item.name]: true }))
        }
      })
    })
  }, [pathname])

  useEffect(() => {
    async function loadMe() {
      try {
        const res = await fetch('/api/me')
        if (!res.ok) return
        const data = await res.json()
        setUserProfile({ name: data.name, email: data.email, organization: data.organizationName })
        setOrgSettings({ name: data.organizationName, logo_url: data.logoUrl })
        setBadges(data.badges || {})
        setAlerts(data.alerts || {})
      } catch (e) {
        console.error('[Sidebar]', e)
      }
    }
    loadMe()
  }, [])

  const totalAlerts = Object.values(alerts).reduce((sum, v) => sum + v, 0)
  const alertItems = [
    { href: '/ordens-servico', label: 'Ordens atrasadas', count: alerts['/ordens-servico'] || 0 },
    { href: '/financeiro/pagar', label: 'Contas a pagar vencidas', count: alerts['/financeiro/pagar'] || 0 },
    { href: '/financeiro/receber', label: 'Contas a receber vencidas', count: alerts['/financeiro/receber'] || 0 },
  ].filter(a => a.count > 0)

  const handleLogout = async () => {
    await logout()
  }

  const initials = userProfile?.name
    ?.split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase() || '?'

  return (
    <>
      {/* ─── Mobile Toggle ─── */}
      <div className="lg:hidden fixed top-3.5 left-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#18181b] text-zinc-400 hover:text-zinc-100 border border-white/10 shadow-lg transition-colors"
          aria-label="Abrir menu"
        >
          {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {/* ─── Top-right: Theme + Bell + Profile ─── */}
      <div className="fixed top-3 right-4 z-50 flex items-center gap-2">
        <ThemeToggle />

        {/* Notification Bell */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="relative w-9 h-9 flex items-center justify-center rounded-lg border border-border/70 bg-card hover:bg-accent transition-all shadow-sm"
              aria-label="Alertas"
            >
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
            ) : (
              alertItems.map(({ href, label, count }) => (
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
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {userProfile && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                data-tour="user-menu"
                className="flex items-center gap-2 h-9 px-2.5 rounded-lg border border-border/70 bg-card hover:bg-accent transition-all shadow-sm"
              >
                <Avatar className="w-6 h-6">
                  <AvatarFallback className="text-[10px] font-bold text-[#c8714a]" style={{ background:'rgba(200,113,74,0.18)', border:'1px solid rgba(200,113,74,0.3)' }}>
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
                <span className="inline-block mt-2 text-[11px] font-medium px-2 py-0.5 rounded-full text-[#c8714a]" style={{ background:'rgba(200,113,74,0.12)', border:'1px solid rgba(200,113,74,0.25)' }}>
                  {userProfile.organization}
                </span>
              </div>
              <DropdownMenuSeparator />
              {[
                { href: '/profile', icon: User, label: 'Meu Perfil' },
                { href: '/configuracoes', icon: Settings, label: 'Configurações' },
                { href: '/meus-dados', icon: Shield, label: 'Meus Dados (LGPD)' },
              ].map(({ href, icon: Icon, label }) => (
                <DropdownMenuItem key={href} asChild className="cursor-pointer">
                  <Link href={href} onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    {label}
                  </Link>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 text-red-500 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-950/30 cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* ─── Overlay (mobile) ─── */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-[2px] z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* ─── Sidebar ─── */}
      <aside
        data-tour="sidebar"
        style={{ background: '#18181b' }}
        className={cn(
          'fixed top-0 left-0 z-40 h-screen w-64',
          'border-r border-white/[0.07]',
          'flex flex-col',
          'transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >

        {/* ── Header / Logo ── */}
        <div className="flex items-center gap-3 h-[58px] px-4 border-b border-white/[0.07] shrink-0">
          {orgSettings?.logo_url ? (
            <Image
              src={orgSettings.logo_url}
              alt="Logo"
              width={34}
              height={34}
              className="h-[34px] w-[34px] object-contain rounded-lg shrink-0"
            />
          ) : (
            <div className="h-[34px] w-[34px] rounded-lg shrink-0 flex items-center justify-center text-white font-bold text-sm shadow-lg"
              style={{ background: 'linear-gradient(135deg, #c8714a, #d4a85a)' }}>
              {orgSettings?.name?.charAt(0)?.toUpperCase() || 'C'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-semibold text-white truncate leading-tight">
              {orgSettings?.name || 'Meu Atelier'}
            </h1>
            <p className="text-[11px] text-zinc-600 mt-[1px]">Painel de Gestão</p>
          </div>
        </div>

        {/* ── Navigation ── */}
        <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-4">
          {navigation.map((group) => (
            <div key={group.section}>
              <p className="px-2.5 mb-1 text-[10px] font-semibold text-zinc-600 uppercase tracking-[0.1em]">
                {group.section}
              </p>

              <div className="space-y-[2px]">
                {group.items.map((item) => {
                  const isActive = pathname === item.href
                  const isSubActive = item.subitems?.some(s => pathname === s.href)
                  const highlighted = isActive || isSubActive
                  const isExpanded = expandedMenus[item.name] ?? highlighted
                  const badge = badges[item.href] || 0
                  const alert = alerts[item.href] || 0

                  return (
                    <div key={item.name}>
                      {item.subitems ? (
                        <button
                          data-tour={item.tourId}
                          onClick={() => setExpandedMenus(prev => ({ ...prev, [item.name]: !prev[item.name] }))}
                          className={cn(
                            'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium',
                            'transition-all duration-150 group relative',
                            highlighted
                              ? 'bg-white/[0.08] text-white'
                              : 'text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-100'
                          )}
                        >
                          {highlighted && (
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-[#c8714a]" />
                          )}
                          <item.icon className={cn(
                            'h-4 w-4 shrink-0 transition-colors',
                            highlighted ? 'text-[#c8714a]' : 'text-zinc-600 group-hover:text-zinc-400'
                          )} />
                          <span className="flex-1 text-left">{item.name}</span>
                          {alert > 0 && (
                            <span className="text-[10px] font-bold px-1.5 py-px rounded-full bg-red-500/20 text-red-400">
                              {alert > 99 ? '99+' : alert}
                            </span>
                          )}
                          {badge > 0 && alert === 0 && (
                            <span className="text-[10px] font-bold px-1.5 py-px rounded-full text-[#c8714a]" style={{ background:'rgba(200,113,74,0.18)' }}>
                              {badge > 99 ? '99+' : badge}
                            </span>
                          )}
                          <ChevronRight className={cn(
                            'h-3.5 w-3.5 text-slate-700 transition-transform duration-200',
                            isExpanded && 'rotate-90'
                          )} />
                        </button>
                      ) : (
                        <Link
                          href={item.href}
                          data-tour={item.tourId}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={cn(
                            'flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium',
                            'transition-all duration-150 group relative',
                            isActive
                              ? 'bg-white/[0.08] text-white'
                              : 'text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-100'
                          )}
                        >
                          {isActive && (
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-[#c8714a]" />
                          )}
                          <item.icon className={cn(
                            'h-4 w-4 shrink-0 transition-colors',
                            isActive ? 'text-[#c8714a]' : 'text-zinc-600 group-hover:text-zinc-400'
                          )} />
                          <span className="flex-1">{item.name}</span>
                          {alert > 0 && (
                            <span className="text-[10px] font-bold px-1.5 py-px rounded-full bg-red-500/20 text-red-400">
                              {alert > 99 ? '99+' : alert}
                            </span>
                          )}
                          {badge > 0 && alert === 0 && (
                            <span className={cn(
                              'text-[10px] font-bold px-1.5 py-px rounded-full',
                              isActive
                                ? 'text-[#c8714a]'
                                : 'bg-white/[0.07] text-zinc-400'
                            )}>
                              {badge > 99 ? '99+' : badge}
                            </span>
                          )}
                        </Link>
                      )}

                      {/* Submenu */}
                      {item.subitems && isExpanded && (
                        <div className="mt-[2px] ml-4 pl-3 border-l border-white/[0.07] space-y-[2px]">
                          {item.subitems.map((sub) => {
                            const isSubItemActive = pathname === sub.href
                            const subAlert = alerts[sub.href] || 0
                            const subBadge = badges[sub.href] || 0
                            return (
                              <Link
                                key={sub.name}
                                href={sub.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={cn(
                                  'flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium',
                                  'transition-all duration-150 group relative',
                                  isSubItemActive
                                    ? 'bg-white/[0.08] text-white'
                                    : 'text-slate-500 hover:bg-white/[0.05] hover:text-slate-300'
                                )}
                              >
                                {isSubItemActive && (
                                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-[#c8714a]" />
                                )}
                                <sub.icon className={cn(
                                  'h-3.5 w-3.5 shrink-0 transition-colors',
                                  isSubItemActive ? 'text-[#c8714a]' : 'text-zinc-700 group-hover:text-zinc-400'
                                )} />
                                <span className="flex-1">{sub.name}</span>
                                {subAlert > 0 && (
                                  <span className="text-[10px] font-bold px-1.5 py-px rounded-full bg-red-500/20 text-red-400">
                                    {subAlert > 99 ? '99+' : subAlert}
                                  </span>
                                )}
                                {subBadge > 0 && subAlert === 0 && (
                                  <span className="text-[10px] font-bold px-1.5 py-px rounded-full text-[#c8714a]" style={{ background:'rgba(200,113,74,0.18)' }}>
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

        {/* ── Tour button ── */}
        <div className="px-2.5 pb-1">
          <button
            onClick={() => window.dispatchEvent(new Event('start-tour'))}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[12px] font-medium text-zinc-600 hover:text-zinc-400 hover:bg-white/[0.04] transition-colors"
          >
            <HelpCircle className="h-3.5 w-3.5 shrink-0" />
            Ver tour do sistema
          </button>
        </div>

        {/* ── Bottom: User card ── */}
        <div className="shrink-0 border-t border-white/[0.07] p-2.5">
          {userProfile ? (
            <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-white/[0.05] transition-colors group">
              <Avatar className="w-8 h-8 shrink-0">
                <AvatarFallback className="text-xs font-bold text-[#c8714a]" style={{ background:'rgba(200,113,74,0.18)', border:'1px solid rgba(200,113,74,0.3)' }}>
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-zinc-200 truncate leading-tight">{userProfile.name}</p>
                <p className="text-[10px] text-zinc-600 truncate mt-[1px]">{userProfile.email}</p>
              </div>
              <button
                onClick={handleLogout}
                title="Sair"
                className="p-1.5 rounded-md text-slate-700 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="h-12 rounded-lg bg-white/[0.04] animate-pulse" />
          )}
        </div>
      </aside>
    </>
  )
}
