import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { productBatches, products } from '../../../../lib/schema';
import { eq } from 'drizzle-orm';

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const batchId = id;
    if (!batchId) {
      return NextResponse.json({ error: 'ID do lote obrigatório' }, { status: 400 });
    }

    // Busque o lote
    const batch = await db.select().from(productBatches).where(eq(productBatches.id, batchId));
    if (batch.length === 0) {
      return NextResponse.json({ error: 'Lote não encontrado' }, { status: 404 });
    }

    const productId = batch[0].productId;
    const quantityReceived = batch[0].quantityReceived;

    // Remova o lote
    await db.delete(productBatches).where(eq(productBatches.id, batchId));

    // Atualize totalEntry no produto
    const product = await db.select().from(products).where(eq(products.id, productId));
    if (product.length > 0) {
      await db.update(products).set({
        qtdEntradaTotal: Math.max(0, product[0].qtdEntradaTotal - quantityReceived),
      }).where(eq(products.id, productId));
    }

    return NextResponse.json({ success: true, message: 'Lote excluído' });
  } catch (error) {
    console.error('Erro ao excluir lote:', error);
    return NextResponse.json({ error: 'Erro ao excluir lote' }, { status: 500 });
  }
}
