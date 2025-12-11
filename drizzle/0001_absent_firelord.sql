ALTER TABLE `alerts` MODIFY COLUMN `created_at` datetime NOT NULL DEFAULT '2025-12-11 14:52:10.256';--> statement-breakpoint
ALTER TABLE `import_logs` MODIFY COLUMN `data_import` datetime NOT NULL DEFAULT '2025-12-11 14:52:10.256';--> statement-breakpoint
ALTER TABLE `movements` MODIFY COLUMN `created_at` datetime NOT NULL DEFAULT '2025-12-11 14:52:10.256';--> statement-breakpoint
ALTER TABLE `products` MODIFY COLUMN `created_at` datetime NOT NULL DEFAULT '2025-12-11 14:52:10.256';--> statement-breakpoint
ALTER TABLE `products` MODIFY COLUMN `updated_at` datetime NOT NULL DEFAULT '2025-12-11 14:52:10.256';--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `created_at` datetime NOT NULL DEFAULT '2025-12-11 14:52:10.255';--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `updated_at` datetime NOT NULL DEFAULT '2025-12-11 14:52:10.255';--> statement-breakpoint
ALTER TABLE `products` ADD `estoque_baixo_limite` int DEFAULT 5 NOT NULL;