-- =====================================================
-- SISTEMA ERP MULTI-TENANT - MODELAGEM COMPLETA MYSQL
-- Arquitetura: Banco Compartilhado com Row-Level Isolation
-- =====================================================

-- =====================================================
-- 1. CAMADA DE IDENTIDADE E AUTENTICAÇÃO
-- =====================================================

-- Tabela de usuários global (identidade única no sistema)
CREATE TABLE users (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    avatar_url VARCHAR(500),
    
    -- Autenticação avançada
    mfa_secret VARCHAR(255), -- Para autenticação de dois fatores
    mfa_enabled BOOLEAN DEFAULT FALSE,
    email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(255),
    password_reset_token VARCHAR(255),
    password_reset_expires DATETIME,
    
    -- Controle de acesso global
    is_superadmin BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    last_login DATETIME,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_superadmin (is_superadmin)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 2. CAMADA DE PLANOS E ASSINATURAS
-- =====================================================

-- Planos de assinatura disponíveis
CREATE TABLE subscription_plans (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(100) NOT NULL, -- "Básico", "Profissional", "Empresarial"
    slug VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    price_monthly DECIMAL(10,2) NOT NULL,
    price_yearly DECIMAL(10,2),
    
    -- Limites do plano
    max_businesses INT NOT NULL DEFAULT 1,
    max_employees_per_business INT NOT NULL DEFAULT 5,
    max_products INT NOT NULL DEFAULT 1000,
    max_monthly_invoices INT NOT NULL DEFAULT 100,
    storage_limit_mb INT NOT NULL DEFAULT 1024,
    
    -- Features habilitadas (JSON para flexibilidade)
    features JSON, -- Ex: {"nfe": true, "nfse": true, "marketplace_integration": true}
    
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_slug (slug),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 3. CAMADA DE ORGANIZAÇÕES (TENANTS/NEGÓCIOS)
-- =====================================================

-- Tabela principal de negócios/empresas (Tenant)
CREATE TABLE tenants (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    owner_id CHAR(36) NOT NULL, -- Dono principal do negócio
    plan_id CHAR(36) NOT NULL,
    
    -- Dados da empresa
    business_name VARCHAR(255) NOT NULL,
    trading_name VARCHAR(255), -- Nome fantasia
    tax_id VARCHAR(18) NOT NULL, -- CNPJ (formato: 00.000.000/0000-00)
    state_registration VARCHAR(20), -- Inscrição Estadual
    municipal_registration VARCHAR(20), -- Inscrição Municipal
    
    -- Dados de contato
    email VARCHAR(255),
    phone VARCHAR(20),
    website VARCHAR(255),
    logo_url VARCHAR(500),
    
    -- Endereço completo
    address_street VARCHAR(255),
    address_number VARCHAR(20),
    address_complement VARCHAR(100),
    address_neighborhood VARCHAR(100),
    address_city VARCHAR(100),
    address_state CHAR(2),
    address_zipcode VARCHAR(10),
    address_country VARCHAR(50) DEFAULT 'Brasil',
    
    -- Configurações fiscais
    tax_regime ENUM('simples_nacional', 'lucro_presumido', 'lucro_real', 'mei') NOT NULL,
    crt TINYINT NOT NULL, -- Código de Regime Tributário (1=Simples, 2=Simples Excesso, 3=Normal)
    
    -- Configurações NF-e/NFS-e
    nfe_environment ENUM('production', 'homologation') DEFAULT 'homologation',
    nfe_certificate BLOB, -- Certificado A1 em formato PFX
    nfe_certificate_password VARCHAR(255),
    nfe_certificate_expires_at DATETIME,
    nfe_series_number INT DEFAULT 1,
    nfe_next_number INT DEFAULT 1,
    nfse_series_number INT DEFAULT 1,
    nfse_next_number INT DEFAULT 1,
    
    -- Controle de assinatura
    subscription_status ENUM('active', 'suspended', 'cancelled', 'trial') DEFAULT 'trial',
    subscription_starts_at DATETIME,
    subscription_ends_at DATETIME,
    trial_ends_at DATETIME,
    
    -- Metadados
    settings JSON, -- Configurações personalizadas por tenant
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE RESTRICT,
    
    INDEX idx_owner (owner_id),
    INDEX idx_plan (plan_id),
    INDEX idx_tax_id (tax_id),
    INDEX idx_subscription_status (subscription_status),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 4. CAMADA DE CONTROLE DE ACESSO (IAM)
-- =====================================================

-- Perfis/Cargos disponíveis
CREATE TABLE roles (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    tenant_id CHAR(36) NOT NULL,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) NOT NULL,
    description TEXT,
    
    -- Permissões em formato JSON (flexível)
    permissions JSON NOT NULL, 
    -- Ex: {
    --   "products": ["view", "create", "edit", "delete"],
    --   "sales": ["view", "create"],
    --   "invoices": ["view", "issue"],
    --   "reports": ["view"],
    --   "settings": []
    -- }
    
    is_system_role BOOLEAN DEFAULT FALSE, -- Roles padrão do sistema
    sort_order INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    
    UNIQUE KEY unique_tenant_slug (tenant_id, slug),
    INDEX idx_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Relacionamento Usuário-Negócio (Membros)
CREATE TABLE tenant_memberships (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    tenant_id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    role_id CHAR(36) NOT NULL,
    
    -- Status do vínculo
    status ENUM('active', 'inactive', 'pending_invitation') DEFAULT 'active',
    invitation_token VARCHAR(255),
    invitation_expires_at DATETIME,
    
    -- Metadados
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_access DATETIME,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT,
    
    UNIQUE KEY unique_tenant_user (tenant_id, user_id),
    INDEX idx_tenant (tenant_id),
    INDEX idx_user (user_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 5. CAMADA DE PRODUTOS E ESTOQUE
-- =====================================================

-- Categorias de produtos
CREATE TABLE product_categories (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    tenant_id CHAR(36) NOT NULL,
    parent_id CHAR(36), -- Para categorias hierárquicas
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES product_categories(id) ON DELETE SET NULL,
    
    UNIQUE KEY unique_tenant_slug (tenant_id, slug),
    INDEX idx_tenant (tenant_id),
    INDEX idx_parent (parent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Fornecedores
CREATE TABLE suppliers (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    tenant_id CHAR(36) NOT NULL,
    
    -- Dados do fornecedor
    name VARCHAR(255) NOT NULL,
    tax_id VARCHAR(18), -- CPF ou CNPJ
    email VARCHAR(255),
    phone VARCHAR(20),
    contact_person VARCHAR(255),
    
    -- Endereço
    address_street VARCHAR(255),
    address_number VARCHAR(20),
    address_complement VARCHAR(100),
    address_neighborhood VARCHAR(100),
    address_city VARCHAR(100),
    address_state CHAR(2),
    address_zipcode VARCHAR(10),
    
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    
    INDEX idx_tenant (tenant_id),
    INDEX idx_tax_id (tax_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cadastro mestre de produtos
CREATE TABLE products (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    tenant_id CHAR(36) NOT NULL,
    category_id CHAR(36),
    supplier_id CHAR(36),
    
    -- Identificação
    internal_code VARCHAR(100), -- Código interno da empresa
    barcode VARCHAR(100), -- EAN/GTIN
    sku VARCHAR(100), -- Stock Keeping Unit
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Dados fiscais
    ncm VARCHAR(10), -- Nomenclatura Comum do Mercosul
    cest VARCHAR(10), -- Código Especificador da Substituição Tributária
    cfop_entrada VARCHAR(4), -- CFOP padrão para entrada
    cfop_saida VARCHAR(4), -- CFOP padrão para saída
    cst_icms VARCHAR(3), -- Código de Situação Tributária ICMS
    cst_pis VARCHAR(2), -- CST PIS
    cst_cofins VARCHAR(2), -- CST COFINS
    origem_produto TINYINT DEFAULT 0, -- Origem da mercadoria (0=Nacional, 1=Estrangeira)
    
    -- Reforma Tributária 2026 (IBS/CBS)
    c_class_trib VARCHAR(20), -- Código de Classificação Tributária RTC
    aliquota_ibs DECIMAL(5,2), -- Alíquota IBS em %
    aliquota_cbs DECIMAL(5,2), -- Alíquota CBS em %
    
    -- Unidade e medidas
    unit_of_measure VARCHAR(10) DEFAULT 'UN', -- UN, KG, L, M, CX, etc
    weight_kg DECIMAL(10,3),
    length_cm DECIMAL(10,2),
    width_cm DECIMAL(10,2),
    height_cm DECIMAL(10,2),
    
    -- Preços
    cost_price DECIMAL(10,2), -- Custo médio ponderado
    selling_price DECIMAL(10,2),
    min_price DECIMAL(10,2), -- Preço mínimo permitido
    profit_margin DECIMAL(5,2), -- Margem de lucro em %
    
    -- Estoque
    current_stock DECIMAL(10,3) DEFAULT 0,
    min_stock DECIMAL(10,3) DEFAULT 0, -- Estoque mínimo (alerta)
    max_stock DECIMAL(10,3), -- Estoque máximo
    
    -- Imagens
    images JSON, -- Array de URLs: ["url1", "url2", "url3"]
    
    -- Controle
    is_active BOOLEAN DEFAULT TRUE,
    is_saleable BOOLEAN DEFAULT TRUE,
    is_purchasable BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES product_categories(id) ON DELETE SET NULL,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
    
    INDEX idx_tenant (tenant_id),
    INDEX idx_barcode (barcode),
    INDEX idx_sku (sku),
    INDEX idx_internal_code (internal_code),
    INDEX idx_ncm (ncm),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Variações de produtos (Ex: tamanhos, cores)
CREATE TABLE product_variants (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    product_id CHAR(36) NOT NULL,
    
    variant_name VARCHAR(255) NOT NULL, -- Ex: "Tamanho P - Cor Azul"
    sku VARCHAR(100) UNIQUE,
    barcode VARCHAR(100),
    
    cost_price DECIMAL(10,2),
    selling_price DECIMAL(10,2),
    current_stock DECIMAL(10,3) DEFAULT 0,
    
    attributes JSON, -- Ex: {"size": "P", "color": "Azul"}
    image_url VARCHAR(500),
    
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    
    INDEX idx_product (product_id),
    INDEX idx_sku (sku)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Lotes/Batches de produtos (rastreabilidade)
CREATE TABLE product_batches (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    product_id CHAR(36) NOT NULL,
    tenant_id CHAR(36) NOT NULL,
    
    batch_number VARCHAR(100) NOT NULL, -- Número do lote
    purchase_date DATE NOT NULL,
    expiration_date DATE, -- Data de validade (para produtos perecíveis)
    
    cost_price DECIMAL(10,2) NOT NULL,
    selling_price DECIMAL(10,2),
    
    quantity_received DECIMAL(10,3) NOT NULL,
    quantity_remaining DECIMAL(10,3) NOT NULL,
    
    xml_reference VARCHAR(255), -- Referência ao XML importado
    invoice_number VARCHAR(50), -- Número da NF-e de entrada
    
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    
    INDEX idx_product (product_id),
    INDEX idx_tenant (tenant_id),
    INDEX idx_batch_number (batch_number),
    INDEX idx_expiration (expiration_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Depósitos/Armazéns (localizações físicas)
CREATE TABLE warehouses (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    tenant_id CHAR(36) NOT NULL,
    
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    description TEXT,
    
    -- Endereço do depósito
    address_street VARCHAR(255),
    address_number VARCHAR(20),
    address_city VARCHAR(100),
    address_state CHAR(2),
    
    is_main BOOLEAN DEFAULT FALSE, -- Depósito principal
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    
    INDEX idx_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Níveis de estoque por depósito e lote
CREATE TABLE stock_levels (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    product_id CHAR(36) NOT NULL,
    warehouse_id CHAR(36) NOT NULL,
    batch_id CHAR(36), -- NULL se não usa controle de lote
    tenant_id CHAR(36) NOT NULL,
    
    quantity DECIMAL(10,3) NOT NULL DEFAULT 0,
    reserved_quantity DECIMAL(10,3) DEFAULT 0, -- Estoque reservado (pedidos)
    
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE,
    FOREIGN KEY (batch_id) REFERENCES product_batches(id) ON DELETE SET NULL,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    
    UNIQUE KEY unique_stock_location (product_id, warehouse_id, batch_id),
    INDEX idx_product (product_id),
    INDEX idx_warehouse (warehouse_id),
    INDEX idx_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Movimentações de estoque (log completo)
CREATE TABLE inventory_movements (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    tenant_id CHAR(36) NOT NULL,
    product_id CHAR(36) NOT NULL,
    warehouse_id CHAR(36),
    batch_id CHAR(36),
    user_id CHAR(36) NOT NULL, -- Quem executou a movimentação
    
    movement_type ENUM('purchase', 'sale', 'adjustment', 'transfer', 'return', 'loss') NOT NULL,
    quantity DECIMAL(10,3) NOT NULL, -- Positivo=Entrada, Negativo=Saída
    unit_cost DECIMAL(10,2),
    
    reference_type VARCHAR(50), -- 'sale', 'purchase_order', 'invoice', 'manual'
    reference_id CHAR(36), -- ID do documento relacionado
    reference_number VARCHAR(100), -- Número do documento (NF, Pedido)
    
    notes TEXT,
    movement_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE SET NULL,
    FOREIGN KEY (batch_id) REFERENCES product_batches(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    
    INDEX idx_tenant (tenant_id),
    INDEX idx_product (product_id),
    INDEX idx_type (movement_type),
    INDEX idx_date (movement_date),
    INDEX idx_reference (reference_type, reference_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 6. CAMADA DE CLIENTES
-- =====================================================

CREATE TABLE customers (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    tenant_id CHAR(36) NOT NULL,
    
    -- Tipo de cliente
    customer_type ENUM('individual', 'business') NOT NULL,
    
    -- Dados pessoais/empresariais
    name VARCHAR(255) NOT NULL,
    trading_name VARCHAR(255), -- Nome fantasia (PJ)
    tax_id VARCHAR(18), -- CPF ou CNPJ
    state_registration VARCHAR(20), -- IE
    municipal_registration VARCHAR(20), -- IM
    
    -- Contato
    email VARCHAR(255),
    phone VARCHAR(20),
    mobile VARCHAR(20),
    
    -- Endereço principal
    address_street VARCHAR(255),
    address_number VARCHAR(20),
    address_complement VARCHAR(100),
    address_neighborhood VARCHAR(100),
    address_city VARCHAR(100),
    address_state CHAR(2),
    address_zipcode VARCHAR(10),
    
    -- Dados comerciais
    credit_limit DECIMAL(10,2) DEFAULT 0,
    payment_terms VARCHAR(100), -- "30 dias", "À vista", etc
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    
    INDEX idx_tenant (tenant_id),
    INDEX idx_tax_id (tax_id),
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 7. CAMADA DE VENDAS E PDV
-- =====================================================

-- Sessões de caixa (turnos)
CREATE TABLE pos_sessions (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    tenant_id CHAR(36) NOT NULL,
    warehouse_id CHAR(36), -- Caixa vinculado a um depósito
    user_id CHAR(36) NOT NULL, -- Operador do caixa
    
    session_number INT NOT NULL,
    
    opened_at DATETIME NOT NULL,
    closed_at DATETIME,
    
    opening_balance DECIMAL(10,2) NOT NULL DEFAULT 0,
    closing_balance DECIMAL(10,2),
    expected_balance DECIMAL(10,2), -- Saldo esperado (calculado)
    difference DECIMAL(10,2), -- Diferença (sangria/sobra)
    
    total_sales DECIMAL(10,2) DEFAULT 0,
    total_sales_count INT DEFAULT 0,
    
    notes TEXT,
    status ENUM('open', 'closed') DEFAULT 'open',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    
    INDEX idx_tenant (tenant_id),
    INDEX idx_user (user_id),
    INDEX idx_status (status),
    INDEX idx_opened (opened_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Vendas (cabeçalho)
CREATE TABLE sales (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    tenant_id CHAR(36) NOT NULL,
    pos_session_id CHAR(36), -- NULL se venda não foi pelo PDV
    customer_id CHAR(36),
    user_id CHAR(36) NOT NULL, -- Vendedor
    warehouse_id CHAR(36), -- De onde saiu o estoque
    
    sale_number VARCHAR(50) NOT NULL, -- Número sequencial da venda
    sale_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Valores
    subtotal DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    shipping_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    
    -- Pagamento
    payment_method ENUM('cash', 'credit_card', 'debit_card', 'pix', 'bank_slip', 'bank_transfer', 'multiple') NOT NULL,
    payment_status ENUM('pending', 'paid', 'partially_paid', 'cancelled') DEFAULT 'pending',
    paid_amount DECIMAL(10,2) DEFAULT 0,
    
    -- Fiscal
    invoice_id CHAR(36), -- Vincula à NF-e/NFS-e emitida
    
    -- Origem da venda
    sale_channel ENUM('pos', 'online', 'marketplace', 'manual') DEFAULT 'pos',
    marketplace_order_id VARCHAR(100), -- ID do pedido no marketplace
    
    notes TEXT,
    status ENUM('draft', 'completed', 'cancelled', 'returned') DEFAULT 'completed',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (pos_session_id) REFERENCES pos_sessions(id) ON DELETE SET NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE SET NULL,
    
    INDEX idx_tenant (tenant_id),
    INDEX idx_session (pos_session_id),
    INDEX idx_customer (customer_id),
    INDEX idx_sale_date (sale_date),
    INDEX idx_status (status),
    INDEX idx_sale_number (sale_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Itens das vendas (detalhe)
CREATE TABLE sale_items (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    sale_id CHAR(36) NOT NULL,
    product_id CHAR(36) NOT NULL,
    batch_id CHAR(36), -- Rastreabilidade de lote
    
    quantity DECIMAL(10,3) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_price DECIMAL(10,2) NOT NULL,
    
    cost_price DECIMAL(10,2), -- Para cálculo de lucro
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    FOREIGN KEY (batch_id) REFERENCES product_batches(id) ON DELETE SET NULL,
    
    INDEX idx_sale (sale_id),
    INDEX idx_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Pagamentos das vendas (múltiplos pagamentos)
CREATE TABLE sale_payments (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    sale_id CHAR(36) NOT NULL,
    
    payment_method ENUM('cash', 'credit_card', 'debit_card', 'pix', 'bank_slip', 'bank_transfer') NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    
    -- Dados do cartão/PIX
    card_brand VARCHAR(50), -- Visa, Master, Elo
    card_last_digits VARCHAR(4),
    installments INT DEFAULT 1,
    pix_key VARCHAR(255),
    pix_qrcode TEXT,
    
    payment_date DATETIME,
    status ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
    
    gateway_transaction_id VARCHAR(255), -- ID da transação no gateway
    gateway_response JSON, -- Resposta completa do gateway
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
    
    INDEX idx_sale (sale_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 8. CAMADA DE NOTAS FISCAIS
-- =====================================================

-- Notas fiscais (NF-e e NFS-e)
CREATE TABLE invoices (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    tenant_id CHAR(36) NOT NULL,
    sale_id CHAR(36), -- NULL para NF de entrada
    customer_id CHAR(36),
    supplier_id CHAR(36), -- Para NF de entrada
    
    -- Tipo e série
    invoice_type ENUM('nfe', 'nfse', 'nfce') NOT NULL,
    direction ENUM('inbound', 'outbound') NOT NULL, -- Entrada ou Saída
    series INT NOT NULL,
    number INT NOT NULL,
    
    -- Chave de acesso (44 dígitos)
    access_key VARCHAR(44) UNIQUE,
    
    -- Status SEFAZ
    status ENUM('draft', 'pending', 'authorized', 'rejected', 'cancelled', 'denied') DEFAULT 'draft',
    authorization_protocol VARCHAR(50),
    authorization_date DATETIME,
    
    -- Datas
    issue_date DATETIME NOT NULL,
    operation_date DATE,
    
    -- Valores totais
    total_products DECIMAL(10,2) NOT NULL,
    total_services DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    shipping_amount DECIMAL(10,2) DEFAULT 0,
    insurance_amount DECIMAL(10,2) DEFAULT 0,
    other_expenses DECIMAL(10,2) DEFAULT 0,
    
    -- Impostos (Sistema Atual - até 2026)
    icms_base DECIMAL(10,2) DEFAULT 0,
    icms_amount DECIMAL(10,2) DEFAULT 0,
    icms_st_base DECIMAL(10,2) DEFAULT 0,
    icms_st_amount DECIMAL(10,2) DEFAULT 0,
    ipi_amount DECIMAL(10,2) DEFAULT 0,
    pis_amount DECIMAL(10,2) DEFAULT 0,
    cofins_amount DECIMAL(10,2) DEFAULT 0,
    iss_amount DECIMAL(10,2) DEFAULT 0,
    
    -- Reforma Tributária 2026 (IBS/CBS)
    ibs_amount DECIMAL(10,2) DEFAULT 0,
    cbs_amount DECIMAL(10,2) DEFAULT 0,
    
    total_tax DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    
    -- CFOP e natureza da operação
    cfop VARCHAR(4),
    operation_nature VARCHAR(255),
    
    -- XMLs e arquivos
    xml_content LONGTEXT, -- XML completo da nota
    xml_signed LONGTEXT, -- XML assinado
    pdf_url VARCHAR(500), -- DANFE em PDF
    
    -- Cancelamento
    cancellation_reason TEXT,
    cancellation_protocol VARCHAR(50),
    cancelled_at DATETIME,
    
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE SET NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
    
    UNIQUE KEY unique_tenant_series_number (tenant_id, invoice_type, series, number),
    INDEX idx_tenant (tenant_id),
    INDEX idx_sale (sale_id),
    INDEX idx_access_key (access_key),
    INDEX idx_status (status),
    INDEX idx_issue_date (issue_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Itens da nota fiscal
CREATE TABLE invoice_items (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    invoice_id CHAR(36) NOT NULL,
    product_id CHAR(36),
    
    item_number INT NOT NULL, -- Número sequencial do item na nota
    
    -- Descrição do produto/serviço
    code VARCHAR(100),
    description VARCHAR(500) NOT NULL,
    ncm VARCHAR(10),
    cest VARCHAR(10),
    cfop VARCHAR(4) NOT NULL,
    unit_of_measure VARCHAR(10),
    
    quantity DECIMAL(10,3) NOT NULL,
    unit_price DECIMAL(10,4) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    
    -- Impostos do item (Sistema Atual)
    icms_origin TINYINT,
    icms_cst VARCHAR(3),
    icms_base DECIMAL(10,2) DEFAULT 0,
    icms_rate DECIMAL(5,2) DEFAULT 0,
    icms_amount DECIMAL(10,2) DEFAULT 0,
    
    ipi_cst VARCHAR(2),
    ipi_rate DECIMAL(5,2) DEFAULT 0,
    ipi_amount DECIMAL(10,2) DEFAULT 0,
    
    pis_cst VARCHAR(2),
    pis_rate DECIMAL(5,2) DEFAULT 0,
    pis_amount DECIMAL(10,2) DEFAULT 0,
    
    cofins_cst VARCHAR(2),
    cofins_rate DECIMAL(5,2) DEFAULT 0,
    cofins_amount DECIMAL(10,2) DEFAULT 0,
    
    -- Reforma Tributária 2026 (IBS/CBS)
    c_class_trib VARCHAR(20), -- Código de Classificação Tributária
    ibs_rate DECIMAL(5,2) DEFAULT 0,
    ibs_amount DECIMAL(10,2) DEFAULT 0,
    cbs_rate DECIMAL(5,2) DEFAULT 0,
    cbs_amount DECIMAL(10,2) DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
    
    INDEX idx_invoice (invoice_id),
    INDEX idx_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 9. CAMADA DE INTEGRAÇÕES E MARKETPLACES
-- =====================================================

-- Contas de marketplace conectadas
CREATE TABLE marketplace_accounts (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    tenant_id CHAR(36) NOT NULL,
    
    platform ENUM('mercado_livre', 'shopee', 'amazon', 'magalu', 'b2w') NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    
    -- OAuth tokens
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    token_expires_at DATETIME,
    
    -- Dados da conta
    seller_id VARCHAR(255),
    shop_id VARCHAR(255),
    
    -- Configurações
    auto_sync_stock BOOLEAN DEFAULT TRUE,
    auto_import_orders BOOLEAN DEFAULT TRUE,
    auto_update_tracking BOOLEAN DEFAULT TRUE,
    
    is_active BOOLEAN DEFAULT TRUE,
    last_sync_at DATETIME,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    
    UNIQUE KEY unique_tenant_platform (tenant_id, platform, seller_id),
    INDEX idx_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Mapeamento produto -> anúncio marketplace
CREATE TABLE marketplace_listings (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    marketplace_account_id CHAR(36) NOT NULL,
    product_id CHAR(36) NOT NULL,
    
    external_id VARCHAR(255) NOT NULL, -- ID do anúncio no marketplace
    external_sku VARCHAR(255),
    title VARCHAR(500),
    
    price DECIMAL(10,2),
    stock_quantity INT,
    
    listing_url VARCHAR(500),
    status ENUM('active', 'paused', 'inactive') DEFAULT 'active',
    
    last_sync_at DATETIME,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (marketplace_account_id) REFERENCES marketplace_accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    
    UNIQUE KEY unique_account_external (marketplace_account_id, external_id),
    INDEX idx_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 10. CAMADA DE ETIQUETAS E LOGÍSTICA
-- =====================================================

-- Configurações de impressão de etiquetas
CREATE TABLE shipping_label_templates (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    tenant_id CHAR(36) NOT NULL,
    
    name VARCHAR(255) NOT NULL,
    label_type ENUM('shipping', 'product', 'barcode') NOT NULL,
    
    -- Dimensões da etiqueta (mm)
    width_mm INT NOT NULL,
    height_mm INT NOT NULL,
    
    -- Template ZPL ou HTML
    template_format ENUM('zpl', 'html', 'pdf') NOT NULL,
    template_content TEXT NOT NULL,
    
    is_default BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    
    INDEX idx_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Envios/expedições
CREATE TABLE shipments (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    tenant_id CHAR(36) NOT NULL,
    sale_id CHAR(36) NOT NULL,
    
    tracking_code VARCHAR(255),
    carrier VARCHAR(100), -- Correios, Jadlog, etc
    service_type VARCHAR(100), -- PAC, SEDEX, etc
    
    -- Peso e dimensões
    weight_kg DECIMAL(10,3),
    length_cm DECIMAL(10,2),
    width_cm DECIMAL(10,2),
    height_cm DECIMAL(10,2),
    
    shipping_cost DECIMAL(10,2),
    declared_value DECIMAL(10,2),
    
    -- Status
    status ENUM('pending', 'shipped', 'in_transit', 'delivered', 'failed', 'returned') DEFAULT 'pending',
    shipped_at DATETIME,
    delivered_at DATETIME,
    
    -- Etiqueta
    label_url VARCHAR(500),
    label_printed BOOLEAN DEFAULT FALSE,
    label_printed_at DATETIME,
    
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
    
    INDEX idx_tenant (tenant_id),
    INDEX idx_sale (sale_id),
    INDEX idx_tracking (tracking_code),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 11. CAMADA FINANCEIRA
-- =====================================================

-- Contas bancárias
CREATE TABLE bank_accounts (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    tenant_id CHAR(36) NOT NULL,
    
    bank_name VARCHAR(255) NOT NULL,
    bank_code VARCHAR(10),
    agency VARCHAR(20),
    account_number VARCHAR(50),
    account_type ENUM('checking', 'savings', 'payment') NOT NULL,
    
    balance DECIMAL(10,2) DEFAULT 0,
    
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    
    INDEX idx_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Categorias financeiras
CREATE TABLE financial_categories (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    tenant_id CHAR(36) NOT NULL,
    parent_id CHAR(36),
    
    name VARCHAR(255) NOT NULL,
    type ENUM('income', 'expense') NOT NULL,
    
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES financial_categories(id) ON DELETE SET NULL,
    
    INDEX idx_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Lançamentos financeiros (contas a pagar/receber)
CREATE TABLE financial_transactions (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    tenant_id CHAR(36) NOT NULL,
    bank_account_id CHAR(36),
    category_id CHAR(36),
    
    transaction_type ENUM('income', 'expense', 'transfer') NOT NULL,
    
    description VARCHAR(500) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    
    -- Relacionamentos
    customer_id CHAR(36), -- Para receitas
    supplier_id CHAR(36), -- Para despesas
    sale_id CHAR(36), -- Vinculado a uma venda
    invoice_id CHAR(36), -- Vinculado a uma NF
    
    -- Datas
    due_date DATE NOT NULL,
    payment_date DATE,
    
    -- Status
    status ENUM('pending', 'paid', 'overdue', 'cancelled', 'partially_paid') DEFAULT 'pending',
    paid_amount DECIMAL(10,2) DEFAULT 0,
    
    payment_method VARCHAR(50),
    
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (bank_account_id) REFERENCES bank_accounts(id) ON DELETE SET NULL,
    FOREIGN KEY (category_id) REFERENCES financial_categories(id) ON DELETE SET NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE SET NULL,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL,
    
    INDEX idx_tenant (tenant_id),
    INDEX idx_type (transaction_type),
    INDEX idx_status (status),
    INDEX idx_due_date (due_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 12. CAMADA DE AUDITORIA E LOGS
-- =====================================================

-- Log de importações XML
CREATE TABLE import_logs (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    tenant_id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    
    file_name VARCHAR(255) NOT NULL,
    file_size INT,
    import_type ENUM('nfe', 'nfse', 'products', 'customers') NOT NULL,
    
    total_items INT DEFAULT 0,
    success_items INT DEFAULT 0,
    failed_items INT DEFAULT 0,
    
    errors JSON, -- Array de erros encontrados
    
    status ENUM('processing', 'completed', 'failed') DEFAULT 'processing',
    
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    
    INDEX idx_tenant (tenant_id),
    INDEX idx_status (status),
    INDEX idx_started (started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Auditoria de ações críticas
CREATE TABLE audit_logs (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    tenant_id CHAR(36),
    user_id CHAR(36),
    
    action VARCHAR(100) NOT NULL, -- 'create', 'update', 'delete', 'login', etc
    entity_type VARCHAR(100) NOT NULL, -- 'product', 'sale', 'invoice', etc
    entity_id CHAR(36),
    
    old_values JSON, -- Valores antes da alteração
    new_values JSON, -- Valores depois da alteração
    
    ip_address VARCHAR(50),
    user_agent TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_tenant (tenant_id),
    INDEX idx_user (user_id),
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_action (action),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Alertas do sistema
CREATE TABLE system_alerts (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    tenant_id CHAR(36) NOT NULL,
    
    alert_type ENUM('low_stock', 'expiring_batch', 'certificate_expiring', 'payment_overdue', 'system') NOT NULL,
    severity ENUM('info', 'warning', 'error', 'critical') NOT NULL,
    
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    
    entity_type VARCHAR(100), -- Tipo de entidade relacionada
    entity_id CHAR(36), -- ID da entidade relacionada
    
    is_read BOOLEAN DEFAULT FALSE,
    read_at DATETIME,
    read_by CHAR(36),
    
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    
    INDEX idx_tenant (tenant_id),
    INDEX idx_type (alert_type),
    INDEX idx_severity (severity),
    INDEX idx_active (is_active),
    INDEX idx_read (is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 13. DADOS INICIAIS E CONFIGURAÇÕES
-- =====================================================

-- Inserir planos de exemplo
INSERT INTO subscription_plans (name, slug, price_monthly, price_yearly, max_businesses, max_employees_per_business, max_products, max_monthly_invoices, storage_limit_mb, features) VALUES
('Básico', 'basic', 49.90, 499.00, 1, 3, 500, 50, 512, '{"nfe": false, "nfse": true, "marketplace_integration": false, "multi_warehouse": false}'),
('Profissional', 'professional', 149.90, 1499.00, 3, 10, 5000, 500, 5120, '{"nfe": true, "nfse": true, "marketplace_integration": true, "multi_warehouse": true}'),
('Empresarial', 'enterprise', 399.90, 3999.00, 10, 50, 50000, 5000, 51200, '{"nfe": true, "nfse": true, "marketplace_integration": true, "multi_warehouse": true, "api_access": true}');

-- =====================================================
-- ÍNDICES COMPOSTOS PARA PERFORMANCE
-- =====================================================

-- Melhorar consultas de produtos por tenant
CREATE INDEX idx_products_tenant_active ON products(tenant_id, is_active, name);

-- Melhorar consultas de vendas por período
CREATE INDEX idx_sales_tenant_date ON sales(tenant_id, sale_date, status);

-- Melhorar consultas de estoque
CREATE INDEX idx_stock_tenant_product ON stock_levels(tenant_id, product_id, warehouse_id);

-- Melhorar consultas de movimentações
CREATE INDEX idx_movements_tenant_date ON inventory_movements(tenant_id, movement_date, movement_type);

-- Melhorar consultas de NF por status
CREATE INDEX idx_invoices_tenant_status ON invoices(tenant_id, status, issue_date);

-- =====================================================
-- VIEWS ÚTEIS PARA RELATÓRIOS
-- =====================================================

-- View: Estoque consolidado por produto
CREATE VIEW v_consolidated_stock AS
SELECT 
    p.tenant_id,
    p.id AS product_id,
    p.name AS product_name,
    p.sku,
    p.barcode,
    COALESCE(SUM(sl.quantity), 0) AS total_stock,
    COALESCE(SUM(sl.reserved_quantity), 0) AS reserved_stock,
    COALESCE(SUM(sl.quantity - sl.reserved_quantity), 0) AS available_stock,
    p.min_stock,
    p.cost_price,
    p.selling_price
FROM products p
LEFT JOIN stock_levels sl ON p.id = sl.product_id
WHERE p.is_active = TRUE
GROUP BY p.id;

-- View: Vendas com detalhes do cliente
CREATE VIEW v_sales_summary AS
SELECT 
    s.id AS sale_id,
    s.tenant_id,
    s.sale_number,
    s.sale_date,
    s.total_amount,
    s.payment_status,
    s.status,
    c.name AS customer_name,
    c.tax_id AS customer_tax_id,
    u.name AS seller_name,
    COUNT(si.id) AS items_count
FROM sales s
LEFT JOIN customers c ON s.customer_id = c.id
LEFT JOIN users u ON s.user_id = u.id
LEFT JOIN sale_items si ON s.id = si.sale_id
GROUP BY s.id;

-- =====================================================
-- TRIGGERS PARA AUTOMAÇÃO
-- =====================================================

-- Trigger: Atualizar estoque atual do produto ao inserir movimentação
DELIMITER //
CREATE TRIGGER trg_update_product_stock_after_movement
AFTER INSERT ON inventory_movements
FOR EACH ROW
BEGIN
    UPDATE products 
    SET current_stock = current_stock + NEW.quantity
    WHERE id = NEW.product_id;
END//
DELIMITER ;

-- Trigger: Atualizar números de série de NF ao criar tenant
DELIMITER //
CREATE TRIGGER trg_init_tenant_invoice_numbers
AFTER INSERT ON tenants
FOR EACH ROW
BEGIN
    -- Criar depósito principal automaticamente
    INSERT INTO warehouses (tenant_id, name, code, is_main, is_active)
    VALUES (NEW.id, 'Depósito Principal', 'DEP001', TRUE, TRUE);
    
    -- Criar roles padrão
    INSERT INTO roles (tenant_id, name, slug, permissions, is_system_role)
    VALUES 
    (NEW.id, 'Administrador', 'admin', '{"all": true}', TRUE),
    (NEW.id, 'Vendedor', 'seller', '{"sales": ["view", "create"], "products": ["view"], "customers": ["view", "create"]}', TRUE),
    (NEW.id, 'Estoquista', 'stock_manager', '{"products": ["view", "create", "edit"], "inventory": ["view", "manage"], "suppliers": ["view"]}', TRUE);
END//
DELIMITER ;

-- =====================================================
-- COMENTÁRIOS FINAIS
-- =====================================================

-- Esta modelagem cobre:
-- ✅ Multi-tenancy com isolamento por tenant_id
-- ✅ Sistema de usuários com múltiplos negócios
-- ✅ Controle granular de permissões (RBAC)
-- ✅ Gestão completa de estoque com lotes e depósitos
-- ✅ Sistema de vendas e PDV
-- ✅ Emissão de NF-e/NFS-e com suporte à Reforma Tributária 2026
-- ✅ Integrações com marketplaces
-- ✅ Sistema financeiro completo
-- ✅ Auditoria e logs
-- ✅ Suporte a etiquetas e logística

-- PRÓXIMOS PASSOS:
-- 1. Implementar RLS (Row Level Security) no PostgreSQL ou lógica equivalente no MySQL
-- 2. Criar stored procedures para operações complexas (fechamento de caixa, cálculo de impostos)
-- 3. Implementar sistema de backup granular por tenant
-- 4. Criar jobs para: sincronização de marketplaces, alertas de estoque baixo, vencimento de certificados
-- 5. Implementar cache Redis para consultas frequentes (estoque disponível, saldo de caixa)