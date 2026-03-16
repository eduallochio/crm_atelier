-- Migration: Adiciona category_id em org_payables
-- Permite vincular contas a pagar às categorias financeiras da organização
-- e destrava a análise de despesas por categoria no dashboard

ALTER TABLE org_payables
ADD category_id UNIQUEIDENTIFIER NULL
    REFERENCES org_financial_categories(id) ON DELETE NO ACTION;
GO

CREATE INDEX idx_payables_category ON org_payables(category_id);
GO
