-- Atualizar estrutura da tabela org_services
ALTER TABLE org_services
  -- Renomear coluna valor para preco
  RENAME COLUMN valor TO preco;

-- Adicionar novas colunas
ALTER TABLE org_services
  ADD COLUMN IF NOT EXISTS categoria TEXT,
  ADD COLUMN IF NOT EXISTS tempo_estimado TEXT;

-- Remover coluna tipo (substituída por categoria)
ALTER TABLE org_services
  DROP COLUMN IF EXISTS tipo;

-- Comentários nas colunas
COMMENT ON COLUMN org_services.nome IS 'Nome do serviço';
COMMENT ON COLUMN org_services.descricao IS 'Descrição detalhada do serviço';
COMMENT ON COLUMN org_services.preco IS 'Preço do serviço';
COMMENT ON COLUMN org_services.categoria IS 'Categoria do serviço (ex: Ajustes, Customização)';
COMMENT ON COLUMN org_services.tempo_estimado IS 'Tempo estimado para conclusão';
COMMENT ON COLUMN org_services.ativo IS 'Se o serviço está ativo para novos pedidos';
