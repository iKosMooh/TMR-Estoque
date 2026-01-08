-- Adicionar campo para código do produto vindo do XML
ALTER TABLE `products` ADD COLUMN `xml_code` VARCHAR(100) NULL;

-- Adicionar campo para código XML nos lotes
ALTER TABLE `product_batches` ADD COLUMN `xml_code` VARCHAR(100) NULL;

-- Adicionar novo tipo de pagamento crediário/fiado nos pedidos de venda
ALTER TABLE `sales_orders` MODIFY COLUMN `payment_method` ENUM('cash','credit_card','debit_card','pix','boleto','credit_store','other') DEFAULT 'cash';

-- Adicionar campo para indicar se é venda a prazo/fiado
ALTER TABLE `sales_orders` ADD COLUMN `is_credit_sale` TINYINT(1) DEFAULT 0;

-- Adicionar campo para data de vencimento do crediário
ALTER TABLE `sales_orders` ADD COLUMN `credit_due_date` DATE NULL;

-- Adicionar campo para status do pagamento do crediário
ALTER TABLE `sales_orders` ADD COLUMN `credit_status` ENUM('pending','partial','paid') DEFAULT 'pending';

-- Criar índice para busca por código XML
CREATE INDEX `idx_products_xml_code` ON `products` (`xml_code`);
