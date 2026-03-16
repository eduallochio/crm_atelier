export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          plan: 'free' | 'pro'
          stripe_customer_id: string | null
          subscription_status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          plan?: 'free' | 'pro'
          stripe_customer_id?: string | null
          subscription_status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          plan?: 'free' | 'pro'
          stripe_customer_id?: string | null
          subscription_status?: string
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          organization_id: string
          email: string
          full_name: string | null
          role: 'owner' | 'admin' | 'member'
          is_owner: boolean
          created_at: string
        }
        Insert: {
          id: string
          organization_id: string
          email: string
          full_name?: string | null
          role?: 'owner' | 'admin' | 'member'
          is_owner?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          email?: string
          full_name?: string | null
          role?: 'owner' | 'admin' | 'member'
          is_owner?: boolean
          created_at?: string
        }
      }
      org_clients: {
        Row: {
          id: string
          organization_id: string
          nome: string
          telefone: string | null
          email: string | null
          endereco: string | null
          data_cadastro: string
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          nome: string
          telefone?: string | null
          email?: string | null
          endereco?: string | null
          data_cadastro?: string
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          nome?: string
          telefone?: string | null
          email?: string | null
          endereco?: string | null
          data_cadastro?: string
          created_at?: string
        }
      }
      org_services: {
        Row: {
          id: string
          organization_id: string
          nome: string
          tipo: string | null
          valor: number | null
          descricao: string | null
          ativo: boolean
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          nome: string
          tipo?: string | null
          valor?: number | null
          descricao?: string | null
          ativo?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          nome?: string
          tipo?: string | null
          valor?: number | null
          descricao?: string | null
          ativo?: boolean
          created_at?: string
        }
      }
      org_service_orders: {
        Row: {
          id: string
          organization_id: string
          client_id: string | null
          status: 'pendente' | 'em_andamento' | 'concluido' | 'cancelado'
          valor_total: number | null
          data_abertura: string
          data_prevista: string | null
          data_conclusao: string | null
          observacoes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          client_id?: string | null
          status?: 'pendente' | 'em_andamento' | 'concluido' | 'cancelado'
          valor_total?: number | null
          data_abertura?: string
          data_prevista?: string | null
          data_conclusao?: string | null
          observacoes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          client_id?: string | null
          status?: 'pendente' | 'em_andamento' | 'concluido' | 'cancelado'
          valor_total?: number | null
          data_abertura?: string
          data_prevista?: string | null
          data_conclusao?: string | null
          observacoes?: string | null
          created_at?: string
        }
      }
      customization_settings: {
        Row: {
          id: string
          organization_id: string
          primary_color: string
          secondary_color: string
          logo_url: string | null
          atelier_name: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          primary_color?: string
          secondary_color?: string
          logo_url?: string | null
          atelier_name?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          primary_color?: string
          secondary_color?: string
          logo_url?: string | null
          atelier_name?: string | null
          updated_at?: string
        }
      }
      usage_metrics: {
        Row: {
          id: string
          organization_id: string
          clients_count: number
          orders_count: number
          users_count: number
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          clients_count?: number
          orders_count?: number
          users_count?: number
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          clients_count?: number
          orders_count?: number
          users_count?: number
          updated_at?: string
        }
      }
    }
  }
}
