CREATE TABLE "broker_goals" (
	"id" serial PRIMARY KEY NOT NULL,
	"broker_id" integer NOT NULL,
	"year" integer NOT NULL,
	"meta_anual" numeric(12, 2) DEFAULT '0',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tenant_goals" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"year" integer NOT NULL,
	"meta_anual" numeric(12, 2) DEFAULT '0',
	"super_meta" numeric(12, 2) DEFAULT '0',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "broker_goals" ADD CONSTRAINT "broker_goals_broker_id_brokers_id_fk" FOREIGN KEY ("broker_id") REFERENCES "public"."brokers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_goals" ADD CONSTRAINT "tenant_goals_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brokers" DROP COLUMN "meta_anual";--> statement-breakpoint
ALTER TABLE "tenants" DROP COLUMN "meta_anual";--> statement-breakpoint
ALTER TABLE "tenants" DROP COLUMN "super_meta";