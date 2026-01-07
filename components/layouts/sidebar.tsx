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
  TrendingDown,
  TrendingUp,
  LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { logout } from '@/app/(auth)/actions'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type MenuItem = {
  name: string
  href: string
  icon: LucideIcon
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
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    section: 'Gestão',
    items: [
      { name: 'Clientes', href: '/clientes', icon: Users },
      { name: 'Serviços', href: '/servicos', icon: Scissors },
      { name: 'Ordens de Serviço', href: '/ordens-servico', icon: FileText },
    ],
  },
  {
    section: 'Financeiro',
    items: [
      {
        name: 'Financeiro',
        href: '/financeiro',
        icon: DollarSign,
        subitems: [
          { name: 'Caixa', href: '/financeiro', icon: Wallet },
          { name: 'Contas a Pagar', href: '/financeiro/contas-pagar', icon: TrendingDown },
          { name: 'Contas a Receber', href: '/financeiro/contas-receber', icon: TrendingUp },
        ],
      },
    ],
  },
  {
    section: 'Sistema',
    items: [
      { name: 'Configurações', href: '/configuracoes', icon: Settings },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({})
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false)
  const [userProfile, setUserProfile] = useState<{
    name: string
    email: string
    organization: string
  } | null>(null)
  const [organizationSettings, setOrganizationSettings] = useState<{
    name: string
    logo_url?: string
  } | null>(null)
  const [badges, setBadges] = useState<Record<string, number>>({})
  const supabase = createClient()

  useEffect(() => {
    async function loadUserProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, organization_id')
          .eq('id', user.id)
          .single()

        if (profile?.organization_id) {
          const { data: org } = await supabase
            .from('organizations')
            .select('name, logo_url')
            .eq('id', profile.organization_id)
            .single()

          setUserProfile({
            name: profile.full_name || user.email?.split('@')[0] || 'Usuário',
            email: user.email || '',
            organization: org?.name || 'Minha Organização',
          })

          // Logo e nome vêm da tabela organizations
          setOrganizationSettings({
            name: org?.name || 'CRM Atelier',
            logo_url: org?.logo_url,
          })
        }
      } catch (error) {
        console.error('Erro ao carregar perfil:', error)
      }
    }

    async function loadBadges() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: profile } = await supabase
          .from('profiles')
          .select('organization_id')
          .eq('id', user.id)
          .single()

        if (!profile?.organization_id) return

        // Contar ordens pendentes
        const { count: ordersCount } = await supabase
          .from('org_service_orders')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', profile.organization_id)
          .in('status', ['pending', 'in_progress'])

        // Contar clientes com aniversário este mês
        const today = new Date()
        const currentMonth = today.getMonth() + 1
        const { data: clients } = await supabase
          .from('org_clients')
          .select('birth_date')
          .eq('organization_id', profile.organization_id)
          .not('birth_date', 'is', null)

        const birthdayCount = clients?.filter(client => {
          if (!client.birth_date) return false
          const birthMonth = new Date(client.birth_date).getMonth() + 1
          return birthMonth === currentMonth
        }).length || 0

        setBadges({
          '/ordens-servico': ordersCount || 0,
          '/clientes': birthdayCount,
        })
      } catch (error) {
        console.error('Erro ao carregar badges:', error)
      }
    }

    loadUserProfile()
    loadBadges()
  }, [supabase])

  const handleLogout = async () => {
    await logout()
  }

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* User Profile Button - Top Right */}
      {userProfile && (
        <div className="fixed top-4 right-4 z-60">
          <div className="relative">
            <button
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-lg hover:bg-accent transition-colors shadow-sm"
            >
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm">
                {userProfile.name.charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-foreground leading-none">
                  {userProfile.name}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {userProfile.organization}
                </p>
              </div>
              <ChevronDown className={cn(
                'h-4 w-4 text-gray-400 transition-transform',
                isProfileDropdownOpen && 'rotate-180'
              )} />
            </button>

            {/* Dropdown Menu */}
            {isProfileDropdownOpen && (
              <div className="absolute top-full right-0 mt-2 w-56 bg-card border border-border rounded-lg shadow-lg py-1 z-70">
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-sm font-medium text-foreground">{userProfile.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{userProfile.email}</p>
                </div>
                <Link
                  href="/profile"
                  onClick={() => {
                    setIsProfileDropdownOpen(false)
                    setIsMobileMenuOpen(false)
                  }}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                >
                  <User className="h-4 w-4" />
                  Meu Perfil
                </Link>
                <Link
                  href="/configuracoes"
                  onClick={() => {
                    setIsProfileDropdownOpen(false)
                    setIsMobileMenuOpen(false)
                  }}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  Configurações
                </Link>
                <div className="h-px bg-border my-1" />
                <button
                  onClick={() => {
                    setIsProfileDropdownOpen(false)
                    handleLogout()
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sair
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-40 h-screen w-64 bg-card border-r border-border transition-transform duration-300',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo e Nome */}
          <div className="flex items-center gap-3 h-16 border-b border-border px-4">
            {organizationSettings?.logo_url ? (
              <Image 
                src={organizationSettings.logo_url} 
                alt="Logo da Empresa" 
                width={40}
                height={40}
                className="h-10 w-10 object-contain rounded-md shrink-0"
              />
            ) : (
              <div className="h-10 w-10 rounded-md bg-blue-600 flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-lg">
                  {organizationSettings?.name?.charAt(0) || 'C'}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-bold text-foreground truncate leading-tight">
                {organizationSettings?.name || 'CRM Atelier'}
              </h1>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            {navigation.map((group, groupIndex) => (
              <div key={group.section}>
                {/* Section Label */}
                <div className={cn('px-3 py-2', groupIndex > 0 && 'pt-4')}>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {group.section}
                  </p>
                </div>

                {/* Menu Items */}
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const isActive = pathname === item.href
                    const isSubItemActive = item.subitems?.some(sub => pathname === sub.href)
                    const isExpanded = expandedMenus[item.name]
                    const badgeCount = badges[item.href]
                    const showBadge = badgeCount && badgeCount > 0
                    
                    return (
                      <div key={item.name}>
                        {/* Main Menu Item */}
                        {item.subitems ? (
                          <button
                            onClick={() => setExpandedMenus(prev => ({
                              ...prev,
                              [item.name]: !prev[item.name]
                            }))}
                            className={cn(
                              'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                              isActive || isSubItemActive
                                ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400'
                                : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                            )}
                          >
                            <item.icon className="h-5 w-5" />
                            <span className="flex-1 text-left">{item.name}</span>
                            {showBadge && (
                              <span className={cn(
                                'inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold rounded-full',
                                isActive || isSubItemActive
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-blue-100 text-blue-600'
                              )}>
                                {badgeCount > 99 ? '99+' : badgeCount}
                              </span>
                            )}
                            <ChevronRight className={cn(
                              'h-4 w-4 transition-transform',
                              isExpanded && 'rotate-90'
                            )} />
                          </button>
                        ) : (
                          <Link
                            href={item.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={cn(
                              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                              isActive
                                ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400'
                                : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                            )}
                          >
                            <item.icon className="h-5 w-5" />
                            <span className="flex-1">{item.name}</span>
                            {showBadge && (
                              <span className={cn(
                                'inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold rounded-full',
                                isActive
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-blue-100 text-blue-600'
                              )}>
                                {badgeCount > 99 ? '99+' : badgeCount}
                              </span>
                            )}
                          </Link>
                        )}

                        {/* Submenu Items */}
                        {item.subitems && isExpanded && (
                          <div className="ml-4 mt-1 space-y-1">
                            {item.subitems.map((subitem) => {
                              const isSubActive = pathname === subitem.href
                              return (
                                <Link
                                  key={subitem.name}
                                  href={subitem.href}
                                  onClick={() => setIsMobileMenuOpen(false)}
                                  className={cn(
                                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                                    isSubActive
                                      ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400'
                                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                                  )}
                                >
                                  <subitem.icon className="h-4 w-4" />
                                  {subitem.name}
                                </Link>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Separator */}
                {groupIndex < navigation.length - 1 && (
                  <div className="h-px bg-border my-3" />
                )}
              </div>
            ))}
          </nav>
        </div>
      </aside>
    </>
  )
}
