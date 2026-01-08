-- Adicionar campo para vincular venda a ordem de serviço
ALTER TABLE sales_orders ADD COLUMN service_order_id VARCHAR(36) NULL AFTER notes;

-- Criar índice para busca por OS
CREATE INDEX idx_sales_orders_service_order ON sales_orders(service_order_id);
