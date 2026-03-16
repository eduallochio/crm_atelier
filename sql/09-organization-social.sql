-- Migração: adiciona campos de redes sociais na tabela organizations
-- Execute no SSMS no banco CrmAtelier

ALTER TABLE organizations
  ADD instagram  NVARCHAR(255) NULL,
      facebook   NVARCHAR(255) NULL,
      twitter    NVARCHAR(255) NULL,
      tiktok     NVARCHAR(255) NULL,
      kwai       NVARCHAR(255) NULL;
GO
