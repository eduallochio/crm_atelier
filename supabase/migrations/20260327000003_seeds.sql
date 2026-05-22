-- =====================================================
-- SEEDS — CRM Atelier
-- Dados iniciais do sistema (planos e configurações)
-- Aplicar via: supabase db push
-- Executa APÓS 20260327000002_rls_policies.sql
-- =====================================================

-- ─── PLANOS ───────────────────────────────────────────────────────────────────

INSERT INTO public.plans (slug, name, description, price, badge, is_featured, is_active, features_json, cta_text, cta_url, sort_order)
VALUES (
  'free',
  'Free',
  'Para começar',
  0.00,
  NULL,
  false,
  true,
  '[
    {"text":"Até 50 clientes","included":true},
    {"text":"Até 2 usuários","included":true},
    {"text":"100 ordens/mês","included":true},
    {"text":"500 MB armazenamento","included":true},
    {"text":"Dashboard básico","included":true},
    {"text":"Controle de caixa","included":true},
    {"text":"Contas a pagar/receber","included":true},
    {"text":"Relatórios avançados","included":false},
    {"text":"Exportação de dados","included":false}
  ]'::jsonb,
  'Criar conta grátis',
  '/cadastro',
  1
)
ON CONFLICT (slug) DO NOTHING;


INSERT INTO public.plans (slug, name, description, price, price_annual, annual_note, badge, is_featured, is_active, features_json, cta_text, cta_url, sort_order)
VALUES (
  'pro',
  'Pro',
  'Para crescer',
  59.90,
  599.00,
  'ou R$ 599/ano — 2 meses grátis',
  'Popular',
  true,
  true,
  '[
    {"text":"Clientes ilimitados","included":true},
    {"text":"Até 3 usuários","included":true},
    {"text":"Ordens ilimitadas","included":true},
    {"text":"5 GB armazenamento","included":true},
    {"text":"Tudo do plano Free +","included":true},
    {"text":"Relatórios avançados","included":true},
    {"text":"Exportação Excel/PDF","included":true},
    {"text":"Dashboards personalizados","included":true},
    {"text":"Lembretes automáticos","included":true},
    {"text":"Suporte prioritário (12h)","included":true}
  ]'::jsonb,
  'Iniciar teste grátis',
  '/cadastro',
  2
)
ON CONFLICT (slug) DO NOTHING;


-- Enterprise removido: plano interno usado apenas para licenças vitalícias via CNPJ hardcoded


-- ─── CONFIGURAÇÕES DO SISTEMA (admin) ─────────────────────────────────────────

INSERT INTO public.admin_system_settings (key, value) VALUES
  ('site_name',             'CRM Ateliê'),
  ('support_email',         'suporte@crmatelier.com'),
  -- Limites plano Free
  ('max_clients_free',      '50'),
  ('max_services_free',     '20'),
  ('max_orders_free',       '100'),
  ('max_users_free',        '2'),
  -- Limites plano Pro
  ('max_clients_pro',       '999999'),
  ('max_services_pro',      '999999'),
  ('max_orders_pro',        '999999'),
  ('max_users_pro',         '3'),
  -- Controles gerais
  ('enable_signup',         'true'),
  ('enable_trial',          'false'),
  ('trial_duration_days',   '14'),
  ('maintenance_mode',      'false'),
  ('announcement',          '')
ON CONFLICT (key) DO NOTHING;
