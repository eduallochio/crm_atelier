'use client'

import { useEffect, useState } from 'react'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'

interface FAQItem { question: string; answer: string }
interface TestimonialItem { name: string; role: string; text: string; avatar?: string }
interface FeatureItem { title: string; description: string; icon?: string }
interface HowItWorksItem { step: number; title: string; description: string }

interface LandingContent {
  hero_title: string
  hero_subtitle: string
  hero_cta_primary: string
  hero_cta_secondary: string
  features_title: string
  features_subtitle: string
  how_it_works_title: string
  stats_orgs: string
  stats_clients: string
  stats_orders: string
  footer_tagline: string
  features_json: string
  how_it_works_json: string
  testimonials_json: string
  faq_json: string
}

const DEFAULTS: LandingContent = {
  hero_title: 'Gerencie seu ateliê com eficiência',
  hero_subtitle: 'O CRM completo para ateliês de costura e artesanato',
  hero_cta_primary: 'Começar grátis',
  hero_cta_secondary: 'Entrar',
  features_title: 'Tudo que você precisa',
  features_subtitle: 'Ferramentas pensadas para o seu negócio',
  how_it_works_title: 'Como funciona',
  stats_orgs: '500+',
  stats_clients: '10.000+',
  stats_orders: '50.000+',
  footer_tagline: 'Feito com carinho para ateliês',
  features_json: '[]',
  how_it_works_json: '[]',
  testimonials_json: '[]',
  faq_json: '[]',
}

export default function AdminLandingPage() {
  const [content, setContent] = useState<LandingContent>(DEFAULTS)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  // Parsed JSON arrays
  const [features, setFeatures] = useState<FeatureItem[]>([])
  const [howItWorks, setHowItWorks] = useState<HowItWorksItem[]>([])
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>([])
  const [faq, setFaq] = useState<FAQItem[]>([])

  useEffect(() => {
    fetch('/api/admin/landing')
      .then((r) => r.json())
      .then((data) => {
        const merged = { ...DEFAULTS, ...data }
        setContent(merged)
        try { setFeatures(JSON.parse(merged.features_json || '[]')) } catch { setFeatures([]) }
        try { setHowItWorks(JSON.parse(merged.how_it_works_json || '[]')) } catch { setHowItWorks([]) }
        try { setTestimonials(JSON.parse(merged.testimonials_json || '[]')) } catch { setTestimonials([]) }
        try { setFaq(JSON.parse(merged.faq_json || '[]')) } catch { setFaq([]) }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        ...content,
        features_json: JSON.stringify(features),
        how_it_works_json: JSON.stringify(howItWorks),
        testimonials_json: JSON.stringify(testimonials),
        faq_json: JSON.stringify(faq),
      }
      const res = await fetch('/api/admin/landing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error()
      toast.success('Conteúdo da landing page salvo!')
    } catch { toast.error('Erro ao salvar') } finally { setSaving(false) }
  }

  const field = (key: keyof LandingContent, label: string, placeholder?: string) => (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Input value={content[key]} placeholder={placeholder}
        onChange={(e) => setContent(prev => ({ ...prev, [key]: e.target.value }))} />
    </div>
  )

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Carregando...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gerenciador da Landing Page</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Edite os textos e conteúdos da página inicial</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Salvar tudo
        </Button>
      </div>

      <Tabs defaultValue="hero" className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="hero">Hero</TabsTrigger>
          <TabsTrigger value="features">Funcionalidades</TabsTrigger>
          <TabsTrigger value="how">Como funciona</TabsTrigger>
          <TabsTrigger value="stats">Estatísticas</TabsTrigger>
          <TabsTrigger value="testimonials">Depoimentos</TabsTrigger>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
          <TabsTrigger value="footer">Rodapé</TabsTrigger>
        </TabsList>

        {/* HERO */}
        <TabsContent value="hero">
          <Card className="p-6 space-y-4">
            <h3 className="font-semibold">Seção Hero</h3>
            {field('hero_title', 'Título principal')}
            {field('hero_subtitle', 'Subtítulo')}
            {field('hero_cta_primary', 'Botão primário (CTA)')}
            {field('hero_cta_secondary', 'Botão secundário')}
          </Card>
        </TabsContent>

        {/* FEATURES */}
        <TabsContent value="features">
          <Card className="p-6 space-y-4">
            <h3 className="font-semibold">Seção Funcionalidades</h3>
            {field('features_title', 'Título da seção')}
            {field('features_subtitle', 'Subtítulo da seção')}
            <hr className="border-border" />
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">Itens</h4>
              <Button size="sm" variant="outline"
                onClick={() => setFeatures(prev => [...prev, { title: '', description: '', icon: '' }])}>
                <Plus className="w-3.5 h-3.5 mr-1" />Adicionar
              </Button>
            </div>
            <div className="space-y-3">
              {features.map((f, i) => (
                <div key={i} className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex-1 space-y-2">
                    <Input placeholder="Título" value={f.title}
                      onChange={(e) => setFeatures(prev => prev.map((x, idx) => idx === i ? { ...x, title: e.target.value } : x))} />
                    <Input placeholder="Descrição" value={f.description}
                      onChange={(e) => setFeatures(prev => prev.map((x, idx) => idx === i ? { ...x, description: e.target.value } : x))} />
                    <Input placeholder="Ícone (ex: Scissors, Package...)" value={f.icon ?? ''}
                      onChange={(e) => setFeatures(prev => prev.map((x, idx) => idx === i ? { ...x, icon: e.target.value } : x))} />
                  </div>
                  <Button size="sm" variant="ghost" className="text-red-400 self-start"
                    onClick={() => setFeatures(prev => prev.filter((_, idx) => idx !== i))}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              {features.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Nenhum item. Adicione funcionalidades.</p>}
            </div>
          </Card>
        </TabsContent>

        {/* HOW IT WORKS */}
        <TabsContent value="how">
          <Card className="p-6 space-y-4">
            <h3 className="font-semibold">Como Funciona</h3>
            {field('how_it_works_title', 'Título da seção')}
            <hr className="border-border" />
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">Passos</h4>
              <Button size="sm" variant="outline"
                onClick={() => setHowItWorks(prev => [...prev, { step: prev.length + 1, title: '', description: '' }])}>
                <Plus className="w-3.5 h-3.5 mr-1" />Adicionar
              </Button>
            </div>
            <div className="space-y-3">
              {howItWorks.map((h, i) => (
                <div key={i} className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {h.step}
                  </div>
                  <div className="flex-1 space-y-2">
                    <Input placeholder="Título" value={h.title}
                      onChange={(e) => setHowItWorks(prev => prev.map((x, idx) => idx === i ? { ...x, title: e.target.value } : x))} />
                    <Input placeholder="Descrição" value={h.description}
                      onChange={(e) => setHowItWorks(prev => prev.map((x, idx) => idx === i ? { ...x, description: e.target.value } : x))} />
                  </div>
                  <Button size="sm" variant="ghost" className="text-red-400 self-start"
                    onClick={() => setHowItWorks(prev => prev.filter((_, idx) => idx !== i))}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              {howItWorks.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Nenhum passo cadastrado.</p>}
            </div>
          </Card>
        </TabsContent>

        {/* STATS */}
        <TabsContent value="stats">
          <Card className="p-6 space-y-4">
            <h3 className="font-semibold">Estatísticas de Destaque</h3>
            <div className="grid grid-cols-3 gap-4">
              {field('stats_orgs', 'Organizações')}
              {field('stats_clients', 'Clientes')}
              {field('stats_orders', 'Ordens de Serviço')}
            </div>
          </Card>
        </TabsContent>

        {/* TESTIMONIALS */}
        <TabsContent value="testimonials">
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Depoimentos</h3>
              <Button size="sm" variant="outline"
                onClick={() => setTestimonials(prev => [...prev, { name: '', role: '', text: '' }])}>
                <Plus className="w-3.5 h-3.5 mr-1" />Adicionar
              </Button>
            </div>
            <div className="space-y-3">
              {testimonials.map((t, i) => (
                <div key={i} className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex-1 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <Input placeholder="Nome" value={t.name}
                        onChange={(e) => setTestimonials(prev => prev.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x))} />
                      <Input placeholder="Cargo / Ateliê" value={t.role}
                        onChange={(e) => setTestimonials(prev => prev.map((x, idx) => idx === i ? { ...x, role: e.target.value } : x))} />
                    </div>
                    <Input placeholder="Depoimento" value={t.text}
                      onChange={(e) => setTestimonials(prev => prev.map((x, idx) => idx === i ? { ...x, text: e.target.value } : x))} />
                  </div>
                  <Button size="sm" variant="ghost" className="text-red-400 self-start"
                    onClick={() => setTestimonials(prev => prev.filter((_, idx) => idx !== i))}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              {testimonials.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Nenhum depoimento.</p>}
            </div>
          </Card>
        </TabsContent>

        {/* FAQ */}
        <TabsContent value="faq">
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Perguntas Frequentes</h3>
              <Button size="sm" variant="outline"
                onClick={() => setFaq(prev => [...prev, { question: '', answer: '' }])}>
                <Plus className="w-3.5 h-3.5 mr-1" />Adicionar
              </Button>
            </div>
            <div className="space-y-3">
              {faq.map((f, i) => (
                <div key={i} className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex-1 space-y-2">
                    <Input placeholder="Pergunta" value={f.question}
                      onChange={(e) => setFaq(prev => prev.map((x, idx) => idx === i ? { ...x, question: e.target.value } : x))} />
                    <Input placeholder="Resposta" value={f.answer}
                      onChange={(e) => setFaq(prev => prev.map((x, idx) => idx === i ? { ...x, answer: e.target.value } : x))} />
                  </div>
                  <Button size="sm" variant="ghost" className="text-red-400 self-start"
                    onClick={() => setFaq(prev => prev.filter((_, idx) => idx !== i))}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              {faq.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Nenhuma pergunta.</p>}
            </div>
          </Card>
        </TabsContent>

        {/* FOOTER */}
        <TabsContent value="footer">
          <Card className="p-6 space-y-4">
            <h3 className="font-semibold">Rodapé</h3>
            {field('footer_tagline', 'Tagline do rodapé')}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
