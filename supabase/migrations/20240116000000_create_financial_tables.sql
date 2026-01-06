-- =====================================================
-- TABELAS FINANCEIRAS - CRM ATELIER
-- =====================================================

-- Tabela de Categorias de Despesas/Receitas
CREATE TABLE IF NOT EXISTS org_financial_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('receita', 'despesa')),
  cor TEXT, -- cor para visualização
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de Métodos de Pagamento
CREATE TABLE IF NOT EXISTS org_payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo TEXT CHECK (tipo IN ('dinheiro', 'cartao_credito', 'cartao_debito', 'pix', 'transferencia', 'boleto', 'outro')),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de Contas a Receber
CREATE TABLE IF NOT EXISTS org_receivables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  service_order_id UUID REFERENCES org_service_orders(id) ON DELETE SET NULL,
  client_id UUID REFERENCES org_clients(id) ON DELETE SET NULL,
  descricao TEXT NOT NULL,
  valor NUMERIC(10,2) NOT NULL,
  data_vencimento DATE NOT NULL,
  data_recebimento DATE,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'recebido', 'atrasado', 'cancelado')),
  category_id UUID REFERENCES org_financial_categories(id) ON DELETE SET NULL,
  payment_method_id UUID REFERENCES org_payment_methods(id) ON DELETE SET NULL,
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de Contas a Pagar
CREATE TABLE IF NOT EXISTS org_payables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  fornecedor TEXT NOT NULL,
  descricao TEXT NOT NULL,
  valor NUMERIC(10,2) NOT NULL,
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'atrasado', 'cancelado')),
  category_id UUID REFERENCES org_financial_categories(id) ON DELETE SET NULL,
  payment_method_id UUID REFERENCES org_payment_methods(id) ON DELETE SET NULL,
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de Transações (Fluxo de Caixa)
CREATE TABLE IF NOT EXISTS org_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  descricao TEXT NOT NULL,
  valor NUMERIC(10,2) NOT NULL,
  data DATE NOT NULL,
  category_id UUID REFERENCES org_financial_categories(id) ON DELETE SET NULL,
  payment_method_id UUID REFERENCES org_payment_methods(id) ON DELETE SET NULL,
  receivable_id UUID REFERENCES org_receivables(id) ON DELETE SET NULL,
  payable_id UUID REFERENCES org_payables(id) ON DELETE SET NULL,
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_financial_categories_org ON org_financial_categories(organization_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_org ON org_payment_methods(organization_id);
CREATE INDEX IF NOT EXISTS idx_receivables_org ON org_receivables(organization_id);
CREATE INDEX IF NOT EXISTS idx_receivables_status ON org_receivables(status);
CREATE INDEX IF NOT EXISTS idx_receivables_vencimento ON org_receivables(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_payables_org ON org_payables(organization_id);
CREATE INDEX IF NOT EXISTS idx_payables_status ON org_payables(status);
CREATE INDEX IF NOT EXISTS idx_payables_vencimento ON org_payables(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_transactions_org ON org_transactions(organization_id);
CREATE INDEX IF NOT EXISTS idx_transactions_data ON org_transactions(data);
CREATE INDEX IF NOT EXISTS idx_transactions_tipo ON org_transactions(tipo);

-- =====================================================
-- TRIGGERS PARA UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_financial_categories_updated_at
  BEFORE UPDATE ON org_financial_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_receivables_updated_at
  BEFORE UPDATE ON org_receivables
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payables_updated_at
  BEFORE UPDATE ON org_payables
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNÇÃO PARA ATUALIZAR STATUS AUTOMATICAMENTE
-- =====================================================

-- Atualiza status de contas a receber para "atrasado"
CREATE OR REPLACE FUNCTION update_receivable_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'pendente' AND NEW.data_vencimento < CURRENT_DATE THEN
    NEW.status = 'atrasado';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_receivable_status
  BEFORE INSERT OR UPDATE ON org_receivables
  FOR EACH ROW
  EXECUTE FUNCTION update_receivable_status();

-- Atualiza status de contas a pagar para "atrasado"
CREATE OR REPLACE FUNCTION update_payable_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'pendente' AND NEW.data_vencimento < CURRENT_DATE THEN
    NEW.status = 'atrasado';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_payable_status
  BEFORE INSERT OR UPDATE ON org_payables
  FOR EACH ROW
  EXECUTE FUNCTION update_payable_status();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE org_financial_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_receivables ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_payables ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_transactions ENABLE ROW LEVEL SECURITY;

-- Políticas para Financial Categories
CREATE POLICY "Users can view org financial categories"
  ON org_financial_categories FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can insert org financial categories"
  ON org_financial_categories FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update org financial categories"
  ON org_financial_categories FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can delete org financial categories"
  ON org_financial_categories FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

-- Políticas para Payment Methods
CREATE POLICY "Users can view org payment methods"
  ON org_payment_methods FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can insert org payment methods"
  ON org_payment_methods FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update org payment methods"
  ON org_payment_methods FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can delete org payment methods"
  ON org_payment_methods FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

-- Políticas para Receivables
CREATE POLICY "Users can view org receivables"
  ON org_receivables FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can insert org receivables"
  ON org_receivables FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update org receivables"
  ON org_receivables FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can delete org receivables"
  ON org_receivables FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

-- Políticas para Payables
CREATE POLICY "Users can view org payables"
  ON org_payables FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can insert org payables"
  ON org_payables FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update org payables"
  ON org_payables FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can delete org payables"
  ON org_payables FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

-- Políticas para Transactions
CREATE POLICY "Users can view org transactions"
  ON org_transactions FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can insert org transactions"
  ON org_transactions FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update org transactions"
  ON org_transactions FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can delete org transactions"
  ON org_transactions FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

-- =====================================================
-- DADOS INICIAIS (CATEGORIAS E MÉTODOS PADRÃO)
-- =====================================================

-- Inserir categorias padrão de receitas (será feito via aplicação para cada org)
-- Inserir categorias padrão de despesas (será feito via aplicação para cada org)
-- Inserir métodos de pagamento padrão (será feito via aplicação para cada org)

COMMENT ON TABLE org_financial_categories IS 'Categorias de receitas e despesas';
COMMENT ON TABLE org_payment_methods IS 'Métodos de pagamento disponíveis';
COMMENT ON TABLE org_receivables IS 'Contas a receber';
COMMENT ON TABLE org_payables IS 'Contas a pagar (fornecedores, despesas)';
COMMENT ON TABLE org_transactions IS 'Histórico de transações (fluxo de caixa)';
