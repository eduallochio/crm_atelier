export const PLAN_LIMITS = {
  free: {
    maxClients: 50,
    maxUsers: 1,
    maxOrders: Infinity,
  },
  enterprise: {
    maxClients: Infinity,
    maxUsers: Infinity,
    maxOrders: Infinity,
  },
} as const

export const ORDER_STATUS = {
  pendente: 'Pendente',
  em_andamento: 'Em Andamento',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
} as const

export const USER_ROLES = {
  owner: 'Proprietário',
  admin: 'Administrador',
  member: 'Membro',
} as const
