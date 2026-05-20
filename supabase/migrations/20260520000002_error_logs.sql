-- =====================================================
-- Tabela de erros de runtime do sistema
-- =====================================================

CREATE TABLE IF NOT EXISTS public.admin_error_logs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  user_id         uuid,
  -- Dados do erro
  message         text NOT NULL,
  stack           text,
  component_stack text,
  error_type      text NOT NULL DEFAULT 'runtime', -- 'runtime' | 'unhandled_promise' | 'boundary'
  severity        text NOT NULL DEFAULT 'error',   -- 'error' | 'warning' | 'critical'
  -- Contexto
  url             text,
  user_agent      text,
  extra           jsonb,
  -- Resolução
  resolved        boolean NOT NULL DEFAULT false,
  resolved_at     timestamptz,
  resolution_note text,
  -- Timestamps
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_error_logs_created   ON public.admin_error_logs (created_at DESC);
CREATE INDEX idx_error_logs_resolved  ON public.admin_error_logs (resolved, created_at DESC);
CREATE INDEX idx_error_logs_org       ON public.admin_error_logs (organization_id);
CREATE INDEX idx_error_logs_type      ON public.admin_error_logs (error_type, severity);

-- Sem RLS — só acessível via service role (API admin)
