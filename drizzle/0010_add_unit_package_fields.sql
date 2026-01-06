-- Adicionar campos para gerenciamento de unidades/embalagens
-- Ex: Um lote vem com 10 caixas de lâmpadas, cada caixa tem 2 lâmpadas = 20 unidades vendáveis

-- Adicionar colunas na tabela products apenas se não existirem
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'products'
     AND COLUMN_NAME = 'product_type') = 0,
    'ALTER TABLE `products` ADD COLUMN `product_type` ENUM(\'simple\', \'marketplace\') DEFAULT \'simple\';',
    'SELECT "Column product_type already exists";'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'products'
     AND COLUMN_NAME = 'unit_type') = 0,
    'ALTER TABLE `products` ADD COLUMN `unit_type` ENUM(\'unit\', \'package\') DEFAULT \'unit\';',
    'SELECT "Column unit_type already exists";'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'products'
     AND COLUMN_NAME = 'package_quantity') = 0,
    'ALTER TABLE `products` ADD COLUMN `package_quantity` INT DEFAULT 1;',
    'SELECT "Column package_quantity already exists";'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'products'
     AND COLUMN_NAME = 'units_per_package') = 0,
    'ALTER TABLE `products` ADD COLUMN `units_per_package` INT DEFAULT 1;',
    'SELECT "Column units_per_package already exists";'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'products'
     AND COLUMN_NAME = 'unit_name') = 0,
    'ALTER TABLE `products` ADD COLUMN `unit_name` VARCHAR(50) DEFAULT \'Unidade\';',
    'SELECT "Column unit_name already exists";'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'products'
     AND COLUMN_NAME = 'package_name') = 0,
    'ALTER TABLE `products` ADD COLUMN `package_name` VARCHAR(50) DEFAULT \'Caixa\';',
    'SELECT "Column package_name already exists";'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'products'
     AND COLUMN_NAME = 'sell_by_unit') = 0,
    'ALTER TABLE `products` ADD COLUMN `sell_by_unit` TINYINT DEFAULT 0;',
    'SELECT "Column sell_by_unit already exists";'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'products'
     AND COLUMN_NAME = 'unit_price') = 0,
    'ALTER TABLE `products` ADD COLUMN `unit_price` DECIMAL(10, 2);',
    'SELECT "Column unit_price already exists";'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'products'
     AND COLUMN_NAME = 'qtd_units_available') = 0,
    'ALTER TABLE `products` ADD COLUMN `qtd_units_available` INT DEFAULT 0;',
    'SELECT "Column qtd_units_available already exists";'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Atualizar tabela de lotes para incluir informações de unidades
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'product_batches'
     AND COLUMN_NAME = 'units_per_package') = 0,
    'ALTER TABLE `product_batches` ADD COLUMN `units_per_package` INT DEFAULT 1 AFTER `quantityRemaining`;',
    'SELECT "Column units_per_package in product_batches already exists";'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'product_batches'
     AND COLUMN_NAME = 'package_quantity_received') = 0,
    'ALTER TABLE `product_batches` ADD COLUMN `package_quantity_received` INT AFTER `units_per_package`;',
    'SELECT "Column package_quantity_received already exists";'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'product_batches'
     AND COLUMN_NAME = 'total_units_received') = 0,
    'ALTER TABLE `product_batches` ADD COLUMN `total_units_received` INT AFTER `package_quantity_received`;',
    'SELECT "Column total_units_received already exists";'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'product_batches'
     AND COLUMN_NAME = 'units_remaining') = 0,
    'ALTER TABLE `product_batches` ADD COLUMN `units_remaining` INT AFTER `total_units_received`;',
    'SELECT "Column units_remaining already exists";'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Atualizar tabela de itens de pedido para permitir venda por unidade
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'sales_order_items'
     AND COLUMN_NAME = 'sell_type') = 0,
    'ALTER TABLE `sales_order_items` ADD COLUMN `sell_type` ENUM(\'package\', \'unit\') DEFAULT \'package\' AFTER `quantity`;',
    'SELECT "Column sell_type already exists";'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'sales_order_items'
     AND COLUMN_NAME = 'units_sold') = 0,
    'ALTER TABLE `sales_order_items` ADD COLUMN `units_sold` INT DEFAULT 0 AFTER `sell_type`;',
    'SELECT "Column units_sold already exists";'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Índices para performance
-- Verificar se os índices já existem antes de criar
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'products'
     AND INDEX_NAME = 'idx_products_unit_type') = 0,
    'CREATE INDEX `idx_products_unit_type` ON `products` (`unit_type`);',
    'SELECT "Index idx_products_unit_type already exists";'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'products'
     AND INDEX_NAME = 'idx_products_sell_by_unit') = 0,
    'CREATE INDEX `idx_products_sell_by_unit` ON `products` (`sell_by_unit`);',
    'SELECT "Index idx_products_sell_by_unit already exists";'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
