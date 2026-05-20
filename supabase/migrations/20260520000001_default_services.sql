-- =====================================================
-- Serviços padrão para ateliês de reparo de roupas
-- Inseridos em todas as orgs que ainda não têm serviços
-- =====================================================

INSERT INTO public.org_services (organization_id, nome, categoria, ativo)
SELECT
  o.id,
  s.nome,
  s.categoria,
  true
FROM public.organizations o
CROSS JOIN (
  VALUES
    ('Troca de Zíper',    'Reparos'),
    ('Barra',             'Reparos'),
    ('Ajuste Lateral',    'Ajustes'),
    ('Ajuste de Cintura', 'Ajustes'),
    ('Bainha',            'Reparos'),
    ('Troca de Botões',   'Reparos')
) AS s(nome, categoria)
WHERE NOT EXISTS (
  SELECT 1 FROM public.org_services WHERE organization_id = o.id
);
