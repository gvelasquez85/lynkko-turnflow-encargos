CREATE TABLE "accounting_periods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"closed_at" timestamp,
	"closed_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "accounting_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"auto_entries_on_sale" boolean DEFAULT false NOT NULL,
	"auto_entries_on_invoice" boolean DEFAULT false NOT NULL,
	"default_sales_account" text DEFAULT '4135',
	"default_cost_account" text DEFAULT '6135',
	"default_cash_account" text DEFAULT '1105',
	"default_bank_account" text DEFAULT '1110',
	"default_ar_account" text DEFAULT '1305',
	"default_tax_account" text DEFAULT '2408',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "accounting_settings_brand_id_unique" UNIQUE("brand_id")
);
--> statement-breakpoint
CREATE TABLE "accounting_tax_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"tax_type" text NOT NULL,
	"rate" numeric(5, 2) NOT NULL,
	"debit_account_code" text NOT NULL,
	"credit_account_code" text NOT NULL,
	"applies_to" text DEFAULT 'all',
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_configs" (
	"brand_id" uuid PRIMARY KEY NOT NULL,
	"provider" text DEFAULT 'turnflow' NOT NULL,
	"api_key_encrypted" text,
	"model_preference" text DEFAULT 'claude-haiku-3-5' NOT NULL,
	"daily_limit" integer DEFAULT 5 NOT NULL,
	"plan" text DEFAULT 'free' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_usage" (
	"brand_id" uuid NOT NULL,
	"usage_date" date NOT NULL,
	"query_count" integer DEFAULT 0 NOT NULL,
	"token_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "amenity_bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"space_id" uuid NOT NULL,
	"unit_id" uuid,
	"resident_name" text NOT NULL,
	"date" date NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"guests" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "booking_widget_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"primary_color" text DEFAULT '#6366f1',
	"logo_url" text,
	"welcome_message" text,
	"require_deposit" boolean DEFAULT false NOT NULL,
	"deposit_pct" numeric(5, 2) DEFAULT '30' NOT NULL,
	"payment_gateway" text,
	"gateway_public_key" text,
	"min_nights" integer DEFAULT 1 NOT NULL,
	"max_advance_days" integer DEFAULT 365 NOT NULL,
	"cancellation_policy" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "booking_widget_config_brand_id_unique" UNIQUE("brand_id")
);
--> statement-breakpoint
CREATE TABLE "clinical_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"appointment_id" uuid,
	"doctor_id" text,
	"date" date NOT NULL,
	"reason" text,
	"symptoms" text,
	"weight_kg" numeric(5, 2),
	"height_cm" numeric(5, 1),
	"blood_pressure" text,
	"temperature_c" numeric(4, 1),
	"heart_rate" integer,
	"oxygen_sat" integer,
	"diagnosis" text,
	"treatment_plan" text,
	"notes" text,
	"follow_up_date" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "copropiedad_attendees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meeting_id" uuid NOT NULL,
	"brand_id" uuid NOT NULL,
	"unit_id" uuid NOT NULL,
	"attendee_name" text NOT NULL,
	"attendee_type" text DEFAULT 'owner',
	"delegate_name" text,
	"delegate_id_number" text,
	"power_of_attorney" boolean DEFAULT false,
	"coeficiente" numeric(8, 6) NOT NULL,
	"registered_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "copropiedad_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"copropiedad_name" text,
	"nit" text,
	"address" text,
	"city" text,
	"total_units" integer DEFAULT 0,
	"total_coef" numeric(10, 6) DEFAULT '100',
	"current_period" text,
	"fee_due_day" integer DEFAULT 10,
	"late_fee_percent" numeric(5, 2) DEFAULT '1.5',
	"quorum_percent" numeric(5, 2) DEFAULT '51.0',
	"admin_name" text,
	"admin_email" text,
	"admin_phone" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "copropiedad_configs_brand_id_unique" UNIQUE("brand_id")
);
--> statement-breakpoint
CREATE TABLE "copropiedad_fees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"unit_id" uuid NOT NULL,
	"period" text NOT NULL,
	"base_amount" numeric(12, 2) NOT NULL,
	"extra_charges" numeric(12, 2) DEFAULT '0',
	"late_fee" numeric(12, 2) DEFAULT '0',
	"total_amount" numeric(12, 2) NOT NULL,
	"status" text DEFAULT 'pending',
	"paid_amount" numeric(12, 2) DEFAULT '0',
	"paid_at" timestamp,
	"payment_method" text,
	"payment_reference" text,
	"due_date" date NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "copropiedad_meetings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"meeting_type" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"scheduled_date" date NOT NULL,
	"scheduled_time" time NOT NULL,
	"location" text,
	"quorum_required" numeric(5, 2) DEFAULT '51.0' NOT NULL,
	"quorum_present" numeric(8, 6) DEFAULT '0',
	"quorum_reached" boolean DEFAULT false,
	"quorum_reached_at" timestamp,
	"status" text DEFAULT 'scheduled',
	"started_at" timestamp,
	"ended_at" timestamp,
	"agenda" jsonb DEFAULT '[]'::jsonb,
	"created_by" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "copropiedad_minutes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meeting_id" uuid NOT NULL,
	"brand_id" uuid NOT NULL,
	"minute_number" text,
	"content" text NOT NULL,
	"status" text DEFAULT 'draft',
	"approved_at" timestamp,
	"approved_by" text,
	"president_name" text,
	"secretary_name" text,
	"created_by" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "copropiedad_reservations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"space_id" uuid NOT NULL,
	"unit_id" uuid,
	"reservation_date" date NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"guest_count" integer DEFAULT 1,
	"purpose" text,
	"status" text DEFAULT 'pending',
	"approved_by" text,
	"approved_at" timestamp,
	"rejection_reason" text,
	"fee_paid" boolean DEFAULT false,
	"deposit_paid" boolean DEFAULT false,
	"deposit_returned" boolean DEFAULT false,
	"contact_name" text,
	"contact_phone" text,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"created_by" text
);
--> statement-breakpoint
CREATE TABLE "copropiedad_spaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"capacity" integer,
	"requires_reservation" boolean DEFAULT true,
	"max_hours_per_booking" integer DEFAULT 4,
	"advance_days_min" integer DEFAULT 1,
	"advance_days_max" integer DEFAULT 30,
	"available_from" time DEFAULT '06:00',
	"available_to" time DEFAULT '22:00',
	"available_days" integer[] DEFAULT '{0,1,2,3,4,5,6}',
	"reservation_fee" numeric(12, 2) DEFAULT '0',
	"deposit_amount" numeric(12, 2) DEFAULT '0',
	"is_active" boolean DEFAULT true,
	"image_url" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "copropiedad_units" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"unit_number" text NOT NULL,
	"unit_type" text DEFAULT 'apartamento',
	"tower" text,
	"floor" integer,
	"area_m2" numeric(10, 2),
	"coeficiente" numeric(8, 6) DEFAULT '0' NOT NULL,
	"owner_name" text,
	"owner_email" text,
	"owner_phone" text,
	"owner_id_type" text DEFAULT 'CC',
	"owner_id_number" text,
	"tenant_name" text,
	"tenant_email" text,
	"tenant_phone" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "copropiedad_vote_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vote_id" uuid NOT NULL,
	"attendee_id" uuid NOT NULL,
	"brand_id" uuid NOT NULL,
	"unit_id" uuid NOT NULL,
	"vote" text NOT NULL,
	"coeficiente" numeric(8, 6) NOT NULL,
	"voted_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "copropiedad_votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meeting_id" uuid NOT NULL,
	"brand_id" uuid NOT NULL,
	"topic_number" integer NOT NULL,
	"topic_title" text NOT NULL,
	"topic_description" text,
	"vote_type" text DEFAULT 'simple_majority',
	"required_percent" numeric(5, 2) DEFAULT '51.0',
	"status" text DEFAULT 'pending',
	"opened_at" timestamp,
	"closed_at" timestamp,
	"votes_favor" numeric(8, 6) DEFAULT '0',
	"votes_against" numeric(8, 6) DEFAULT '0',
	"votes_abstain" numeric(8, 6) DEFAULT '0',
	"total_voters" integer DEFAULT 0,
	"result" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "cost_centers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_fiscal_data" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"brand_id" uuid NOT NULL,
	"document_type_code" text DEFAULT '13' NOT NULL,
	"document_number" text NOT NULL,
	"dv" integer,
	"tipo_persona" text DEFAULT 'natural' NOT NULL,
	"razon_social" text,
	"regimen_fiscal" text,
	"tax_responsibilities" text[] DEFAULT '{}',
	"department_code" text,
	"municipality_code" text,
	"direccion" text,
	"fiscal_email" text,
	"fiscal_phone" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deliverables" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"due_date" date,
	"status" text DEFAULT 'pending' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dian_transmissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"brand_id" uuid NOT NULL,
	"attempt" integer DEFAULT 1 NOT NULL,
	"endpoint" text,
	"request_body" text,
	"response_code" integer,
	"response_body" text,
	"success" boolean DEFAULT false NOT NULL,
	"error_message" text,
	"transmitted_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dropship_order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"product_id" uuid,
	"product_name" text NOT NULL,
	"supplier_id" uuid,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_cost" numeric(12, 2) DEFAULT '0' NOT NULL,
	"unit_sell" numeric(12, 2) DEFAULT '0' NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "dropship_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"customer_id" uuid,
	"order_code" text NOT NULL,
	"customer_name" text NOT NULL,
	"customer_phone" text,
	"customer_email" text,
	"shipping_address" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"total_cost" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total_sell" numeric(12, 2) DEFAULT '0' NOT NULL,
	"tracking_number" text,
	"carrier" text,
	"notes" text,
	"confirmed_at" timestamp,
	"shipped_at" timestamp,
	"delivered_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "dropship_orders_order_code_unique" UNIQUE("order_code")
);
--> statement-breakpoint
CREATE TABLE "dropship_product_info" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"supplier_id" uuid,
	"supplier_sku" text,
	"cost_price" numeric(12, 2) DEFAULT '0' NOT NULL,
	"sell_price" numeric(12, 2) DEFAULT '0' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "dropship_product_info_product_id_unique" UNIQUE("product_id")
);
--> statement-breakpoint
CREATE TABLE "dropship_suppliers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"name" text NOT NULL,
	"contact_name" text,
	"email" text,
	"phone" text,
	"country" text,
	"website" text,
	"payment_terms" text,
	"lead_days" integer DEFAULT 7 NOT NULL,
	"notes" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "electronic_document_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"line_number" integer NOT NULL,
	"product_id" uuid,
	"description" text NOT NULL,
	"quantity" numeric(12, 6) NOT NULL,
	"unit_code" text DEFAULT '94',
	"unit_price" numeric(15, 2) NOT NULL,
	"discount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"line_total" numeric(15, 2) NOT NULL,
	"tax_code" text,
	"tax_percent" numeric(5, 2) DEFAULT '0',
	"tax_amount" numeric(15, 2) DEFAULT '0'
);
--> statement-breakpoint
CREATE TABLE "electronic_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"document_type" text NOT NULL,
	"resolution_id" uuid,
	"prefix" text DEFAULT '' NOT NULL,
	"number" bigint NOT NULL,
	"full_number" text,
	"issue_date" date NOT NULL,
	"issue_time" time NOT NULL,
	"due_date" date,
	"customer_id" uuid,
	"customer_fiscal_id" uuid,
	"customer_document_type" text NOT NULL,
	"customer_document_number" text NOT NULL,
	"customer_name" text NOT NULL,
	"customer_email" text,
	"subtotal" numeric(15, 2) NOT NULL,
	"total_discount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"total_tax" numeric(15, 2) DEFAULT '0' NOT NULL,
	"total_withholdings" numeric(15, 2) DEFAULT '0' NOT NULL,
	"total" numeric(15, 2) NOT NULL,
	"currency" text DEFAULT 'COP' NOT NULL,
	"exchange_rate" numeric(10, 4) DEFAULT '1.0000',
	"payment_method_code" text,
	"payment_means_code" text,
	"payment_due_date" date,
	"referenced_document_id" uuid,
	"correction_concept_code" text,
	"correction_reason" text,
	"cufe" text,
	"qr_data" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"dian_track_id" text,
	"dian_response_code" text,
	"dian_response_message" text,
	"dian_validated_at" timestamp,
	"xml_unsigned_path" text,
	"xml_signed_path" text,
	"pdf_path" text,
	"sale_id" uuid,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
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
CREATE TABLE "fiscal_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"nit" text NOT NULL,
	"dv" integer NOT NULL,
	"razon_social" text NOT NULL,
	"nombre_comercial" text,
	"tipo_persona" text NOT NULL,
	"regimen_fiscal" text NOT NULL,
	"tax_responsibilities" text[] DEFAULT '{}' NOT NULL,
	"ciiu_code" text NOT NULL,
	"department_code" text NOT NULL,
	"municipality_code" text NOT NULL,
	"direccion" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"software_id" text,
	"software_pin" text,
	"test_set_id" text,
	"certificate_storage_path" text,
	"certificate_password_encrypted" text,
	"certificate_expires_at" timestamp,
	"certificate_issuer" text,
	"environment" text DEFAULT 'habilitacion' NOT NULL,
	"habilitacion_status" text DEFAULT 'pending',
	"habilitacion_approved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "fiscal_configs_brand_id_unique" UNIQUE("brand_id")
);
--> statement-breakpoint
CREATE TABLE "hotel_reservations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"room_id" uuid NOT NULL,
	"customer_id" uuid,
	"guest_name" text NOT NULL,
	"guest_email" text,
	"guest_phone" text,
	"guest_document" text,
	"check_in" date NOT NULL,
	"check_out" date NOT NULL,
	"guests" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'confirmed' NOT NULL,
	"payment_method" text DEFAULT 'local',
	"payment_status" text DEFAULT 'pending' NOT NULL,
	"total_nights" integer,
	"rate_per_night" numeric(12, 2) DEFAULT '0' NOT NULL,
	"subtotal" numeric(14, 2) DEFAULT '0' NOT NULL,
	"tax_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total" numeric(14, 2) DEFAULT '0' NOT NULL,
	"deposit" numeric(12, 2) DEFAULT '0' NOT NULL,
	"guest_token" text,
	"special_requests" text,
	"notes" text,
	"source" text DEFAULT 'direct',
	"checked_in_at" timestamp,
	"checked_out_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "hotel_reservations_guest_token_unique" UNIQUE("guest_token")
);
--> statement-breakpoint
CREATE TABLE "invoice_resolutions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"resolution_number" text NOT NULL,
	"resolution_date" date NOT NULL,
	"prefix" text DEFAULT '' NOT NULL,
	"range_from" bigint NOT NULL,
	"range_to" bigint NOT NULL,
	"current_number" bigint NOT NULL,
	"technical_key" text NOT NULL,
	"valid_from" date NOT NULL,
	"valid_to" date NOT NULL,
	"document_type" text DEFAULT 'invoice' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"exhausted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "journal_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"period_id" uuid NOT NULL,
	"entry_date" date NOT NULL,
	"description" text NOT NULL,
	"source_type" text,
	"source_id" uuid,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_by" text,
	"posted_at" timestamp,
	"voided_at" timestamp,
	"voided_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "journal_entry_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"journal_entry_id" uuid NOT NULL,
	"brand_id" uuid NOT NULL,
	"account_code" text NOT NULL,
	"debit" numeric(15, 2) DEFAULT '0' NOT NULL,
	"credit" numeric(15, 2) DEFAULT '0' NOT NULL,
	"description" text,
	"cost_center_id" uuid,
	"third_party_nit" text,
	"third_party_name" text
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
CREATE TABLE "pqrs_attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid NOT NULL,
	"brand_id" uuid NOT NULL,
	"file_name" text NOT NULL,
	"file_url" text NOT NULL,
	"file_size" integer,
	"file_type" text,
	"uploaded_by" text,
	"is_internal" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pqrs_cases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"radicado" text NOT NULL,
	"requester_name" text NOT NULL,
	"requester_email" text,
	"requester_phone" text,
	"requester_id_type" text DEFAULT 'CC',
	"requester_id_number" text,
	"category" text NOT NULL,
	"subject" text NOT NULL,
	"description" text NOT NULL,
	"priority" text DEFAULT 'normal',
	"status" text DEFAULT 'open',
	"assigned_to" text,
	"assigned_at" timestamp,
	"sla_due_date" date,
	"sla_breached" boolean DEFAULT false,
	"resolution_summary" text,
	"resolved_at" timestamp,
	"closed_at" timestamp,
	"source" text DEFAULT 'public_form',
	"source_sale_id" uuid,
	"customer_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pqrs_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"form_title" text DEFAULT 'Radicar PQRS',
	"form_description" text,
	"form_slug" text,
	"form_enabled" boolean DEFAULT true,
	"categories" text[] DEFAULT '{"Petición","Queja","Reclamo","Sugerencia","Felicitación"}',
	"sla_peticion_days" integer DEFAULT 15,
	"sla_queja_days" integer DEFAULT 15,
	"sla_reclamo_days" integer DEFAULT 15,
	"sla_sugerencia_days" integer DEFAULT 30,
	"notify_email" text,
	"auto_reply_enabled" boolean DEFAULT true,
	"auto_reply_subject" text,
	"auto_reply_body" text,
	"logo_url" text,
	"primary_color" text DEFAULT '#059669',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pqrs_configs_brand_id_unique" UNIQUE("brand_id"),
	CONSTRAINT "pqrs_configs_form_slug_unique" UNIQUE("form_slug")
);
--> statement-breakpoint
CREATE TABLE "pqrs_counters" (
	"brand_id" uuid PRIMARY KEY NOT NULL,
	"last_number" integer DEFAULT 0,
	"prefix" text DEFAULT 'PQRS'
);
--> statement-breakpoint
CREATE TABLE "pqrs_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid NOT NULL,
	"brand_id" uuid NOT NULL,
	"author_id" text,
	"author_name" text,
	"content" text NOT NULL,
	"is_internal" boolean DEFAULT false,
	"notify_requester" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pqrs_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid NOT NULL,
	"brand_id" uuid NOT NULL,
	"old_status" text,
	"new_status" text NOT NULL,
	"changed_by" text,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prescriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"clinical_record_id" uuid,
	"doctor_id" text,
	"date" date NOT NULL,
	"diagnosis" text,
	"items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "price_list_items" (
	"price_list_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"price" numeric(12, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "price_lists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"customer_id" uuid,
	"name" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'active' NOT NULL,
	"start_date" date,
	"due_date" date,
	"budget" numeric(14, 2),
	"hourly_rate" numeric(10, 2),
	"lead_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proposals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"customer_id" uuid,
	"title" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"valid_until" date,
	"subtotal" numeric(14, 2) DEFAULT '0' NOT NULL,
	"discount_pct" numeric(5, 2) DEFAULT '0' NOT NULL,
	"tax_pct" numeric(5, 2) DEFAULT '0' NOT NULL,
	"total" numeric(14, 2) DEFAULT '0' NOT NULL,
	"items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"notes" text,
	"sent_at" timestamp,
	"viewed_at" timestamp,
	"accepted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "puc_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"code" text NOT NULL,
	"parent_code" text,
	"name" text NOT NULL,
	"class" integer NOT NULL,
	"nature" text NOT NULL,
	"level" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"allows_movement" boolean DEFAULT true NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resident_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"unit_id" uuid NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "resident_tokens_unit_id_unique" UNIQUE("unit_id"),
	CONSTRAINT "resident_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "restaurant_tables" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"zone_id" uuid,
	"name" text NOT NULL,
	"capacity" integer DEFAULT 2 NOT NULL,
	"status" text DEFAULT 'available' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "restaurant_zones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"name" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "room_consumptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"reservation_id" uuid NOT NULL,
	"description" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total" numeric(12, 2) DEFAULT '0' NOT NULL,
	"category" text,
	"recorded_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "room_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"capacity" integer DEFAULT 2 NOT NULL,
	"price_night" numeric(12, 2) DEFAULT '0' NOT NULL,
	"amenities" text[],
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"room_type_id" uuid,
	"number" text NOT NULL,
	"floor" text,
	"status" text DEFAULT 'available' NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" text,
	"duration_minutes" integer DEFAULT 30 NOT NULL,
	"price" numeric(12, 2) DEFAULT '0' NOT NULL,
	"color" text DEFAULT '#6366f1',
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"advisor_id" text NOT NULL,
	"day_of_week" integer NOT NULL,
	"open_time" time DEFAULT '08:00' NOT NULL,
	"close_time" time DEFAULT '18:00' NOT NULL,
	"is_available" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff_services" (
	"advisor_id" text NOT NULL,
	"service_id" uuid NOT NULL,
	"price_override" numeric(12, 2)
);
--> statement-breakpoint
CREATE TABLE "table_order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"menu_item_id" uuid,
	"name" text NOT NULL,
	"price" numeric(12, 2) DEFAULT '0' NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"notes" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"sent_at" timestamp DEFAULT now() NOT NULL,
	"ready_at" timestamp,
	"served_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "table_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"table_id" uuid NOT NULL,
	"waiter_id" text,
	"status" text DEFAULT 'open' NOT NULL,
	"guests" integer DEFAULT 1 NOT NULL,
	"notes" text,
	"opened_at" timestamp DEFAULT now() NOT NULL,
	"closed_at" timestamp,
	"total" numeric(12, 2)
);
--> statement-breakpoint
CREATE TABLE "time_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"advisor_id" text,
	"date" date NOT NULL,
	"hours" numeric(5, 2) NOT NULL,
	"description" text,
	"billable" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "treatment_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"appointment_id" uuid,
	"advisor_id" text,
	"service_id" uuid,
	"service_name" text NOT NULL,
	"notes" text,
	"date" date NOT NULL,
	"price" numeric(12, 2),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vet_patients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"name" text NOT NULL,
	"species" text,
	"breed" text,
	"sex" text,
	"birth_date" date,
	"color" text,
	"chip_number" text,
	"is_sterilized" boolean DEFAULT false,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vet_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"vet_patient_id" uuid NOT NULL,
	"appointment_id" uuid,
	"doctor_id" text,
	"date" date NOT NULL,
	"reason" text,
	"weight_kg" numeric(5, 2),
	"temperature_c" numeric(4, 1),
	"diagnosis" text,
	"treatment" text,
	"vaccines" text[],
	"deworming" text,
	"next_visit_date" date,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "visitor_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"unit_id" uuid,
	"visitor_name" text NOT NULL,
	"document_id" text,
	"vehicle_plate" text,
	"purpose" text,
	"entered_at" timestamp DEFAULT now() NOT NULL,
	"exited_at" timestamp,
	"authorized_by" text,
	"notes" text
);
--> statement-breakpoint
ALTER TABLE "brands" ADD COLUMN "primary_color" text DEFAULT '#6366f1';--> statement-breakpoint
ALTER TABLE "brands" ADD COLUMN "data_policy_text" text;--> statement-breakpoint
ALTER TABLE "brands" ADD COLUMN "form_fields" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "accounting_periods" ADD CONSTRAINT "accounting_periods_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounting_periods" ADD CONSTRAINT "accounting_periods_closed_by_users_id_fk" FOREIGN KEY ("closed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounting_settings" ADD CONSTRAINT "accounting_settings_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounting_tax_configs" ADD CONSTRAINT "accounting_tax_configs_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_configs" ADD CONSTRAINT "ai_configs_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_usage" ADD CONSTRAINT "ai_usage_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "amenity_bookings" ADD CONSTRAINT "amenity_bookings_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "amenity_bookings" ADD CONSTRAINT "amenity_bookings_space_id_copropiedad_spaces_id_fk" FOREIGN KEY ("space_id") REFERENCES "public"."copropiedad_spaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "amenity_bookings" ADD CONSTRAINT "amenity_bookings_unit_id_copropiedad_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."copropiedad_units"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_widget_config" ADD CONSTRAINT "booking_widget_config_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical_records" ADD CONSTRAINT "clinical_records_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical_records" ADD CONSTRAINT "clinical_records_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical_records" ADD CONSTRAINT "clinical_records_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical_records" ADD CONSTRAINT "clinical_records_doctor_id_users_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copropiedad_attendees" ADD CONSTRAINT "copropiedad_attendees_meeting_id_copropiedad_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."copropiedad_meetings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copropiedad_attendees" ADD CONSTRAINT "copropiedad_attendees_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copropiedad_attendees" ADD CONSTRAINT "copropiedad_attendees_unit_id_copropiedad_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."copropiedad_units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copropiedad_configs" ADD CONSTRAINT "copropiedad_configs_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copropiedad_fees" ADD CONSTRAINT "copropiedad_fees_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copropiedad_fees" ADD CONSTRAINT "copropiedad_fees_unit_id_copropiedad_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."copropiedad_units"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copropiedad_meetings" ADD CONSTRAINT "copropiedad_meetings_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copropiedad_meetings" ADD CONSTRAINT "copropiedad_meetings_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copropiedad_minutes" ADD CONSTRAINT "copropiedad_minutes_meeting_id_copropiedad_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."copropiedad_meetings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copropiedad_minutes" ADD CONSTRAINT "copropiedad_minutes_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copropiedad_minutes" ADD CONSTRAINT "copropiedad_minutes_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copropiedad_minutes" ADD CONSTRAINT "copropiedad_minutes_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copropiedad_reservations" ADD CONSTRAINT "copropiedad_reservations_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copropiedad_reservations" ADD CONSTRAINT "copropiedad_reservations_space_id_copropiedad_spaces_id_fk" FOREIGN KEY ("space_id") REFERENCES "public"."copropiedad_spaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copropiedad_reservations" ADD CONSTRAINT "copropiedad_reservations_unit_id_copropiedad_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."copropiedad_units"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copropiedad_reservations" ADD CONSTRAINT "copropiedad_reservations_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copropiedad_reservations" ADD CONSTRAINT "copropiedad_reservations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copropiedad_spaces" ADD CONSTRAINT "copropiedad_spaces_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copropiedad_units" ADD CONSTRAINT "copropiedad_units_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copropiedad_vote_records" ADD CONSTRAINT "copropiedad_vote_records_vote_id_copropiedad_votes_id_fk" FOREIGN KEY ("vote_id") REFERENCES "public"."copropiedad_votes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copropiedad_vote_records" ADD CONSTRAINT "copropiedad_vote_records_attendee_id_copropiedad_attendees_id_fk" FOREIGN KEY ("attendee_id") REFERENCES "public"."copropiedad_attendees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copropiedad_vote_records" ADD CONSTRAINT "copropiedad_vote_records_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copropiedad_vote_records" ADD CONSTRAINT "copropiedad_vote_records_unit_id_copropiedad_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."copropiedad_units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copropiedad_votes" ADD CONSTRAINT "copropiedad_votes_meeting_id_copropiedad_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."copropiedad_meetings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copropiedad_votes" ADD CONSTRAINT "copropiedad_votes_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cost_centers" ADD CONSTRAINT "cost_centers_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_fiscal_data" ADD CONSTRAINT "customer_fiscal_data_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_fiscal_data" ADD CONSTRAINT "customer_fiscal_data_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliverables" ADD CONSTRAINT "deliverables_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dian_transmissions" ADD CONSTRAINT "dian_transmissions_document_id_electronic_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."electronic_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dian_transmissions" ADD CONSTRAINT "dian_transmissions_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dropship_order_items" ADD CONSTRAINT "dropship_order_items_order_id_dropship_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."dropship_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dropship_order_items" ADD CONSTRAINT "dropship_order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dropship_order_items" ADD CONSTRAINT "dropship_order_items_supplier_id_dropship_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."dropship_suppliers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dropship_orders" ADD CONSTRAINT "dropship_orders_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dropship_orders" ADD CONSTRAINT "dropship_orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dropship_product_info" ADD CONSTRAINT "dropship_product_info_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dropship_product_info" ADD CONSTRAINT "dropship_product_info_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dropship_product_info" ADD CONSTRAINT "dropship_product_info_supplier_id_dropship_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."dropship_suppliers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dropship_suppliers" ADD CONSTRAINT "dropship_suppliers_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "electronic_document_items" ADD CONSTRAINT "electronic_document_items_document_id_electronic_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."electronic_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "electronic_document_items" ADD CONSTRAINT "electronic_document_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "electronic_documents" ADD CONSTRAINT "electronic_documents_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "electronic_documents" ADD CONSTRAINT "electronic_documents_resolution_id_invoice_resolutions_id_fk" FOREIGN KEY ("resolution_id") REFERENCES "public"."invoice_resolutions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "electronic_documents" ADD CONSTRAINT "electronic_documents_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "electronic_documents" ADD CONSTRAINT "electronic_documents_customer_fiscal_id_customer_fiscal_data_id_fk" FOREIGN KEY ("customer_fiscal_id") REFERENCES "public"."customer_fiscal_data"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "electronic_documents" ADD CONSTRAINT "electronic_documents_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "electronic_documents" ADD CONSTRAINT "electronic_documents_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "encargo_items" ADD CONSTRAINT "encargo_items_encargo_id_encargos_id_fk" FOREIGN KEY ("encargo_id") REFERENCES "public"."encargos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "encargo_services" ADD CONSTRAINT "encargo_services_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "encargos" ADD CONSTRAINT "encargos_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "encargos" ADD CONSTRAINT "encargos_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "encargos" ADD CONSTRAINT "encargos_service_id_encargo_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."encargo_services"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "encargos" ADD CONSTRAINT "encargos_advisor_id_users_id_fk" FOREIGN KEY ("advisor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "encargos" ADD CONSTRAINT "encargos_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fiscal_configs" ADD CONSTRAINT "fiscal_configs_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hotel_reservations" ADD CONSTRAINT "hotel_reservations_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hotel_reservations" ADD CONSTRAINT "hotel_reservations_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hotel_reservations" ADD CONSTRAINT "hotel_reservations_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_resolutions" ADD CONSTRAINT "invoice_resolutions_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_period_id_accounting_periods_id_fk" FOREIGN KEY ("period_id") REFERENCES "public"."accounting_periods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entry_lines" ADD CONSTRAINT "journal_entry_lines_journal_entry_id_journal_entries_id_fk" FOREIGN KEY ("journal_entry_id") REFERENCES "public"."journal_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entry_lines" ADD CONSTRAINT "journal_entry_lines_cost_center_id_cost_centers_id_fk" FOREIGN KEY ("cost_center_id") REFERENCES "public"."cost_centers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_forms" ADD CONSTRAINT "lead_forms_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pqrs_attachments" ADD CONSTRAINT "pqrs_attachments_case_id_pqrs_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."pqrs_cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pqrs_attachments" ADD CONSTRAINT "pqrs_attachments_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pqrs_attachments" ADD CONSTRAINT "pqrs_attachments_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pqrs_cases" ADD CONSTRAINT "pqrs_cases_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pqrs_cases" ADD CONSTRAINT "pqrs_cases_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pqrs_cases" ADD CONSTRAINT "pqrs_cases_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pqrs_configs" ADD CONSTRAINT "pqrs_configs_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pqrs_counters" ADD CONSTRAINT "pqrs_counters_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pqrs_notes" ADD CONSTRAINT "pqrs_notes_case_id_pqrs_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."pqrs_cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pqrs_notes" ADD CONSTRAINT "pqrs_notes_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pqrs_notes" ADD CONSTRAINT "pqrs_notes_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pqrs_status_history" ADD CONSTRAINT "pqrs_status_history_case_id_pqrs_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."pqrs_cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pqrs_status_history" ADD CONSTRAINT "pqrs_status_history_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pqrs_status_history" ADD CONSTRAINT "pqrs_status_history_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_clinical_record_id_clinical_records_id_fk" FOREIGN KEY ("clinical_record_id") REFERENCES "public"."clinical_records"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_doctor_id_users_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_list_items" ADD CONSTRAINT "price_list_items_price_list_id_price_lists_id_fk" FOREIGN KEY ("price_list_id") REFERENCES "public"."price_lists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_list_items" ADD CONSTRAINT "price_list_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_lists" ADD CONSTRAINT "price_lists_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_lead_id_users_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "puc_accounts" ADD CONSTRAINT "puc_accounts_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resident_tokens" ADD CONSTRAINT "resident_tokens_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resident_tokens" ADD CONSTRAINT "resident_tokens_unit_id_copropiedad_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."copropiedad_units"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restaurant_tables" ADD CONSTRAINT "restaurant_tables_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restaurant_tables" ADD CONSTRAINT "restaurant_tables_zone_id_restaurant_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."restaurant_zones"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restaurant_zones" ADD CONSTRAINT "restaurant_zones_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_consumptions" ADD CONSTRAINT "room_consumptions_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_consumptions" ADD CONSTRAINT "room_consumptions_reservation_id_hotel_reservations_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."hotel_reservations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_consumptions" ADD CONSTRAINT "room_consumptions_recorded_by_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_types" ADD CONSTRAINT "room_types_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_room_type_id_room_types_id_fk" FOREIGN KEY ("room_type_id") REFERENCES "public"."room_types"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_schedules" ADD CONSTRAINT "staff_schedules_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_schedules" ADD CONSTRAINT "staff_schedules_advisor_id_users_id_fk" FOREIGN KEY ("advisor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_services" ADD CONSTRAINT "staff_services_advisor_id_users_id_fk" FOREIGN KEY ("advisor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_services" ADD CONSTRAINT "staff_services_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "table_order_items" ADD CONSTRAINT "table_order_items_order_id_table_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."table_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "table_order_items" ADD CONSTRAINT "table_order_items_menu_item_id_menu_items_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "table_orders" ADD CONSTRAINT "table_orders_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "table_orders" ADD CONSTRAINT "table_orders_table_id_restaurant_tables_id_fk" FOREIGN KEY ("table_id") REFERENCES "public"."restaurant_tables"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "table_orders" ADD CONSTRAINT "table_orders_waiter_id_users_id_fk" FOREIGN KEY ("waiter_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_advisor_id_users_id_fk" FOREIGN KEY ("advisor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treatment_records" ADD CONSTRAINT "treatment_records_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treatment_records" ADD CONSTRAINT "treatment_records_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treatment_records" ADD CONSTRAINT "treatment_records_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treatment_records" ADD CONSTRAINT "treatment_records_advisor_id_users_id_fk" FOREIGN KEY ("advisor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treatment_records" ADD CONSTRAINT "treatment_records_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vet_patients" ADD CONSTRAINT "vet_patients_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vet_patients" ADD CONSTRAINT "vet_patients_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vet_records" ADD CONSTRAINT "vet_records_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vet_records" ADD CONSTRAINT "vet_records_vet_patient_id_vet_patients_id_fk" FOREIGN KEY ("vet_patient_id") REFERENCES "public"."vet_patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vet_records" ADD CONSTRAINT "vet_records_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vet_records" ADD CONSTRAINT "vet_records_doctor_id_users_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visitor_log" ADD CONSTRAINT "visitor_log_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visitor_log" ADD CONSTRAINT "visitor_log_unit_id_copropiedad_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."copropiedad_units"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "accounting_periods_brand_year_month_idx" ON "accounting_periods" USING btree ("brand_id","year","month");--> statement-breakpoint
CREATE UNIQUE INDEX "accounting_tax_configs_idx" ON "accounting_tax_configs" USING btree ("brand_id","tax_type","rate");--> statement-breakpoint
CREATE INDEX "ai_usage_brand_date_idx" ON "ai_usage" USING btree ("brand_id","usage_date");--> statement-breakpoint
CREATE INDEX "amenity_bookings_brand_idx" ON "amenity_bookings" USING btree ("brand_id","date");--> statement-breakpoint
CREATE UNIQUE INDEX "amenity_bookings_space_date_time_idx" ON "amenity_bookings" USING btree ("space_id","date","start_time");--> statement-breakpoint
CREATE INDEX "clinical_records_customer_idx" ON "clinical_records" USING btree ("customer_id","date");--> statement-breakpoint
CREATE INDEX "clinical_records_brand_idx" ON "clinical_records" USING btree ("brand_id","date");--> statement-breakpoint
CREATE UNIQUE INDEX "copropiedad_attendees_meeting_unit_idx" ON "copropiedad_attendees" USING btree ("meeting_id","unit_id");--> statement-breakpoint
CREATE INDEX "copropiedad_fees_brand_idx" ON "copropiedad_fees" USING btree ("brand_id","period");--> statement-breakpoint
CREATE UNIQUE INDEX "copropiedad_fees_unit_period_idx" ON "copropiedad_fees" USING btree ("unit_id","period");--> statement-breakpoint
CREATE INDEX "copropiedad_reservations_date_idx" ON "copropiedad_reservations" USING btree ("brand_id","space_id","reservation_date");--> statement-breakpoint
CREATE INDEX "copropiedad_units_brand_idx" ON "copropiedad_units" USING btree ("brand_id");--> statement-breakpoint
CREATE UNIQUE INDEX "copropiedad_units_brand_number_idx" ON "copropiedad_units" USING btree ("brand_id","unit_number");--> statement-breakpoint
CREATE UNIQUE INDEX "copropiedad_vote_records_vote_unit_idx" ON "copropiedad_vote_records" USING btree ("vote_id","unit_id");--> statement-breakpoint
CREATE UNIQUE INDEX "cost_centers_brand_code_idx" ON "cost_centers" USING btree ("brand_id","code");--> statement-breakpoint
CREATE UNIQUE INDEX "customer_fiscal_data_customer_brand_idx" ON "customer_fiscal_data" USING btree ("customer_id","brand_id");--> statement-breakpoint
CREATE INDEX "customer_fiscal_data_brand_idx" ON "customer_fiscal_data" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "deliverables_project_idx" ON "deliverables" USING btree ("project_id","sort_order");--> statement-breakpoint
CREATE INDEX "dian_transmissions_document_idx" ON "dian_transmissions" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "dropship_order_items_order_idx" ON "dropship_order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "dropship_orders_brand_idx" ON "dropship_orders" USING btree ("brand_id","created_at");--> statement-breakpoint
CREATE INDEX "dropship_orders_status_idx" ON "dropship_orders" USING btree ("brand_id","status");--> statement-breakpoint
CREATE INDEX "dropship_product_info_brand_idx" ON "dropship_product_info" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "dropship_suppliers_brand_idx" ON "dropship_suppliers" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "edi_document_idx" ON "electronic_document_items" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "electronic_documents_brand_idx" ON "electronic_documents" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "electronic_documents_status_idx" ON "electronic_documents" USING btree ("brand_id","status");--> statement-breakpoint
CREATE INDEX "encargo_items_encargo_idx" ON "encargo_items" USING btree ("encargo_id");--> statement-breakpoint
CREATE INDEX "encargo_services_brand_idx" ON "encargo_services" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "encargos_brand_idx" ON "encargos" USING btree ("brand_id","received_at");--> statement-breakpoint
CREATE INDEX "encargos_customer_idx" ON "encargos" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "encargos_status_idx" ON "encargos" USING btree ("brand_id","status");--> statement-breakpoint
CREATE INDEX "hotel_reservations_brand_idx" ON "hotel_reservations" USING btree ("brand_id","check_in");--> statement-breakpoint
CREATE INDEX "hotel_reservations_room_idx" ON "hotel_reservations" USING btree ("room_id","check_in");--> statement-breakpoint
CREATE INDEX "hotel_reservations_status_idx" ON "hotel_reservations" USING btree ("brand_id","status");--> statement-breakpoint
CREATE INDEX "invoice_resolutions_brand_idx" ON "invoice_resolutions" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "invoice_resolutions_active_idx" ON "invoice_resolutions" USING btree ("brand_id","document_type","is_active");--> statement-breakpoint
CREATE INDEX "journal_entries_brand_idx" ON "journal_entries" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "journal_entries_period_idx" ON "journal_entries" USING btree ("period_id");--> statement-breakpoint
CREATE INDEX "journal_entries_date_idx" ON "journal_entries" USING btree ("brand_id","entry_date");--> statement-breakpoint
CREATE INDEX "jel_entry_idx" ON "journal_entry_lines" USING btree ("journal_entry_id");--> statement-breakpoint
CREATE INDEX "jel_account_idx" ON "journal_entry_lines" USING btree ("brand_id","account_code");--> statement-breakpoint
CREATE INDEX "lead_forms_brand_idx" ON "lead_forms" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "pqrs_cases_brand_idx" ON "pqrs_cases" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "pqrs_cases_status_idx" ON "pqrs_cases" USING btree ("brand_id","status");--> statement-breakpoint
CREATE INDEX "prescriptions_customer_idx" ON "prescriptions" USING btree ("customer_id","date");--> statement-breakpoint
CREATE INDEX "price_list_items_list_idx" ON "price_list_items" USING btree ("price_list_id");--> statement-breakpoint
CREATE INDEX "price_lists_brand_idx" ON "price_lists" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "projects_brand_idx" ON "projects" USING btree ("brand_id","created_at");--> statement-breakpoint
CREATE INDEX "projects_customer_idx" ON "projects" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "proposals_brand_idx" ON "proposals" USING btree ("brand_id","created_at");--> statement-breakpoint
CREATE INDEX "proposals_customer_idx" ON "proposals" USING btree ("customer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "puc_accounts_brand_code_idx" ON "puc_accounts" USING btree ("brand_id","code");--> statement-breakpoint
CREATE INDEX "puc_accounts_parent_idx" ON "puc_accounts" USING btree ("brand_id","parent_code");--> statement-breakpoint
CREATE INDEX "resident_tokens_brand_idx" ON "resident_tokens" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "restaurant_tables_brand_idx" ON "restaurant_tables" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "restaurant_zones_brand_idx" ON "restaurant_zones" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "room_consumptions_reservation_idx" ON "room_consumptions" USING btree ("reservation_id");--> statement-breakpoint
CREATE INDEX "room_types_brand_idx" ON "room_types" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "rooms_brand_idx" ON "rooms" USING btree ("brand_id");--> statement-breakpoint
CREATE UNIQUE INDEX "rooms_brand_number_idx" ON "rooms" USING btree ("brand_id","number");--> statement-breakpoint
CREATE INDEX "services_brand_idx" ON "services" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "staff_schedules_brand_idx" ON "staff_schedules" USING btree ("brand_id");--> statement-breakpoint
CREATE UNIQUE INDEX "staff_schedules_advisor_day_idx" ON "staff_schedules" USING btree ("advisor_id","day_of_week");--> statement-breakpoint
CREATE INDEX "staff_services_advisor_idx" ON "staff_services" USING btree ("advisor_id");--> statement-breakpoint
CREATE INDEX "table_order_items_order_idx" ON "table_order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "table_order_items_status_idx" ON "table_order_items" USING btree ("status","sent_at");--> statement-breakpoint
CREATE INDEX "table_orders_brand_idx" ON "table_orders" USING btree ("brand_id","opened_at");--> statement-breakpoint
CREATE INDEX "table_orders_table_idx" ON "table_orders" USING btree ("table_id","status");--> statement-breakpoint
CREATE INDEX "time_entries_project_idx" ON "time_entries" USING btree ("project_id","date");--> statement-breakpoint
CREATE INDEX "treatment_records_customer_idx" ON "treatment_records" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "treatment_records_brand_idx" ON "treatment_records" USING btree ("brand_id","date");--> statement-breakpoint
CREATE INDEX "vet_patients_customer_idx" ON "vet_patients" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "vet_patients_brand_idx" ON "vet_patients" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "vet_records_patient_idx" ON "vet_records" USING btree ("vet_patient_id","date");--> statement-breakpoint
CREATE INDEX "visitor_log_brand_idx" ON "visitor_log" USING btree ("brand_id","entered_at");