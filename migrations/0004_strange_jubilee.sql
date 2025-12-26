CREATE TABLE "properties" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"external_id" text,
	"source" text DEFAULT 'manual',
	"title" text NOT NULL,
	"address" text,
	"city" text,
	"state" text,
	"type" text,
	"price" numeric(12, 2),
	"image_url" text,
	"status" text DEFAULT 'active',
	"synced_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "brokers" ADD COLUMN "meta_anual" numeric(12, 2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "brokers" ADD COLUMN "avatar_url" text;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "meta_anual" numeric(12, 2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "super_meta" numeric(12, 2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "jetimoveis_token" text;--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;