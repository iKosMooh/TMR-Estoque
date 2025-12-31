import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

// Cria a conexão MySQL (use variáveis de ambiente para segurança)
const connection = mysql.createPool({
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '3306'),
  user: process.env.DATABASE_USER || 'root',
  password: process.env.DATABASE_PASSWORD || '',
  database: process.env.DATABASE_NAME || 'tmr_auto_eletrica',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export const db = drizzle(connection);
