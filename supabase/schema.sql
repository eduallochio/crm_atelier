-- =====================================================
-- CRM ATELIER - SCHEMA DO BANCO DE DADOS
-- =====================================================
-- Execute este script no Supabase SQL Editor
-- (Project → SQL Editor → New Query)
-- =====================================================

-- Habilitar extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABELAS
-- =====================================================

-- 1. Tabela de Organizações (Tenants)
CREATE TABLE IF NOT EXISTS organizations (
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
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  is_owner BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Clientes do Ateliê
CREATE TABLE IF NOT EXISTS org_clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  telefone TEXT,
  email TEXT,
  endereco TEXT,
  data_cadastro TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Serviços
CREATE TABLE IF NOT EXISTS org_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  tipo TEXT,
  valor DECIMAL(10,2),
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Ordens de Serviço
CREATE TABLE IF NOT EXISTS org_service_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations ON DELETE CASCADE NOT NULL,
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
CREATE TABLE IF NOT EXISTS customization_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID UNIQUE REFERENCES organizations ON DELETE CASCADE NOT NULL,
  primary_color TEXT DEFAULT '#3b82f6',
  secondary_color TEXT DEFAULT '#10b981',
  logo_url TEXT,
  atelier_name TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Métricas de Uso
CREATE TABLE IF NOT EXISTS usage_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID UNIQUE REFERENCES organizations ON DELETE CASCADE NOT NULL,
  clients_count INT DEFAULT 0,
  orders_count INT DEFAULT 0,
  users_count INT DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_profiles_org ON profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_clients_org ON org_clients(organization_id);
CREATE INDEX IF NOT EXISTS idx_services_org ON org_services(organization_id);
CREATE INDEX IF NOT EXISTS idx_orders_org ON org_service_orders(organization_id);
CREATE INDEX IF NOT EXISTS idx_orders_client ON org_service_orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON org_service_orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_data ON org_service_orders(data_abertura);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Ativar RLS em todas as tabelas
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_service_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE customization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_metrics ENABLE ROW LEVEL SECURITY;

-- Limpar políticas existentes (se houver)
DROP POLICY IF EXISTS "Users can view own organization" ON organizations;
DROP POLICY IF EXISTS "Users can update own organization" ON organizations;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view org clients" ON org_clients;
DROP POLICY IF EXISTS "Users can insert org clients" ON org_clients;
DROP POLICY IF EXISTS "Users can update org clients" ON org_clients;
DROP POLICY IF EXISTS "Users can delete org clients" ON org_clients;
DROP POLICY IF EXISTS "Users can view org services" ON org_services;
DROP POLICY IF EXISTS "Users can insert org services" ON org_services;
DROP POLICY IF EXISTS "Users can update org services" ON org_services;
DROP POLICY IF EXISTS "Users can delete org services" ON org_services;
DROP POLICY IF EXISTS "Users can view org orders" ON org_service_orders;
DROP POLICY IF EXISTS "Users can insert org orders" ON org_service_orders;
DROP POLICY IF EXISTS "Users can update org orders" ON org_service_orders;
DROP POLICY IF EXISTS "Users can delete org orders" ON org_service_orders;
DROP POLICY IF EXISTS "Users can view org customization" ON customization_settings;
DROP POLICY IF EXISTS "Users can update org customization" ON customization_settings;
DROP POLICY IF EXISTS "Users can view org metrics" ON usage_metrics;

-- Políticas: Organizations
CREATE POLICY "Users can view own organization"
  ON organizations FOR SELECT
  USING (id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update own organization"
  ON organizations FOR UPDATE
  USING (id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid() AND is_owner = true
  ));

-- Políticas: Profiles
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

-- Políticas: Clients
CREATE POLICY "Users can view org clients"
  ON org_clients FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can insert org clients"
  ON org_clients FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update org clients"
  ON org_clients FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can delete org clients"
  ON org_clients FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

-- Políticas: Services
CREATE POLICY "Users can view org services"
  ON org_services FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can insert org services"
  ON org_services FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update org services"
  ON org_services FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can delete org services"
  ON org_services FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

-- Políticas: Service Orders
CREATE POLICY "Users can view org orders"
  ON org_service_orders FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can insert org orders"
  ON org_service_orders FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update org orders"
  ON org_service_orders FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can delete org orders"
  ON org_service_orders FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

-- Políticas: Customization
CREATE POLICY "Users can view org customization"
  ON customization_settings FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update org customization"
  ON customization_settings FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid() AND is_owner = true
  ));

-- Políticas: Metrics (somente leitura)
CREATE POLICY "Users can view org metrics"
  ON usage_metrics FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

-- =====================================================
-- FUNÇÕES E TRIGGERS
-- =====================================================

-- Função: Atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at 
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_customization_updated_at ON customization_settings;
CREATE TRIGGER update_customization_updated_at 
  BEFORE UPDATE ON customization_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função: Criar organização e perfil no cadastro
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_org_id UUID;
  user_name TEXT;
BEGIN
  -- Extrair nome do usuário
  user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário');
  
  -- Criar organização
  INSERT INTO organizations (name, slug)
  VALUES (
    user_name || '''s Atelier',
    'atelier-' || substr(NEW.id::text, 1, 8)
  )
  RETURNING id INTO new_org_id;

  -- Criar perfil
  INSERT INTO profiles (id, organization_id, email, full_name, role, is_owner)
  VALUES (
    NEW.id, 
    new_org_id, 
    NEW.email, 
    user_name, 
    'owner', 
    true
  );

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
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
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

DROP TRIGGER IF EXISTS after_client_insert ON org_clients;
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

DROP TRIGGER IF EXISTS after_client_delete ON org_clients;
CREATE TRIGGER after_client_delete
  AFTER DELETE ON org_clients
  FOR EACH ROW EXECUTE FUNCTION decrement_client_count();

-- Trigger: Atualizar contadores ao inserir ordem
CREATE OR REPLACE FUNCTION increment_order_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE usage_metrics
  SET orders_count = orders_count + 1, updated_at = NOW()
  WHERE organization_id = NEW.organization_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS after_order_insert ON org_service_orders;
CREATE TRIGGER after_order_insert
  AFTER INSERT ON org_service_orders
  FOR EACH ROW EXECUTE FUNCTION increment_order_count();

-- Trigger: Atualizar contadores ao deletar ordem
CREATE OR REPLACE FUNCTION decrement_order_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE usage_metrics
  SET orders_count = orders_count - 1, updated_at = NOW()
  WHERE organization_id = OLD.organization_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS after_order_delete ON org_service_orders;
CREATE TRIGGER after_order_delete
  AFTER DELETE ON org_service_orders
  FOR EACH ROW EXECUTE FUNCTION decrement_order_count();

-- =====================================================
-- CONCLUÍDO!
-- =====================================================
-- Schema criado com sucesso!
-- 
-- Próximos passos:
-- 1. Testar criando um usuário via Supabase Auth
-- 2. Verificar se a organização foi criada automaticamente
-- 3. Começar a desenvolver as páginas do frontend
-- =====================================================
