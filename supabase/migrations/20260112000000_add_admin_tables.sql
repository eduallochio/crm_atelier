-- ================================================
-- MIGRATION: Estrutura Admin Panel
-- Data: 12/01/2026
-- Descrição: Adiciona tabelas e estruturas necessárias para o painel admin
-- ================================================

-- ================================================
-- 1. Adicionar role aos profiles
-- ================================================

-- Adicionar campo role se não existir
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- IMPORTANTE: Remover constraint ANTES de atualizar dados
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS check_role_valid;

-- Agora atualizar todos os registros para 'user'
UPDATE profiles 
SET role = 'user' 
WHERE role IS NULL 
   OR role = '' 
   OR role NOT IN ('user', 'admin', 'super_admin', 'support', 'billing');

-- Garantir que não há valores NULL
UPDATE profiles SET role = 'user' WHERE role IS NULL;

-- Agora é seguro adicionar a constraint
ALTER TABLE profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('user', 'admin', 'super_admin', 'support', 'billing'));

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

COMMENT ON COLUMN profiles.role IS 'user: usuário normal, admin: administrador, super_admin: super administrador, support: suporte, billing: financeiro';

-- ================================================
-- 2. Criar tabela admin_logs (logs de auditoria)
-- ================================================

CREATE TABLE IF NOT EXISTS admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Informações da ação
  action TEXT NOT NULL, -- 'view', 'create', 'update', 'delete', 'login', 'export'
  resource_type TEXT NOT NULL, -- 'organization', 'subscription', 'user', 'billing'
  resource_id UUID,
  
  -- Detalhes
  description TEXT,
  changes JSONB, -- Armazena old_value e new_value
  metadata JSONB, -- IP, user agent, etc
  
  -- Contexto
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON admin_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_logs_resource ON admin_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at DESC);

-- RLS
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

-- Política: Admins podem ver logs
DROP POLICY IF EXISTS "Admins can view logs" ON admin_logs;
CREATE POLICY "Admins can view logs" ON admin_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin', 'support')
    )
  );

-- Política: Sistema pode inserir logs
DROP POLICY IF EXISTS "System can insert logs" ON admin_logs;
CREATE POLICY "System can insert logs" ON admin_logs
  FOR INSERT WITH CHECK (true);

COMMENT ON TABLE admin_logs IS 'Logs de auditoria de todas as ações administrativas';

-- ================================================
-- 3. Criar view admin_global_metrics
-- ================================================

-- ================================================
-- 3. Criar view admin_global_metrics
-- ================================================

-- View de métricas globais para o dashboard
CREATE OR REPLACE VIEW admin_global_metrics AS
SELECT 
  -- Total de organizações
  (SELECT COUNT(*) FROM organizations) as total_organizations,
  (SELECT COUNT(*) FROM organizations WHERE state = 'active') as active_organizations,
  (SELECT COUNT(*) FROM organizations WHERE state = 'trial') as trial_organizations,
  (SELECT COUNT(*) FROM organizations WHERE state = 'cancelled') as cancelled_organizations,
  
  -- Por plano
  (SELECT COUNT(*) FROM organizations WHERE plan = 'free') as free_plan_count,
  (SELECT COUNT(*) FROM organizations WHERE plan = 'pro') as pro_plan_count,
  (SELECT COUNT(*) FROM organizations WHERE plan = 'enterprise') as enterprise_plan_count,
  
  -- Novos esta semana/mês
  (SELECT COUNT(*) FROM organizations WHERE created_at >= NOW() - INTERVAL '7 days') as new_this_week,
  (SELECT COUNT(*) FROM organizations WHERE created_at >= NOW() - INTERVAL '30 days') as new_this_month,
  
  -- Total de usuários
  (SELECT COUNT(*) FROM profiles) as total_users,
  -- Organizações ativas (com pelo menos 1 usuário)
  (SELECT COUNT(DISTINCT organization_id) FROM profiles WHERE organization_id IS NOT NULL) as active_orgs_this_week;

COMMENT ON VIEW admin_global_metrics IS 'Métricas globais do sistema para o dashboard admin';

-- ================================================
-- 4. Função para promover usuário a super_admin
-- ================================================

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

COMMENT ON FUNCTION promote_to_super_admin IS 'Promove um usuário para super_admin. Uso: SELECT promote_to_super_admin(''email@exemplo.com'');';

-- ================================================
-- FIM DA MIGRATION
-- ================================================
