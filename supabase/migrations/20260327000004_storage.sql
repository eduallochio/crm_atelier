-- =====================================================
-- STORAGE — CRM Atelier
-- Cria bucket org-assets para logos e imagens de ordens
-- Aplicar via: supabase db push ou SQL Editor no Supabase
-- =====================================================

-- Criar bucket público para assets da organização
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'org-assets',
  'org-assets',
  true,
  10485760,  -- 10MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;


-- ─── POLICIES DO BUCKET ───────────────────────────────────────────────────────

-- Leitura pública (URLs públicas funcionam sem autenticação)
CREATE POLICY "public_read_org_assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'org-assets');

-- Upload apenas para usuários autenticados, dentro da pasta da própria org
CREATE POLICY "auth_upload_org_assets"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'org-assets'
    AND (storage.foldername(name))[1] IN ('logos', 'orders')
  );

-- Atualização apenas de arquivos da própria org (logos/{org_id}/*)
CREATE POLICY "org_update_own_assets"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'org-assets')
  WITH CHECK (bucket_id = 'org-assets');

-- Deleção apenas de arquivos da própria org
CREATE POLICY "org_delete_own_assets"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'org-assets');
