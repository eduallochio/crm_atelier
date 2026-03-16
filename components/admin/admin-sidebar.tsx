'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  Users,
  LogOut,
  ChevronRight,
  Menu,
  X,
  Settings,
  FileText,
  TrendingUp,
  Globe,
  Flag,
  Activity,
  UserCog,
  Tag,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const menuGroups = [
  {
    label: 'Visão Geral',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, href: '/admin/dashboard' },
      { label: 'Análises', icon: TrendingUp, href: '/admin/analytics' },
      { label: 'Logs', icon: FileText, href: '/admin/logs' },
      { label: 'Saúde do Sistema', icon: Activity, href: '/admin/health' },
    ],
  },
  {
    label: 'Gestão',
    items: [
      { label: 'Organizações', icon: Building2, href: '/admin/organizations' },
      { label: 'Usuários', icon: Users, href: '/admin/users' },
      { label: 'Planos', icon: CreditCard, href: '/admin/plans' },
      { label: 'Assinaturas', icon: UserCog, href: '/admin/subscriptions' },
      { label: 'Cupons', icon: Tag, href: '/admin/coupons' },
    ],
  },
  {
    label: 'Produto',
    items: [
      { label: 'Landing Page', icon: Globe, href: '/admin/landing' },
      { label: 'Funcionalidades', icon: Flag, href: '/admin/feature-flags' },
      { label: 'Configurações', icon: Settings, href: '/admin/settings' },
    ],
  },
]

// Flatten for mobile use
const menuItems = menuGroups.flatMap((g) => g.items)

export function AdminSidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(true)

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X /> : <Menu />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={`${
          isOpen ? 'w-64' : 'w-0'
        } hidden lg:block lg:w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300`}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <LayoutDashboard className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-gray-900 dark:text-white">Admin Panel</h1>
                <p className="text-xs text-gray-600 dark:text-gray-400">CRM Ateliê</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-5 overflow-y-auto">
            {menuGroups.map((group) => (
              <div key={group.label}>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 px-4 mb-1.5">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive = pathname.startsWith(item.href)
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-colors ${
                          isActive
                            ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-medium'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="flex-1 text-sm">{item.label}</span>
                        {isActive && <ChevronRight className="w-3.5 h-3.5" />}
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start space-x-2"
              asChild
            >
              <Link href="/dashboard">
                <LogOut className="w-4 h-4" />
                <span>Voltar ao CRM</span>
              </Link>
            </Button>
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              v1.0.0 Admin
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setIsOpen(false)} />
      )}
      <aside
        className={`${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:hidden fixed left-0 top-16 w-64 h-[calc(100vh-4rem)] bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-50 transition-transform duration-300`}
      >
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname.startsWith(item.href)
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-medium'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
