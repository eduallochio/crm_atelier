-- Adicionar campos de pagamento
ALTER TABLE org_service_orders
  ADD COLUMN IF NOT EXISTS valor_entrada DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS valor_pago DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status_pagamento TEXT DEFAULT 'pendente' CHECK (status_pagamento IN ('pendente', 'parcial', 'pago')),
  ADD COLUMN IF NOT EXISTS desconto_valor DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS desconto_percentual DECIMAL(5,2) DEFAULT 0;

-- Adicionar campos de mídia e comunicação
ALTER TABLE org_service_orders
  ADD COLUMN IF NOT EXISTS fotos TEXT[], -- Array de URLs das fotos
  ADD COLUMN IF NOT EXISTS notas_internas TEXT; -- Notas/comentários adicionais

-- Criar tabela de histórico de mudanças
CREATE TABLE IF NOT EXISTS org_service_order_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES org_service_orders ON DELETE CASCADE NOT NULL,
  organization_id UUID NOT NULL,
  user_email TEXT NOT NULL,
  campo_alterado TEXT NOT NULL,
  valor_anterior TEXT,
  valor_novo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para performance
CREATE INDEX IF NOT EXISTS idx_order_history_order_id ON org_service_order_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_history_created_at ON org_service_order_history(created_at DESC);

-- Criar tabela de notas/comentários
CREATE TABLE IF NOT EXISTS org_service_order_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES org_service_orders ON DELETE CASCADE NOT NULL,
  organization_id UUID NOT NULL,
  user_email TEXT NOT NULL,
  nota TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para performance
CREATE INDEX IF NOT EXISTS idx_order_notes_order_id ON org_service_order_notes(order_id);
CREATE INDEX IF NOT EXISTS idx_order_notes_created_at ON org_service_order_notes(created_at DESC);

-- Comentários
COMMENT ON COLUMN org_service_orders.valor_entrada IS 'Valor de entrada pago no momento da abertura da ordem';
COMMENT ON COLUMN org_service_orders.valor_pago IS 'Valor total já pago pelo cliente';
COMMENT ON COLUMN org_service_orders.status_pagamento IS 'Status do pagamento: pendente, parcial ou pago';
COMMENT ON COLUMN org_service_orders.desconto_valor IS 'Desconto em valor fixo aplicado';
COMMENT ON COLUMN org_service_orders.desconto_percentual IS 'Desconto em percentual aplicado';
COMMENT ON COLUMN org_service_orders.fotos IS 'Array de URLs das fotos anexadas';
COMMENT ON COLUMN org_service_orders.notas_internas IS 'Notas e observações internas';

COMMENT ON TABLE org_service_order_history IS 'Histórico de alterações nas ordens de serviço';
COMMENT ON TABLE org_service_order_notes IS 'Notas e comentários adicionados durante a execução';
