-- Adiciona campos de chave PIX nas configurações financeiras
ALTER TABLE org_financial_settings
  ADD pix_key NVARCHAR(255) NULL,
      show_pix_key_on_order BIT NOT NULL DEFAULT 0;
