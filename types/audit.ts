export interface AuditLog {
  id: string
  timestamp: string
  admin: {
    name: string
    email: string
  }
  action: 'create' | 'update' | 'delete' | 'login' | 'logout' | 'export'
  resource: string
  resourceId?: string
  details: string
  ip: string
  userAgent?: string
}
