import { db } from './src/lib/db';
import { users } from './src/lib/db/schema';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

async function seed() {
  const hashedPassword = await bcrypt.hash('admin123', 10);

  try {
    await db.insert(users).values({
      name: 'Admin',
      email: 'admin@estoque.com',
      passwordHash: hashedPassword,
      role: 'admin',
    });

    console.log('✅ Usuário admin criado com sucesso!');
    console.log('Email: admin@estoque.com');
    console.log('Senha: admin123');
  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error);
  }
}

seed();