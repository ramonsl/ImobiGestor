import { pgTable, serial, text, timestamp, boolean, primaryKey, integer, decimal } from 'drizzle-orm/pg-core';
import type { AdapterAccount } from '@auth/core/adapters';

// --- Tenants ---
export const tenants = pgTable('tenants', {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(), // identifier in URL
    cnpj: text('cnpj'),
    logoUrl: text('logo_url'),
    stripeCustomerId: text('stripe_customer_id'),
    subscriptionStatus: text('subscription_status').default('active'),
    jetimoveisToken: text('jetimoveis_token'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
});

// --- Tenant Goals (Metas por Ano) ---
export const tenantGoals = pgTable('tenant_goals', {
    id: serial('id').primaryKey(),
    tenantId: integer('tenant_id').notNull().references(() => tenants.id),
    year: integer('year').notNull(),
    metaAnual: decimal('meta_anual', { precision: 12, scale: 2 }).default('0'),
    superMeta: decimal('super_meta', { precision: 12, scale: 2 }).default('0'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
});

// --- Auth Tables (NextAuth) ---
export const users = pgTable("user", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    name: text("name"),
    email: text("email").notNull(),
    emailVerified: timestamp("emailVerified", { mode: "date" }),
    image: text("image"),
    // Custom fields
    tenantId: integer('tenant_id').references(() => tenants.id),
    role: text('role').default('broker'), // admin, manager, broker
    password: text('password'),
    createdAt: timestamp('created_at').defaultNow(),
});

export const accounts = pgTable(
    "account",
    {
        userId: text("userId")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        type: text("type").$type<AdapterAccount>().notNull(),
        provider: text("provider").notNull(),
        providerAccountId: text("providerAccountId").notNull(),
        refresh_token: text("refresh_token"),
        access_token: text("access_token"),
        expires_at: integer("expires_at"),
        token_type: text("token_type"),
        scope: text("scope"),
        id_token: text("id_token"),
        session_state: text("session_state"),
    },
    (account) => ({
        compoundKey: primaryKey({
            columns: [account.provider, account.providerAccountId],
        }),
    })
);

export const sessions = pgTable("session", {
    sessionToken: text("sessionToken").primaryKey(),
    userId: text("userId")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
    "verificationToken",
    {
        identifier: text("identifier").notNull(),
        token: text("token").notNull(),
        expires: timestamp("expires", { mode: "date" }).notNull(),
    },
    (verificationToken) => ({
        compositePk: primaryKey({
            columns: [verificationToken.identifier, verificationToken.token],
        }),
    })
);

// --- Business Tables ---

// Collaborators (Colaboradores - antes chamados de Corretores)
// Types: gestor, corretor, agenciador, outros
export const brokers = pgTable('brokers', {
    id: serial('id').primaryKey(),
    tenantId: integer('tenant_id').notNull().references(() => tenants.id),
    name: text('name').notNull(),
    email: text('email'),
    phone: text('phone'), // celular
    type: text('type').default('corretor'), // gestor, corretor, agenciador, outros
    userId: text('user_id').references(() => users.id), // optional link to user account
    avatarUrl: text('avatar_url'),
    active: boolean('active').default(true),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
});

// Broker Goals (Metas por Ano)
export const brokerGoals = pgTable('broker_goals', {
    id: serial('id').primaryKey(),
    brokerId: integer('broker_id').notNull().references(() => brokers.id),
    year: integer('year').notNull(),
    metaAnual: decimal('meta_anual', { precision: 12, scale: 2 }).default('0'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
});

// Sales (Vendas/Lançamentos)
export const sales = pgTable('sales', {
    id: serial('id').primaryKey(),
    tenantId: integer('tenant_id').notNull().references(() => tenants.id),
    brokerId: integer('broker_id').notNull().references(() => brokers.id),
    propertyType: text('property_type'), // Tipo de Imóvel
    month: integer('month').notNull(), // 1-12
    year: integer('year').notNull(),
    value: decimal('value', { precision: 12, scale: 2 }).notNull(), // Valor da venda
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
});

// Properties (Imóveis)
export const properties = pgTable('properties', {
    id: serial('id').primaryKey(),
    tenantId: integer('tenant_id').notNull().references(() => tenants.id),
    externalId: text('external_id'), // ID do JetImóveis
    source: text('source').default('manual'), // 'manual', 'jetimoveis', 'spreadsheet'
    title: text('title').notNull(),
    address: text('address'),
    city: text('city'),
    state: text('state'),
    type: text('type'), // casa, apartamento, terreno
    price: decimal('price', { precision: 12, scale: 2 }),
    imageUrl: text('image_url'), // uma foto principal
    status: text('status').default('active'), // active, sold, inactive
    syncedAt: timestamp('synced_at'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
});

// Sync Jobs (para tracking de sincronizações assíncronas)
export const syncJobs = pgTable('sync_jobs', {
    id: serial('id').primaryKey(),
    tenantId: integer('tenant_id').notNull().references(() => tenants.id),
    type: text('type').notNull(), // 'jetimoveis', 'spreadsheet'
    status: text('status').notNull().default('pending'), // pending, running, completed, failed
    progress: integer('progress').default(0),
    total: integer('total').default(0),
    message: text('message'),
    error: text('error'),
    startedAt: timestamp('started_at').defaultNow(),
    completedAt: timestamp('completed_at'),
});

// Deals (Vendas Completas)
export const deals = pgTable('deals', {
    id: serial('id').primaryKey(),
    tenantId: integer('tenant_id').notNull().references(() => tenants.id),
    propertyId: integer('property_id').references(() => properties.id),
    propertyTitle: text('property_title').notNull(), // snapshot do título
    propertyAddress: text('property_address'), // snapshot do endereço
    saleDate: timestamp('sale_date').notNull().defaultNow(),
    saleValue: decimal('sale_value', { precision: 14, scale: 2 }).notNull(),
    commissionType: text('commission_type').default('percent'), // 'percent' ou 'fixed'
    commissionPercent: decimal('commission_percent', { precision: 5, scale: 2 }), // ex: 6.00
    commissionValue: decimal('commission_value', { precision: 12, scale: 2 }), // valor calculado/fixo
    grossCommission: decimal('gross_commission', { precision: 12, scale: 2 }), // comissão bruta
    totalExpenses: decimal('total_expenses', { precision: 12, scale: 2 }).default('0'),
    netCommission: decimal('net_commission', { precision: 12, scale: 2 }), // comissão líquida
    status: text('status').default('pending'), // pending, completed, cancelled
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
});

// Deal Expenses (Despesas de Negociação)
export const dealExpenses = pgTable('deal_expenses', {
    id: serial('id').primaryKey(),
    dealId: integer('deal_id').notNull().references(() => deals.id, { onDelete: 'cascade' }),
    category: text('category').notNull(), // marketing, photography, documentation, etc
    description: text('description'),
    value: decimal('value', { precision: 12, scale: 2 }).notNull(),
    createdAt: timestamp('created_at').defaultNow(),
});

// Deal Participants (Distribuição de Comissão)
export const dealParticipants = pgTable('deal_participants', {
    id: serial('id').primaryKey(),
    dealId: integer('deal_id').notNull().references(() => deals.id, { onDelete: 'cascade' }),
    brokerId: integer('broker_id').references(() => brokers.id),
    participantName: text('participant_name'), // para externos não cadastrados
    participantType: text('participant_type').notNull(), // 'company', 'broker', 'external'
    role: text('role'), // 'seller', 'buyer_agent', 'listing_agent'
    commissionPercent: decimal('commission_percent', { precision: 5, scale: 2 }),
    commissionValue: decimal('commission_value', { precision: 12, scale: 2 }),
    isResponsible: boolean('is_responsible').default(false), // responsável pela venda
    contributesToMeta: boolean('contributes_to_meta').default(true),
    metaShareValue: decimal('meta_share_value', { precision: 12, scale: 2 }), // valor rateado para meta
    createdAt: timestamp('created_at').defaultNow(),
});

// Payments (Pagamentos de Comissões e Reembolsos)
export const payments = pgTable('payments', {
    id: serial('id').primaryKey(),
    tenantId: integer('tenant_id').notNull().references(() => tenants.id),
    brokerId: integer('broker_id').notNull().references(() => brokers.id),
    dealId: integer('deal_id').references(() => deals.id), // opcional, para comissões vinculadas a vendas
    dealParticipantId: integer('deal_participant_id').references(() => dealParticipants.id), // para rastrear participação específica
    type: text('type').notNull(), // 'commission' ou 'reimbursement'
    description: text('description'),
    amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
    referenceMonth: integer('reference_month').notNull(), // 1-12
    referenceYear: integer('reference_year').notNull(),
    status: text('status').default('pending'), // pending, paid, cancelled
    paidAt: timestamp('paid_at'),
    receiptUrl: text('receipt_url'), // comprovante de pagamento anexado
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
});
