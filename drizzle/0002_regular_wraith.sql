ALTER TABLE "org_stock_exits" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now();--> statement-breakpoint
CREATE INDEX "idx_stock_exit_items_exit" ON "org_stock_exit_items" USING btree ("exit_id");--> statement-breakpoint
CREATE INDEX "idx_stock_exit_items_product" ON "org_stock_exit_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_stock_exits_order" ON "org_stock_exits" USING btree ("service_order_id");