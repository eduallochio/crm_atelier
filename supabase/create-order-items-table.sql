-- Criar tabela de itens da ordem de serviço
CREATE TABLE IF NOT EXISTS org_service_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES org_service_orders ON DELETE CASCADE NOT NULL,
  service_id UUID REFERENCES org_services ON DELETE SET NULL,
  service_nome TEXT NOT NULL,
  quantidade INTEGER DEFAULT 1,
  valor_unitario DECIMAL(10,2) NOT NULL,
  valor_total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON org_service_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_service_id ON org_service_order_items(service_id);

-- Comentários
COMMENT ON TABLE org_service_order_items IS 'Itens/serviços incluídos em cada ordem de serviço';
COMMENT ON COLUMN org_service_order_items.service_nome IS 'Nome do serviço (cópia para histórico)';
COMMENT ON COLUMN org_service_order_items.quantidade IS 'Quantidade de vezes que o serviço será executado';
