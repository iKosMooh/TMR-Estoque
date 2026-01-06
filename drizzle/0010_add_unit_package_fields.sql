-- Adicionar campos para gerenciamento de unidades/embalagens
-- Ex: Um lote vem com 10 caixas de lâmpadas, cada caixa tem 2 lâmpadas = 20 unidades vendáveis

ALTER TABLE `products` 
ADD COLUMN `product_type` ENUM('simple', 'marketplace') DEFAULT 'simple' AFTER `warrantyMonths`,
ADD COLUMN `unit_type` ENUM('unit', 'package') DEFAULT 'unit' AFTER `product_type`,
ADD COLUMN `package_quantity` INT DEFAULT 1 AFTER `unit_type`,
ADD COLUMN `units_per_package` INT DEFAULT 1 AFTER `package_quantity`,
ADD COLUMN `unit_name` VARCHAR(50) DEFAULT 'Unidade' AFTER `units_per_package`,
ADD COLUMN `package_name` VARCHAR(50) DEFAULT 'Caixa' AFTER `unit_name`,
ADD COLUMN `sell_by_unit` TINYINT DEFAULT 0 AFTER `package_name`,
ADD COLUMN `unit_price` DECIMAL(10, 2) AFTER `sell_by_unit`,
ADD COLUMN `qtd_units_available` INT DEFAULT 0 AFTER `unit_price`;

-- Atualizar tabela de lotes para incluir informações de unidades
ALTER TABLE `product_batches`
ADD COLUMN `units_per_package` INT DEFAULT 1 AFTER `quantityRemaining`,
ADD COLUMN `package_quantity_received` INT AFTER `units_per_package`,
ADD COLUMN `total_units_received` INT AFTER `package_quantity_received`,
ADD COLUMN `units_remaining` INT AFTER `total_units_received`;

-- Atualizar tabela de itens de pedido para permitir venda por unidade
ALTER TABLE `sales_order_items`
ADD COLUMN `sell_type` ENUM('package', 'unit') DEFAULT 'package' AFTER `quantity`,
ADD COLUMN `units_sold` INT DEFAULT 0 AFTER `sell_type`;

-- Índices para performance
CREATE INDEX `idx_products_unit_type` ON `products` (`unit_type`);
CREATE INDEX `idx_products_sell_by_unit` ON `products` (`sell_by_unit`);
