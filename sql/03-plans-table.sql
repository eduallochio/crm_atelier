-- =====================================================
-- CRM ATELIER - TABELA DE PLANOS
-- Execute no SSMS após o 01-schema.sql
-- Idempotente: pode ser rodado mais de uma vez
-- =====================================================

USE CrmAtelier;
GO

-- Cria tabela se não existir
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'plans')
BEGIN
  CREATE TABLE plans (
    id            UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    slug          NVARCHAR(50)     NOT NULL UNIQUE,
    name          NVARCHAR(100)    NOT NULL,
    description   NVARCHAR(500)    NULL,
    price         DECIMAL(10,2)    NOT NULL DEFAULT 0.00,
    price_annual  DECIMAL(10,2)    NULL,
    annual_note   NVARCHAR(255)    NULL,
    badge         NVARCHAR(50)     NULL,
    is_featured   BIT              NOT NULL DEFAULT 0,
    is_active     BIT              NOT NULL DEFAULT 1,
    features_json NVARCHAR(MAX)    NULL,
    cta_text      NVARCHAR(100)    NULL DEFAULT 'Criar conta',
    cta_url       NVARCHAR(255)    NULL DEFAULT '/cadastro',
    sort_order    INT              NOT NULL DEFAULT 0,
    created_at    DATETIME2        DEFAULT GETDATE(),
    updated_at    DATETIME2        DEFAULT GETDATE()
  );
  PRINT 'Tabela plans criada.';
END
ELSE
  PRINT 'Tabela plans já existe — pulando criação.';
GO

-- Seed: plano Free (insere apenas se não existir)
IF NOT EXISTS (SELECT 1 FROM plans WHERE slug = 'free')
BEGIN
  INSERT INTO plans (slug, name, description, price, badge, is_featured, is_active, features_json, cta_text, cta_url, sort_order)
  VALUES (
    'free',
    'Free',
    'Para começar',
    0.00,
    NULL,
    0,
    1,
    N'[{"text":"Até 50 clientes","included":true},{"text":"Até 2 usuários","included":true},{"text":"100 ordens/mês","included":true},{"text":"500 MB armazenamento","included":true},{"text":"Dashboard básico","included":true},{"text":"Controle de caixa","included":true},{"text":"Contas a pagar/receber","included":true},{"text":"Relatórios avançados","included":false},{"text":"Exportação de dados","included":false}]',
    'Criar conta grátis',
    '/cadastro',
    1
  );
  PRINT 'Plano Free inserido.';
END
ELSE
  PRINT 'Plano Free já existe — pulando seed.';
GO

-- Seed: plano Pro (insere apenas se não existir)
IF NOT EXISTS (SELECT 1 FROM plans WHERE slug = 'pro')
BEGIN
  INSERT INTO plans (slug, name, description, price, price_annual, annual_note, badge, is_featured, is_active, features_json, cta_text, cta_url, sort_order)
  VALUES (
    'pro',
    'Pro',
    'Para crescer',
    59.90,
    599.00,
    'ou R$ 599/ano — 2 meses grátis',
    'Popular',
    1,
    1,
    N'[{"text":"Até 200 clientes","included":true},{"text":"Até 5 usuários","included":true},{"text":"1.000 ordens/mês","included":true},{"text":"5 GB armazenamento","included":true},{"text":"Tudo do plano Free +","included":true},{"text":"Relatórios avançados","included":true},{"text":"Exportação Excel/PDF","included":true},{"text":"Dashboards personalizados","included":true},{"text":"Lembretes automáticos","included":true},{"text":"Suporte prioritário (12h)","included":true}]',
    'Iniciar teste grátis',
    '/cadastro',
    2
  );
  PRINT 'Plano Pro inserido.';
END
ELSE
  PRINT 'Plano Pro já existe — pulando seed.';
GO
