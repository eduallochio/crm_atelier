-- Trigger para registrar automaticamente o histórico de preços quando houver alterações
CREATE OR REPLACE FUNCTION log_service_price_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Só registra se o preço mudou
  IF (TG_OP = 'UPDATE' AND OLD.preco != NEW.preco) THEN
    INSERT INTO org_service_price_history (
      org_service_id,
      organization_id,
      old_price,
      new_price,
      changed_by,
      change_reason
    ) VALUES (
      NEW.id,
      NEW.organization_id,
      OLD.preco,
      NEW.preco,
      auth.uid(), -- ID do usuário que fez a alteração
      'Alteração de preço'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar o trigger
DROP TRIGGER IF EXISTS service_price_change_trigger ON org_services;
CREATE TRIGGER service_price_change_trigger
  AFTER UPDATE ON org_services
  FOR EACH ROW
  EXECUTE FUNCTION log_service_price_change();

COMMENT ON FUNCTION log_service_price_change() IS 'Registra automaticamente mudanças de preço no histórico';
