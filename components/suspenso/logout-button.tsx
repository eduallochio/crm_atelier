'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      style={{
        background: 'none',
        border: 'none',
        fontSize: 13,
        color: '#a07850',
        cursor: 'pointer',
        textDecoration: 'underline',
      }}
    >
      Sair da conta
    </button>
  )
}
