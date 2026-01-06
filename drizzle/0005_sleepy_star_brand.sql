ALTER TABLE `alerts` MODIFY COLUMN `is_active` int NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `alerts` MODIFY COLUMN `created_at` datetime NOT NULL DEFAULT '2025-12-11 14:18:23';--> statement-breakpoint
ALTER TABLE `audit_logs` MODIFY COLUMN `created_at` datetime DEFAULT (CURRENT_TIMESTAMP);--> statement-breakpoint
ALTER TABLE `bank_accounts` MODIFY COLUMN `balance` decimal(10,2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE `bank_accounts` MODIFY COLUMN `created_at` datetime DEFAULT (CURRENT_TIMESTAMP);--> statement-breakpoint
ALTER TABLE `bank_accounts` MODIFY COLUMN `updated_at` datetime DEFAULT (CURRENT_TIMESTAMP);--> statement-breakpoint
ALTER TABLE `customers` MODIFY COLUMN `created_at` datetime DEFAULT (CURRENT_TIMESTAMP);--> statement-breakpoint
ALTER TABLE `customers` MODIFY COLUMN `updated_at` datetime DEFAULT (CURRENT_TIMESTAMP);--> statement-breakpoint
ALTER TABLE `financial_categories` MODIFY COLUMN `created_at` datetime DEFAULT (CURRENT_TIMESTAMP);--> statement-breakpoint
ALTER TABLE `financial_transactions` MODIFY COLUMN `paid_amount` decimal(10,2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE `financial_transactions` MODIFY COLUMN `created_at` datetime DEFAULT (CURRENT_TIMESTAMP);--> statement-breakpoint
ALTER TABLE `financial_transactions` MODIFY COLUMN `updated_at` datetime DEFAULT (CURRENT_TIMESTAMP);--> statement-breakpoint
ALTER TABLE `import_logs` MODIFY COLUMN `data_import` datetime NOT NULL DEFAULT '2025-12-11 14:18:23';--> statement-breakpoint
ALTER TABLE `invoice_items` MODIFY COLUMN `discount_amount` decimal(10,2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE `invoice_items` MODIFY COLUMN `icms_base` decimal(10,2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE `invoice_items` MODIFY COLUMN `icms_rate` decimal(5,2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE `invoice_items` MODIFY COLUMN `icms_amount` decimal(10,2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE `invoice_items` MODIFY COLUMN `ipi_rate` decimal(5,2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE `invoice_items` MODIFY COLUMN `ipi_amount` decimal(10,2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE `invoice_items` MODIFY COLUMN `pis_rate` decimal(5,2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE `invoice_items` MODIFY COLUMN `pis_amount` decimal(10,2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE `invoice_items` MODIFY COLUMN `cofins_rate` decimal(5,2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE `invoice_items` MODIFY COLUMN `cofins_amount` decimal(10,2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE `invoice_items` MODIFY COLUMN `ibs_rate` decimal(5,2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE `invoice_items` MODIFY COLUMN `ibs_amount` decimal(10,2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE `invoice_items` MODIFY COLUMN `cbs_rate` decimal(5,2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE `invoice_items` MODIFY COLUMN `cbs_amount` decimal(10,2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE `invoice_items` MODIFY COLUMN `created_at` datetime DEFAULT (CURRENT_TIMESTAMP);--> statement-breakpoint
ALTER TABLE `invoices` MODIFY COLUMN `total_services` decimal(10,2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE `invoices` MODIFY COLUMN `discount_amount` decimal(10,2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE `invoices` MODIFY COLUMN `shipping_amount` decimal(10,2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE `invoices` MODIFY COLUMN `icms_base` decimal(10,2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE `invoices` MODIFY COLUMN `icms_amount` decimal(10,2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE `invoices` MODIFY COLUMN `ipi_amount` decimal(10,2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE `invoices` MODIFY COLUMN `pis_amount` decimal(10,2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE `invoices` MODIFY COLUMN `cofins_amount` decimal(10,2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE `invoices` MODIFY COLUMN `ibs_amount` decimal(10,2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE `invoices` MODIFY COLUMN `cbs_amount` decimal(10,2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE `invoices` MODIFY COLUMN `total_tax` decimal(10,2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE `invoices` MODIFY COLUMN `created_at` datetime DEFAULT (CURRENT_TIMESTAMP);--> statement-breakpoint
ALTER TABLE `invoices` MODIFY COLUMN `updated_at` datetime DEFAULT (CURRENT_TIMESTAMP);--> statement-breakpoint
ALTER TABLE `movements` MODIFY COLUMN `tipo` enum('entrada','saida') NOT NULL;--> statement-breakpoint
ALTER TABLE `movements` MODIFY COLUMN `preco_unitario` decimal(10,2) NOT NULL;--> statement-breakpoint
ALTER TABLE `movements` MODIFY COLUMN `data` date NOT NULL;--> statement-breakpoint
ALTER TABLE `movements` MODIFY COLUMN `referencia` varchar(255);--> statement-breakpoint
ALTER TABLE `pos_sessions` MODIFY COLUMN `opening_balance` decimal(10,2) NOT NULL DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE `pos_sessions` MODIFY COLUMN `cash_sales` decimal(10,2) NOT NULL DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE `pos_sessions` MODIFY COLUMN `card_sales` decimal(10,2) NOT NULL DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE `pos_sessions` MODIFY COLUMN `pix_sales` decimal(10,2) NOT NULL DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE `pos_sessions` MODIFY COLUMN `other_sales` decimal(10,2) NOT NULL DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE `pos_sessions` MODIFY COLUMN `total_sales` decimal(10,2) NOT NULL DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE `pos_sessions` MODIFY COLUMN `created_at` datetime DEFAULT (CURRENT_TIMESTAMP);--> statement-breakpoint
ALTER TABLE `pos_sessions` MODIFY COLUMN `updated_at` datetime DEFAULT (CURRENT_TIMESTAMP);--> statement-breakpoint
ALTER TABLE `product_categories` MODIFY COLUMN `created_at` datetime DEFAULT (CURRENT_TIMESTAMP);--> statement-breakpoint
ALTER TABLE `product_categories` MODIFY COLUMN `updated_at` datetime DEFAULT (CURRENT_TIMESTAMP);--> statement-breakpoint
ALTER TABLE `product_variants` MODIFY COLUMN `current_stock` decimal(10,3) DEFAULT '0.000';--> statement-breakpoint
ALTER TABLE `product_variants` MODIFY COLUMN `created_at` datetime DEFAULT (CURRENT_TIMESTAMP);--> statement-breakpoint
ALTER TABLE `product_variants` MODIFY COLUMN `updated_at` datetime DEFAULT (CURRENT_TIMESTAMP);--> statement-breakpoint
ALTER TABLE `products` MODIFY COLUMN `id` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `products` MODIFY COLUMN `codigo_interno` varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE `products` MODIFY COLUMN `barcode` varchar(100);--> statement-breakpoint
ALTER TABLE `products` MODIFY COLUMN `qtd_atual` int NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `products` MODIFY COLUMN `qtd_entrada_total` int NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `products` MODIFY COLUMN `qtd_saida_total` int NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `products` MODIFY COLUMN `data_ultima_compra` date;--> statement-breakpoint
ALTER TABLE `products` MODIFY COLUMN `ncm` varchar(20);--> statement-breakpoint
ALTER TABLE `products` MODIFY COLUMN `estoque_baixo_limite` int NOT NULL DEFAULT 5;--> statement-breakpoint
ALTER TABLE `roles` MODIFY COLUMN `created_at` datetime DEFAULT (CURRENT_TIMESTAMP);--> statement-breakpoint
ALTER TABLE `roles` MODIFY COLUMN `updated_at` datetime DEFAULT (CURRENT_TIMESTAMP);--> statement-breakpoint
ALTER TABLE `sales_order_items` MODIFY COLUMN `discount` decimal(10,2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE `sales_order_items` MODIFY COLUMN `created_at` datetime DEFAULT (CURRENT_TIMESTAMP);--> statement-breakpoint
ALTER TABLE `sales_orders` MODIFY COLUMN `discount` decimal(10,2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE `sales_orders` MODIFY COLUMN `created_at` datetime DEFAULT (CURRENT_TIMESTAMP);--> statement-breakpoint
ALTER TABLE `sales_orders` MODIFY COLUMN `updated_at` datetime DEFAULT (CURRENT_TIMESTAMP);--> statement-breakpoint
ALTER TABLE `service_order_history` MODIFY COLUMN `created_at` datetime DEFAULT (CURRENT_TIMESTAMP);--> statement-breakpoint
ALTER TABLE `service_order_items` MODIFY COLUMN `quantity` decimal(10,3) NOT NULL DEFAULT '1.000';--> statement-breakpoint
ALTER TABLE `service_order_items` MODIFY COLUMN `discount` decimal(10,2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE `service_order_items` MODIFY COLUMN `created_at` datetime DEFAULT (CURRENT_TIMESTAMP);--> statement-breakpoint
ALTER TABLE `service_orders` MODIFY COLUMN `labor_cost` decimal(10,2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE `service_orders` MODIFY COLUMN `parts_cost` decimal(10,2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE `service_orders` MODIFY COLUMN `total_cost` decimal(10,2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE `service_orders` MODIFY COLUMN `received_at` datetime DEFAULT (CURRENT_TIMESTAMP);--> statement-breakpoint
ALTER TABLE `service_orders` MODIFY COLUMN `created_at` datetime DEFAULT (CURRENT_TIMESTAMP);--> statement-breakpoint
ALTER TABLE `service_orders` MODIFY COLUMN `updated_at` datetime DEFAULT (CURRENT_TIMESTAMP);--> statement-breakpoint
ALTER TABLE `shipments` MODIFY COLUMN `created_at` datetime DEFAULT (CURRENT_TIMESTAMP);--> statement-breakpoint
ALTER TABLE `shipments` MODIFY COLUMN `updated_at` datetime DEFAULT (CURRENT_TIMESTAMP);--> statement-breakpoint
ALTER TABLE `stock_levels` MODIFY COLUMN `quantity` decimal(10,3) NOT NULL DEFAULT '0.000';--> statement-breakpoint
ALTER TABLE `stock_levels` MODIFY COLUMN `reserved_quantity` decimal(10,3) DEFAULT '0.000';--> statement-breakpoint
ALTER TABLE `stock_levels` MODIFY COLUMN `updated_at` datetime DEFAULT (CURRENT_TIMESTAMP);--> statement-breakpoint
ALTER TABLE `subscription_plans` MODIFY COLUMN `created_at` datetime DEFAULT (CURRENT_TIMESTAMP);--> statement-breakpoint
ALTER TABLE `subscription_plans` MODIFY COLUMN `updated_at` datetime DEFAULT (CURRENT_TIMESTAMP);--> statement-breakpoint
ALTER TABLE `suppliers` MODIFY COLUMN `created_at` datetime DEFAULT (CURRENT_TIMESTAMP);--> statement-breakpoint
ALTER TABLE `suppliers` MODIFY COLUMN `updated_at` datetime DEFAULT (CURRENT_TIMESTAMP);--> statement-breakpoint
ALTER TABLE `system_alerts` MODIFY COLUMN `created_at` datetime DEFAULT (CURRENT_TIMESTAMP);--> statement-breakpoint
ALTER TABLE `tenant_memberships` MODIFY COLUMN `joined_at` datetime DEFAULT (CURRENT_TIMESTAMP);--> statement-breakpoint
ALTER TABLE `tenant_memberships` MODIFY COLUMN `created_at` datetime DEFAULT (CURRENT_TIMESTAMP);--> statement-breakpoint
ALTER TABLE `tenant_memberships` MODIFY COLUMN `updated_at` datetime DEFAULT (CURRENT_TIMESTAMP);--> statement-breakpoint
ALTER TABLE `tenants` MODIFY COLUMN `created_at` datetime DEFAULT (CURRENT_TIMESTAMP);--> statement-breakpoint
ALTER TABLE `tenants` MODIFY COLUMN `updated_at` datetime DEFAULT (CURRENT_TIMESTAMP);--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('admin','user') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `created_at` datetime NOT NULL DEFAULT '2025-12-11 14:18:23';--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `updated_at` datetime NOT NULL DEFAULT '2025-12-11 14:18:23';--> statement-breakpoint
ALTER TABLE `warehouses` MODIFY COLUMN `created_at` datetime DEFAULT (CURRENT_TIMESTAMP);--> statement-breakpoint
ALTER TABLE `warehouses` MODIFY COLUMN `updated_at` datetime DEFAULT (CURRENT_TIMESTAMP);--> statement-breakpoint
ALTER TABLE `movements` ADD `usuario_id` varchar(36);--> statement-breakpoint
ALTER TABLE `movements` ADD `created_at` datetime DEFAULT '2025-12-11 14:18:23' NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `cfop_entrada` varchar(10);--> statement-breakpoint
ALTER TABLE `products` ADD `cst` varchar(10);--> statement-breakpoint
ALTER TABLE `products` ADD `fornecedor_id` varchar(36);--> statement-breakpoint
ALTER TABLE `products` ADD `created_at` datetime DEFAULT '2025-12-11 14:18:23' NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `updated_at` datetime DEFAULT '2025-12-11 14:18:23' NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `low_stock_threshold` int DEFAULT 1;--> statement-breakpoint
ALTER TABLE `products` ADD CONSTRAINT `products_codigo_interno_unique` UNIQUE(`codigo_interno`);--> statement-breakpoint
ALTER TABLE `subscription_plans` ADD CONSTRAINT `subscription_plans_slug_unique` UNIQUE(`slug`);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_email_unique` UNIQUE(`email`);--> statement-breakpoint
ALTER TABLE `alerts` ADD CONSTRAINT `alerts_produto_id_products_id_fk` FOREIGN KEY (`produto_id`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `movements` ADD CONSTRAINT `movements_produto_id_products_id_fk` FOREIGN KEY (`produto_id`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `movements` ADD CONSTRAINT `movements_usuario_id_users_id_fk` FOREIGN KEY (`usuario_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_service_order_history_order` ON `service_order_history` (`service_order_id`);--> statement-breakpoint
CREATE INDEX `idx_service_order_history_created` ON `service_order_history` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_service_order_items_order` ON `service_order_items` (`service_order_id`);--> statement-breakpoint
CREATE INDEX `idx_service_order_items_product` ON `service_order_items` (`product_id`);--> statement-breakpoint
CREATE INDEX `idx_service_orders_customer` ON `service_orders` (`customer_id`);--> statement-breakpoint
CREATE INDEX `idx_service_orders_status` ON `service_orders` (`status`);--> statement-breakpoint
CREATE INDEX `idx_service_orders_order_number` ON `service_orders` (`order_number`);--> statement-breakpoint
CREATE INDEX `idx_service_orders_created` ON `service_orders` (`created_at`);