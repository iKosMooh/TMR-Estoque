import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { products, productBatches } from '../../../lib/schema';
import { eq, desc } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { productId, quantitySold } = await request.json();
    if (!productId || !quantitySold || quantitySold <= 0) {
      return NextResponse.json({ error: 'ID do produto e quantidade válida obrigatórios' }, { status: 400 });
    }

    // Busque lotes ordenados por data (PEPS)
    const batches = await db
      .select()
      .from(productBatches)
      .where(eq(productBatches.productId, productId))
      .orderBy(desc(productBatches.purchaseDate));
    let remainingToSell = quantitySold;
    const movements = [];

    for (const batch of batches) {
      if (remainingToSell <= 0) break;
      const deduct = Math.min(remainingToSell, batch.quantityRemaining);
      await db
        .update(productBatches)
        .set({
          quantityRemaining: batch.quantityRemaining - deduct,
        })
        .where(eq(productBatches.id, batch.id));
      movements.push({ id: batch.id, type: 'exit', quantity: deduct, date: new Date().toISOString() });
      remainingToSell -= deduct;
    }

    if (remainingToSell > 0) {
      return NextResponse.json({ error: 'Estoque insuficiente' }, { status: 400 });
    }

    // Atualize totalExit no produto
    const product = await db.select().from(products).where(eq(products.id, productId));
    await db
      .update(products)
      .set({
        totalExit: product[0].totalExit + quantitySold,
      })
      .where(eq(products.id, productId));

    return NextResponse.json({
      success: true,
      message: `Venda realizada: ${quantitySold} unidades`,
      movements,
    });
  } catch (error) {
    console.error('Erro na venda:', error);
    return NextResponse.json({ error: 'Erro na venda' }, { status: 500 });
  }
}