-- Adicionar campo de data de nascimento à tabela org_clients
ALTER TABLE org_clients
  ADD COLUMN IF NOT EXISTS data_nascimento DATE;

-- Adicionar campo de observações se ainda não existir
ALTER TABLE org_clients
  ADD COLUMN IF NOT EXISTS observacoes TEXT;

-- Criar índice para buscar aniversariantes
CREATE INDEX IF NOT EXISTS idx_org_clients_birthday_month_day 
  ON org_clients(EXTRACT(MONTH FROM data_nascimento), EXTRACT(DAY FROM data_nascimento))
  WHERE data_nascimento IS NOT NULL;

-- Comentários nas colunas
COMMENT ON COLUMN org_clients.data_nascimento IS 'Data de nascimento do cliente';
COMMENT ON COLUMN org_clients.observacoes IS 'Notas e observações sobre o cliente';
