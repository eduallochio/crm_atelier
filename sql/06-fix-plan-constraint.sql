-- =====================================================
-- CRM ATELIER - CORRIGE CONSTRAINT DE PLANO E ESTADO
-- Execute no SSMS
-- Problema: organizations.[plan] só aceitava 'free' e 'enterprise'
--           Precisamos adicionar 'pro' ao domínio
-- =====================================================

USE CrmAtelier;
GO

-- ── Remover constraint antiga de [plan] ─────────────────────────────────────
DECLARE @constraintName NVARCHAR(256)
SELECT @constraintName = name
FROM sys.check_constraints
WHERE parent_object_id = OBJECT_ID('organizations')
  AND name LIKE '%plan%'

IF @constraintName IS NOT NULL
BEGIN
  EXEC ('ALTER TABLE organizations DROP CONSTRAINT [' + @constraintName + ']')
  PRINT 'Constraint de plan removida: ' + @constraintName
END
ELSE
  PRINT 'Nenhuma constraint de plan encontrada.'
GO

-- ── Adicionar nova constraint com 'pro' incluído ────────────────────────────
ALTER TABLE organizations
  ADD CONSTRAINT CK_organizations_plan
  CHECK ([plan] IN ('free', 'pro', 'enterprise'));
GO

PRINT 'Nova constraint CK_organizations_plan criada (free, pro, enterprise).';
GO

-- ── Corrigir constraint de state se existir ──────────────────────────────────
DECLARE @stateConstraint NVARCHAR(256)
SELECT @stateConstraint = name
FROM sys.check_constraints
WHERE parent_object_id = OBJECT_ID('organizations')
  AND name LIKE '%state%'

IF @stateConstraint IS NOT NULL
BEGIN
  EXEC ('ALTER TABLE organizations DROP CONSTRAINT [' + @stateConstraint + ']')
  PRINT 'Constraint de state removida: ' + @stateConstraint
END
GO

-- state não tem constraint no schema original, mas garantir que o campo existe
IF NOT EXISTS (
  SELECT 1 FROM sys.columns
  WHERE object_id = OBJECT_ID('organizations') AND name = 'state'
)
BEGIN
  ALTER TABLE organizations ADD state NVARCHAR(50) NULL DEFAULT 'active';
  PRINT 'Coluna state adicionada.';
END
ELSE
  PRINT 'Coluna state já existe.';
GO

PRINT 'Migração 06 concluída.';
GO
