'use client'

import Link from 'next/link'
import { BookOpen } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

/**
 * Mapa tela → seção do manual (/ajuda#s-N), mesma numeração usada no TOC de
 * app/(dashboard)/ajuda/page.tsx. Manter em sincronia se o manual for
 * reordenado — o id de cada seção vem de `anchor(n) = 's-' + n.replace('.', '-')`
 */
export const HELP_SECTIONS = {
  dashboard:    '2',
  clientes:     '3',
  servicos:     '4',
  'ordens-servico': '5',
  financeiro:   '6',
  caixa:        '6.1',
  receber:      '6.2',
  pagar:        '6.2',
  'fluxo-caixa': '6.3',
  estoque:      '7',
  fornecedores: '7.1',
  configuracoes: '9',
} as const

export type HelpSection = keyof typeof HELP_SECTIONS

/** Botão "Veja como funciona" — leva direto para a seção correspondente do manual */
export function HelpSectionLink({ section }: { section: HelpSection }) {
  const anchor = HELP_SECTIONS[section].replace('.', '-')
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={`/ajuda#s-${anchor}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-[#D4A85A] hover:text-foreground"
          >
            <BookOpen className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>Veja como funciona</span>
          </Link>
        </TooltipTrigger>
        <TooltipContent className="border border-[#D4A85A]/40 bg-[#C8714A] text-[#FFF8F0]">
          Abre a seção do manual sobre esta tela
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
