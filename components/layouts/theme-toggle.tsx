'use client'

import { Moon, Sun, Monitor } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useSystemPreferences, useUpdateSystemPreferences } from '@/hooks/use-settings'
import { toast } from 'sonner'

export function ThemeToggle() {
  const { data: preferences } = useSystemPreferences()
  const updatePreferences = useUpdateSystemPreferences()

  const currentTheme = preferences?.theme || 'auto'

  const handleThemeChange = async (theme: 'light' | 'dark' | 'auto') => {
    if (!preferences?.organization_id) {
      toast.error('Erro ao alterar tema')
      return
    }

    try {
      await updatePreferences.mutateAsync({
        organization_id: preferences.organization_id,
        theme,
        language: preferences.language || 'pt-BR',
        timezone: preferences.timezone || 'America/Sao_Paulo',
        date_format: preferences.date_format || 'dd/MM/yyyy',
        time_format: preferences.time_format || '24h',
        currency: preferences.currency || 'BRL',
        compact_mode: preferences.compact_mode || false,
        show_tooltips: preferences.show_tooltips !== false,
      })
    } catch (error) {
      console.error('Erro ao alterar tema:', error)
      toast.error('Erro ao alterar tema')
    }
  }

  const getIcon = () => {
    switch (currentTheme) {
      case 'light':
        return <Sun className="h-5 w-5" />
      case 'dark':
        return <Moon className="h-5 w-5" />
      default:
        return <Monitor className="h-5 w-5" />
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          title="Alterar tema"
        >
          {getIcon()}
          <span className="sr-only">Alterar tema</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => handleThemeChange('light')}
          className="cursor-pointer"
        >
          <Sun className="mr-2 h-4 w-4" />
          <span>Claro</span>
          {currentTheme === 'light' && (
            <span className="ml-auto text-xs">✓</span>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleThemeChange('dark')}
          className="cursor-pointer"
        >
          <Moon className="mr-2 h-4 w-4" />
          <span>Escuro</span>
          {currentTheme === 'dark' && (
            <span className="ml-auto text-xs">✓</span>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleThemeChange('auto')}
          className="cursor-pointer"
        >
          <Monitor className="mr-2 h-4 w-4" />
          <span>Automático</span>
          {currentTheme === 'auto' && (
            <span className="ml-auto text-xs">✓</span>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
