'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { organizationSettingsSchema, type OrganizationSettingsInput } from '@/lib/validations/settings'
import { useOrganizationSettings, useUpdateOrganizationSettings } from '@/hooks/use-settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Loader2, Search, Edit, X, Upload, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { buscarCep, formatarCep } from '@/lib/services/viacep'
import { toast } from 'sonner'
import Image from 'next/image'

export function OrganizationSettingsForm() {
  const { data: settings, isLoading } = useOrganizationSettings()
  const updateSettings = useUpdateOrganizationSettings()
  const [isLoadingCep, setIsLoadingCep] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

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
      logo_url: '',
      instagram: '',
      facebook: '',
      twitter: '',
      tiktok: '',
      kwai: '',
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
        logo_url: settings.logo_url || '',
        instagram: settings.instagram || '',
        facebook: settings.facebook || '',
        twitter: settings.twitter || '',
        tiktok: settings.tiktok || '',
        kwai: settings.kwai || '',
      })
      setLogoPreview(settings.logo_url || null)
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
        logo_url: settings.logo_url || '',
        instagram: settings.instagram || '',
        facebook: settings.facebook || '',
        twitter: settings.twitter || '',
        tiktok: settings.tiktok || '',
        kwai: settings.kwai || '',
      })
      setLogoPreview(settings.logo_url || null)
    }
    setIsEditing(false)
  }

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem válida')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 2MB')
      return
    }

    setIsUploadingLogo(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload/logo', { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Erro ao fazer upload')
      const { url } = await res.json()

      setLogoPreview(url)
      form.setValue('logo_url', url)
      toast.success('Logo carregado com sucesso!')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao fazer upload do logo')
    } finally {
      setIsUploadingLogo(false)
    }
  }

  const handleRemoveLogo = () => {
    setLogoPreview(null)
    form.setValue('logo_url', '')
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
        {/* Logo da Empresa */}
        <div className="space-y-3 pb-4 border-b">
          <Label>Logo da Empresa</Label>
          <div className="flex items-start gap-4">
            {/* Preview do Logo */}
            <div className="shrink-0">
              {logoPreview ? (
                <div className="relative group">
                  <Image 
                    src={logoPreview} 
                    alt="Logo da Empresa" 
                    width={96}
                    height={96}
                    className="h-24 w-24 object-contain rounded-lg border-2 border-gray-200"
                  />
                  {isEditing && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="h-24 w-24 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                  <Upload className="h-8 w-8 text-gray-400" />
                </div>
              )}
            </div>

            {/* Upload Button */}
            <div className="flex-1 space-y-2">
              <input
                type="file"
                id="logo-upload"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
                disabled={!isEditing || isUploadingLogo}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('logo-upload')?.click()}
                disabled={!isEditing || isUploadingLogo}
                className="w-full sm:w-auto"
              >
                {isUploadingLogo ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    {logoPreview ? 'Alterar Logo' : 'Enviar Logo'}
                  </>
                )}
              </Button>
              <p className="text-xs text-gray-500">
                Formatos aceitos: JPG, PNG, GIF. Tamanho máximo: 2MB
              </p>
            </div>
          </div>
        </div>

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

        {/* Redes Sociais */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">Redes Sociais</h3>
            <span className="text-xs text-muted-foreground">(aparecerá na OS enviada ao cliente)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="instagram">Instagram</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground shrink-0">@</span>
                <Input
                  id="instagram"
                  {...form.register('instagram')}
                  placeholder="seu.atelie"
                  disabled={!isEditing}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="facebook">Facebook</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground shrink-0">@</span>
                <Input
                  id="facebook"
                  {...form.register('facebook')}
                  placeholder="seu.atelie"
                  disabled={!isEditing}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="twitter">X (Twitter)</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground shrink-0">@</span>
                <Input
                  id="twitter"
                  {...form.register('twitter')}
                  placeholder="seuatelie"
                  disabled={!isEditing}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tiktok">TikTok</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground shrink-0">@</span>
                <Input
                  id="tiktok"
                  {...form.register('tiktok')}
                  placeholder="seuatelie"
                  disabled={!isEditing}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="kwai">Kwai</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground shrink-0">@</span>
                <Input
                  id="kwai"
                  {...form.register('kwai')}
                  placeholder="seuatelie"
                  disabled={!isEditing}
                />
              </div>
            </div>
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
