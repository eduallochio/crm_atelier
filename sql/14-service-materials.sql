USE MeuAtelier;
GO

-- Adiciona campo JSON para armazenar materiais estruturados (vinculados ao catálogo de produtos)
ALTER TABLE org_services
ADD materiais_json NVARCHAR(MAX) NULL;
GO
