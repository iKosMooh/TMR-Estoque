import { defineConfig } from 'drizzle-kit';
import { config } from 'dotenv';

// Load environment variables from .env
config({ path: '.env' });

export default defineConfig({
  schema: './src/lib/schema.ts', // Atualizado para o schema correto
  out: './drizzle',
  dialect: 'mysql',
  dbCredentials: {
    host: process.env.DATABASE_HOST!,
    port: parseInt(process.env.DATABASE_PORT!),
    user: process.env.DATABASE_USER!,
    password: process.env.DATABASE_PASSWORD!,
    database: process.env.DATABASE_NAME!,
  },
});