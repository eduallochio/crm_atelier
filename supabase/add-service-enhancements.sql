-- Adicionar novos campos à tabela org_services
ALTER TABLE org_services
  ADD COLUMN IF NOT EXISTS materiais TEXT,
  ADD COLUMN IF NOT EXISTS custo_materiais DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS observacoes_tecnicas TEXT,
  ADD COLUMN IF NOT EXISTS nivel_dificuldade VARCHAR(20),
  ADD COLUMN IF NOT EXISTS tempo_minimo VARCHAR(50),
  ADD COLUMN IF NOT EXISTS tempo_maximo VARCHAR(50),
  ADD COLUMN IF NOT EXISTS imagens TEXT[];

-- Criar tabela de histórico de preços
CREATE TABLE IF NOT EXISTS org_service_price_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id UUID REFERENCES org_services ON DELETE CASCADE NOT NULL,
  preco_anterior DECIMAL(10,2),
  preco_novo DECIMAL(10,2) NOT NULL,
  motivo TEXT,
  user_id UUID REFERENCES auth.users,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índice no service_id
CREATE INDEX IF NOT EXISTS idx_price_history_service ON org_service_price_history(service_id);

-- Comentários nas colunas
COMMENT ON COLUMN org_services.materiais IS 'Lista de materiais necessários para o serviço';
COMMENT ON COLUMN org_services.custo_materiais IS 'Custo estimado dos materiais';
COMMENT ON COLUMN org_services.observacoes_tecnicas IS 'Instruções especiais e observações técnicas';
COMMENT ON COLUMN org_services.nivel_dificuldade IS 'Nível de dificuldade: facil, medio, dificil';
COMMENT ON COLUMN org_services.tempo_minimo IS 'Tempo mínimo estimado de execução';
COMMENT ON COLUMN org_services.tempo_maximo IS 'Tempo máximo estimado de execução';
COMMENT ON COLUMN org_services.imagens IS 'URLs das imagens do serviço';

COMMENT ON TABLE org_service_price_history IS 'Histórico de alterações de preço dos serviços';
