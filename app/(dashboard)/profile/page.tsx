'use client'

import { useState, useEffect, useCallback } from 'react'
import { Header } from '@/components/layouts/header'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { User, Shield, Camera, Calendar, Monitor, Smartphone, Laptop, LogOut, AlertTriangle } from 'lucide-react'
import { Loader } from '@/components/ui/loader'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'

interface UserProfile {
  id: string
  email: string
  full_name: string
  role: string
  created_at: string
}

interface Session {
  factor_id: string
  created_at: string
  updated_at: string
  current?: boolean
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [fullName, setFullName] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [sessions, setSessions] = useState<Session[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingSessions, setIsLoadingSessions] = useState(true)

  const loadSessions = useCallback(() => {
    setIsLoadingSessions(true)
    // NextAuth não expõe lista de sessões — mostramos a sessão atual
    setSessions([{
      factor_id: 'current',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      current: true,
    }])
    setIsLoadingSessions(false)
  }, [])

  useEffect(() => {
    async function loadProfile() {
      const res = await fetch('/api/profile')
      if (!res.ok) return
      const data = await res.json() as UserProfile
      setProfile(data)
      setFullName(data.full_name || '')
    }
    loadProfile()
    loadSessions()
  }, [loadSessions])

  const getDeviceInfo = () => {
    const ua = navigator.userAgent
    let deviceType = Monitor
    let browser = 'Navegador Desconhecido'

    if (/mobile/i.test(ua)) {
      deviceType = Smartphone
    } else if (/tablet/i.test(ua)) {
      deviceType = Laptop
    }

    if (ua.includes('Chrome') && !ua.includes('Edg')) {
      browser = 'Chrome'
    } else if (ua.includes('Firefox')) {
      browser = 'Firefox'
    } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
      browser = 'Safari'
    } else if (ua.includes('Edg')) {
      browser = 'Edge'
    } else if (ua.includes('Opera') || ua.includes('OPR')) {
      browser = 'Opera'
    }

    let os = 'Sistema Desconhecido'
    if (ua.includes('Win')) os = 'Windows'
    else if (ua.includes('Mac')) os = 'macOS'
    else if (ua.includes('Linux')) os = 'Linux'
    else if (ua.includes('Android')) os = 'Android'
    else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS'

    return { deviceType, deviceName: `${browser} no ${os}` }
  }

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleSaveProfile = async () => {
    setIsSaving(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName }),
      })
      if (!res.ok) throw new Error('Erro ao salvar')
      const updated = await res.json() as UserProfile
      setProfile(updated)
      toast.success('Perfil atualizado com sucesso!')
    } catch {
      toast.error('Erro ao salvar perfil')
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem')
      return
    }
    if (newPassword.length < 8) {
      toast.error('A nova senha deve ter pelo menos 8 caracteres')
      return
    }
    setIsSaving(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erro ao alterar senha')
      }
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      toast.success('Senha alterada com sucesso!')
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div>
      <Header
        title="Meu Perfil"
        description="Gerencie suas informações pessoais e segurança"
      />

      <div className="p-6 max-w-7xl mx-auto">
        <Tabs defaultValue="personal" className="space-y-6">
          <TabsList className="bg-muted">
            <TabsTrigger value="personal" className="gap-2">
              <User className="h-4 w-4" />
              Informações Pessoais
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Shield className="h-4 w-4" />
              Segurança
            </TabsTrigger>
          </TabsList>

          {/* Informações Pessoais */}
          <TabsContent value="personal" className="space-y-6">
            <Card className="p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">Foto de Perfil</h3>
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
                        {(fullName || profile?.email || 'U').charAt(0).toUpperCase()}
                      </div>
                      <button className="absolute bottom-0 right-0 p-2 bg-card border border-border rounded-full hover:bg-accent transition-colors">
                        <Camera className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-2">
                        Clique no ícone de câmera para atualizar sua foto de perfil
                      </p>
                      <p className="text-xs text-muted-foreground">
                        JPG, PNG ou GIF. Tamanho máximo: 2MB
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome Completo</Label>
                    <Input
                      id="name"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      placeholder="Seu nome completo"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile?.email || ''}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                      O e-mail não pode ser alterado
                    </p>
                  </div>
                </div>

                {profile?.created_at && (
                  <div className="flex items-center gap-3 pt-4 border-t border-border">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Membro desde</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDateTime(profile.created_at)}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" onClick={() => setFullName(profile?.full_name || '')}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveProfile} disabled={isSaving}>
                    {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Segurança */}
          <TabsContent value="security" className="space-y-6">
            {/* Alterar Senha */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Alterar Senha</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Senha Atual</Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    placeholder="Digite sua senha atual"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">Nova Senha</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Digite a nova senha"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Confirme a nova senha"
                    />
                  </div>
                </div>

                <div className="bg-muted rounded-lg p-4">
                  <p className="text-sm font-medium text-foreground mb-2">
                    Requisitos da senha:
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Mínimo de 8 caracteres</li>
                    <li>• Pelo menos uma letra maiúscula</li>
                    <li>• Pelo menos um número</li>
                    <li>• Pelo menos um caractere especial</li>
                  </ul>
                </div>

                <Button onClick={handleChangePassword} disabled={isSaving}>
                  {isSaving ? 'Alterando...' : 'Alterar Senha'}
                </Button>
              </div>
            </Card>

            {/* Dispositivos Conectados */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Dispositivos Conectados
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Gerencie os dispositivos que estão conectados à sua conta
              </p>

              {isLoadingSessions ? (
                <Loader />
              ) : sessions.length > 0 ? (
                <div className="space-y-4">
                  {sessions.map((session, index) => {
                    const deviceInfo = getDeviceInfo()
                    const Icon = deviceInfo.deviceType

                    return (
                      <div
                        key={session.factor_id || index}
                        className="flex items-start justify-between p-4 bg-muted rounded-lg border border-border"
                      >
                        <div className="flex items-start gap-4">
                          <div className="p-2 bg-card border border-border rounded-lg">
                            <Icon className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-foreground">
                                {deviceInfo.deviceName}
                              </h4>
                              {session.current && (
                                <span className="px-2 py-0.5 bg-green-100 dark:bg-green-950/50 text-green-800 dark:text-green-400 text-xs font-medium rounded-full">
                                  Este dispositivo
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">Sessão atual</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Última atividade: {formatDateTime(session.updated_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="p-4 bg-muted rounded-full mb-4">
                    <AlertTriangle className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Nenhuma sessão ativa encontrada
                  </p>
                </div>
              )}

              <div className="mt-6 space-y-4">
                <Alert variant="warning">
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    <p className="mb-3">
                      <strong>Dica de segurança:</strong> Se você suspeita que sua conta foi comprometida,
                      altere sua senha imediatamente.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadSessions}
                      disabled={isSaving}
                      className="border-yellow-300 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-950/30"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Renovar Sessão de Segurança
                    </Button>
                  </AlertDescription>
                </Alert>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
