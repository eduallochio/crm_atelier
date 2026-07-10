import Link from 'next/link'
import { Scissors, Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-100 dark:bg-indigo-950/50 rounded-2xl mb-6">
          <Scissors className="h-10 w-10 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h1 className="text-6xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">404</h1>
        <h2 className="text-xl font-semibold text-foreground mb-3">Página não encontrada</h2>
        <p className="text-muted-foreground text-sm mb-8">
          A página que você está procurando não existe ou foi removida.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 text-white px-5 py-2.5 text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            <Home className="h-4 w-4" />
            Ir para o Dashboard
          </Link>
          <button
            onClick={() => history.back()}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-5 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>
        </div>
      </div>
    </div>
  )
}
