-- =====================================================
-- Migração 05: Adiciona plano 'pro' + configurações de limite
-- Execute no SSMS no banco CrmAtelier
-- =====================================================

-- 1. Atualizar CHECK constraint de organizations para incluir 'pro'
-- Primeiro, descobrir o nome da constraint existente
DECLARE @constraintName NVARCHAR(255)
SELECT @constraintName = name
FROM sys.check_constraints
WHERE parent_object_id = OBJECT_ID('organizations')
  AND CHARINDEX('plan', definition) > 0

IF @constraintName IS NOT NULL
BEGIN
  EXEC('ALTER TABLE organizations DROP CONSTRAINT ' + @constraintName)
  PRINT 'Constraint antiga removida: ' + @constraintName
END

ALTER TABLE organizations
  ADD CONSTRAINT CK_organizations_plan
  CHECK ([plan] IN ('free', 'pro', 'enterprise'))

PRINT 'CHECK constraint atualizada para incluir pro'

-- 2. Inserir configurações de limite no admin_system_settings (se não existirem)
IF NOT EXISTS (SELECT 1 FROM admin_system_settings WHERE [key] = 'max_clients_free')
  INSERT INTO admin_system_settings ([key], value) VALUES ('max_clients_free', '50')

IF NOT EXISTS (SELECT 1 FROM admin_system_settings WHERE [key] = 'max_services_free')
  INSERT INTO admin_system_settings ([key], value) VALUES ('max_services_free', '20')

IF NOT EXISTS (SELECT 1 FROM admin_system_settings WHERE [key] = 'max_orders_free')
  INSERT INTO admin_system_settings ([key], value) VALUES ('max_orders_free', '100')

-- max_users_free pode já existir; garantir padrão
IF NOT EXISTS (SELECT 1 FROM admin_system_settings WHERE [key] = 'max_users_free')
  INSERT INTO admin_system_settings ([key], value) VALUES ('max_users_free', '3')

PRINT 'Configurações de limite inseridas/verificadas'

SELECT [key], value FROM admin_system_settings
WHERE [key] IN ('max_clients_free','max_services_free','max_orders_free','max_users_free')
ORDER BY [key]
