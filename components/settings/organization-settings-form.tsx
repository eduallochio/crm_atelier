'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { organizationSettingsSchema, type OrganizationSettingsInput } from '@/lib/validations/settings'
import { useOrganizationSettings, useUpdateOrganizationSettings } from '@/hooks/use-settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Loader2, Search, Edit, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { buscarCep, formatarCep } from '@/lib/services/viacep'
import { toast } from 'sonner'

export function OrganizationSettingsForm() {
  const { data: settings, isLoading } = useOrganizationSettings()
  const updateSettings = useUpdateOrganizationSettings()
  const [isLoadingCep, setIsLoadingCep] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const form = useForm({
    resolver: zodResolver(organizationSettingsSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      cnpj: '',
      address: '',
      city: '',
      state: '',
      zip_code: '',
      website: '',
    },
  })

  useEffect(() => {
    if (settings) {
      form.reset({
        name: settings.name || '',
        email: settings.email || '',
        phone: settings.phone || '',
        cnpj: settings.cnpj || '',
        address: settings.address || '',
        city: settings.city || '',
        state: settings.state || '',
        zip_code: settings.zip_code || '',
        website: settings.website || '',
      })
    }
  }, [settings, form])

  const onSubmit = (data: OrganizationSettingsInput) => {
    if (settings?.id) {
      updateSettings.mutate(
        { ...data, id: settings.id },
        {
          onSuccess: () => {
            toast.success('Configurações salvas com sucesso!')
            setIsEditing(false)
          },
        }
      )
    }
  }

  const handleCancel = () => {
    if (settings) {
      form.reset({
        name: settings.name || '',
        email: settings.email || '',
        phone: settings.phone || '',
        cnpj: settings.cnpj || '',
        address: settings.address || '',
        city: settings.city || '',
        state: settings.state || '',
        zip_code: settings.zip_code || '',
        website: settings.website || '',
      })
    }
    setIsEditing(false)
  }

  const handleBuscarCep = async () => {
    const cep = form.getValues('zip_code')
    if (!cep) {
      toast.error('Digite um CEP para buscar')
      return
    }

    setIsLoadingCep(true)
    try {
      const data = await buscarCep(cep)
      if (data) {
        form.setValue('address', data.logradouro)
        form.setValue('city', data.localidade)
        form.setValue('state', data.uf)
        form.setValue('zip_code', formatarCep(data.cep))
        toast.success('Endereço encontrado!')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao buscar CEP')
    } finally {
      setIsLoadingCep(false)
    }
  }

  const handleCepBlur = () => {
    if (!isEditing) return
    const cep = form.getValues('zip_code')
    if (cep && cep.replace(/\D/g, '').length === 8) {
      handleBuscarCep()
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Informações da Empresa</h2>
        {!isEditing && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
        )}
      </div>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Empresa *</Label>
            <Input
              id="name"
              {...form.register('name')}
              placeholder="Ateliê da Maria"
              disabled={!isEditing}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cnpj">CNPJ / CPF</Label>
            <Input
              id="cnpj"
              {...form.register('cnpj')}
              placeholder="00.000.000/0000-00"
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              {...form.register('email')}
              placeholder="contato@atelie.com.br"
              disabled={!isEditing}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              {...form.register('phone')}
              placeholder="(11) 98888-8888"
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="address">Endereço</Label>
            <Input
              id="address"
              {...form.register('address')}
              placeholder="Rua das Flores, 123"
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">Cidade</Label>
            <Input
              id="city"
              {...form.register('city')}
              placeholder="São Paulo"
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="state">Estado</Label>
            <Input
              id="state"
              {...form.register('state')}
              placeholder="SP"
              maxLength={2}
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="zip_code">CEP</Label>
            <div className="flex gap-2">
              <Input
                id="zip_code"
                {...form.register('zip_code')}
                placeholder="00000-000"
                maxLength={9}
                onBlur={handleCepBlur}
                disabled={!isEditing}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleBuscarCep}
                disabled={isLoadingCep || !isEditing}
              >
                {isLoadingCep ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Digite o CEP e pressione Enter ou clique na lupa
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              {...form.register('website')}
              placeholder="https://www.atelie.com.br"
              disabled={!isEditing}
            />
            {form.formState.errors.website && (
              <p className="text-sm text-red-500">{form.formState.errors.website.message}</p>
            )}
          </div>
        </div>

        {isEditing && (
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCancel}
              disabled={updateSettings.isPending}
            >
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button type="submit" disabled={updateSettings.isPending}>
              {updateSettings.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Alterações'
              )}
            </Button>
          </div>
        )}

        {!isEditing && (
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground text-center">
              Clique em &quot;Editar&quot; para modificar as informações da empresa
            </p>
          </div>
        )}

      </form>
    </Card>
  )
}
