'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { 
  Plus, 
  Loader2, 
  Trash2, 
  Edit, 
  GripVertical,
  Check,
  X
} from 'lucide-react'
import {
  usePaymentMethods,
  useCreatePaymentMethod,
  useUpdatePaymentMethod,
  useDeletePaymentMethod,
  type PaymentMethod,
} from '@/hooks/use-payment-methods'
import { useFinancialSettings, useUpdateFinancialSettings } from '@/hooks/use-settings'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export function FinancialSettingsForm() {
  const { data: paymentMethods, isLoading } = usePaymentMethods()
  const createMethod = useCreatePaymentMethod()
  const updateMethod = useUpdatePaymentMethod()
  const deleteMethod = useDeletePaymentMethod()
  const { data: financialSettings } = useFinancialSettings()
  const updateFinancialSettings = useUpdateFinancialSettings()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    color: '#3b82f6',
    enabled: true,
  })
  const [pixKey, setPixKey] = useState('')
  const [showPixOnOrder, setShowPixOnOrder] = useState(false)
  const [pixSaving, setPixSaving] = useState(false)

  // Sync local state when financial settings load
  useEffect(() => {
    if (financialSettings) {
      setPixKey(financialSettings.pix_key || '')
      setShowPixOnOrder(financialSettings.show_pix_key_on_order || false)
    }
  }, [financialSettings])

  const handleSavePix = async () => {
    if (!financialSettings) return
    setPixSaving(true)
    try {
      await updateFinancialSettings.mutateAsync({
        organization_id: financialSettings.organization_id,
        payment_methods: financialSettings.payment_methods,
        cashier_requires_opening: financialSettings.cashier_requires_opening,
        cashier_opening_balance_required: financialSettings.cashier_opening_balance_required,
        late_fee_percentage: financialSettings.late_fee_percentage,
        interest_rate_per_month: financialSettings.interest_rate_per_month,
        expense_categories: financialSettings.expense_categories,
        income_categories: financialSettings.income_categories,
        pix_key: pixKey,
        show_pix_key_on_order: showPixOnOrder,
      })
      toast.success('Configurações PIX salvas!')
    } catch {
      toast.error('Erro ao salvar configurações PIX')
    } finally {
      setPixSaving(false)
    }
  }

  const handleOpenDialog = (method?: PaymentMethod) => {
    if (method) {
      setEditingMethod(method)
      setFormData({
        name: method.name,
        color: method.color || '#3b82f6',
        enabled: method.enabled,
      })
    } else {
      setEditingMethod(null)
      setFormData({
        name: '',
        color: '#3b82f6',
        enabled: true,
      })
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingMethod(null)
    setFormData({
      name: '',
      color: '#3b82f6',
      enabled: true,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editingMethod) {
      await updateMethod.mutateAsync({
        id: editingMethod.id,
        name: formData.name,
        color: formData.color,
        enabled: formData.enabled,
      })
    } else {
      // Gerar código automaticamente a partir do nome
      const code = formData.name.toLowerCase().replace(/\s+/g, '_')
      await createMethod.mutateAsync({
        name: formData.name,
        code: code,
        color: formData.color,
        enabled: formData.enabled,
      })
    }
    
    handleCloseDialog()
  }

  const handleToggleEnabled = async (method: PaymentMethod) => {
    await updateMethod.mutateAsync({
      id: method.id,
      enabled: !method.enabled,
    })
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja remover esta forma de pagamento?')) {
      await deleteMethod.mutateAsync(id)
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
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold">Formas de Pagamento</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Gerencie as formas de pagamento disponíveis no seu estabelecimento
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar
          </Button>
        </div>

        <div className="space-y-3">
          {paymentMethods && paymentMethods.length > 0 ? (
            paymentMethods.map((method) => (
              <div
                key={method.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                  
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: method.color || '#3b82f6' }}
                  />
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{method.name}</p>
                      {method.is_default && (
                        <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">
                          Padrão
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Código: {method.code}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Switch
                    checked={method.enabled}
                    onCheckedChange={() => handleToggleEnabled(method)}
                    disabled={updateMethod.isPending}
                  />

                  {!method.is_default && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(method)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(method.id)}
                        disabled={deleteMethod.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhuma forma de pagamento cadastrada</p>
              <p className="text-sm mt-1">
                Clique em "Adicionar" para criar a primeira
              </p>
            </div>
          )}
        </div>

        {paymentMethods && paymentMethods.length > 0 && (
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              💡 <strong>Dica:</strong> Use o switch para ativar/desativar formas de pagamento sem removê-las.
              As formas padrão não podem ser editadas ou removidas, mas podem ser desativadas.
            </p>
          </div>
        )}
      </Card>

      {/* Chave PIX */}
      <Card className="p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Chave PIX</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure a chave PIX para exibição nas Ordens de Serviço
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pix_key">Chave PIX</Label>
            <Input
              id="pix_key"
              placeholder="CPF, CNPJ, e-mail, telefone ou chave aleatória"
              value={pixKey}
              onChange={(e) => setPixKey(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Ex: 11999999999, email@exemplo.com, 12.345.678/0001-90
            </p>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <Label htmlFor="show_pix" className="cursor-pointer">Mostrar chave PIX na OS</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Exibe a chave PIX no preview e PDF da OS quando o pagamento for PIX
              </p>
            </div>
            <Switch
              id="show_pix"
              checked={showPixOnOrder}
              onCheckedChange={setShowPixOnOrder}
            />
          </div>

          <Button
            onClick={handleSavePix}
            disabled={pixSaving}
            size="sm"
          >
            {pixSaving && <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />}
            Salvar configurações PIX
          </Button>
        </div>
      </Card>

      {/* Dialog para criar/editar */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingMethod ? 'Editar Forma de Pagamento' : 'Nova Forma de Pagamento'}
            </DialogTitle>
            <DialogDescription>
              {editingMethod 
                ? 'Atualize as informações da forma de pagamento'
                : 'Adicione uma nova forma de pagamento personalizada'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Cartão Vale"
                required
              />
              {!editingMethod && formData.name && (
                <p className="text-xs text-muted-foreground">
                  Código gerado automaticamente: <span className="font-mono">{formData.name.toLowerCase().replace(/\s+/g, '_')}</span>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Cor</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-20 h-10"
                />
                <Input
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="#3b82f6"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="enabled" className="cursor-pointer">
                Forma de pagamento ativa
              </Label>
              <Switch
                id="enabled"
                checked={formData.enabled}
                onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={createMethod.isPending || updateMethod.isPending}
              >
                {(createMethod.isPending || updateMethod.isPending) ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    {editingMethod ? 'Atualizar' : 'Criar'}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}