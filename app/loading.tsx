import { Scissors } from 'lucide-react'

export default function Loading() {
  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 dark:bg-indigo-950/50 rounded-2xl mb-4 animate-pulse">
          <Scissors className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
        </div>
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    </div>
  )
}
