USE MeuAtelier;
GO

-- Adiciona campos de aviso padrão para ordens de serviço
-- na tabela de configurações de notificações
ALTER TABLE org_notification_settings
ADD ordem_aviso_ativo BIT NOT NULL DEFAULT 0;
GO

ALTER TABLE org_notification_settings
ADD ordem_aviso_texto NVARCHAR(MAX) NULL;
GO
