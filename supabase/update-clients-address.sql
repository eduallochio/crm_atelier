-- Adicionar novos campos de endereço à tabela org_clients
ALTER TABLE org_clients
  DROP COLUMN IF EXISTS endereco,
  ADD COLUMN cep VARCHAR(9),
  ADD COLUMN logradouro VARCHAR(255),
  ADD COLUMN numero VARCHAR(20),
  ADD COLUMN complemento VARCHAR(100),
  ADD COLUMN bairro VARCHAR(100),
  ADD COLUMN cidade VARCHAR(100),
  ADD COLUMN estado VARCHAR(2);

-- Criar índice no CEP para buscas rápidas
CREATE INDEX IF NOT EXISTS idx_org_clients_cep ON org_clients(cep);

-- Comentários nas colunas
COMMENT ON COLUMN org_clients.cep IS 'CEP no formato 00000-000';
COMMENT ON COLUMN org_clients.logradouro IS 'Rua, avenida, etc';
COMMENT ON COLUMN org_clients.numero IS 'Número do endereço';
COMMENT ON COLUMN org_clients.complemento IS 'Apartamento, bloco, sala, etc';
COMMENT ON COLUMN org_clients.bairro IS 'Bairro';
COMMENT ON COLUMN org_clients.cidade IS 'Cidade';
COMMENT ON COLUMN org_clients.estado IS 'UF - Sigla do estado';
