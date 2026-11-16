'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { Send, Loader2, Mail, Search, Eye, Users, TrendingUp, MousePointerClick, History, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { AdminTableSkeleton } from '@/components/admin/admin-skeleton'
import { AdminMetricsCard } from '@/components/admin/admin-metrics-card'
import { EmailPreviewDialog } from '@/components/admin/email-preview-dialog'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'
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

interface Run {
  id: string
  sent_count: number
  skipped_count: number
  opened_count: number
  clicked_count: number
  created_at: string
}

interface SendResult {
  organization_id: string
  organization_name: string
  status: 'sent' | 'failed'
  error?: string
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
  const [previewOpen, setPreviewOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [sendResults, setSendResults] = useState<SendResult[] | null>(null)

  const [runs, setRuns] = useState<Run[]>([])
  const [runsLoading, setRunsLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [ageFilter, setAgeFilter] = useState('all')
  const [paidFilter, setPaidFilter] = useState('all') // all | never | churned
  const [sentFilter, setSentFilter] = useState('all') // all | never | already
  const [activityFilter, setActivityFilter] = useState('inactive') // all | inactive | active — default mantém o comportamento original (só candidatas)

  const fetchRuns = useCallback(async () => {
    setRunsLoading(true)
    try {
      const res = await fetch('/api/admin/campaigns/reengagement/runs')
      if (!res.ok) throw new Error()
      setRuns(await res.json())
    } catch {
      // histórico é informativo — falha aqui não bloqueia o resto da tela
    } finally {
      setRunsLoading(false)
    }
  }, [])

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
  useEffect(() => { fetchRuns() }, [fetchRuns])

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

  const lastRun = runs[0] ?? null
  const openRate = lastRun && lastRun.sent_count > 0 ? Math.round((lastRun.opened_count / lastRun.sent_count) * 100) : null
  const clickRate = lastRun && lastRun.sent_count > 0 ? Math.round((lastRun.clicked_count / lastRun.sent_count) * 100) : null
  const hasAnyTrackingData = runs.some((r) => r.opened_count > 0 || r.clicked_count > 0)

  const handleSend = async () => {
    if (selectedVisible.length === 0) return
    setConfirmOpen(false)
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
      setSendResults(data.results ?? null)
      fetchCandidates()
      fetchRuns()
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
            Reengajamento — organizações que criaram conta e nunca cadastraram um cliente ou uma ordem de serviço
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          <Button variant="outline" onClick={() => setPreviewOpen(true)} className="flex-1 sm:flex-none">
            <Eye className="w-4 h-4 mr-2" />
            Visualizar email
          </Button>
          <Button onClick={() => setConfirmOpen(true)} disabled={sending || selectedVisible.length === 0} className="flex-1 sm:flex-none">
            {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin shrink-0" /> : <Send className="w-4 h-4 mr-2 shrink-0" />}
            <span className="truncate">Disparar para {selectedVisible.length}</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminMetricsCard
          title="Candidatas agora"
          value={String(candidates.filter((c) => c.is_inactive).length)}
          icon={Users}
          subtext={`de ${candidates.length} organizações no total`}
          color="blue"
        />
        <AdminMetricsCard
          title="Último disparo"
          value={lastRun ? String(lastRun.sent_count) : '—'}
          icon={Send}
          subtext={lastRun ? new Date(lastRun.created_at).toLocaleDateString('pt-BR') : 'nenhum disparo ainda'}
          color="purple"
        />
        <AdminMetricsCard
          title="Taxa de abertura"
          value={openRate !== null ? `${openRate}%` : '—'}
          icon={TrendingUp}
          subtext={hasAnyTrackingData ? 'do último disparo' : 'ative o tracking no Resend'}
          color="green"
        />
        <AdminMetricsCard
          title="Taxa de clique"
          value={clickRate !== null ? `${clickRate}%` : '—'}
          icon={MousePointerClick}
          subtext={hasAnyTrackingData ? 'do último disparo' : 'ative o tracking no Resend'}
          color="indigo"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap gap-3">
        <div className="relative sm:col-span-2 lg:flex-1 lg:min-w-[240px]">
          <label htmlFor="campaign-search" className="sr-only">Buscar organizações</label>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden="true" />
          <Input id="campaign-search" placeholder="Buscar por organização, nome ou email..."
            value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <div>
          <label htmlFor="campaign-activity-filter" className="sr-only">Filtrar por status da organização</label>
          <select id="campaign-activity-filter" value={activityFilter} onChange={(e) => setActivityFilter(e.target.value)}
            className="h-10 px-3 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white w-full lg:w-auto">
            {ACTIVITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="campaign-age-filter" className="sr-only">Filtrar por tempo desde o cadastro</label>
          <select id="campaign-age-filter" value={ageFilter} onChange={(e) => setAgeFilter(e.target.value)}
            className="h-10 px-3 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white w-full lg:w-auto">
            {AGE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="campaign-paid-filter" className="sr-only">Filtrar por status da assinatura</label>
          <select id="campaign-paid-filter" value={paidFilter} onChange={(e) => setPaidFilter(e.target.value)}
            className="h-10 px-3 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white w-full lg:w-auto">
            <option value="all">Assinatura: todas</option>
            <option value="never">Nunca assinou</option>
            <option value="churned">Já assinou e cancelou</option>
          </select>
        </div>
        <div>
          <label htmlFor="campaign-sent-filter" className="sr-only">Filtrar por recebimento da campanha</label>
          <select id="campaign-sent-filter" value={sentFilter} onChange={(e) => setSentFilter(e.target.value)}
            className="h-10 px-3 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white w-full lg:w-auto">
            <option value="all">Campanha: todas</option>
            <option value="never">Nunca recebeu</option>
            <option value="already">Já recebeu</option>
          </select>
        </div>
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
                  <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400 hidden sm:table-cell">Email</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400 hidden md:table-cell">Cadastro</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400 hidden md:table-cell">Último envio</th>
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
                      <p className="text-xs text-gray-400 sm:hidden mt-0.5 truncate max-w-[160px]">{c.owner_email}</p>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className={cn(
                        c.is_inactive
                          ? 'border-orange-300 dark:border-orange-700 bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-400'
                          : 'border-green-300 dark:border-green-700 bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400'
                      )}>
                        {c.is_inactive ? 'Candidata' : 'Ativa'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-300 hidden sm:table-cell">{c.owner_email}</td>
                    <td className="py-3 px-4 text-gray-500 text-xs hidden md:table-cell">
                      {new Date(c.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-xs hidden md:table-cell">
                      {c.last_campaign_sent_at ? new Date(c.last_campaign_sent_at).toLocaleDateString('pt-BR') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
          <History className="w-4 h-4 text-gray-400" />
          <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300">Histórico de disparos</h2>
        </div>
        {runsLoading ? (
          <AdminTableSkeleton rows={3} cols={5} />
        ) : runs.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-400">Nenhum disparo realizado ainda.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="text-left py-2.5 px-4 font-medium text-gray-500 dark:text-gray-400">Data</th>
                  <th className="text-left py-2.5 px-4 font-medium text-gray-500 dark:text-gray-400">Enviados</th>
                  <th className="text-left py-2.5 px-4 font-medium text-gray-500 dark:text-gray-400">Pulados</th>
                  <th className="text-left py-2.5 px-4 font-medium text-gray-500 dark:text-gray-400">Abertura</th>
                  <th className="text-left py-2.5 px-4 font-medium text-gray-500 dark:text-gray-400">Clique</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
                {runs.map((r) => (
                  <tr key={r.id}>
                    <td className="py-2.5 px-4 text-gray-500 text-xs">{new Date(r.created_at).toLocaleString('pt-BR')}</td>
                    <td className="py-2.5 px-4 text-gray-900 dark:text-white font-medium">{r.sent_count}</td>
                    <td className="py-2.5 px-4 text-gray-500">{r.skipped_count}</td>
                    <td className="py-2.5 px-4 text-gray-500">
                      {r.sent_count > 0 ? `${Math.round((r.opened_count / r.sent_count) * 100)}%` : '—'}
                    </td>
                    <td className="py-2.5 px-4 text-gray-500">
                      {r.sent_count > 0 ? `${Math.round((r.clicked_count / r.sent_count) * 100)}%` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <EmailPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        fetchUrl="/api/admin/campaigns/reengagement/preview"
      />

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Enviar campanha para {selectedVisible.length} organizaç{selectedVisible.length === 1 ? 'ão' : 'ões'}?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>Um email de reengajamento será enviado agora para:</p>
                <ul className="list-disc list-inside text-sm">
                  {selectedVisible.slice(0, 3).map((c) => (
                    <li key={c.organization_id}>{c.organization_name}</li>
                  ))}
                </ul>
                {selectedVisible.length > 3 && (
                  <p className="text-sm">e mais {selectedVisible.length - 3} organizaç{selectedVisible.length - 3 === 1 ? 'ão' : 'ões'}.</p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleSend}>
              Enviar agora
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={sendResults !== null} onOpenChange={(open) => !open && setSendResults(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resultado do disparo</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="max-h-[50vh] overflow-y-auto space-y-1.5">
                {sendResults?.map((r) => (
                  <div key={r.organization_id} className="flex items-start gap-2 text-sm">
                    {r.status === 'sent' ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                    )}
                    <span>
                      <span className="text-foreground">{r.organization_name}</span>
                      {r.status === 'failed' && r.error && <span className="text-muted-foreground"> — {r.error}</span>}
                    </span>
                  </div>
                ))}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setSendResults(null)}>Fechar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
