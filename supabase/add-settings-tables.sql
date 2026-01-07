-- =====================================================
-- CONFIGURAÇÕES DO SISTEMA - NOVAS TABELAS
-- =====================================================

-- Adicionar campos extras à tabela organizations
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS cnpj TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS zip_code TEXT,
ADD COLUMN IF NOT EXISTS website TEXT;

-- Tabela de configurações financeiras
CREATE TABLE IF NOT EXISTS org_financial_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID UNIQUE REFERENCES organizations ON DELETE CASCADE NOT NULL,
  payment_methods JSONB DEFAULT '{"dinheiro": true, "pix": true, "credito": true, "debito": true, "outros": true}'::jsonb,
  late_fee_percentage DECIMAL(5,2) DEFAULT 0,
  interest_rate_per_month DECIMAL(5,2) DEFAULT 0,
  cashier_requires_opening BOOLEAN DEFAULT true,
  cashier_opening_balance_required BOOLEAN DEFAULT false,
  expense_categories JSONB DEFAULT '[]'::jsonb,
  income_categories JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de configurações de notificações
CREATE TABLE IF NOT EXISTS org_notification_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID UNIQUE REFERENCES organizations ON DELETE CASCADE NOT NULL,
  notify_client_birthday BOOLEAN DEFAULT true,
  notify_order_ready BOOLEAN DEFAULT true,
  notify_payment_reminder BOOLEAN DEFAULT true,
  notify_order_delayed BOOLEAN DEFAULT true,
  notify_low_stock BOOLEAN DEFAULT false,
  notify_new_client BOOLEAN DEFAULT false,
  email_notifications_enabled BOOLEAN DEFAULT false,
  notification_email TEXT,
  birthday_reminder_days INT DEFAULT 7,
  payment_reminder_days INT DEFAULT 3,
  order_reminder_days INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de configurações de ordens de serviço
CREATE TABLE IF NOT EXISTS org_order_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID UNIQUE REFERENCES organizations ON DELETE CASCADE NOT NULL,
  order_prefix TEXT DEFAULT 'OS',
  order_start_number INT DEFAULT 1,
  order_number_format TEXT DEFAULT 'sequential' CHECK (order_number_format IN ('sequential', 'yearly', 'monthly')),
  custom_statuses JSONB DEFAULT '[]'::jsonb,
  default_status TEXT DEFAULT 'pendente',
  require_client BOOLEAN DEFAULT true,
  require_service BOOLEAN DEFAULT true,
  require_delivery_date BOOLEAN DEFAULT true,
  require_payment_method BOOLEAN DEFAULT false,
  default_delivery_days INT DEFAULT 7,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de preferências do sistema
CREATE TABLE IF NOT EXISTS org_system_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID UNIQUE REFERENCES organizations ON DELETE CASCADE NOT NULL,
  date_format TEXT DEFAULT 'dd/MM/yyyy' CHECK (date_format IN ('dd/MM/yyyy', 'MM/dd/yyyy', 'yyyy-MM-dd')),
  time_format TEXT DEFAULT '24h' CHECK (time_format IN ('12h', '24h')),
  currency TEXT DEFAULT 'BRL' CHECK (currency IN ('BRL', 'USD', 'EUR')),
  timezone TEXT DEFAULT 'America/Sao_Paulo',
  language TEXT DEFAULT 'pt-BR' CHECK (language IN ('pt-BR', 'en-US', 'es-ES')),
  theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
  compact_mode BOOLEAN DEFAULT false,
  show_tooltips BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_financial_settings_org ON org_financial_settings(organization_id);
CREATE INDEX IF NOT EXISTS idx_notification_settings_org ON org_notification_settings(organization_id);
CREATE INDEX IF NOT EXISTS idx_order_settings_org ON org_order_settings(organization_id);
CREATE INDEX IF NOT EXISTS idx_system_preferences_org ON org_system_preferences(organization_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE org_financial_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_order_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_system_preferences ENABLE ROW LEVEL SECURITY;

-- Políticas para org_financial_settings
DROP POLICY IF EXISTS "Users can view own organization financial settings" ON org_financial_settings;
CREATE POLICY "Users can view own organization financial settings" ON org_financial_settings
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update own organization financial settings" ON org_financial_settings;
CREATE POLICY "Users can update own organization financial settings" ON org_financial_settings
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Políticas para org_notification_settings
DROP POLICY IF EXISTS "Users can view own organization notification settings" ON org_notification_settings;
CREATE POLICY "Users can view own organization notification settings" ON org_notification_settings
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update own organization notification settings" ON org_notification_settings;
CREATE POLICY "Users can update own organization notification settings" ON org_notification_settings
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Políticas para org_order_settings
DROP POLICY IF EXISTS "Users can view own organization order settings" ON org_order_settings;
CREATE POLICY "Users can view own organization order settings" ON org_order_settings
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update own organization order settings" ON org_order_settings;
CREATE POLICY "Users can update own organization order settings" ON org_order_settings
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Políticas para org_system_preferences
DROP POLICY IF EXISTS "Users can view own organization system preferences" ON org_system_preferences;
CREATE POLICY "Users can view own organization system preferences" ON org_system_preferences
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update own organization system preferences" ON org_system_preferences;
CREATE POLICY "Users can update own organization system preferences" ON org_system_preferences
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- =====================================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TABLE org_financial_settings IS 'Configurações financeiras da organização incluindo formas de pagamento e taxas';
COMMENT ON TABLE org_notification_settings IS 'Configurações de notificações e lembretes do sistema';
COMMENT ON TABLE org_order_settings IS 'Configurações relacionadas às ordens de serviço';
COMMENT ON TABLE org_system_preferences IS 'Preferências do sistema como idioma, fuso horário e tema';
