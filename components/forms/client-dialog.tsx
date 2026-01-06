'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { clientSchema, type ClientInput, type Client } from '@/lib/validations/client'
import { useCreateClient, useUpdateClient } from '@/hooks/use-clients'
import { buscarCep, formatarCep } from '@/lib/services/viacep'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Search } from 'lucide-react'
import { toast } from 'sonner'

interface ClientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  client?: Client | null
}

export function ClientDialog({ open, onOpenChange, client }: ClientDialogProps) {
  const [buscandoCep, setBuscandoCep] = useState(false)
  const createClient = useCreateClient()
  const updateClient = useUpdateClient()
  const isEditing = !!client

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<ClientInput>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      nome: '',
      telefone: '',
      email: '',
      data_nascimento: '',
      observacoes: '',
      cep: '',
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: '',
    },
  })

  const cep = watch('cep')

  // Reset form quando abrir/fechar ou mudar cliente
  useEffect(() => {
    if (open) {
      if (client) {
        reset({
          nome: client.nome,
          telefone: client.telefone || '',
          email: client.email || '',
          data_nascimento: client.data_nascimento || '',
          observacoes: client.observacoes || '',
          cep: client.cep || '',
          logradouro: client.logradouro || '',
          numero: client.numero || '',
          complemento: client.complemento || '',
          bairro: client.bairro || '',
          cidade: client.cidade || '',
          estado: client.estado || '',
        })
      } else {
        reset({
          nome: '',
          telefone: '',
          email: '',
          data_nascimento: '',
          observacoes: '',
          cep: '',
          logradouro: '',
          numero: '',
          complemento: '',
          bairro: '',
          cidade: '',
          estado: '',
        })
      }
    }
  }, [open, client, reset])

  const handleBuscarCep = async () => {
    if (!cep || cep.replace(/\D/g, '').length !== 8) {
      toast.error('Digite um CEP válido com 8 dígitos')
      return
    }

    setBuscandoCep(true)
    try {
      const data = await buscarCep(cep)
      
      if (data) {
        setValue('logradouro', data.logradouro)
        setValue('bairro', data.bairro)
        setValue('cidade', data.localidade)
        setValue('estado', data.uf)
        setValue('cep', formatarCep(data.cep))
        
        toast.success('Endereço encontrado!')
        
        // Foca no campo número após preencher
        setTimeout(() => {
          document.getElementById('numero')?.focus()
        }, 100)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao buscar CEP')
    } finally {
      setBuscandoCep(false)
    }
  }

  const onSubmit = async (data: ClientInput) => {
    if (isEditing) {
      await updateClient.mutateAsync({ id: client.id, input: data })
    } else {
      await createClient.mutateAsync(data)
    }
    onOpenChange(false)
  }

  const isLoading = createClient.isPending || updateClient.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-125 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Cliente' : 'Novo Cliente'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Atualize as informações do cliente'
              : 'Preencha os dados do novo cliente'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">
              Nome <span className="text-red-500">*</span>
            </Label>
            <Input
              id="nome"
              placeholder="Nome completo"
              {...register('nome')}
              disabled={isLoading}
            />
            {errors.nome && (
              <p className="text-sm text-red-500">{errors.nome.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefone">Telefone</Label>
            <Input
              id="telefone"
              placeholder="(00) 00000-0000"
              {...register('telefone')}
              disabled={isLoading}
            />
            {errors.telefone && (
              <p className="text-sm text-red-500">{errors.telefone.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="cliente@email.com"
              {...register('email')}
              disabled={isLoading}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="data_nascimento">Data de Nascimento</Label>
            <Input
              id="data_nascimento"
              type="date"
              {...register('data_nascimento')}
              disabled={isLoading}
            />
            {errors.data_nascimento && (
              <p className="text-sm text-red-500">{errors.data_nascimento.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <textarea
              id="observacoes"
              placeholder="Notas e observações sobre o cliente..."
              {...register('observacoes')}
              disabled={isLoading}
              className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
            {errors.observacoes && (
              <p className="text-sm text-red-500">{errors.observacoes.message}</p>
            )}
          </div>

          {/* Endereço */}
          <div className="space-y-4 pt-2 border-t">
            <h3 className="font-medium text-sm text-gray-700">Endereço</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="cep">CEP</Label>
                <div className="flex gap-2">
                  <Input
                    id="cep"
                    placeholder="00000-000"
                    {...register('cep')}
                    disabled={isLoading || buscandoCep}
                    maxLength={9}
                    onChange={(e) => {
                      const valor = e.target.value.replace(/\D/g, '')
                      e.target.value = formatarCep(valor)
                      register('cep').onChange(e)
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleBuscarCep}
                    disabled={isLoading || buscandoCep}
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="numero">Número</Label>
                <Input
                  id="numero"
                  placeholder="123"
                  {...register('numero')}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="logradouro">Logradouro</Label>
              <Input
                id="logradouro"
                placeholder="Rua, Avenida, etc"
                {...register('logradouro')}
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="complemento">Complemento</Label>
                <Input
                  id="complemento"
                  placeholder="Apto, Bloco, etc"
                  {...register('complemento')}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bairro">Bairro</Label>
                <Input
                  id="bairro"
                  placeholder="Centro"
                  {...register('bairro')}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  placeholder="São Paulo"
                  {...register('cidade')}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estado">Estado</Label>
                <Input
                  id="estado"
                  placeholder="SP"
                  {...register('estado')}
                  disabled={isLoading}
                  maxLength={2}
                  onChange={(e) => {
                    e.target.value = e.target.value.toUpperCase()
                    register('estado').onChange(e)
                  }}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvando...' : isEditing ? 'Atualizar' : 'Cadastrar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
