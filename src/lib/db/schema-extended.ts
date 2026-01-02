import { mysqlTable, varchar, text, decimal, int, date, datetime, mysqlEnum, boolean, json } from 'drizzle-orm/mysql-core';
import { relations, sql } from 'drizzle-orm';

// =====================================================
// 1. PLANOS DE ASSINATURA
// =====================================================
export const subscriptionPlans = mysqlTable('subscription_plans', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 50 }).notNull().unique(),
  description: text('description'),
  priceMonthly: decimal('price_monthly', { precision: 10, scale: 2 }).notNull(),
  priceYearly: decimal('price_yearly', { precision: 10, scale: 2 }),
  
  // Limites do plano
  maxBusinesses: int('max_businesses').default(1).notNull(),
  maxEmployeesPerBusiness: int('max_employees_per_business').default(5).notNull(),
  maxProducts: int('max_products').default(1000).notNull(),
  maxMonthlyInvoices: int('max_monthly_invoices').default(100).notNull(),
  storageLimitMb: int('storage_limit_mb').default(1024).notNull(),
  
  // Features habilitadas (JSON para flexibilidade)
  features: json('features').$type<{
    nfe?: boolean;
    nfse?: boolean;
    marketplaceIntegration?: boolean;
    multiWarehouse?: boolean;
    apiAccess?: boolean;
  }>(),
  
  isActive: boolean('is_active').default(true).notNull(),
  sortOrder: int('sort_order').default(0),
  
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: datetime('updated_at').default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`).notNull(),
});

// =====================================================
// 2. TENANTS (NEGÓCIOS/EMPRESAS)
// =====================================================
export const tenants = mysqlTable('tenants', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  ownerId: varchar('owner_id', { length: 36 }).notNull(),
  planId: varchar('plan_id', { length: 36 }).notNull(),
  
  // Dados da empresa
  businessName: varchar('business_name', { length: 255 }).notNull(),
  tradingName: varchar('trading_name', { length: 255 }),
  taxId: varchar('tax_id', { length: 18 }).notNull(), // CNPJ
  stateRegistration: varchar('state_registration', { length: 20 }),
  municipalRegistration: varchar('municipal_registration', { length: 20 }),
  
  // Dados de contato
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 20 }),
  website: varchar('website', { length: 255 }),
  logoUrl: varchar('logo_url', { length: 500 }),
  
  // Endereço
  addressStreet: varchar('address_street', { length: 255 }),
  addressNumber: varchar('address_number', { length: 20 }),
  addressComplement: varchar('address_complement', { length: 100 }),
  addressNeighborhood: varchar('address_neighborhood', { length: 100 }),
  addressCity: varchar('address_city', { length: 100 }),
  addressState: varchar('address_state', { length: 2 }),
  addressZipcode: varchar('address_zipcode', { length: 10 }),
  
  // Configurações fiscais
  taxRegime: mysqlEnum('tax_regime', ['simples_nacional', 'lucro_presumido', 'lucro_real', 'mei']).notNull(),
  crt: int('crt').notNull(), // Código de Regime Tributário
  
  // Status da assinatura
  subscriptionStatus: mysqlEnum('subscription_status', ['active', 'suspended', 'cancelled', 'trial']).default('trial'),
  subscriptionStartsAt: datetime('subscription_starts_at'),
  subscriptionEndsAt: datetime('subscription_ends_at'),
  trialEndsAt: datetime('trial_ends_at'),
  
  // Configurações personalizadas
  settings: json('settings').$type<{
    defaultWarehouseId?: string;
    currency?: string;
    timezone?: string;
  }>(),
  
  isActive: boolean('is_active').default(true).notNull(),
  
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: datetime('updated_at').default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`).notNull(),
});

// =====================================================
// 3. ROLES (CARGOS/PERMISSÕES)
// =====================================================
export const roles = mysqlTable('roles', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  tenantId: varchar('tenant_id', { length: 36 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 50 }).notNull(),
  description: text('description'),
  
  // Permissões em formato JSON
  permissions: json('permissions').$type<{
    products?: ('view' | 'create' | 'edit' | 'delete')[];
    sales?: ('view' | 'create' | 'cancel')[];
    inventory?: ('view' | 'manage' | 'adjust')[];
    reports?: ('view' | 'export')[];
    settings?: ('view' | 'edit')[];
    invoices?: ('view' | 'issue')[];
    customers?: ('view' | 'create' | 'edit' | 'delete')[];
    suppliers?: ('view' | 'create' | 'edit' | 'delete')[];
  }>().notNull(),
  
  isSystemRole: boolean('is_system_role').default(false),
  sortOrder: int('sort_order').default(0),
  
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: datetime('updated_at').default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`).notNull(),
});

// =====================================================
// 4. MEMBROS DO TENANT (USUÁRIOS VINCULADOS)
// =====================================================
export const tenantMemberships = mysqlTable('tenant_memberships', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  tenantId: varchar('tenant_id', { length: 36 }).notNull(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  roleId: varchar('role_id', { length: 36 }).notNull(),
  
  status: mysqlEnum('status', ['active', 'inactive', 'pending_invitation']).default('active'),
  invitationToken: varchar('invitation_token', { length: 255 }),
  invitationExpiresAt: datetime('invitation_expires_at'),
  
  joinedAt: datetime('joined_at').default(sql`CURRENT_TIMESTAMP`),
  lastAccess: datetime('last_access'),
  
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: datetime('updated_at').default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`).notNull(),
});

// =====================================================
// 5. CLIENTES
// =====================================================
export const customers = mysqlTable('customers', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  tenantId: varchar('tenant_id', { length: 36 }).notNull(),
  
  // Tipo e identificação
  type: mysqlEnum('type', ['pf', 'pj']).default('pf').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  taxId: varchar('tax_id', { length: 18 }), // CPF ou CNPJ
  stateRegistration: varchar('state_registration', { length: 20 }),
  
  // Contato
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 20 }),
  whatsapp: varchar('whatsapp', { length: 20 }),
  
  // Endereço
  addressStreet: varchar('address_street', { length: 255 }),
  addressNumber: varchar('address_number', { length: 20 }),
  addressComplement: varchar('address_complement', { length: 100 }),
  addressNeighborhood: varchar('address_neighborhood', { length: 100 }),
  addressCity: varchar('address_city', { length: 100 }),
  addressState: varchar('address_state', { length: 2 }),
  addressZipcode: varchar('address_zipcode', { length: 10 }),
  
  // Limites e condições
  creditLimit: decimal('credit_limit', { precision: 10, scale: 2 }).default('0'),
  notes: text('notes'),
  
  isActive: boolean('is_active').default(true).notNull(),
  
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: datetime('updated_at').default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`).notNull(),
});

// =====================================================
// 6. FORNECEDORES
// =====================================================
export const suppliers = mysqlTable('suppliers', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  tenantId: varchar('tenant_id', { length: 36 }).notNull(),
  
  name: varchar('name', { length: 255 }).notNull(),
  taxId: varchar('tax_id', { length: 18 }), // CNPJ
  stateRegistration: varchar('state_registration', { length: 20 }),
  
  // Contato
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 20 }),
  contactPerson: varchar('contact_person', { length: 255 }),
  
  // Endereço
  addressStreet: varchar('address_street', { length: 255 }),
  addressNumber: varchar('address_number', { length: 20 }),
  addressComplement: varchar('address_complement', { length: 100 }),
  addressNeighborhood: varchar('address_neighborhood', { length: 100 }),
  addressCity: varchar('address_city', { length: 100 }),
  addressState: varchar('address_state', { length: 2 }),
  addressZipcode: varchar('address_zipcode', { length: 10 }),
  
  notes: text('notes'),
  isActive: boolean('is_active').default(true).notNull(),
  
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: datetime('updated_at').default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`).notNull(),
});

// =====================================================
// 7. CATEGORIAS DE PRODUTOS
// =====================================================
export const productCategories = mysqlTable('product_categories', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  tenantId: varchar('tenant_id', { length: 36 }).notNull(),
  parentId: varchar('parent_id', { length: 36 }),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull(),
  description: text('description'),
  imageUrl: varchar('image_url', { length: 500 }),
  sortOrder: int('sort_order').default(0),
  isActive: boolean('is_active').default(true).notNull(),
  
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: datetime('updated_at').default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`).notNull(),
});

// =====================================================
// 8. DEPÓSITOS/ARMAZÉNS
// =====================================================
export const warehouses = mysqlTable('warehouses', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  tenantId: varchar('tenant_id', { length: 36 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 20 }),
  address: text('address'),
  isDefault: boolean('is_default').default(false),
  isActive: boolean('is_active').default(true).notNull(),
  
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: datetime('updated_at').default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`).notNull(),
});

// =====================================================
// 9. SESSÕES DE CAIXA (PDV)
// =====================================================
export const posSessions = mysqlTable('pos_sessions', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  tenantId: varchar('tenant_id', { length: 36 }).notNull(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  
  openedAt: datetime('opened_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  closedAt: datetime('closed_at'),
  
  openingBalance: decimal('opening_balance', { precision: 10, scale: 2 }).notNull(),
  closingBalance: decimal('closing_balance', { precision: 10, scale: 2 }),
  expectedBalance: decimal('expected_balance', { precision: 10, scale: 2 }),
  
  // Totais por forma de pagamento
  totalCash: decimal('total_cash', { precision: 10, scale: 2 }).default('0'),
  totalCard: decimal('total_card', { precision: 10, scale: 2 }).default('0'),
  totalPix: decimal('total_pix', { precision: 10, scale: 2 }).default('0'),
  totalOther: decimal('total_other', { precision: 10, scale: 2 }).default('0'),
  
  status: mysqlEnum('status', ['open', 'closed', 'reconciled']).default('open'),
  notes: text('notes'),
  
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: datetime('updated_at').default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`).notNull(),
});

// =====================================================
// 10. VENDAS (CABEÇALHO) - EXTENSÃO
// =====================================================
export const salesOrders = mysqlTable('sales_orders', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  tenantId: varchar('tenant_id', { length: 36 }).notNull(),
  sessionId: varchar('session_id', { length: 36 }),
  customerId: varchar('customer_id', { length: 36 }),
  userId: varchar('user_id', { length: 36 }).notNull(),
  
  orderNumber: varchar('order_number', { length: 50 }).notNull(),
  
  // Valores
  subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull(),
  discountAmount: decimal('discount_amount', { precision: 10, scale: 2 }).default('0'),
  discountPercent: decimal('discount_percent', { precision: 5, scale: 2 }).default('0'),
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  
  // Status
  status: mysqlEnum('status', ['pending', 'completed', 'cancelled', 'refunded']).default('pending'),
  paymentStatus: mysqlEnum('payment_status', ['pending', 'partial', 'paid', 'refunded']).default('pending'),
  
  saleDate: datetime('sale_date').default(sql`CURRENT_TIMESTAMP`).notNull(),
  notes: text('notes'),
  
  // Campos para garantia
  warrantyDays: int('warranty_days').default(0),
  warrantyExpiresAt: datetime('warranty_expires_at'),
  
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: datetime('updated_at').default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`).notNull(),
});

// =====================================================
// 11. ITENS DA VENDA
// =====================================================
export const salesOrderItems = mysqlTable('sales_order_items', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  salesOrderId: varchar('sales_order_id', { length: 36 }).notNull(),
  productId: varchar('product_id', { length: 36 }).notNull(),
  batchId: varchar('batch_id', { length: 36 }),
  
  quantity: int('quantity').notNull(),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
  costPrice: decimal('cost_price', { precision: 10, scale: 2 }),
  discountAmount: decimal('discount_amount', { precision: 10, scale: 2 }).default('0'),
  totalPrice: decimal('total_price', { precision: 10, scale: 2 }).notNull(),
  
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// =====================================================
// 12. PAGAMENTOS DA VENDA
// =====================================================
export const salesPayments = mysqlTable('sales_payments', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  salesOrderId: varchar('sales_order_id', { length: 36 }).notNull(),
  
  paymentMethod: mysqlEnum('payment_method', ['cash', 'credit_card', 'debit_card', 'pix', 'boleto', 'transfer', 'other']).notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  
  // Para cartão
  cardBrand: varchar('card_brand', { length: 50 }),
  cardLastDigits: varchar('card_last_digits', { length: 4 }),
  installments: int('installments').default(1),
  
  // Para PIX/Boleto
  transactionId: varchar('transaction_id', { length: 255 }),
  
  status: mysqlEnum('status', ['pending', 'confirmed', 'cancelled']).default('confirmed'),
  paidAt: datetime('paid_at').default(sql`CURRENT_TIMESTAMP`),
  
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// =====================================================
// 13. ALÍQUOTAS FISCAIS (IBS/CBS - REFORMA 2026)
// =====================================================
export const taxRates = mysqlTable('tax_rates', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  
  // Identificação
  ncm: varchar('ncm', { length: 10 }),
  cClassTrib: varchar('c_class_trib', { length: 20 }), // Código de Classificação Tributária
  description: varchar('description', { length: 255 }),
  
  // Alíquotas
  ibsRate: decimal('ibs_rate', { precision: 5, scale: 4 }).default('0'), // Imposto sobre Bens e Serviços
  cbsRate: decimal('cbs_rate', { precision: 5, scale: 4 }).default('0'), // Contribuição sobre Bens e Serviços
  
  // Alíquotas anteriores (transição)
  icmsRate: decimal('icms_rate', { precision: 5, scale: 4 }).default('0'),
  pisRate: decimal('pis_rate', { precision: 5, scale: 4 }).default('0.0165'),
  cofinsRate: decimal('cofins_rate', { precision: 5, scale: 4 }).default('0.076'),
  
  // Vigência
  validFrom: date('valid_from').notNull(),
  validUntil: date('valid_until'),
  
  isActive: boolean('is_active').default(true).notNull(),
  
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: datetime('updated_at').default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`).notNull(),
});

// =====================================================
// 14. LOG DE AUDITORIA
// =====================================================
export const auditLogs = mysqlTable('audit_logs', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  tenantId: varchar('tenant_id', { length: 36 }),
  userId: varchar('user_id', { length: 36 }),
  
  action: varchar('action', { length: 50 }).notNull(), // 'create', 'update', 'delete', 'login', etc.
  tableName: varchar('table_name', { length: 100 }).notNull(),
  recordId: varchar('record_id', { length: 36 }),
  
  oldValues: json('old_values'),
  newValues: json('new_values'),
  
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: varchar('user_agent', { length: 500 }),
  
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// =====================================================
// RELATIONS
// =====================================================

export const tenantsRelations = relations(tenants, ({ one, many }) => ({
  owner: one(subscriptionPlans, {
    fields: [tenants.planId],
    references: [subscriptionPlans.id],
  }),
  memberships: many(tenantMemberships),
  customers: many(customers),
  suppliers: many(suppliers),
  warehouses: many(warehouses),
  posSessions: many(posSessions),
  salesOrders: many(salesOrders),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [customers.tenantId],
    references: [tenants.id],
  }),
  salesOrders: many(salesOrders),
}));

export const suppliersRelations = relations(suppliers, ({ one }) => ({
  tenant: one(tenants, {
    fields: [suppliers.tenantId],
    references: [tenants.id],
  }),
}));

export const salesOrdersRelations = relations(salesOrders, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [salesOrders.tenantId],
    references: [tenants.id],
  }),
  customer: one(customers, {
    fields: [salesOrders.customerId],
    references: [customers.id],
  }),
  session: one(posSessions, {
    fields: [salesOrders.sessionId],
    references: [posSessions.id],
  }),
  items: many(salesOrderItems),
  payments: many(salesPayments),
}));

export const salesOrderItemsRelations = relations(salesOrderItems, ({ one }) => ({
  salesOrder: one(salesOrders, {
    fields: [salesOrderItems.salesOrderId],
    references: [salesOrders.id],
  }),
}));

export const salesPaymentsRelations = relations(salesPayments, ({ one }) => ({
  salesOrder: one(salesOrders, {
    fields: [salesPayments.salesOrderId],
    references: [salesOrders.id],
  }),
}));
