-- =====================================================
-- MASTER USER SETUP
-- Execute no banco CrmAtelier
-- =====================================================
USE CrmAtelier;
GO

-- 1. Adiciona coluna is_master na tabela users
--    (pula se já existir)
IF NOT EXISTS (
  SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'is_master'
)
BEGIN
  ALTER TABLE users ADD is_master BIT NOT NULL DEFAULT 0;
  PRINT 'Coluna is_master adicionada.';
END
ELSE
  PRINT 'Coluna is_master já existe.';
GO

-- 2. Cria organização do sistema (master)
--    (pula se já existir)
IF NOT EXISTS (SELECT 1 FROM organizations WHERE slug = 'system-master')
BEGIN
  INSERT INTO organizations (id, name, slug, [plan], subscription_status)
  VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Sistema Master',
    'system-master',
    'enterprise',
    'active'
  );
  PRINT 'Organização master criada.';
END
ELSE
  PRINT 'Organização master já existe.';
GO

-- =====================================================
-- 3. CRIAR USUÁRIO MASTER
--
-- IMPORTANTE: A senha precisa ser gerada com bcrypt
-- pelo endpoint /api/setup/master (veja abaixo).
--
-- Você também pode gerar o hash manualmente em Node.js:
--   node -e "const b=require('bcryptjs');b.hash('SUA_SENHA',12).then(h=>console.log(h))"
-- e substituir o campo password_hash abaixo.
-- =====================================================
-- Exemplo com hash pré-gerado (senha: Master@2025!):
-- Se quiser usar a API, DELETE esta instrução e use o endpoint.

-- DESCOMENTE E AJUSTE APÓS GERAR O HASH:
/*
INSERT INTO users (id, organization_id, email, password_hash, full_name, [role], is_owner, is_master)
VALUES (
  NEWID(),
  '00000000-0000-0000-0000-000000000001',
  'master@crmatelier.com',
  '$SUBSTITUA_PELO_HASH_BCRYPT',
  'Administrador Master',
  'owner',
  1,
  1
);
*/

-- =====================================================
-- 4. Promover usuário existente a master
--    (substitua o email pelo desejado)
-- =====================================================
/*
UPDATE users SET is_master = 1 WHERE email = 'seu-email@exemplo.com';
*/
GO

PRINT 'Script concluído. Use /api/setup/master para criar o usuário master via API.';
GO
