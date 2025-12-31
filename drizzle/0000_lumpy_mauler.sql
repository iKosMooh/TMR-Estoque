CREATE TABLE `movements` (
	`id` varchar(36) NOT NULL,
	`product_id` varchar(36) NOT NULL,
	`batch_id` varchar(36),
	`type` varchar(10) NOT NULL,
	`quantity` int NOT NULL,
	`date` datetime NOT NULL,
	`reference` varchar(100),
	CONSTRAINT `movements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `product_batches` (
	`id` varchar(36) NOT NULL,
	`product_id` varchar(36) NOT NULL,
	`purchase_date` date NOT NULL,
	`cost_price` decimal(10,2) NOT NULL,
	`selling_price` decimal(10,2) NOT NULL,
	`quantity_received` int NOT NULL,
	`quantity_remaining` int NOT NULL,
	`xml_reference` varchar(100),
	CONSTRAINT `product_batches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` varchar(255) NOT NULL,
	`codigo_interno` varchar(255) NOT NULL,
	`barcode` varchar(255),
	`name` varchar(255) NOT NULL,
	`description` text,
	`preco_venda` decimal(10,2) NOT NULL,
	`preco_custo` decimal(10,2) NOT NULL,
	`qtd_atual` int NOT NULL,
	`qtd_entrada_total` int NOT NULL,
	`qtd_saida_total` int NOT NULL,
	`data_ultima_compra` datetime,
	`ncm` varchar(255),
	`estoque_baixo_limite` int NOT NULL,
	CONSTRAINT `products_id` PRIMARY KEY(`id`)
);
