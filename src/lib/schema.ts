import { mysqlTable, varchar, int, decimal, text, datetime, date, mysqlEnum, json, tinyint } from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

export const products = mysqlTable('products', {
  id: varchar('id', { length: 255 }).primaryKey(),
  internalCode: varchar('codigo_interno', { length: 255 }).notNull(),
  barcode: varchar('barcode', { length: 255 }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  salePrice: decimal('preco_venda', { precision: 10, scale: 2 }).notNull(),
  costPrice: decimal('preco_custo', { precision: 10, scale: 2 }).notNull(),
  currentQuantity: int('qtd_atual').notNull(),
  totalEntry: int('qtd_entrada_total').notNull(),
  totalExit: int('qtd_saida_total').notNull(),
  lastPurchaseDate: datetime('data_ultima_compra'),
  ncm: varchar('ncm', { length: 255 }),
  lowStockThreshold: int('estoque_baixo_limite').notNull(),
  // Campos para E-commerce
  sku: varchar('sku', { length: 100 }),
  weight: decimal('weight', { precision: 10, scale: 3 }),
  length: decimal('length', { precision: 10, scale: 2 }),
  width: decimal('width', { precision: 10, scale: 2 }),
  height: decimal('height', { precision: 10, scale: 2 }),
  categoryId: varchar('category_id', { length: 36 }),
  brandName: varchar('brand_name', { length: 255 }),
  manufacturer: varchar('manufacturer', { length: 255 }),
  shortDescription: text('short_description'),
  metaTitle: varchar('meta_title', { length: 255 }),
  metaDescription: text('meta_description'),
  tags: text('tags'),
  warrantyMonths: int('warranty_months'),
});

export const productBatches = mysqlTable('product_batches', {
  id: varchar('id', { length: 36 }).primaryKey(),
  productId: varchar('product_id', { length: 36 }).notNull(),
  purchaseDate: date('purchase_date').notNull(),
  costPrice: decimal('cost_price', { precision: 10, scale: 2 }).notNull(),
  sellingPrice: decimal('selling_price', { precision: 10, scale: 2 }).notNull(),
  quantityReceived: int('quantity_received').notNull(),
  quantityRemaining: int('quantity_remaining').notNull(),
  xmlReference: varchar('xml_reference', { length: 100 }),
  observation: text('observation'),
});

export const movements = mysqlTable('movements', {
  id: varchar('id', { length: 36 }).primaryKey(),
  produtoId: varchar('produto_id', { length: 36 }).notNull(),
  tipo: varchar('tipo', { length: 10 }).notNull(),
  quantidade: int('quantidade').notNull(),
  precoUnitario: decimal('preco_unitario', { precision: 10, scale: 2 }),
  data: datetime('data').notNull(),
  referencia: varchar('referencia', { length: 100 }),
});

export const users = mysqlTable('users', {
  id: varchar('id', { length: 36 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role: mysqlEnum('role', ['admin', 'user']).default('user'),
  createdAt: datetime('created_at').default(sql`NOW()`),
  updatedAt: datetime('updated_at').default(sql`NOW()`),
});

export const sales = mysqlTable('sales', {
  id: varchar('id', { length: 36 }).primaryKey(),
  productId: varchar('product_id', { length: 36 }).notNull(),
  quantity: int('quantity').notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  date: datetime('date').notNull(),
  userId: varchar('user_id', { length: 36 }),
});

export const importLogs = mysqlTable('import_logs', {
  id: varchar('id', { length: 36 }).primaryKey(),
  arquivoNome: varchar('arquivo_nome', { length: 255 }).notNull(),
  dataImport: datetime('data_import').notNull(),
  totalItens: int('total_itens').notNull(),
  erros: text('erros'),
});

export const alerts = mysqlTable('alerts', {
  id: varchar('id', { length: 36 }).primaryKey(),
  produtoId: varchar('produto_id', { length: 36 }).notNull(),
  message: text('message').notNull(),
  isActive: int('is_active').default(1),
  createdAt: datetime('created_at').default(sql`NOW()`),
});

// =====================================================
// CLIENTES
// =====================================================
export const customers = mysqlTable('customers', {
  id: varchar('id', { length: 36 }).primaryKey(),
  type: mysqlEnum('type', ['pf', 'pj']).default('pf').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  cpfCnpj: varchar('cpf_cnpj', { length: 18 }),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 20 }),
  mobile: varchar('mobile', { length: 20 }),
  addressStreet: varchar('address_street', { length: 255 }),
  addressNumber: varchar('address_number', { length: 20 }),
  addressComplement: varchar('address_complement', { length: 100 }),
  addressNeighborhood: varchar('address_neighborhood', { length: 100 }),
  addressCity: varchar('address_city', { length: 100 }),
  addressState: varchar('address_state', { length: 2 }),
  addressZipcode: varchar('address_zipcode', { length: 10 }),
  notes: text('notes'),
  creditLimit: decimal('credit_limit', { precision: 10, scale: 2 }),
  isActive: int('is_active').default(1).notNull(),
  createdAt: datetime('created_at').default(sql`NOW()`),
  updatedAt: datetime('updated_at').default(sql`NOW()`),
});

// =====================================================
// FORNECEDORES
// =====================================================
export const suppliers = mysqlTable('suppliers', {
  id: varchar('id', { length: 36 }).primaryKey(),
  companyName: varchar('company_name', { length: 255 }).notNull(),
  tradingName: varchar('trading_name', { length: 255 }),
  cnpj: varchar('cnpj', { length: 18 }),
  stateRegistration: varchar('state_registration', { length: 20 }),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 20 }),
  mobile: varchar('mobile', { length: 20 }),
  contactName: varchar('contact_name', { length: 100 }),
  addressStreet: varchar('address_street', { length: 255 }),
  addressNumber: varchar('address_number', { length: 20 }),
  addressComplement: varchar('address_complement', { length: 100 }),
  addressNeighborhood: varchar('address_neighborhood', { length: 100 }),
  addressCity: varchar('address_city', { length: 100 }),
  addressState: varchar('address_state', { length: 2 }),
  addressZipcode: varchar('address_zipcode', { length: 10 }),
  notes: text('notes'),
  paymentTerms: varchar('payment_terms', { length: 100 }),
  isActive: int('is_active').default(1).notNull(),
  createdAt: datetime('created_at').default(sql`NOW()`),
  updatedAt: datetime('updated_at').default(sql`NOW()`),
});

// =====================================================
// SESSÕES DE CAIXA (PDV)
// =====================================================
export const posSessions = mysqlTable('pos_sessions', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  openedAt: datetime('opened_at').notNull(),
  closedAt: datetime('closed_at'),
  openingBalance: decimal('opening_balance', { precision: 10, scale: 2 }).default('0').notNull(),
  closingBalance: decimal('closing_balance', { precision: 10, scale: 2 }),
  cashSales: decimal('cash_sales', { precision: 10, scale: 2 }).default('0').notNull(),
  cardSales: decimal('card_sales', { precision: 10, scale: 2 }).default('0').notNull(),
  pixSales: decimal('pix_sales', { precision: 10, scale: 2 }).default('0').notNull(),
  otherSales: decimal('other_sales', { precision: 10, scale: 2 }).default('0').notNull(),
  totalSales: decimal('total_sales', { precision: 10, scale: 2 }).default('0').notNull(),
  status: mysqlEnum('status', ['open', 'closed']).default('open').notNull(),
  notes: text('notes'),
  createdAt: datetime('created_at').default(sql`NOW()`),
  updatedAt: datetime('updated_at').default(sql`NOW()`),
});

// =====================================================
// PEDIDOS DE VENDA
// =====================================================
export const salesOrders = mysqlTable('sales_orders', {
  id: varchar('id', { length: 36 }).primaryKey(),
  orderNumber: varchar('order_number', { length: 20 }).notNull(),
  customerId: varchar('customer_id', { length: 36 }),
  posSessionId: varchar('pos_session_id', { length: 36 }),
  subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull(),
  discount: decimal('discount', { precision: 10, scale: 2 }).default('0'),
  total: decimal('total', { precision: 10, scale: 2 }).notNull(),
  paymentMethod: mysqlEnum('payment_method', ['cash', 'credit_card', 'debit_card', 'pix', 'boleto', 'other']).default('cash'),
  status: mysqlEnum('status', ['pending', 'completed', 'cancelled']).default('pending').notNull(),
  notes: text('notes'),
  createdAt: datetime('created_at').default(sql`NOW()`),
  updatedAt: datetime('updated_at').default(sql`NOW()`),
});

// =====================================================
// ITENS DO PEDIDO
// =====================================================
export const salesOrderItems = mysqlTable('sales_order_items', {
  id: varchar('id', { length: 36 }).primaryKey(),
  orderId: varchar('order_id', { length: 36 }).notNull(),
  productId: varchar('product_id', { length: 36 }).notNull(),
  quantity: int('quantity').notNull(),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
  discount: decimal('discount', { precision: 10, scale: 2 }).default('0'),
  total: decimal('total', { precision: 10, scale: 2 }).notNull(),
  createdAt: datetime('created_at').default(sql`NOW()`),
});

// =====================================================
// PLANOS DE ASSINATURA
// =====================================================
export const subscriptionPlans = mysqlTable('subscription_plans', {
  id: varchar('id', { length: 36 }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 50 }).notNull(),
  description: text('description'),
  priceMonthly: decimal('price_monthly', { precision: 10, scale: 2 }).notNull(),
  priceYearly: decimal('price_yearly', { precision: 10, scale: 2 }),
  maxBusinesses: int('max_businesses').default(1).notNull(),
  maxEmployeesPerBusiness: int('max_employees_per_business').default(5).notNull(),
  maxProducts: int('max_products').default(1000).notNull(),
  maxMonthlyInvoices: int('max_monthly_invoices').default(100).notNull(),
  storageLimitMb: int('storage_limit_mb').default(1024).notNull(),
  features: json('features'),
  isActive: int('is_active').default(1).notNull(),
  sortOrder: int('sort_order').default(0),
  createdAt: datetime('created_at').default(sql`NOW()`),
  updatedAt: datetime('updated_at').default(sql`NOW()`),
});

// =====================================================
// TENANTS (Empresas/Negócios)
// =====================================================
export const tenants = mysqlTable('tenants', {
  id: varchar('id', { length: 36 }).primaryKey(),
  ownerId: varchar('owner_id', { length: 36 }).notNull(),
  planId: varchar('plan_id', { length: 36 }).notNull(),
  businessName: varchar('business_name', { length: 255 }).notNull(),
  tradingName: varchar('trading_name', { length: 255 }),
  taxId: varchar('tax_id', { length: 18 }).notNull(),
  stateRegistration: varchar('state_registration', { length: 20 }),
  municipalRegistration: varchar('municipal_registration', { length: 20 }),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 20 }),
  website: varchar('website', { length: 255 }),
  logoUrl: varchar('logo_url', { length: 500 }),
  addressStreet: varchar('address_street', { length: 255 }),
  addressNumber: varchar('address_number', { length: 20 }),
  addressComplement: varchar('address_complement', { length: 100 }),
  addressNeighborhood: varchar('address_neighborhood', { length: 100 }),
  addressCity: varchar('address_city', { length: 100 }),
  addressState: varchar('address_state', { length: 2 }),
  addressZipcode: varchar('address_zipcode', { length: 10 }),
  taxRegime: mysqlEnum('tax_regime', ['simples_nacional', 'lucro_presumido', 'lucro_real', 'mei']).notNull(),
  crt: tinyint('crt').notNull(),
  nfeEnvironment: mysqlEnum('nfe_environment', ['production', 'homologation']).default('homologation'),
  nfeSeriesNumber: int('nfe_series_number').default(1),
  nfeNextNumber: int('nfe_next_number').default(1),
  nfseSeriesNumber: int('nfse_series_number').default(1),
  nfseNextNumber: int('nfse_next_number').default(1),
  subscriptionStatus: mysqlEnum('subscription_status', ['active', 'suspended', 'cancelled', 'trial']).default('trial'),
  subscriptionStartsAt: datetime('subscription_starts_at'),
  subscriptionEndsAt: datetime('subscription_ends_at'),
  trialEndsAt: datetime('trial_ends_at'),
  settings: json('settings'),
  isActive: int('is_active').default(1).notNull(),
  createdAt: datetime('created_at').default(sql`NOW()`),
  updatedAt: datetime('updated_at').default(sql`NOW()`),
});

// =====================================================
// PERFIS/CARGOS (RBAC)
// =====================================================
export const roles = mysqlTable('roles', {
  id: varchar('id', { length: 36 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 36 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 50 }).notNull(),
  description: text('description'),
  permissions: json('permissions').notNull(),
  isSystemRole: int('is_system_role').default(0),
  sortOrder: int('sort_order').default(0),
  createdAt: datetime('created_at').default(sql`NOW()`),
  updatedAt: datetime('updated_at').default(sql`NOW()`),
});

// =====================================================
// MEMBROS DO TENANT
// =====================================================
export const tenantMemberships = mysqlTable('tenant_memberships', {
  id: varchar('id', { length: 36 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 36 }).notNull(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  roleId: varchar('role_id', { length: 36 }).notNull(),
  status: mysqlEnum('status', ['active', 'inactive', 'pending_invitation']).default('active'),
  invitationToken: varchar('invitation_token', { length: 255 }),
  invitationExpiresAt: datetime('invitation_expires_at'),
  joinedAt: datetime('joined_at').default(sql`NOW()`),
  lastAccess: datetime('last_access'),
  createdAt: datetime('created_at').default(sql`NOW()`),
  updatedAt: datetime('updated_at').default(sql`NOW()`),
});

// =====================================================
// CATEGORIAS DE PRODUTOS
// =====================================================
export const productCategories = mysqlTable('product_categories', {
  id: varchar('id', { length: 36 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 36 }),
  parentId: varchar('parent_id', { length: 36 }),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull(),
  description: text('description'),
  imageUrl: varchar('image_url', { length: 500 }),
  sortOrder: int('sort_order').default(0),
  isActive: int('is_active').default(1).notNull(),
  createdAt: datetime('created_at').default(sql`NOW()`),
  updatedAt: datetime('updated_at').default(sql`NOW()`),
});

// =====================================================
// VARIAÇÕES DE PRODUTOS
// =====================================================
export const productVariants = mysqlTable('product_variants', {
  id: varchar('id', { length: 36 }).primaryKey(),
  productId: varchar('product_id', { length: 36 }).notNull(),
  variantName: varchar('variant_name', { length: 255 }).notNull(),
  sku: varchar('sku', { length: 100 }),
  barcode: varchar('barcode', { length: 100 }),
  costPrice: decimal('cost_price', { precision: 10, scale: 2 }),
  sellingPrice: decimal('selling_price', { precision: 10, scale: 2 }),
  currentStock: decimal('current_stock', { precision: 10, scale: 3 }).default('0'),
  attributes: json('attributes'),
  imageUrl: varchar('image_url', { length: 500 }),
  isActive: int('is_active').default(1).notNull(),
  createdAt: datetime('created_at').default(sql`NOW()`),
  updatedAt: datetime('updated_at').default(sql`NOW()`),
});

// =====================================================
// DEPÓSITOS/ARMAZÉNS
// =====================================================
export const warehouses = mysqlTable('warehouses', {
  id: varchar('id', { length: 36 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 36 }),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 50 }),
  description: text('description'),
  addressStreet: varchar('address_street', { length: 255 }),
  addressNumber: varchar('address_number', { length: 20 }),
  addressCity: varchar('address_city', { length: 100 }),
  addressState: varchar('address_state', { length: 2 }),
  isMain: int('is_main').default(0),
  isActive: int('is_active').default(1).notNull(),
  createdAt: datetime('created_at').default(sql`NOW()`),
  updatedAt: datetime('updated_at').default(sql`NOW()`),
});

// =====================================================
// NÍVEIS DE ESTOQUE POR DEPÓSITO
// =====================================================
export const stockLevels = mysqlTable('stock_levels', {
  id: varchar('id', { length: 36 }).primaryKey(),
  productId: varchar('product_id', { length: 36 }).notNull(),
  warehouseId: varchar('warehouse_id', { length: 36 }).notNull(),
  batchId: varchar('batch_id', { length: 36 }),
  tenantId: varchar('tenant_id', { length: 36 }),
  quantity: decimal('quantity', { precision: 10, scale: 3 }).default('0').notNull(),
  reservedQuantity: decimal('reserved_quantity', { precision: 10, scale: 3 }).default('0'),
  updatedAt: datetime('updated_at').default(sql`NOW()`),
});

// =====================================================
// CONTAS BANCÁRIAS
// =====================================================
export const bankAccounts = mysqlTable('bank_accounts', {
  id: varchar('id', { length: 36 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 36 }),
  bankName: varchar('bank_name', { length: 255 }).notNull(),
  bankCode: varchar('bank_code', { length: 10 }),
  agency: varchar('agency', { length: 20 }),
  accountNumber: varchar('account_number', { length: 50 }),
  accountType: mysqlEnum('account_type', ['checking', 'savings', 'payment']).notNull(),
  balance: decimal('balance', { precision: 10, scale: 2 }).default('0'),
  isActive: int('is_active').default(1).notNull(),
  createdAt: datetime('created_at').default(sql`NOW()`),
  updatedAt: datetime('updated_at').default(sql`NOW()`),
});

// =====================================================
// CATEGORIAS FINANCEIRAS
// =====================================================
export const financialCategories = mysqlTable('financial_categories', {
  id: varchar('id', { length: 36 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 36 }),
  parentId: varchar('parent_id', { length: 36 }),
  name: varchar('name', { length: 255 }).notNull(),
  type: mysqlEnum('type', ['income', 'expense']).notNull(),
  isActive: int('is_active').default(1).notNull(),
  createdAt: datetime('created_at').default(sql`NOW()`),
});

// =====================================================
// TRANSAÇÕES FINANCEIRAS
// =====================================================
export const financialTransactions = mysqlTable('financial_transactions', {
  id: varchar('id', { length: 36 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 36 }),
  bankAccountId: varchar('bank_account_id', { length: 36 }),
  categoryId: varchar('category_id', { length: 36 }),
  transactionType: mysqlEnum('transaction_type', ['income', 'expense', 'transfer']).notNull(),
  description: varchar('description', { length: 500 }).notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  customerId: varchar('customer_id', { length: 36 }),
  supplierId: varchar('supplier_id', { length: 36 }),
  saleId: varchar('sale_id', { length: 36 }),
  invoiceId: varchar('invoice_id', { length: 36 }),
  dueDate: date('due_date').notNull(),
  paymentDate: date('payment_date'),
  status: mysqlEnum('status', ['pending', 'paid', 'overdue', 'cancelled', 'partially_paid']).default('pending'),
  paidAmount: decimal('paid_amount', { precision: 10, scale: 2 }).default('0'),
  paymentMethod: varchar('payment_method', { length: 50 }),
  notes: text('notes'),
  createdAt: datetime('created_at').default(sql`NOW()`),
  updatedAt: datetime('updated_at').default(sql`NOW()`),
});

// =====================================================
// NOTAS FISCAIS
// =====================================================
export const invoices = mysqlTable('invoices', {
  id: varchar('id', { length: 36 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 36 }),
  saleId: varchar('sale_id', { length: 36 }),
  customerId: varchar('customer_id', { length: 36 }),
  supplierId: varchar('supplier_id', { length: 36 }),
  invoiceType: mysqlEnum('invoice_type', ['nfe', 'nfse', 'nfce']).notNull(),
  direction: mysqlEnum('direction', ['inbound', 'outbound']).notNull(),
  series: int('series').notNull(),
  number: int('number').notNull(),
  accessKey: varchar('access_key', { length: 44 }),
  status: mysqlEnum('status', ['draft', 'pending', 'authorized', 'rejected', 'cancelled', 'denied']).default('draft'),
  authorizationProtocol: varchar('authorization_protocol', { length: 50 }),
  authorizationDate: datetime('authorization_date'),
  issueDate: datetime('issue_date').notNull(),
  operationDate: date('operation_date'),
  totalProducts: decimal('total_products', { precision: 10, scale: 2 }).notNull(),
  totalServices: decimal('total_services', { precision: 10, scale: 2 }).default('0'),
  discountAmount: decimal('discount_amount', { precision: 10, scale: 2 }).default('0'),
  shippingAmount: decimal('shipping_amount', { precision: 10, scale: 2 }).default('0'),
  icmsBase: decimal('icms_base', { precision: 10, scale: 2 }).default('0'),
  icmsAmount: decimal('icms_amount', { precision: 10, scale: 2 }).default('0'),
  ipiAmount: decimal('ipi_amount', { precision: 10, scale: 2 }).default('0'),
  pisAmount: decimal('pis_amount', { precision: 10, scale: 2 }).default('0'),
  cofinsAmount: decimal('cofins_amount', { precision: 10, scale: 2 }).default('0'),
  ibsAmount: decimal('ibs_amount', { precision: 10, scale: 2 }).default('0'),
  cbsAmount: decimal('cbs_amount', { precision: 10, scale: 2 }).default('0'),
  totalTax: decimal('total_tax', { precision: 10, scale: 2 }).default('0'),
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  cfop: varchar('cfop', { length: 4 }),
  operationNature: varchar('operation_nature', { length: 255 }),
  xmlContent: text('xml_content'),
  pdfUrl: varchar('pdf_url', { length: 500 }),
  notes: text('notes'),
  createdAt: datetime('created_at').default(sql`NOW()`),
  updatedAt: datetime('updated_at').default(sql`NOW()`),
});

// =====================================================
// ITENS DA NOTA FISCAL
// =====================================================
export const invoiceItems = mysqlTable('invoice_items', {
  id: varchar('id', { length: 36 }).primaryKey(),
  invoiceId: varchar('invoice_id', { length: 36 }).notNull(),
  productId: varchar('product_id', { length: 36 }),
  itemNumber: int('item_number').notNull(),
  code: varchar('code', { length: 100 }),
  description: varchar('description', { length: 500 }).notNull(),
  ncm: varchar('ncm', { length: 10 }),
  cfop: varchar('cfop', { length: 4 }).notNull(),
  unitOfMeasure: varchar('unit_of_measure', { length: 10 }),
  quantity: decimal('quantity', { precision: 10, scale: 3 }).notNull(),
  unitPrice: decimal('unit_price', { precision: 10, scale: 4 }).notNull(),
  totalPrice: decimal('total_price', { precision: 10, scale: 2 }).notNull(),
  discountAmount: decimal('discount_amount', { precision: 10, scale: 2 }).default('0'),
  icmsBase: decimal('icms_base', { precision: 10, scale: 2 }).default('0'),
  icmsRate: decimal('icms_rate', { precision: 5, scale: 2 }).default('0'),
  icmsAmount: decimal('icms_amount', { precision: 10, scale: 2 }).default('0'),
  ipiRate: decimal('ipi_rate', { precision: 5, scale: 2 }).default('0'),
  ipiAmount: decimal('ipi_amount', { precision: 10, scale: 2 }).default('0'),
  pisRate: decimal('pis_rate', { precision: 5, scale: 2 }).default('0'),
  pisAmount: decimal('pis_amount', { precision: 10, scale: 2 }).default('0'),
  cofinsRate: decimal('cofins_rate', { precision: 5, scale: 2 }).default('0'),
  cofinsAmount: decimal('cofins_amount', { precision: 10, scale: 2 }).default('0'),
  ibsRate: decimal('ibs_rate', { precision: 5, scale: 2 }).default('0'),
  ibsAmount: decimal('ibs_amount', { precision: 10, scale: 2 }).default('0'),
  cbsRate: decimal('cbs_rate', { precision: 5, scale: 2 }).default('0'),
  cbsAmount: decimal('cbs_amount', { precision: 10, scale: 2 }).default('0'),
  createdAt: datetime('created_at').default(sql`NOW()`),
});

// =====================================================
// ENVIOS/EXPEDIÇÕES
// =====================================================
export const shipments = mysqlTable('shipments', {
  id: varchar('id', { length: 36 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 36 }),
  saleId: varchar('sale_id', { length: 36 }).notNull(),
  trackingCode: varchar('tracking_code', { length: 255 }),
  carrier: varchar('carrier', { length: 100 }),
  serviceType: varchar('service_type', { length: 100 }),
  weightKg: decimal('weight_kg', { precision: 10, scale: 3 }),
  lengthCm: decimal('length_cm', { precision: 10, scale: 2 }),
  widthCm: decimal('width_cm', { precision: 10, scale: 2 }),
  heightCm: decimal('height_cm', { precision: 10, scale: 2 }),
  shippingCost: decimal('shipping_cost', { precision: 10, scale: 2 }),
  declaredValue: decimal('declared_value', { precision: 10, scale: 2 }),
  status: mysqlEnum('status', ['pending', 'shipped', 'in_transit', 'delivered', 'failed', 'returned']).default('pending'),
  shippedAt: datetime('shipped_at'),
  deliveredAt: datetime('delivered_at'),
  labelUrl: varchar('label_url', { length: 500 }),
  labelPrinted: int('label_printed').default(0),
  notes: text('notes'),
  createdAt: datetime('created_at').default(sql`NOW()`),
  updatedAt: datetime('updated_at').default(sql`NOW()`),
});

// =====================================================
// LOGS DE AUDITORIA
// =====================================================
export const auditLogs = mysqlTable('audit_logs', {
  id: varchar('id', { length: 36 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 36 }),
  userId: varchar('user_id', { length: 36 }),
  action: varchar('action', { length: 100 }).notNull(),
  entityType: varchar('entity_type', { length: 100 }).notNull(),
  entityId: varchar('entity_id', { length: 36 }),
  oldValues: json('old_values'),
  newValues: json('new_values'),
  ipAddress: varchar('ip_address', { length: 50 }),
  userAgent: text('user_agent'),
  createdAt: datetime('created_at').default(sql`NOW()`),
});

// =====================================================
// ALERTAS DO SISTEMA
// =====================================================
export const systemAlerts = mysqlTable('system_alerts', {
  id: varchar('id', { length: 36 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 36 }),
  alertType: mysqlEnum('alert_type', ['low_stock', 'expiring_batch', 'certificate_expiring', 'payment_overdue', 'system']).notNull(),
  severity: mysqlEnum('severity', ['info', 'warning', 'error', 'critical']).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  entityType: varchar('entity_type', { length: 100 }),
  entityId: varchar('entity_id', { length: 36 }),
  isRead: int('is_read').default(0),
  readAt: datetime('read_at'),
  readBy: varchar('read_by', { length: 36 }),
  isActive: int('is_active').default(1).notNull(),
  createdAt: datetime('created_at').default(sql`NOW()`),
});
