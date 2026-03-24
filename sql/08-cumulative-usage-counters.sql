-- =====================================================
-- CRM ATELIER - CONTADORES CUMULATIVOS DE USO
-- Adiciona total_clients_ever e total_orders_ever em
-- usage_metrics para impedir que exclusões resetem o
-- limite do plano free.
-- Execute no SSMS no banco CrmAtelier após o 07-*.sql
-- =====================================================

USE CrmAtelier;
GO

-- Adiciona coluna total_clients_ever (se não existir)
IF NOT EXISTS (
  SELECT 1 FROM sys.columns
  WHERE object_id = OBJECT_ID('usage_metrics') AND name = 'total_clients_ever'
)
BEGIN
  ALTER TABLE usage_metrics ADD total_clients_ever INT NOT NULL DEFAULT 0;
  PRINT 'Coluna total_clients_ever adicionada.';
END
ELSE
  PRINT 'total_clients_ever já existe — pulando.';
GO

-- Adiciona coluna total_orders_ever (se não existir)
IF NOT EXISTS (
  SELECT 1 FROM sys.columns
  WHERE object_id = OBJECT_ID('usage_metrics') AND name = 'total_orders_ever'
)
BEGIN
  ALTER TABLE usage_metrics ADD total_orders_ever INT NOT NULL DEFAULT 0;
  PRINT 'Coluna total_orders_ever adicionada.';
END
ELSE
  PRINT 'total_orders_ever já existe — pulando.';
GO

-- Inicializa os contadores com os valores atuais de clients_count e orders_count
-- (para organizações que já existem antes desta migration)
UPDATE usage_metrics
SET
  total_clients_ever = CASE WHEN total_clients_ever = 0 THEN clients_count ELSE total_clients_ever END,
  total_orders_ever  = CASE WHEN total_orders_ever  = 0 THEN orders_count  ELSE total_orders_ever  END;
PRINT 'Contadores inicializados a partir dos valores existentes.';
GO
