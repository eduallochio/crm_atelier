# 🚀 Plano de Implementação: CRM Atelier Multi-tenant

## Stack Tecnológica Recomendada

### Frontend & Framework
- **Next.js 15** (App Router) + TypeScript
- **Tailwind CSS** + **Shadcn UI**
- **TanStack Query v5** (React Query)
- **React Hook Form** + **Zod**
- **Zustand** (estado global leve, se necessário)

### Backend & Infraestrutura
- **Supabase** (PostgreSQL + Auth + Storage + RLS)
- **Stripe** (pagamentos e assinaturas)
- **Resend** ou **SendGrid** (e-mails transacionais)

### Ferramentas de Dev
- **Prettier** + **ESLint**
- **Husky** (git hooks)
- **Vercel** (deploy)

---

## 📋 Fases de Desenvolvimento

### **FASE 1: Setup Inicial e Fundação (Semana 1-2)**

#### 1.1. Configuração do Projeto
- [ ] Criar projeto Next.js 15 com TypeScript
```bash
npx create-next-app@latest crm-atelier --typescript --tailwind --app
```
- [ ] Instalar dependências essenciais:
  - `@supabase/supabase-js` + `@supabase/ssr`
  - `@tanstack/react-query`
  - `react-hook-form` + `zod` + `@hookform/resolvers`
  - Shadcn UI (init e componentes base)
  - `stripe` + `@stripe/stripe-js`
  - `lucide-react`
  - `date-fns` ou `dayjs`

#### 1.2. Configuração do Supabase
- [ ] Criar projeto no Supabase
- [ ] Configurar variáveis de ambiente (`.env.local`):
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `NEXT_PUBLIC_APP_URL`
- [ ] Criar cliente Supabase (server e client components)

#### 1.3. Estrutura de Pastas
```
src/
├── app/                    # App Router
│   ├── (auth)/            # Grupo de rotas autenticação
│   │   ├── login/
│   │   └── cadastro/
│   ├── (dashboard)/       # Grupo de rotas protegidas
│   │   ├── layout.tsx     # Layout com sidebar
│   │   ├── dashboard/
│   │   ├── clientes/
│   │   ├── servicos/
│   │   ├── ordens-servico/
│   │   ├── financeiro/
│   │   ├── caixa/
│   │   └── profile/
│   ├── api/               # API Routes
│   │   ├── webhooks/
│   │   │   └── stripe/
│   │   └── cron/
│   └── layout.tsx         # Root layout
├── components/
│   ├── ui/                # Shadcn components
│   ├── forms/             # Form components reutilizáveis
│   ├── dashboard/         # Componentes do dashboard
│   └── layouts/           # Sidebar, Header, etc.
├── lib/
│   ├── supabase/
│   │   ├── client.ts      # Client component
│   │   ├── server.ts      # Server component
│   │   └── middleware.ts  # Middleware helper
│   ├── validations/       # Schemas Zod
│   ├── utils.ts
│   └── constants.ts
├── hooks/                 # Custom hooks
├── types/                 # TypeScript types
└── styles/
```

---

### **FASE 2: Banco de Dados e Segurança (Semana 2-3)**

#### 2.1. Criar Schema do Banco (SQL)
Executar no Supabase SQL Editor:

```sql
-- Habilitar UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabela de Organizações
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'enterprise')),
  stripe_customer_id TEXT,
  subscription_status TEXT DEFAULT 'inactive',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de Perfis (ligada ao auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  is_owner BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Clientes do Ateliê
CREATE TABLE org_clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations ON DELETE CASCADE,
  nome TEXT NOT NULL,
  telefone TEXT,
  email TEXT,
  endereco TEXT,
  data_cadastro TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Serviços
CREATE TABLE org_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo TEXT,
  valor DECIMAL(10,2),
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Ordens de Serviço
CREATE TABLE org_service_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations ON DELETE CASCADE,
  client_id UUID REFERENCES org_clients ON DELETE SET NULL,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_andamento', 'concluido', 'cancelado')),
  valor_total DECIMAL(10,2),
  data_abertura TIMESTAMPTZ DEFAULT NOW(),
  data_prevista DATE,
  data_conclusao TIMESTAMPTZ,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Customização (White-label)
CREATE TABLE customization_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID UNIQUE REFERENCES organizations ON DELETE CASCADE,
  primary_color TEXT DEFAULT '#3b82f6',
  secondary_color TEXT DEFAULT '#10b981',
  logo_url TEXT,
  atelier_name TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Métricas de Uso
CREATE TABLE usage_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID UNIQUE REFERENCES organizations ON DELETE CASCADE,
  clients_count INT DEFAULT 0,
  orders_count INT DEFAULT 0,
  users_count INT DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_profiles_org ON profiles(organization_id);
CREATE INDEX idx_clients_org ON org_clients(organization_id);
CREATE INDEX idx_services_org ON org_services(organization_id);
CREATE INDEX idx_orders_org ON org_service_orders(organization_id);
CREATE INDEX idx_orders_client ON org_service_orders(client_id);
CREATE INDEX idx_orders_status ON org_service_orders(status);
```

#### 2.2. Row Level Security (RLS)
```sql
-- Ativar RLS em todas as tabelas
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_service_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE customization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_metrics ENABLE ROW LEVEL SECURITY;

-- Políticas: Usuário só vê dados da própria organização
CREATE POLICY "Users can view own organization"
  ON organizations FOR SELECT
  USING (id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can view own profile"
  ON profiles FOR ALL
  USING (id = auth.uid());

CREATE POLICY "Users can view org clients"
  ON org_clients FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can view org services"
  ON org_services FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can view org orders"
  ON org_service_orders FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can view org customization"
  ON customization_settings FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can view org metrics"
  ON usage_metrics FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));
```

#### 2.3. Funções e Triggers
```sql
-- Função: Atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customization_updated_at BEFORE UPDATE ON customization_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função: Criar organização e perfil no cadastro
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_org_id UUID;
BEGIN
  -- Criar organização
  INSERT INTO organizations (name, slug)
  VALUES ('Minha Empresa', 'minha-empresa-' || substr(NEW.id::text, 1, 8))
  RETURNING id INTO new_org_id;

  -- Criar perfil
  INSERT INTO profiles (id, organization_id, email, full_name, role, is_owner)
  VALUES (NEW.id, new_org_id, NEW.email, NEW.raw_user_meta_data->>'full_name', 'owner', true);

  -- Inicializar métricas
  INSERT INTO usage_metrics (organization_id, users_count)
  VALUES (new_org_id, 1);

  -- Criar configuração de customização padrão
  INSERT INTO customization_settings (organization_id)
  VALUES (new_org_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Executar ao criar usuário
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Função: Verificar limites do plano
CREATE OR REPLACE FUNCTION check_plan_limits(
  org_id UUID,
  resource_type TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  org_plan TEXT;
  current_count INT;
BEGIN
  -- Buscar plano
  SELECT plan INTO org_plan FROM organizations WHERE id = org_id;

  -- Enterprise não tem limite
  IF org_plan = 'enterprise' THEN
    RETURN true;
  END IF;

  -- Free: verificar limites
  IF resource_type = 'client' THEN
    SELECT clients_count INTO current_count FROM usage_metrics WHERE organization_id = org_id;
    RETURN current_count < 50;
  ELSIF resource_type = 'user' THEN
    SELECT users_count INTO current_count FROM usage_metrics WHERE organization_id = org_id;
    RETURN current_count < 1;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Atualizar contadores ao inserir cliente
CREATE OR REPLACE FUNCTION increment_client_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE usage_metrics
  SET clients_count = clients_count + 1, updated_at = NOW()
  WHERE organization_id = NEW.organization_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_client_insert
  AFTER INSERT ON org_clients
  FOR EACH ROW EXECUTE FUNCTION increment_client_count();

-- Trigger: Atualizar contadores ao deletar cliente
CREATE OR REPLACE FUNCTION decrement_client_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE usage_metrics
  SET clients_count = clients_count - 1, updated_at = NOW()
  WHERE organization_id = OLD.organization_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_client_delete
  AFTER DELETE ON org_clients
  FOR EACH ROW EXECUTE FUNCTION decrement_client_count();
```

---

### **FASE 3: Autenticação e Middleware (Semana 3-4)**

#### 3.1. Configurar Autenticação Next.js + Supabase
- [ ] Criar helpers em `lib/supabase/`:
  - `client.ts` (client components)
  - `server.ts` (server components)
  - `middleware.ts` (route protection)

#### 3.2. Criar Middleware de Proteção
```typescript
// middleware.ts (root)
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Implementar verificação de auth
  // Redirecionar rotas protegidas
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)']
}
```

#### 3.3. Páginas de Autenticação
- [ ] `/login` - Formulário de login com validação Zod
- [ ] `/cadastro` - Registro + criação automática da org
- [ ] Recuperação de senha
- [ ] Verificação de e-mail

---

### **FASE 4: Layout e Navegação (Semana 4-5)**

#### 4.1. Componentes de Layout
- [ ] Sidebar responsiva com Shadcn Sheet (mobile)
- [ ] Header com informações do usuário
- [ ] Breadcrumbs
- [ ] Theme Provider (light/dark mode)

#### 4.2. Navegação Principal
Items da sidebar:
- Dashboard (📊)
- Clientes (👥)
- Serviços (✂️)
- Ordens de Serviço (📋)
- Financeiro (💰)
- Caixa (🏦)
- Perfil/Configurações (⚙️)

---

### **FASE 5: Módulos Core (Semana 5-8)**

#### 5.1. Dashboard
- [ ] Cards com métricas principais (KPIs)
- [ ] Gráfico de ordens por status (Tremor)
- [ ] Lista de ordens recentes
- [ ] Avisos de limites do plano

#### 5.2. Gestão de Clientes
- [ ] Listagem com DataTable (Shadcn)
- [ ] Pesquisa e filtros
- [ ] Formulário de cadastro/edição (Dialog)
- [ ] Validação de limites do plano Free
- [ ] Detalhes do cliente (histórico de ordens)

#### 5.3. Catálogo de Serviços
- [ ] CRUD completo
- [ ] Cards com preços
- [ ] Ativar/desativar serviços
- [ ] Categorização

#### 5.4. Ordens de Serviço
- [ ] Criação de OS (multi-step form)
- [ ] Seleção de cliente
- [ ] Seleção de serviços (multi-select)
- [ ] Kanban board (status: Pendente, Em Andamento, Concluído)
- [ ] Drag and drop para mudar status
- [ ] Timeline da ordem
- [ ] Impressão de OS (PDF - `react-to-print`)

---

### **FASE 6: Financeiro e Pagamentos (Semana 8-10)**

#### 6.1. Integração com Stripe
- [ ] Configurar webhooks (`/api/webhooks/stripe`)
- [ ] Gerenciar assinaturas
- [ ] Atualizar `subscription_status` na org
- [ ] Página de upgrade de plano
- [ ] Portal do cliente Stripe

#### 6.2. Módulo Financeiro
- [ ] Contas a receber (linked às OS)
- [ ] Contas a pagar
- [ ] Relatórios financeiros
- [ ] Filtros por período

#### 6.3. Controle de Caixa
- [ ] Registro de movimentações
- [ ] Saldo atual
- [ ] Histórico

---

### **FASE 7: Customização (White-label) (Semana 10-11)**

#### 7.1. Página de Configurações
- [ ] Upload de logo (Supabase Storage)
- [ ] Color picker para cores primárias
- [ ] Preview em tempo real
- [ ] Salvar na tabela `customization_settings`

#### 7.2. Aplicar Customização
- [ ] Hook `useCustomization()` com React Query
- [ ] CSS Variables dinâmicas
- [ ] Logo no header/sidebar

---

### **FASE 8: Otimização e Polish (Semana 11-12)**

#### 8.1. Performance
- [ ] Lazy loading de rotas
- [ ] Memoização de componentes pesados
- [ ] Otimizar queries (indexes, limit, pagination)
- [ ] Cache do TanStack Query

#### 8.2. UX/UI
- [ ] Toasts de sucesso/erro (Sonner)
- [ ] Loading states
- [ ] Empty states
- [ ] Skeleton loaders

#### 8.3. SEO e Meta Tags
- [ ] Metadata API do Next.js
- [ ] Open Graph tags
- [ ] Sitemap

#### 8.4. Testes
- [ ] Testes de RLS no Supabase
- [ ] Validar limites de plano
- [ ] Testar webhooks Stripe

---

### **FASE 9: Deploy (Semana 12)**

#### 9.1. Configuração de Produção
- [ ] Deploy na Vercel
- [ ] Variáveis de ambiente de produção
- [ ] Domínio customizado
- [ ] SSL

#### 9.2. Monitoramento
- [ ] Sentry (error tracking)
- [ ] Vercel Analytics
- [ ] Logs do Supabase

---

## 📦 Comandos Úteis

### Instalação de Dependências
```bash
# Shadcn UI components
npx shadcn-ui@latest init
npx shadcn-ui@latest add button input form card dialog table select sheet

# Outras dependências
pnpm add @tanstack/react-query @tanstack/react-query-devtools
pnpm add @supabase/supabase-js @supabase/ssr
pnpm add react-hook-form @hookform/resolvers zod
pnpm add stripe @stripe/stripe-js
pnpm add date-fns
pnpm add lucide-react
pnpm add sonner # Toasts
pnpm add zustand # Estado global (se necessário)
```

---

## 🎯 Prioridades de Desenvolvimento

### MVP (Mínimo Viável)
1. ✅ Auth (login/cadastro)
2. ✅ Clientes (CRUD)
3. ✅ Serviços (CRUD)
4. ✅ Ordens de Serviço (criar, listar, status)
5. ✅ Dashboard básico
6. ✅ Limites do plano Free

### Features Secundárias
- Financeiro completo
- Caixa
- White-label
- Relatórios avançados
- Notificações por e-mail

---

## 📊 Estimativas de Tempo

- **MVP:** 6-8 semanas (1 dev full-time)
- **Versão Completa:** 10-12 semanas
- **Com Stripe + White-label:** +2 semanas

---

## 🚨 Pontos de Atenção

1. **RLS é Crítico:** Testar MUITO. Um erro expõe dados de outras orgs.
2. **Limites do Plano:** Validar no backend E frontend.
3. **Webhooks Stripe:** Usar `stripe listen` para testar localmente.
4. **Performance:** Índices no banco são essenciais.
5. **Backup:** Configurar backups automáticos no Supabase.

---

## 📚 Recursos e Documentação

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Shadcn UI](https://ui.shadcn.com)
- [TanStack Query](https://tanstack.com/query/latest)
- [Stripe Docs](https://stripe.com/docs)
- [Zod](https://zod.dev)

---

**Próximo Passo:** Executar FASE 1 - Setup Inicial 🚀
