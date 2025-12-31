import { mysqlTable, varchar, int, decimal, text, datetime, date, mysqlEnum } from 'drizzle-orm/mysql-core';
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
