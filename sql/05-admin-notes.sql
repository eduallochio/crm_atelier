-- =====================================================
-- CRM ATELIER - TABELA DE NOTAS ADMIN
-- Execute no SSMS após o 04-admin-tables.sql
-- Idempotente: pode ser rodado mais de uma vez
-- =====================================================

USE CrmAtelier;
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'admin_notes')
BEGIN
  CREATE TABLE admin_notes (
    id              UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    organization_id UNIQUEIDENTIFIER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    content         NVARCHAR(MAX)    NOT NULL,
    tags            NVARCHAR(500)    NULL,   -- JSON array de strings
    is_important    BIT              DEFAULT 0,
    created_by      UNIQUEIDENTIFIER NULL,   -- ID do admin (users com is_master=1)
    admin_email     NVARCHAR(255)    NULL,   -- Email do admin para exibição
    created_at      DATETIME2        DEFAULT GETDATE()
  );
  CREATE INDEX IX_admin_notes_org ON admin_notes (organization_id, created_at DESC);
  PRINT 'Tabela admin_notes criada.';
END
ELSE
  PRINT 'Tabela admin_notes já existe — pulando criação.';
GO
