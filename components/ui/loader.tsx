import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoaderProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  text?: string
}

const sizeMap = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-8 w-8' }

export function Loader({ className, size = 'md', text }: LoaderProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 p-8 text-muted-foreground', className)}>
      <Loader2 className={cn('animate-spin', sizeMap[size])} />
      {text && <p className="text-sm">{text}</p>}
    </div>
  )
}
