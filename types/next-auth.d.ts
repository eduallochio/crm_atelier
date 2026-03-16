import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface User {
    organizationId: string
    role: string
    isOwner: boolean
    isMaster: boolean
  }

  interface Session {
    user: {
      id: string
      email: string
      name: string
      organizationId: string
      role: string
      isOwner: boolean
      isMaster: boolean
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    organizationId: string
    role: string
    isOwner: boolean
    isMaster: boolean
  }
}
