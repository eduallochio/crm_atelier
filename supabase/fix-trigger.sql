-- =====================================================
-- FIX: Trigger de criação de usuário mais robusto
-- =====================================================
-- Execute este script no Supabase SQL Editor
-- =====================================================

-- Primeiro, remover o trigger antigo
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Criar função melhorada com melhor tratamento de erro
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  new_org_id UUID;
  user_name TEXT;
  user_slug TEXT;
BEGIN
  -- Log para debug
  RAISE LOG 'Creating organization for user %', NEW.id;
  
  -- Extrair nome do usuário (com fallback)
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'fullName', 
    split_part(NEW.email, '@', 1),
    'Usuário'
  );
  
  -- Criar slug único
  user_slug := 'atelier-' || substr(NEW.id::text, 1, 8);
  
  -- Criar organização
  INSERT INTO public.organizations (name, slug, plan)
  VALUES (
    user_name || ' Atelier',
    user_slug,
    'free'
  )
  RETURNING id INTO new_org_id;
  
  RAISE LOG 'Created organization % for user %', new_org_id, NEW.id;

  -- Criar perfil
  INSERT INTO public.profiles (id, organization_id, email, full_name, role, is_owner)
  VALUES (
    NEW.id, 
    new_org_id, 
    NEW.email, 
    user_name, 
    'owner', 
    true
  );
  
  RAISE LOG 'Created profile for user %', NEW.id;

  -- Inicializar métricas
  INSERT INTO public.usage_metrics (organization_id, users_count, clients_count, orders_count)
  VALUES (new_org_id, 1, 0, 0);
  
  RAISE LOG 'Created metrics for organization %', new_org_id;

  -- Criar configuração de customização padrão
  INSERT INTO public.customization_settings (organization_id, primary_color, secondary_color)
  VALUES (new_org_id, '#3b82f6', '#10b981');
  
  RAISE LOG 'Created customization settings for organization %', new_org_id;

  RETURN NEW;
  
EXCEPTION WHEN OTHERS THEN
  -- Log do erro
  RAISE LOG 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
  -- Re-lançar o erro
  RAISE;
END;
$$;

-- Recriar o trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Garantir que a função tem as permissões corretas
GRANT EXECUTE ON FUNCTION handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION handle_new_user() TO service_role;

-- =====================================================
-- CONCLUÍDO!
-- =====================================================
-- Trigger melhorado criado!
-- Tente criar um novo usuário novamente.
-- =====================================================
