'use client'

import { User } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface HeaderProps {
  title: string
  description?: string
  action?: React.ReactNode
}

export function Header({ title, description, action }: HeaderProps) {
  return (
    <header className="bg-card border-b border-border sticky top-0 z-40">
      <div className="pl-16 pr-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex-1 min-w-0 pr-32 sm:pr-0">
            <h1 className="text-lg sm:text-2xl font-bold text-foreground truncate">{title}</h1>
            {description && (
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          
          {action && (
            <div className="flex items-center gap-2 flex-shrink-0">
              {action}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
