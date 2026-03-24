-- =====================================================
-- CRM ATELIER - ATUALIZAÇÃO DE FEATURES DOS PLANOS
-- Alinha features_json com o sistema real implementado
-- Limite de OS free: 250 | Usuários free: 1
-- Execute no SSMS no banco CrmAtelier
-- =====================================================

USE CrmAtelier;
GO

-- Atualiza limite de ordens free em admin_system_settings
UPDATE admin_system_settings SET value = '250' WHERE [key] = 'max_orders_free';
IF @@ROWCOUNT = 0
  INSERT INTO admin_system_settings ([key], value, description)
  VALUES ('max_orders_free', '250', 'Limite de ordens de serviço para plano free');

-- Atualiza limite de usuários free em admin_system_settings
UPDATE admin_system_settings SET value = '1' WHERE [key] = 'max_users_free';
IF @@ROWCOUNT = 0
  INSERT INTO admin_system_settings ([key], value, description)
  VALUES ('max_users_free', '1', 'Limite de usuários para plano free');
GO

-- Atualiza features do plano Free
UPDATE plans
SET
  features_json = N'[
    {"text":"Até 50 clientes","included":true},
    {"text":"Até 250 ordens de serviço","included":true},
    {"text":"Dashboard com métricas","included":true},
    {"text":"Controle de caixa","included":true},
    {"text":"Contas a pagar/receber","included":true},
    {"text":"Estoque","included":false},
    {"text":"Relatórios e exportações","included":false},
    {"text":"Usuários adicionais","included":false}
  ]',
  updated_at = GETDATE()
WHERE slug = 'free';
PRINT 'Plano Free atualizado.';
GO

-- Atualiza features do plano Pro
UPDATE plans
SET
  features_json = N'[
    {"text":"Tudo do plano Free +","included":true},
    {"text":"Clientes ilimitados","included":true},
    {"text":"Ordens ilimitadas","included":true},
    {"text":"Estoque completo","included":true},
    {"text":"Relatórios e exportação Excel/PDF","included":true},
    {"text":"Até 5 usuários","included":true},
    {"text":"Suporte prioritário (12h)","included":true},
    {"text":"Lembretes automáticos (em breve)","included":true}
  ]',
  updated_at = GETDATE()
WHERE slug = 'pro';
PRINT 'Plano Pro atualizado.';
GO
