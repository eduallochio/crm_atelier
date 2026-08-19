'use client'

import { useEffect, useState } from 'react'
import { Mail, Loader2, Download, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface Lead {
  id: string
  email: string
  whatsapp: string | null
  instagram: string | null
  source: string
  created_at: string
}

function fmtDate(d: string) {
  return new Date(d).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)

  const fetch_ = async () => {
    const res = await fetch('/api/admin/leads')
    if (res.ok) setLeads(await res.json())
    setLoading(false)
  }

  useEffect(() => { fetch_() }, [])

  const exportCsv = () => {
    const header = 'E-mail,WhatsApp,Instagram,Fonte,Data\n'
    const rows = leads.map(l => `${l.email},${l.whatsapp ?? ''},${l.instagram ?? ''},${l.source},${fmtDate(l.created_at)}`).join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `leads-promo-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('CSV exportado')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Leads da Página /promo</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            E-mails capturados pelo formulário de lembrete da promoção
          </p>
        </div>
        <Button onClick={exportCsv} disabled={leads.length === 0} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total de leads</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{leads.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Hoje</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {leads.filter(l => new Date(l.created_at).toDateString() === new Date().toDateString()).length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Esta semana</p>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {leads.filter(l => {
              const d = new Date(l.created_at)
              const now = new Date()
              return (now.getTime() - d.getTime()) < 7 * 86400000
            }).length}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : leads.length === 0 ? (
          <div className="text-center py-16 text-gray-500 dark:text-gray-400">
            <Mail className="h-8 w-8 mx-auto mb-3 opacity-40" />
            <p>Nenhum lead capturado ainda</p>
            <p className="text-sm mt-1">Os e-mails aparecerão aqui quando alguém preencher o formulário em /promo</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  {['E-mail', 'WhatsApp', 'Instagram', 'Fonte', 'Data de cadastro'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {leads.map(lead => (
                  <tr key={lead.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      <a href={`mailto:${lead.email}`} className="hover:text-blue-600 dark:hover:text-blue-400">
                        {lead.email}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      {lead.whatsapp
                        ? <a href={`https://wa.me/55${lead.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="hover:text-green-600 dark:hover:text-green-400">{lead.whatsapp}</a>
                        : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      {lead.instagram
                        ? <a href={`https://instagram.com/${lead.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="hover:text-pink-600 dark:hover:text-pink-400">{lead.instagram.startsWith('@') ? lead.instagram : `@${lead.instagram}`}</a>
                        : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                        {lead.source}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {fmtDate(lead.created_at)}
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
