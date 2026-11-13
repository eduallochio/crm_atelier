'use client'

import { useEffect, useState } from 'react'
import { GrowthChart } from '@/components/admin/growth-chart'
import { ChurnAnalysis } from '@/components/admin/churn-analysis'
import { TopClients } from '@/components/admin/top-clients'
import { MousePointerClick, Users, UserCheck, TrendingDown, ArrowRight, Sparkles } from 'lucide-react'

interface EventsData {
  funnel: {
    page_views: number
    cta_clicks: number
    signup_started: number
    signup_completed: number
    conversion_rate: number
  }
  daily_visitors: { date: string; visitors: number; signups: number }[]
  top_referrers: { referrer: string; count: number; cta_clicks: number; signups: number; is_ai: boolean }[]
  top_sources: { source: string; count: number }[]
  signup_abandonment: {
    started: number
    completed: number
    abandoned: number
    abandonment_rate: number
  }
}

interface AnalyticsData {
  monthly: { month: string; users: number; revenue: number; growth: number }[]
  planDistribution: Record<string, number>
  churn: {
    rate: number
    trend: 'up' | 'down'
    cancelled: number
    total: number
    reasons: { reason: string; count: number; percentage: number }[]
  }
  topOrgs: {
    id: string
    name: string
    plan: string
    revenue: number
    clients_count: number
    orders_count: number
    growth: number
  }[]
}

const PLAN_COLORS: Record<string, string> = {
  free: 'bg-gray-400', pro: 'bg-blue-500',
}
const PLAN_LABELS: Record<string, string> = {
  free: 'Free', pro: 'Pro',
}

export default function AdminAnalyticsPage() {
  const [data, setData]           = useState<AnalyticsData | null>(null)
  const [events, setEvents]       = useState<EventsData | null>(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(false)

  const fetchData = async () => {
    setLoading(true)
    setError(false)
    try {
      const [analyticsRes, eventsRes] = await Promise.all([
        fetch('/api/admin/analytics'),
        fetch('/api/admin/events'),
      ])

      const parseJson = async (res: Response) => {
        const text = await res.text()
        try { return JSON.parse(text) } catch { return null }
      }

      const [analytics, evts] = await Promise.all([
        parseJson(analyticsRes),
        parseJson(eventsRes).catch(() => null),
      ])

      if (!analytics || !analyticsRes.ok) throw new Error()
      setData(analytics)
      setEvents(evts)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const totalOrgs = data
    ? Object.values(data.planDistribution).reduce((a, b) => a + b, 0)
    : 0

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-64 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 animate-pulse" />
        ))}
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-red-600 dark:text-red-400">Erro ao carregar dados de analytics.</p>
        <button onClick={fetchData} className="text-sm font-medium text-red-600 dark:text-red-400 underline">Tentar novamente</button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Análises</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Dados reais do sistema</p>
      </div>

      {/* Funil de Conversão */}
      {events && (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Funil de Conversão</h3>
          <p className="text-xs text-gray-400 mb-6">Últimos 30 dias</p>

          {/* Funil visual */}
          <div className="flex items-center gap-2 mb-6 flex-wrap">
            {[
              { label: 'Visitas', value: events.funnel.page_views, icon: <Users size={14} />, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
              { label: 'Cliques CTA', value: events.funnel.cta_clicks, icon: <MousePointerClick size={14} />, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
              { label: 'Iniciaram cadastro', value: events.funnel.signup_started, icon: <UserCheck size={14} />, color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
              { label: 'Completaram', value: events.funnel.signup_completed, icon: <UserCheck size={14} />, color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
            ].map((step, i, arr) => (
              <div key={step.label} className="flex items-center gap-2">
                <div className={`flex flex-col items-center px-4 py-3 rounded-lg ${step.color} min-w-[110px]`}>
                  <div className="flex items-center gap-1 mb-1">{step.icon}<span className="text-xs font-medium">{step.label}</span></div>
                  <span className="text-2xl font-bold">{step.value.toLocaleString('pt-BR')}</span>
                </div>
                {i < arr.length - 1 && <ArrowRight size={16} className="text-gray-300 dark:text-gray-600 shrink-0" />}
              </div>
            ))}
            <div className="ml-auto flex flex-col items-end">
              <span className="text-xs text-gray-400">Taxa de conversão</span>
              <span className="text-3xl font-bold text-green-600 dark:text-green-400">{events.funnel.conversion_rate.toFixed(1)}%</span>
            </div>
          </div>

          {/* Abandono + Sources */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Abandono */}
            <div className="border border-gray-100 dark:border-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown size={14} className="text-red-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Abandono de Cadastro</span>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Iniciaram</span><span className="font-medium">{events.signup_abandonment.started}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Completaram</span><span className="font-medium text-green-600">{events.signup_abandonment.completed}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Abandonaram</span><span className="font-medium text-red-500">{events.signup_abandonment.abandoned}</span></div>
                <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex justify-between">
                  <span className="text-gray-500">Taxa de abandono</span>
                  <span className="font-bold text-red-500">{events.signup_abandonment.abandonment_rate.toFixed(1)}%</span>
                </div>
              </div>
            </div>

            {/* Top Sources */}
            <div className="border border-gray-100 dark:border-gray-800 rounded-lg p-4">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-3">Top UTM Sources</span>
              {events.top_sources.length > 0 ? (
                <div className="space-y-2">
                  {events.top_sources.slice(0, 5).map((s) => (
                    <div key={s.source} className="flex justify-between text-sm">
                      <span className="text-gray-500 truncate max-w-[140px]">{s.source}</span>
                      <span className="font-medium ml-2">{s.count}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-xs text-gray-400">Nenhum dado ainda</p>}
            </div>
          </div>

          {/* Top Referrers — agrupado por domínio, com conversão por canal */}
          <div className="border border-gray-100 dark:border-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">De onde vêm os visitantes</span>
              <span className="text-xs text-gray-400">Últimos 30 dias</span>
            </div>
            {events.top_referrers.length > 0 ? (
              <>
                {events.top_referrers.some((r) => r.is_ai) && (
                  <div className="mb-3 pb-3 border-b border-dashed border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Sparkles size={12} className="text-violet-500" />
                      <span className="text-xs font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wide">Assistentes de IA</span>
                    </div>
                    <div className="space-y-1.5">
                      {events.top_referrers.filter((r) => r.is_ai).map((r) => (
                        <ReferrerRow key={r.referrer} r={r} accent="violet" />
                      ))}
                    </div>
                  </div>
                )}
                <div className="space-y-1.5">
                  {events.top_referrers.filter((r) => !r.is_ai).slice(0, 8).map((r) => (
                    <ReferrerRow key={r.referrer} r={r} accent="gray" />
                  ))}
                </div>
              </>
            ) : <p className="text-xs text-gray-400">Nenhum dado ainda</p>}
          </div>
        </div>
      )}

      {/* Distribuicao de Planos */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Distribuicao de Planos</h3>
        <div className="flex items-center gap-1 mb-4 h-8 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
          {Object.entries(data.planDistribution).map(([plan, count]) => {
            const pct = totalOrgs > 0 ? (count / totalOrgs) * 100 : 0
            return pct > 0 ? (
              <div
                key={plan}
                className={`${PLAN_COLORS[plan] || 'bg-gray-400'} h-full flex items-center justify-center text-xs text-white font-medium transition-all`}
                style={{ width: `${pct}%` }}
                title={`${PLAN_LABELS[plan] || plan}: ${count}`}
              >
                {pct > 8 ? `${Math.round(pct)}%` : ''}
              </div>
            ) : null
          })}
        </div>
        <div className="flex flex-wrap items-center gap-6">
          {Object.entries(data.planDistribution).map(([plan, count]) => (
            <div key={plan} className="flex items-center gap-2 text-sm">
              <div className={`w-3 h-3 rounded-full ${PLAN_COLORS[plan] || 'bg-gray-400'}`} />
              <span className="text-gray-600 dark:text-gray-400">{PLAN_LABELS[plan] || plan}:</span>
              <span className="font-semibold text-gray-900 dark:text-white">{count}</span>
            </div>
          ))}
          <div className="text-sm text-gray-500 dark:text-gray-400 ml-auto">
            Total: <strong className="text-gray-900 dark:text-white">{totalOrgs}</strong> organizacoes
          </div>
        </div>
      </div>

      {/* Crescimento Mensal */}
      <GrowthChart data={data.monthly} />

      {/* Churn + Top Orgs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChurnAnalysis data={data.churn} />
        <TopClients clients={data.topOrgs.map((o) => ({
          id:      o.id,
          name:    o.name,
          plan:    PLAN_LABELS[o.plan] || o.plan,
          revenue: o.revenue,
          growth:  o.growth,
        }))} />
      </div>

      {/* Tabela Top Orgs */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Organizacoes por Atividade</h3>
        {data.topOrgs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">#</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Organizacao</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Plano</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Clientes</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Ordens</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">MRR</th>
                </tr>
              </thead>
              <tbody>
                {data.topOrgs.map((org, i) => (
                  <tr key={org.id} className="border-b border-gray-50 dark:border-gray-800/40 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="py-3 px-4 text-gray-400 font-mono text-xs">{i + 1}</td>
                    <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{org.name}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium text-white ${PLAN_COLORS[org.plan] || 'bg-gray-400'}`}>
                        {PLAN_LABELS[org.plan] || org.plan}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300">{org.clients_count}</td>
                    <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300">{org.orders_count}</td>
                    <td className="py-3 px-4 text-right font-medium text-gray-900 dark:text-white">
                      {org.revenue > 0 ? `R$ ${org.revenue.toFixed(2)}` : 'Gratis'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-gray-400 py-8">Nenhuma organizacao encontrada</p>
        )}
      </div>
    </div>
  )
}

/** Linha de um referrer: domínio + visitantes + quantos clicaram no CTA/se cadastraram */
function ReferrerRow({
  r,
  accent,
}: {
  r: { referrer: string; count: number; cta_clicks: number; signups: number }
  accent: 'violet' | 'gray'
}) {
  const conversionPct = r.count > 0 ? Math.min(100, Math.round((r.signups / r.count) * 100)) : 0
  const dotColor = accent === 'violet' ? 'bg-violet-500' : 'bg-gray-400'
  return (
    <div className="flex items-center justify-between text-sm gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
        <span className="text-gray-600 dark:text-gray-300 truncate max-w-[160px]" title={r.referrer}>
          {r.referrer || 'Direto'}
        </span>
      </div>
      <div className="flex items-center gap-3 shrink-0 text-xs">
        <span className="text-gray-400" title="Visitantes">{r.count} visita{r.count === 1 ? '' : 's'}</span>
        {r.cta_clicks > 0 && <span className="text-amber-600 dark:text-amber-400" title="Cliques no CTA">{r.cta_clicks} clique{r.cta_clicks === 1 ? '' : 's'}</span>}
        {r.signups > 0 && (
          <span className="font-semibold text-green-600 dark:text-green-400" title="Cadastros completados">
            {r.signups} cadastro{r.signups === 1 ? '' : 's'} ({conversionPct}%)
          </span>
        )}
      </div>
    </div>
  )
}
