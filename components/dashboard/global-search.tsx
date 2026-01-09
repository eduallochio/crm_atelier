'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'

interface Client {
  id: string
  nome: string
  email?: string
  telefone?: string
}

interface Order {
  id: string
  numero?: number
  status: string
  client?: {
    nome: string
  }
}

interface Service {
  id: string
  nome: string
  descricao?: string
  preco?: number
}

interface SearchResult {
  id: string
  type: 'client' | 'order' | 'service'
  title: string
  subtitle?: string
  url: string
}

interface GlobalSearchProps {
  clients?: Client[]
  orders?: Order[]
  services?: Service[]
}

export function GlobalSearch({ clients = [], orders = [], services = [] }: GlobalSearchProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const router = useRouter()

  const searchResults: SearchResult[] = [
    // Clientes
    ...clients
      .filter(client => 
        client.nome?.toLowerCase().includes(search.toLowerCase()) ||
        client.email?.toLowerCase().includes(search.toLowerCase()) ||
        client.telefone?.includes(search)
      )
      .slice(0, 5)
      .map(client => ({
        id: client.id,
        type: 'client' as const,
        title: client.nome,
        subtitle: client.email || client.telefone,
        url: `/clientes?id=${client.id}`,
      })),
    
    // Ordens
    ...orders
      .filter(order => 
        order.numero?.toString().toLowerCase().includes(search.toLowerCase()) ||
        order.client?.nome?.toLowerCase().includes(search.toLowerCase())
      )
      .slice(0, 5)
      .map(order => ({
        id: order.id,
        type: 'order' as const,
        title: order.numero?.toString() || '',
        subtitle: `${order.client?.nome || 'Cliente não informado'} - ${order.status}`,
        url: `/ordens-servico?id=${order.id}`,
      })),
    
    // Serviços
    ...services
      .filter(service => 
        service.nome?.toLowerCase().includes(search.toLowerCase()) ||
        service.descricao?.toLowerCase().includes(search.toLowerCase())
      )
      .slice(0, 5)
      .map(service => ({
        id: service.id,
        type: 'service' as const,
        title: service.nome,
        subtitle: `R$ ${service.preco?.toFixed(2) || '0.00'}`,
        url: `/servicos?id=${service.id}`,
      })),
  ]

  const getTypeLabel = (type: SearchResult['type']) => {
    switch (type) {
      case 'client': return 'Cliente'
      case 'order': return 'Ordem'
      case 'service': return 'Serviço'
    }
  }

  const getTypeIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'client': return '👤'
      case 'order': return '📋'
      case 'service': return '✂️'
    }
  }

  const handleSelect = (url: string) => {
    setOpen(false)
    setSearch('')
    router.push(url)
  }

  return (
    <>
      <Button
        variant="outline"
        className="w-full justify-start text-muted-foreground text-sm"
        onClick={() => setOpen(true)}
        size="sm"
      >
        <Search className="h-4 w-4 mr-2 shrink-0" />
        <span className="truncate">Buscar...</span>
        <kbd className="ml-auto hidden sm:inline-flex pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
          placeholder="Buscar clientes, ordens, serviços..." 
          value={search}
          onValueChange={setSearch}
        />
        <CommandList>
          <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
          
          {searchResults.length > 0 && (
            <CommandGroup heading="Resultados">
              {searchResults.map((result) => (
                <CommandItem
                  key={`${result.type}-${result.id}`}
                  onSelect={() => handleSelect(result.url)}
                  className="cursor-pointer"
                >
                  <span className="mr-2">{getTypeIcon(result.type)}</span>
                  <div className="flex-1">
                    <div className="font-medium">{result.title}</div>
                    {result.subtitle && (
                      <div className="text-xs text-muted-foreground">{result.subtitle}</div>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground ml-2">
                    {getTypeLabel(result.type)}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}
