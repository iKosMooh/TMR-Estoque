import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products, movements } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { previewItems, xmlType, fileName } = await request.json();

    if (!previewItems || !Array.isArray(previewItems)) {
      return NextResponse.json({ error: 'Itens de prévia não fornecidos' }, { status: 400 });
    }

    const results = {
      created: 0,
      updated: 0,
      errors: [] as string[],
      movements: [] as typeof movements.$inferSelect[]
    };

    // Processar cada item da prévia
    for (const item of previewItems) {
      try {
        const { existing, action, ...productData } = item;

        if (action === 'create') {
          // Criar novo produto
          await db.insert(products).values({
            internalCode: productData.internalCode,
            barcode: productData.barcode,
            name: productData.name,
            salePrice: productData.salePrice.toString(),
            costPrice: productData.salePrice.toString(), // Usar preço de venda como custo inicial
            currentQuantity: productData.quantity,
            totalEntry: productData.quantity,
            lowStockThreshold: 5, // Valor padrão
            ncm: productData.ncm,
            cfopEntry: productData.cfop,
            cst: productData.cst,
            createdAt: new Date(),
            updatedAt: new Date()
          });

          // Buscar o produto recém-criado
          const createdProduct = await db.select().from(products).where(eq(products.barcode, productData.barcode)).limit(1);

          // Registrar movimento de entrada
          await db.insert(movements).values({
            productId: createdProduct[0].id,
            type: 'entrada',
            quantity: productData.quantity,
            unitPrice: productData.salePrice,
            date: new Date(),
            reference: `Entrada via XML import (${xmlType}) - ${fileName}`,
            createdAt: new Date()
          });

          results.created++;

        } else if (action === 'update' && existing) {
          // Atualizar produto existente
          const currentStock = existing.currentQuantity || 0;
          const newStock = currentStock + productData.quantity;
          const newTotalEntry = (existing.totalEntry || 0) + productData.quantity;

          await db.update(products)
            .set({
              currentQuantity: newStock,
              totalEntry: newTotalEntry,
              salePrice: productData.salePrice.toString(), // Atualizar preço se fornecido
              updatedAt: new Date()
            })
            .where(eq(products.id, existing.id));

          // Registrar movimento de entrada
          await db.insert(movements).values({
            productId: existing.id,
            type: 'entrada',
            quantity: productData.quantity,
            unitPrice: productData.salePrice,
            date: new Date(),
            reference: `Entrada via XML import (${xmlType}) - ${fileName}`,
            createdAt: new Date()
          });

          results.updated++;
        }

      } catch (itemError) {
        console.error('Erro ao processar item:', itemError);
        results.errors.push(`Erro ao processar item ${item.internalCode || item.barcode}: ${itemError}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Importação concluída. ${results.created} produtos criados, ${results.updated} produtos atualizados.`,
      results
    });

  } catch (error) {
    console.error('Erro ao confirmar importação XML:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}