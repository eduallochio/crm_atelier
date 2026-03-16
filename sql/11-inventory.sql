USE MeuAtelier;
GO

-- Produtos do estoque
CREATE TABLE org_products (
  id                 UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  organization_id    UNIQUEIDENTIFIER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  nome               NVARCHAR(255) NOT NULL,
  descricao          NVARCHAR(MAX) NULL,
  categoria          NVARCHAR(100) NULL,
  unidade            NVARCHAR(20) NOT NULL DEFAULT 'un',
  quantidade_atual   DECIMAL(10,3) NOT NULL DEFAULT 0,
  quantidade_minima  DECIMAL(10,3) NOT NULL DEFAULT 0,
  preco_custo        DECIMAL(10,2) NULL,
  codigo_barras      NVARCHAR(100) NULL,
  ativo              BIT NOT NULL DEFAULT 1,
  created_at         DATETIME2 DEFAULT GETDATE(),
  updated_at         DATETIME2 DEFAULT GETDATE()
);
GO

-- Entradas de estoque (podem ter nota fiscal)
CREATE TABLE org_stock_entries (
  id               UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  organization_id  UNIQUEIDENTIFIER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  supplier_id      UNIQUEIDENTIFIER NULL REFERENCES org_suppliers(id),
  tipo             NVARCHAR(10) NOT NULL DEFAULT 'manual'
                     CHECK (tipo IN ('manual', 'NFe', 'NFCe')),
  numero_nota      NVARCHAR(50) NULL,
  serie_nota       NVARCHAR(10) NULL,
  chave_acesso     NVARCHAR(44) NULL,
  emitente_cnpj    NVARCHAR(20) NULL,
  emitente_nome    NVARCHAR(255) NULL,
  data_emissao     DATETIME2 NULL,
  valor_total      DECIMAL(10,2) NULL,
  observacoes      NVARCHAR(MAX) NULL,
  created_at       DATETIME2 DEFAULT GETDATE()
);
GO

-- Itens das entradas
CREATE TABLE org_stock_entry_items (
  id               UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  entry_id         UNIQUEIDENTIFIER NOT NULL REFERENCES org_stock_entries(id) ON DELETE CASCADE,
  product_id       UNIQUEIDENTIFIER NULL REFERENCES org_products(id),
  produto_nome     NVARCHAR(255) NOT NULL,
  quantidade       DECIMAL(10,3) NOT NULL,
  unidade          NVARCHAR(20) NOT NULL DEFAULT 'un',
  preco_unitario   DECIMAL(10,2) NULL,
  preco_total      DECIMAL(10,2) NULL
);
GO

-- Trigger: atualiza quantidade_atual ao inserir item de entrada
CREATE OR ALTER TRIGGER trg_stock_entry_item_insert
ON org_stock_entry_items
AFTER INSERT
AS
BEGIN
  SET NOCOUNT ON;
  UPDATE org_products
  SET quantidade_atual = quantidade_atual + i.quantidade,
      updated_at = GETDATE()
  FROM org_products p
  INNER JOIN inserted i ON p.id = i.product_id
  WHERE i.product_id IS NOT NULL;
END;
GO
