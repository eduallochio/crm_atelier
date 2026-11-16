'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { Send, Loader2, Mail, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { AdminTableSkeleton } from '@/components/admin/admin-skeleton'
import { toast } from 'sonner'

interface Candidate {
  organization_id: string
  organization_name: string
  plan: string
  created_at: string
  owner_name: string | null
  owner_email: string
  ever_paid: boolean
  last_campaign_sent_at: string | null
  is_inactive: boolean
}

const AGE_OPTIONS = [
  { value: 'all', label: 'Cadastro: todos', days: 0 },
  { value: '3', label: 'Há mais de 3 dias', days: 3 },
  { value: '7', label: 'Há mais de 7 dias', days: 7 },
  { value: '15', label: 'Há mais de 15 dias', days: 15 },
]

const ACTIVITY_OPTIONS = [
  { value: 'inactive', label: 'Status: candidatas (inativas)' },
  { value: 'all', label: 'Status: todas as organizações' },
  { value: 'active', label: 'Status: só ativas' },
]

export default function AdminCampaignsPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [sending, setSending] = useState(false)

  const [search, setSearch] = useState('')
  const [ageFilter, setAgeFilter] = useState('all')
  const [paidFilter, setPaidFilter] = useState('all') // all | never | churned
  const [sentFilter, setSentFilter] = useState('all') // all | never | already
  const [activityFilter, setActivityFilter] = useState('inactive') // all | inactive | active — default mantém o comportamento original (só candidatas)

  const fetchCandidates = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/campaigns/reengagement')
      if (!res.ok) throw new Error()
      const data: Candidate[] = await res.json()
      setCandidates(data)
    } catch {
      toast.error('Erro ao carregar organizações inativas')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchCandidates() }, [fetchCandidates])

  // Seleciona só as candidatas (inativas) vindas do servidor, só quando a
  // lista muda de verdade (carga inicial, ou depois de disparar a campanha)
  // — não a cada filtro local, senão uma desmarcação manual do usuário seria
  // descartada ao digitar mais uma letra na busca. Organização ativa nunca
  // entra pré-selecionada — o POST a rejeitaria mesmo, mas evita confusão.
  useEffect(() => {
    setSelected(new Set(candidates.filter((c) => c.is_inactive).map((c) => c.organization_id)))
  }, [candidates])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    const ageDays = AGE_OPTIONS.find((o) => o.value === ageFilter)?.days ?? 0
    const cutoff = ageDays > 0 ? Date.now() - ageDays * 24 * 60 * 60 * 1000 : null

    return candidates.filter((c) => {
      const matchSearch = !q ||
        c.organization_name.toLowerCase().includes(q) ||
        (c.owner_name ?? '').toLowerCase().includes(q) ||
        c.owner_email.toLowerCase().includes(q)
      const matchAge = !cutoff || new Date(c.created_at).getTime() <= cutoff
      const matchPaid = paidFilter === 'all' ||
        (paidFilter === 'never' ? !c.ever_paid : c.ever_paid)
      const matchSent = sentFilter === 'all' ||
        (sentFilter === 'never' ? !c.last_campaign_sent_at : !!c.last_campaign_sent_at)
      const matchActivity = activityFilter === 'all' ||
        (activityFilter === 'inactive' ? c.is_inactive : !c.is_inactive)
      return matchSearch && matchAge && matchPaid && matchSent && matchActivity
    })
  }, [candidates, search, ageFilter, paidFilter, sentFilter, activityFilter])

  // Quantos itens VISÍVEIS (após o filtro) estão selecionados — selected em si
  // pode conter itens escondidos pelo filtro atual, mas o botão de disparo e o
  // checkbox "selecionar todos" só devem refletir/agir sobre o que a pessoa vê
  const selectedVisible = useMemo(
    () => filtered.filter((c) => c.is_inactive && selected.has(c.organization_id)),
    [filtered, selected]
  )

  // Organização ativa nunca pode ser selecionada — o POST a rejeitaria mesmo
  // (não é candidata real à campanha), então o checkbox nem aparece marcável
  const toggle = (candidate: Candidate) => {
    if (!candidate.is_inactive) return
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(candidate.organization_id)) next.delete(candidate.organization_id)
      else next.add(candidate.organization_id)
      return next
    })
  }

  const toggleAll = () => {
    const selectable = filtered.filter((c) => c.is_inactive)
    setSelected((prev) => {
      const next = new Set(prev)
      const allVisibleSelected = selectable.every((c) => next.has(c.organization_id))
      for (const c of selectable) {
        if (allVisibleSelected) next.delete(c.organization_id)
        else next.add(c.organization_id)
      }
      return next
    })
  }

  const handleSend = async () => {
    if (selectedVisible.length === 0) return
    setSending(true)
    try {
      const res = await fetch('/api/admin/campaigns/reengagement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organization_ids: selectedVisible.map((c) => c.organization_id) }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      toast.success(`${data.sent} email(s) enviado(s)${data.skipped ? ` · ${data.skipped} pulado(s)` : ''}`)
      fetchCandidates()
    } catch {
      toast.error('Erro ao disparar a campanha')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Campanhas</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Candidatas à campanha: quem criou conta e nunca cadastrou um cliente ou uma ordem de serviço — {filtered.length} de {candidates.length} organizações
          </p>
        </div>
        <Button onClick={handleSend} disabled={sending || selectedVisible.length === 0}>
          {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
          Disparar para {selectedVisible.length} organizaç{selectedVisible.length === 1 ? 'ão' : 'ões'}
        </Button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Buscar por organização, nome ou email..."
            value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <select value={activityFilter} onChange={(e) => setActivityFilter(e.target.value)}
          className="h-10 px-3 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white">
          {ACTIVITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={ageFilter} onChange={(e) => setAgeFilter(e.target.value)}
          className="h-10 px-3 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white">
          {AGE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={paidFilter} onChange={(e) => setPaidFilter(e.target.value)}
          className="h-10 px-3 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white">
          <option value="all">Assinatura: todas</option>
          <option value="never">Nunca assinou</option>
          <option value="churned">Já assinou e cancelou</option>
        </select>
        <select value={sentFilter} onChange={(e) => setSentFilter(e.target.value)}
          className="h-10 px-3 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white">
          <option value="all">Campanha: todas</option>
          <option value="never">Nunca recebeu</option>
          <option value="already">Já recebeu</option>
        </select>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
        {loading ? (
          <AdminTableSkeleton rows={8} cols={5} />
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Mail className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              {candidates.length === 0 ? 'Nenhuma organização cadastrada no momento.' : 'Nenhuma organização encontrada com esses filtros.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="py-3 px-4 w-10">
                    <Checkbox checked={filtered.some((c) => c.is_inactive) && selectedVisible.length === filtered.filter((c) => c.is_inactive).length} onCheckedChange={toggleAll} />
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Organização</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Email</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Cadastro</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Último envio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
                {filtered.map((c) => (
                  <tr key={c.organization_id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <Checkbox checked={c.is_inactive && selected.has(c.organization_id)} disabled={!c.is_inactive} onCheckedChange={() => toggle(c)} />
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-gray-900 dark:text-white">{c.organization_name}</p>
                      <p className="text-xs text-gray-400">{c.owner_name || '—'}{c.ever_paid && <span className="ml-1.5 text-amber-600 dark:text-amber-400">· já assinou</span>}</p>
                    </td>
                    <td className="py-3 px-4">
                      {c.is_inactive ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400">Candidata</span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-600 dark:bg-green-950/50 dark:text-green-400">Ativa</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-300">{c.owner_email}</td>
                    <td className="py-3 px-4 text-gray-500 text-xs">
                      {new Date(c.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-xs">
                      {c.last_campaign_sent_at ? new Date(c.last_campaign_sent_at).toLocaleDateString('pt-BR') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
