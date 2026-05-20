-- =====================================================
-- TRIGGERS — CRM Atelier
-- Aplicar via: supabase db push
-- =====================================================

-- ─── 1. TRIGGER: handle_new_user ─────────────────────────────────────────────
-- Cria organização + profile + usage_metrics + customization ao confirmar email.
-- Substitui toda a lógica de signup do actions.ts anterior.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_org_id uuid;
  base_slug  text;
  final_slug text;
  counter    int := 0;
BEGIN
  -- Gera slug único baseado no nome
  base_slug := lower(regexp_replace(
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'atelier'),
    '[^a-z0-9]+', '-', 'g'
  ));
  base_slug := trim(both '-' from base_slug);
  IF base_slug = '' THEN base_slug := 'atelier'; END IF;

  -- Garante unicidade do slug
  final_slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM public.organizations WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;

  -- Cria organização
  INSERT INTO public.organizations (name, slug, plan)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Meu Ateliê'),
    final_slug,
    'free'
  )
  RETURNING id INTO new_org_id;

  -- Cria profile vinculado ao auth.users
  INSERT INTO public.profiles (id, organization_id, full_name, role, is_owner)
  VALUES (
    NEW.id,
    new_org_id,
    NEW.raw_user_meta_data->>'full_name',
    'owner',
    true
  );

  -- Cria métricas de uso iniciais
  INSERT INTO public.usage_metrics (organization_id)
  VALUES (new_org_id);

  -- Cria configurações de personalização padrão
  INSERT INTO public.customization_settings (organization_id)
  VALUES (new_org_id);

  -- Cria serviços padrão para ateliê de reparos
  INSERT INTO public.org_services (organization_id, nome, categoria, ativo)
  VALUES
    (new_org_id, 'Troca de Zíper',      'Reparos', true),
    (new_org_id, 'Barra',               'Reparos', true),
    (new_org_id, 'Ajuste Lateral',      'Ajustes', true),
    (new_org_id, 'Ajuste de Cintura',   'Ajustes', true),
    (new_org_id, 'Bainha',              'Reparos', true),
    (new_org_id, 'Troca de Botões',     'Reparos', true);

  RETURN NEW;
END;
$$;

-- Remove trigger anterior se existir e recria
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();


-- ─── 2. TRIGGER: update_product_quantity ─────────────────────────────────────
-- Atualiza quantidade_atual do produto ao inserir item de entrada de estoque.
-- Substitui o trigger T-SQL do SQL Server.

CREATE OR REPLACE FUNCTION public.update_product_quantity()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.product_id IS NOT NULL THEN
    UPDATE public.org_products
    SET
      quantidade_atual = quantidade_atual + NEW.quantidade,
      updated_at = now()
    WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_stock_entry_item_insert ON public.org_stock_entry_items;

CREATE TRIGGER trg_stock_entry_item_insert
  AFTER INSERT ON public.org_stock_entry_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_product_quantity();


-- ─── 3. FUNÇÃO HELPER: auth.organization_id() ────────────────────────────────
-- Retorna o organization_id do usuário autenticado atual.
-- Usada nas RLS policies para evitar subquery repetida.

CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id
  FROM public.profiles
  WHERE id = auth.uid();
$$;


-- ─── 4. TRIGGERS: saídas de estoque (INSERT / UPDATE / DELETE) ───────────────
-- Mantém quantidade_atual sincronizada com org_stock_exit_items.
-- Guard contra estoque negativo no INSERT e no UPDATE.

CREATE OR REPLACE FUNCTION public.handle_stock_exit_item()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  qty_atual numeric;
  delta     numeric;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT quantidade_atual INTO qty_atual
      FROM public.org_products WHERE id = NEW.product_id;
    IF qty_atual - NEW.quantidade < 0 THEN
      RAISE EXCEPTION 'Estoque insuficiente para o produto %', NEW.product_id;
    END IF;
    UPDATE public.org_products
      SET quantidade_atual = quantidade_atual - NEW.quantidade,
          updated_at = now()
      WHERE id = NEW.product_id;

  ELSIF TG_OP = 'UPDATE' THEN
    delta := NEW.quantidade - OLD.quantidade;
    IF delta > 0 THEN
      SELECT quantidade_atual INTO qty_atual
        FROM public.org_products WHERE id = NEW.product_id;
      IF qty_atual - delta < 0 THEN
        RAISE EXCEPTION 'Estoque insuficiente para o produto %', NEW.product_id;
      END IF;
    END IF;
    UPDATE public.org_products
      SET quantidade_atual = quantidade_atual - delta,
          updated_at = now()
      WHERE id = NEW.product_id;

  ELSIF TG_OP = 'DELETE' THEN
    -- Reverte o decremento ao excluir o item
    UPDATE public.org_products
      SET quantidade_atual = quantidade_atual + OLD.quantidade,
          updated_at = now()
      WHERE id = OLD.product_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_stock_exit_item_insert ON public.org_stock_exit_items;
DROP TRIGGER IF EXISTS trg_stock_exit_item_update ON public.org_stock_exit_items;
DROP TRIGGER IF EXISTS trg_stock_exit_item_delete ON public.org_stock_exit_items;

CREATE TRIGGER trg_stock_exit_item_insert
  AFTER INSERT ON public.org_stock_exit_items
  FOR EACH ROW EXECUTE FUNCTION public.handle_stock_exit_item();

CREATE TRIGGER trg_stock_exit_item_update
  AFTER UPDATE OF quantidade ON public.org_stock_exit_items
  FOR EACH ROW EXECUTE FUNCTION public.handle_stock_exit_item();

CREATE TRIGGER trg_stock_exit_item_delete
  AFTER DELETE ON public.org_stock_exit_items
  FOR EACH ROW EXECUTE FUNCTION public.handle_stock_exit_item();
