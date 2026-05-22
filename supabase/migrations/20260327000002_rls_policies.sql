-- =====================================================
-- ROW LEVEL SECURITY — CRM Atelier
-- Aplicar via: supabase db push
-- Executa APÓS 20260327000001_triggers.sql
-- =====================================================

-- ─── HABILITAR RLS EM TODAS AS TABELAS ───────────────────────────────────────

ALTER TABLE public.organizations              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_metrics              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customization_settings     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_clients                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_services               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_service_orders         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_service_order_items    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_service_order_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_service_order_history  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_service_order_notes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_financial_categories   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_payment_methods        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_suppliers              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_receivables            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_payables               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_transactions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_cashiers               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_cashier_sessions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_cashier_movements      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_cashier_reconciliations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_order_settings         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_financial_settings     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_notification_settings  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_system_preferences     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_products               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_stock_entries          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_stock_entry_items      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_stock_exits            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_stock_exit_items       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_monthly_goals          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_system_settings      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_usages              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_events                ENABLE ROW LEVEL SECURITY;


-- ─── ORGANIZATIONS ────────────────────────────────────────────────────────────

CREATE POLICY "users_own_org" ON public.organizations
  FOR ALL
  USING (id = public.get_user_organization_id())
  WITH CHECK (id = public.get_user_organization_id());


-- ─── PROFILES ─────────────────────────────────────────────────────────────────

-- Usuário vê apenas profiles da própria organização
CREATE POLICY "org_profiles" ON public.profiles
  FOR ALL
  USING (organization_id = public.get_user_organization_id())
  WITH CHECK (organization_id = public.get_user_organization_id());


-- ─── USAGE METRICS ────────────────────────────────────────────────────────────

CREATE POLICY "org_usage_metrics" ON public.usage_metrics
  FOR ALL
  USING (organization_id = public.get_user_organization_id())
  WITH CHECK (organization_id = public.get_user_organization_id());


-- ─── CUSTOMIZATION SETTINGS ──────────────────────────────────────────────────

CREATE POLICY "org_customization" ON public.customization_settings
  FOR ALL
  USING (organization_id = public.get_user_organization_id())
  WITH CHECK (organization_id = public.get_user_organization_id());


-- ─── ORG CLIENTS ──────────────────────────────────────────────────────────────

CREATE POLICY "org_clients" ON public.org_clients
  FOR ALL
  USING (organization_id = public.get_user_organization_id())
  WITH CHECK (organization_id = public.get_user_organization_id());


-- ─── ORG SERVICES ─────────────────────────────────────────────────────────────

CREATE POLICY "org_services" ON public.org_services
  FOR ALL
  USING (organization_id = public.get_user_organization_id())
  WITH CHECK (organization_id = public.get_user_organization_id());


-- ─── ORG SERVICE ORDERS ───────────────────────────────────────────────────────

CREATE POLICY "org_service_orders" ON public.org_service_orders
  FOR ALL
  USING (organization_id = public.get_user_organization_id())
  WITH CHECK (organization_id = public.get_user_organization_id());


-- ─── ORG SERVICE ORDER ITEMS ──────────────────────────────────────────────────

CREATE POLICY "org_order_items" ON public.org_service_order_items
  FOR ALL
  USING (
    order_id IN (
      SELECT id FROM public.org_service_orders
      WHERE organization_id = public.get_user_organization_id()
    )
  );


-- ─── ORG SERVICE ORDER MATERIALS ──────────────────────────────────────────────

CREATE POLICY "org_order_materials" ON public.org_service_order_materials
  FOR ALL
  USING (
    order_id IN (
      SELECT id FROM public.org_service_orders
      WHERE organization_id = public.get_user_organization_id()
    )
  );


-- ─── ORG SERVICE ORDER HISTORY ────────────────────────────────────────────────

CREATE POLICY "org_order_history" ON public.org_service_order_history
  FOR ALL
  USING (organization_id = public.get_user_organization_id())
  WITH CHECK (organization_id = public.get_user_organization_id());


-- ─── ORG SERVICE ORDER NOTES ──────────────────────────────────────────────────

CREATE POLICY "org_order_notes" ON public.org_service_order_notes
  FOR ALL
  USING (organization_id = public.get_user_organization_id())
  WITH CHECK (organization_id = public.get_user_organization_id());


-- ─── ORG FINANCIAL CATEGORIES ────────────────────────────────────────────────

CREATE POLICY "org_financial_categories" ON public.org_financial_categories
  FOR ALL
  USING (organization_id = public.get_user_organization_id())
  WITH CHECK (organization_id = public.get_user_organization_id());


-- ─── ORG PAYMENT METHODS ──────────────────────────────────────────────────────

CREATE POLICY "org_payment_methods" ON public.org_payment_methods
  FOR ALL
  USING (organization_id = public.get_user_organization_id())
  WITH CHECK (organization_id = public.get_user_organization_id());


-- ─── ORG SUPPLIERS ────────────────────────────────────────────────────────────

CREATE POLICY "org_suppliers" ON public.org_suppliers
  FOR ALL
  USING (organization_id = public.get_user_organization_id())
  WITH CHECK (organization_id = public.get_user_organization_id());


-- ─── ORG RECEIVABLES ──────────────────────────────────────────────────────────

CREATE POLICY "org_receivables" ON public.org_receivables
  FOR ALL
  USING (organization_id = public.get_user_organization_id())
  WITH CHECK (organization_id = public.get_user_organization_id());


-- ─── ORG PAYABLES ─────────────────────────────────────────────────────────────

CREATE POLICY "org_payables" ON public.org_payables
  FOR ALL
  USING (organization_id = public.get_user_organization_id())
  WITH CHECK (organization_id = public.get_user_organization_id());


-- ─── ORG TRANSACTIONS ─────────────────────────────────────────────────────────

CREATE POLICY "org_transactions" ON public.org_transactions
  FOR ALL
  USING (organization_id = public.get_user_organization_id())
  WITH CHECK (organization_id = public.get_user_organization_id());


-- ─── ORG CASHIERS ─────────────────────────────────────────────────────────────

CREATE POLICY "org_cashiers" ON public.org_cashiers
  FOR ALL
  USING (organization_id = public.get_user_organization_id())
  WITH CHECK (organization_id = public.get_user_organization_id());


-- ─── ORG CASHIER SESSIONS ─────────────────────────────────────────────────────

CREATE POLICY "org_cashier_sessions" ON public.org_cashier_sessions
  FOR ALL
  USING (organization_id = public.get_user_organization_id())
  WITH CHECK (organization_id = public.get_user_organization_id());


-- ─── ORG CASHIER MOVEMENTS ────────────────────────────────────────────────────

CREATE POLICY "org_cashier_movements" ON public.org_cashier_movements
  FOR ALL
  USING (organization_id = public.get_user_organization_id())
  WITH CHECK (organization_id = public.get_user_organization_id());


-- ─── ORG CASHIER RECONCILIATIONS ──────────────────────────────────────────────

CREATE POLICY "org_cashier_reconciliations" ON public.org_cashier_reconciliations
  FOR ALL
  USING (organization_id = public.get_user_organization_id())
  WITH CHECK (organization_id = public.get_user_organization_id());


-- ─── ORG ORDER SETTINGS ───────────────────────────────────────────────────────

CREATE POLICY "org_order_settings" ON public.org_order_settings
  FOR ALL
  USING (organization_id = public.get_user_organization_id())
  WITH CHECK (organization_id = public.get_user_organization_id());


-- ─── ORG FINANCIAL SETTINGS ──────────────────────────────────────────────────

CREATE POLICY "org_financial_settings" ON public.org_financial_settings
  FOR ALL
  USING (organization_id = public.get_user_organization_id())
  WITH CHECK (organization_id = public.get_user_organization_id());


-- ─── ORG NOTIFICATION SETTINGS ───────────────────────────────────────────────

CREATE POLICY "org_notification_settings" ON public.org_notification_settings
  FOR ALL
  USING (organization_id = public.get_user_organization_id())
  WITH CHECK (organization_id = public.get_user_organization_id());


-- ─── ORG SYSTEM PREFERENCES ──────────────────────────────────────────────────

CREATE POLICY "org_system_preferences" ON public.org_system_preferences
  FOR ALL
  USING (organization_id = public.get_user_organization_id())
  WITH CHECK (organization_id = public.get_user_organization_id());


-- ─── ORG PRODUCTS ─────────────────────────────────────────────────────────────

CREATE POLICY "org_products" ON public.org_products
  FOR ALL
  USING (organization_id = public.get_user_organization_id())
  WITH CHECK (organization_id = public.get_user_organization_id());


-- ─── ORG STOCK ENTRIES ────────────────────────────────────────────────────────

CREATE POLICY "org_stock_entries" ON public.org_stock_entries
  FOR ALL
  USING (organization_id = public.get_user_organization_id())
  WITH CHECK (organization_id = public.get_user_organization_id());


-- ─── ORG STOCK ENTRY ITEMS ────────────────────────────────────────────────────

CREATE POLICY "org_stock_entry_items" ON public.org_stock_entry_items
  FOR ALL
  USING (
    entry_id IN (
      SELECT id FROM public.org_stock_entries
      WHERE organization_id = public.get_user_organization_id()
    )
  );


-- ─── ORG STOCK EXITS ─────────────────────────────────────────────────────────

CREATE POLICY "org_stock_exits" ON public.org_stock_exits
  FOR ALL
  USING (organization_id = public.get_user_organization_id())
  WITH CHECK (organization_id = public.get_user_organization_id());


-- ─── ORG STOCK EXIT ITEMS ────────────────────────────────────────────────────

CREATE POLICY "org_stock_exit_items" ON public.org_stock_exit_items
  FOR ALL
  USING (
    exit_id IN (
      SELECT id FROM public.org_stock_exits
      WHERE organization_id = public.get_user_organization_id()
    )
  );


-- ─── ORG MONTHLY GOALS ────────────────────────────────────────────────────────

CREATE POLICY "org_monthly_goals" ON public.org_monthly_goals
  FOR ALL
  USING (organization_id = public.get_user_organization_id())
  WITH CHECK (organization_id = public.get_user_organization_id());


-- ─── PLANS (leitura pública, escrita apenas master) ───────────────────────────

CREATE POLICY "plans_public_read" ON public.plans
  FOR SELECT USING (true);

CREATE POLICY "plans_master_write" ON public.plans
  FOR ALL
  USING (
    (SELECT is_master FROM public.profiles WHERE id = auth.uid())
  )
  WITH CHECK (
    (SELECT is_master FROM public.profiles WHERE id = auth.uid())
  );


-- ─── COUPONS (leitura pública de ativos, escrita apenas master) ───────────────

CREATE POLICY "coupons_public_read" ON public.coupons
  FOR SELECT USING (is_active = true);

CREATE POLICY "coupons_master_write" ON public.coupons
  FOR ALL
  USING (
    (SELECT is_master FROM public.profiles WHERE id = auth.uid())
  );


-- ─── COUPON USAGES ────────────────────────────────────────────────────────────

CREATE POLICY "org_coupon_usages" ON public.coupon_usages
  FOR ALL
  USING (organization_id = public.get_user_organization_id())
  WITH CHECK (organization_id = public.get_user_organization_id());


-- ─── ADMIN LOGS (apenas master) ───────────────────────────────────────────────

CREATE POLICY "admin_logs_master_only" ON public.admin_logs
  FOR ALL
  USING (
    (SELECT is_master FROM public.profiles WHERE id = auth.uid())
  );


-- ─── ADMIN SYSTEM SETTINGS (apenas master) ───────────────────────────────────

CREATE POLICY "admin_settings_master_only" ON public.admin_system_settings
  FOR ALL
  USING (
    (SELECT is_master FROM public.profiles WHERE id = auth.uid())
  );


-- ─── PAGE EVENTS (insert público, leitura master) ────────────────────────────

CREATE POLICY "page_events_insert" ON public.page_events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "page_events_master_read" ON public.page_events
  FOR SELECT
  USING (
    (SELECT is_master FROM public.profiles WHERE id = auth.uid())
  );
