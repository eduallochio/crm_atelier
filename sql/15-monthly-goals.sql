-- Adiciona coluna de meta mensal de receita nas configurações de sistema
IF NOT EXISTS (
  SELECT 1 FROM sys.columns
  WHERE object_id = OBJECT_ID('org_system_preferences')
    AND name = 'monthly_revenue_goal'
)
BEGIN
  ALTER TABLE org_system_preferences
    ADD monthly_revenue_goal DECIMAL(10,2) DEFAULT 0
  PRINT 'Coluna monthly_revenue_goal adicionada em org_system_preferences'
END
ELSE
BEGIN
  PRINT 'Coluna monthly_revenue_goal já existe — nenhuma alteração feita'
END
