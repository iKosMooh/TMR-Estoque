CREATE TABLE `service_order_history` (
	`id` varchar(36) NOT NULL,
	`service_order_id` varchar(36) NOT NULL,
	`from_status` varchar(50),
	`to_status` varchar(50) NOT NULL,
	`notes` text,
	`user_id` varchar(36),
	`created_at` datetime DEFAULT NOW(),
	CONSTRAINT `service_order_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `service_order_items` (
	`id` varchar(36) NOT NULL,
	`service_order_id` varchar(36) NOT NULL,
	`product_id` varchar(36),
	`type` enum('product','labor','other') NOT NULL DEFAULT 'product',
	`description` varchar(255) NOT NULL,
	`quantity` decimal(10,3) NOT NULL DEFAULT '1',
	`unit_price` decimal(10,2) NOT NULL,
	`discount` decimal(10,2) DEFAULT '0',
	`total` decimal(10,2) NOT NULL,
	`created_at` datetime DEFAULT NOW(),
	CONSTRAINT `service_order_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `service_orders` (
	`id` varchar(36) NOT NULL,
	`order_number` varchar(20) NOT NULL,
	`customer_id` varchar(36) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`equipment_type` varchar(100),
	`equipment_brand` varchar(100),
	`equipment_model` varchar(100),
	`equipment_serial` varchar(100),
	`reported_issue` text,
	`diagnosis` text,
	`solution` text,
	`priority` enum('low','medium','high','urgent') DEFAULT 'medium',
	`status` enum('pending','in_progress','waiting_parts','waiting_approval','completed','cancelled','delivered') NOT NULL DEFAULT 'pending',
	`estimated_cost` decimal(10,2),
	`labor_cost` decimal(10,2) DEFAULT '0',
	`parts_cost` decimal(10,2) DEFAULT '0',
	`total_cost` decimal(10,2) DEFAULT '0',
	`warranty_months` int DEFAULT 0,
	`warranty_until` date,
	`received_at` datetime DEFAULT NOW(),
	`estimated_completion_date` date,
	`completed_at` datetime,
	`delivered_at` datetime,
	`notes` text,
	`internal_notes` text,
	`created_at` datetime DEFAULT NOW(),
	`updated_at` datetime DEFAULT NOW(),
	CONSTRAINT `service_orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `product_batches` ADD `observation` text;--> statement-breakpoint
ALTER TABLE `products` ADD `sku` varchar(100);--> statement-breakpoint
ALTER TABLE `products` ADD `weight` decimal(10,3);--> statement-breakpoint
ALTER TABLE `products` ADD `length` decimal(10,2);--> statement-breakpoint
ALTER TABLE `products` ADD `width` decimal(10,2);--> statement-breakpoint
ALTER TABLE `products` ADD `height` decimal(10,2);--> statement-breakpoint
ALTER TABLE `products` ADD `category_id` varchar(36);--> statement-breakpoint
ALTER TABLE `products` ADD `brand_name` varchar(255);--> statement-breakpoint
ALTER TABLE `products` ADD `manufacturer` varchar(255);--> statement-breakpoint
ALTER TABLE `products` ADD `short_description` text;--> statement-breakpoint
ALTER TABLE `products` ADD `meta_title` varchar(255);--> statement-breakpoint
ALTER TABLE `products` ADD `meta_description` text;--> statement-breakpoint
ALTER TABLE `products` ADD `tags` text;--> statement-breakpoint
ALTER TABLE `products` ADD `warranty_months` int;