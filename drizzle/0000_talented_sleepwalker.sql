CREATE TYPE "public"."appointment_status" AS ENUM('pending', 'confirmed', 'attended', 'cancelled', 'no_show');--> statement-breakpoint
CREATE TYPE "public"."billing_currency" AS ENUM('COP', 'USD');--> statement-breakpoint
CREATE TYPE "public"."billing_status" AS ENUM('none', 'active', 'past_due', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."brand_alert_type" AS ENUM('inactive_clients', 'open_quotes', 'low_stock');--> statement-breakpoint
CREATE TYPE "public"."field_type" AS ENUM('text', 'number', 'select', 'date', 'textarea');--> statement-breakpoint
CREATE TYPE "public"."membership_status" AS ENUM('active', 'expired', 'cancelled', 'trial');--> statement-breakpoint
CREATE TYPE "public"."module_subscription_status" AS ENUM('trial', 'active', 'expired', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."plan" AS ENUM('free', 'basic', 'professional', 'enterprise', 'enterprise_plus', 'standard');--> statement-breakpoint
CREATE TYPE "public"."pre_order_status" AS ENUM('pending', 'received', 'preparing', 'ready', 'delivered');--> statement-breakpoint
CREATE TYPE "public"."product_type" AS ENUM('product', 'service', 'digital');--> statement-breakpoint
CREATE TYPE "public"."sale_status" AS ENUM('completed', 'cancelled', 'draft', 'sent', 'accepted', 'rejected', 'converted');--> statement-breakpoint
CREATE TYPE "public"."sale_type" AS ENUM('sale', 'quote');--> statement-breakpoint
CREATE TYPE "public"."stock_movement_type" AS ENUM('sale', 'purchase', 'adjustment', 'return');--> statement-breakpoint
CREATE TYPE "public"."ticket_status" AS ENUM('waiting', 'in_progress', 'done', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('superadmin', 'brand_admin', 'manager', 'advisor', 'reporting');--> statement-breakpoint
CREATE TYPE "public"."wa_template_category" AS ENUM('appointment_confirmation', 'appointment_reminder', 'appointment_cancelled', 'appointment_no_show', 'sale_receipt', 'sale_pending_payment', 'quote_sent', 'quote_followup', 'customer_reactivation');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"access_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "advisor_fields" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"establishment_id" uuid NOT NULL,
	"label" text NOT NULL,
	"field_type" "field_type" DEFAULT 'text' NOT NULL,
	"options" jsonb,
	"required" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"name" text DEFAULT 'Clave principal' NOT NULL,
	"key_prefix" text NOT NULL,
	"key_hash" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_used_at" timestamp,
	CONSTRAINT "api_keys_key_hash_unique" UNIQUE("key_hash")
);
--> statement-breakpoint
CREATE TABLE "app_translations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lang" text NOT NULL,
	"key" text NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "appointment_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"establishment_id" uuid NOT NULL,
	"slot_minutes" integer DEFAULT 30 NOT NULL,
	"max_per_slot" integer DEFAULT 1 NOT NULL,
	"open_days" integer[] DEFAULT '{1,2,3,4,5}' NOT NULL,
	"open_time" time DEFAULT '08:00' NOT NULL,
	"close_time" time DEFAULT '18:00' NOT NULL,
	"advance_days" integer DEFAULT 30 NOT NULL,
	"buffer_minutes" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "appointment_settings_establishment_id_unique" UNIQUE("establishment_id")
);
--> statement-breakpoint
CREATE TABLE "appointments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"establishment_id" uuid NOT NULL,
	"visit_reason_id" uuid,
	"customer_name" text NOT NULL,
	"customer_phone" text,
	"customer_email" text,
	"scheduled_at" timestamp NOT NULL,
	"duration_minutes" integer DEFAULT 30 NOT NULL,
	"status" "appointment_status" DEFAULT 'pending' NOT NULL,
	"notes" text,
	"advisor_id" text,
	"ticket_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attentions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid NOT NULL,
	"advisor_id" text NOT NULL,
	"establishment_id" uuid NOT NULL,
	"fields_data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "availability_slots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"establishment_id" uuid NOT NULL,
	"day_of_week" integer NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"slot_duration_minutes" integer DEFAULT 30,
	"max_concurrent" integer DEFAULT 1,
	"active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "billing_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"membership_id" uuid,
	"wompi_transaction_id" text,
	"wompi_reference" text,
	"amount" bigint NOT NULL,
	"currency" "billing_currency" DEFAULT 'COP' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"payment_source_id" integer,
	"customer_email" text,
	"error_reason" text,
	"period_start" date,
	"period_end" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "billing_transactions_wompi_transaction_id_unique" UNIQUE("wompi_transaction_id"),
	CONSTRAINT "billing_transactions_wompi_reference_unique" UNIQUE("wompi_reference")
);
--> statement-breakpoint
CREATE TABLE "brand_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"alert_type" "brand_alert_type" NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb,
	"resolved" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brands" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"logo_url" text,
	"active" boolean DEFAULT true NOT NULL,
	"current_plan" "plan" DEFAULT 'free' NOT NULL,
	"active_modules" jsonb DEFAULT '{"queue":true,"appointments":false,"surveys":false,"menu":false,"display":false}' NOT NULL,
	"address" text,
	"contact_email" text,
	"website" text,
	"country" text DEFAULT 'Colombia',
	"business_type" text DEFAULT 'otros',
	"onboarding_completed" boolean DEFAULT false,
	"tagline" text,
	"primary_color" text DEFAULT '#6366f1',
	"data_policy_text" text,
	"form_fields" jsonb DEFAULT '[]'::jsonb,
	"quote_template" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "brands_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "comms_campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid,
	"subject" text NOT NULL,
	"sent_to" integer DEFAULT 0 NOT NULL,
	"failed" integer DEFAULT 0 NOT NULL,
	"sent_by" text,
	"sent_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"establishment_id" uuid,
	"tipo" text NOT NULL,
	"fecha" timestamp DEFAULT now() NOT NULL,
	"detalles" text,
	"monto" numeric(10, 2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_reminders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"tipo" text NOT NULL,
	"descripcion" text,
	"fecha_recordatorio" timestamp,
	"enviado" boolean DEFAULT false,
	"enviado_at" timestamp,
	"medio_envio" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"tag_key" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by_id" text
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"celular" text,
	"email" text,
	"document_id" text,
	"notes" text,
	"canal_contacto" text,
	"intereses" text[],
	"cumpleanos" date,
	"recordatorios_enviados" integer DEFAULT 0,
	"push_endpoint" text,
	"first_visit_at" timestamp DEFAULT now() NOT NULL,
	"last_visit_at" timestamp DEFAULT now() NOT NULL,
	"ultima_compra" timestamp,
	"total_visits" integer DEFAULT 1 NOT NULL,
	"establishment_ids" uuid[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "data_consents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid,
	"establishment_id" uuid,
	"brand_id" uuid,
	"customer_name" text NOT NULL,
	"customer_phone" text,
	"customer_email" text,
	"marketing_opt_in" boolean DEFAULT false NOT NULL,
	"data_processing_consent" boolean DEFAULT true NOT NULL,
	"consent_text" text NOT NULL,
	"ip_address" text,
	"consented_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "digital_downloads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid,
	"sale_id" uuid,
	"sale_item_id" uuid,
	"product_id" uuid,
	"token" text NOT NULL,
	"download_count" integer DEFAULT 0,
	"max_downloads" integer DEFAULT 3,
	"digital_url" text NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "digital_downloads_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "display_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"establishment_id" uuid NOT NULL,
	"bg_color" text DEFAULT '#1e1b4b',
	"accent_color" text DEFAULT '#6366f1',
	"show_waiting_list" boolean DEFAULT true,
	"show_promotions" boolean DEFAULT true,
	"show_clock" boolean DEFAULT true,
	"custom_message" text,
	"widgets" jsonb DEFAULT '[]'::jsonb,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "display_configs_establishment_id_unique" UNIQUE("establishment_id")
);
--> statement-breakpoint
CREATE TABLE "encargo_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"encargo_id" uuid NOT NULL,
	"source_type" text DEFAULT 'custom' NOT NULL,
	"source_id" uuid,
	"name" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price" numeric(12, 2) DEFAULT '0' NOT NULL,
	"notes" text,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "encargo_services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"price" numeric(12, 2) DEFAULT '0' NOT NULL,
	"duration_days" integer DEFAULT 3 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "encargos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"customer_id" uuid,
	"order_code" text NOT NULL,
	"service_id" uuid,
	"item_description" text NOT NULL,
	"item_color" text,
	"item_brand" text,
	"initial_notes" text,
	"photo_url" text,
	"status" text DEFAULT 'received' NOT NULL,
	"received_at" timestamp DEFAULT now() NOT NULL,
	"promised_date" date NOT NULL,
	"ready_at" timestamp,
	"delivered_at" timestamp,
	"price" numeric(12, 2) DEFAULT '0' NOT NULL,
	"paid" boolean DEFAULT false NOT NULL,
	"notify_whatsapp" boolean DEFAULT true NOT NULL,
	"notified_at" timestamp,
	"advisor_id" text,
	"customer_email" text,
	"sale_id" uuid,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "encargos_order_code_unique" UNIQUE("order_code")
);
--> statement-breakpoint
CREATE TABLE "establishments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"address" text,
	"active" boolean DEFAULT true NOT NULL,
	"features" jsonb DEFAULT '{"queue":true,"appointments":false,"surveys":false,"menu":false}' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "establishments_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "lead_forms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"name" text NOT NULL,
	"fields" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketplace_modules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"module_key" text NOT NULL,
	"label" text NOT NULL,
	"description" text,
	"icon" text,
	"color" text,
	"features" text[] DEFAULT '{}',
	"price_monthly" numeric(10, 2) DEFAULT '0',
	"price_per_user" boolean DEFAULT false,
	"price_per_user_amount" numeric(10, 2) DEFAULT '0',
	"trial_days" integer DEFAULT 7,
	"is_visible_to_brands" boolean DEFAULT false NOT NULL,
	"is_coming_soon" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"paypal_plan_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "marketplace_modules_module_key_unique" UNIQUE("module_key")
);
--> statement-breakpoint
CREATE TABLE "memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"plan" "plan" DEFAULT 'free' NOT NULL,
	"status" "membership_status" DEFAULT 'active' NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	"max_establishments" integer DEFAULT 1,
	"max_advisors" integer DEFAULT 3,
	"notes" text,
	"price_per_establishment" numeric(10, 2) DEFAULT '15.00',
	"price_per_additional_advisor" numeric(10, 2) DEFAULT '5.00',
	"wompi_payment_source_id" text,
	"wompi_customer_email" text,
	"billing_currency" "billing_currency" DEFAULT 'COP' NOT NULL,
	"billing_anchor_day" smallint DEFAULT 1,
	"next_billing_at" timestamp,
	"last_billed_at" timestamp,
	"last_billing_amount" bigint,
	"billing_status" "billing_status" DEFAULT 'none' NOT NULL,
	"past_due_since" timestamp,
	"past_due_attempts" smallint DEFAULT 0 NOT NULL,
	"past_due_last_attempt_at" timestamp,
	"paypal_subscription_id" text,
	"subscribed_amount" numeric(10, 2) DEFAULT '0',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "menu_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"menu_id" uuid NOT NULL,
	"name" text NOT NULL,
	"sort_order" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "menu_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"price" numeric(10, 2),
	"image_url" text,
	"available" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "menus" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"establishment_id" uuid NOT NULL,
	"name" text NOT NULL,
	"active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "module_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"module_key" text NOT NULL,
	"status" "module_subscription_status" DEFAULT 'trial' NOT NULL,
	"trial_started_at" timestamp DEFAULT now(),
	"trial_expires_at" timestamp,
	"activated_at" timestamp,
	"expires_at" timestamp,
	"price_monthly" numeric(10, 2),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pre_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"establishment_id" uuid NOT NULL,
	"customer_name" text NOT NULL,
	"customer_phone" text,
	"ticket_id" uuid,
	"items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"total" numeric(10, 2),
	"notes" text,
	"status" "pre_order_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"establishment_id" uuid,
	"name" text NOT NULL,
	"sku" text,
	"description" text,
	"category" text,
	"price" numeric(12, 2) DEFAULT '0' NOT NULL,
	"cost" numeric(12, 2) DEFAULT '0',
	"stock" integer DEFAULT 0 NOT NULL,
	"min_stock" integer DEFAULT 0 NOT NULL,
	"unit" text DEFAULT 'unidad' NOT NULL,
	"product_type" "product_type" DEFAULT 'product' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"digital_url" text,
	"download_limit" integer DEFAULT 3,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "promotions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"establishment_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"image_url" text,
	"active" boolean DEFAULT true NOT NULL,
	"starts_at" timestamp,
	"ends_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid,
	"user_id" text,
	"customer_id" uuid,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "push_subscriptions_endpoint_unique" UNIQUE("endpoint")
);
--> statement-breakpoint
CREATE TABLE "sale_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sale_id" uuid NOT NULL,
	"product_id" uuid,
	"product_name" text NOT NULL,
	"product_sku" text,
	"qty" numeric(10, 3) DEFAULT '1' NOT NULL,
	"unit_price" numeric(12, 2) NOT NULL,
	"discount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"line_total" numeric(12, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"establishment_id" uuid,
	"customer_id" uuid,
	"type" "sale_type" DEFAULT 'sale' NOT NULL,
	"status" "sale_status" DEFAULT 'completed' NOT NULL,
	"subtotal" numeric(12, 2) DEFAULT '0' NOT NULL,
	"discount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total" numeric(12, 2) DEFAULT '0' NOT NULL,
	"notes" text,
	"fulfillment_type" text,
	"sent_at" timestamp,
	"sent_to_email" text,
	"opened_at" timestamp,
	"source_quote_id" uuid,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "stock_movements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"brand_id" uuid NOT NULL,
	"type" "stock_movement_type" NOT NULL,
	"qty_change" integer NOT NULL,
	"qty_after" integer NOT NULL,
	"reference_id" uuid,
	"notes" text,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "survey_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid,
	"template_id" uuid,
	"establishment_id" uuid NOT NULL,
	"responses" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "survey_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"name" text NOT NULL,
	"questions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "system_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"establishment_id" uuid NOT NULL,
	"visit_reason_id" uuid,
	"queue_number" text NOT NULL,
	"customer_name" text NOT NULL,
	"customer_phone" text,
	"customer_email" text,
	"marketing_opt_in" boolean DEFAULT false NOT NULL,
	"push_subscription" jsonb,
	"status" "ticket_status" DEFAULT 'waiting' NOT NULL,
	"advisor_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"attended_at" timestamp,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"name" text NOT NULL,
	"image" text,
	"role" "user_role" DEFAULT 'brand_admin' NOT NULL,
	"brand_id" uuid,
	"establishment_id" uuid,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "visit_reasons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wa_default_templates" (
	"category" "wa_template_category" PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"body" text NOT NULL,
	"variables" text[] DEFAULT '{}' NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "wa_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"category" "wa_template_category" NOT NULL,
	"name" text NOT NULL,
	"body" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_endpoints" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"name" text DEFAULT 'Mi webhook' NOT NULL,
	"url" text NOT NULL,
	"secret" text NOT NULL,
	"events" text[],
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "advisor_fields" ADD CONSTRAINT "advisor_fields_establishment_id_establishments_id_fk" FOREIGN KEY ("establishment_id") REFERENCES "public"."establishments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment_settings" ADD CONSTRAINT "appointment_settings_establishment_id_establishments_id_fk" FOREIGN KEY ("establishment_id") REFERENCES "public"."establishments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_establishment_id_establishments_id_fk" FOREIGN KEY ("establishment_id") REFERENCES "public"."establishments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_visit_reason_id_visit_reasons_id_fk" FOREIGN KEY ("visit_reason_id") REFERENCES "public"."visit_reasons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_advisor_id_users_id_fk" FOREIGN KEY ("advisor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attentions" ADD CONSTRAINT "attentions_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attentions" ADD CONSTRAINT "attentions_advisor_id_users_id_fk" FOREIGN KEY ("advisor_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attentions" ADD CONSTRAINT "attentions_establishment_id_establishments_id_fk" FOREIGN KEY ("establishment_id") REFERENCES "public"."establishments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "availability_slots" ADD CONSTRAINT "availability_slots_establishment_id_establishments_id_fk" FOREIGN KEY ("establishment_id") REFERENCES "public"."establishments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_transactions" ADD CONSTRAINT "billing_transactions_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_transactions" ADD CONSTRAINT "billing_transactions_membership_id_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."memberships"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_alerts" ADD CONSTRAINT "brand_alerts_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comms_campaigns" ADD CONSTRAINT "comms_campaigns_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comms_campaigns" ADD CONSTRAINT "comms_campaigns_sent_by_users_id_fk" FOREIGN KEY ("sent_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_history" ADD CONSTRAINT "customer_history_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_history" ADD CONSTRAINT "customer_history_establishment_id_establishments_id_fk" FOREIGN KEY ("establishment_id") REFERENCES "public"."establishments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_reminders" ADD CONSTRAINT "customer_reminders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_tags" ADD CONSTRAINT "customer_tags_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_tags" ADD CONSTRAINT "customer_tags_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_consents" ADD CONSTRAINT "data_consents_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_consents" ADD CONSTRAINT "data_consents_establishment_id_establishments_id_fk" FOREIGN KEY ("establishment_id") REFERENCES "public"."establishments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_consents" ADD CONSTRAINT "data_consents_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "digital_downloads" ADD CONSTRAINT "digital_downloads_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "digital_downloads" ADD CONSTRAINT "digital_downloads_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "digital_downloads" ADD CONSTRAINT "digital_downloads_sale_item_id_sale_items_id_fk" FOREIGN KEY ("sale_item_id") REFERENCES "public"."sale_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "digital_downloads" ADD CONSTRAINT "digital_downloads_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "display_configs" ADD CONSTRAINT "display_configs_establishment_id_establishments_id_fk" FOREIGN KEY ("establishment_id") REFERENCES "public"."establishments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "encargo_items" ADD CONSTRAINT "encargo_items_encargo_id_encargos_id_fk" FOREIGN KEY ("encargo_id") REFERENCES "public"."encargos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "encargo_services" ADD CONSTRAINT "encargo_services_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "encargos" ADD CONSTRAINT "encargos_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "encargos" ADD CONSTRAINT "encargos_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "encargos" ADD CONSTRAINT "encargos_service_id_encargo_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."encargo_services"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "encargos" ADD CONSTRAINT "encargos_advisor_id_users_id_fk" FOREIGN KEY ("advisor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "encargos" ADD CONSTRAINT "encargos_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "establishments" ADD CONSTRAINT "establishments_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_forms" ADD CONSTRAINT "lead_forms_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_categories" ADD CONSTRAINT "menu_categories_menu_id_menus_id_fk" FOREIGN KEY ("menu_id") REFERENCES "public"."menus"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_category_id_menu_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."menu_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menus" ADD CONSTRAINT "menus_establishment_id_establishments_id_fk" FOREIGN KEY ("establishment_id") REFERENCES "public"."establishments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "module_subscriptions" ADD CONSTRAINT "module_subscriptions_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pre_orders" ADD CONSTRAINT "pre_orders_establishment_id_establishments_id_fk" FOREIGN KEY ("establishment_id") REFERENCES "public"."establishments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pre_orders" ADD CONSTRAINT "pre_orders_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_establishment_id_establishments_id_fk" FOREIGN KEY ("establishment_id") REFERENCES "public"."establishments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_establishment_id_establishments_id_fk" FOREIGN KEY ("establishment_id") REFERENCES "public"."establishments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_establishment_id_establishments_id_fk" FOREIGN KEY ("establishment_id") REFERENCES "public"."establishments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_template_id_survey_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."survey_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_establishment_id_establishments_id_fk" FOREIGN KEY ("establishment_id") REFERENCES "public"."establishments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_templates" ADD CONSTRAINT "survey_templates_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_establishment_id_establishments_id_fk" FOREIGN KEY ("establishment_id") REFERENCES "public"."establishments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_visit_reason_id_visit_reasons_id_fk" FOREIGN KEY ("visit_reason_id") REFERENCES "public"."visit_reasons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_advisor_id_users_id_fk" FOREIGN KEY ("advisor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visit_reasons" ADD CONSTRAINT "visit_reasons_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wa_templates" ADD CONSTRAINT "wa_templates_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_endpoints" ADD CONSTRAINT "webhook_endpoints_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "app_translations_lang_key_idx" ON "app_translations" USING btree ("lang","key");--> statement-breakpoint
CREATE INDEX "billing_txn_brand_idx" ON "billing_transactions" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "billing_txn_status_idx" ON "billing_transactions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "billing_txn_created_idx" ON "billing_transactions" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "brand_alerts_brand_type_idx" ON "brand_alerts" USING btree ("brand_id","alert_type");--> statement-breakpoint
CREATE INDEX "brand_alerts_unresolved_idx" ON "brand_alerts" USING btree ("brand_id","resolved");--> statement-breakpoint
CREATE INDEX "customer_history_customer_idx" ON "customer_history" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "customer_history_fecha_idx" ON "customer_history" USING btree ("fecha");--> statement-breakpoint
CREATE INDEX "customer_reminders_fecha_idx" ON "customer_reminders" USING btree ("fecha_recordatorio");--> statement-breakpoint
CREATE INDEX "customer_reminders_enviado_idx" ON "customer_reminders" USING btree ("enviado");--> statement-breakpoint
CREATE UNIQUE INDEX "customer_tags_customer_tag_idx" ON "customer_tags" USING btree ("customer_id","tag_key");--> statement-breakpoint
CREATE INDEX "customer_tags_key_idx" ON "customer_tags" USING btree ("tag_key");--> statement-breakpoint
CREATE UNIQUE INDEX "customers_brand_phone_idx" ON "customers" USING btree ("brand_id","phone");--> statement-breakpoint
CREATE UNIQUE INDEX "customers_brand_document_idx" ON "customers" USING btree ("brand_id","document_id");--> statement-breakpoint
CREATE INDEX "customers_cumpleanos_idx" ON "customers" USING btree ("cumpleanos");--> statement-breakpoint
CREATE INDEX "digital_downloads_token_idx" ON "digital_downloads" USING btree ("token");--> statement-breakpoint
CREATE INDEX "digital_downloads_sale_idx" ON "digital_downloads" USING btree ("sale_id");--> statement-breakpoint
CREATE INDEX "encargo_items_encargo_idx" ON "encargo_items" USING btree ("encargo_id");--> statement-breakpoint
CREATE INDEX "encargo_services_brand_idx" ON "encargo_services" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "encargos_brand_idx" ON "encargos" USING btree ("brand_id","received_at");--> statement-breakpoint
CREATE INDEX "encargos_customer_idx" ON "encargos" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "encargos_status_idx" ON "encargos" USING btree ("brand_id","status");--> statement-breakpoint
CREATE INDEX "lead_forms_brand_idx" ON "lead_forms" USING btree ("brand_id");--> statement-breakpoint
CREATE UNIQUE INDEX "module_subscriptions_brand_module_idx" ON "module_subscriptions" USING btree ("brand_id","module_key");--> statement-breakpoint
CREATE INDEX "products_brand_idx" ON "products" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "products_sku_idx" ON "products" USING btree ("brand_id","sku");--> statement-breakpoint
CREATE INDEX "sale_items_sale_idx" ON "sale_items" USING btree ("sale_id");--> statement-breakpoint
CREATE INDEX "sale_items_product_idx" ON "sale_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "sales_brand_idx" ON "sales" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "sales_customer_idx" ON "sales" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "sales_type_brand_idx" ON "sales" USING btree ("type","brand_id");--> statement-breakpoint
CREATE INDEX "sales_created_at_idx" ON "sales" USING btree ("brand_id","created_at");--> statement-breakpoint
CREATE INDEX "stock_movements_product_idx" ON "stock_movements" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "tickets_establishment_status_idx" ON "tickets" USING btree ("establishment_id","status");--> statement-breakpoint
CREATE INDEX "tickets_created_at_idx" ON "tickets" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "wa_templates_brand_category_idx" ON "wa_templates" USING btree ("brand_id","category");