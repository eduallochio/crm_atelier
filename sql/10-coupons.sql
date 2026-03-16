-- Tabela de cupons de desconto
CREATE TABLE coupons (
  id               UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  code             NVARCHAR(50)     NOT NULL UNIQUE,
  description      NVARCHAR(255)    NULL,
  discount_type    NVARCHAR(20)     NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value   DECIMAL(10, 2)   NOT NULL,
  max_uses         INT              NULL,           -- NULL = ilimitado
  uses_count       INT              NOT NULL DEFAULT 0,
  expires_at       DATETIME2        NULL,           -- NULL = sem expiração
  is_active        BIT              NOT NULL DEFAULT 1,
  applicable_plans NVARCHAR(MAX)    NULL,           -- JSON array de slugs de planos, NULL = todos
  created_at       DATETIME2        NOT NULL DEFAULT GETDATE()
);

-- Índice para busca por código
CREATE INDEX IX_coupons_code ON coupons (code);

-- Tabela de uso de cupons por organização
CREATE TABLE coupon_usages (
  id              UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  coupon_id       UNIQUEIDENTIFIER NOT NULL REFERENCES coupons(id),
  organization_id UNIQUEIDENTIFIER NOT NULL REFERENCES organizations(id),
  used_at         DATETIME2        NOT NULL DEFAULT GETDATE()
);

CREATE INDEX IX_coupon_usages_coupon ON coupon_usages (coupon_id);
CREATE INDEX IX_coupon_usages_org    ON coupon_usages (organization_id);
