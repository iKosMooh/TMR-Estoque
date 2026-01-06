ALTER TABLE `product_batches` ADD `units_per_package` int DEFAULT 1;--> statement-breakpoint
ALTER TABLE `product_batches` ADD `package_quantity_received` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `product_batches` ADD `total_units_received` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `product_batches` ADD `units_remaining` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `products` ADD `product_type` enum('simple','marketplace') DEFAULT 'simple';--> statement-breakpoint
ALTER TABLE `products` ADD `unit_type` enum('package','unit') DEFAULT 'package';--> statement-breakpoint
ALTER TABLE `products` ADD `package_quantity` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `products` ADD `units_per_package` int DEFAULT 1;--> statement-breakpoint
ALTER TABLE `products` ADD `unit_name` varchar(50);--> statement-breakpoint
ALTER TABLE `products` ADD `package_name` varchar(50);--> statement-breakpoint
ALTER TABLE `products` ADD `sell_by_unit` tinyint DEFAULT 0;--> statement-breakpoint
ALTER TABLE `products` ADD `unit_price` decimal(10,2);--> statement-breakpoint
ALTER TABLE `products` ADD `qtd_units_available` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `sales_order_items` ADD `sell_type` enum('package','unit') DEFAULT 'package';--> statement-breakpoint
ALTER TABLE `sales_order_items` ADD `units_sold` int DEFAULT 0;