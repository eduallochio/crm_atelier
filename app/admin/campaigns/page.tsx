'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { Send, Loader2, Mail, Search, Eye, Users, TrendingUp, MousePointerClick, History, CheckCircle2, XCircle, Bookmark, FolderOpen } from 'lucide-react'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface Candidate {
  organization_id: string
  organization_name: string
  plan: string
  created_at: string
  owner_id: string | null
  owner_name: string | null
  owner_email: string | null
  ever_paid: boolean
  last_campaign_sent_at: string | null
  is_candidate: boolean
  extra?: Record<string, unknown>
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

interface Segment {
  id: string
  name: string
  criteria: Record<string, unknown>
  createdAt: string
}

type CampaignType = 'reengagement' | 'low-usage' | 'bonus-ending' | 'product-news'

const CAMPAIGN_OPTIONS: { value: CampaignType; label: string; description: string }[] = [
  { value: 'reengagement', label: 'Reengajamento', description: 'Criaram conta e nunca cadastraram um cliente ou uma ordem de serviço' },
  { value: 'low-usage', label: 'Uso baixo', description: 'Já usaram de verdade (cliente ou OS cadastrado), mas sem atividade recente' },
  { value: 'bonus-ending', label: 'Bônus acabando', description: 'Assinantes perto do fim do bônus promocional de 60 dias' },
  { value: 'product-news', label: 'Novidades', description: 'Comunicado de feature nova para quem já usa o sistema' },
]

const AGE_OPTIONS = [
  { value: 'all', label: 'Cadastro: todos', days: 0 },
  { value: '3', label: 'Há mais de 3 dias', days: 3 },
  { value: '7', label: 'Há mais de 7 dias', days: 7 },
  { value: '15', label: 'Há mais de 15 dias', days: 15 },
]

const INACTIVE_DAYS_OPTIONS = [
  { value: '15', label: 'Inativo há 15+ dias' },
  { value: '30', label: 'Inativo há 30+ dias' },
  { value: '60', label: 'Inativo há 60+ dias' },
]

const BONUS_WINDOW_OPTIONS = [
  { value: '3', label: 'Vence em até 3 dias' },
  { value: '7', label: 'Vence em até 7 dias' },
  { value: '15', label: 'Vence em até 15 dias' },
]

const ACTIVITY_OPTIONS = [
  { value: 'candidate', label: 'Status: candidatas' },
  { value: 'all', label: 'Status: todas as organizações' },
  { value: 'not-candidate', label: 'Status: só as demais' },
]

export default function AdminCampaignsPage() {
  const [campaignType, setCampaignType] = useState<CampaignType>('reengagement')

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
  const [activityFilter, setActivityFilter] = useState('candidate') // all | candidate | not-candidate

  // Filtros extras, específicos de cada tipo de campanha
  const [minDaysInactive, setMinDaysInactive] = useState('30')
  const [bonusWithinDays, setBonusWithinDays] = useState('7')

  // Conteúdo da campanha de novidades — preenchido na tela a cada disparo,
  // não hardcoded no código (ver lib/email/index.ts: buildNovidadesHtml)
  const [newsTitulo, setNewsTitulo] = useState('')
  const [newsDescricao, setNewsDescricao] = useState('')
  const [newsCtaTexto, setNewsCtaTexto] = useState('Ver novidade')
  const [newsCtaUrl, setNewsCtaUrl] = useState('')
  const newsContentReady = newsTitulo.trim() && newsDescricao.trim() && newsCtaTexto.trim() && newsCtaUrl.trim()
  const isProductNews = campaignType === 'product-news'

  // Segmentos salvos
  const [segments, setSegments] = useState<Segment[]>([])
  const [saveSegmentOpen, setSaveSegmentOpen] = useState(false)
  const [segmentName, setSegmentName] = useState('')
  const [savingSegment, setSavingSegment] = useState(false)

  const fetchSegments = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/campaigns/segments')
      if (!res.ok) throw new Error()
      setSegments(await res.json())
    } catch {
      // segmentos salvos são conveniência — falha aqui não bloqueia a tela
    }
  }, [])

  const fetchRuns = useCallback(async (type: CampaignType) => {
    setRunsLoading(true)
    try {
      const res = await fetch(`/api/admin/campaigns/${type}/runs`)
      if (!res.ok) throw new Error()
      setRuns(await res.json())
    } catch {
      // histórico é informativo — falha aqui não bloqueia o resto da tela
    } finally {
      setRunsLoading(false)
    }
  }, [])

  const fetchCandidates = useCallback(async (type: CampaignType, opts: { minDaysInactive: string; bonusWithinDays: string }) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (type === 'low-usage') params.set('minDaysInactive', opts.minDaysInactive)
      if (type === 'bonus-ending') params.set('withinDays', opts.bonusWithinDays)
      const qs = params.toString()
      const res = await fetch(`/api/admin/campaigns/${type}${qs ? `?${qs}` : ''}`)
      if (!res.ok) throw new Error()
      const data: Candidate[] = await res.json()
      setCandidates(data)
    } catch {
      toast.error('Erro ao carregar organizações')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchCandidates(campaignType, { minDaysInactive, bonusWithinDays }) }, [campaignType, minDaysInactive, bonusWithinDays, fetchCandidates])
  useEffect(() => { fetchRuns(campaignType) }, [campaignType, fetchRuns])
  useEffect(() => { fetchSegments() }, [fetchSegments])

  // Seleciona só as candidatas vindas do servidor, só quando a lista muda de
  // verdade (troca de campanha, carga inicial, ou depois de disparar) — não
  // a cada filtro local, senão uma desmarcação manual seria descartada ao
  // digitar mais uma letra na busca
  useEffect(() => {
    setSelected(new Set(candidates.filter((c) => c.is_candidate).map((c) => c.organization_id)))
  }, [candidates])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    const ageDays = AGE_OPTIONS.find((o) => o.value === ageFilter)?.days ?? 0
    const cutoff = ageDays > 0 ? Date.now() - ageDays * 24 * 60 * 60 * 1000 : null

    return candidates.filter((c) => {
      const matchSearch = !q ||
        c.organization_name.toLowerCase().includes(q) ||
        (c.owner_name ?? '').toLowerCase().includes(q) ||
        (c.owner_email ?? '').toLowerCase().includes(q)
      const matchAge = !cutoff || new Date(c.created_at).getTime() <= cutoff
      const matchPaid = paidFilter === 'all' ||
        (paidFilter === 'never' ? !c.ever_paid : c.ever_paid)
      const matchSent = sentFilter === 'all' ||
        (sentFilter === 'never' ? !c.last_campaign_sent_at : !!c.last_campaign_sent_at)
      const matchActivity = activityFilter === 'all' ||
        (activityFilter === 'candidate' ? c.is_candidate : !c.is_candidate)
      return matchSearch && matchAge && matchPaid && matchSent && matchActivity
    })
  }, [candidates, search, ageFilter, paidFilter, sentFilter, activityFilter])

  // Quantos itens VISÍVEIS (após o filtro) estão selecionados — selected em si
  // pode conter itens escondidos pelo filtro atual, mas o botão de disparo e o
  // checkbox "selecionar todos" só devem refletir/agir sobre o que a pessoa vê
  const selectedVisible = useMemo(
    () => filtered.filter((c) => c.is_candidate && selected.has(c.organization_id)),
    [filtered, selected]
  )

  // Organização não-candidata nunca pode ser selecionada — o POST a
  // rejeitaria mesmo, então o checkbox nem aparece marcável
  const toggle = (candidate: Candidate) => {
    if (!candidate.is_candidate) return
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(candidate.organization_id)) next.delete(candidate.organization_id)
      else next.add(candidate.organization_id)
      return next
    })
  }

  const toggleAll = () => {
    const selectable = filtered.filter((c) => c.is_candidate)
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
      const body: Record<string, unknown> = { organization_ids: selectedVisible.map((c) => c.organization_id) }
      if (isProductNews) {
        body.content = { titulo: newsTitulo.trim(), descricao: newsDescricao.trim(), ctaTexto: newsCtaTexto.trim(), ctaUrl: newsCtaUrl.trim() }
      }
      const res = await fetch(`/api/admin/campaigns/${campaignType}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      toast.success(`${data.sent} email(s) enviado(s)${data.skipped ? ` · ${data.skipped} pulado(s)` : ''}`)
      setSendResults(data.results ?? null)
      fetchCandidates(campaignType, { minDaysInactive, bonusWithinDays })
      fetchRuns(campaignType)
    } catch {
      toast.error('Erro ao disparar a campanha')
    } finally {
      setSending(false)
    }
  }

  const currentCriteria = useMemo(() => ({
    campaignType, search, ageFilter, paidFilter, sentFilter, activityFilter,
    minDaysInactive, bonusWithinDays,
  }), [campaignType, search, ageFilter, paidFilter, sentFilter, activityFilter, minDaysInactive, bonusWithinDays])

  const handleSaveSegment = async () => {
    if (!segmentName.trim()) return
    setSavingSegment(true)
    try {
      const res = await fetch('/api/admin/campaigns/segments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: segmentName.trim(), criteria: currentCriteria }),
      })
      if (!res.ok) throw new Error()
      toast.success('Segmento salvo')
      setSaveSegmentOpen(false)
      setSegmentName('')
      fetchSegments()
    } catch {
      toast.error('Erro ao salvar o segmento')
    } finally {
      setSavingSegment(false)
    }
  }

  const handleLoadSegment = (segment: Segment) => {
    const c = segment.criteria as Partial<typeof currentCriteria>
    if (c.campaignType) setCampaignType(c.campaignType as CampaignType)
    setSearch(c.search ?? '')
    setAgeFilter(c.ageFilter ?? 'all')
    setPaidFilter(c.paidFilter ?? 'all')
    setSentFilter(c.sentFilter ?? 'all')
    setActivityFilter(c.activityFilter ?? 'candidate')
    setMinDaysInactive(c.minDaysInactive ?? '30')
    setBonusWithinDays(c.bonusWithinDays ?? '7')
    toast.success(`Segmento "${segment.name}" carregado`)
  }

  const selectedCampaign = CAMPAIGN_OPTIONS.find((o) => o.value === campaignType)!

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Campanhas</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{selectedCampaign.description}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          <Button variant="outline" onClick={() => setPreviewOpen(true)} className="flex-1 sm:flex-none">
            <Eye className="w-4 h-4 mr-2" />
            Visualizar email
          </Button>
          <Button
            onClick={() => setConfirmOpen(true)}
            disabled={sending || selectedVisible.length === 0 || (isProductNews && !newsContentReady)}
            className="flex-1 sm:flex-none"
          >
            {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin shrink-0" /> : <Send className="w-4 h-4 mr-2 shrink-0" />}
            <span className="truncate">Disparar para {selectedVisible.length}</span>
          </Button>
        </div>
      </div>

      <div>
        <label htmlFor="campaign-type" className="sr-only">Tipo de campanha</label>
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Tipo de campanha">
          {CAMPAIGN_OPTIONS.map((o) => (
            <button
              key={o.value}
              role="tab"
              aria-selected={campaignType === o.value}
              onClick={() => setCampaignType(o.value)}
              className={cn(
                'px-4 py-2 rounded-md text-sm font-medium border transition-colors',
                campaignType === o.value
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminMetricsCard
          title="Candidatas agora"
          value={String(candidates.filter((c) => c.is_candidate).length)}
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

      {isProductNews ? (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 space-y-3">
          <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300">Conteúdo da novidade</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label htmlFor="news-titulo" className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Título</label>
              <Input id="news-titulo" placeholder="Ex: Chegou o relatório de comissões" value={newsTitulo} onChange={(e) => setNewsTitulo(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="news-descricao" className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Descrição</label>
              <Input id="news-descricao" placeholder="Explique em 1-2 frases o que mudou" value={newsDescricao} onChange={(e) => setNewsDescricao(e.target.value)} />
            </div>
            <div>
              <label htmlFor="news-cta-texto" className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Texto do botão</label>
              <Input id="news-cta-texto" placeholder="Ver novidade" value={newsCtaTexto} onChange={(e) => setNewsCtaTexto(e.target.value)} />
            </div>
            <div>
              <label htmlFor="news-cta-url" className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">URL do botão</label>
              <Input id="news-cta-url" placeholder="https://meuateliersistema.com.br/..." value={newsCtaUrl} onChange={(e) => setNewsCtaUrl(e.target.value)} />
            </div>
          </div>
          {!newsContentReady && (
            <p className="text-xs text-amber-600 dark:text-amber-400">Preencha todos os campos para habilitar o disparo.</p>
          )}
        </div>
      ) : null}

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

        {campaignType === 'low-usage' && (
          <div>
            <label htmlFor="campaign-inactive-days" className="sr-only">Dias sem atividade</label>
            <select id="campaign-inactive-days" value={minDaysInactive} onChange={(e) => setMinDaysInactive(e.target.value)}
              className="h-10 px-3 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white w-full lg:w-auto">
              {INACTIVE_DAYS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        )}

        {campaignType === 'bonus-ending' && (
          <div>
            <label htmlFor="campaign-bonus-window" className="sr-only">Janela de vencimento do bônus</label>
            <select id="campaign-bonus-window" value={bonusWithinDays} onChange={(e) => setBonusWithinDays(e.target.value)}
              className="h-10 px-3 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white w-full lg:w-auto">
              {BONUS_WINDOW_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        )}

        {campaignType !== 'product-news' && (
          <div>
            <label htmlFor="campaign-age-filter" className="sr-only">Filtrar por tempo desde o cadastro</label>
            <select id="campaign-age-filter" value={ageFilter} onChange={(e) => setAgeFilter(e.target.value)}
              className="h-10 px-3 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white w-full lg:w-auto">
              {AGE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        )}
        <div>
          <label htmlFor="campaign-paid-filter" className="sr-only">Filtrar por status da assinatura</label>
          <select id="campaign-paid-filter" value={paidFilter} onChange={(e) => setPaidFilter(e.target.value)}
            className="h-10 px-3 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white w-full lg:w-auto">
            <option value="all">Assinatura: todas</option>
            <option value="never">Nunca assinou</option>
            <option value="churned">Já assinou (pagante)</option>
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

        <div className="flex gap-2 ml-auto">
          <Button variant="outline" size="sm" onClick={() => setSaveSegmentOpen(true)}>
            <Bookmark className="w-4 h-4 mr-2" />
            Salvar filtro
          </Button>
          {segments.length > 0 && (
            <div className="relative">
              <label htmlFor="load-segment" className="sr-only">Carregar segmento salvo</label>
              <select
                id="load-segment"
                defaultValue=""
                onChange={(e) => {
                  const segment = segments.find((s) => s.id === e.target.value)
                  if (segment) handleLoadSegment(segment)
                  e.target.value = ''
                }}
                className="h-9 pl-8 pr-3 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white"
              >
                <option value="" disabled>Carregar segmento...</option>
                {segments.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <FolderOpen className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" aria-hidden="true" />
            </div>
          )}
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
                    <Checkbox checked={filtered.some((c) => c.is_candidate) && selectedVisible.length === filtered.filter((c) => c.is_candidate).length} onCheckedChange={toggleAll} />
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
                      <Checkbox checked={c.is_candidate && selected.has(c.organization_id)} disabled={!c.is_candidate} onCheckedChange={() => toggle(c)} />
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-gray-900 dark:text-white">{c.organization_name}</p>
                      <p className="text-xs text-gray-400">{c.owner_name || '—'}{c.ever_paid && <span className="ml-1.5 text-amber-600 dark:text-amber-400">· já assinou</span>}</p>
                      <p className="text-xs text-gray-400 sm:hidden mt-0.5 truncate max-w-[160px]">{c.owner_email}</p>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className={cn(
                        c.is_candidate
                          ? 'border-orange-300 dark:border-orange-700 bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-400'
                          : 'border-green-300 dark:border-green-700 bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400'
                      )}>
                        {c.is_candidate ? 'Candidata' : 'Fora do critério'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-300 hidden sm:table-cell">{c.owner_email ?? '—'}</td>
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
        fetchUrl={
          isProductNews
            ? `/api/admin/campaigns/product-news/preview?${new URLSearchParams({ titulo: newsTitulo, descricao: newsDescricao, ctaTexto: newsCtaTexto, ctaUrl: newsCtaUrl }).toString()}`
            : `/api/admin/campaigns/${campaignType}/preview`
        }
      />

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Enviar campanha para {selectedVisible.length} organizaç{selectedVisible.length === 1 ? 'ão' : 'ões'}?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>Um email de {selectedCampaign.label.toLowerCase()} será enviado agora para:</p>
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

      <Dialog open={saveSegmentOpen} onOpenChange={setSaveSegmentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Salvar filtro atual como segmento</DialogTitle>
            <DialogDescription>
              Salva a campanha e os filtros selecionados agora, para reutilizar depois.
            </DialogDescription>
          </DialogHeader>
          <div>
            <label htmlFor="segment-name" className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Nome do segmento</label>
            <Input id="segment-name" placeholder="Ex: Uso baixo, parado há 30 dias" value={segmentName} onChange={(e) => setSegmentName(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveSegmentOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveSegment} disabled={savingSegment || !segmentName.trim()}>
              {savingSegment ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
