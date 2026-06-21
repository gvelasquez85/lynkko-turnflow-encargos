/**
 * Schema Drizzle — Turnflow by Lynkko
 *
 * Modelo multi-tenant: brand → establishment
 *   brand      = tenant principal (negocio / empresa)
 *   establishment = sucursal bajo un brand
 *
 * SIN RLS — todo filtrado es explícito en código por brandId/establishmentId.
 * SIN triggers de Supabase — lógica equivalente en Server Actions / Route Handlers.
 */

import {
  pgTable,
  pgEnum,
  text,
  timestamp,
  uuid,
  boolean,
  integer,
  smallint,
  numeric,
  bigint,
  jsonb,
  time,
  date,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core'

// ─────────────────────────────────────────────────────────────────────────────
// Enums
// ─────────────────────────────────────────────────────────────────────────────

export const userRoleEnum = pgEnum('user_role', [
  'superadmin',
  'brand_admin',
  'manager',
  'advisor',
  'reporting',
])

export const ticketStatusEnum = pgEnum('ticket_status', [
  'waiting',
  'in_progress',
  'done',
  'cancelled',
])

export const appointmentStatusEnum = pgEnum('appointment_status', [
  'pending',
  'confirmed',
  'attended',
  'cancelled',
  'no_show',
])

export const preOrderStatusEnum = pgEnum('pre_order_status', [
  'pending',
  'received',
  'preparing',
  'ready',
  'delivered',
])

export const planEnum = pgEnum('plan', [
  'free',
  'basic',
  'professional',
  'enterprise',
  'enterprise_plus',
  'standard',
])

export const membershipStatusEnum = pgEnum('membership_status', [
  'active',
  'expired',
  'cancelled',
  'trial',
])

export const billingStatusEnum = pgEnum('billing_status', [
  'none',
  'active',
  'past_due',
  'suspended',
])

export const billingCurrencyEnum = pgEnum('billing_currency', ['COP', 'USD'])

export const moduleSubscriptionStatusEnum = pgEnum('module_subscription_status', [
  'trial',
  'active',
  'expired',
  'cancelled',
])

export const saleTypeEnum = pgEnum('sale_type', ['sale', 'quote'])

export const saleStatusEnum = pgEnum('sale_status', [
  'completed',
  'cancelled',
  'draft',
  'sent',
  'accepted',
  'rejected',
  'converted',
])

export const productTypeEnum = pgEnum('product_type', [
  'product',
  'service',
  'digital',
])

export const stockMovementTypeEnum = pgEnum('stock_movement_type', [
  'sale',
  'purchase',
  'adjustment',
  'return',
])

export const fieldTypeEnum = pgEnum('field_type', [
  'text',
  'number',
  'select',
  'date',
  'textarea',
])

export const waTemplateCategoryEnum = pgEnum('wa_template_category', [
  'appointment_confirmation',
  'appointment_reminder',
  'appointment_cancelled',
  'appointment_no_show',
  'sale_receipt',
  'sale_pending_payment',
  'quote_sent',
  'quote_followup',
  'customer_reactivation',
])

export const brandAlertTypeEnum = pgEnum('brand_alert_type', [
  'inactive_clients',
  'open_quotes',
  'low_stock',
])

// ─────────────────────────────────────────────────────────────────────────────
// Better Auth tables
// ─────────────────────────────────────────────────────────────────────────────

export const users = pgTable('users', {
  id:              text('id').primaryKey(),
  email:           text('email').notNull().unique(),
  emailVerified:   boolean('email_verified').notNull().default(false),
  name:            text('name').notNull(),
  image:           text('image'),
  // Business fields
  role:            userRoleEnum('role').notNull().default('brand_admin'),
  brandId:         uuid('brand_id'),
  establishmentId: uuid('establishment_id'),
  active:          boolean('active').notNull().default(true),
  createdAt:       timestamp('created_at').defaultNow().notNull(),
  updatedAt:       timestamp('updated_at').defaultNow().notNull(),
})

export const sessions = pgTable('sessions', {
  id:        text('id').primaryKey(),
  userId:    text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token:     text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const accounts = pgTable('accounts', {
  id:                   text('id').primaryKey(),
  userId:               text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  accountId:            text('account_id').notNull(),
  providerId:           text('provider_id').notNull(),
  accessToken:          text('access_token'),
  refreshToken:         text('refresh_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  scope:                text('scope'),
  password:             text('password'),
  createdAt:            timestamp('created_at').defaultNow().notNull(),
  updatedAt:            timestamp('updated_at').defaultNow().notNull(),
})

export const verifications = pgTable('verifications', {
  id:         text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value:      text('value').notNull(),
  expiresAt:  timestamp('expires_at').notNull(),
  createdAt:  timestamp('created_at').defaultNow().notNull(),
})

// ─────────────────────────────────────────────────────────────────────────────
// Brands (tenant principal)
// ─────────────────────────────────────────────────────────────────────────────

export const brands = pgTable('brands', {
  id:                   uuid('id').primaryKey().defaultRandom(),
  name:                 text('name').notNull(),
  slug:                 text('slug').notNull().unique(),
  logoUrl:              text('logo_url'),
  active:               boolean('active').notNull().default(true),
  // Plan y suscripción
  currentPlan:          planEnum('current_plan').notNull().default('free'),
  // Módulos activos (mapa JSON: { queue: true, appointments: false, ... })
  activeModules:        jsonb('active_modules').default('{"queue":true,"appointments":false,"surveys":false,"menu":false,"display":false}').notNull(),
  // Datos de contacto
  address:              text('address'),
  contactEmail:         text('contact_email'),
  website:              text('website'),
  country:              text('country').default('Colombia'),
  // Vertical de negocio
  businessType:         text('business_type').default('otros'),
  onboardingCompleted:  boolean('onboarding_completed').default(false),
  tagline:              text('tagline'),
  // Personalización de marca
  primaryColor:         text('primary_color').default('#6366f1'),
  dataPolicyText:       text('data_policy_text'),
  formFields:           jsonb('form_fields').$type<any[]>().default([]),
  // Configuración de cotizaciones
  quoteTemplate:        jsonb('quote_template'),
  createdAt:            timestamp('created_at').defaultNow().notNull(),
})

// ─────────────────────────────────────────────────────────────────────────────
// Establishments (sucursales)
// ─────────────────────────────────────────────────────────────────────────────

export const establishments = pgTable('establishments', {
  id:       uuid('id').primaryKey().defaultRandom(),
  brandId:  uuid('brand_id').notNull().references(() => brands.id, { onDelete: 'cascade' }),
  name:     text('name').notNull(),
  slug:     text('slug').notNull().unique(),
  address:  text('address'),
  active:   boolean('active').notNull().default(true),
  // Módulos activos por sucursal (hereda de brand, puede sobreescribir)
  features: jsonb('features').default('{"queue":true,"appointments":false,"surveys":false,"menu":false}').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// FK inversa: users.brandId y users.establishmentId
// No se ponen como FK directas en Better Auth para no romper el schema de auth

// ─────────────────────────────────────────────────────────────────────────────
// Memberships
// ─────────────────────────────────────────────────────────────────────────────

export const memberships = pgTable('memberships', {
  id:                       uuid('id').primaryKey().defaultRandom(),
  brandId:                  uuid('brand_id').notNull().references(() => brands.id, { onDelete: 'cascade' }),
  plan:                     planEnum('plan').notNull().default('free'),
  status:                   membershipStatusEnum('status').notNull().default('active'),
  startedAt:                timestamp('started_at').defaultNow().notNull(),
  expiresAt:                timestamp('expires_at'),
  maxEstablishments:        integer('max_establishments').default(1),
  maxAdvisors:              integer('max_advisors').default(3),
  notes:                    text('notes'),
  // Pricing
  pricePerEstablishment:    numeric('price_per_establishment', { precision: 10, scale: 2 }).default('15.00'),
  pricePerAdditionalAdvisor: numeric('price_per_additional_advisor', { precision: 10, scale: 2 }).default('5.00'),
  // Wompi billing
  wompiPaymentSourceId:     text('wompi_payment_source_id'),
  wompiCustomerEmail:       text('wompi_customer_email'),
  billingCurrency:          billingCurrencyEnum('billing_currency').notNull().default('COP'),
  billingAnchorDay:         smallint('billing_anchor_day').default(1),
  nextBillingAt:            timestamp('next_billing_at'),
  lastBilledAt:             timestamp('last_billed_at'),
  lastBillingAmount:        bigint('last_billing_amount', { mode: 'number' }),
  billingStatus:            billingStatusEnum('billing_status').notNull().default('none'),
  pastDueSince:             timestamp('past_due_since'),
  pastDueAttempts:          smallint('past_due_attempts').notNull().default(0),
  pastDueLastAttemptAt:     timestamp('past_due_last_attempt_at'),
  // PayPal
  paypalSubscriptionId:     text('paypal_subscription_id'),
  subscribedAmount:         numeric('subscribed_amount', { precision: 10, scale: 2 }).default('0'),
  createdAt:                timestamp('created_at').defaultNow().notNull(),
})

// ─────────────────────────────────────────────────────────────────────────────
// Marketplace modules & subscriptions
// ─────────────────────────────────────────────────────────────────────────────

export const marketplaceModules = pgTable('marketplace_modules', {
  id:                   uuid('id').primaryKey().defaultRandom(),
  moduleKey:            text('module_key').notNull().unique(),
  label:                text('label').notNull(),
  description:          text('description'),
  icon:                 text('icon'),
  color:                text('color'),
  features:             text('features').array().default([]),
  priceMonthly:         numeric('price_monthly', { precision: 10, scale: 2 }).default('0'),
  pricePerUser:         boolean('price_per_user').default(false),
  pricePerUserAmount:   numeric('price_per_user_amount', { precision: 10, scale: 2 }).default('0'),
  trialDays:            integer('trial_days').default(7),
  isVisibleToBrands:    boolean('is_visible_to_brands').notNull().default(false),
  isComingSoon:         boolean('is_coming_soon').notNull().default(false),
  sortOrder:            integer('sort_order').notNull().default(0),
  paypalPlanId:         text('paypal_plan_id'),
  createdAt:            timestamp('created_at').defaultNow().notNull(),
})

export const moduleSubscriptions = pgTable('module_subscriptions', {
  id:              uuid('id').primaryKey().defaultRandom(),
  brandId:         uuid('brand_id').notNull().references(() => brands.id, { onDelete: 'cascade' }),
  moduleKey:       text('module_key').notNull(),
  status:          moduleSubscriptionStatusEnum('status').notNull().default('trial'),
  trialStartedAt:  timestamp('trial_started_at').defaultNow(),
  trialExpiresAt:  timestamp('trial_expires_at'),
  activatedAt:     timestamp('activated_at'),
  expiresAt:       timestamp('expires_at'),
  priceMonthly:    numeric('price_monthly', { precision: 10, scale: 2 }),
  createdAt:       timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  uniqueIndex('module_subscriptions_brand_module_idx').on(t.brandId, t.moduleKey),
])

// ─────────────────────────────────────────────────────────────────────────────
// System settings & translations
// ─────────────────────────────────────────────────────────────────────────────

export const systemSettings = pgTable('system_settings', {
  key:       text('key').primaryKey(),
  value:     text('value').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  updatedBy: text('updated_by').references(() => users.id),
})

export const appTranslations = pgTable('app_translations', {
  id:        uuid('id').primaryKey().defaultRandom(),
  lang:      text('lang').notNull(),
  key:       text('key').notNull(),
  value:     text('value').notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (t) => [
  uniqueIndex('app_translations_lang_key_idx').on(t.lang, t.key),
])

// ─────────────────────────────────────────────────────────────────────────────
// Visit reasons & promotions
// ─────────────────────────────────────────────────────────────────────────────

export const visitReasons = pgTable('visit_reasons', {
  id:          uuid('id').primaryKey().defaultRandom(),
  brandId:     uuid('brand_id').notNull().references(() => brands.id, { onDelete: 'cascade' }),
  name:        text('name').notNull(),
  description: text('description'),
  sortOrder:   integer('sort_order').notNull().default(0),
  active:      boolean('active').notNull().default(true),
  createdAt:   timestamp('created_at').defaultNow().notNull(),
})

export const promotions = pgTable('promotions', {
  id:              uuid('id').primaryKey().defaultRandom(),
  establishmentId: uuid('establishment_id').notNull().references(() => establishments.id, { onDelete: 'cascade' }),
  title:           text('title').notNull(),
  description:     text('description'),
  imageUrl:        text('image_url'),
  active:          boolean('active').notNull().default(true),
  startsAt:        timestamp('starts_at'),
  endsAt:          timestamp('ends_at'),
  createdAt:       timestamp('created_at').defaultNow().notNull(),
})

// ─────────────────────────────────────────────────────────────────────────────
// Display config (pantalla TV)
// ─────────────────────────────────────────────────────────────────────────────

export const displayConfigs = pgTable('display_configs', {
  id:              uuid('id').primaryKey().defaultRandom(),
  establishmentId: uuid('establishment_id').notNull().references(() => establishments.id, { onDelete: 'cascade' }).unique(),
  bgColor:         text('bg_color').default('#1e1b4b'),
  accentColor:     text('accent_color').default('#6366f1'),
  showWaitingList: boolean('show_waiting_list').default(true),
  showPromotions:  boolean('show_promotions').default(true),
  showClock:       boolean('show_clock').default(true),
  customMessage:   text('custom_message'),
  widgets:         jsonb('widgets').default([]),
  updatedAt:       timestamp('updated_at').defaultNow().notNull(),
})

// ─────────────────────────────────────────────────────────────────────────────
// Advisor fields (formulario personalizable)
// ─────────────────────────────────────────────────────────────────────────────

export const advisorFields = pgTable('advisor_fields', {
  id:              uuid('id').primaryKey().defaultRandom(),
  establishmentId: uuid('establishment_id').notNull().references(() => establishments.id, { onDelete: 'cascade' }),
  label:           text('label').notNull(),
  fieldType:       fieldTypeEnum('field_type').notNull().default('text'),
  options:         jsonb('options').$type<string[]>(),
  required:        boolean('required').notNull().default(false),
  sortOrder:       integer('sort_order').notNull().default(0),
  active:          boolean('active').notNull().default(true),
  createdAt:       timestamp('created_at').defaultNow().notNull(),
})

// ─────────────────────────────────────────────────────────────────────────────
// Tickets (cola de turnos)
// ─────────────────────────────────────────────────────────────────────────────

export const tickets = pgTable('tickets', {
  id:              uuid('id').primaryKey().defaultRandom(),
  establishmentId: uuid('establishment_id').notNull().references(() => establishments.id, { onDelete: 'cascade' }),
  visitReasonId:   uuid('visit_reason_id').references(() => visitReasons.id, { onDelete: 'set null' }),
  queueNumber:     text('queue_number').notNull(),
  customerName:    text('customer_name').notNull(),
  customerPhone:   text('customer_phone'),
  customerEmail:   text('customer_email'),
  marketingOptIn:  boolean('marketing_opt_in').notNull().default(false),
  pushSubscription: jsonb('push_subscription'),
  status:          ticketStatusEnum('status').notNull().default('waiting'),
  advisorId:       text('advisor_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt:       timestamp('created_at').defaultNow().notNull(),
  attendedAt:      timestamp('attended_at'),
  completedAt:     timestamp('completed_at'),
}, (t) => [
  index('tickets_establishment_status_idx').on(t.establishmentId, t.status),
  index('tickets_created_at_idx').on(t.createdAt),
])

// ─────────────────────────────────────────────────────────────────────────────
// Attentions (registro de atenciones completadas)
// ─────────────────────────────────────────────────────────────────────────────

export const attentions = pgTable('attentions', {
  id:              uuid('id').primaryKey().defaultRandom(),
  ticketId:        uuid('ticket_id').notNull().references(() => tickets.id, { onDelete: 'cascade' }),
  advisorId:       text('advisor_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  establishmentId: uuid('establishment_id').notNull().references(() => establishments.id, { onDelete: 'cascade' }),
  fieldsData:      jsonb('fields_data').notNull().default({}),
  notes:           text('notes'),
  createdAt:       timestamp('created_at').defaultNow().notNull(),
  completedAt:     timestamp('completed_at'),
})

// ─────────────────────────────────────────────────────────────────────────────
// Appointments & availability
// ─────────────────────────────────────────────────────────────────────────────

export const appointments = pgTable('appointments', {
  id:              uuid('id').primaryKey().defaultRandom(),
  establishmentId: uuid('establishment_id').notNull().references(() => establishments.id, { onDelete: 'cascade' }),
  visitReasonId:   uuid('visit_reason_id').references(() => visitReasons.id, { onDelete: 'set null' }),
  customerName:    text('customer_name').notNull(),
  customerPhone:   text('customer_phone'),
  customerEmail:   text('customer_email'),
  scheduledAt:     timestamp('scheduled_at').notNull(),
  durationMinutes: integer('duration_minutes').notNull().default(30),
  status:          appointmentStatusEnum('status').notNull().default('pending'),
  notes:           text('notes'),
  advisorId:       text('advisor_id').references(() => users.id, { onDelete: 'set null' }),
  ticketId:        uuid('ticket_id').references(() => tickets.id, { onDelete: 'set null' }),
  createdAt:       timestamp('created_at').defaultNow().notNull(),
})

export const appointmentSettings = pgTable('appointment_settings', {
  id:              uuid('id').primaryKey().defaultRandom(),
  establishmentId: uuid('establishment_id').notNull().references(() => establishments.id, { onDelete: 'cascade' }).unique(),
  slotMinutes:     integer('slot_minutes').notNull().default(30),
  maxPerSlot:      integer('max_per_slot').notNull().default(1),
  openDays:        integer('open_days').array().notNull().default([1, 2, 3, 4, 5]),
  openTime:        time('open_time').notNull().default('08:00'),
  closeTime:       time('close_time').notNull().default('18:00'),
  advanceDays:     integer('advance_days').notNull().default(30),
  bufferMinutes:   integer('buffer_minutes').notNull().default(0),
  isActive:        boolean('is_active').notNull().default(true),
  createdAt:       timestamp('created_at').defaultNow().notNull(),
  updatedAt:       timestamp('updated_at').defaultNow().notNull(),
})

export const availabilitySlots = pgTable('availability_slots', {
  id:                  uuid('id').primaryKey().defaultRandom(),
  establishmentId:     uuid('establishment_id').notNull().references(() => establishments.id, { onDelete: 'cascade' }),
  dayOfWeek:           integer('day_of_week').notNull(),
  startTime:           time('start_time').notNull(),
  endTime:             time('end_time').notNull(),
  slotDurationMinutes: integer('slot_duration_minutes').default(30),
  maxConcurrent:       integer('max_concurrent').default(1),
  active:              boolean('active').default(true),
})

// ─────────────────────────────────────────────────────────────────────────────
// Surveys
// ─────────────────────────────────────────────────────────────────────────────

export const surveyTemplates = pgTable('survey_templates', {
  id:        uuid('id').primaryKey().defaultRandom(),
  brandId:   uuid('brand_id').notNull().references(() => brands.id, { onDelete: 'cascade' }),
  name:      text('name').notNull(),
  questions: jsonb('questions').notNull().default([]),
  active:    boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const surveyResponses = pgTable('survey_responses', {
  id:              uuid('id').primaryKey().defaultRandom(),
  ticketId:        uuid('ticket_id').references(() => tickets.id, { onDelete: 'set null' }),
  templateId:      uuid('template_id').references(() => surveyTemplates.id, { onDelete: 'set null' }),
  establishmentId: uuid('establishment_id').notNull().references(() => establishments.id, { onDelete: 'cascade' }),
  responses:       jsonb('responses').notNull().default({}),
  createdAt:       timestamp('created_at').defaultNow().notNull(),
})

// ─────────────────────────────────────────────────────────────────────────────
// Menu & pre-orders
// ─────────────────────────────────────────────────────────────────────────────

export const menus = pgTable('menus', {
  id:              uuid('id').primaryKey().defaultRandom(),
  establishmentId: uuid('establishment_id').notNull().references(() => establishments.id, { onDelete: 'cascade' }),
  name:            text('name').notNull(),
  active:          boolean('active').default(true),
  createdAt:       timestamp('created_at').defaultNow().notNull(),
})

export const menuCategories = pgTable('menu_categories', {
  id:        uuid('id').primaryKey().defaultRandom(),
  menuId:    uuid('menu_id').notNull().references(() => menus.id, { onDelete: 'cascade' }),
  name:      text('name').notNull(),
  sortOrder: integer('sort_order').default(0),
})

export const menuItems = pgTable('menu_items', {
  id:          uuid('id').primaryKey().defaultRandom(),
  categoryId:  uuid('category_id').notNull().references(() => menuCategories.id, { onDelete: 'cascade' }),
  name:        text('name').notNull(),
  description: text('description'),
  price:       numeric('price', { precision: 10, scale: 2 }),
  imageUrl:    text('image_url'),
  available:   boolean('available').default(true),
  sortOrder:   integer('sort_order').default(0),
})

export const preOrders = pgTable('pre_orders', {
  id:              uuid('id').primaryKey().defaultRandom(),
  establishmentId: uuid('establishment_id').notNull().references(() => establishments.id, { onDelete: 'cascade' }),
  customerName:    text('customer_name').notNull(),
  customerPhone:   text('customer_phone'),
  ticketId:        uuid('ticket_id').references(() => tickets.id, { onDelete: 'set null' }),
  items:           jsonb('items').notNull().default([]),
  total:           numeric('total', { precision: 10, scale: 2 }),
  notes:           text('notes'),
  status:          preOrderStatusEnum('status').notNull().default('pending'),
  createdAt:       timestamp('created_at').defaultNow().notNull(),
})

// ─────────────────────────────────────────────────────────────────────────────
// Customers (CRM / Clientes)
// ─────────────────────────────────────────────────────────────────────────────

export const customers = pgTable('customers', {
  id:                   uuid('id').primaryKey().defaultRandom(),
  brandId:              uuid('brand_id').notNull().references(() => brands.id, { onDelete: 'cascade' }),
  name:                 text('name').notNull(),
  phone:                text('phone'),
  celular:              text('celular'),
  email:                text('email'),
  documentId:           text('document_id'),
  notes:                text('notes'),
  // Canal de contacto y datos de negocio
  canalContacto:        text('canal_contacto'),
  intereses:            text('intereses').array(),
  cumpleanos:           date('cumpleanos'),
  recordatoriosEnviados: integer('recordatorios_enviados').default(0),
  // Push (reemplaza fcm_token con Web Push)
  pushEndpoint:         text('push_endpoint'),
  // Estadísticas de visitas
  firstVisitAt:         timestamp('first_visit_at').defaultNow().notNull(),
  lastVisitAt:          timestamp('last_visit_at').defaultNow().notNull(),
  ultimaCompra:         timestamp('ultima_compra'),
  totalVisits:          integer('total_visits').notNull().default(1),
  establishmentIds:     uuid('establishment_ids').array().notNull().default([]),
  createdAt:            timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  uniqueIndex('customers_brand_phone_idx').on(t.brandId, t.phone),
  uniqueIndex('customers_brand_document_idx').on(t.brandId, t.documentId),
  index('customers_cumpleanos_idx').on(t.cumpleanos),
])

export const customerTags = pgTable('customer_tags', {
  id:          uuid('id').primaryKey().defaultRandom(),
  customerId:  uuid('customer_id').notNull().references(() => customers.id, { onDelete: 'cascade' }),
  tagKey:      text('tag_key').notNull(),
  createdAt:   timestamp('created_at').defaultNow().notNull(),
  createdById: text('created_by_id').references(() => users.id),
}, (t) => [
  uniqueIndex('customer_tags_customer_tag_idx').on(t.customerId, t.tagKey),
  index('customer_tags_key_idx').on(t.tagKey),
])

export const customerHistory = pgTable('customer_history', {
  id:              uuid('id').primaryKey().defaultRandom(),
  customerId:      uuid('customer_id').notNull().references(() => customers.id, { onDelete: 'cascade' }),
  establishmentId: uuid('establishment_id').references(() => establishments.id, { onDelete: 'set null' }),
  tipo:            text('tipo').notNull(), // 'visita' | 'compra' | 'consulta' | 'soporte'
  fecha:           timestamp('fecha').defaultNow().notNull(),
  detalles:        text('detalles'),
  monto:           numeric('monto', { precision: 10, scale: 2 }),
  createdAt:       timestamp('created_at').defaultNow().notNull(),
  updatedAt:       timestamp('updated_at').defaultNow().notNull(),
}, (t) => [
  index('customer_history_customer_idx').on(t.customerId),
  index('customer_history_fecha_idx').on(t.fecha),
])

export const customerReminders = pgTable('customer_reminders', {
  id:                uuid('id').primaryKey().defaultRandom(),
  customerId:        uuid('customer_id').notNull().references(() => customers.id, { onDelete: 'cascade' }),
  tipo:              text('tipo').notNull(), // 'cumpleanos' | 'inactividad' | 'compra_pendiente' | 'custom'
  descripcion:       text('descripcion'),
  fechaRecordatorio: timestamp('fecha_recordatorio'),
  enviado:           boolean('enviado').default(false),
  enviadoAt:         timestamp('enviado_at'),
  medioEnvio:        text('medio_envio'), // 'whatsapp' | 'email' | 'sms'
  createdAt:         timestamp('created_at').defaultNow().notNull(),
  updatedAt:         timestamp('updated_at').defaultNow().notNull(),
}, (t) => [
  index('customer_reminders_fecha_idx').on(t.fechaRecordatorio),
  index('customer_reminders_enviado_idx').on(t.enviado),
])

// ─────────────────────────────────────────────────────────────────────────────
// Data consents
// ─────────────────────────────────────────────────────────────────────────────

export const dataConsents = pgTable('data_consents', {
  id:                    uuid('id').primaryKey().defaultRandom(),
  ticketId:              uuid('ticket_id').references(() => tickets.id, { onDelete: 'set null' }),
  establishmentId:       uuid('establishment_id').references(() => establishments.id, { onDelete: 'cascade' }),
  brandId:               uuid('brand_id').references(() => brands.id, { onDelete: 'cascade' }),
  customerName:          text('customer_name').notNull(),
  customerPhone:         text('customer_phone'),
  customerEmail:         text('customer_email'),
  marketingOptIn:        boolean('marketing_opt_in').notNull().default(false),
  dataProcessingConsent: boolean('data_processing_consent').notNull().default(true),
  consentText:           text('consent_text').notNull(),
  ipAddress:             text('ip_address'),
  consentedAt:           timestamp('consented_at').defaultNow().notNull(),
})

// ─────────────────────────────────────────────────────────────────────────────
// Brand alerts
// ─────────────────────────────────────────────────────────────────────────────

export const brandAlerts = pgTable('brand_alerts', {
  id:          uuid('id').primaryKey().defaultRandom(),
  brandId:     uuid('brand_id').notNull().references(() => brands.id, { onDelete: 'cascade' }),
  alertType:   brandAlertTypeEnum('alert_type').notNull(),
  data:        jsonb('data').default({}),
  resolved:    boolean('resolved').notNull().default(false),
  createdAt:   timestamp('created_at').defaultNow().notNull(),
  updatedAt:   timestamp('updated_at').defaultNow().notNull(),
}, (t) => [
  uniqueIndex('brand_alerts_brand_type_idx').on(t.brandId, t.alertType),
  index('brand_alerts_unresolved_idx').on(t.brandId, t.resolved),
])

// ─────────────────────────────────────────────────────────────────────────────
// Products & Sales
// ─────────────────────────────────────────────────────────────────────────────

export const products = pgTable('products', {
  id:              uuid('id').primaryKey().defaultRandom(),
  brandId:         uuid('brand_id').notNull().references(() => brands.id, { onDelete: 'cascade' }),
  establishmentId: uuid('establishment_id').references(() => establishments.id, { onDelete: 'set null' }),
  name:            text('name').notNull(),
  sku:             text('sku'),
  description:     text('description'),
  category:        text('category'),
  price:           numeric('price', { precision: 12, scale: 2 }).notNull().default('0'),
  cost:            numeric('cost', { precision: 12, scale: 2 }).default('0'),
  stock:           integer('stock').notNull().default(0),
  minStock:        integer('min_stock').notNull().default(0),
  unit:            text('unit').notNull().default('unidad'),
  productType:     productTypeEnum('product_type').notNull().default('product'),
  active:          boolean('active').notNull().default(true),
  // Digital products
  digitalUrl:      text('digital_url'),
  downloadLimit:   integer('download_limit').default(3),
  createdAt:       timestamp('created_at').defaultNow().notNull(),
  updatedAt:       timestamp('updated_at').defaultNow().notNull(),
}, (t) => [
  index('products_brand_idx').on(t.brandId),
  index('products_sku_idx').on(t.brandId, t.sku),
])

export const sales = pgTable('sales', {
  id:              uuid('id').primaryKey().defaultRandom(),
  brandId:         uuid('brand_id').notNull().references(() => brands.id, { onDelete: 'cascade' }),
  establishmentId: uuid('establishment_id').references(() => establishments.id, { onDelete: 'set null' }),
  customerId:      uuid('customer_id').references(() => customers.id, { onDelete: 'set null' }),
  type:            saleTypeEnum('type').notNull().default('sale'),
  status:          saleStatusEnum('status').notNull().default('completed'),
  subtotal:        numeric('subtotal', { precision: 12, scale: 2 }).notNull().default('0'),
  discount:        numeric('discount', { precision: 12, scale: 2 }).notNull().default('0'),
  total:           numeric('total', { precision: 12, scale: 2 }).notNull().default('0'),
  notes:           text('notes'),
  fulfillmentType: text('fulfillment_type'),
  // Quote tracking
  sentAt:          timestamp('sent_at'),
  sentToEmail:     text('sent_to_email'),
  openedAt:        timestamp('opened_at'),
  sourceQuoteId:   uuid('source_quote_id'),
  createdBy:       text('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt:       timestamp('created_at').defaultNow().notNull(),
  updatedAt:       timestamp('updated_at').defaultNow().notNull(),
}, (t) => [
  index('sales_brand_idx').on(t.brandId),
  index('sales_customer_idx').on(t.customerId),
  index('sales_type_brand_idx').on(t.type, t.brandId),
  index('sales_created_at_idx').on(t.brandId, t.createdAt),
])

export const saleItems = pgTable('sale_items', {
  id:          uuid('id').primaryKey().defaultRandom(),
  saleId:      uuid('sale_id').notNull().references(() => sales.id, { onDelete: 'cascade' }),
  productId:   uuid('product_id').references(() => products.id, { onDelete: 'set null' }),
  productName: text('product_name').notNull(),
  productSku:  text('product_sku'),
  qty:         numeric('qty', { precision: 10, scale: 3 }).notNull().default('1'),
  unitPrice:   numeric('unit_price', { precision: 12, scale: 2 }).notNull(),
  discount:    numeric('discount', { precision: 12, scale: 2 }).notNull().default('0'),
  lineTotal:   numeric('line_total', { precision: 12, scale: 2 }).notNull().default('0'),
  createdAt:   timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  index('sale_items_sale_idx').on(t.saleId),
  index('sale_items_product_idx').on(t.productId),
])

export const stockMovements = pgTable('stock_movements', {
  id:          uuid('id').primaryKey().defaultRandom(),
  productId:   uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  brandId:     uuid('brand_id').notNull().references(() => brands.id, { onDelete: 'cascade' }),
  type:        stockMovementTypeEnum('type').notNull(),
  qtyChange:   integer('qty_change').notNull(),
  qtyAfter:    integer('qty_after').notNull(),
  referenceId: uuid('reference_id'),
  notes:       text('notes'),
  createdBy:   text('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt:   timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  index('stock_movements_product_idx').on(t.productId),
])

export const digitalDownloads = pgTable('digital_downloads', {
  id:            uuid('id').primaryKey().defaultRandom(),
  brandId:       uuid('brand_id').references(() => brands.id, { onDelete: 'cascade' }),
  saleId:        uuid('sale_id').references(() => sales.id, { onDelete: 'cascade' }),
  saleItemId:    uuid('sale_item_id').references(() => saleItems.id, { onDelete: 'cascade' }),
  productId:     uuid('product_id').references(() => products.id, { onDelete: 'set null' }),
  token:         text('token').notNull().unique(),
  downloadCount: integer('download_count').default(0),
  maxDownloads:  integer('max_downloads').default(3),
  digitalUrl:    text('digital_url').notNull(),
  expiresAt:     timestamp('expires_at'),
  createdAt:     timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  index('digital_downloads_token_idx').on(t.token),
  index('digital_downloads_sale_idx').on(t.saleId),
])

// ─────────────────────────────────────────────────────────────────────────────
// Billing transactions (Wompi)
// ─────────────────────────────────────────────────────────────────────────────

export const billingTransactions = pgTable('billing_transactions', {
  id:                  uuid('id').primaryKey().defaultRandom(),
  brandId:             uuid('brand_id').notNull().references(() => brands.id, { onDelete: 'cascade' }),
  membershipId:        uuid('membership_id').references(() => memberships.id),
  wompiTransactionId:  text('wompi_transaction_id').unique(),
  wompiReference:      text('wompi_reference').unique(),
  amount:              bigint('amount', { mode: 'number' }).notNull(),
  currency:            billingCurrencyEnum('currency').notNull().default('COP'),
  status:              text('status').notNull().default('pending'),
  paymentSourceId:     integer('payment_source_id'),
  customerEmail:       text('customer_email'),
  errorReason:         text('error_reason'),
  periodStart:         date('period_start'),
  periodEnd:           date('period_end'),
  createdAt:           timestamp('created_at').defaultNow().notNull(),
  updatedAt:           timestamp('updated_at').defaultNow().notNull(),
}, (t) => [
  index('billing_txn_brand_idx').on(t.brandId),
  index('billing_txn_status_idx').on(t.status),
  index('billing_txn_created_idx').on(t.createdAt),
])

// ─────────────────────────────────────────────────────────────────────────────
// Comms campaigns
// ─────────────────────────────────────────────────────────────────────────────

export const commsCampaigns = pgTable('comms_campaigns', {
  id:       uuid('id').primaryKey().defaultRandom(),
  brandId:  uuid('brand_id').references(() => brands.id, { onDelete: 'cascade' }),
  subject:  text('subject').notNull(),
  sentTo:   integer('sent_to').notNull().default(0),
  failed:   integer('failed').notNull().default(0),
  sentBy:   text('sent_by').references(() => users.id),
  sentAt:   timestamp('sent_at').defaultNow().notNull(),
})

// ─────────────────────────────────────────────────────────────────────────────
// API keys & webhooks
// ─────────────────────────────────────────────────────────────────────────────

export const apiKeys = pgTable('api_keys', {
  id:         uuid('id').primaryKey().defaultRandom(),
  brandId:    uuid('brand_id').notNull().references(() => brands.id, { onDelete: 'cascade' }),
  name:       text('name').notNull().default('Clave principal'),
  keyPrefix:  text('key_prefix').notNull(),
  keyHash:    text('key_hash').notNull().unique(),
  active:     boolean('active').notNull().default(true),
  createdAt:  timestamp('created_at').defaultNow().notNull(),
  lastUsedAt: timestamp('last_used_at'),
})

export const webhookEndpoints = pgTable('webhook_endpoints', {
  id:        uuid('id').primaryKey().defaultRandom(),
  brandId:   uuid('brand_id').notNull().references(() => brands.id, { onDelete: 'cascade' }),
  name:      text('name').notNull().default('Mi webhook'),
  url:       text('url').notNull(),
  secret:    text('secret').notNull(),
  events:    text('events').array(),
  active:    boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ─────────────────────────────────────────────────────────────────────────────
// WhatsApp templates
// ─────────────────────────────────────────────────────────────────────────────

export const waTemplates = pgTable('wa_templates', {
  id:        uuid('id').primaryKey().defaultRandom(),
  brandId:   uuid('brand_id').notNull().references(() => brands.id, { onDelete: 'cascade' }),
  category:  waTemplateCategoryEnum('category').notNull(),
  name:      text('name').notNull(),
  body:      text('body').notNull(),
  isActive:  boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => [
  uniqueIndex('wa_templates_brand_category_idx').on(t.brandId, t.category),
])

export const waDefaultTemplates = pgTable('wa_default_templates', {
  category:    waTemplateCategoryEnum('category').primaryKey(),
  name:        text('name').notNull(),
  body:        text('body').notNull(),
  variables:   text('variables').array().notNull().default([]),
  description: text('description'),
})

// ─────────────────────────────────────────────────────────────────────────────
// Push subscriptions (Web Push — reemplaza Firebase FCM)
// ─────────────────────────────────────────────────────────────────────────────

export const pushSubscriptions = pgTable('push_subscriptions', {
  id:         uuid('id').primaryKey().defaultRandom(),
  brandId:    uuid('brand_id').references(() => brands.id, { onDelete: 'cascade' }),
  userId:     text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'cascade' }),
  endpoint:   text('endpoint').notNull().unique(),
  p256dh:     text('p256dh').notNull(),
  auth:       text('auth').notNull(),
  createdAt:  timestamp('created_at').defaultNow().notNull(),
})

// ─────────────────────────────────────────────────────────────────────────────
// Lead forms
// ─────────────────────────────────────────────────────────────────────────────

export const leadForms = pgTable('lead_forms', {
  id:        uuid('id').primaryKey().defaultRandom(),
  brandId:   uuid('brand_id').notNull().references(() => brands.id, { onDelete: 'cascade' }),
  name:      text('name').notNull(),
  fields:    jsonb('fields').notNull().default([]),
  active:    boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  index('lead_forms_brand_idx').on(t.brandId),
])

// ─────────────────────────────────────────────────────────────────────────────
// Encargos vertical (lavanderías, zapaterías, sastrerías)
// ─────────────────────────────────────────────────────────────────────────────

export const encargoServices = pgTable('encargo_services', {
  id:           uuid('id').primaryKey().defaultRandom(),
  brandId:      uuid('brand_id').notNull().references(() => brands.id, { onDelete: 'cascade' }),
  name:         text('name').notNull(),
  description:  text('description'),
  price:        numeric('price', { precision: 12, scale: 2 }).notNull().default('0'),
  durationDays: integer('duration_days').notNull().default(3),
  isActive:     boolean('is_active').notNull().default(true),
  sortOrder:    integer('sort_order').notNull().default(0),
}, (t) => [
  index('encargo_services_brand_idx').on(t.brandId),
])

export const encargos = pgTable('encargos', {
  id:              uuid('id').primaryKey().defaultRandom(),
  brandId:         uuid('brand_id').notNull().references(() => brands.id, { onDelete: 'cascade' }),
  establishmentId: uuid('establishment_id').references(() => establishments.id, { onDelete: 'cascade' }),
  customerId:      uuid('customer_id').references(() => customers.id, { onDelete: 'set null' }),
  orderCode:       text('order_code').notNull().unique(),
  serviceId:       uuid('service_id').references(() => encargoServices.id, { onDelete: 'set null' }),
  itemDescription: text('item_description').notNull(),
  itemColor:       text('item_color'),
  itemBrand:       text('item_brand'),
  initialNotes:    text('initial_notes'),
  photoUrl:        text('photo_url'),
  status:          text('status').notNull().default('received'),
  receivedAt:      timestamp('received_at').defaultNow().notNull(),
  promisedDate:    date('promised_date').notNull(),
  readyAt:         timestamp('ready_at'),
  deliveredAt:     timestamp('delivered_at'),
  price:           numeric('price', { precision: 12, scale: 2 }).notNull().default('0'),
  paid:            boolean('paid').notNull().default(false),
  notifyWhatsapp:  boolean('notify_whatsapp').notNull().default(true),
  notifiedAt:      timestamp('notified_at'),
  advisorId:       text('advisor_id').references(() => users.id, { onDelete: 'set null' }),
  customerEmail:   text('customer_email'),
  saleId:          uuid('sale_id').references(() => sales.id, { onDelete: 'set null' }),
  notes:           text('notes'),
  createdAt:       timestamp('created_at').defaultNow().notNull(),
  updatedAt:       timestamp('updated_at').defaultNow().notNull(),
}, (t) => [
  index('encargos_brand_idx').on(t.brandId, t.receivedAt),
  index('encargos_customer_idx').on(t.customerId),
  index('encargos_status_idx').on(t.brandId, t.status),
])

export const encargoItems = pgTable('encargo_items', {
  id:         uuid('id').primaryKey().defaultRandom(),
  encargoId:  uuid('encargo_id').notNull().references(() => encargos.id, { onDelete: 'cascade' }),
  sourceType: text('source_type').notNull().default('custom'),
  sourceId:   uuid('source_id'),
  name:       text('name').notNull(),
  quantity:   integer('quantity').notNull().default(1),
  unitPrice:  numeric('unit_price', { precision: 12, scale: 2 }).notNull().default('0'),
  notes:      text('notes'),
  sortOrder:  integer('sort_order').notNull().default(0),
}, (t) => [
  index('encargo_items_encargo_idx').on(t.encargoId),
])

// ─────────────────────────────────────────────────────────────────────────────
// PQRS
// ─────────────────────────────────────────────────────────────────────────────


// ─────────────────────────────────────────────────────────────────────────────
// Type helpers
// ─────────────────────────────────────────────────────────────────────────────

export type Brand              = typeof brands.$inferSelect
export type NewBrand           = typeof brands.$inferInsert
export type Establishment      = typeof establishments.$inferSelect
export type User               = typeof users.$inferSelect
export type Ticket             = typeof tickets.$inferSelect
export type Appointment        = typeof appointments.$inferSelect
export type Customer           = typeof customers.$inferSelect
export type Product            = typeof products.$inferSelect
export type Sale               = typeof sales.$inferSelect
export type SaleItem           = typeof saleItems.$inferSelect
export type WaTemplate         = typeof waTemplates.$inferSelect
export type MarketplaceModule  = typeof marketplaceModules.$inferSelect
export type ModuleSubscription = typeof moduleSubscriptions.$inferSelect
export type Membership         = typeof memberships.$inferSelect
export type Encargo            = typeof encargos.$inferSelect
export type NewEncargo         = typeof encargos.$inferInsert
export type EncargoService     = typeof encargoServices.$inferSelect
export type EncargoItem        = typeof encargoItems.$inferSelect
