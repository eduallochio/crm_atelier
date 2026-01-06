-- =====================================================
-- FIX: Adicionar políticas de INSERT para signup
-- =====================================================

-- Permitir que novos usuários criem organizações
DROP POLICY IF EXISTS "Users can create organizations" ON organizations;
CREATE POLICY "Users can create organizations"
  ON organizations FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Permitir que usuários criem seus próprios perfis
DROP POLICY IF EXISTS "Users can create own profile" ON profiles;
CREATE POLICY "Users can create own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Permitir criação de métricas (será validado por FK)
DROP POLICY IF EXISTS "Users can create org metrics" ON usage_metrics;
CREATE POLICY "Users can create org metrics"
  ON usage_metrics FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Permitir criação de customização (será validado por FK)
DROP POLICY IF EXISTS "Users can create customization" ON customization_settings;
CREATE POLICY "Users can create customization"
  ON customization_settings FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- =====================================================
-- CONCLUÍDO!
-- =====================================================
