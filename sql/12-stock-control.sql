USE MeuAtelier;
GO

-- ==================================================
-- 1. Toggle de controle de estoque nas preferências
-- ==================================================
ALTER TABLE org_system_preferences
ADD controla_estoque BIT NOT NULL DEFAULT 0;
GO

-- ==================================================
-- 2. Materiais por ordem de serviço
--    (produtos consumidos / reservados na OS)
--
--    NOTA: organization_id NÃO tem ON DELETE CASCADE
--    para evitar múltiplos caminhos de cascade:
--      organizations → org_order_materials (direto)
--      organizations → org_service_orders → org_order_materials
--    SQL Server rejeita criação quando há dois caminhos.
--    A FK de order_id já cobre a deleção em cascata.
-- ==================================================
CREATE TABLE org_order_materials (
  id              UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  organization_id UNIQUEIDENTIFIER NOT NULL REFERENCES organizations(id),
  order_id        UNIQUEIDENTIFIER NOT NULL REFERENCES org_service_orders(id) ON DELETE CASCADE,
  product_id      UNIQUEIDENTIFIER NULL     REFERENCES org_products(id),
  produto_nome    NVARCHAR(255)    NOT NULL,
  quantidade      DECIMAL(10,3)   NOT NULL,
  unidade         NVARCHAR(20)    NOT NULL DEFAULT 'un',
  created_at      DATETIME2       DEFAULT GETDATE()
);
GO

-- ==================================================
-- 3. Saídas de estoque (tabela cabeçalho)
--
--    service_order_id usa ON DELETE SET NULL para
--    evitar conflito quando org_service_orders é
--    deletada em cascata de organizations.
-- ==================================================
CREATE TABLE org_stock_exits (
  id               UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  organization_id  UNIQUEIDENTIFIER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  service_order_id UNIQUEIDENTIFIER NULL REFERENCES org_service_orders(id) ON DELETE SET NULL,
  tipo             NVARCHAR(20)    NOT NULL DEFAULT 'manual'
                     CHECK (tipo IN ('manual', 'ordem_servico')),
  observacoes      NVARCHAR(MAX)   NULL,
  created_at       DATETIME2       DEFAULT GETDATE()
);
GO

-- ==================================================
-- 4. Itens das saídas de estoque
-- ==================================================
CREATE TABLE org_stock_exit_items (
  id           UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  exit_id      UNIQUEIDENTIFIER NOT NULL REFERENCES org_stock_exits(id) ON DELETE CASCADE,
  product_id   UNIQUEIDENTIFIER NOT NULL REFERENCES org_products(id),
  produto_nome NVARCHAR(255)    NOT NULL,
  quantidade   DECIMAL(10,3)   NOT NULL,
  unidade      NVARCHAR(20)    NOT NULL DEFAULT 'un'
);
GO

-- ==================================================
-- 5. Trigger: decrementa quantidade_atual ao inserir
--    itens de saída
-- ==================================================
CREATE OR ALTER TRIGGER trg_stock_exit_item_insert
ON org_stock_exit_items
AFTER INSERT
AS
BEGIN
  SET NOCOUNT ON;
  UPDATE org_products
  SET quantidade_atual = quantidade_atual - i.quantidade,
      updated_at       = GETDATE()
  FROM org_products p
  INNER JOIN inserted i ON p.id = i.product_id;
END;
GO
