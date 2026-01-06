import { Header } from '@/components/layouts/header'

export default function ProfilePage() {
  return (
    <div>
      <Header 
        title="Configurações"
        description="Gerencie suas configurações e perfil"
      />
      <div className="p-4 sm:p-6 lg:p-8">
        <p className="text-gray-500">Configurações em desenvolvimento...</p>
      </div>
    </div>
  )
}
