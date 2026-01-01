import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products, movements, alerts } from '@/lib/db/schema';

export async function POST() {
  try {
    // Resetar na ordem correta devido às foreign keys
    // Primeiro excluir alerts (que referenciam products)
    await db.delete(alerts);

    // Depois excluir movements (que referenciam products)
    await db.delete(movements);

    // Por último excluir products
    await db.delete(products);

    return NextResponse.json({
      success: true,
      message: 'Todos os dados foram resetados com sucesso'
    });

  } catch (error) {
    console.error('Erro ao resetar dados:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor ao resetar dados' },
      { status: 500 }
    );
  }
}