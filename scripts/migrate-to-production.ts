/**
 * Script de Migração para Produção
 * Execute: npx tsx scripts/migrate-to-production.ts
 */

import mysql from 'mysql2/promise';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const config = {
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || '3306'),
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  multipleStatements: true,
};

async function runMigration() {
  console.log('🚀 Iniciando migração para produção...');
  console.log(`📦 Banco de dados: ${config.database}`);
  console.log(`🔗 Host: ${config.host}`);
  
  let connection;
  
  try {
    // Conectar ao banco
    connection = await mysql.createConnection(config);
    console.log('✅ Conexão estabelecida com sucesso!');
    
    // Verificar tabelas existentes
    const [tables] = await connection.query('SHOW TABLES');
    console.log(`\n📋 Tabelas existentes no banco (${(tables as any[]).length}):`);
    (tables as any[]).forEach((table: any) => {
      const tableName = Object.values(table)[0];
      console.log(`   - ${tableName}`);
    });
    
    // Ler o script de migração
    const migrationPath = path.join(__dirname, '..', 'SQL', 'migrate_to_production.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    
    // Dividir o script em statements individuais
    // (removendo delimiters que não funcionam bem com mysql2)
    const statements = migrationSQL
      .split(/-->\s*statement-breakpoint/i)
      .join('\n')
      .split(/DELIMITER\s*\/\/[\s\S]*?DELIMITER\s*;/gi) // Remover procedures com DELIMITER
      .join('\n')
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('DELIMITER'));
    
    console.log(`\n🔄 Executando ${statements.length} statements de migração...\n`);
    
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    
    for (const statement of statements) {
      if (!statement || statement.length < 5) continue;
      
      try {
        // Executar cada statement
        await connection.query(statement);
        
        // Identificar o tipo de operação
        if (statement.toUpperCase().includes('CREATE TABLE IF NOT EXISTS')) {
          const match = statement.match(/CREATE TABLE IF NOT EXISTS\s+`?(\w+)`?/i);
          console.log(`   ✅ Tabela verificada/criada: ${match?.[1] || 'unknown'}`);
        } else if (statement.toUpperCase().includes('CREATE INDEX IF NOT EXISTS')) {
          console.log(`   ✅ Índice verificado/criado`);
        } else if (statement.toUpperCase().includes('INSERT INTO')) {
          console.log(`   ✅ Dados inseridos`);
        } else if (statement.toUpperCase().includes('ALTER TABLE')) {
          console.log(`   ✅ Tabela alterada`);
        }
        
        successCount++;
      } catch (error: any) {
        // Ignorar erros de "já existe"
        if (error.code === 'ER_DUP_ENTRY' || 
            error.code === 'ER_TABLE_EXISTS_ERROR' ||
            error.code === 'ER_DUP_KEYNAME' ||
            error.message?.includes('already exists') ||
            error.message?.includes('Duplicate')) {
          skipCount++;
        } else {
          console.log(`   ⚠️ Erro: ${error.message}`);
          errorCount++;
        }
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 RESUMO DA MIGRAÇÃO');
    console.log('='.repeat(50));
    console.log(`   ✅ Sucesso: ${successCount} operações`);
    console.log(`   ⏭️ Ignorados (já existem): ${skipCount}`);
    console.log(`   ❌ Erros: ${errorCount}`);
    
    // Verificar tabelas após migração
    const [tablesAfter] = await connection.query('SHOW TABLES');
    console.log(`\n📋 Total de tabelas após migração: ${(tablesAfter as any[]).length}`);
    
    // Contar registros em tabelas principais
    console.log('\n📊 Contagem de registros:');
    const tablesToCount = ['products', 'users', 'movements', 'sales', 'customers', 'suppliers'];
    
    for (const tableName of tablesToCount) {
      try {
        const [result] = await connection.query(`SELECT COUNT(*) as count FROM ${tableName}`);
        console.log(`   - ${tableName}: ${(result as any)[0].count} registros`);
      } catch {
        console.log(`   - ${tableName}: (tabela não existe)`);
      }
    }
    
    console.log('\n🎉 Migração concluída com sucesso!');
    console.log('='.repeat(50));
    
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

// Executar migração
runMigration().catch(console.error);
