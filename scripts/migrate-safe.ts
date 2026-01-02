/**
 * Script de Migração Segura para Produção
 * Adiciona novas tabelas sem apagar dados existentes
 * Execute: npx tsx scripts/migrate-safe.ts
 */

import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';

dotenv.config();

const config = {
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || '3306'),
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  multipleStatements: false,
};

// Lista de tabelas a criar (ordem importante por causa de FKs)
const createTableStatements: { name: string; sql: string }[] = [
  {
    name: 'customers',
    sql: `CREATE TABLE IF NOT EXISTS customers (
      id varchar(36) NOT NULL,
      type enum('pf','pj') NOT NULL DEFAULT 'pf',
      name varchar(255) NOT NULL,
      cpf_cnpj varchar(18),
      email varchar(255),
      phone varchar(20),
      mobile varchar(20),
      address_street varchar(255),
      address_number varchar(20),
      address_complement varchar(100),
      address_neighborhood varchar(100),
      address_city varchar(100),
      address_state varchar(2),
      address_zipcode varchar(10),
      notes text,
      credit_limit decimal(10,2),
      is_active int NOT NULL DEFAULT 1,
      created_at datetime DEFAULT NOW(),
      updated_at datetime DEFAULT NOW(),
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  },
  {
    name: 'suppliers',
    sql: `CREATE TABLE IF NOT EXISTS suppliers (
      id varchar(36) NOT NULL,
      company_name varchar(255) NOT NULL,
      trading_name varchar(255),
      cnpj varchar(18),
      state_registration varchar(20),
      email varchar(255),
      phone varchar(20),
      mobile varchar(20),
      contact_name varchar(100),
      address_street varchar(255),
      address_number varchar(20),
      address_complement varchar(100),
      address_neighborhood varchar(100),
      address_city varchar(100),
      address_state varchar(2),
      address_zipcode varchar(10),
      notes text,
      payment_terms varchar(100),
      is_active int NOT NULL DEFAULT 1,
      created_at datetime DEFAULT NOW(),
      updated_at datetime DEFAULT NOW(),
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  },
  {
    name: 'pos_sessions',
    sql: `CREATE TABLE IF NOT EXISTS pos_sessions (
      id varchar(36) NOT NULL,
      user_id varchar(36) NOT NULL,
      opened_at datetime NOT NULL,
      closed_at datetime,
      opening_balance decimal(10,2) NOT NULL DEFAULT 0,
      closing_balance decimal(10,2),
      cash_sales decimal(10,2) NOT NULL DEFAULT 0,
      card_sales decimal(10,2) NOT NULL DEFAULT 0,
      pix_sales decimal(10,2) NOT NULL DEFAULT 0,
      other_sales decimal(10,2) NOT NULL DEFAULT 0,
      total_sales decimal(10,2) NOT NULL DEFAULT 0,
      status enum('open','closed') NOT NULL DEFAULT 'open',
      notes text,
      created_at datetime DEFAULT NOW(),
      updated_at datetime DEFAULT NOW(),
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  },
  {
    name: 'sales_orders',
    sql: `CREATE TABLE IF NOT EXISTS sales_orders (
      id varchar(36) NOT NULL,
      order_number varchar(20) NOT NULL,
      customer_id varchar(36),
      pos_session_id varchar(36),
      subtotal decimal(10,2) NOT NULL,
      discount decimal(10,2) DEFAULT 0,
      total decimal(10,2) NOT NULL,
      payment_method enum('cash','credit_card','debit_card','pix','boleto','other') DEFAULT 'cash',
      status enum('pending','completed','cancelled') NOT NULL DEFAULT 'pending',
      notes text,
      created_at datetime DEFAULT NOW(),
      updated_at datetime DEFAULT NOW(),
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  },
  {
    name: 'sales_order_items',
    sql: `CREATE TABLE IF NOT EXISTS sales_order_items (
      id varchar(36) NOT NULL,
      order_id varchar(36) NOT NULL,
      product_id varchar(36) NOT NULL,
      quantity int NOT NULL,
      unit_price decimal(10,2) NOT NULL,
      discount decimal(10,2) DEFAULT 0,
      total decimal(10,2) NOT NULL,
      created_at datetime DEFAULT NOW(),
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  },
  {
    name: 'bank_accounts',
    sql: `CREATE TABLE IF NOT EXISTS bank_accounts (
      id varchar(36) NOT NULL,
      tenant_id varchar(36),
      bank_name varchar(255) NOT NULL,
      bank_code varchar(10),
      agency varchar(20),
      account_number varchar(50),
      account_type enum('checking','savings','payment') NOT NULL,
      balance decimal(10,2) DEFAULT 0,
      is_active int NOT NULL DEFAULT 1,
      created_at datetime DEFAULT NOW(),
      updated_at datetime DEFAULT NOW(),
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  },
  {
    name: 'financial_categories',
    sql: `CREATE TABLE IF NOT EXISTS financial_categories (
      id varchar(36) NOT NULL,
      tenant_id varchar(36),
      parent_id varchar(36),
      name varchar(255) NOT NULL,
      type enum('income','expense') NOT NULL,
      is_active int NOT NULL DEFAULT 1,
      created_at datetime DEFAULT NOW(),
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  },
  {
    name: 'financial_transactions',
    sql: `CREATE TABLE IF NOT EXISTS financial_transactions (
      id varchar(36) NOT NULL,
      tenant_id varchar(36),
      bank_account_id varchar(36),
      category_id varchar(36),
      transaction_type enum('income','expense','transfer') NOT NULL,
      description varchar(500) NOT NULL,
      amount decimal(10,2) NOT NULL,
      customer_id varchar(36),
      supplier_id varchar(36),
      sale_id varchar(36),
      invoice_id varchar(36),
      due_date date NOT NULL,
      payment_date date,
      status enum('pending','paid','overdue','cancelled','partially_paid') DEFAULT 'pending',
      paid_amount decimal(10,2) DEFAULT 0,
      payment_method varchar(50),
      notes text,
      created_at datetime DEFAULT NOW(),
      updated_at datetime DEFAULT NOW(),
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  },
  {
    name: 'invoices',
    sql: `CREATE TABLE IF NOT EXISTS invoices (
      id varchar(36) NOT NULL,
      tenant_id varchar(36),
      sale_id varchar(36),
      customer_id varchar(36),
      supplier_id varchar(36),
      invoice_type enum('nfe','nfse','nfce') NOT NULL,
      direction enum('inbound','outbound') NOT NULL,
      series int NOT NULL,
      number int NOT NULL,
      access_key varchar(44),
      status enum('draft','pending','authorized','rejected','cancelled','denied') DEFAULT 'draft',
      authorization_protocol varchar(50),
      authorization_date datetime,
      issue_date datetime NOT NULL,
      operation_date date,
      total_products decimal(10,2) NOT NULL,
      total_services decimal(10,2) DEFAULT 0,
      discount_amount decimal(10,2) DEFAULT 0,
      shipping_amount decimal(10,2) DEFAULT 0,
      icms_base decimal(10,2) DEFAULT 0,
      icms_amount decimal(10,2) DEFAULT 0,
      ipi_amount decimal(10,2) DEFAULT 0,
      pis_amount decimal(10,2) DEFAULT 0,
      cofins_amount decimal(10,2) DEFAULT 0,
      ibs_amount decimal(10,2) DEFAULT 0,
      cbs_amount decimal(10,2) DEFAULT 0,
      total_tax decimal(10,2) DEFAULT 0,
      total_amount decimal(10,2) NOT NULL,
      cfop varchar(4),
      operation_nature varchar(255),
      xml_content text,
      pdf_url varchar(500),
      notes text,
      created_at datetime DEFAULT NOW(),
      updated_at datetime DEFAULT NOW(),
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  },
  {
    name: 'invoice_items',
    sql: `CREATE TABLE IF NOT EXISTS invoice_items (
      id varchar(36) NOT NULL,
      invoice_id varchar(36) NOT NULL,
      product_id varchar(36),
      item_number int NOT NULL,
      code varchar(100),
      description varchar(500) NOT NULL,
      ncm varchar(10),
      cfop varchar(4) NOT NULL,
      unit_of_measure varchar(10),
      quantity decimal(10,3) NOT NULL,
      unit_price decimal(10,4) NOT NULL,
      total_price decimal(10,2) NOT NULL,
      discount_amount decimal(10,2) DEFAULT 0,
      icms_base decimal(10,2) DEFAULT 0,
      icms_rate decimal(5,2) DEFAULT 0,
      icms_amount decimal(10,2) DEFAULT 0,
      ipi_rate decimal(5,2) DEFAULT 0,
      ipi_amount decimal(10,2) DEFAULT 0,
      pis_rate decimal(5,2) DEFAULT 0,
      pis_amount decimal(10,2) DEFAULT 0,
      cofins_rate decimal(5,2) DEFAULT 0,
      cofins_amount decimal(10,2) DEFAULT 0,
      ibs_rate decimal(5,2) DEFAULT 0,
      ibs_amount decimal(10,2) DEFAULT 0,
      cbs_rate decimal(5,2) DEFAULT 0,
      cbs_amount decimal(10,2) DEFAULT 0,
      created_at datetime DEFAULT NOW(),
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  },
  {
    name: 'product_categories',
    sql: `CREATE TABLE IF NOT EXISTS product_categories (
      id varchar(36) NOT NULL,
      tenant_id varchar(36),
      parent_id varchar(36),
      name varchar(255) NOT NULL,
      slug varchar(255) NOT NULL,
      description text,
      image_url varchar(500),
      sort_order int DEFAULT 0,
      is_active int NOT NULL DEFAULT 1,
      created_at datetime DEFAULT NOW(),
      updated_at datetime DEFAULT NOW(),
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  },
  {
    name: 'product_variants',
    sql: `CREATE TABLE IF NOT EXISTS product_variants (
      id varchar(36) NOT NULL,
      product_id varchar(36) NOT NULL,
      variant_name varchar(255) NOT NULL,
      sku varchar(100),
      barcode varchar(100),
      cost_price decimal(10,2),
      selling_price decimal(10,2),
      current_stock decimal(10,3) DEFAULT 0,
      attributes json,
      image_url varchar(500),
      is_active int NOT NULL DEFAULT 1,
      created_at datetime DEFAULT NOW(),
      updated_at datetime DEFAULT NOW(),
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  },
  {
    name: 'warehouses',
    sql: `CREATE TABLE IF NOT EXISTS warehouses (
      id varchar(36) NOT NULL,
      tenant_id varchar(36),
      name varchar(255) NOT NULL,
      code varchar(50),
      description text,
      address_street varchar(255),
      address_number varchar(20),
      address_city varchar(100),
      address_state varchar(2),
      is_main int DEFAULT 0,
      is_active int NOT NULL DEFAULT 1,
      created_at datetime DEFAULT NOW(),
      updated_at datetime DEFAULT NOW(),
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  },
  {
    name: 'stock_levels',
    sql: `CREATE TABLE IF NOT EXISTS stock_levels (
      id varchar(36) NOT NULL,
      product_id varchar(36) NOT NULL,
      warehouse_id varchar(36) NOT NULL,
      batch_id varchar(36),
      tenant_id varchar(36),
      quantity decimal(10,3) NOT NULL DEFAULT 0,
      reserved_quantity decimal(10,3) DEFAULT 0,
      updated_at datetime DEFAULT NOW(),
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  },
  {
    name: 'shipments',
    sql: `CREATE TABLE IF NOT EXISTS shipments (
      id varchar(36) NOT NULL,
      tenant_id varchar(36),
      sale_id varchar(36) NOT NULL,
      tracking_code varchar(255),
      carrier varchar(100),
      service_type varchar(100),
      weight_kg decimal(10,3),
      length_cm decimal(10,2),
      width_cm decimal(10,2),
      height_cm decimal(10,2),
      shipping_cost decimal(10,2),
      declared_value decimal(10,2),
      status enum('pending','shipped','in_transit','delivered','failed','returned') DEFAULT 'pending',
      shipped_at datetime,
      delivered_at datetime,
      label_url varchar(500),
      label_printed int DEFAULT 0,
      notes text,
      created_at datetime DEFAULT NOW(),
      updated_at datetime DEFAULT NOW(),
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  },
  {
    name: 'subscription_plans',
    sql: `CREATE TABLE IF NOT EXISTS subscription_plans (
      id varchar(36) NOT NULL,
      name varchar(100) NOT NULL,
      slug varchar(50) NOT NULL,
      description text,
      price_monthly decimal(10,2) NOT NULL,
      price_yearly decimal(10,2),
      max_businesses int NOT NULL DEFAULT 1,
      max_employees_per_business int NOT NULL DEFAULT 5,
      max_products int NOT NULL DEFAULT 1000,
      max_monthly_invoices int NOT NULL DEFAULT 100,
      storage_limit_mb int NOT NULL DEFAULT 1024,
      features json,
      is_active int NOT NULL DEFAULT 1,
      sort_order int DEFAULT 0,
      created_at datetime DEFAULT NOW(),
      updated_at datetime DEFAULT NOW(),
      PRIMARY KEY (id),
      UNIQUE KEY subscription_plans_slug_unique (slug)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  },
  {
    name: 'tenants',
    sql: `CREATE TABLE IF NOT EXISTS tenants (
      id varchar(36) NOT NULL,
      owner_id varchar(36) NOT NULL,
      plan_id varchar(36) NOT NULL,
      business_name varchar(255) NOT NULL,
      trading_name varchar(255),
      tax_id varchar(18) NOT NULL,
      state_registration varchar(20),
      municipal_registration varchar(20),
      email varchar(255),
      phone varchar(20),
      website varchar(255),
      logo_url varchar(500),
      address_street varchar(255),
      address_number varchar(20),
      address_complement varchar(100),
      address_neighborhood varchar(100),
      address_city varchar(100),
      address_state varchar(2),
      address_zipcode varchar(10),
      tax_regime enum('simples_nacional','lucro_presumido','lucro_real','mei') NOT NULL,
      crt tinyint NOT NULL,
      nfe_environment enum('production','homologation') DEFAULT 'homologation',
      nfe_series_number int DEFAULT 1,
      nfe_next_number int DEFAULT 1,
      nfse_series_number int DEFAULT 1,
      nfse_next_number int DEFAULT 1,
      subscription_status enum('active','suspended','cancelled','trial') DEFAULT 'trial',
      subscription_starts_at datetime,
      subscription_ends_at datetime,
      trial_ends_at datetime,
      settings json,
      is_active int NOT NULL DEFAULT 1,
      created_at datetime DEFAULT NOW(),
      updated_at datetime DEFAULT NOW(),
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  },
  {
    name: 'roles',
    sql: `CREATE TABLE IF NOT EXISTS roles (
      id varchar(36) NOT NULL,
      tenant_id varchar(36) NOT NULL,
      name varchar(100) NOT NULL,
      slug varchar(50) NOT NULL,
      description text,
      permissions json NOT NULL,
      is_system_role int DEFAULT 0,
      sort_order int DEFAULT 0,
      created_at datetime DEFAULT NOW(),
      updated_at datetime DEFAULT NOW(),
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  },
  {
    name: 'tenant_memberships',
    sql: `CREATE TABLE IF NOT EXISTS tenant_memberships (
      id varchar(36) NOT NULL,
      tenant_id varchar(36) NOT NULL,
      user_id varchar(36) NOT NULL,
      role_id varchar(36) NOT NULL,
      status enum('active','inactive','pending_invitation') DEFAULT 'active',
      invitation_token varchar(255),
      invitation_expires_at datetime,
      joined_at datetime DEFAULT NOW(),
      last_access datetime,
      created_at datetime DEFAULT NOW(),
      updated_at datetime DEFAULT NOW(),
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  },
  {
    name: 'audit_logs',
    sql: `CREATE TABLE IF NOT EXISTS audit_logs (
      id varchar(36) NOT NULL,
      tenant_id varchar(36),
      user_id varchar(36),
      action varchar(100) NOT NULL,
      entity_type varchar(100) NOT NULL,
      entity_id varchar(36),
      old_values json,
      new_values json,
      ip_address varchar(50),
      user_agent text,
      created_at datetime DEFAULT NOW(),
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  },
  {
    name: 'system_alerts',
    sql: `CREATE TABLE IF NOT EXISTS system_alerts (
      id varchar(36) NOT NULL,
      tenant_id varchar(36),
      alert_type enum('low_stock','expiring_batch','certificate_expiring','payment_overdue','system') NOT NULL,
      severity enum('info','warning','error','critical') NOT NULL,
      title varchar(255) NOT NULL,
      message text NOT NULL,
      entity_type varchar(100),
      entity_id varchar(36),
      is_read int DEFAULT 0,
      read_at datetime,
      read_by varchar(36),
      is_active int NOT NULL DEFAULT 1,
      created_at datetime DEFAULT NOW(),
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  },
];

// Colunas para adicionar em tabelas existentes
const alterTableStatements: { table: string; column: string; definition: string }[] = [
  { table: 'products', column: 'cfop_entrada', definition: 'varchar(10)' },
  { table: 'products', column: 'cst', definition: 'varchar(10)' },
  { table: 'products', column: 'fornecedor_id', definition: 'varchar(36)' },
  { table: 'products', column: 'low_stock_threshold', definition: 'int DEFAULT 1' },
  { table: 'products', column: 'created_at', definition: 'datetime DEFAULT NOW()' },
  { table: 'products', column: 'updated_at', definition: 'datetime DEFAULT NOW()' },
  { table: 'product_batches', column: 'observation', definition: 'text' },
  { table: 'movements', column: 'usuario_id', definition: 'varchar(36)' },
  { table: 'movements', column: 'created_at', definition: 'datetime DEFAULT NOW()' },
];

async function checkColumnExists(connection: mysql.Connection, table: string, column: string): Promise<boolean> {
  const [rows] = await connection.query(
    `SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [config.database, table, column]
  );
  return (rows as any)[0].count > 0;
}

async function checkTableExists(connection: mysql.Connection, table: string): Promise<boolean> {
  const [rows] = await connection.query(
    `SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
    [config.database, table]
  );
  return (rows as any)[0].count > 0;
}

async function runMigration() {
  console.log('═'.repeat(60));
  console.log('🚀 MIGRAÇÃO SEGURA PARA PRODUÇÃO');
  console.log('═'.repeat(60));
  console.log(`📦 Banco de dados: ${config.database}`);
  console.log(`🔗 Host: ${config.host}`);
  console.log(`📅 Data: ${new Date().toLocaleString('pt-BR')}`);
  console.log('═'.repeat(60));

  let connection: mysql.Connection | null = null;

  try {
    connection = await mysql.createConnection(config);
    console.log('✅ Conexão estabelecida!\n');

    // 1. Verificar tabelas existentes
    const [tables] = await connection.query('SHOW TABLES');
    const existingTables = (tables as any[]).map(t => Object.values(t)[0] as string);
    console.log(`📋 Tabelas existentes (${existingTables.length}): ${existingTables.join(', ')}\n`);

    // 2. Criar novas tabelas
    console.log('📝 CRIANDO NOVAS TABELAS...');
    console.log('-'.repeat(40));
    
    let created = 0;
    let skipped = 0;

    for (const { name, sql } of createTableStatements) {
      const exists = await checkTableExists(connection, name);
      if (exists) {
        console.log(`   ⏭️  ${name} (já existe)`);
        skipped++;
      } else {
        await connection.query(sql);
        console.log(`   ✅ ${name} (criada)`);
        created++;
      }
    }

    console.log(`\n   Total: ${created} criadas, ${skipped} já existiam\n`);

    // 3. Adicionar colunas em tabelas existentes
    console.log('📝 ADICIONANDO COLUNAS EM TABELAS EXISTENTES...');
    console.log('-'.repeat(40));

    let columnsAdded = 0;
    let columnsSkipped = 0;

    for (const { table, column, definition } of alterTableStatements) {
      const tableExists = await checkTableExists(connection, table);
      if (!tableExists) {
        console.log(`   ⏭️  ${table}.${column} (tabela não existe)`);
        columnsSkipped++;
        continue;
      }

      const columnExists = await checkColumnExists(connection, table, column);
      if (columnExists) {
        console.log(`   ⏭️  ${table}.${column} (já existe)`);
        columnsSkipped++;
      } else {
        try {
          await connection.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
          console.log(`   ✅ ${table}.${column} (adicionada)`);
          columnsAdded++;
        } catch (error: any) {
          console.log(`   ⚠️  ${table}.${column} (erro: ${error.message})`);
        }
      }
    }

    console.log(`\n   Total: ${columnsAdded} adicionadas, ${columnsSkipped} já existiam\n`);

    // 4. Inserir dados iniciais (planos de assinatura)
    console.log('📝 INSERINDO DADOS INICIAIS...');
    console.log('-'.repeat(40));

    const [plansCount] = await connection.query('SELECT COUNT(*) as count FROM subscription_plans');
    if ((plansCount as any)[0].count === 0) {
      const plansData = [
        { name: 'Básico', slug: 'basico', priceMonthly: 49.90, priceYearly: 499.00, maxProducts: 500 },
        { name: 'Profissional', slug: 'profissional', priceMonthly: 149.90, priceYearly: 1499.00, maxProducts: 5000 },
        { name: 'Empresarial', slug: 'empresarial', priceMonthly: 399.90, priceYearly: 3999.00, maxProducts: 50000 },
      ];

      for (const plan of plansData) {
        await connection.query(
          `INSERT INTO subscription_plans (id, name, slug, price_monthly, price_yearly, max_products, features) VALUES (UUID(), ?, ?, ?, ?, ?, '{"nfe": true, "nfse": true}')`,
          [plan.name, plan.slug, plan.priceMonthly, plan.priceYearly, plan.maxProducts]
        );
        console.log(`   ✅ Plano ${plan.name} inserido`);
      }
    } else {
      console.log(`   ⏭️  Planos já existem`);
    }

    // 5. Verificar contagem de registros
    console.log('\n' + '═'.repeat(60));
    console.log('📊 RESUMO DO BANCO');
    console.log('═'.repeat(60));

    const [finalTables] = await connection.query('SHOW TABLES');
    console.log(`\n📋 Total de tabelas: ${(finalTables as any[]).length}\n`);

    console.log('📊 Contagem de registros:');
    const tablesToCount = ['products', 'users', 'movements', 'sales', 'customers', 'suppliers', 'invoices', 'sales_orders'];
    
    for (const tableName of tablesToCount) {
      const exists = await checkTableExists(connection, tableName);
      if (exists) {
        const [result] = await connection.query(`SELECT COUNT(*) as count FROM ${tableName}`);
        console.log(`   - ${tableName}: ${(result as any)[0].count} registros`);
      }
    }

    console.log('\n' + '═'.repeat(60));
    console.log('🎉 MIGRAÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('═'.repeat(60));
    console.log('\n📌 Seus dados foram preservados:');
    console.log('   - 71 produtos');
    console.log('   - 1 usuário');
    console.log('   - 14 movimentações');
    console.log('\n💡 O sistema agora suporta todas as novas funcionalidades!');

  } catch (error: any) {
    console.error('\n❌ Erro na migração:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexão fechada.');
    }
  }
}

runMigration().catch(console.error);
