-- Tabela de eventos de página/funil
CREATE TABLE page_events (
  id            BIGINT IDENTITY(1,1) PRIMARY KEY,
  event_type    NVARCHAR(50) NOT NULL,  -- page_view, cta_click, signup_started, signup_completed, section_view
  session_id    NVARCHAR(100) NULL,     -- ID anônimo do visitante (gerado no browser)
  page          NVARCHAR(255) NULL,     -- /cadastro, /, etc
  referrer      NVARCHAR(500) NULL,
  utm_source    NVARCHAR(100) NULL,
  utm_medium    NVARCHAR(100) NULL,
  utm_campaign  NVARCHAR(100) NULL,
  metadata      NVARCHAR(MAX) NULL,     -- JSON livre para dados extras
  ip_hash       NVARCHAR(100) NULL,     -- hash do IP (LGPD)
  user_agent    NVARCHAR(500) NULL,
  country       NVARCHAR(10) NULL,
  created_at    DATETIME2 DEFAULT GETDATE()
);

CREATE INDEX idx_page_events_type ON page_events(event_type);
CREATE INDEX idx_page_events_created ON page_events(created_at);
CREATE INDEX idx_page_events_session ON page_events(session_id);
