-- Adicionar campos de pagamento, crediário e OS à tabela sales
ALTER TABLE sales 
ADD COLUMN payment_method VARCHAR(20) DEFAULT 'cash' AFTER seller_name,
ADD COLUMN is_credit_sale TINYINT(1) DEFAULT 0 AFTER payment_method,
ADD COLUMN credit_due_date DATE NULL AFTER is_credit_sale,
ADD COLUMN credit_status ENUM('pending', 'partial', 'paid') DEFAULT 'pending' AFTER credit_due_date,
ADD COLUMN service_order_id VARCHAR(36) NULL AFTER credit_status;

-- Criar índice para busca por OS
CREATE INDEX idx_sales_service_order ON sales(service_order_id);

-- Criar índice para busca por status de crédito
CREATE INDEX idx_sales_credit_status ON sales(credit_status);
