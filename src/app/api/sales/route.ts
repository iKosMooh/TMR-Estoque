import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products, movements } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { productId, quantity, unitPrice } = await request.json();

    if (!productId || !quantity || quantity <= 0) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    // Verificar se o produto existe e tem estoque suficiente
    const product = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!product || product.length === 0) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
    }

    if (product[0].currentQuantity < quantity) {
      return NextResponse.json({ error: 'Estoque insuficiente' }, { status: 400 });
    }

    // Registrar movimento de saída
    await db.insert(movements).values({
      productId,
      type: 'saida',
      quantity,
      unitPrice: (unitPrice || parseFloat(product[0].salePrice)).toString(),
      date: new Date(),
      reference: 'Venda direta',
    });

    // Atualizar quantidade do produto
    await db
      .update(products)
      .set({
        totalExit: product[0].totalExit + quantity,
        currentQuantity: product[0].currentQuantity - quantity,
        updatedAt: new Date(),
      })
      .where(eq(products.id, productId));

    return NextResponse.json({ message: 'Venda registrada com sucesso' });
  } catch (error) {
    console.error('Erro ao registrar venda:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}