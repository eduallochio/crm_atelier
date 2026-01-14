-- =====================================================
-- FIX: Trigger com SECURITY INVOKER e tratamento de conflitos
-- =====================================================
-- Execute este script no Supabase SQL Editor
-- =====================================================

-- Remover trigger antigo
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Criar função com SECURITY INVOKER (usa permissões do usuário que criou)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  new_org_id UUID;
  user_name TEXT;
  user_slug TEXT;
  slug_counter INT := 0;
BEGIN
  -- Extrair nome do usuário
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'fullName', 
    split_part(NEW.email, '@', 1),
    'Usuário'
  );
  
  -- Criar slug único com timestamp para evitar conflitos
  user_slug := 'atelier-' || substr(NEW.id::text, 1, 8) || '-' || floor(extract(epoch from now()));
  
  -- Criar organização
  INSERT INTO public.organizations (name, slug, plan)
  VALUES (
    user_name || ' Atelier',
    user_slug,
    'free'
  )
  ON CONFLICT (slug) DO UPDATE SET slug = EXCLUDED.slug
  RETURNING id INTO new_org_id;

  -- Criar perfil (com ON CONFLICT para evitar duplicatas)
  INSERT INTO public.profiles (id, organization_id, email, full_name, role, is_owner)
  VALUES (
    NEW.id, 
    new_org_id, 
    NEW.email, 
    user_name, 
    'owner', 
    true
  )
  ON CONFLICT (id) DO NOTHING;

  -- Inicializar métricas (com ON CONFLICT)
  INSERT INTO public.usage_metrics (organization_id, users_count, clients_count, orders_count)
  VALUES (new_org_id, 1, 0, 0)
  ON CONFLICT (organization_id) DO NOTHING;

  -- Criar configuração de customização padrão (com ON CONFLICT)
  INSERT INTO public.customization_settings (organization_id, primary_color, secondary_color)
  VALUES (new_org_id, '#3b82f6', '#10b981')
  ON CONFLICT (organization_id) DO NOTHING;

  RETURN NEW;
  
EXCEPTION WHEN OTHERS THEN
  -- Log do erro mas não impede a criação do usuário
  RAISE WARNING 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

-- Recriar o trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Garantir permissões
GRANT EXECUTE ON FUNCTION handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION handle_new_user() TO anon;

-- =====================================================
-- Ajustar RLS para permitir inserção via trigger
-- =====================================================

-- Perfis: permitir inserção via trigger
DROP POLICY IF EXISTS "Users can insert their own profile during signup" ON profiles;
CREATE POLICY "Users can insert their own profile during signup"
  ON profiles FOR INSERT
  WITH CHECK (true);

-- Organizations: permitir inserção via trigger  
DROP POLICY IF EXISTS "Users can create organization during signup" ON organizations;
CREATE POLICY "Users can create organization during signup"
  ON organizations FOR INSERT
  WITH CHECK (true);

-- Usage metrics: permitir inserção via trigger
DROP POLICY IF EXISTS "Allow insert during signup" ON usage_metrics;
CREATE POLICY "Allow insert during signup"
  ON usage_metrics FOR INSERT
  WITH CHECK (true);

-- Customization settings: permitir inserção via trigger
DROP POLICY IF EXISTS "Allow insert during signup" ON customization_settings;
CREATE POLICY "Allow insert during signup"
  ON customization_settings FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- CONCLUÍDO!
-- Execute este script e tente criar um novo usuário
-- =====================================================
