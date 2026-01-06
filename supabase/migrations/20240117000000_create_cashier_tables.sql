-- Tabela de Caixas (PDVs, caixas físicos)
CREATE TABLE IF NOT EXISTS org_cashiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Sessões de Caixa (abertura/fechamento)
CREATE TABLE IF NOT EXISTS org_cashier_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  caixa_id UUID NOT NULL REFERENCES org_cashiers(id) ON DELETE CASCADE,
  data_abertura TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_fechamento TIMESTAMP WITH TIME ZONE,
  saldo_inicial DECIMAL(10, 2) NOT NULL DEFAULT 0,
  saldo_esperado DECIMAL(10, 2),
  saldo_real DECIMAL(10, 2),
  diferenca DECIMAL(10, 2),
  status VARCHAR(20) DEFAULT 'aberto' CHECK (status IN ('aberto', 'fechado')),
  observacoes_abertura TEXT,
  observacoes_fechamento TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Movimentações de Caixa
CREATE TABLE IF NOT EXISTS org_cashier_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  sessao_id UUID NOT NULL REFERENCES org_cashier_sessions(id) ON DELETE CASCADE,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('entrada', 'saida', 'sangria', 'reforco')),
  valor DECIMAL(10, 2) NOT NULL,
  forma_pagamento VARCHAR(50) NOT NULL, -- dinheiro, pix, credito, debito, etc
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Conferência de Caixa (valores por forma de pagamento)
CREATE TABLE IF NOT EXISTS org_cashier_reconciliation (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  sessao_id UUID NOT NULL REFERENCES org_cashier_sessions(id) ON DELETE CASCADE,
  forma_pagamento VARCHAR(50) NOT NULL, -- dinheiro, pix, credito, debito, outros
  valor_esperado DECIMAL(10, 2) NOT NULL DEFAULT 0,
  valor_informado DECIMAL(10, 2) NOT NULL,
  diferenca DECIMAL(10, 2) GENERATED ALWAYS AS (valor_informado - valor_esperado) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_cashiers_org ON org_cashiers(organization_id);
CREATE INDEX idx_cashier_sessions_org ON org_cashier_sessions(organization_id);
CREATE INDEX idx_cashier_sessions_caixa ON org_cashier_sessions(caixa_id);
CREATE INDEX idx_cashier_sessions_status ON org_cashier_sessions(status);
CREATE INDEX idx_cashier_movements_org ON org_cashier_movements(organization_id);
CREATE INDEX idx_cashier_movements_sessao ON org_cashier_movements(sessao_id);
CREATE INDEX idx_cashier_movements_tipo ON org_cashier_movements(tipo);
CREATE INDEX idx_cashier_movements_created ON org_cashier_movements(created_at);
CREATE INDEX idx_cashier_reconciliation_org ON org_cashier_reconciliation(organization_id);
CREATE INDEX idx_cashier_reconciliation_sessao ON org_cashier_reconciliation(sessao_id);

-- RLS (Row Level Security)
ALTER TABLE org_cashiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_cashier_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_cashier_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_cashier_reconciliation ENABLE ROW LEVEL SECURITY;

-- Políticas de Segurança
CREATE POLICY "Users can view cashiers from their organization"
  ON org_cashiers FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can insert cashiers in their organization"
  ON org_cashiers FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update cashiers in their organization"
  ON org_cashiers FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can delete cashiers in their organization"
  ON org_cashiers FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can view cashier sessions from their organization"
  ON org_cashier_sessions FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can insert cashier sessions in their organization"
  ON org_cashier_sessions FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update cashier sessions in their organization"
  ON org_cashier_sessions FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can delete cashier sessions in their organization"
  ON org_cashier_sessions FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can view movements from their organization"
  ON org_cashier_movements FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can create movements in their organization"
  ON org_cashier_movements FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can view reconciliation from their organization"
  ON org_cashier_reconciliation FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can insert reconciliation in their organization"
  ON org_cashier_reconciliation FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update reconciliation in their organization"
  ON org_cashier_reconciliation FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can delete reconciliation in their organization"
  ON org_cashier_reconciliation FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

-- Triggers para atualizar updated_at
CREATE TRIGGER update_cashiers_updated_at
  BEFORE UPDATE ON org_cashiers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cashier_sessions_updated_at
  BEFORE UPDATE ON org_cashier_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Função para calcular saldo esperado ao fechar caixa
CREATE OR REPLACE FUNCTION calculate_expected_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'fechado' AND OLD.status = 'aberto' THEN
    -- Calcula o saldo esperado baseado nas movimentações
    SELECT 
      NEW.saldo_inicial + 
      COALESCE(SUM(CASE 
        WHEN tipo IN ('entrada', 'reforco') THEN valor
        WHEN tipo IN ('saida', 'sangria') THEN -valor
        ELSE 0
      END), 0)
    INTO NEW.saldo_esperado
    FROM org_cashier_movements
    WHERE sessao_id = NEW.id;
    
    -- Calcula a diferença se saldo_real foi informado
    IF NEW.saldo_real IS NOT NULL THEN
      NEW.diferenca := NEW.saldo_real - NEW.saldo_esperado;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_session_balance
  BEFORE UPDATE ON org_cashier_sessions
  FOR EACH ROW
  EXECUTE FUNCTION calculate_expected_balance();

-- Comentários nas tabelas
COMMENT ON TABLE org_cashiers IS 'Cadastro de caixas/PDVs da organização';
COMMENT ON TABLE org_cashier_sessions IS 'Sessões de abertura e fechamento de caixa';
COMMENT ON TABLE org_cashier_movements IS 'Movimentações financeiras do caixa';
COMMENT ON TABLE org_cashier_reconciliation IS 'Conferência de caixa por forma de pagamento';
