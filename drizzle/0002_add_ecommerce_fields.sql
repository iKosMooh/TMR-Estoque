-- Adicionar campos de e-commerce na tabela products
ALTER TABLE products 
ADD COLUMN sku VARCHAR(100),
ADD COLUMN weight DECIMAL(10, 3),
ADD COLUMN length DECIMAL(10, 2),
ADD COLUMN width DECIMAL(10, 2),
ADD COLUMN height DECIMAL(10, 2),
ADD COLUMN category_id VARCHAR(36),
ADD COLUMN brand_name VARCHAR(255),
ADD COLUMN manufacturer VARCHAR(255),
ADD COLUMN short_description TEXT,
ADD COLUMN meta_title VARCHAR(255),
ADD COLUMN meta_description TEXT,
ADD COLUMN tags TEXT,
ADD COLUMN warranty_months INT;

-- Criar índices para melhorar performance
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_brand_name ON products(brand_name);
