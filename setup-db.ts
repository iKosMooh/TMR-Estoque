import mysql from 'mysql2/promise';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
config({ path: '.env' });

async function createDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DATABASE_HOST!,
    port: parseInt(process.env.DATABASE_PORT!),
    user: process.env.DATABASE_USER!,
    password: process.env.DATABASE_PASSWORD!,
  });

  try {
    // Create database if it doesn't exist
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${process.env.DATABASE_NAME!} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`✅ Database '${process.env.DATABASE_NAME}' created or already exists`);

    // Close connection
    await connection.end();

    // Now connect to the specific database and run migrations
    const dbConnection = await mysql.createConnection({
      host: process.env.DATABASE_HOST!,
      port: parseInt(process.env.DATABASE_PORT!),
      user: process.env.DATABASE_USER!,
      password: process.env.DATABASE_PASSWORD!,
      database: process.env.DATABASE_NAME!,
      multipleStatements: true,
    });

    // Read migration file and split into individual statements
    const migrationPath = path.join(process.cwd(), 'drizzle', '0000_smiling_darwin.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Split by statement-breakpoint and filter out comments
    const statements = migrationSQL
      .split('--> statement-breakpoint')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--'))
      .filter(stmt => stmt.length > 10); // Filter out very short statements

    console.log(`Found ${statements.length} SQL statements to execute`);

    // Execute each statement individually
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement) {
        try {
          console.log(`Executing statement ${i + 1}/${statements.length}...`);
          await dbConnection.execute(statement);
        } catch (error) {
          console.error(`Error executing statement ${i + 1}:`, error);
          console.error('Statement:', statement.substring(0, 200) + '...');
          throw error;
        }
      }
    }
    console.log('✅ Database migrations executed successfully');

    await dbConnection.end();
    console.log('🎉 Database setup completed!');

  } catch (error) {
    console.error('❌ Error setting up database:', error);
    process.exit(1);
  }
}

createDatabase();