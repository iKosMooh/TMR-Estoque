import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../../lib/db';
import { products, productBatches } from '../../../../../lib/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { previewItems } = await request.json();
    let created = 0, updated = 0;

    for (const item of previewItems) {
      // Se forceCreate está habilitado, criar como novo produto mesmo que exista similar
      const shouldCreate = item.action === 'create' || item.forceCreate;
      
      if (shouldCreate && !item.existing) {
        // Criar produto novo
        const productId = crypto.randomUUID();
        await db.insert(products).values({
          id: productId,
          codigoInterno: item.internalCode,
          xmlCode: item.xmlCode || item.internalCode,
          barcode: item.barcode,
          name: item.name,
          description: null,
          precoVenda: String(item.salePrice),
          precoCusto: String(item.costPrice || item.salePrice),
          qtdAtual: item.quantity,
          qtdEntradaTotal: item.quantity,
          qtdSaidaTotal: 0,
          dataUltimaCompra: new Date().toISOString().split('T')[0],
          ncm: item.ncm,
          estoqueBaixoLimite: 5,
          // Campos de unidades se fornecidos
          unitsPerPackage: item.unitsPerPackage || 1,
          sellByUnit: item.sellByUnit ? 1 : 0,
          unitPrice: item.unitPrice ? String(item.unitPrice) : null,
        });
        // Criar lote
        await db.insert(productBatches).values({
          id: crypto.randomUUID(),
          productId,
          purchaseDate: new Date().toISOString().split('T')[0],
          costPrice: String(item.costPrice || item.salePrice),
          sellingPrice: String(item.salePrice),
          quantityReceived: item.quantity,
          quantityRemaining: item.quantity,
          xmlReference: 'NF-e Import',
          xmlCode: item.xmlCode || item.internalCode,
        });
        created++;
      } else if (item.action === 'update' && item.existing) {
        // Adicionar lote ao produto existente
        await db.insert(productBatches).values({
          id: crypto.randomUUID(),
          productId: item.existing.id,
          purchaseDate: new Date().toISOString().split('T')[0],
          costPrice: String(item.costPrice || item.salePrice),
          sellingPrice: String(item.salePrice),
          quantityReceived: item.quantity,
          quantityRemaining: item.quantity,
          xmlReference: 'NF-e Import',
          xmlCode: item.xmlCode || item.internalCode,
          unitsPerPackage: item.unitsPerPackage || 1,
        });
        
        // Atualizar qtdEntradaTotal e xmlCode no produto (se não tiver)
        const current = await db.select().from(products).where(eq(products.id, item.existing.id));
        const updateData: Record<string, unknown> = {
          qtdEntradaTotal: current[0].qtdEntradaTotal + item.quantity,
          dataUltimaCompra: new Date().toISOString().split('T')[0],
        };
        
        // Atualizar xmlCode se o produto não tiver
        if (!current[0].xmlCode && (item.xmlCode || item.internalCode)) {
          updateData.xmlCode = item.xmlCode || item.internalCode;
        }
        
        await db.update(products).set(updateData).where(eq(products.id, item.existing.id));
        updated++;
      } else if (item.forceCreate && item.existing) {
        // Forçar criação de novo produto mesmo com duplicata
        const productId = crypto.randomUUID();
        // Gerar código interno único adicionando sufixo
        const newInternalCode = `${item.internalCode}_${Date.now().toString().slice(-6)}`;
        
        await db.insert(products).values({
          id: productId,
          codigoInterno: newInternalCode,
          xmlCode: item.xmlCode || item.internalCode,
          barcode: item.barcode,
          name: item.name,
          description: null,
          precoVenda: String(item.salePrice),
          precoCusto: String(item.costPrice || item.salePrice),
          qtdAtual: item.quantity,
          qtdEntradaTotal: item.quantity,
          qtdSaidaTotal: 0,
          dataUltimaCompra: new Date().toISOString().split('T')[0],
          ncm: item.ncm,
          estoqueBaixoLimite: 5,
          unitsPerPackage: item.unitsPerPackage || 1,
          sellByUnit: item.sellByUnit ? 1 : 0,
          unitPrice: item.unitPrice ? String(item.unitPrice) : null,
        });
        
        await db.insert(productBatches).values({
          id: crypto.randomUUID(),
          productId,
          purchaseDate: new Date().toISOString().split('T')[0],
          costPrice: String(item.costPrice || item.salePrice),
          sellingPrice: String(item.salePrice),
          quantityReceived: item.quantity,
          quantityRemaining: item.quantity,
          xmlReference: 'NF-e Import (Novo)',
          xmlCode: item.xmlCode || item.internalCode,
        });
        created++;
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