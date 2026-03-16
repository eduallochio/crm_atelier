'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
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
  const [isProfileOpen, setIsProfileOpen] = useState(false)
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
  const [isBellOpen, setIsBellOpen] = useState(false)

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
          className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#0d1117] text-slate-400 hover:text-slate-100 border border-white/10 shadow-lg transition-colors"
          aria-label="Abrir menu"
        >
          {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {/* ─── Top-right: Theme + Bell + Profile ─── */}
      <div className="fixed top-3 right-4 z-50 flex items-center gap-2">
        <ThemeToggle />

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setIsBellOpen(!isBellOpen)}
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

          {isBellOpen && (
            <>
              <div className="fixed inset-0 z-[55]" onClick={() => setIsBellOpen(false)} />
              <div className="absolute top-full right-0 mt-1.5 w-72 bg-popover border border-border rounded-xl shadow-2xl py-2 z-[60] overflow-hidden">
                <div className="px-4 py-2 border-b border-border/60 flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">Alertas</p>
                  {totalAlerts > 0 && (
                    <span className="text-[11px] font-medium text-red-500">{totalAlerts} pendente{totalAlerts !== 1 ? 's' : ''}</span>
                  )}
                </div>
                {alertItems.length === 0 ? (
                  <div className="px-4 py-5 text-center">
                    <Bell className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Nenhum alerta no momento</p>
                    <p className="text-xs text-muted-foreground/60 mt-0.5">Tudo em dia!</p>
                  </div>
                ) : (
                  <div className="py-1">
                    {alertItems.map(({ href, label, count }) => (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setIsBellOpen(false)}
                        className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-accent transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                          <span className="text-sm text-foreground truncate">{label}</span>
                        </div>
                        <span className="shrink-0 min-w-[22px] h-5 px-1.5 rounded-full bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 text-[11px] font-bold flex items-center justify-center">
                          {count}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {userProfile && (
          <div className="relative">
            <button
              data-tour="user-menu"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 h-9 px-2.5 rounded-lg border border-border/70 bg-card hover:bg-accent transition-all shadow-sm"
            >
              <div className="w-6 h-6 rounded-full bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 font-bold text-[10px]">
                {initials}
              </div>
              <span className="hidden sm:block text-xs font-medium text-foreground pr-0.5">
                {userProfile.name.split(' ')[0]}
              </span>
              <ChevronDown className={cn(
                'h-3 w-3 text-muted-foreground transition-transform duration-200',
                isProfileOpen && 'rotate-180'
              )} />
            </button>

            {isProfileOpen && (
              <>
                <div className="fixed inset-0 z-[55]" onClick={() => setIsProfileOpen(false)} />
                <div className="absolute top-full right-0 mt-1.5 w-60 bg-popover border border-border rounded-xl shadow-2xl py-1 z-[60] overflow-hidden">
                  <div className="px-4 py-3 border-b border-border/60">
                    <p className="text-sm font-semibold text-foreground">{userProfile.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{userProfile.email}</p>
                    <span className="inline-block mt-2 text-[11px] font-medium bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-800/50">
                      {userProfile.organization}
                    </span>
                  </div>
                  <div className="py-1">
                    {[
                      { href: '/profile', icon: User, label: 'Meu Perfil' },
                      { href: '/configuracoes', icon: Settings, label: 'Configurações' },
                      { href: '/meus-dados', icon: Shield, label: 'Meus Dados (LGPD)' },
                    ].map(({ href, icon: Icon, label }) => (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => { setIsProfileOpen(false); setIsMobileMenuOpen(false) }}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                      >
                        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                        {label}
                      </Link>
                    ))}
                    <div className="h-px bg-border/60 my-1" />
                    <button
                      onClick={() => { setIsProfileOpen(false); handleLogout() }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Sair
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
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
        style={{ background: 'linear-gradient(180deg, #0d1117 0%, #0a0e16 100%)' }}
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
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              {orgSettings?.name?.charAt(0)?.toUpperCase() || 'C'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-semibold text-white truncate leading-tight">
              {orgSettings?.name || 'Meu Atelier'}
            </h1>
            <p className="text-[11px] text-slate-600 mt-[1px]">Painel de Gestão</p>
          </div>
        </div>

        {/* ── Navigation ── */}
        <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-4">
          {navigation.map((group) => (
            <div key={group.section}>
              <p className="px-2.5 mb-1 text-[10px] font-semibold text-slate-600 uppercase tracking-[0.1em]">
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
                              : 'text-slate-400 hover:bg-white/[0.05] hover:text-slate-100'
                          )}
                        >
                          {highlighted && (
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-indigo-400" />
                          )}
                          <item.icon className={cn(
                            'h-4 w-4 shrink-0 transition-colors',
                            highlighted ? 'text-indigo-400' : 'text-slate-600 group-hover:text-slate-400'
                          )} />
                          <span className="flex-1 text-left">{item.name}</span>
                          {alert > 0 && (
                            <span className="text-[10px] font-bold px-1.5 py-px rounded-full bg-red-500/20 text-red-400">
                              {alert > 99 ? '99+' : alert}
                            </span>
                          )}
                          {badge > 0 && alert === 0 && (
                            <span className="text-[10px] font-bold px-1.5 py-px rounded-full bg-indigo-500/20 text-indigo-400">
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
                              : 'text-slate-400 hover:bg-white/[0.05] hover:text-slate-100'
                          )}
                        >
                          {isActive && (
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-indigo-400" />
                          )}
                          <item.icon className={cn(
                            'h-4 w-4 shrink-0 transition-colors',
                            isActive ? 'text-indigo-400' : 'text-slate-600 group-hover:text-slate-400'
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
                                ? 'bg-indigo-500/20 text-indigo-400'
                                : 'bg-white/[0.07] text-slate-400'
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
                                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-indigo-400" />
                                )}
                                <sub.icon className={cn(
                                  'h-3.5 w-3.5 shrink-0 transition-colors',
                                  isSubItemActive ? 'text-indigo-400' : 'text-slate-700 group-hover:text-slate-400'
                                )} />
                                <span className="flex-1">{sub.name}</span>
                                {subAlert > 0 && (
                                  <span className="text-[10px] font-bold px-1.5 py-px rounded-full bg-red-500/20 text-red-400">
                                    {subAlert > 99 ? '99+' : subAlert}
                                  </span>
                                )}
                                {subBadge > 0 && subAlert === 0 && (
                                  <span className="text-[10px] font-bold px-1.5 py-px rounded-full bg-indigo-500/20 text-indigo-400">
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
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[12px] font-medium text-slate-600 hover:text-slate-400 hover:bg-white/[0.04] transition-colors"
          >
            <HelpCircle className="h-3.5 w-3.5 shrink-0" />
            Ver tour do sistema
          </button>
        </div>

        {/* ── Bottom: User card ── */}
        <div className="shrink-0 border-t border-white/[0.07] p-2.5">
          {userProfile ? (
            <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-white/[0.05] transition-colors group">
              <div className="w-8 h-8 rounded-full border border-indigo-400/30 flex items-center justify-center text-indigo-300 font-bold text-xs shrink-0"
                style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(139,92,246,0.25))' }}>
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-slate-200 truncate leading-tight">{userProfile.name}</p>
                <p className="text-[10px] text-slate-600 truncate mt-[1px]">{userProfile.email}</p>
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
