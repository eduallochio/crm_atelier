'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Eye, LogOut } from 'lucide-react'

/** Faixa fixa no topo enquanto um master está "vendo como" uma organização — nunca derruba a sessão master */
export function ImpersonationBanner() {
  const queryClient = useQueryClient()

  const { data } = useQuery({
    queryKey: ['impersonation-status'],
    queryFn: async () => {
      const res = await fetch('/api/admin/impersonation')
      if (!res.ok) return { active: false, organizationName: null }
      return res.json() as Promise<{ active: boolean; organizationName: string | null }>
    },
    staleTime: 30_000,
  })

  if (!data?.active) return null

  const exit = async () => {
    await fetch('/api/admin/impersonation', { method: 'DELETE' })
    queryClient.clear()
    window.location.href = '/admin/organizations'
  }

  return (
    <div className="flex items-center justify-center gap-3 bg-[#D4A85A] px-4 py-2 text-[13px] font-medium text-[#1a0f00]">
      <Eye className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>
        Vendo como <b className="font-semibold">{data.organizationName}</b>
      </span>
      <button
        type="button"
        onClick={exit}
        className="ml-2 inline-flex items-center gap-1 rounded-full bg-[#1a0f00]/10 px-2.5 py-0.5 font-semibold hover:bg-[#1a0f00]/20 transition-colors"
      >
        <LogOut className="h-3 w-3" aria-hidden="true" />
        Voltar para admin
      </button>
    </div>
  )
}
