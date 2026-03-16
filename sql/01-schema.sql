-- =====================================================
-- CRM ATELIER - SQL SERVER SCHEMA
-- Banco: CrmAtelier
-- =====================================================
-- Execute no SQL Server Management Studio (SSMS)
-- ou via sqlcmd apontando para o banco CrmAtelier
-- =====================================================

USE CrmAtelier;
GO

-- =====================================================
-- 1. ORGANIZAÇÕES (Tenants)
-- =====================================================
-- NOTA: [plan] é palavra reservada no SQL Server
CREATE TABLE organizations (
  id                  UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  name                NVARCHAR(255) NOT NULL,
  slug                NVARCHAR(255) NOT NULL UNIQUE,
  [plan]              NVARCHAR(20) NOT NULL DEFAULT 'free'
                        CHECK ([plan] IN ('free', 'enterprise')),
  stripe_customer_id  NVARCHAR(255) NULL,
  subscription_status NVARCHAR(50) NULL DEFAULT 'inactive',
  email               NVARCHAR(255) NULL,
  phone               NVARCHAR(50) NULL,
  cnpj                NVARCHAR(20) NULL,
  address             NVARCHAR(500) NULL,
  city                NVARCHAR(100) NULL,
  state               NVARCHAR(50) NULL,
  zip_code            NVARCHAR(20) NULL,
  website             NVARCHAR(500) NULL,
  logo_url            NVARCHAR(1000) NULL,
  created_at          DATETIME2 DEFAULT GETDATE(),
  updated_at          DATETIME2 DEFAULT GETDATE()
);
GO

-- =====================================================
-- 2. USUÁRIOS (unifica auth.users + profiles)
-- =====================================================
-- NOTA: [role] é palavra reservada no SQL Server
CREATE TABLE users (
  id               UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  organization_id  UNIQUEIDENTIFIER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email            NVARCHAR(255) NOT NULL UNIQUE,
  password_hash    NVARCHAR(255) NOT NULL,
  full_name        NVARCHAR(255) NULL,
  [role]           NVARCHAR(20) NOT NULL DEFAULT 'owner'
                     CHECK ([role] IN ('owner', 'admin', 'member')),
  is_owner         BIT NOT NULL DEFAULT 0,
  created_at       DATETIME2 DEFAULT GETDATE()
);
GO

-- =====================================================
-- 3. MÉTRICAS DE USO
-- =====================================================
CREATE TABLE usage_metrics (
  id              UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  organization_id UNIQUEIDENTIFIER NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  clients_count   INT NOT NULL DEFAULT 0,
  orders_count    INT NOT NULL DEFAULT 0,
  users_count     INT NOT NULL DEFAULT 1,
  updated_at      DATETIME2 DEFAULT GETDATE()
);
GO

-- =====================================================
-- 4. PERSONALIZAÇÃO (White-label)
-- =====================================================
CREATE TABLE customization_settings (
  id               UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  organization_id  UNIQUEIDENTIFIER NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  primary_color    NVARCHAR(7) NOT NULL DEFAULT '#3b82f6',
  secondary_color  NVARCHAR(7) NOT NULL DEFAULT '#10b981',
  logo_url         NVARCHAR(1000) NULL,
  atelier_name     NVARCHAR(255) NULL,
  updated_at       DATETIME2 DEFAULT GETDATE()
);
GO

-- =====================================================
-- 5. CLIENTES
-- =====================================================
CREATE TABLE org_clients (
  id              UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  organization_id UNIQUEIDENTIFIER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  nome            NVARCHAR(255) NOT NULL,
  telefone        NVARCHAR(50) NULL,
  email           NVARCHAR(255) NULL,
  data_nascimento DATE NULL,
  observacoes     NVARCHAR(MAX) NULL,
  cep             NVARCHAR(10) NULL,
  logradouro      NVARCHAR(500) NULL,
  numero          NVARCHAR(20) NULL,
  complemento     NVARCHAR(255) NULL,
  bairro          NVARCHAR(255) NULL,
  cidade          NVARCHAR(255) NULL,
  estado          NVARCHAR(2) NULL,
  data_cadastro   DATETIME2 DEFAULT GETDATE(),
  created_at      DATETIME2 DEFAULT GETDATE()
);
GO

CREATE INDEX idx_clients_org ON org_clients(organization_id);
GO

-- =====================================================
-- 6. SERVIÇOS
-- =====================================================
CREATE TABLE org_services (
  id                    UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  organization_id       UNIQUEIDENTIFIER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  nome                  NVARCHAR(255) NOT NULL,
  descricao             NVARCHAR(MAX) NULL,
  preco                 DECIMAL(10,2) NOT NULL DEFAULT 0,
  categoria             NVARCHAR(100) NULL,
  tempo_estimado        NVARCHAR(100) NULL,
  materiais             NVARCHAR(MAX) NULL,
  custo_materiais       DECIMAL(10,2) NULL,
  observacoes_tecnicas  NVARCHAR(MAX) NULL,
  nivel_dificuldade     NVARCHAR(20) NULL CHECK (nivel_dificuldade IN ('facil','medio','dificil')),
  tempo_minimo          NVARCHAR(50) NULL,
  tempo_maximo          NVARCHAR(50) NULL,
  ativo                 BIT NOT NULL DEFAULT 1,
  created_at            DATETIME2 DEFAULT GETDATE()
);
GO

CREATE INDEX idx_services_org ON org_services(organization_id);
GO

-- =====================================================
-- 7. ORDENS DE SERVIÇO
-- =====================================================
-- NOTA: sem ON DELETE CASCADE em organization_id para evitar
-- múltiplos caminhos de cascade (via org_clients)
CREATE TABLE org_service_orders (
  id                  UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  numero              INT NOT NULL,
  organization_id     UNIQUEIDENTIFIER NOT NULL REFERENCES organizations(id),
  client_id           UNIQUEIDENTIFIER NULL REFERENCES org_clients(id) ON DELETE SET NULL,
  status              NVARCHAR(20) NOT NULL DEFAULT 'pendente'
                        CHECK (status IN ('pendente','em_andamento','concluido','cancelado')),
  valor_total         DECIMAL(10,2) NOT NULL DEFAULT 0,
  valor_entrada       DECIMAL(10,2) NOT NULL DEFAULT 0,
  valor_pago          DECIMAL(10,2) NOT NULL DEFAULT 0,
  status_pagamento    NVARCHAR(20) NOT NULL DEFAULT 'pendente'
                        CHECK (status_pagamento IN ('pendente','parcial','pago')),
  desconto_valor      DECIMAL(10,2) NOT NULL DEFAULT 0,
  desconto_percentual DECIMAL(5,2) NOT NULL DEFAULT 0,
  data_abertura       DATETIME2 DEFAULT GETDATE(),
  data_prevista       DATE NULL,
  data_conclusao      DATETIME2 NULL,
  forma_pagamento     NVARCHAR(100) NULL,
  observacoes         NVARCHAR(MAX) NULL,
  notas_internas      NVARCHAR(MAX) NULL,
  created_at          DATETIME2 DEFAULT GETDATE(),
  CONSTRAINT uq_order_numero_org UNIQUE (organization_id, numero)
);
GO

CREATE INDEX idx_orders_org    ON org_service_orders(organization_id);
CREATE INDEX idx_orders_client ON org_service_orders(client_id);
CREATE INDEX idx_orders_status ON org_service_orders(status);
CREATE INDEX idx_orders_data   ON org_service_orders(data_abertura);
GO

-- Itens da Ordem
CREATE TABLE org_service_order_items (
  id             UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  order_id       UNIQUEIDENTIFIER NOT NULL REFERENCES org_service_orders(id) ON DELETE CASCADE,
  service_id     UNIQUEIDENTIFIER NULL REFERENCES org_services(id) ON DELETE SET NULL,
  service_nome   NVARCHAR(255) NOT NULL,
  quantidade     INT NOT NULL DEFAULT 1,
  valor_unitario DECIMAL(10,2) NOT NULL,
  valor_total    DECIMAL(10,2) NOT NULL,
  created_at     DATETIME2 DEFAULT GETDATE()
);
GO

-- Histórico de alterações (organization_id armazenado por auditoria, sem FK)
CREATE TABLE org_service_order_history (
  id              UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  order_id        UNIQUEIDENTIFIER NOT NULL REFERENCES org_service_orders(id) ON DELETE CASCADE,
  organization_id UNIQUEIDENTIFIER NOT NULL,
  user_email      NVARCHAR(255) NOT NULL,
  campo_alterado  NVARCHAR(100) NOT NULL,
  valor_anterior  NVARCHAR(MAX) NULL,
  valor_novo      NVARCHAR(MAX) NULL,
  created_at      DATETIME2 DEFAULT GETDATE()
);
GO

-- Notas internas (organization_id armazenado por auditoria, sem FK)
CREATE TABLE org_service_order_notes (
  id              UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  order_id        UNIQUEIDENTIFIER NOT NULL REFERENCES org_service_orders(id) ON DELETE CASCADE,
  organization_id UNIQUEIDENTIFIER NOT NULL,
  user_email      NVARCHAR(255) NOT NULL,
  nota            NVARCHAR(MAX) NOT NULL,
  created_at      DATETIME2 DEFAULT GETDATE()
);
GO

-- =====================================================
-- 8. FINANCEIRO - CATEGORIAS
-- =====================================================
CREATE TABLE org_financial_categories (
  id              UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  organization_id UNIQUEIDENTIFIER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  nome            NVARCHAR(255) NOT NULL,
  tipo            NVARCHAR(10) NOT NULL CHECK (tipo IN ('receita','despesa')),
  cor             NVARCHAR(7) NULL,
  descricao       NVARCHAR(MAX) NULL,
  ativo           BIT NOT NULL DEFAULT 1,
  created_at      DATETIME2 DEFAULT GETDATE(),
  updated_at      DATETIME2 DEFAULT GETDATE()
);
GO

-- =====================================================
-- 9. FINANCEIRO - MÉTODOS DE PAGAMENTO
-- =====================================================
CREATE TABLE org_payment_methods (
  id              UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  organization_id UNIQUEIDENTIFIER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  nome            NVARCHAR(255) NOT NULL,
  tipo            NVARCHAR(30) NULL
                    CHECK (tipo IN ('dinheiro','cartao_credito','cartao_debito','pix','transferencia','boleto','outro')),
  ativo           BIT NOT NULL DEFAULT 1,
  created_at      DATETIME2 DEFAULT GETDATE()
);
GO

-- =====================================================
-- 10. FINANCEIRO - FORNECEDORES
-- =====================================================
CREATE TABLE org_suppliers (
  id              UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  organization_id UNIQUEIDENTIFIER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  nome            NVARCHAR(255) NOT NULL,
  contato         NVARCHAR(255) NULL,
  telefone        NVARCHAR(50) NULL,
  email           NVARCHAR(255) NULL,
  cnpj            NVARCHAR(20) NULL,
  endereco        NVARCHAR(500) NULL,
  observacoes     NVARCHAR(MAX) NULL,
  ativo           BIT NOT NULL DEFAULT 1,
  created_at      DATETIME2 DEFAULT GETDATE(),
  updated_at      DATETIME2 DEFAULT GETDATE()
);
GO

-- =====================================================
-- 11. FINANCEIRO - CONTAS A RECEBER
-- =====================================================
-- NOTA: sem ON DELETE CASCADE em organization_id para evitar
-- múltiplos caminhos via org_clients, org_financial_categories, org_payment_methods
CREATE TABLE org_receivables (
  id                UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  organization_id   UNIQUEIDENTIFIER NOT NULL REFERENCES organizations(id),
  service_order_id  UNIQUEIDENTIFIER NULL REFERENCES org_service_orders(id) ON DELETE SET NULL,
  client_id         UNIQUEIDENTIFIER NULL REFERENCES org_clients(id) ON DELETE NO ACTION,
  category_id       UNIQUEIDENTIFIER NULL REFERENCES org_financial_categories(id) ON DELETE NO ACTION,
  payment_method_id UNIQUEIDENTIFIER NULL REFERENCES org_payment_methods(id) ON DELETE NO ACTION,
  descricao         NVARCHAR(255) NOT NULL,
  valor             DECIMAL(10,2) NOT NULL,
  data_vencimento   DATE NOT NULL,
  data_recebimento  DATE NULL,
  status            NVARCHAR(20) NOT NULL DEFAULT 'pendente'
                      CHECK (status IN ('pendente','recebido','atrasado','cancelado')),
  observacoes       NVARCHAR(MAX) NULL,
  created_at        DATETIME2 DEFAULT GETDATE(),
  updated_at        DATETIME2 DEFAULT GETDATE()
);
GO

CREATE INDEX idx_receivables_org    ON org_receivables(organization_id);
CREATE INDEX idx_receivables_status ON org_receivables(status);
CREATE INDEX idx_receivables_venc   ON org_receivables(data_vencimento);
GO

-- =====================================================
-- 12. FINANCEIRO - CONTAS A PAGAR
-- =====================================================
-- NOTA: sem ON DELETE CASCADE em organization_id para evitar
-- múltiplos caminhos via org_suppliers
CREATE TABLE org_payables (
  id              UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  organization_id UNIQUEIDENTIFIER NOT NULL REFERENCES organizations(id),
  supplier_id     UNIQUEIDENTIFIER NULL REFERENCES org_suppliers(id) ON DELETE SET NULL,
  descricao       NVARCHAR(255) NOT NULL,
  valor           DECIMAL(10,2) NOT NULL,
  data_vencimento DATE NOT NULL,
  data_pagamento  DATE NULL,
  status          NVARCHAR(20) NOT NULL DEFAULT 'pendente'
                    CHECK (status IN ('pendente','pago','atrasado','cancelado')),
  categoria       NVARCHAR(100) NULL,
  forma_pagamento NVARCHAR(100) NULL,
  observacoes     NVARCHAR(MAX) NULL,
  created_at      DATETIME2 DEFAULT GETDATE(),
  updated_at      DATETIME2 DEFAULT GETDATE()
);
GO

CREATE INDEX idx_payables_org    ON org_payables(organization_id);
CREATE INDEX idx_payables_status ON org_payables(status);
CREATE INDEX idx_payables_venc   ON org_payables(data_vencimento);
GO

-- =====================================================
-- 13. FINANCEIRO - TRANSAÇÕES
-- =====================================================
-- NOTA: sem ON DELETE CASCADE em organization_id para evitar
-- múltiplos caminhos via org_receivables, org_payables, etc.
CREATE TABLE org_transactions (
  id                UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  organization_id   UNIQUEIDENTIFIER NOT NULL REFERENCES organizations(id),
  tipo              NVARCHAR(10) NOT NULL CHECK (tipo IN ('entrada','saida')),
  descricao         NVARCHAR(255) NOT NULL,
  valor             DECIMAL(10,2) NOT NULL,
  data_transacao    DATE NOT NULL,
  category_id       UNIQUEIDENTIFIER NULL REFERENCES org_financial_categories(id) ON DELETE NO ACTION,
  payment_method_id UNIQUEIDENTIFIER NULL REFERENCES org_payment_methods(id) ON DELETE NO ACTION,
  receivable_id     UNIQUEIDENTIFIER NULL REFERENCES org_receivables(id) ON DELETE SET NULL,
  payable_id        UNIQUEIDENTIFIER NULL REFERENCES org_payables(id) ON DELETE SET NULL,
  observacoes       NVARCHAR(MAX) NULL,
  created_at        DATETIME2 DEFAULT GETDATE()
);
GO

CREATE INDEX idx_transactions_org  ON org_transactions(organization_id);
CREATE INDEX idx_transactions_data ON org_transactions(data_transacao);
GO

-- =====================================================
-- 14. CAIXA
-- =====================================================
CREATE TABLE org_cashiers (
  id              UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  organization_id UNIQUEIDENTIFIER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  nome            NVARCHAR(100) NOT NULL,
  descricao       NVARCHAR(500) NULL,
  ativo           BIT NOT NULL DEFAULT 1,
  created_at      DATETIME2 DEFAULT GETDATE(),
  updated_at      DATETIME2 DEFAULT GETDATE()
);
GO

-- NOTA: sem ON DELETE CASCADE em organization_id para evitar
-- múltiplos caminhos via users (users CASCADE de organizations)
CREATE TABLE org_cashier_sessions (
  id                     UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  organization_id        UNIQUEIDENTIFIER NOT NULL REFERENCES organizations(id),
  caixa_id               UNIQUEIDENTIFIER NOT NULL REFERENCES org_cashiers(id) ON DELETE CASCADE,
  usuario_abertura_id    UNIQUEIDENTIFIER NULL REFERENCES users(id) ON DELETE NO ACTION,
  usuario_fechamento_id  UNIQUEIDENTIFIER NULL REFERENCES users(id),
  data_abertura          DATETIME2 DEFAULT GETDATE(),
  data_fechamento        DATETIME2 NULL,
  saldo_inicial          DECIMAL(10,2) NOT NULL DEFAULT 0,
  saldo_esperado         DECIMAL(10,2) NULL,
  saldo_real             DECIMAL(10,2) NULL,
  diferenca              DECIMAL(10,2) NULL,
  status                 NVARCHAR(10) NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto','fechado')),
  observacoes_abertura   NVARCHAR(MAX) NULL,
  observacoes_fechamento NVARCHAR(MAX) NULL,
  created_at             DATETIME2 DEFAULT GETDATE(),
  updated_at             DATETIME2 DEFAULT GETDATE()
);
GO

-- NOTA: sem ON DELETE CASCADE em organization_id para evitar
-- múltiplos caminhos via users e org_payment_methods
CREATE TABLE org_cashier_movements (
  id                  UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  organization_id     UNIQUEIDENTIFIER NOT NULL REFERENCES organizations(id),
  sessao_id           UNIQUEIDENTIFIER NOT NULL REFERENCES org_cashier_sessions(id) ON DELETE CASCADE,
  tipo                NVARCHAR(10) NOT NULL CHECK (tipo IN ('entrada','saida','sangria','reforco')),
  valor               DECIMAL(10,2) NOT NULL,
  descricao           NVARCHAR(255) NOT NULL,
  metodo_pagamento_id UNIQUEIDENTIFIER NULL REFERENCES org_payment_methods(id) ON DELETE NO ACTION,
  referencia_id       UNIQUEIDENTIFIER NULL,
  referencia_tipo     NVARCHAR(50) NULL,
  usuario_id          UNIQUEIDENTIFIER NULL REFERENCES users(id) ON DELETE NO ACTION,
  data_movimento      DATETIME2 DEFAULT GETDATE(),
  observacoes         NVARCHAR(MAX) NULL,
  created_at          DATETIME2 DEFAULT GETDATE()
);
GO

-- NOTA: sem ON DELETE CASCADE em organization_id para evitar
-- múltiplos caminhos via org_payment_methods
CREATE TABLE org_cashier_reconciliations (
  id                  UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  organization_id     UNIQUEIDENTIFIER NOT NULL REFERENCES organizations(id),
  sessao_id           UNIQUEIDENTIFIER NOT NULL REFERENCES org_cashier_sessions(id) ON DELETE CASCADE,
  metodo_pagamento_id UNIQUEIDENTIFIER NOT NULL REFERENCES org_payment_methods(id),
  valor_esperado      DECIMAL(10,2) NOT NULL DEFAULT 0,
  valor_informado     DECIMAL(10,2) NOT NULL DEFAULT 0,
  diferenca           DECIMAL(10,2) NULL,
  observacoes         NVARCHAR(MAX) NULL,
  created_at          DATETIME2 DEFAULT GETDATE()
);
GO

-- =====================================================
-- 15. CONFIGURAÇÕES DE ORDENS
-- =====================================================
CREATE TABLE org_order_settings (
  id                     UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  organization_id        UNIQUEIDENTIFIER NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  order_prefix           NVARCHAR(10) NULL DEFAULT 'OS',
  order_start_number     INT NOT NULL DEFAULT 1,
  order_number_format    NVARCHAR(20) NOT NULL DEFAULT 'sequential'
                           CHECK (order_number_format IN ('sequential','yearly','monthly')),
  default_status         NVARCHAR(20) NOT NULL DEFAULT 'pendente',
  require_client         BIT NOT NULL DEFAULT 1,
  require_service        BIT NOT NULL DEFAULT 1,
  require_delivery_date  BIT NOT NULL DEFAULT 1,
  require_payment_method BIT NOT NULL DEFAULT 0,
  default_delivery_days  INT NOT NULL DEFAULT 7,
  updated_at             DATETIME2 DEFAULT GETDATE()
);
GO

-- =====================================================
-- 16. CONFIGURAÇÕES FINANCEIRAS
-- =====================================================
CREATE TABLE org_financial_settings (
  id                               UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  organization_id                  UNIQUEIDENTIFIER NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  payment_methods_json             NVARCHAR(MAX) NOT NULL DEFAULT '{"dinheiro":true,"pix":true,"credito":true,"debito":true,"outros":true}',
  late_fee_percentage              DECIMAL(5,2) NULL,
  interest_rate_per_month          DECIMAL(5,2) NULL,
  cashier_requires_opening         BIT NOT NULL DEFAULT 1,
  cashier_opening_balance_required BIT NOT NULL DEFAULT 0,
  expense_categories_json          NVARCHAR(MAX) NULL DEFAULT '[]',
  income_categories_json           NVARCHAR(MAX) NULL DEFAULT '[]',
  updated_at                       DATETIME2 DEFAULT GETDATE()
);
GO

-- =====================================================
-- 17. CONFIGURAÇÕES DE NOTIFICAÇÕES
-- =====================================================
CREATE TABLE org_notification_settings (
  id                          UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  organization_id             UNIQUEIDENTIFIER NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  notify_client_birthday      BIT NOT NULL DEFAULT 1,
  notify_order_ready          BIT NOT NULL DEFAULT 1,
  notify_payment_reminder     BIT NOT NULL DEFAULT 1,
  notify_order_delayed        BIT NOT NULL DEFAULT 1,
  notify_low_stock            BIT NOT NULL DEFAULT 0,
  notify_new_client           BIT NOT NULL DEFAULT 0,
  email_notifications_enabled BIT NOT NULL DEFAULT 0,
  notification_email          NVARCHAR(255) NULL,
  birthday_reminder_days      INT NOT NULL DEFAULT 7,
  payment_reminder_days       INT NOT NULL DEFAULT 3,
  order_reminder_days         INT NOT NULL DEFAULT 1,
  updated_at                  DATETIME2 DEFAULT GETDATE()
);
GO

-- =====================================================
-- 18. PREFERÊNCIAS DO SISTEMA
-- =====================================================
-- NOTA: [language] é palavra reservada no SQL Server
CREATE TABLE org_system_preferences (
  id              UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  organization_id UNIQUEIDENTIFIER NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  date_format     NVARCHAR(20) NOT NULL DEFAULT 'dd/MM/yyyy'
                    CHECK (date_format IN ('dd/MM/yyyy','MM/dd/yyyy','yyyy-MM-dd')),
  time_format     NVARCHAR(5) NOT NULL DEFAULT '24h' CHECK (time_format IN ('12h','24h')),
  currency        NVARCHAR(5) NOT NULL DEFAULT 'BRL' CHECK (currency IN ('BRL','USD','EUR')),
  timezone        NVARCHAR(100) NOT NULL DEFAULT 'America/Sao_Paulo',
  [language]      NVARCHAR(10) NOT NULL DEFAULT 'pt-BR'
                    CHECK ([language] IN ('pt-BR','en-US','es-ES')),
  theme           NVARCHAR(10) NOT NULL DEFAULT 'light' CHECK (theme IN ('light','dark','auto')),
  compact_mode    BIT NOT NULL DEFAULT 0,
  show_tooltips   BIT NOT NULL DEFAULT 1,
  updated_at      DATETIME2 DEFAULT GETDATE()
);
GO

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================
SELECT
  TABLE_NAME,
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS c
   WHERE c.TABLE_NAME = t.TABLE_NAME AND c.TABLE_SCHEMA = 'dbo') AS colunas
FROM INFORMATION_SCHEMA.TABLES t
WHERE TABLE_SCHEMA = 'dbo' AND TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_NAME;
GO
-- Deve listar 24 tabelas
