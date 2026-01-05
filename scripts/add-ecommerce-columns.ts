/**
 * Script para adicionar colunas de e-commerce na tabela products
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
};

async function addEcommerceColumns() {
  console.log('Conectando ao banco:', config.database);
  
  const connection = await mysql.createConnection(config);
  
  const columns = [
    { name: 'sku', definition: 'VARCHAR(100)' },
    { name: 'weight', definition: 'DECIMAL(10,3)' },
    { name: 'length', definition: 'DECIMAL(10,2)' },
    { name: 'width', definition: 'DECIMAL(10,2)' },
    { name: 'height', definition: 'DECIMAL(10,2)' },
    { name: 'category_id', definition: 'VARCHAR(36)' },
    { name: 'brand_name', definition: 'VARCHAR(255)' },
    { name: 'manufacturer', definition: 'VARCHAR(255)' },
    { name: 'short_description', definition: 'TEXT' },
    { name: 'meta_title', definition: 'VARCHAR(255)' },
    { name: 'meta_description', definition: 'TEXT' },
    { name: 'tags', definition: 'TEXT' },
    { name: 'warranty_months', definition: 'INT' },
  ];

  console.log('\nAdicionando colunas de e-commerce na tabela products...\n');

  for (const col of columns) {
    try {
      const [rows] = await connection.query(
        `SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'products' AND COLUMN_NAME = ?`,
        [config.database, col.name]
      );
      
      if ((rows as any)[0].count === 0) {
        await connection.query(`ALTER TABLE products ADD COLUMN ${col.name} ${col.definition}`);
        console.log(`✅ Adicionada coluna: ${col.name}`);
      } else {
        console.log(`⏭️  Coluna já existe: ${col.name}`);
      }
    } catch (err: any) {
      console.log(`❌ Erro em ${col.name}: ${err.message}`);
    }
  }

  await connection.end();
  console.log('\n✅ Concluído!');
}

addEcommerceColumns().catch(console.error);
