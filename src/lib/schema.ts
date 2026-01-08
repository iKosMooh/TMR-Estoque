import { mysqlTable, mysqlSchema, AnyMySqlColumn, foreignKey, primaryKey, varchar, text, int, datetime, json, mysqlEnum, decimal, date, unique, index, tinyint } from "drizzle-orm/mysql-core"
import { sql } from "drizzle-orm"

export const alerts = mysqlTable("alerts", {
	id: varchar({ length: 36 }).notNull(),
	produtoId: varchar("produto_id", { length: 36 }).notNull().references(() => products.id),
	message: text().notNull(),
	isActive: int("is_active").default(1).notNull(),
	createdAt: datetime("created_at", { mode: 'string'}).default('2025-12-11 14:18:23').notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "alerts_id"}),
]);

export const auditLogs = mysqlTable("audit_logs", {
	id: varchar({ length: 36 }).notNull(),
	tenantId: varchar("tenant_id", { length: 36 }),
	userId: varchar("user_id", { length: 36 }),
	action: varchar({ length: 100 }).notNull(),
	entityType: varchar("entity_type", { length: 100 }).notNull(),
	entityId: varchar("entity_id", { length: 36 }),
	oldValues: json("old_values"),
	newValues: json("new_values"),
	ipAddress: varchar("ip_address", { length: 50 }),
	userAgent: text("user_agent"),
	createdAt: datetime("created_at", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`),
},
(table) => [
	primaryKey({ columns: [table.id], name: "audit_logs_id"}),
]);

export const bankAccounts = mysqlTable("bank_accounts", {
	id: varchar({ length: 36 }).notNull(),
	tenantId: varchar("tenant_id", { length: 36 }),
	bankName: varchar("bank_name", { length: 255 }).notNull(),
	bankCode: varchar("bank_code", { length: 10 }),
	agency: varchar({ length: 20 }),
	accountNumber: varchar("account_number", { length: 50 }),
	accountType: mysqlEnum("account_type", ['checking','savings','payment']).notNull(),
	balance: decimal({ precision: 10, scale: 2 }).default('0.00'),
	isActive: int("is_active").default(1).notNull(),
	createdAt: datetime("created_at", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`),
	updatedAt: datetime("updated_at", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`),
},
(table) => [
	primaryKey({ columns: [table.id], name: "bank_accounts_id"}),
]);

export const customers = mysqlTable("customers", {
	id: varchar({ length: 36 }).notNull(),
	type: mysqlEnum(['pf','pj']).default('pf').notNull(),
	name: varchar({ length: 255 }).notNull(),
	cpfCnpj: varchar("cpf_cnpj", { length: 18 }),
	email: varchar({ length: 255 }),
	phone: varchar({ length: 20 }),
	mobile: varchar({ length: 20 }),
	addressStreet: varchar("address_street", { length: 255 }),
	addressNumber: varchar("address_number", { length: 20 }),
	addressComplement: varchar("address_complement", { length: 100 }),
	addressNeighborhood: varchar("address_neighborhood", { length: 100 }),
	addressCity: varchar("address_city", { length: 100 }),
	addressState: varchar("address_state", { length: 2 }),
	addressZipcode: varchar("address_zipcode", { length: 10 }),
	notes: text(),
	creditLimit: decimal("credit_limit", { precision: 10, scale: 2 }),
	isActive: int("is_active").default(1).notNull(),
	createdAt: datetime("created_at", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`),
	updatedAt: datetime("updated_at", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`),
},
(table) => [
	primaryKey({ columns: [table.id], name: "customers_id"}),
]);

export const financialCategories = mysqlTable("financial_categories", {
	id: varchar({ length: 36 }).notNull(),
	tenantId: varchar("tenant_id", { length: 36 }),
	parentId: varchar("parent_id", { length: 36 }),
	name: varchar({ length: 255 }).notNull(),
	type: mysqlEnum(['income','expense']).notNull(),
	isActive: int("is_active").default(1).notNull(),
	createdAt: datetime("created_at", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`),
},
(table) => [
	primaryKey({ columns: [table.id], name: "financial_categories_id"}),
]);

export const financialTransactions = mysqlTable("financial_transactions", {
	id: varchar({ length: 36 }).notNull(),
	tenantId: varchar("tenant_id", { length: 36 }),
	bankAccountId: varchar("bank_account_id", { length: 36 }),
	categoryId: varchar("category_id", { length: 36 }),
	transactionType: mysqlEnum("transaction_type", ['income','expense','transfer']).notNull(),
	description: varchar({ length: 500 }).notNull(),
	amount: decimal({ precision: 10, scale: 2 }).notNull(),
	customerId: varchar("customer_id", { length: 36 }),
	supplierId: varchar("supplier_id", { length: 36 }),
	saleId: varchar("sale_id", { length: 36 }),
	invoiceId: varchar("invoice_id", { length: 36 }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	dueDate: date("due_date", { mode: 'string' }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	paymentDate: date("payment_date", { mode: 'string' }),
	status: mysqlEnum(['pending','paid','overdue','cancelled','partially_paid']).default('pending'),
	paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }).default('0.00'),
	paymentMethod: varchar("payment_method", { length: 50 }),
	notes: text(),
	createdAt: datetime("created_at", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`),
	updatedAt: datetime("updated_at", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`),
},
(table) => [
	primaryKey({ columns: [table.id], name: "financial_transactions_id"}),
]);

export const importLogs = mysqlTable("import_logs", {
	id: varchar({ length: 36 }).notNull(),
	arquivoNome: varchar("arquivo_nome", { length: 255 }).notNull(),
	dataImport: datetime("data_import", { mode: 'string'}).default('2025-12-11 14:18:23').notNull(),
	totalItens: int("total_itens").notNull(),
	erros: text(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "import_logs_id"}),
]);

export const invoiceItems = mysqlTable("invoice_items", {
	id: varchar({ length: 36 }).notNull(),
	invoiceId: varchar("invoice_id", { length: 36 }).notNull(),
	productId: varchar("product_id", { length: 36 }),
	itemNumber: int("item_number").notNull(),
	code: varchar({ length: 100 }),
	description: varchar({ length: 500 }).notNull(),
	ncm: varchar({ length: 10 }),
	cfop: varchar({ length: 4 }).notNull(),
	unitOfMeasure: varchar("unit_of_measure", { length: 10 }),
	quantity: decimal({ precision: 10, scale: 3 }).notNull(),
	unitPrice: decimal("unit_price", { precision: 10, scale: 4 }).notNull(),
	totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
	discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default('0.00'),
	icmsBase: decimal("icms_base", { precision: 10, scale: 2 }).default('0.00'),
	icmsRate: decimal("icms_rate", { precision: 5, scale: 2 }).default('0.00'),
	icmsAmount: decimal("icms_amount", { precision: 10, scale: 2 }).default('0.00'),
	ipiRate: decimal("ipi_rate", { precision: 5, scale: 2 }).default('0.00'),
	ipiAmount: decimal("ipi_amount", { precision: 10, scale: 2 }).default('0.00'),
	pisRate: decimal("pis_rate", { precision: 5, scale: 2 }).default('0.00'),
	pisAmount: decimal("pis_amount", { precision: 10, scale: 2 }).default('0.00'),
	cofinsRate: decimal("cofins_rate", { precision: 5, scale: 2 }).default('0.00'),
	cofinsAmount: decimal("cofins_amount", { precision: 10, scale: 2 }).default('0.00'),
	ibsRate: decimal("ibs_rate", { precision: 5, scale: 2 }).default('0.00'),
	ibsAmount: decimal("ibs_amount", { precision: 10, scale: 2 }).default('0.00'),
	cbsRate: decimal("cbs_rate", { precision: 5, scale: 2 }).default('0.00'),
	cbsAmount: decimal("cbs_amount", { precision: 10, scale: 2 }).default('0.00'),
	createdAt: datetime("created_at", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`),
},
(table) => [
	primaryKey({ columns: [table.id], name: "invoice_items_id"}),
]);

export const invoices = mysqlTable("invoices", {
	id: varchar({ length: 36 }).notNull(),
	tenantId: varchar("tenant_id", { length: 36 }),
	saleId: varchar("sale_id", { length: 36 }),
	customerId: varchar("customer_id", { length: 36 }),
	supplierId: varchar("supplier_id", { length: 36 }),
	invoiceType: mysqlEnum("invoice_type", ['nfe','nfse','nfce']).notNull(),
	direction: mysqlEnum(['inbound','outbound']).notNull(),
	series: int().notNull(),
	number: int().notNull(),
	accessKey: varchar("access_key", { length: 44 }),
	status: mysqlEnum(['draft','pending','authorized','rejected','cancelled','denied']).default('draft'),
	authorizationProtocol: varchar("authorization_protocol", { length: 50 }),
	authorizationDate: datetime("authorization_date", { mode: 'string'}),
	issueDate: datetime("issue_date", { mode: 'string'}).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	operationDate: date("operation_date", { mode: 'string' }),
	totalProducts: decimal("total_products", { precision: 10, scale: 2 }).notNull(),
	totalServices: decimal("total_services", { precision: 10, scale: 2 }).default('0.00'),
	discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default('0.00'),
	shippingAmount: decimal("shipping_amount", { precision: 10, scale: 2 }).default('0.00'),
	icmsBase: decimal("icms_base", { precision: 10, scale: 2 }).default('0.00'),
	icmsAmount: decimal("icms_amount", { precision: 10, scale: 2 }).default('0.00'),
	ipiAmount: decimal("ipi_amount", { precision: 10, scale: 2 }).default('0.00'),
	pisAmount: decimal("pis_amount", { precision: 10, scale: 2 }).default('0.00'),
	cofinsAmount: decimal("cofins_amount", { precision: 10, scale: 2 }).default('0.00'),
	ibsAmount: decimal("ibs_amount", { precision: 10, scale: 2 }).default('0.00'),
	cbsAmount: decimal("cbs_amount", { precision: 10, scale: 2 }).default('0.00'),
	totalTax: decimal("total_tax", { precision: 10, scale: 2 }).default('0.00'),
	totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
	cfop: varchar({ length: 4 }),
	operationNature: varchar("operation_nature", { length: 255 }),
	xmlContent: text("xml_content"),
	pdfUrl: varchar("pdf_url", { length: 500 }),
	notes: text(),
	createdAt: datetime("created_at", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`),
	updatedAt: datetime("updated_at", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`),
},
(table) => [
	primaryKey({ columns: [table.id], name: "invoices_id"}),
]);

export const movements = mysqlTable("movements", {
	id: varchar({ length: 36 }).notNull(),
	produtoId: varchar("produto_id", { length: 36 }).notNull().references(() => products.id),
	tipo: mysqlEnum(['entrada','saida']).notNull(),
	quantidade: int().notNull(),
	precoUnitario: decimal("preco_unitario", { precision: 10, scale: 2 }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	data: date({ mode: 'string' }).notNull(),
	referencia: varchar({ length: 255 }),
	usuarioId: varchar("usuario_id", { length: 36 }).references(() => users.id),
	createdAt: datetime("created_at", { mode: 'string'}).default('2025-12-11 14:18:23').notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "movements_id"}),
]);

export const posSessions = mysqlTable("pos_sessions", {
	id: varchar({ length: 36 }).notNull(),
	userId: varchar("user_id", { length: 36 }).notNull(),
	openedAt: datetime("opened_at", { mode: 'string'}).notNull(),
	closedAt: datetime("closed_at", { mode: 'string'}),
	openingBalance: decimal("opening_balance", { precision: 10, scale: 2 }).default('0.00').notNull(),
	closingBalance: decimal("closing_balance", { precision: 10, scale: 2 }),
	cashSales: decimal("cash_sales", { precision: 10, scale: 2 }).default('0.00').notNull(),
	cardSales: decimal("card_sales", { precision: 10, scale: 2 }).default('0.00').notNull(),
	pixSales: decimal("pix_sales", { precision: 10, scale: 2 }).default('0.00').notNull(),
	otherSales: decimal("other_sales", { precision: 10, scale: 2 }).default('0.00').notNull(),
	totalSales: decimal("total_sales", { precision: 10, scale: 2 }).default('0.00').notNull(),
	status: mysqlEnum(['open','closed']).default('open').notNull(),
	notes: text(),
	createdAt: datetime("created_at", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`),
	updatedAt: datetime("updated_at", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`),
},
(table) => [
	primaryKey({ columns: [table.id], name: "pos_sessions_id"}),
]);

export const productBatches = mysqlTable("product_batches", {
	id: varchar({ length: 36 }).notNull(),
	productId: varchar("product_id", { length: 36 }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	purchaseDate: date("purchase_date", { mode: 'string' }).notNull(),
	costPrice: decimal("cost_price", { precision: 10, scale: 2 }).notNull(),
	sellingPrice: decimal("selling_price", { precision: 10, scale: 2 }).notNull(),
	quantityReceived: int("quantity_received").notNull(),
	quantityRemaining: int("quantity_remaining").notNull(),
	xmlReference: varchar("xml_reference", { length: 100 }),
	xmlCode: varchar("xml_code", { length: 100 }),
	observation: text(),
	// Campos de unidades
	unitsPerPackage: int("units_per_package").default(1),
	packageQuantityReceived: int("package_quantity_received").default(0),
	totalUnitsReceived: int("total_units_received").default(0),
	unitsRemaining: int("units_remaining").default(0),
},
(table) => [
	primaryKey({ columns: [table.id], name: "product_batches_id"}),
]);

export const productCategories = mysqlTable("product_categories", {
	id: varchar({ length: 36 }).notNull(),
	tenantId: varchar("tenant_id", { length: 36 }),
	parentId: varchar("parent_id", { length: 36 }),
	name: varchar({ length: 255 }).notNull(),
	slug: varchar({ length: 255 }).notNull(),
	description: text(),
	imageUrl: varchar("image_url", { length: 500 }),
	sortOrder: int("sort_order").default(0),
	isActive: int("is_active").default(1).notNull(),
	createdAt: datetime("created_at", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`),
	updatedAt: datetime("updated_at", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`),
},
(table) => [
	primaryKey({ columns: [table.id], name: "product_categories_id"}),
]);

export const productVariants = mysqlTable("product_variants", {
	id: varchar({ length: 36 }).notNull(),
	productId: varchar("product_id", { length: 36 }).notNull(),
	variantName: varchar("variant_name", { length: 255 }).notNull(),
	sku: varchar({ length: 100 }),
	barcode: varchar({ length: 100 }),
	costPrice: decimal("cost_price", { precision: 10, scale: 2 }),
	sellingPrice: decimal("selling_price", { precision: 10, scale: 2 }),
	currentStock: decimal("current_stock", { precision: 10, scale: 3 }).default('0.000'),
	attributes: json(),
	imageUrl: varchar("image_url", { length: 500 }),
	isActive: int("is_active").default(1).notNull(),
	createdAt: datetime("created_at", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`),
	updatedAt: datetime("updated_at", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`),
},
(table) => [
	primaryKey({ columns: [table.id], name: "product_variants_id"}),
]);

export const products = mysqlTable("products", {
	id: varchar({ length: 36 }).notNull(),
	codigoInterno: varchar("codigo_interno", { length: 100 }).notNull(),
	barcode: varchar({ length: 100 }),
	xmlCode: varchar("xml_code", { length: 100 }),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	precoVenda: decimal("preco_venda", { precision: 10, scale: 2 }).notNull(),
	precoCusto: decimal("preco_custo", { precision: 10, scale: 2 }).notNull(),
	qtdEntradaTotal: int("qtd_entrada_total").default(0).notNull(),
	qtdSaidaTotal: int("qtd_saida_total").default(0).notNull(),
	qtdAtual: int("qtd_atual").default(0).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	dataUltimaCompra: date("data_ultima_compra", { mode: 'string' }),
	ncm: varchar({ length: 20 }),
	cfopEntrada: varchar("cfop_entrada", { length: 10 }),
	cst: varchar({ length: 10 }),
	fornecedorId: varchar("fornecedor_id", { length: 36 }),
	createdAt: datetime("created_at", { mode: 'string'}).default('2025-12-11 14:18:23').notNull(),
	updatedAt: datetime("updated_at", { mode: 'string'}).default('2025-12-11 14:18:23').notNull(),
	estoqueBaixoLimite: int("estoque_baixo_limite").default(5).notNull(),
	lowStockThreshold: int("low_stock_threshold").default(1),
	sku: varchar({ length: 100 }),
	weight: decimal({ precision: 10, scale: 3 }),
	length: decimal({ precision: 10, scale: 2 }),
	width: decimal({ precision: 10, scale: 2 }),
	height: decimal({ precision: 10, scale: 2 }),
	categoryId: varchar("category_id", { length: 36 }),
	brandName: varchar("brand_name", { length: 255 }),
	manufacturer: varchar({ length: 255 }),
	shortDescription: text("short_description"),
	metaTitle: varchar("meta_title", { length: 255 }),
	metaDescription: text("meta_description"),
	tags: text(),
	warrantyMonths: int("warranty_months"),
	// Campos de tipo de produto e venda por unidade
	productType: mysqlEnum("product_type", ['simple', 'marketplace']).default('simple'),
	unitType: mysqlEnum("unit_type", ['package', 'unit']).default('package'),
	packageQuantity: int("package_quantity").default(0),
	unitsPerPackage: int("units_per_package").default(1),
	unitName: varchar("unit_name", { length: 50 }),
	packageName: varchar("package_name", { length: 50 }),
	sellByUnit: tinyint("sell_by_unit").default(0),
	unitPrice: decimal("unit_price", { precision: 10, scale: 2 }),
	qtdUnitsAvailable: int("qtd_units_available").default(0),
},
(table) => [
	primaryKey({ columns: [table.id], name: "products_id"}),
	unique("products_codigo_interno_unique").on(table.codigoInterno),
]);

export const roles = mysqlTable("roles", {
	id: varchar({ length: 36 }).notNull(),
	tenantId: varchar("tenant_id", { length: 36 }).notNull(),
	name: varchar({ length: 100 }).notNull(),
	slug: varchar({ length: 50 }).notNull(),
	description: text(),
	permissions: json().notNull(),
	isSystemRole: int("is_system_role").default(0),
	sortOrder: int("sort_order").default(0),
	createdAt: datetime("created_at", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`),
	updatedAt: datetime("updated_at", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`),
},
(table) => [
	primaryKey({ columns: [table.id], name: "roles_id"}),
]);

export const sales = mysqlTable("sales", {
	id: varchar({ length: 36 }).notNull(),
	productId: varchar("product_id", { length: 36 }).notNull(),
	quantity: int().notNull(),
	price: decimal({ precision: 10, scale: 2 }).notNull(),
	date: datetime({ mode: 'string'}).notNull(),
	userId: varchar("user_id", { length: 36 }),
	customerId: varchar("customer_id", { length: 36 }),
	sellerSignature: text("seller_signature"),
	sellerName: varchar("seller_name", { length: 255 }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "sales_id"}),
]);

export const salesOrderItems = mysqlTable("sales_order_items", {
	id: varchar({ length: 36 }).notNull(),
	orderId: varchar("order_id", { length: 36 }).notNull(),
	productId: varchar("product_id", { length: 36 }).notNull(),
	quantity: int().notNull(),
	unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
	discount: decimal({ precision: 10, scale: 2 }).default('0.00'),
	total: decimal({ precision: 10, scale: 2 }).notNull(),
	sellType: mysqlEnum("sell_type", ['package', 'unit']).default('package'),
	unitsSold: int("units_sold").default(0),
	createdAt: datetime("created_at", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`),
},
(table) => [
	primaryKey({ columns: [table.id], name: "sales_order_items_id"}),
]);

export const salesOrders = mysqlTable("sales_orders", {
	id: varchar({ length: 36 }).notNull(),
	orderNumber: varchar("order_number", { length: 20 }).notNull(),
	customerId: varchar("customer_id", { length: 36 }),
	posSessionId: varchar("pos_session_id", { length: 36 }),
	userId: varchar("user_id", { length: 36 }),
	sellerName: varchar("seller_name", { length: 255 }),
	sellerSignature: text("seller_signature"),
	subtotal: decimal({ precision: 10, scale: 2 }).notNull(),
	discount: decimal({ precision: 10, scale: 2 }).default('0.00'),
	total: decimal({ precision: 10, scale: 2 }).notNull(),
	paymentMethod: mysqlEnum("payment_method", ['cash','credit_card','debit_card','pix','boleto','credit_store','other']).default('cash'),
	status: mysqlEnum(['pending','completed','cancelled']).default('pending').notNull(),
	notes: text(),
	// Campos para crediário/fiado
	isCreditSale: tinyint("is_credit_sale").default(0),
	creditDueDate: date("credit_due_date", { mode: 'string' }),
	creditStatus: mysqlEnum("credit_status", ['pending','partial','paid']).default('pending'),
	createdAt: datetime("created_at", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`),
	updatedAt: datetime("updated_at", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`),
},
(table) => [
	primaryKey({ columns: [table.id], name: "sales_orders_id"}),
]);

export const serviceOrderHistory = mysqlTable("service_order_history", {
	id: varchar({ length: 36 }).notNull(),
	serviceOrderId: varchar("service_order_id", { length: 36 }).notNull(),
	fromStatus: varchar("from_status", { length: 50 }),
	toStatus: varchar("to_status", { length: 50 }).notNull(),
	notes: text(),
	userId: varchar("user_id", { length: 36 }),
	createdAt: datetime("created_at", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`),
},
(table) => [
	index("idx_service_order_history_order").on(table.serviceOrderId),
	index("idx_service_order_history_created").on(table.createdAt),
	primaryKey({ columns: [table.id], name: "service_order_history_id"}),
]);

export const serviceOrderItems = mysqlTable("service_order_items", {
	id: varchar({ length: 36 }).notNull(),
	serviceOrderId: varchar("service_order_id", { length: 36 }).notNull(),
	productId: varchar("product_id", { length: 36 }),
	type: mysqlEnum(['product','labor','other']).default('product').notNull(),
	description: varchar({ length: 255 }).notNull(),
	quantity: decimal({ precision: 10, scale: 3 }).default('1.000').notNull(),
	unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
	discount: decimal({ precision: 10, scale: 2 }).default('0.00'),
	total: decimal({ precision: 10, scale: 2 }).notNull(),
	createdAt: datetime("created_at", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`),
},
(table) => [
	index("idx_service_order_items_order").on(table.serviceOrderId),
	index("idx_service_order_items_product").on(table.productId),
	primaryKey({ columns: [table.id], name: "service_order_items_id"}),
]);

export const serviceOrders = mysqlTable("service_orders", {
	id: varchar({ length: 36 }).notNull(),
	orderNumber: varchar("order_number", { length: 20 }).notNull(),
	customerId: varchar("customer_id", { length: 36 }).notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	equipmentType: varchar("equipment_type", { length: 100 }),
	equipmentBrand: varchar("equipment_brand", { length: 100 }),
	equipmentModel: varchar("equipment_model", { length: 100 }),
	equipmentSerial: varchar("equipment_serial", { length: 100 }),
	reportedIssue: text("reported_issue"),
	diagnosis: text(),
	solution: text(),
	priority: mysqlEnum(['low','medium','high','urgent']).default('medium'),
	status: mysqlEnum(['pending','in_progress','waiting_parts','waiting_approval','completed','cancelled','delivered']).default('pending').notNull(),
	estimatedCost: decimal("estimated_cost", { precision: 10, scale: 2 }),
	laborCost: decimal("labor_cost", { precision: 10, scale: 2 }).default('0.00'),
	partsCost: decimal("parts_cost", { precision: 10, scale: 2 }).default('0.00'),
	totalCost: decimal("total_cost", { precision: 10, scale: 2 }).default('0.00'),
	warrantyMonths: int("warranty_months").default(0),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	warrantyUntil: date("warranty_until", { mode: 'string' }),
	receivedAt: datetime("received_at", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	estimatedCompletionDate: date("estimated_completion_date", { mode: 'string' }),
	completedAt: datetime("completed_at", { mode: 'string'}),
	deliveredAt: datetime("delivered_at", { mode: 'string'}),
	notes: text(),
	internalNotes: text("internal_notes"),
	createdAt: datetime("created_at", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`),
	updatedAt: datetime("updated_at", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`),
},
(table) => [
	index("idx_service_orders_customer").on(table.customerId),
	index("idx_service_orders_status").on(table.status),
	index("idx_service_orders_order_number").on(table.orderNumber),
	index("idx_service_orders_created").on(table.createdAt),
	primaryKey({ columns: [table.id], name: "service_orders_id"}),
]);

export const shipments = mysqlTable("shipments", {
	id: varchar({ length: 36 }).notNull(),
	tenantId: varchar("tenant_id", { length: 36 }),
	saleId: varchar("sale_id", { length: 36 }).notNull(),
	trackingCode: varchar("tracking_code", { length: 255 }),
	carrier: varchar({ length: 100 }),
	serviceType: varchar("service_type", { length: 100 }),
	weightKg: decimal("weight_kg", { precision: 10, scale: 3 }),
	lengthCm: decimal("length_cm", { precision: 10, scale: 2 }),
	widthCm: decimal("width_cm", { precision: 10, scale: 2 }),
	heightCm: decimal("height_cm", { precision: 10, scale: 2 }),
	shippingCost: decimal("shipping_cost", { precision: 10, scale: 2 }),
	declaredValue: decimal("declared_value", { precision: 10, scale: 2 }),
	status: mysqlEnum(['pending','shipped','in_transit','delivered','failed','returned']).default('pending'),
	shippedAt: datetime("shipped_at", { mode: 'string'}),
	deliveredAt: datetime("delivered_at", { mode: 'string'}),
	labelUrl: varchar("label_url", { length: 500 }),
	labelPrinted: int("label_printed").default(0),
	notes: text(),
	createdAt: datetime("created_at", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`),
	updatedAt: datetime("updated_at", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`),
},
(table) => [
	primaryKey({ columns: [table.id], name: "shipments_id"}),
]);

export const stockLevels = mysqlTable("stock_levels", {
	id: varchar({ length: 36 }).notNull(),
	productId: varchar("product_id", { length: 36 }).notNull(),
	warehouseId: varchar("warehouse_id", { length: 36 }).notNull(),
	batchId: varchar("batch_id", { length: 36 }),
	tenantId: varchar("tenant_id", { length: 36 }),
	quantity: decimal({ precision: 10, scale: 3 }).default('0.000').notNull(),
	reservedQuantity: decimal("reserved_quantity", { precision: 10, scale: 3 }).default('0.000'),
	updatedAt: datetime("updated_at", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`),
},
(table) => [
	primaryKey({ columns: [table.id], name: "stock_levels_id"}),
]);

export const subscriptionPlans = mysqlTable("subscription_plans", {
	id: varchar({ length: 36 }).notNull(),
	name: varchar({ length: 100 }).notNull(),
	slug: varchar({ length: 50 }).notNull(),
	description: text(),
	priceMonthly: decimal("price_monthly", { precision: 10, scale: 2 }).notNull(),
	priceYearly: decimal("price_yearly", { precision: 10, scale: 2 }),
	maxBusinesses: int("max_businesses").default(1).notNull(),
	maxEmployeesPerBusiness: int("max_employees_per_business").default(5).notNull(),
	maxProducts: int("max_products").default(1000).notNull(),
	maxMonthlyInvoices: int("max_monthly_invoices").default(100).notNull(),
	storageLimitMb: int("storage_limit_mb").default(1024).notNull(),
	features: json(),
	isActive: int("is_active").default(1).notNull(),
	sortOrder: int("sort_order").default(0),
	createdAt: datetime("created_at", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`),
	updatedAt: datetime("updated_at", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`),
},
(table) => [
	primaryKey({ columns: [table.id], name: "subscription_plans_id"}),
	unique("subscription_plans_slug_unique").on(table.slug),
]);

export const suppliers = mysqlTable("suppliers", {
	id: varchar({ length: 36 }).notNull(),
	companyName: varchar("company_name", { length: 255 }).notNull(),
	tradingName: varchar("trading_name", { length: 255 }),
	cnpj: varchar({ length: 18 }),
	stateRegistration: varchar("state_registration", { length: 20 }),
	email: varchar({ length: 255 }),
	phone: varchar({ length: 20 }),
	mobile: varchar({ length: 20 }),
	contactName: varchar("contact_name", { length: 100 }),
	addressStreet: varchar("address_street", { length: 255 }),
	addressNumber: varchar("address_number", { length: 20 }),
	addressComplement: varchar("address_complement", { length: 100 }),
	addressNeighborhood: varchar("address_neighborhood", { length: 100 }),
	addressCity: varchar("address_city", { length: 100 }),
	addressState: varchar("address_state", { length: 2 }),
	addressZipcode: varchar("address_zipcode", { length: 10 }),
	notes: text(),
	paymentTerms: varchar("payment_terms", { length: 100 }),
	isActive: int("is_active").default(1).notNull(),
	createdAt: datetime("created_at", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`),
	updatedAt: datetime("updated_at", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`),
},
(table) => [
	primaryKey({ columns: [table.id], name: "suppliers_id"}),
]);

export const systemAlerts = mysqlTable("system_alerts", {
	id: varchar({ length: 36 }).notNull(),
	tenantId: varchar("tenant_id", { length: 36 }),
	alertType: mysqlEnum("alert_type", ['low_stock','expiring_batch','certificate_expiring','payment_overdue','system']).notNull(),
	severity: mysqlEnum(['info','warning','error','critical']).notNull(),
	title: varchar({ length: 255 }).notNull(),
	message: text().notNull(),
	entityType: varchar("entity_type", { length: 100 }),
	entityId: varchar("entity_id", { length: 36 }),
	isRead: int("is_read").default(0),
	readAt: datetime("read_at", { mode: 'string'}),
	readBy: varchar("read_by", { length: 36 }),
	isActive: int("is_active").default(1).notNull(),
	createdAt: datetime("created_at", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`),
},
(table) => [
	primaryKey({ columns: [table.id], name: "system_alerts_id"}),
]);

export const tenantMemberships = mysqlTable("tenant_memberships", {
	id: varchar({ length: 36 }).notNull(),
	tenantId: varchar("tenant_id", { length: 36 }).notNull(),
	userId: varchar("user_id", { length: 36 }).notNull(),
	roleId: varchar("role_id", { length: 36 }).notNull(),
	status: mysqlEnum(['active','inactive','pending_invitation']).default('active'),
	invitationToken: varchar("invitation_token", { length: 255 }),
	invitationExpiresAt: datetime("invitation_expires_at", { mode: 'string'}),
	joinedAt: datetime("joined_at", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`),
	lastAccess: datetime("last_access", { mode: 'string'}),
	createdAt: datetime("created_at", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`),
	updatedAt: datetime("updated_at", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`),
},
(table) => [
	primaryKey({ columns: [table.id], name: "tenant_memberships_id"}),
]);

export const tenants = mysqlTable("tenants", {
	id: varchar({ length: 36 }).notNull(),
	ownerId: varchar("owner_id", { length: 36 }).notNull(),
	planId: varchar("plan_id", { length: 36 }).notNull(),
	businessName: varchar("business_name", { length: 255 }).notNull(),
	tradingName: varchar("trading_name", { length: 255 }),
	taxId: varchar("tax_id", { length: 18 }).notNull(),
	stateRegistration: varchar("state_registration", { length: 20 }),
	municipalRegistration: varchar("municipal_registration", { length: 20 }),
	email: varchar({ length: 255 }),
	phone: varchar({ length: 20 }),
	website: varchar({ length: 255 }),
	logoUrl: varchar("logo_url", { length: 500 }),
	addressStreet: varchar("address_street", { length: 255 }),
	addressNumber: varchar("address_number", { length: 20 }),
	addressComplement: varchar("address_complement", { length: 100 }),
	addressNeighborhood: varchar("address_neighborhood", { length: 100 }),
	addressCity: varchar("address_city", { length: 100 }),
	addressState: varchar("address_state", { length: 2 }),
	addressZipcode: varchar("address_zipcode", { length: 10 }),
	taxRegime: mysqlEnum("tax_regime", ['simples_nacional','lucro_presumido','lucro_real','mei']).notNull(),
	crt: tinyint().notNull(),
	nfeEnvironment: mysqlEnum("nfe_environment", ['production','homologation']).default('homologation'),
	nfeSeriesNumber: int("nfe_series_number").default(1),
	nfeNextNumber: int("nfe_next_number").default(1),
	nfseSeriesNumber: int("nfse_series_number").default(1),
	nfseNextNumber: int("nfse_next_number").default(1),
	subscriptionStatus: mysqlEnum("subscription_status", ['active','suspended','cancelled','trial']).default('trial'),
	subscriptionStartsAt: datetime("subscription_starts_at", { mode: 'string'}),
	subscriptionEndsAt: datetime("subscription_ends_at", { mode: 'string'}),
	trialEndsAt: datetime("trial_ends_at", { mode: 'string'}),
	settings: json(),
	isActive: int("is_active").default(1).notNull(),
	createdAt: datetime("created_at", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`),
	updatedAt: datetime("updated_at", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`),
},
(table) => [
	primaryKey({ columns: [table.id], name: "tenants_id"}),
]);

export const users = mysqlTable("users", {
	id: varchar({ length: 36 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	passwordHash: varchar("password_hash", { length: 255 }).notNull(),
	role: mysqlEnum(['admin','user']).default('user').notNull(),
	createdAt: datetime("created_at", { mode: 'string'}).default('2025-12-11 14:18:23').notNull(),
	updatedAt: datetime("updated_at", { mode: 'string'}).default('2025-12-11 14:18:23').notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "users_id"}),
	unique("users_email_unique").on(table.email),
]);

export const warehouses = mysqlTable("warehouses", {
	id: varchar({ length: 36 }).notNull(),
	tenantId: varchar("tenant_id", { length: 36 }),
	name: varchar({ length: 255 }).notNull(),
	code: varchar({ length: 50 }),
	description: text(),
	addressStreet: varchar("address_street", { length: 255 }),
	addressNumber: varchar("address_number", { length: 20 }),
	addressCity: varchar("address_city", { length: 100 }),
	addressState: varchar("address_state", { length: 2 }),
	isMain: int("is_main").default(0),
	isActive: int("is_active").default(1).notNull(),
	createdAt: datetime("created_at", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`),
	updatedAt: datetime("updated_at", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`),
},
(table) => [
	primaryKey({ columns: [table.id], name: "warehouses_id"}),
]);
