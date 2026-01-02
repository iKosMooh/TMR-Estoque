CREATE TABLE `customers` (
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
);
--> statement-breakpoint
CREATE TABLE `pos_sessions` (
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
);
--> statement-breakpoint
CREATE TABLE `sales_order_items` (
	`id` varchar(36) NOT NULL,
	`order_id` varchar(36) NOT NULL,
	`product_id` varchar(36) NOT NULL,
	`quantity` int NOT NULL,
	`unit_price` decimal(10,2) NOT NULL,
	`discount` decimal(10,2) DEFAULT '0',
	`total` decimal(10,2) NOT NULL,
	`created_at` datetime DEFAULT NOW(),
	CONSTRAINT `sales_order_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sales_orders` (
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
);
--> statement-breakpoint
CREATE TABLE `suppliers` (
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
);
