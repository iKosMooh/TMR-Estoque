CREATE TABLE `alerts` (
	`id` varchar(36) NOT NULL,
	`produto_id` varchar(36) NOT NULL,
	`message` text NOT NULL,
	`is_active` int NOT NULL DEFAULT 1,
	`created_at` datetime NOT NULL DEFAULT '2025-12-11 14:18:23.410',
	CONSTRAINT `alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `import_logs` (
	`id` varchar(36) NOT NULL,
	`arquivo_nome` varchar(255) NOT NULL,
	`data_import` datetime NOT NULL DEFAULT '2025-12-11 14:18:23.410',
	`total_itens` int NOT NULL,
	`erros` text,
	CONSTRAINT `import_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `movements` (
	`id` varchar(36) NOT NULL,
	`produto_id` varchar(36) NOT NULL,
	`tipo` enum('entrada','saida') NOT NULL,
	`quantidade` int NOT NULL,
	`preco_unitario` decimal(10,2) NOT NULL,
	`data` date NOT NULL,
	`referencia` varchar(255),
	`usuario_id` varchar(36),
	`created_at` datetime NOT NULL DEFAULT '2025-12-11 14:18:23.409',
	CONSTRAINT `movements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` varchar(36) NOT NULL,
	`codigo_interno` varchar(100) NOT NULL,
	`barcode` varchar(100),
	`name` varchar(255) NOT NULL,
	`description` text,
	`preco_venda` decimal(10,2) NOT NULL,
	`preco_custo` decimal(10,2) NOT NULL,
	`qtd_entrada_total` int NOT NULL DEFAULT 0,
	`qtd_saida_total` int NOT NULL DEFAULT 0,
	`qtd_atual` int NOT NULL DEFAULT 0,
	`data_ultima_compra` date,
	`ncm` varchar(20),
	`cfop_entrada` varchar(10),
	`cst` varchar(10),
	`fornecedor_id` varchar(36),
	`created_at` datetime NOT NULL DEFAULT '2025-12-11 14:18:23.409',
	`updated_at` datetime NOT NULL DEFAULT '2025-12-11 14:18:23.409',
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_codigo_interno_unique` UNIQUE(`codigo_interno`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`role` enum('admin','user') NOT NULL DEFAULT 'user',
	`created_at` datetime NOT NULL DEFAULT '2025-12-11 14:18:23.408',
	`updated_at` datetime NOT NULL DEFAULT '2025-12-11 14:18:23.409',
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
ALTER TABLE `alerts` ADD CONSTRAINT `alerts_produto_id_products_id_fk` FOREIGN KEY (`produto_id`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `movements` ADD CONSTRAINT `movements_produto_id_products_id_fk` FOREIGN KEY (`produto_id`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `movements` ADD CONSTRAINT `movements_usuario_id_users_id_fk` FOREIGN KEY (`usuario_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;