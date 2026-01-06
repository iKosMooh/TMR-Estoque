-- Criar tabela de ordens de serviço
CREATE TABLE IF NOT EXISTS `service_orders` (
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
  `labor_cost` decimal(10,2) DEFAULT '0.00',
  `parts_cost` decimal(10,2) DEFAULT '0.00',
  `total_cost` decimal(10,2) DEFAULT '0.00',
  `warranty_months` int DEFAULT '0',
  `warranty_until` date,
  `received_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `estimated_completion_date` date,
  `completed_at` datetime,
  `delivered_at` datetime,
  `notes` text,
  `internal_notes` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_service_orders_customer` (`customer_id`),
  KEY `idx_service_orders_status` (`status`),
  KEY `idx_service_orders_order_number` (`order_number`),
  KEY `idx_service_orders_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Criar tabela de itens da ordem de serviço
CREATE TABLE IF NOT EXISTS `service_order_items` (
  `id` varchar(36) NOT NULL,
  `service_order_id` varchar(36) NOT NULL,
  `product_id` varchar(36),
  `type` enum('product','labor','other') NOT NULL DEFAULT 'product',
  `description` varchar(255) NOT NULL,
  `quantity` decimal(10,3) NOT NULL DEFAULT '1.000',
  `unit_price` decimal(10,2) NOT NULL,
  `discount` decimal(10,2) DEFAULT '0.00',
  `total` decimal(10,2) NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_service_order_items_order` (`service_order_id`),
  KEY `idx_service_order_items_product` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Criar tabela de histórico da ordem de serviço
CREATE TABLE IF NOT EXISTS `service_order_history` (
  `id` varchar(36) NOT NULL,
  `service_order_id` varchar(36) NOT NULL,
  `from_status` varchar(50),
  `to_status` varchar(50) NOT NULL,
  `notes` text,
  `user_id` varchar(36),
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_service_order_history_order` (`service_order_id`),
  KEY `idx_service_order_history_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
