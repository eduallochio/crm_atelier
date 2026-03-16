-- Migration 07: adiciona colunas faltantes + semeia formas de pagamento padrão
-- Execute no banco CrmAtelier antes de usar /api/payment-methods

-- 1. Adicionar colunas novas (idempotente)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('org_payment_methods') AND name = 'color')
  ALTER TABLE org_payment_methods ADD color NVARCHAR(7) NULL;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('org_payment_methods') AND name = 'icon')
  ALTER TABLE org_payment_methods ADD icon NVARCHAR(50) NULL;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('org_payment_methods') AND name = 'is_default')
  ALTER TABLE org_payment_methods ADD is_default BIT NOT NULL DEFAULT 0;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('org_payment_methods') AND name = 'display_order')
  ALTER TABLE org_payment_methods ADD display_order INT NOT NULL DEFAULT 0;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('org_payment_methods') AND name = 'updated_at')
  ALTER TABLE org_payment_methods ADD updated_at DATETIME2 DEFAULT GETDATE();
GO

-- 2. Semear formas de pagamento padrão para organizações que ainda não têm nenhuma
INSERT INTO org_payment_methods (organization_id, nome, tipo, ativo, is_default, display_order, color, icon)
SELECT
  o.id,
  pm.nome,
  pm.tipo,
  1,               -- ativo
  pm.is_default,
  pm.display_order,
  pm.color,
  pm.icon
FROM organizations o
CROSS JOIN (VALUES
  ('Dinheiro',         'dinheiro',       1, 1, '#22c55e', 'banknote'),
  ('Pix',              'pix',            1, 2, '#8b5cf6', 'qr-code'),
  ('Cartão de Crédito','cartao_credito', 0, 3, '#3b82f6', 'credit-card'),
  ('Cartão de Débito', 'cartao_debito',  0, 4, '#f59e0b', 'credit-card')
) AS pm(nome, tipo, is_default, display_order, color, icon)
WHERE NOT EXISTS (
  SELECT 1 FROM org_payment_methods opm
  WHERE opm.organization_id = o.id
);

PRINT 'Migration 07 aplicada com sucesso.';
