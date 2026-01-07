-- Adicionar campo logo_url à tabela organizations
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS logo_url TEXT;
