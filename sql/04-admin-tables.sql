-- =====================================================
-- CRM ATELIER - TABELAS ADMINISTRATIVAS
-- Execute no SSMS após o 03-plans-table.sql
-- Idempotente: pode ser rodado mais de uma vez
-- =====================================================

USE CrmAtelier;
GO

-- =====================================================
-- 1. LOGS DE AUDITORIA ADMIN
-- =====================================================
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'admin_logs')
BEGIN
  CREATE TABLE admin_logs (
    id            UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    action        NVARCHAR(100)    NOT NULL,   -- 'plan_change', 'state_change', 'plan_create', etc.
    resource_type NVARCHAR(50)     NULL,       -- 'organization', 'plan', 'user'
    resource_id   NVARCHAR(255)    NULL,       -- UUID da entidade afetada
    description   NVARCHAR(500)    NOT NULL,
    admin_email   NVARCHAR(255)    NULL,
    details_json  NVARCHAR(MAX)    NULL,       -- contexto adicional em JSON
    created_at    DATETIME2        DEFAULT GETDATE()
  );
  CREATE INDEX IX_admin_logs_created_at ON admin_logs (created_at DESC);
  CREATE INDEX IX_admin_logs_action     ON admin_logs (action);
  CREATE INDEX IX_admin_logs_resource   ON admin_logs (resource_type, resource_id);
  PRINT 'Tabela admin_logs criada.';
END
ELSE
  PRINT 'Tabela admin_logs já existe — pulando criação.';
GO

-- =====================================================
-- 2. CONFIGURAÇÕES DO SISTEMA (key-value)
-- =====================================================
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'admin_system_settings')
BEGIN
  CREATE TABLE admin_system_settings (
    [key]      NVARCHAR(100) PRIMARY KEY,
    value      NVARCHAR(MAX) NOT NULL DEFAULT '',
    updated_at DATETIME2     DEFAULT GETDATE(),
    updated_by NVARCHAR(255) NULL
  );
  PRINT 'Tabela admin_system_settings criada.';
END
ELSE
  PRINT 'Tabela admin_system_settings já existe — pulando criação.';
GO

-- Seed das configurações padrão (só insere se não existir)
MERGE admin_system_settings AS target
USING (VALUES
  ('site_name',             'CRM Ateliê'),
  ('support_email',         'suporte@crmatelier.com'),
  ('max_users_free',        '2'),
  ('enable_signup',         'true'),
  ('enable_trial',          'false'),
  ('trial_duration_days',   '14'),
  ('maintenance_mode',      'false'),
  ('announcement',          '')
) AS source ([key], value)
ON target.[key] = source.[key]
WHEN NOT MATCHED THEN
  INSERT ([key], value) VALUES (source.[key], source.value);
GO

PRINT 'Configurações padrão inseridas/verificadas.';
GO
