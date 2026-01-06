import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../../lib/db';
import { products, productBatches } from '../../../../../lib/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { previewItems } = await request.json();
    let created = 0, updated = 0;

    for (const item of previewItems) {
      if (item.action === 'create') {
        // Crie produto
        const productId = crypto.randomUUID();
        await db.insert(products).values({
          id: productId,
          codigoInterno: item.internalCode,
          barcode: item.barcode,
          name: item.name,
          description: null,
          precoVenda: item.salePrice,
          precoCusto: item.salePrice, // Assuma custo = venda para simplificar
          qtdAtual: item.quantity,
          qtdEntradaTotal: item.quantity,
          qtdSaidaTotal: 0,
          dataUltimaCompra: new Date().toISOString().split('T')[0],
          ncm: item.ncm,
          estoqueBaixoLimite: 5,
        });
        // Crie lote
        await db.insert(productBatches).values({
          id: crypto.randomUUID(),
          productId,
          purchaseDate: new Date().toISOString().split('T')[0],
          costPrice: item.salePrice,
          sellingPrice: item.salePrice,
          quantityReceived: item.quantity,
          quantityRemaining: item.quantity,
          xmlReference: 'NF-e Import',
        });
        created++;
      } else if (item.action === 'update') {
        // Adicione lote ao produto existente
        await db.insert(productBatches).values({
          id: crypto.randomUUID(),
          productId: item.existing.id,
          purchaseDate: new Date().toISOString().split('T')[0],
          costPrice: item.salePrice,
          sellingPrice: item.salePrice,
          quantityReceived: item.quantity,
          quantityRemaining: item.quantity,
          xmlReference: 'NF-e Import',
        });
        // Atualize qtdEntradaTotal no produto
        const current = await db.select().from(products).where(eq(products.id, item.existing.id));
        await db.update(products).set({
          qtdEntradaTotal: current[0].qtdEntradaTotal + item.quantity,
          dataUltimaCompra: new Date().toISOString().split('T')[0],
        }).where(eq(products.id, item.existing.id));
        updated++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Importação concluída: ${created} criados, ${updated} atualizados`,
      results: { created, updated, errors: [] },
    });
  } catch (error) {
    console.error('Erro na confirmação:', error);
    return NextResponse.json({ success: false, message: 'Erro na importação' }, { status: 500 });
  }
}