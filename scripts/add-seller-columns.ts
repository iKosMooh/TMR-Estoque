import { db } from '../src/lib/db';
import { sql } from 'drizzle-orm';

async function addSellerColumns() {
  try {
    console.log('🔄 Adicionando colunas seller_signature e seller_name na tabela sales...');

    // Verificar se as colunas já existem antes de tentar adicionar
    const result = await db.execute(sql`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'sales'
      AND COLUMN_NAME IN ('seller_signature', 'seller_name')
    `);

    const columns = Array.isArray(result) ? result[0] : [];
    const existingColumns = Array.isArray(columns) ? columns.map((col: any) => col.COLUMN_NAME) : [];

    if (!existingColumns.includes('seller_signature')) {
      await db.execute(sql`ALTER TABLE sales ADD COLUMN seller_signature TEXT`);
      console.log('✅ Coluna seller_signature adicionada');
    } else {
      console.log('⏭️ Coluna seller_signature já existe');
    }

    if (!existingColumns.includes('seller_name')) {
      await db.execute(sql`ALTER TABLE sales ADD COLUMN seller_name VARCHAR(255)`);
      console.log('✅ Coluna seller_name adicionada');
    } else {
      console.log('⏭️ Coluna seller_name já existe');
    }

    console.log('🎉 Migração local concluída com sucesso!');
  } catch (error) {
    console.error('❌ Erro na migração:', error);
    process.exit(1);
  }
}

addSellerColumns();