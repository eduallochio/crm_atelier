CREATE TABLE "org_stock_exit_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exit_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"produto_nome" text NOT NULL,
	"quantidade" numeric(10, 3) NOT NULL,
	"unidade" text DEFAULT 'un' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "org_stock_exits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"service_order_id" uuid,
	"tipo" text DEFAULT 'manual' NOT NULL,
	"observacoes" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "org_financial_settings" ADD COLUMN "show_pix_key_on_order" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "org_notification_settings" ADD COLUMN "ordem_aviso_ativo" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "org_notification_settings" ADD COLUMN "ordem_aviso_texto" text;--> statement-breakpoint
ALTER TABLE "org_payment_methods" ADD COLUMN "color" text;--> statement-breakpoint
ALTER TABLE "org_payment_methods" ADD COLUMN "icon" text;--> statement-breakpoint
ALTER TABLE "org_payment_methods" ADD COLUMN "is_default" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "org_payment_methods" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now();--> statement-breakpoint
ALTER TABLE "org_services" ADD COLUMN "materiais_json" jsonb;--> statement-breakpoint
ALTER TABLE "org_system_preferences" ADD COLUMN "controla_estoque" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "instagram" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "facebook" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "twitter" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "tiktok" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "kwai" text;--> statement-breakpoint
ALTER TABLE "org_stock_exit_items" ADD CONSTRAINT "org_stock_exit_items_exit_id_org_stock_exits_id_fk" FOREIGN KEY ("exit_id") REFERENCES "public"."org_stock_exits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_stock_exit_items" ADD CONSTRAINT "org_stock_exit_items_product_id_org_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."org_products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_stock_exits" ADD CONSTRAINT "org_stock_exits_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_stock_exits" ADD CONSTRAINT "org_stock_exits_service_order_id_org_service_orders_id_fk" FOREIGN KEY ("service_order_id") REFERENCES "public"."org_service_orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_stock_exits_org" ON "org_stock_exits" USING btree ("organization_id");