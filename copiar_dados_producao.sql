-- =====================================================
-- SCRIPT PARA COPIAR TODOS OS DADOS DA PRODUÇÃO
-- TMR Auto Elétrica - Estoque Simples
-- =====================================================

-- Execute este script conectado ao servidor de PRODUÇÃO (177.137.148.133)
-- O script vai criar tabelas que não existirem e copiar dados de tmr_auto_eletrica para tmr_auto_eletrica_dev

-- =====================================================
-- TABELAS EXISTENTES NO DRIZZLE SCHEMA:
-- =====================================================
-- alerts, audit_logs, bank_accounts, customers, financial_categories,
-- financial_transactions, import_logs, invoice_items, invoices, movements,
-- pos_sessions, product_batches, product_categories, product_variants, products,
-- roles, sales, sales_order_items, sales_orders, service_order_history,
-- service_order_items, service_orders, shipments, stock_levels,
-- subscription_plans, suppliers, system_alerts, tenant_memberships, tenants,
-- users, warehouses

-- =====================================================
-- CONFIGURAÇÕES INICIAIS
-- =====================================================

SET FOREIGN_KEY_CHECKS = 0;
SET UNIQUE_CHECKS = 0;
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- =====================================================
-- CRIAR TABELAS QUE NÃO EXISTEM NO DEV (copia estrutura da produção)
-- =====================================================

CREATE TABLE IF NOT EXISTS tmr_auto_eletrica_dev.alerts LIKE tmr_auto_eletrica.alerts;
CREATE TABLE IF NOT EXISTS tmr_auto_eletrica_dev.audit_logs LIKE tmr_auto_eletrica.audit_logs;
CREATE TABLE IF NOT EXISTS tmr_auto_eletrica_dev.bank_accounts LIKE tmr_auto_eletrica.bank_accounts;
CREATE TABLE IF NOT EXISTS tmr_auto_eletrica_dev.customers LIKE tmr_auto_eletrica.customers;
CREATE TABLE IF NOT EXISTS tmr_auto_eletrica_dev.financial_categories LIKE tmr_auto_eletrica.financial_categories;
CREATE TABLE IF NOT EXISTS tmr_auto_eletrica_dev.financial_transactions LIKE tmr_auto_eletrica.financial_transactions;
CREATE TABLE IF NOT EXISTS tmr_auto_eletrica_dev.import_logs LIKE tmr_auto_eletrica.import_logs;
CREATE TABLE IF NOT EXISTS tmr_auto_eletrica_dev.invoice_items LIKE tmr_auto_eletrica.invoice_items;
CREATE TABLE IF NOT EXISTS tmr_auto_eletrica_dev.invoices LIKE tmr_auto_eletrica.invoices;
CREATE TABLE IF NOT EXISTS tmr_auto_eletrica_dev.movements LIKE tmr_auto_eletrica.movements;
CREATE TABLE IF NOT EXISTS tmr_auto_eletrica_dev.pos_sessions LIKE tmr_auto_eletrica.pos_sessions;
CREATE TABLE IF NOT EXISTS tmr_auto_eletrica_dev.product_batches LIKE tmr_auto_eletrica.product_batches;
CREATE TABLE IF NOT EXISTS tmr_auto_eletrica_dev.product_categories LIKE tmr_auto_eletrica.product_categories;
CREATE TABLE IF NOT EXISTS tmr_auto_eletrica_dev.product_variants LIKE tmr_auto_eletrica.product_variants;
CREATE TABLE IF NOT EXISTS tmr_auto_eletrica_dev.products LIKE tmr_auto_eletrica.products;
CREATE TABLE IF NOT EXISTS tmr_auto_eletrica_dev.roles LIKE tmr_auto_eletrica.roles;
CREATE TABLE IF NOT EXISTS tmr_auto_eletrica_dev.sales LIKE tmr_auto_eletrica.sales;
CREATE TABLE IF NOT EXISTS tmr_auto_eletrica_dev.sales_order_items LIKE tmr_auto_eletrica.sales_order_items;
CREATE TABLE IF NOT EXISTS tmr_auto_eletrica_dev.sales_orders LIKE tmr_auto_eletrica.sales_orders;
CREATE TABLE IF NOT EXISTS tmr_auto_eletrica_dev.service_order_history LIKE tmr_auto_eletrica.service_order_history;
CREATE TABLE IF NOT EXISTS tmr_auto_eletrica_dev.service_order_items LIKE tmr_auto_eletrica.service_order_items;
CREATE TABLE IF NOT EXISTS tmr_auto_eletrica_dev.service_orders LIKE tmr_auto_eletrica.service_orders;
CREATE TABLE IF NOT EXISTS tmr_auto_eletrica_dev.shipments LIKE tmr_auto_eletrica.shipments;
CREATE TABLE IF NOT EXISTS tmr_auto_eletrica_dev.stock_levels LIKE tmr_auto_eletrica.stock_levels;
CREATE TABLE IF NOT EXISTS tmr_auto_eletrica_dev.subscription_plans LIKE tmr_auto_eletrica.subscription_plans;
CREATE TABLE IF NOT EXISTS tmr_auto_eletrica_dev.suppliers LIKE tmr_auto_eletrica.suppliers;
CREATE TABLE IF NOT EXISTS tmr_auto_eletrica_dev.system_alerts LIKE tmr_auto_eletrica.system_alerts;
CREATE TABLE IF NOT EXISTS tmr_auto_eletrica_dev.tenant_memberships LIKE tmr_auto_eletrica.tenant_memberships;
CREATE TABLE IF NOT EXISTS tmr_auto_eletrica_dev.tenants LIKE tmr_auto_eletrica.tenants;
CREATE TABLE IF NOT EXISTS tmr_auto_eletrica_dev.users LIKE tmr_auto_eletrica.users;
CREATE TABLE IF NOT EXISTS tmr_auto_eletrica_dev.warehouses LIKE tmr_auto_eletrica.warehouses;

-- =====================================================
-- LIMPAR DADOS EXISTENTES NO DESENVOLVIMENTO
-- =====================================================

TRUNCATE TABLE tmr_auto_eletrica_dev.alerts;
TRUNCATE TABLE tmr_auto_eletrica_dev.audit_logs;
TRUNCATE TABLE tmr_auto_eletrica_dev.bank_accounts;
TRUNCATE TABLE tmr_auto_eletrica_dev.customers;
TRUNCATE TABLE tmr_auto_eletrica_dev.financial_categories;
TRUNCATE TABLE tmr_auto_eletrica_dev.financial_transactions;
TRUNCATE TABLE tmr_auto_eletrica_dev.import_logs;
TRUNCATE TABLE tmr_auto_eletrica_dev.invoice_items;
TRUNCATE TABLE tmr_auto_eletrica_dev.invoices;
TRUNCATE TABLE tmr_auto_eletrica_dev.movements;
TRUNCATE TABLE tmr_auto_eletrica_dev.pos_sessions;
TRUNCATE TABLE tmr_auto_eletrica_dev.product_batches;
TRUNCATE TABLE tmr_auto_eletrica_dev.product_categories;
TRUNCATE TABLE tmr_auto_eletrica_dev.product_variants;
TRUNCATE TABLE tmr_auto_eletrica_dev.products;
TRUNCATE TABLE tmr_auto_eletrica_dev.roles;
TRUNCATE TABLE tmr_auto_eletrica_dev.sales;
TRUNCATE TABLE tmr_auto_eletrica_dev.sales_order_items;
TRUNCATE TABLE tmr_auto_eletrica_dev.sales_orders;
TRUNCATE TABLE tmr_auto_eletrica_dev.service_order_history;
TRUNCATE TABLE tmr_auto_eletrica_dev.service_order_items;
TRUNCATE TABLE tmr_auto_eletrica_dev.service_orders;
TRUNCATE TABLE tmr_auto_eletrica_dev.shipments;
TRUNCATE TABLE tmr_auto_eletrica_dev.stock_levels;
TRUNCATE TABLE tmr_auto_eletrica_dev.subscription_plans;
TRUNCATE TABLE tmr_auto_eletrica_dev.suppliers;
TRUNCATE TABLE tmr_auto_eletrica_dev.system_alerts;
TRUNCATE TABLE tmr_auto_eletrica_dev.tenant_memberships;
TRUNCATE TABLE tmr_auto_eletrica_dev.tenants;
TRUNCATE TABLE tmr_auto_eletrica_dev.users;
TRUNCATE TABLE tmr_auto_eletrica_dev.warehouses;

-- =====================================================
-- COPIAR DADOS DE TODAS AS TABELAS
-- =====================================================

-- Tabelas independentes (sem foreign keys)
INSERT INTO tmr_auto_eletrica_dev.users SELECT * FROM tmr_auto_eletrica.users;
INSERT INTO tmr_auto_eletrica_dev.suppliers SELECT * FROM tmr_auto_eletrica.suppliers;
INSERT INTO tmr_auto_eletrica_dev.customers SELECT * FROM tmr_auto_eletrica.customers;
INSERT INTO tmr_auto_eletrica_dev.bank_accounts SELECT * FROM tmr_auto_eletrica.bank_accounts;
INSERT INTO tmr_auto_eletrica_dev.subscription_plans SELECT * FROM tmr_auto_eletrica.subscription_plans;
INSERT INTO tmr_auto_eletrica_dev.warehouses SELECT * FROM tmr_auto_eletrica.warehouses;
INSERT INTO tmr_auto_eletrica_dev.roles SELECT * FROM tmr_auto_eletrica.roles;
INSERT INTO tmr_auto_eletrica_dev.financial_categories SELECT * FROM tmr_auto_eletrica.financial_categories;
INSERT INTO tmr_auto_eletrica_dev.product_categories SELECT * FROM tmr_auto_eletrica.product_categories;

-- Tenants e memberships
INSERT INTO tmr_auto_eletrica_dev.tenants SELECT * FROM tmr_auto_eletrica.tenants;
INSERT INTO tmr_auto_eletrica_dev.tenant_memberships SELECT * FROM tmr_auto_eletrica.tenant_memberships;

-- Produtos e estoque
INSERT INTO tmr_auto_eletrica_dev.products 
    (id, codigo_interno, barcode, name, description, preco_venda, preco_custo,
     qtd_entrada_total, qtd_saida_total, qtd_atual, data_ultima_compra,
     ncm, cfop_entrada, cst, fornecedor_id, created_at, updated_at,
     estoque_baixo_limite, low_stock_threshold, sku, weight, length, width, height,
     category_id, brand_name, manufacturer, short_description, meta_title,
     meta_description, tags, warranty_months, product_type, unit_type,
     package_quantity, units_per_package, unit_name, package_name,
     sell_by_unit, unit_price, qtd_units_available)
SELECT 
    id, codigo_interno, barcode, name, description, preco_venda, preco_custo,
    qtd_entrada_total, qtd_saida_total, qtd_atual, data_ultima_compra,
    ncm, cfop_entrada, cst, fornecedor_id, created_at, updated_at,
    5 as estoque_baixo_limite,
    1 as low_stock_threshold,
    sku, weight, length, width, height, category_id, brand_name, manufacturer,
    short_description, meta_title, meta_description, tags, warranty_months,
    'simple' as product_type,
    'unit' as unit_type,
    1 as package_quantity,
    1 as units_per_package,
    'Unidade' as unit_name,
    'Caixa' as package_name,
    0 as sell_by_unit,
    NULL as unit_price,
    0 as qtd_units_available
FROM tmr_auto_eletrica.products;
INSERT INTO tmr_auto_eletrica_dev.product_variants SELECT * FROM tmr_auto_eletrica.product_variants;
INSERT INTO tmr_auto_eletrica_dev.product_batches SELECT * FROM tmr_auto_eletrica.product_batches;
INSERT INTO tmr_auto_eletrica_dev.stock_levels SELECT * FROM tmr_auto_eletrica.stock_levels;
INSERT INTO tmr_auto_eletrica_dev.movements SELECT * FROM tmr_auto_eletrica.movements;
INSERT INTO tmr_auto_eletrica_dev.alerts SELECT * FROM tmr_auto_eletrica.alerts;
INSERT INTO tmr_auto_eletrica_dev.system_alerts SELECT * FROM tmr_auto_eletrica.system_alerts;

-- Vendas e ordens
INSERT INTO tmr_auto_eletrica_dev.sales SELECT * FROM tmr_auto_eletrica.sales;
INSERT INTO tmr_auto_eletrica_dev.sales_orders SELECT * FROM tmr_auto_eletrica.sales_orders;
INSERT INTO tmr_auto_eletrica_dev.sales_order_items SELECT * FROM tmr_auto_eletrica.sales_order_items;

-- PDV
INSERT INTO tmr_auto_eletrica_dev.pos_sessions SELECT * FROM tmr_auto_eletrica.pos_sessions;

-- Ordens de serviço
INSERT INTO tmr_auto_eletrica_dev.service_orders SELECT * FROM tmr_auto_eletrica.service_orders;
INSERT INTO tmr_auto_eletrica_dev.service_order_items SELECT * FROM tmr_auto_eletrica.service_order_items;
INSERT INTO tmr_auto_eletrica_dev.service_order_history SELECT * FROM tmr_auto_eletrica.service_order_history;

-- Notas fiscais
INSERT INTO tmr_auto_eletrica_dev.invoices SELECT * FROM tmr_auto_eletrica.invoices;
INSERT INTO tmr_auto_eletrica_dev.invoice_items SELECT * FROM tmr_auto_eletrica.invoice_items;

-- Financeiro
INSERT INTO tmr_auto_eletrica_dev.financial_transactions SELECT * FROM tmr_auto_eletrica.financial_transactions;

-- Envios
INSERT INTO tmr_auto_eletrica_dev.shipments SELECT * FROM tmr_auto_eletrica.shipments;

-- Logs e auditoria
INSERT INTO tmr_auto_eletrica_dev.import_logs SELECT * FROM tmr_auto_eletrica.import_logs;
INSERT INTO tmr_auto_eletrica_dev.audit_logs SELECT * FROM tmr_auto_eletrica.audit_logs;

-- =====================================================
-- RESTAURAR CONFIGURAÇÕES
-- =====================================================

SET FOREIGN_KEY_CHECKS = 1;
SET UNIQUE_CHECKS = 1;

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

SELECT 'VERIFICAÇÃO DOS DADOS COPIADOS' as resultado;

SELECT 'users' as tabela, COUNT(*) as registros FROM tmr_auto_eletrica_dev.users
UNION ALL SELECT 'suppliers', COUNT(*) FROM tmr_auto_eletrica_dev.suppliers
UNION ALL SELECT 'customers', COUNT(*) FROM tmr_auto_eletrica_dev.customers
UNION ALL SELECT 'products', COUNT(*) FROM tmr_auto_eletrica_dev.products
UNION ALL SELECT 'product_batches', COUNT(*) FROM tmr_auto_eletrica_dev.product_batches
UNION ALL SELECT 'movements', COUNT(*) FROM tmr_auto_eletrica_dev.movements
UNION ALL SELECT 'sales', COUNT(*) FROM tmr_auto_eletrica_dev.sales
UNION ALL SELECT 'sales_orders', COUNT(*) FROM tmr_auto_eletrica_dev.sales_orders
UNION ALL SELECT 'sales_order_items', COUNT(*) FROM tmr_auto_eletrica_dev.sales_order_items
UNION ALL SELECT 'service_orders', COUNT(*) FROM tmr_auto_eletrica_dev.service_orders
UNION ALL SELECT 'service_order_items', COUNT(*) FROM tmr_auto_eletrica_dev.service_order_items
UNION ALL SELECT 'pos_sessions', COUNT(*) FROM tmr_auto_eletrica_dev.pos_sessions
UNION ALL SELECT 'invoices', COUNT(*) FROM tmr_auto_eletrica_dev.invoices
UNION ALL SELECT 'financial_transactions', COUNT(*) FROM tmr_auto_eletrica_dev.financial_transactions
UNION ALL SELECT 'bank_accounts', COUNT(*) FROM tmr_auto_eletrica_dev.bank_accounts;

SELECT 'CÓPIA CONCLUÍDA COM SUCESSO!' as resultado;
