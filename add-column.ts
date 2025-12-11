import mysql from 'mysql2/promise';
import { config } from 'dotenv';

config({ path: '.env' });

async function addLowStockThresholdColumn() {
  const connection = await mysql.createConnection({
    host: process.env.DATABASE_HOST!,
    port: parseInt(process.env.DATABASE_PORT!),
    user: process.env.DATABASE_USER!,
    password: process.env.DATABASE_PASSWORD!,
    database: process.env.DATABASE_NAME!,
  });

  try {
    // Verificar se a coluna já existe
    const [columns] = await connection.execute(
      "SHOW COLUMNS FROM products LIKE 'estoque_baixo_limite'"
    );

    if ((columns as any[]).length === 0) {
      console.log('Adicionando coluna lowStockThreshold...');
      await connection.execute(
        'ALTER TABLE products ADD COLUMN estoque_baixo_limite INT NOT NULL DEFAULT 5'
      );
      console.log('Coluna adicionada com sucesso!');
    } else {
      console.log('Coluna lowStockThreshold já existe.');
    }

    // Atualizar produtos existentes que não têm valor (NULL) para o padrão 5
    await connection.execute(
      'UPDATE products SET estoque_baixo_limite = 5 WHERE estoque_baixo_limite IS NULL'
    );
    console.log('Produtos existentes atualizados com valor padrão.');

  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await connection.end();
  }
}

addLowStockThresholdColumn();