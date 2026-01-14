# 🎛️ Painel Administrativo - CRM Ateliê

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Estrutura de Banco de Dados](#estrutura-de-banco-de-dados)
4. [Estrutura de Rotas e Páginas](#estrutura-de-rotas-e-páginas)
5. [Sistema de Autenticação e Permissões](#sistema-de-autenticação-e-permissões)
6. [Componentes e Features](#componentes-e-features)
7. [Plano de Implementação](#plano-de-implementação)
8. [Checklist de Desenvolvimento](#checklist-de-desenvolvimento)

---

## 🎯 Visão Geral

### Objetivo
Criar um painel administrativo completo para gerenciar os assinantes do CRM Ateliê, incluindo:
- Gestão de organizações/assinantes
- Controle de planos e assinaturas
- Faturamento e pagamentos
- Analytics e relatórios
- Logs de auditoria

### Modelo de Acesso
- **Rota:** `/admin/*`
- **Mesmo projeto:** Integrado ao projeto existente
- **Autenticação:** Via role no banco de dados
- **Proteção:** Middleware + RLS no Supabase

---

## 🏗️ Arquitetura

### Estrutura de Pastas

```
app/
  (auth)/                     → Login/Cadastro público
  (dashboard)/                → CRM dos ateliês (usuários regulares)
  (admin)/                    → ✨ NOVO: Painel administrativo
    layout.tsx                → Layout protegido com verificação de role
    page.tsx                  → Redirect para /admin/dashboard
    
    dashboard/
      page.tsx                → Dashboard principal com KPIs
      
    organizations/
      page.tsx                → Lista de organizações
      [id]/
        page.tsx              → Detalhes da organização
        layout.tsx            → Layout com tabs
        overview/
          page.tsx            → Visão geral
        subscription/
          page.tsx            → Gestão de assinatura
        usage/
          page.tsx            → Métricas de uso
        billing/
          page.tsx            → Histórico de faturamento
        users/
          page.tsx            → Usuários da organização
        activity/
          page.tsx            → Logs de atividade
        notes/
          page.tsx            → Notas internas
          
    subscriptions/
      page.tsx                → Gestão de planos
      [planId]/
        page.tsx              → Edição de plano
        
    billing/
      page.tsx                → Faturamento global
      invoices/
        page.tsx              → Lista de faturas
      payments/
        page.tsx              → Pagamentos
        
    analytics/
      page.tsx                → Relatórios e analytics
      growth/
        page.tsx              → Análise de crescimento
      churn/
        page.tsx              → Análise de churn
      revenue/
        page.tsx              → Análise de receita
        
    users/
      page.tsx                → Gestão de usuários do sistema
      
    logs/
      page.tsx                → Logs de auditoria
      
    settings/
      page.tsx                → Configurações do admin

components/
  admin/                      → ✨ NOVO: Componentes específicos do admin
    admin-sidebar.tsx
    admin-header.tsx
    organization-card.tsx
    subscription-badge.tsx
    metrics-card.tsx
    revenue-chart.tsx
    usage-chart.tsx
    organization-table.tsx
    invoice-table.tsx
    activity-timeline.tsx
    plan-card.tsx
    
lib/
  admin/                      → ✨ NOVO: Utilitários do admin
    permissions.ts
    metrics-calculator.ts
    
hooks/
  admin/                      → ✨ NOVO: Hooks do admin
    use-admin-organizations.ts
    use-admin-metrics.ts
    use-admin-analytics.ts
```

---

## 🗄️ Estrutura de Banco de Dados

### Migrations Necessárias

#### 1️⃣ Adicionar Role aos Profiles
```sql
-- supabase/migrations/add-admin-role.sql

-- Adicionar campo role
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Adicionar constraint
ALTER TABLE profiles 
ADD CONSTRAINT check_role_valid 
CHECK (role IN ('user', 'admin', 'super_admin', 'support', 'billing'));

COMMENT ON COLUMN profiles.role IS 'user: usuário normal, admin: administrador, super_admin: super administrador, support: suporte, billing: financeiro';
```

#### 2️⃣ Tabela de Permissões Admin
```sql
-- supabase/migrations/create-admin-permissions.sql

CREATE TABLE IF NOT EXISTS admin_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Permissões específicas
  can_view_organizations BOOLEAN DEFAULT false,
  can_edit_organizations BOOLEAN DEFAULT false,
  can_delete_organizations BOOLEAN DEFAULT false,
  
  can_view_subscriptions BOOLEAN DEFAULT false,
  can_edit_subscriptions BOOLEAN DEFAULT false,
  
  can_view_billing BOOLEAN DEFAULT false,
  can_manage_billing BOOLEAN DEFAULT false,
  can_process_refunds BOOLEAN DEFAULT false,
  
  can_view_analytics BOOLEAN DEFAULT false,
  can_export_data BOOLEAN DEFAULT false,
  
  can_view_logs BOOLEAN DEFAULT false,
  can_manage_users BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- RLS
ALTER TABLE admin_permissions ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem ver permissões
CREATE POLICY "Admins can view permissions" ON admin_permissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Apenas super_admins podem editar
CREATE POLICY "Super admins can edit permissions" ON admin_permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'super_admin'
    )
  );

-- Trigger para updated_at
CREATE TRIGGER update_admin_permissions_updated_at
  BEFORE UPDATE ON admin_permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

#### 3️⃣ Tabela de Logs de Auditoria
```sql
-- supabase/migrations/create-admin-logs.sql

CREATE TABLE IF NOT EXISTS admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES profiles(id),
  
  -- Informações da ação
  action TEXT NOT NULL, -- 'view', 'create', 'update', 'delete', 'login', 'export'
  resource_type TEXT NOT NULL, -- 'organization', 'subscription', 'user', 'billing'
  resource_id UUID,
  
  -- Detalhes
  description TEXT,
  changes JSONB, -- Armazena old_value e new_value
  metadata JSONB, -- IP, user agent, etc
  
  -- Contexto
  organization_id UUID REFERENCES organizations(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Índices
  INDEX idx_admin_logs_admin_id (admin_id),
  INDEX idx_admin_logs_action (action),
  INDEX idx_admin_logs_resource (resource_type, resource_id),
  INDEX idx_admin_logs_created_at (created_at DESC)
);

-- RLS
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view logs" ON admin_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "System can insert logs" ON admin_logs
  FOR INSERT WITH CHECK (true);

COMMENT ON TABLE admin_logs IS 'Logs de auditoria de todas as ações administrativas';
```

#### 4️⃣ Tabela de Notas Internas
```sql
-- supabase/migrations/create-admin-notes.sql

CREATE TABLE IF NOT EXISTS admin_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id),
  
  note TEXT NOT NULL,
  is_important BOOLEAN DEFAULT false,
  tags TEXT[], -- Array de tags para categorização
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  INDEX idx_admin_notes_organization (organization_id),
  INDEX idx_admin_notes_created_at (created_at DESC)
);

-- RLS
ALTER TABLE admin_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage notes" ON admin_notes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin', 'support')
    )
  );

-- Trigger para updated_at
CREATE TRIGGER update_admin_notes_updated_at
  BEFORE UPDATE ON admin_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

#### 5️⃣ View para Métricas Agregadas
```sql
-- supabase/migrations/create-admin-metrics-views.sql

-- View de métricas por organização
CREATE OR REPLACE VIEW admin_organization_metrics AS
SELECT 
  o.id as organization_id,
  o.name as organization_name,
  o.plan,
  o.status,
  o.created_at,
  
  -- Contagem de recursos
  (SELECT COUNT(*) FROM profiles WHERE organization_id = o.id) as users_count,
  (SELECT COUNT(*) FROM org_clients WHERE organization_id = o.id) as clients_count,
  (SELECT COUNT(*) FROM org_service_orders WHERE organization_id = o.id) as orders_count,
  (SELECT COUNT(*) FROM org_services WHERE organization_id = o.id) as services_count,
  
  -- Métricas financeiras (últimos 30 dias)
  (SELECT COALESCE(SUM(valor_total), 0) 
   FROM org_service_orders 
   WHERE organization_id = o.id 
   AND status = 'concluido'
   AND data_conclusao >= NOW() - INTERVAL '30 days') as revenue_last_30_days,
  
  -- Último acesso
  (SELECT MAX(last_sign_in_at) FROM profiles WHERE organization_id = o.id) as last_access,
  
  -- Status de uso vs limite
  CASE 
    WHEN o.plan = 'free' THEN 
      (SELECT COUNT(*) FROM org_clients WHERE organization_id = o.id) >= 50
    ELSE false
  END as reached_limit

FROM organizations o;

-- View de métricas globais (dashboard)
CREATE OR REPLACE VIEW admin_global_metrics AS
SELECT 
  -- Total de organizações
  (SELECT COUNT(*) FROM organizations) as total_organizations,
  (SELECT COUNT(*) FROM organizations WHERE status = 'active') as active_organizations,
  (SELECT COUNT(*) FROM organizations WHERE status = 'trial') as trial_organizations,
  (SELECT COUNT(*) FROM organizations WHERE status = 'cancelled') as cancelled_organizations,
  
  -- Por plano
  (SELECT COUNT(*) FROM organizations WHERE plan = 'free') as free_plan_count,
  (SELECT COUNT(*) FROM organizations WHERE plan = 'pro') as pro_plan_count,
  (SELECT COUNT(*) FROM organizations WHERE plan = 'enterprise') as enterprise_plan_count,
  
  -- Novos esta semana
  (SELECT COUNT(*) FROM organizations WHERE created_at >= NOW() - INTERVAL '7 days') as new_this_week,
  (SELECT COUNT(*) FROM organizations WHERE created_at >= NOW() - INTERVAL '30 days') as new_this_month,
  
  -- Total de usuários
  (SELECT COUNT(*) FROM profiles) as total_users,
  (SELECT COUNT(DISTINCT organization_id) FROM profiles WHERE last_sign_in_at >= NOW() - INTERVAL '7 days') as active_orgs_this_week;

COMMENT ON VIEW admin_organization_metrics IS 'Métricas agregadas por organização para o painel admin';
COMMENT ON VIEW admin_global_metrics IS 'Métricas globais do sistema para o dashboard admin';
```

#### 6️⃣ Function para Criar Primeiro Super Admin
```sql
-- supabase/migrations/create-first-super-admin-function.sql

-- Function para promover usuário a super admin
CREATE OR REPLACE FUNCTION promote_to_super_admin(user_email TEXT)
RETURNS TEXT AS $$
DECLARE
  user_record profiles%ROWTYPE;
BEGIN
  -- Buscar usuário
  SELECT * INTO user_record FROM profiles WHERE email = user_email;
  
  IF NOT FOUND THEN
    RETURN 'Usuário não encontrado';
  END IF;
  
  -- Atualizar role
  UPDATE profiles SET role = 'super_admin' WHERE id = user_record.id;
  
  -- Criar permissões completas
  INSERT INTO admin_permissions (
    user_id,
    can_view_organizations,
    can_edit_organizations,
    can_delete_organizations,
    can_view_subscriptions,
    can_edit_subscriptions,
    can_view_billing,
    can_manage_billing,
    can_process_refunds,
    can_view_analytics,
    can_export_data,
    can_view_logs,
    can_manage_users
  ) VALUES (
    user_record.id,
    true, true, true, true, true, true, true, true, true, true, true, true
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    can_view_organizations = true,
    can_edit_organizations = true,
    can_delete_organizations = true,
    can_view_subscriptions = true,
    can_edit_subscriptions = true,
    can_view_billing = true,
    can_manage_billing = true,
    can_process_refunds = true,
    can_view_analytics = true,
    can_export_data = true,
    can_view_logs = true,
    can_manage_users = true;
  
  -- Log da ação
  INSERT INTO admin_logs (
    admin_id,
    action,
    resource_type,
    resource_id,
    description
  ) VALUES (
    user_record.id,
    'create',
    'admin',
    user_record.id,
    'Usuário promovido a super_admin'
  );
  
  RETURN 'Usuário promovido a super_admin com sucesso';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Exemplo de uso:
-- SELECT promote_to_super_admin('seu-email@example.com');
```

---

## 🛣️ Estrutura de Rotas e Páginas

### Layout Principal Admin (`app/(admin)/layout.tsx`)

**Features:**
- Verificação de role (redirect se não for admin)
- Sidebar específica para admin
- Header com breadcrumbs
- Notificações em tempo real
- Busca global (⌘K)

**Proteção:**
```typescript
// Verificar se usuário é admin
const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', user.id)
  .single()

if (!profile || !['admin', 'super_admin', 'support', 'billing'].includes(profile.role)) {
  redirect('/dashboard')
}
```

### 1. Dashboard Principal (`/admin/dashboard`)

**KPIs Principais:**

**Linha 1 - Métricas de Organizações:**
- Total de Organizações (com tendência)
- Organizações Ativas
- Em Trial
- Canceladas

**Linha 2 - Métricas Financeiras:**
- MRR (Monthly Recurring Revenue)
- Novos Assinantes (este mês)
- taxa de rotatividade
- Receita Total

**Gráficos:**
- Crescimento de assinantes (últimos 6 meses)
- Receita ao longo do tempo
- Distribuição por planos (pizza)
- Top 5 organizações por receita

**Atividade Recente:**
- Novas organizações
- Mudanças de plano
- Cancelamentos
- Problemas de pagamento

### 2. Gestão de Organizações (`/admin/organizations`)

**Página de Lista:**

**Filtros:**
- Por plano (Free, Pro, Enterprise)
- Por status (Active, Trial, Cancelled, Suspended)
- Por data de cadastro
- Por uso de recursos
- Por faturamento mensal

**Tabela com colunas:**
- Nome da organização
- Plano (badge colorido)
- Status (badge)
- Usuários
- Clientes cadastrados
- MRR
- Data de cadastro
- Último acesso
- Ações

**Ações em massa:**
- Enviar email
- Alterar plano
- Suspender
- Exportar dados

**Busca:**
- Por nome, email, CNPJ
- Autocompletar

### 3. Detalhes da Organização (`/admin/organizations/[id]`)

**Tabs:**

#### Overview
- Card com informações gerais
- Status da assinatura
- Resumo financeiro
- Timeline de eventos importantes
- Ações rápidas (Editar, Suspender, Cancelar)

#### Subscription
- Plano atual (card destacado)
- Histórico de mudanças de plano
- Data de renovação
- Botões: Upgrade, Downgrade, Cancelar, Estender trial
- Gráfico de progresso dos limites:
  - Clientes: X/50 (Free) ou Ilimitado
  - Ordens criadas este mês
  - Usuários ativos
  - Storage usado

#### Usage
- Gráficos de uso ao longo do tempo
- Métricas detalhadas:
  - Logins por dia
  - Ordens criadas por dia
  - Clientes cadastrados por mês
  - Receita gerada
- Comparação com média de organizações similares

#### Billing
- Tabela de faturas
  - Data
  - Valor
  - Status (paga, pendente, falhou)
  - Método de pagamento
  - Ações (download, reenviar, reembolsar)
- Card com próxima cobrança
- Card com método de pagamento
- Histórico de falhas de pagamento
- Opção de processar pagamento manual

#### Users
- Lista de usuários da organização
- Email, Nome, Role
- Último acesso
- Status (ativo, inativo)
- Ações: Visualizar, Suspender, Remover

#### Activity
- Timeline de atividades
- Filtros por tipo de ação
- Exportar logs

#### Notes
- Área de texto para adicionar notas
- Lista de notas anteriores
- Tags para categorização
- Marcar como importante

### 4. Gestão de Planos (`/admin/subscriptions`)

**Página Principal:**

**Cards dos 3 planos:**
- Free, Pro, Enterprise
- Quantidade de assinantes em cada
- Receita total do plano
- Taxa de conversão

**Estatísticas:**
- Trial → Free → Pro → Enterprise (funil)
- Média de tempo em cada plano
- Taxa de upgrade
- Taxa de downgrade

**Configuração de Planos:**
- Editar preços
- Editar limites de recursos
- Habilitar/desabilitar features
- Criar planos personalizados

### 5. Billing Global (`/admin/billing`)

**Dashboard Financeiro:**
- Receita este mês (progresso vs meta)
- Receita prevista próximo mês
- Faturas pendentes
- Faturas vencidas

**Gráficos:**
- Receita mensal (últimos 12 meses)
- Previsão de receita (próximos 3 meses)
- Taxa de sucesso de pagamentos

**Faturas:**
- Tabela com todas faturas
- Filtros: status, período, plano
- Ações: processar, reembolsar, reenviar

### 6. Analytics (`/admin/analytics`)

**Relatórios:**
- Crescimento mensal
- Análise de churn (com motivos)
- Funil de conversão
- Análise de retenção (cohorts)
- Top clientes por receita
- Uso de features por plano

**Exportações:**
- CSV, Excel, PDF
- Agendar relatórios
- Enviar por email

### 7. Logs (`/admin/logs`)

**Filtros:**
- Por tipo de ação
- Por admin
- Por recurso
- Por período
- Por organização

**Tabela:**
- Data/hora
- Admin
- Ação
- Recurso
- Detalhes
- IP

---

## 🔐 Sistema de Autenticação e Permissões

### Roles Disponíveis

1. **super_admin** (Acesso Total)
   - Pode fazer tudo
   - Gerenciar outros admins
   - Acessar configurações críticas

2. **admin** (Gestão Completa)
   - Gerenciar organizações
   - Gerenciar planos
   - Ver analytics
   - Não pode gerenciar outros admins

3. **support** (Suporte)
   - Ver organizações
   - Ver/editar notas
   - Ver logs
   - Não pode alterar billing

4. **billing** (Financeiro)
   - Ver faturamento
   - Processar pagamentos
   - Ver/editar faturas
   - Não pode alterar organizações

### Middleware de Proteção

**Arquivo:** `lib/admin/permissions.ts`

```typescript
export type AdminRole = 'user' | 'admin' | 'super_admin' | 'support' | 'billing'

export const ADMIN_ROLES: AdminRole[] = ['admin', 'super_admin', 'support', 'billing']

export function isAdmin(role: string): boolean {
  return ADMIN_ROLES.includes(role as AdminRole)
}

export function canAccessAdmin(role: string): boolean {
  return isAdmin(role)
}

export function canManageOrganizations(role: string): boolean {
  return ['admin', 'super_admin'].includes(role)
}

export function canManageBilling(role: string): boolean {
  return ['admin', 'super_admin', 'billing'].includes(role)
}

export function canManageAdmins(role: string): boolean {
  return role === 'super_admin'
}

export function canViewAnalytics(role: string): boolean {
  return ['admin', 'super_admin'].includes(role)
}
```

### Hook de Verificação

**Arquivo:** `hooks/admin/use-admin-auth.ts`

```typescript
export function useAdminAuth() {
  const { data: profile, isLoading } = useQuery({
    queryKey: ['admin-profile'],
    queryFn: async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return null
      
      const { data } = await supabase
        .from('profiles')
        .select('id, email, role, full_name')
        .eq('id', user.id)
        .single()
      
      return data
    }
  })
  
  const isAdmin = profile && ADMIN_ROLES.includes(profile.role)
  const isSuperAdmin = profile?.role === 'super_admin'
  
  return {
    profile,
    isLoading,
    isAdmin,
    isSuperAdmin,
    canManageOrganizations: canManageOrganizations(profile?.role || ''),
    canManageBilling: canManageBilling(profile?.role || ''),
    canManageAdmins: canManageAdmins(profile?.role || ''),
    canViewAnalytics: canViewAnalytics(profile?.role || '')
  }
}
```

---

## 🧩 Componentes e Features

### Componentes Principais

#### 1. AdminSidebar
- Logo
- Menu de navegação
- Indicador de role
- Link para voltar ao CRM
- Logout

#### 2. AdminHeader
- Breadcrumbs
- Busca global
- Notificações
- Avatar com menu

#### 3. MetricsCard
- Valor principal
- Comparação com período anterior
- Gráfico sparkline
- Ícone colorido

#### 4. OrganizationTable
- Tabela completa com filtros
- Paginação
- Ordenação
- Seleção múltipla
- Ações em massa

#### 5. SubscriptionBadge
- Badge colorido por plano
- Tooltip com detalhes

#### 6. RevenueChart
- Gráfico de linha para receita
- Comparação de períodos
- Zoom e pan

#### 7. ActivityTimeline
- Timeline vertical
- Ícones por tipo de evento
- Filtros

### Features Especiais

#### Busca Global (⌘K)
- Buscar organizações
- Buscar usuários
- Buscar faturas
- Navegação rápida

#### Sistema de Notificações
- Novos assinantes
- Falhas de pagamento
- Cancelamentos
- Uso próximo do limite

#### Exportação de Dados
- CSV, Excel, PDF
- Filtros aplicados
- Campos personalizáveis

#### Dark Mode
- Suporte completo
- Persistência de preferência

---

## 📅 Plano de Implementação

### 🎯 Fase 1: Fundação (1-2 semanas)

**Objetivo:** Criar base de dados, autenticação e estrutura básica

#### Sprint 1.1 - Banco de Dados
- [ ] Criar migration `add-admin-role.sql`
- [ ] Criar migration `create-admin-permissions.sql`
- [ ] Criar migration `create-admin-logs.sql`
- [ ] Criar migration `create-admin-notes.sql`
- [ ] Criar migration `create-admin-metrics-views.sql`
- [ ] Criar migration `create-first-super-admin-function.sql`
- [ ] Executar migrations no Supabase
- [ ] Criar primeiro super_admin via SQL

#### Sprint 1.2 - Estrutura de Rotas
- [ ] Criar pasta `app/(admin)/`
- [ ] Criar `layout.tsx` com verificação de role
- [ ] Criar `page.tsx` (redirect para dashboard)
- [ ] Criar middleware de proteção
- [ ] Testar acesso e redirects

#### Sprint 1.3 - Autenticação e Permissões
- [ ] Criar `lib/admin/permissions.ts`
- [ ] Criar `hooks/admin/use-admin-auth.ts`
- [ ] Criar `hooks/admin/use-admin-permissions.ts`
- [ ] Testar sistema de permissões

#### Sprint 1.4 - Layout Base
- [ ] Criar `components/admin/admin-sidebar.tsx`
- [ ] Criar `components/admin/admin-header.tsx`
- [ ] Integrar sidebar no layout admin
- [ ] Adicionar link condicional na sidebar principal
- [ ] Testar navegação

**Entregável Fase 1:** Sistema autenticado com estrutura base funcionando

---

### 🚀 Fase 2: Dashboard e Organizações (2-3 semanas)

**Objetivo:** Dashboard com KPIs e gestão básica de organizações

#### Sprint 2.1 - Dashboard Principal
- [ ] Criar `app/(admin)/dashboard/page.tsx`
- [ ] Criar `components/admin/metrics-card.tsx`
- [ ] Criar hook `use-admin-metrics.ts`
- [ ] Implementar 8 cards de KPIs
- [ ] Criar query para métricas globais

#### Sprint 2.2 - Gráficos do Dashboard
- [ ] Instalar biblioteca de gráficos (Recharts)
- [ ] Criar `components/admin/revenue-chart.tsx`
- [ ] Criar `components/admin/growth-chart.tsx`
- [ ] Criar `components/admin/plan-distribution-chart.tsx`
- [ ] Integrar gráficos no dashboard

#### Sprint 2.3 - Atividade Recente
- [ ] Criar `components/admin/activity-timeline.tsx`
- [ ] Criar queries para atividades recentes
- [ ] Integrar no dashboard
- [ ] Adicionar atualização em tempo real

#### Sprint 2.4 - Lista de Organizações
- [ ] Criar `app/(admin)/organizations/page.tsx`
- [ ] Criar `components/admin/organization-table.tsx`
- [ ] Criar `components/admin/organization-filters.tsx`
- [ ] Criar hook `use-admin-organizations.ts`
- [ ] Implementar paginação
- [ ] Implementar filtros
- [ ] Implementar busca

#### Sprint 2.5 - Ações em Organizações
- [ ] Criar `components/admin/organization-actions.tsx`
- [ ] Implementar visualização rápida
- [ ] Implementar suspensão
- [ ] Implementar ações em massa
- [ ] Adicionar logs de auditoria

**Entregável Fase 2:** Dashboard funcional com gestão básica de organizações

---

### 📊 Fase 3: Detalhes de Organização (2 semanas)

**Objetivo:** Visualização completa de uma organização

#### Sprint 3.1 - Estrutura de Detalhes
- [ ] Criar `app/(admin)/organizations/[id]/layout.tsx` com tabs
- [ ] Criar `app/(admin)/organizations/[id]/page.tsx` (redirect para overview)
- [ ] Criar componente de navegação por tabs
- [ ] Criar hook `use-organization-details.ts`

#### Sprint 3.2 - Tab Overview
- [ ] Criar `app/(admin)/organizations/[id]/overview/page.tsx`
- [ ] Criar `components/admin/organization-overview-card.tsx`
- [ ] Criar `components/admin/organization-timeline.tsx`
- [ ] Implementar ações rápidas

#### Sprint 3.3 - Tab Subscription
- [ ] Criar `app/(admin)/organizations/[id]/subscription/page.tsx`
- [ ] Criar `components/admin/subscription-card.tsx`
- [ ] Criar `components/admin/usage-progress.tsx`
- [ ] Implementar histórico de planos
- [ ] Implementar ações (upgrade/downgrade)

#### Sprint 3.4 - Tab Usage
- [ ] Criar `app/(admin)/organizations/[id]/usage/page.tsx`
- [ ] Criar `components/admin/usage-chart.tsx`
- [ ] Implementar gráficos de uso ao longo do tempo
- [ ] Adicionar comparação com média

#### Sprint 3.5 - Tab Users
- [ ] Criar `app/(admin)/organizations/[id]/users/page.tsx`
- [ ] Criar `components/admin/organization-users-table.tsx`
- [ ] Implementar visualização de usuários
- [ ] Adicionar ações (suspender, remover)

#### Sprint 3.6 - Tab Activity & Notes
- [ ] Criar `app/(admin)/organizations/[id]/activity/page.tsx`
- [ ] Criar `app/(admin)/organizations/[id]/notes/page.tsx`
- [ ] Criar `components/admin/notes-editor.tsx`
- [ ] Implementar CRUD de notas

**Entregável Fase 3:** Visualização completa de organizações com todas tabs

---

### 💰 Fase 4: Billing e Subscriptions (2 semanas)

**Objetivo:** Gestão financeira e de planos

#### Sprint 4.1 - Billing Dashboard
- [ ] Criar `app/(admin)/billing/page.tsx`
- [ ] Criar cards de métricas financeiras
- [ ] Criar gráfico de receita mensal
- [ ] Criar lista de faturas pendentes

#### Sprint 4.2 - Gestão de Faturas
- [ ] Criar `app/(admin)/billing/invoices/page.tsx`
- [ ] Criar `components/admin/invoice-table.tsx`
- [ ] Implementar filtros
- [ ] Implementar ações (processar, reembolsar, reenviar)

#### Sprint 4.3 - Tab Billing na Organização
- [ ] Criar `app/(admin)/organizations/[id]/billing/page.tsx`
- [ ] Implementar histórico de faturas
- [ ] Implementar gestão de método de pagamento
- [ ] Adicionar opção de pagamento manual

#### Sprint 4.4 - Gestão de Planos
- [ ] Criar `app/(admin)/subscriptions/page.tsx`
- [ ] Criar `components/admin/plan-card.tsx`
- [ ] Implementar visualização de planos
- [ ] Criar página de edição de plano

#### Sprint 4.5 - Funil de Conversão
- [ ] Criar visualização de funil
- [ ] Implementar estatísticas de conversão
- [ ] Adicionar gráficos de upgrade/downgrade

**Entregável Fase 4:** Sistema financeiro completo

---

### 📈 Fase 5: Analytics e Relatórios (1-2 semanas)

**Objetivo:** Análises avançadas e relatórios

#### Sprint 5.1 - Analytics Dashboard
- [ ] Criar `app/(admin)/analytics/page.tsx`
- [ ] Criar cards de métricas principais
- [ ] Criar seletor de período

#### Sprint 5.2 - Análises Específicas
- [ ] Criar `app/(admin)/analytics/growth/page.tsx`
- [ ] Criar `app/(admin)/analytics/churn/page.tsx`
- [ ] Criar `app/(admin)/analytics/revenue/page.tsx`
- [ ] Implementar gráficos específicos

#### Sprint 5.3 - Análise de Cohorts
- [ ] Criar visualização de cohorts
- [ ] Implementar cálculo de retenção
- [ ] Criar gráfico de retenção

#### Sprint 5.4 - Sistema de Exportação
- [ ] Criar `lib/admin/export.ts`
- [ ] Implementar exportação CSV
- [ ] Implementar exportação Excel
- [ ] Implementar exportação PDF
- [ ] Adicionar botões de exportação nas páginas

**Entregável Fase 5:** Sistema completo de analytics

---

### 🔍 Fase 6: Logs e Ajustes Finais (1 semana)

**Objetivo:** Logs de auditoria e refinamentos

#### Sprint 6.1 - Sistema de Logs
- [ ] Criar `app/(admin)/logs/page.tsx`
- [ ] Criar `components/admin/logs-table.tsx`
- [ ] Implementar filtros avançados
- [ ] Implementar busca em logs

#### Sprint 6.2 - Integração de Logs
- [ ] Adicionar log automático em todas ações
- [ ] Implementar função helper para logs
- [ ] Testar logs em todas features

#### Sprint 6.3 - Gestão de Admins
- [ ] Criar `app/(admin)/users/page.tsx`
- [ ] Implementar CRUD de admins
- [ ] Implementar gestão de permissões
- [ ] Adicionar logs de ações de admins

#### Sprint 6.4 - Polimento
- [ ] Adicionar loading states
- [ ] Adicionar empty states
- [ ] Adicionar mensagens de erro
- [ ] Testar responsividade
- [ ] Testar dark mode
- [ ] Revisar permissões

**Entregável Fase 6:** Sistema completo e polido

---

### 🎁 Fase 7: Features Avançadas (Futuro)

#### Possíveis Melhorias:
- [ ] Dashboard personalizável (drag & drop widgets)
- [ ] Alertas automáticos (Slack, Email)
- [ ] API de admin
- [ ] Webhooks
- [ ] Integração com ferramentas (Intercom, Mixpanel)
- [ ] Geração automática de relatórios
- [ ] Sistema de tickets de suporte
- [ ] Chat interno com organizações
- [ ] Feature flags
- [ ] A/B Testing de planos

---

## ✅ Checklist de Desenvolvimento

### Antes de Começar
- [ ] Fazer backup do banco de dados
- [ ] Criar branch específica (`feature/admin-panel`)
- [ ] Revisar este documento
- [ ] Definir primeiro super_admin

### Durante Desenvolvimento
- [ ] Seguir ordem das fases
- [ ] Testar cada sprint antes de avançar
- [ ] Commitar com mensagens descritivas
- [ ] Atualizar documentação conforme necessário
- [ ] Adicionar logs em todas ações críticas

### Antes de Deploy
- [ ] Testar todas permissões
- [ ] Testar RLS no Supabase
- [ ] Testar responsividade
- [ ] Testar dark mode
- [ ] Revisar segurança
- [ ] Fazer code review
- [ ] Testar performance
- [ ] Documentar APIs/hooks criados

### Pós-Deploy
- [ ] Monitorar logs de erro
- [ ] Criar primeiro super_admin em produção
- [ ] Testar fluxo completo
- [ ] Coletar feedback
- [ ] Planejar próximas iterações

---

## 🔗 Referências e Inspirações

### Painéis Admin de Referência:
- **Stripe Dashboard:** https://dashboard.stripe.com
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Supabase Studio:** https://supabase.com/dashboard
- **Railway Dashboard:** https://railway.app/dashboard

### Bibliotecas Úteis:
- **Recharts:** Gráficos (https://recharts.org)
- **Tanstack Table:** Tabelas avançadas
- **date-fns:** Manipulação de datas
- **XLSX:** Exportação para Excel
- **jsPDF:** Exportação para PDF

---

## 📝 Notas Finais

### Estimativa de Tempo Total:
- **Fase 1:** 1-2 semanas
- **Fase 2:** 2-3 semanas
- **Fase 3:** 2 semanas
- **Fase 4:** 2 semanas
- **Fase 5:** 1-2 semanas
- **Fase 6:** 1 semana

**Total:** ~9-12 semanas para MVP completo

### Priorização:
1. ✅ **Must Have:** Fases 1, 2, 3 (Dashboard básico + Organizações)
2. 🎯 **Should Have:** Fase 4 (Billing)
3. 💡 **Nice to Have:** Fases 5, 6 (Analytics + Logs)
4. 🚀 **Future:** Fase 7 (Features avançadas)

---

**Última atualização:** 09/01/2026  
**Versão:** 1.0  
**Status:** Planejamento
