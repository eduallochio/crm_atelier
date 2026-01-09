-- Adicionar soft delete às tabelas principais
-- Migration: add-soft-delete.sql

-- 1. Adicionar coluna deleted_at
ALTER TABLE org_clients
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE org_services
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE org_service_orders
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_clients_deleted_at ON org_clients(organization_id, deleted_at);
CREATE INDEX IF NOT EXISTS idx_services_deleted_at ON org_services(organization_id, deleted_at);
CREATE INDEX IF NOT EXISTS idx_orders_deleted_at ON org_service_orders(organization_id, deleted_at);

-- 3. Atualizar view de métricas para contar todos os clientes (incluindo deletados)
CREATE OR REPLACE VIEW org_client_metrics AS
SELECT 
  organization_id,
  COUNT(*) as total_clients,
  COUNT(*) FILTER (WHERE deleted_at IS NULL) as active_clients,
  COUNT(*) FILTER (WHERE deleted_at IS NOT NULL) as deleted_clients
FROM org_clients
GROUP BY organization_id;

-- 4. Função para contar clientes ativos (dentro do limite do plano)
CREATE OR REPLACE FUNCTION count_organization_clients(org_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_count INTEGER;
BEGIN
  -- Conta TODOS os clientes (ativos + deletados) para validação de limite
  SELECT COUNT(*) INTO total_count
  FROM org_clients
  WHERE organization_id = org_id;
  
  RETURN total_count;
END;
$$;

-- 5. Função para soft delete de cliente
CREATE OR REPLACE FUNCTION soft_delete_client(client_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE org_clients
  SET deleted_at = NOW()
  WHERE id = client_id
  AND deleted_at IS NULL;
  
  RETURN FOUND;
END;
$$;

-- 6. Função para restaurar cliente deletado
CREATE OR REPLACE FUNCTION restore_client(client_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE org_clients
  SET deleted_at = NULL
  WHERE id = client_id
  AND deleted_at IS NOT NULL;
  
  RETURN FOUND;
END;
$$;

-- 7. Trigger para validar limite de clientes ao inserir
CREATE OR REPLACE FUNCTION check_client_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  plan_limit INTEGER;
  current_count INTEGER;
  org_plan TEXT;
BEGIN
  -- Buscar plano da organização
  SELECT subscription_plan INTO org_plan
  FROM organizations
  WHERE id = NEW.organization_id;
  
  -- Definir limite baseado no plano
  CASE org_plan
    WHEN 'free' THEN plan_limit := 50;
    WHEN 'pro' THEN plan_limit := 200;
    WHEN 'enterprise' THEN plan_limit := NULL; -- Ilimitado
    ELSE plan_limit := 50; -- Default para free
  END CASE;
  
  -- Se plano é enterprise (ilimitado), permitir
  IF plan_limit IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Contar TODOS os clientes (incluindo soft deleted)
  SELECT COUNT(*) INTO current_count
  FROM org_clients
  WHERE organization_id = NEW.organization_id;
  
  -- Validar limite
  IF current_count >= plan_limit THEN
    RAISE EXCEPTION 'Limite de clientes atingido (%). Faça upgrade do plano ou restaure clientes arquivados.', plan_limit;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 8. Adicionar trigger
DROP TRIGGER IF EXISTS trigger_check_client_limit ON org_clients;
CREATE TRIGGER trigger_check_client_limit
  BEFORE INSERT ON org_clients
  FOR EACH ROW
  EXECUTE FUNCTION check_client_limit();

-- 9. Atualizar RLS para excluir clientes deletados das queries normais
-- (mas admin pode ver todos)
DROP POLICY IF EXISTS "Users can view own organization clients" ON org_clients;
CREATE POLICY "Users can view own organization clients"
  ON org_clients
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM profiles 
      WHERE id = auth.uid()
    )
    AND deleted_at IS NULL -- Oculta clientes deletados
  );

-- Comentários explicativos
COMMENT ON COLUMN org_clients.deleted_at IS 'Soft delete: quando não NULL, cliente está arquivado mas ainda conta no limite do plano';
COMMENT ON FUNCTION soft_delete_client IS 'Arquiva cliente (soft delete) mas mantém contagem no limite do plano';
COMMENT ON FUNCTION restore_client IS 'Restaura cliente arquivado';
COMMENT ON FUNCTION count_organization_clients IS 'Conta TODOS os clientes para validação de limite de plano (incluindo arquivados)';
