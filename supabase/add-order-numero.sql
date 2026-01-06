-- Criar sequência para números de ordem
CREATE SEQUENCE IF NOT EXISTS org_service_orders_numero_seq START 1;

-- Adicionar coluna numero
ALTER TABLE org_service_orders
  ADD COLUMN IF NOT EXISTS numero INTEGER;

-- Atualizar ordens existentes com números sequenciais
UPDATE org_service_orders 
SET numero = nextval('org_service_orders_numero_seq')
WHERE numero IS NULL;

-- Tornar coluna obrigatória e única por organização
ALTER TABLE org_service_orders
  ALTER COLUMN numero SET NOT NULL;

-- Criar índice único composto (organization_id + numero)
CREATE UNIQUE INDEX IF NOT EXISTS idx_org_service_orders_org_numero 
  ON org_service_orders(organization_id, numero);

-- Criar função para gerar próximo número por organização
CREATE OR REPLACE FUNCTION get_next_order_numero(org_id UUID)
RETURNS INTEGER AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(numero), 0) + 1 INTO next_num
  FROM org_service_orders
  WHERE organization_id = org_id;
  
  RETURN next_num;
END;
$$ LANGUAGE plpgsql;

COMMENT ON COLUMN org_service_orders.numero IS 'Número sequencial da ordem por organização';
