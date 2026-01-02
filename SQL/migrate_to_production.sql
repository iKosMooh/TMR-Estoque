-- =====================================================
-- SCRIPT DE MIGRAÇÃO SEGURA PARA PRODUÇÃO
-- Banco: tmr_auto_eletrica
-- Data: 02/01/2026
-- =====================================================
-- Este script adiciona APENAS estruturas novas sem apagar dados existentes

-- =====================================================
-- TABELAS BASE EXISTENTES (apenas criar se não existir)
-- =====================================================

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS `users` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`role` enum('admin','user') DEFAULT 'user',
	`created_at` datetime DEFAULT NOW(),
	`updated_at` datetime DEFAULT NOW(),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	UNIQUE KEY `users_email_unique` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de produtos
CREATE TABLE IF NOT EXISTS `products` (
	`id` varchar(255) NOT NULL,
	`codigo_interno` varchar(255) NOT NULL,
	`barcode` varchar(255),
	`name` varchar(255) NOT NULL,
	`description` text,
	`preco_venda` decimal(10,2) NOT NULL,
	`preco_custo` decimal(10,2) NOT NULL,
	`qtd_atual` int NOT NULL DEFAULT 0,
	`qtd_entrada_total` int NOT NULL DEFAULT 0,
	`qtd_saida_total` int NOT NULL DEFAULT 0,
	`data_ultima_compra` datetime,
	`ncm` varchar(255),
	`estoque_baixo_limite` int NOT NULL DEFAULT 1,
	`cfop_entrada` varchar(10),
	`cst` varchar(10),
	`fornecedor_id` varchar(36),
	`created_at` datetime DEFAULT NOW(),
	`updated_at` datetime DEFAULT NOW(),
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	UNIQUE KEY `products_codigo_interno_unique` (`codigo_interno`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de lotes de produtos
CREATE TABLE IF NOT EXISTS `product_batches` (
	`id` varchar(36) NOT NULL,
	`product_id` varchar(36) NOT NULL,
	`purchase_date` date NOT NULL,
	`cost_price` decimal(10,2) NOT NULL,
	`selling_price` decimal(10,2) NOT NULL,
	`quantity_received` int NOT NULL,
	`quantity_remaining` int NOT NULL,
	`xml_reference` varchar(100),
	`observation` text,
	CONSTRAINT `product_batches_id` PRIMARY KEY(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de movimentações
CREATE TABLE IF NOT EXISTS `movements` (
	`id` varchar(36) NOT NULL,
	`produto_id` varchar(36) NOT NULL,
	`tipo` varchar(10) NOT NULL,
	`quantidade` int NOT NULL,
	`preco_unitario` decimal(10,2),
	`data` datetime NOT NULL,
	`referencia` varchar(100),
	`usuario_id` varchar(36),
	`created_at` datetime DEFAULT NOW(),
	CONSTRAINT `movements_id` PRIMARY KEY(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de alertas
CREATE TABLE IF NOT EXISTS `alerts` (
	`id` varchar(36) NOT NULL,
	`produto_id` varchar(36) NOT NULL,
	`message` text NOT NULL,
	`is_active` int DEFAULT 1,
	`created_at` datetime DEFAULT NOW(),
	CONSTRAINT `alerts_id` PRIMARY KEY(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de logs de importação
CREATE TABLE IF NOT EXISTS `import_logs` (
	`id` varchar(36) NOT NULL,
	`arquivo_nome` varchar(255) NOT NULL,
	`data_import` datetime NOT NULL,
	`total_itens` int NOT NULL,
	`erros` text,
	CONSTRAINT `import_logs_id` PRIMARY KEY(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de vendas (legacy)
CREATE TABLE IF NOT EXISTS `sales` (
	`id` varchar(191) NOT NULL,
	`product_id` varchar(191) NOT NULL,
	`quantity` int NOT NULL,
	`unit_price` varchar(255) NOT NULL,
	`total_price` varchar(255) NOT NULL,
	`date` datetime NOT NULL,
	`status` varchar(50) NOT NULL DEFAULT 'active',
	`user_id` varchar(191) NOT NULL,
	CONSTRAINT `sales_id` PRIMARY KEY(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- NOVAS TABELAS DO SISTEMA ERP
-- =====================================================

-- Clientes
CREATE TABLE IF NOT EXISTS `customers` (
	`id` varchar(36) NOT NULL,
	`type` enum('pf','pj') NOT NULL DEFAULT 'pf',
	`name` varchar(255) NOT NULL,
	`cpf_cnpj` varchar(18),
	`email` varchar(255),
	`phone` varchar(20),
	`mobile` varchar(20),
	`address_street` varchar(255),
	`address_number` varchar(20),
	`address_complement` varchar(100),
	`address_neighborhood` varchar(100),
	`address_city` varchar(100),
	`address_state` varchar(2),
	`address_zipcode` varchar(10),
	`notes` text,
	`credit_limit` decimal(10,2),
	`is_active` int NOT NULL DEFAULT 1,
	`created_at` datetime DEFAULT NOW(),
	`updated_at` datetime DEFAULT NOW(),
	CONSTRAINT `customers_id` PRIMARY KEY(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Fornecedores
CREATE TABLE IF NOT EXISTS `suppliers` (
	`id` varchar(36) NOT NULL,
	`company_name` varchar(255) NOT NULL,
	`trading_name` varchar(255),
	`cnpj` varchar(18),
	`state_registration` varchar(20),
	`email` varchar(255),
	`phone` varchar(20),
	`mobile` varchar(20),
	`contact_name` varchar(100),
	`address_street` varchar(255),
	`address_number` varchar(20),
	`address_complement` varchar(100),
	`address_neighborhood` varchar(100),
	`address_city` varchar(100),
	`address_state` varchar(2),
	`address_zipcode` varchar(10),
	`notes` text,
	`payment_terms` varchar(100),
	`is_active` int NOT NULL DEFAULT 1,
	`created_at` datetime DEFAULT NOW(),
	`updated_at` datetime DEFAULT NOW(),
	CONSTRAINT `suppliers_id` PRIMARY KEY(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sessões de PDV/Caixa
CREATE TABLE IF NOT EXISTS `pos_sessions` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`opened_at` datetime NOT NULL,
	`closed_at` datetime,
	`opening_balance` decimal(10,2) NOT NULL DEFAULT '0',
	`closing_balance` decimal(10,2),
	`cash_sales` decimal(10,2) NOT NULL DEFAULT '0',
	`card_sales` decimal(10,2) NOT NULL DEFAULT '0',
	`pix_sales` decimal(10,2) NOT NULL DEFAULT '0',
	`other_sales` decimal(10,2) NOT NULL DEFAULT '0',
	`total_sales` decimal(10,2) NOT NULL DEFAULT '0',
	`status` enum('open','closed') NOT NULL DEFAULT 'open',
	`notes` text,
	`created_at` datetime DEFAULT NOW(),
	`updated_at` datetime DEFAULT NOW(),
	CONSTRAINT `pos_sessions_id` PRIMARY KEY(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Pedidos de venda
CREATE TABLE IF NOT EXISTS `sales_orders` (
	`id` varchar(36) NOT NULL,
	`order_number` varchar(20) NOT NULL,
	`customer_id` varchar(36),
	`pos_session_id` varchar(36),
	`subtotal` decimal(10,2) NOT NULL,
	`discount` decimal(10,2) DEFAULT '0',
	`total` decimal(10,2) NOT NULL,
	`payment_method` enum('cash','credit_card','debit_card','pix','boleto','other') DEFAULT 'cash',
	`status` enum('pending','completed','cancelled') NOT NULL DEFAULT 'pending',
	`notes` text,
	`created_at` datetime DEFAULT NOW(),
	`updated_at` datetime DEFAULT NOW(),
	CONSTRAINT `sales_orders_id` PRIMARY KEY(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Itens dos pedidos de venda
CREATE TABLE IF NOT EXISTS `sales_order_items` (
	`id` varchar(36) NOT NULL,
	`order_id` varchar(36) NOT NULL,
	`product_id` varchar(36) NOT NULL,
	`quantity` int NOT NULL,
	`unit_price` decimal(10,2) NOT NULL,
	`discount` decimal(10,2) DEFAULT '0',
	`total` decimal(10,2) NOT NULL,
	`created_at` datetime DEFAULT NOW(),
	CONSTRAINT `sales_order_items_id` PRIMARY KEY(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Contas bancárias
CREATE TABLE IF NOT EXISTS `bank_accounts` (
	`id` varchar(36) NOT NULL,
	`tenant_id` varchar(36),
	`bank_name` varchar(255) NOT NULL,
	`bank_code` varchar(10),
	`agency` varchar(20),
	`account_number` varchar(50),
	`account_type` enum('checking','savings','payment') NOT NULL,
	`balance` decimal(10,2) DEFAULT '0',
	`is_active` int NOT NULL DEFAULT 1,
	`created_at` datetime DEFAULT NOW(),
	`updated_at` datetime DEFAULT NOW(),
	CONSTRAINT `bank_accounts_id` PRIMARY KEY(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Categorias financeiras
CREATE TABLE IF NOT EXISTS `financial_categories` (
	`id` varchar(36) NOT NULL,
	`tenant_id` varchar(36),
	`parent_id` varchar(36),
	`name` varchar(255) NOT NULL,
	`type` enum('income','expense') NOT NULL,
	`is_active` int NOT NULL DEFAULT 1,
	`created_at` datetime DEFAULT NOW(),
	CONSTRAINT `financial_categories_id` PRIMARY KEY(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Transações financeiras
CREATE TABLE IF NOT EXISTS `financial_transactions` (
	`id` varchar(36) NOT NULL,
	`tenant_id` varchar(36),
	`bank_account_id` varchar(36),
	`category_id` varchar(36),
	`transaction_type` enum('income','expense','transfer') NOT NULL,
	`description` varchar(500) NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`customer_id` varchar(36),
	`supplier_id` varchar(36),
	`sale_id` varchar(36),
	`invoice_id` varchar(36),
	`due_date` date NOT NULL,
	`payment_date` date,
	`status` enum('pending','paid','overdue','cancelled','partially_paid') DEFAULT 'pending',
	`paid_amount` decimal(10,2) DEFAULT '0',
	`payment_method` varchar(50),
	`notes` text,
	`created_at` datetime DEFAULT NOW(),
	`updated_at` datetime DEFAULT NOW(),
	CONSTRAINT `financial_transactions_id` PRIMARY KEY(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Notas fiscais
CREATE TABLE IF NOT EXISTS `invoices` (
	`id` varchar(36) NOT NULL,
	`tenant_id` varchar(36),
	`sale_id` varchar(36),
	`customer_id` varchar(36),
	`supplier_id` varchar(36),
	`invoice_type` enum('nfe','nfse','nfce') NOT NULL,
	`direction` enum('inbound','outbound') NOT NULL,
	`series` int NOT NULL,
	`number` int NOT NULL,
	`access_key` varchar(44),
	`status` enum('draft','pending','authorized','rejected','cancelled','denied') DEFAULT 'draft',
	`authorization_protocol` varchar(50),
	`authorization_date` datetime,
	`issue_date` datetime NOT NULL,
	`operation_date` date,
	`total_products` decimal(10,2) NOT NULL,
	`total_services` decimal(10,2) DEFAULT '0',
	`discount_amount` decimal(10,2) DEFAULT '0',
	`shipping_amount` decimal(10,2) DEFAULT '0',
	`icms_base` decimal(10,2) DEFAULT '0',
	`icms_amount` decimal(10,2) DEFAULT '0',
	`ipi_amount` decimal(10,2) DEFAULT '0',
	`pis_amount` decimal(10,2) DEFAULT '0',
	`cofins_amount` decimal(10,2) DEFAULT '0',
	`ibs_amount` decimal(10,2) DEFAULT '0',
	`cbs_amount` decimal(10,2) DEFAULT '0',
	`total_tax` decimal(10,2) DEFAULT '0',
	`total_amount` decimal(10,2) NOT NULL,
	`cfop` varchar(4),
	`operation_nature` varchar(255),
	`xml_content` text,
	`pdf_url` varchar(500),
	`notes` text,
	`created_at` datetime DEFAULT NOW(),
	`updated_at` datetime DEFAULT NOW(),
	CONSTRAINT `invoices_id` PRIMARY KEY(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Itens das notas fiscais
CREATE TABLE IF NOT EXISTS `invoice_items` (
	`id` varchar(36) NOT NULL,
	`invoice_id` varchar(36) NOT NULL,
	`product_id` varchar(36),
	`item_number` int NOT NULL,
	`code` varchar(100),
	`description` varchar(500) NOT NULL,
	`ncm` varchar(10),
	`cfop` varchar(4) NOT NULL,
	`unit_of_measure` varchar(10),
	`quantity` decimal(10,3) NOT NULL,
	`unit_price` decimal(10,4) NOT NULL,
	`total_price` decimal(10,2) NOT NULL,
	`discount_amount` decimal(10,2) DEFAULT '0',
	`icms_base` decimal(10,2) DEFAULT '0',
	`icms_rate` decimal(5,2) DEFAULT '0',
	`icms_amount` decimal(10,2) DEFAULT '0',
	`ipi_rate` decimal(5,2) DEFAULT '0',
	`ipi_amount` decimal(10,2) DEFAULT '0',
	`pis_rate` decimal(5,2) DEFAULT '0',
	`pis_amount` decimal(10,2) DEFAULT '0',
	`cofins_rate` decimal(5,2) DEFAULT '0',
	`cofins_amount` decimal(10,2) DEFAULT '0',
	`ibs_rate` decimal(5,2) DEFAULT '0',
	`ibs_amount` decimal(10,2) DEFAULT '0',
	`cbs_rate` decimal(5,2) DEFAULT '0',
	`cbs_amount` decimal(10,2) DEFAULT '0',
	`created_at` datetime DEFAULT NOW(),
	CONSTRAINT `invoice_items_id` PRIMARY KEY(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Categorias de produtos
CREATE TABLE IF NOT EXISTS `product_categories` (
	`id` varchar(36) NOT NULL,
	`tenant_id` varchar(36),
	`parent_id` varchar(36),
	`name` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`description` text,
	`image_url` varchar(500),
	`sort_order` int DEFAULT 0,
	`is_active` int NOT NULL DEFAULT 1,
	`created_at` datetime DEFAULT NOW(),
	`updated_at` datetime DEFAULT NOW(),
	CONSTRAINT `product_categories_id` PRIMARY KEY(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Variantes de produtos
CREATE TABLE IF NOT EXISTS `product_variants` (
	`id` varchar(36) NOT NULL,
	`product_id` varchar(36) NOT NULL,
	`variant_name` varchar(255) NOT NULL,
	`sku` varchar(100),
	`barcode` varchar(100),
	`cost_price` decimal(10,2),
	`selling_price` decimal(10,2),
	`current_stock` decimal(10,3) DEFAULT '0',
	`attributes` json,
	`image_url` varchar(500),
	`is_active` int NOT NULL DEFAULT 1,
	`created_at` datetime DEFAULT NOW(),
	`updated_at` datetime DEFAULT NOW(),
	CONSTRAINT `product_variants_id` PRIMARY KEY(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Depósitos/Armazéns
CREATE TABLE IF NOT EXISTS `warehouses` (
	`id` varchar(36) NOT NULL,
	`tenant_id` varchar(36),
	`name` varchar(255) NOT NULL,
	`code` varchar(50),
	`description` text,
	`address_street` varchar(255),
	`address_number` varchar(20),
	`address_city` varchar(100),
	`address_state` varchar(2),
	`is_main` int DEFAULT 0,
	`is_active` int NOT NULL DEFAULT 1,
	`created_at` datetime DEFAULT NOW(),
	`updated_at` datetime DEFAULT NOW(),
	CONSTRAINT `warehouses_id` PRIMARY KEY(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Níveis de estoque
CREATE TABLE IF NOT EXISTS `stock_levels` (
	`id` varchar(36) NOT NULL,
	`product_id` varchar(36) NOT NULL,
	`warehouse_id` varchar(36) NOT NULL,
	`batch_id` varchar(36),
	`tenant_id` varchar(36),
	`quantity` decimal(10,3) NOT NULL DEFAULT '0',
	`reserved_quantity` decimal(10,3) DEFAULT '0',
	`updated_at` datetime DEFAULT NOW(),
	CONSTRAINT `stock_levels_id` PRIMARY KEY(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Envios/Expedições
CREATE TABLE IF NOT EXISTS `shipments` (
	`id` varchar(36) NOT NULL,
	`tenant_id` varchar(36),
	`sale_id` varchar(36) NOT NULL,
	`tracking_code` varchar(255),
	`carrier` varchar(100),
	`service_type` varchar(100),
	`weight_kg` decimal(10,3),
	`length_cm` decimal(10,2),
	`width_cm` decimal(10,2),
	`height_cm` decimal(10,2),
	`shipping_cost` decimal(10,2),
	`declared_value` decimal(10,2),
	`status` enum('pending','shipped','in_transit','delivered','failed','returned') DEFAULT 'pending',
	`shipped_at` datetime,
	`delivered_at` datetime,
	`label_url` varchar(500),
	`label_printed` int DEFAULT 0,
	`notes` text,
	`created_at` datetime DEFAULT NOW(),
	`updated_at` datetime DEFAULT NOW(),
	CONSTRAINT `shipments_id` PRIMARY KEY(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABELAS DE MULTI-TENANT (para futuro)
-- =====================================================

-- Planos de assinatura
CREATE TABLE IF NOT EXISTS `subscription_plans` (
	`id` varchar(36) NOT NULL,
	`name` varchar(100) NOT NULL,
	`slug` varchar(50) NOT NULL,
	`description` text,
	`price_monthly` decimal(10,2) NOT NULL,
	`price_yearly` decimal(10,2),
	`max_businesses` int NOT NULL DEFAULT 1,
	`max_employees_per_business` int NOT NULL DEFAULT 5,
	`max_products` int NOT NULL DEFAULT 1000,
	`max_monthly_invoices` int NOT NULL DEFAULT 100,
	`storage_limit_mb` int NOT NULL DEFAULT 1024,
	`features` json,
	`is_active` int NOT NULL DEFAULT 1,
	`sort_order` int DEFAULT 0,
	`created_at` datetime DEFAULT NOW(),
	`updated_at` datetime DEFAULT NOW(),
	CONSTRAINT `subscription_plans_id` PRIMARY KEY(`id`),
	UNIQUE KEY `subscription_plans_slug_unique` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tenants (empresas)
CREATE TABLE IF NOT EXISTS `tenants` (
	`id` varchar(36) NOT NULL,
	`owner_id` varchar(36) NOT NULL,
	`plan_id` varchar(36) NOT NULL,
	`business_name` varchar(255) NOT NULL,
	`trading_name` varchar(255),
	`tax_id` varchar(18) NOT NULL,
	`state_registration` varchar(20),
	`municipal_registration` varchar(20),
	`email` varchar(255),
	`phone` varchar(20),
	`website` varchar(255),
	`logo_url` varchar(500),
	`address_street` varchar(255),
	`address_number` varchar(20),
	`address_complement` varchar(100),
	`address_neighborhood` varchar(100),
	`address_city` varchar(100),
	`address_state` varchar(2),
	`address_zipcode` varchar(10),
	`tax_regime` enum('simples_nacional','lucro_presumido','lucro_real','mei') NOT NULL,
	`crt` tinyint NOT NULL,
	`nfe_environment` enum('production','homologation') DEFAULT 'homologation',
	`nfe_series_number` int DEFAULT 1,
	`nfe_next_number` int DEFAULT 1,
	`nfse_series_number` int DEFAULT 1,
	`nfse_next_number` int DEFAULT 1,
	`subscription_status` enum('active','suspended','cancelled','trial') DEFAULT 'trial',
	`subscription_starts_at` datetime,
	`subscription_ends_at` datetime,
	`trial_ends_at` datetime,
	`settings` json,
	`is_active` int NOT NULL DEFAULT 1,
	`created_at` datetime DEFAULT NOW(),
	`updated_at` datetime DEFAULT NOW(),
	CONSTRAINT `tenants_id` PRIMARY KEY(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Roles (cargos)
CREATE TABLE IF NOT EXISTS `roles` (
	`id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`name` varchar(100) NOT NULL,
	`slug` varchar(50) NOT NULL,
	`description` text,
	`permissions` json NOT NULL,
	`is_system_role` int DEFAULT 0,
	`sort_order` int DEFAULT 0,
	`created_at` datetime DEFAULT NOW(),
	`updated_at` datetime DEFAULT NOW(),
	CONSTRAINT `roles_id` PRIMARY KEY(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Membros do tenant
CREATE TABLE IF NOT EXISTS `tenant_memberships` (
	`id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`role_id` varchar(36) NOT NULL,
	`status` enum('active','inactive','pending_invitation') DEFAULT 'active',
	`invitation_token` varchar(255),
	`invitation_expires_at` datetime,
	`joined_at` datetime DEFAULT NOW(),
	`last_access` datetime,
	`created_at` datetime DEFAULT NOW(),
	`updated_at` datetime DEFAULT NOW(),
	CONSTRAINT `tenant_memberships_id` PRIMARY KEY(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABELAS DE AUDITORIA
-- =====================================================

-- Logs de auditoria
CREATE TABLE IF NOT EXISTS `audit_logs` (
	`id` varchar(36) NOT NULL,
	`tenant_id` varchar(36),
	`user_id` varchar(36),
	`action` varchar(100) NOT NULL,
	`entity_type` varchar(100) NOT NULL,
	`entity_id` varchar(36),
	`old_values` json,
	`new_values` json,
	`ip_address` varchar(50),
	`user_agent` text,
	`created_at` datetime DEFAULT NOW(),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Alertas do sistema
CREATE TABLE IF NOT EXISTS `system_alerts` (
	`id` varchar(36) NOT NULL,
	`tenant_id` varchar(36),
	`alert_type` enum('low_stock','expiring_batch','certificate_expiring','payment_overdue','system') NOT NULL,
	`severity` enum('info','warning','error','critical') NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`entity_type` varchar(100),
	`entity_id` varchar(36),
	`is_read` int DEFAULT 0,
	`read_at` datetime,
	`read_by` varchar(36),
	`is_active` int NOT NULL DEFAULT 1,
	`created_at` datetime DEFAULT NOW(),
	CONSTRAINT `system_alerts_id` PRIMARY KEY(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- ADICIONAR COLUNAS FALTANTES EM TABELAS EXISTENTES
-- (usa procedure para verificar antes de adicionar)
-- =====================================================

-- Procedure para adicionar coluna se não existir
DROP PROCEDURE IF EXISTS AddColumnIfNotExists;
DELIMITER //
CREATE PROCEDURE AddColumnIfNotExists(
    IN tableName VARCHAR(255),
    IN columnName VARCHAR(255),
    IN columnDefinition VARCHAR(1000)
)
BEGIN
    SET @dbName = DATABASE();
    SET @columnExists = (
        SELECT COUNT(*) 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = @dbName 
        AND TABLE_NAME = tableName 
        AND COLUMN_NAME = columnName
    );
    
    IF @columnExists = 0 THEN
        SET @sql = CONCAT('ALTER TABLE `', tableName, '` ADD COLUMN `', columnName, '` ', columnDefinition);
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END //
DELIMITER ;

-- Adicionar colunas faltantes em products
CALL AddColumnIfNotExists('products', 'cfop_entrada', 'varchar(10)');
CALL AddColumnIfNotExists('products', 'cst', 'varchar(10)');
CALL AddColumnIfNotExists('products', 'fornecedor_id', 'varchar(36)');
CALL AddColumnIfNotExists('products', 'created_at', 'datetime DEFAULT NOW()');
CALL AddColumnIfNotExists('products', 'updated_at', 'datetime DEFAULT NOW()');
CALL AddColumnIfNotExists('products', 'low_stock_threshold', 'int DEFAULT 1');

-- Adicionar coluna observation em product_batches
CALL AddColumnIfNotExists('product_batches', 'observation', 'text');

-- Adicionar colunas faltantes em movements
CALL AddColumnIfNotExists('movements', 'usuario_id', 'varchar(36)');
CALL AddColumnIfNotExists('movements', 'created_at', 'datetime DEFAULT NOW()');

-- Limpar a procedure temporária
DROP PROCEDURE IF EXISTS AddColumnIfNotExists;

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para products (ignorar se já existir)
CREATE INDEX IF NOT EXISTS idx_products_codigo ON products(codigo_interno);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);

-- Índices para movements
CREATE INDEX IF NOT EXISTS idx_movements_produto ON movements(produto_id);
CREATE INDEX IF NOT EXISTS idx_movements_data ON movements(data);

-- Índices para sales
CREATE INDEX IF NOT EXISTS idx_sales_product ON sales(product_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(date);

-- Índices para customers
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_cpf_cnpj ON customers(cpf_cnpj);

-- Índices para suppliers
CREATE INDEX IF NOT EXISTS idx_suppliers_company_name ON suppliers(company_name);
CREATE INDEX IF NOT EXISTS idx_suppliers_cnpj ON suppliers(cnpj);

-- Índices para sales_orders
CREATE INDEX IF NOT EXISTS idx_sales_orders_number ON sales_orders(order_number);
CREATE INDEX IF NOT EXISTS idx_sales_orders_customer ON sales_orders(customer_id);

-- Índices para invoices
CREATE INDEX IF NOT EXISTS idx_invoices_access_key ON invoices(access_key);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(number);

-- =====================================================
-- DADOS INICIAIS (apenas se tabelas estiverem vazias)
-- =====================================================

-- Inserir plano padrão se não existir
INSERT INTO subscription_plans (id, name, slug, price_monthly, price_yearly, max_businesses, max_employees_per_business, max_products, max_monthly_invoices, storage_limit_mb, features, is_active)
SELECT UUID(), 'Básico', 'basico', 49.90, 499.00, 1, 3, 500, 50, 512, '{"nfe": false, "nfse": true, "marketplace_integration": false, "multi_warehouse": false}', 1
WHERE NOT EXISTS (SELECT 1 FROM subscription_plans WHERE slug = 'basico');

INSERT INTO subscription_plans (id, name, slug, price_monthly, price_yearly, max_businesses, max_employees_per_business, max_products, max_monthly_invoices, storage_limit_mb, features, is_active)
SELECT UUID(), 'Profissional', 'profissional', 149.90, 1499.00, 3, 10, 5000, 500, 5120, '{"nfe": true, "nfse": true, "marketplace_integration": true, "multi_warehouse": true}', 1
WHERE NOT EXISTS (SELECT 1 FROM subscription_plans WHERE slug = 'profissional');

INSERT INTO subscription_plans (id, name, slug, price_monthly, price_yearly, max_businesses, max_employees_per_business, max_products, max_monthly_invoices, storage_limit_mb, features, is_active)
SELECT UUID(), 'Empresarial', 'empresarial', 399.90, 3999.00, 10, 50, 50000, 5000, 51200, '{"nfe": true, "nfse": true, "marketplace_integration": true, "multi_warehouse": true, "api_access": true}', 1
WHERE NOT EXISTS (SELECT 1 FROM subscription_plans WHERE slug = 'empresarial');

-- =====================================================
-- FIM DO SCRIPT DE MIGRAÇÃO
-- =====================================================
SELECT 'Migração concluída com sucesso!' AS status;
