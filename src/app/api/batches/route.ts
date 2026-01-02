import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { productBatches, products } from '../../../lib/schema';
import { eq } from 'drizzle-orm';

// PUT: Atualizar lote específico
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, costPrice, sellingPrice, quantityReceived, quantityRemaining, purchaseDate, observation } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID do lote é obrigatório' }, { status: 400 });
    }

    // Verificar se o lote existe
    const existingBatch = await db.select().from(productBatches).where(eq(productBatches.id, id));
    if (existingBatch.length === 0) {
      return NextResponse.json({ error: 'Lote não encontrado' }, { status: 404 });
    }

    const oldBatch = existingBatch[0];
    const productId = oldBatch.productId;

    // Calcular diferença de quantidade para atualizar o produto
    const oldQuantity = oldBatch.quantityReceived;
    const newQuantity = quantityReceived !== undefined ? quantityReceived : oldQuantity;
    const quantityDiff = newQuantity - oldQuantity;

    // Atualizar o lote
    const updates: Partial<typeof productBatches.$inferInsert> = {};
    if (costPrice !== undefined) updates.costPrice = costPrice;
    if (sellingPrice !== undefined) updates.sellingPrice = sellingPrice;
    if (quantityReceived !== undefined) updates.quantityReceived = quantityReceived;
    if (quantityRemaining !== undefined) updates.quantityRemaining = quantityRemaining;
    if (purchaseDate !== undefined) updates.purchaseDate = new Date(purchaseDate);
    if (observation !== undefined) updates.observation = observation;

    await db.update(productBatches).set(updates).where(eq(productBatches.id, id));

    // Atualizar totalEntry no produto se a quantidade recebida mudou
    if (quantityDiff !== 0) {
      const product = await db.select().from(products).where(eq(products.id, productId));
      if (product.length > 0) {
        await db.update(products).set({
          totalEntry: product[0].totalEntry + quantityDiff,
        }).where(eq(products.id, productId));
      }
    }

    const updatedBatch = await db.select().from(productBatches).where(eq(productBatches.id, id));
    return NextResponse.json({
      success: true,
      message: 'Lote atualizado com sucesso',
      batch: updatedBatch[0],
    });
  } catch (error) {
    console.error('Erro ao atualizar lote:', error);
    return NextResponse.json({ error: 'Erro ao atualizar lote' }, { status: 500 });
  }
}
