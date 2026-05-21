'use client'

import { useInactivityLogout } from '@/hooks/use-inactivity-logout'

export function SessionGuard({ children }: { children: React.ReactNode }) {
  useInactivityLogout()
  return <>{children}</>
}
