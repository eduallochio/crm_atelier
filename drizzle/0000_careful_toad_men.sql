CREATE TABLE "admin_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"action" text NOT NULL,
	"resource_type" text,
	"resource_id" text,
	"description" text NOT NULL,
	"admin_email" text,
	"details_json" jsonb,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "admin_system_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text DEFAULT '' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now(),
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "coupon_usages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coupon_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"used_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "coupons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"description" text,
	"discount_type" text DEFAULT 'percentage' NOT NULL,
	"discount_value" numeric(10, 2) NOT NULL,
	"max_uses" integer,
	"uses_count" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"applicable_plans" jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "coupons_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "customization_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"primary_color" text DEFAULT '#3b82f6' NOT NULL,
	"secondary_color" text DEFAULT '#10b981' NOT NULL,
	"logo_url" text,
	"atelier_name" text,
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "customization_settings_organization_id_unique" UNIQUE("organization_id")
);
--> statement-breakpoint
CREATE TABLE "org_cashier_movements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"sessao_id" uuid NOT NULL,
	"tipo" text NOT NULL,
	"valor" numeric(10, 2) NOT NULL,
	"descricao" text NOT NULL,
	"metodo_pagamento_id" uuid,
	"referencia_id" uuid,
	"referencia_tipo" text,
	"usuario_id" uuid,
	"data_movimento" timestamp with time zone DEFAULT now(),
	"observacoes" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "org_cashier_reconciliations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"sessao_id" uuid NOT NULL,
	"metodo_pagamento_id" uuid NOT NULL,
	"valor_esperado" numeric(10, 2) DEFAULT '0' NOT NULL,
	"valor_informado" numeric(10, 2) DEFAULT '0' NOT NULL,
	"diferenca" numeric(10, 2),
	"observacoes" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "org_cashier_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"caixa_id" uuid NOT NULL,
	"usuario_abertura_id" uuid,
	"usuario_fechamento_id" uuid,
	"data_abertura" timestamp with time zone DEFAULT now(),
	"data_fechamento" timestamp with time zone,
	"saldo_inicial" numeric(10, 2) DEFAULT '0' NOT NULL,
	"saldo_esperado" numeric(10, 2),
	"saldo_real" numeric(10, 2),
	"diferenca" numeric(10, 2),
	"status" text DEFAULT 'aberto' NOT NULL,
	"observacoes_abertura" text,
	"observacoes_fechamento" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "org_cashiers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"nome" text NOT NULL,
	"descricao" text,
	"ativo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "org_clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"nome" text NOT NULL,
	"telefone" text,
	"email" text,
	"data_nascimento" date,
	"observacoes" text,
	"cep" text,
	"logradouro" text,
	"numero" text,
	"complemento" text,
	"bairro" text,
	"cidade" text,
	"estado" text,
	"data_cadastro" timestamp with time zone DEFAULT now(),
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "org_financial_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"nome" text NOT NULL,
	"tipo" text NOT NULL,
	"cor" text,
	"descricao" text,
	"ativo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "org_financial_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"payment_methods_json" jsonb DEFAULT '{"dinheiro":true,"pix":true,"credito":true,"debito":true,"outros":true}'::jsonb NOT NULL,
	"late_fee_percentage" numeric(5, 2),
	"interest_rate_per_month" numeric(5, 2),
	"cashier_requires_opening" boolean DEFAULT true NOT NULL,
	"cashier_opening_balance_required" boolean DEFAULT false NOT NULL,
	"expense_categories_json" jsonb DEFAULT '[]'::jsonb,
	"income_categories_json" jsonb DEFAULT '[]'::jsonb,
	"pix_key" text,
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "org_financial_settings_organization_id_unique" UNIQUE("organization_id")
);
--> statement-breakpoint
CREATE TABLE "org_monthly_goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"revenue_goal" numeric(10, 2),
	"orders_goal" integer,
	"new_clients_goal" integer,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "org_notification_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"notify_client_birthday" boolean DEFAULT true NOT NULL,
	"notify_order_ready" boolean DEFAULT true NOT NULL,
	"notify_payment_reminder" boolean DEFAULT true NOT NULL,
	"notify_order_delayed" boolean DEFAULT true NOT NULL,
	"notify_low_stock" boolean DEFAULT false NOT NULL,
	"notify_new_client" boolean DEFAULT false NOT NULL,
	"email_notifications_enabled" boolean DEFAULT false NOT NULL,
	"notification_email" text,
	"birthday_reminder_days" integer DEFAULT 7 NOT NULL,
	"payment_reminder_days" integer DEFAULT 3 NOT NULL,
	"order_reminder_days" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "org_notification_settings_organization_id_unique" UNIQUE("organization_id")
);
--> statement-breakpoint
CREATE TABLE "org_order_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"order_prefix" text DEFAULT 'OS',
	"order_start_number" integer DEFAULT 1 NOT NULL,
	"order_number_format" text DEFAULT 'sequential' NOT NULL,
	"default_status" text DEFAULT 'pendente' NOT NULL,
	"require_client" boolean DEFAULT true NOT NULL,
	"require_service" boolean DEFAULT true NOT NULL,
	"require_delivery_date" boolean DEFAULT true NOT NULL,
	"require_payment_method" boolean DEFAULT false NOT NULL,
	"default_delivery_days" integer DEFAULT 7 NOT NULL,
	"default_message" text,
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "org_order_settings_organization_id_unique" UNIQUE("organization_id")
);
--> statement-breakpoint
CREATE TABLE "org_payables" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"supplier_id" uuid,
	"category_id" uuid,
	"descricao" text NOT NULL,
	"valor" numeric(10, 2) NOT NULL,
	"data_vencimento" date NOT NULL,
	"data_pagamento" date,
	"status" text DEFAULT 'pendente' NOT NULL,
	"categoria" text,
	"forma_pagamento" text,
	"observacoes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "org_payment_methods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"nome" text NOT NULL,
	"tipo" text,
	"ativo" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "org_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"nome" text NOT NULL,
	"descricao" text,
	"categoria" text,
	"unidade" text DEFAULT 'un' NOT NULL,
	"quantidade_atual" numeric(10, 3) DEFAULT '0' NOT NULL,
	"quantidade_minima" numeric(10, 3) DEFAULT '0' NOT NULL,
	"preco_custo" numeric(10, 2),
	"codigo_barras" text,
	"ativo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "org_receivables" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"service_order_id" uuid,
	"client_id" uuid,
	"category_id" uuid,
	"payment_method_id" uuid,
	"descricao" text NOT NULL,
	"valor" numeric(10, 2) NOT NULL,
	"data_vencimento" date NOT NULL,
	"data_recebimento" date,
	"status" text DEFAULT 'pendente' NOT NULL,
	"observacoes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "org_service_order_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_email" text NOT NULL,
	"campo_alterado" text NOT NULL,
	"valor_anterior" text,
	"valor_novo" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "org_service_order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"service_id" uuid,
	"service_nome" text NOT NULL,
	"quantidade" integer DEFAULT 1 NOT NULL,
	"valor_unitario" numeric(10, 2) NOT NULL,
	"valor_total" numeric(10, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "org_service_order_materials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"product_id" uuid,
	"nome" text NOT NULL,
	"quantidade" numeric(10, 3) DEFAULT '1' NOT NULL,
	"unidade" text DEFAULT 'un',
	"preco_custo" numeric(10, 2),
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "org_service_order_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_email" text NOT NULL,
	"nota" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "org_service_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"numero" integer NOT NULL,
	"organization_id" uuid NOT NULL,
	"client_id" uuid,
	"status" text DEFAULT 'pendente' NOT NULL,
	"valor_total" numeric(10, 2) DEFAULT '0' NOT NULL,
	"valor_entrada" numeric(10, 2) DEFAULT '0' NOT NULL,
	"valor_pago" numeric(10, 2) DEFAULT '0' NOT NULL,
	"status_pagamento" text DEFAULT 'pendente' NOT NULL,
	"desconto_valor" numeric(10, 2) DEFAULT '0' NOT NULL,
	"desconto_percentual" numeric(5, 2) DEFAULT '0' NOT NULL,
	"data_abertura" timestamp with time zone DEFAULT now(),
	"data_prevista" date,
	"data_conclusao" timestamp with time zone,
	"forma_pagamento" text,
	"observacoes" text,
	"notas_internas" text,
	"default_message" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "org_services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"nome" text NOT NULL,
	"descricao" text,
	"preco" numeric(10, 2) DEFAULT '0' NOT NULL,
	"categoria" text,
	"tempo_estimado" text,
	"materiais" text,
	"custo_materiais" numeric(10, 2),
	"observacoes_tecnicas" text,
	"nivel_dificuldade" text,
	"tempo_minimo" text,
	"tempo_maximo" text,
	"ativo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "org_stock_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"supplier_id" uuid,
	"tipo" text DEFAULT 'manual' NOT NULL,
	"numero_nota" text,
	"serie_nota" text,
	"chave_acesso" text,
	"emitente_cnpj" text,
	"emitente_nome" text,
	"data_emissao" timestamp with time zone,
	"valor_total" numeric(10, 2),
	"observacoes" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "org_stock_entry_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entry_id" uuid NOT NULL,
	"product_id" uuid,
	"produto_nome" text NOT NULL,
	"quantidade" numeric(10, 3) NOT NULL,
	"unidade" text DEFAULT 'un' NOT NULL,
	"preco_unitario" numeric(10, 2),
	"preco_total" numeric(10, 2)
);
--> statement-breakpoint
CREATE TABLE "org_suppliers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"nome" text NOT NULL,
	"contato" text,
	"telefone" text,
	"email" text,
	"cnpj" text,
	"endereco" text,
	"observacoes" text,
	"ativo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "org_system_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"date_format" text DEFAULT 'dd/MM/yyyy' NOT NULL,
	"time_format" text DEFAULT '24h' NOT NULL,
	"currency" text DEFAULT 'BRL' NOT NULL,
	"timezone" text DEFAULT 'America/Sao_Paulo' NOT NULL,
	"language" text DEFAULT 'pt-BR' NOT NULL,
	"theme" text DEFAULT 'light' NOT NULL,
	"compact_mode" boolean DEFAULT false NOT NULL,
	"show_tooltips" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "org_system_preferences_organization_id_unique" UNIQUE("organization_id")
);
--> statement-breakpoint
CREATE TABLE "org_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"tipo" text NOT NULL,
	"descricao" text NOT NULL,
	"valor" numeric(10, 2) NOT NULL,
	"data_transacao" date NOT NULL,
	"category_id" uuid,
	"payment_method_id" uuid,
	"receivable_id" uuid,
	"payable_id" uuid,
	"observacoes" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"plan" text DEFAULT 'free' NOT NULL,
	"stripe_customer_id" text,
	"subscription_status" text DEFAULT 'inactive',
	"email" text,
	"phone" text,
	"cnpj" text,
	"address" text,
	"city" text,
	"state" text,
	"zip_code" text,
	"website" text,
	"logo_url" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "page_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"page" text NOT NULL,
	"event" text NOT NULL,
	"data" jsonb,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"price" numeric(10, 2) DEFAULT '0' NOT NULL,
	"price_annual" numeric(10, 2),
	"annual_note" text,
	"badge" text,
	"is_featured" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"features_json" jsonb,
	"cta_text" text DEFAULT 'Criar conta',
	"cta_url" text DEFAULT '/cadastro',
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "plans_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"full_name" text,
	"role" text DEFAULT 'owner' NOT NULL,
	"is_owner" boolean DEFAULT false NOT NULL,
	"is_master" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "usage_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"clients_count" integer DEFAULT 0 NOT NULL,
	"orders_count" integer DEFAULT 0 NOT NULL,
	"users_count" integer DEFAULT 1 NOT NULL,
	"total_clients_ever" integer DEFAULT 0 NOT NULL,
	"total_orders_ever" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "usage_metrics_organization_id_unique" UNIQUE("organization_id")
);
--> statement-breakpoint
ALTER TABLE "coupon_usages" ADD CONSTRAINT "coupon_usages_coupon_id_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_usages" ADD CONSTRAINT "coupon_usages_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customization_settings" ADD CONSTRAINT "customization_settings_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_cashier_movements" ADD CONSTRAINT "org_cashier_movements_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_cashier_movements" ADD CONSTRAINT "org_cashier_movements_sessao_id_org_cashier_sessions_id_fk" FOREIGN KEY ("sessao_id") REFERENCES "public"."org_cashier_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_cashier_movements" ADD CONSTRAINT "org_cashier_movements_metodo_pagamento_id_org_payment_methods_id_fk" FOREIGN KEY ("metodo_pagamento_id") REFERENCES "public"."org_payment_methods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_cashier_movements" ADD CONSTRAINT "org_cashier_movements_usuario_id_profiles_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_cashier_reconciliations" ADD CONSTRAINT "org_cashier_reconciliations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_cashier_reconciliations" ADD CONSTRAINT "org_cashier_reconciliations_sessao_id_org_cashier_sessions_id_fk" FOREIGN KEY ("sessao_id") REFERENCES "public"."org_cashier_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_cashier_reconciliations" ADD CONSTRAINT "org_cashier_reconciliations_metodo_pagamento_id_org_payment_methods_id_fk" FOREIGN KEY ("metodo_pagamento_id") REFERENCES "public"."org_payment_methods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_cashier_sessions" ADD CONSTRAINT "org_cashier_sessions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_cashier_sessions" ADD CONSTRAINT "org_cashier_sessions_caixa_id_org_cashiers_id_fk" FOREIGN KEY ("caixa_id") REFERENCES "public"."org_cashiers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_cashier_sessions" ADD CONSTRAINT "org_cashier_sessions_usuario_abertura_id_profiles_id_fk" FOREIGN KEY ("usuario_abertura_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_cashier_sessions" ADD CONSTRAINT "org_cashier_sessions_usuario_fechamento_id_profiles_id_fk" FOREIGN KEY ("usuario_fechamento_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_cashiers" ADD CONSTRAINT "org_cashiers_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_clients" ADD CONSTRAINT "org_clients_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_financial_categories" ADD CONSTRAINT "org_financial_categories_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_financial_settings" ADD CONSTRAINT "org_financial_settings_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_monthly_goals" ADD CONSTRAINT "org_monthly_goals_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_notification_settings" ADD CONSTRAINT "org_notification_settings_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_order_settings" ADD CONSTRAINT "org_order_settings_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_payables" ADD CONSTRAINT "org_payables_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_payables" ADD CONSTRAINT "org_payables_supplier_id_org_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."org_suppliers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_payables" ADD CONSTRAINT "org_payables_category_id_org_financial_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."org_financial_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_payment_methods" ADD CONSTRAINT "org_payment_methods_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_products" ADD CONSTRAINT "org_products_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_receivables" ADD CONSTRAINT "org_receivables_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_receivables" ADD CONSTRAINT "org_receivables_service_order_id_org_service_orders_id_fk" FOREIGN KEY ("service_order_id") REFERENCES "public"."org_service_orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_receivables" ADD CONSTRAINT "org_receivables_client_id_org_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."org_clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_receivables" ADD CONSTRAINT "org_receivables_category_id_org_financial_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."org_financial_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_receivables" ADD CONSTRAINT "org_receivables_payment_method_id_org_payment_methods_id_fk" FOREIGN KEY ("payment_method_id") REFERENCES "public"."org_payment_methods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_service_order_history" ADD CONSTRAINT "org_service_order_history_order_id_org_service_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."org_service_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_service_order_items" ADD CONSTRAINT "org_service_order_items_order_id_org_service_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."org_service_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_service_order_items" ADD CONSTRAINT "org_service_order_items_service_id_org_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."org_services"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_service_order_materials" ADD CONSTRAINT "org_service_order_materials_order_id_org_service_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."org_service_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_service_order_notes" ADD CONSTRAINT "org_service_order_notes_order_id_org_service_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."org_service_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_service_orders" ADD CONSTRAINT "org_service_orders_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_service_orders" ADD CONSTRAINT "org_service_orders_client_id_org_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."org_clients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_services" ADD CONSTRAINT "org_services_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_stock_entries" ADD CONSTRAINT "org_stock_entries_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_stock_entries" ADD CONSTRAINT "org_stock_entries_supplier_id_org_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."org_suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_stock_entry_items" ADD CONSTRAINT "org_stock_entry_items_entry_id_org_stock_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."org_stock_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_stock_entry_items" ADD CONSTRAINT "org_stock_entry_items_product_id_org_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."org_products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_suppliers" ADD CONSTRAINT "org_suppliers_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_system_preferences" ADD CONSTRAINT "org_system_preferences_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_transactions" ADD CONSTRAINT "org_transactions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_transactions" ADD CONSTRAINT "org_transactions_category_id_org_financial_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."org_financial_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_transactions" ADD CONSTRAINT "org_transactions_payment_method_id_org_payment_methods_id_fk" FOREIGN KEY ("payment_method_id") REFERENCES "public"."org_payment_methods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_transactions" ADD CONSTRAINT "org_transactions_receivable_id_org_receivables_id_fk" FOREIGN KEY ("receivable_id") REFERENCES "public"."org_receivables"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_transactions" ADD CONSTRAINT "org_transactions_payable_id_org_payables_id_fk" FOREIGN KEY ("payable_id") REFERENCES "public"."org_payables"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_metrics" ADD CONSTRAINT "usage_metrics_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_admin_logs_created" ON "admin_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_admin_logs_action" ON "admin_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "idx_admin_logs_resource" ON "admin_logs" USING btree ("resource_type","resource_id");--> statement-breakpoint
CREATE INDEX "idx_coupon_usages_coupon" ON "coupon_usages" USING btree ("coupon_id");--> statement-breakpoint
CREATE INDEX "idx_coupon_usages_org" ON "coupon_usages" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_coupons_code" ON "coupons" USING btree ("code");--> statement-breakpoint
CREATE INDEX "idx_clients_org" ON "org_clients" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_goals_org" ON "org_monthly_goals" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_goals_org_month" ON "org_monthly_goals" USING btree ("organization_id","year","month");--> statement-breakpoint
CREATE INDEX "idx_payables_org" ON "org_payables" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_payables_status" ON "org_payables" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_payables_venc" ON "org_payables" USING btree ("data_vencimento");--> statement-breakpoint
CREATE INDEX "idx_payables_org_status" ON "org_payables" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "idx_products_org" ON "org_products" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_products_active" ON "org_products" USING btree ("organization_id","ativo");--> statement-breakpoint
CREATE INDEX "idx_receivables_org" ON "org_receivables" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_receivables_status" ON "org_receivables" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_receivables_venc" ON "org_receivables" USING btree ("data_vencimento");--> statement-breakpoint
CREATE INDEX "idx_receivables_org_status" ON "org_receivables" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "idx_orders_org" ON "org_service_orders" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_orders_client" ON "org_service_orders" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_orders_status" ON "org_service_orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_orders_data" ON "org_service_orders" USING btree ("data_abertura");--> statement-breakpoint
CREATE INDEX "idx_orders_org_status" ON "org_service_orders" USING btree ("organization_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_order_numero_org" ON "org_service_orders" USING btree ("organization_id","numero");--> statement-breakpoint
CREATE INDEX "idx_services_org" ON "org_services" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_services_active" ON "org_services" USING btree ("organization_id","ativo");--> statement-breakpoint
CREATE INDEX "idx_transactions_org" ON "org_transactions" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_transactions_data" ON "org_transactions" USING btree ("data_transacao");--> statement-breakpoint
CREATE INDEX "idx_transactions_org_date" ON "org_transactions" USING btree ("organization_id","data_transacao");--> statement-breakpoint
CREATE INDEX "idx_profiles_org" ON "profiles" USING btree ("organization_id");