import { mysqlTable, varchar, text, decimal, int, date, datetime, mysqlEnum } from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';

export const users = mysqlTable('users', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role: mysqlEnum('role', ['admin', 'user']).default('user').notNull(),
  createdAt: datetime('created_at').default(new Date()).notNull(),
  updatedAt: datetime('updated_at').default(new Date()).notNull(),
});

export const products = mysqlTable('products', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  internalCode: varchar('codigo_interno', { length: 100 }).notNull().unique(),
  barcode: varchar('barcode', { length: 100 }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  salePrice: decimal('preco_venda', { precision: 10, scale: 2 }).notNull(),
  costPrice: decimal('preco_custo', { precision: 10, scale: 2 }).notNull(),
  totalEntry: int('qtd_entrada_total').default(0).notNull(),
  totalExit: int('qtd_saida_total').default(0).notNull(),
  currentQuantity: int('qtd_atual').default(0).notNull(),
  lowStockThreshold: int('low_stock_threshold').default(1).notNull(),
  lastPurchaseDate: date('data_ultima_compra'),
  ncm: varchar('ncm', { length: 20 }),
  cfopEntry: varchar('cfop_entrada', { length: 10 }),
  cst: varchar('cst', { length: 10 }),
  supplierId: varchar('fornecedor_id', { length: 36 }),
  createdAt: datetime('created_at').default(new Date()).notNull(),
  updatedAt: datetime('updated_at').default(new Date()).notNull(),
});

export const movements = mysqlTable('movements', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  productId: varchar('produto_id', { length: 36 }).references(() => products.id).notNull(),
  type: mysqlEnum('tipo', ['entrada', 'saida']).notNull(),
  quantity: int('quantidade').notNull(),
  unitPrice: decimal('preco_unitario', { precision: 10, scale: 2 }).notNull(),
  date: date('data').notNull(),
  reference: varchar('referencia', { length: 255 }),
  userId: varchar('usuario_id', { length: 36 }).references(() => users.id),
  createdAt: datetime('created_at').default(new Date()).notNull(),
});

export const importLogs = mysqlTable('import_logs', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  fileName: varchar('arquivo_nome', { length: 255 }).notNull(),
  importDate: datetime('data_import').default(new Date()).notNull(),
  totalItems: int('total_itens').notNull(),
  errors: text('erros'),
});

export const alerts = mysqlTable('alerts', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  productId: varchar('produto_id', { length: 36 }).references(() => products.id).notNull(),
  message: text('message').notNull(),
  isActive: int('is_active').default(1).notNull(),
  createdAt: datetime('created_at').default(new Date()).notNull(),
});

export const sales = mysqlTable('sales', {
  id: varchar('id', { length: 191 }).primaryKey(),
  productId: varchar('product_id', { length: 191 }).notNull().references(() => products.id),
  quantity: int('quantity').notNull(),
  unitPrice: varchar('unit_price', { length: 255 }).notNull(),
  totalPrice: varchar('total_price', { length: 255 }).notNull(),
  date: datetime('date').notNull(),
  status: varchar('status', { length: 50 }).default('active').notNull(), // 'active' or 'cancelled'
  userId: varchar('user_id', { length: 191 }).notNull(),
});

// Relations
export const productsRelations = relations(products, ({ many }) => ({
  movements: many(movements),
  alerts: many(alerts),
}));

export const movementsRelations = relations(movements, ({ one }) => ({
  product: one(products, {
    fields: [movements.productId],
    references: [products.id],
  }),
  user: one(users, {
    fields: [movements.userId],
    references: [users.id],
  }),
}));

export const alertsRelations = relations(alerts, ({ one }) => ({
  product: one(products, {
    fields: [alerts.productId],
    references: [products.id],
  }),
}));