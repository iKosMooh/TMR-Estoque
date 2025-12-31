CREATE TABLE `alerts` (
	`id` varchar(36) NOT NULL,
	`produto_id` varchar(36) NOT NULL,
	`message` text NOT NULL,
	`is_active` int DEFAULT 1,
	`created_at` datetime DEFAULT NOW(),
	CONSTRAINT `alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `import_logs` (
	`id` varchar(36) NOT NULL,
	`arquivo_nome` varchar(255) NOT NULL,
	`data_import` datetime NOT NULL,
	`total_itens` int NOT NULL,
	`erros` text,
	CONSTRAINT `import_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sales` (
	`id` varchar(36) NOT NULL,
	`product_id` varchar(36) NOT NULL,
	`quantity` int NOT NULL,
	`price` decimal(10,2) NOT NULL,
	`date` datetime NOT NULL,
	`user_id` varchar(36),
	CONSTRAINT `sales_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`role` enum('admin','user') DEFAULT 'user',
	`created_at` datetime DEFAULT NOW(),
	`updated_at` datetime DEFAULT NOW(),
	CONSTRAINT `users_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `movements` RENAME COLUMN `product_id` TO `produto_id`;--> statement-breakpoint
ALTER TABLE `movements` ADD `tipo` varchar(10) NOT NULL;--> statement-breakpoint
ALTER TABLE `movements` ADD `quantidade` int NOT NULL;--> statement-breakpoint
ALTER TABLE `movements` ADD `preco_unitario` decimal(10,2);--> statement-breakpoint
ALTER TABLE `movements` ADD `data` datetime NOT NULL;--> statement-breakpoint
ALTER TABLE `movements` ADD `referencia` varchar(100);--> statement-breakpoint
ALTER TABLE `movements` DROP COLUMN `batch_id`;--> statement-breakpoint
ALTER TABLE `movements` DROP COLUMN `type`;--> statement-breakpoint
ALTER TABLE `movements` DROP COLUMN `quantity`;--> statement-breakpoint
ALTER TABLE `movements` DROP COLUMN `date`;--> statement-breakpoint
ALTER TABLE `movements` DROP COLUMN `reference`;