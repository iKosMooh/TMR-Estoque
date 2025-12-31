import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { products, productBatches } from '../../../lib/schema';
import { eq } from 'drizzle-orm';

// GET: Listar todos os produtos com lotes
export async function GET() {
  try {
    const productList = await db.select().from(products);
    const productsWithBatches = await Promise.all(
      productList.map(async (p) => {
        const batches = await db.select().from(productBatches).where(eq(productBatches.productId, p.id));
        const totalQuantity = batches.length > 0 ? batches.reduce((sum, b) => sum + b.quantityRemaining, 0) : p.currentQuantity; // Fallback para antigos
        return {
          id: p.id,
          internalCode: p.internalCode,
          barcode: p.barcode,
          name: p.name,
          description: p.description,
          salePrice: p.salePrice.toString(),
          costPrice: p.costPrice.toString(),
          currentQuantity: totalQuantity, // Total dos lotes
          totalEntry: p.totalEntry,
          totalExit: p.totalExit,
          lastPurchaseDate: p.lastPurchaseDate ? p.lastPurchaseDate.toISOString().split('T')[0] : null,
          ncm: p.ncm,
          lowStockThreshold: p.lowStockThreshold,
          batches: batches.map(b => ({
            id: b.id,
            purchaseDate: b.purchaseDate.toISOString().split('T')[0],
            costPrice: b.costPrice.toString(),
            sellingPrice: b.sellingPrice.toString(),
            quantityReceived: b.quantityReceived,
            quantityRemaining: b.quantityRemaining,
            xmlReference: b.xmlReference,
          })),
        };
      })
    );
    return NextResponse.json(productsWithBatches);
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    return NextResponse.json({ error: 'Erro ao buscar produtos' }, { status: 500 });
  }
}

// POST: Adicionar novo produto ou lote
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { internalCode, barcode, name, description, salePrice, costPrice, currentQuantity, lowStockThreshold } = body;

    // Validações básicas
    if (!name || !internalCode || !salePrice || !costPrice) {
      return NextResponse.json({ error: 'Campos obrigatórios: nome, código interno, preço de venda e preço de custo' }, { status: 400 });
    }

    // Verifique se produto existe
    const existing = await db.select().from(products).where(eq(products.internalCode, internalCode));
    if (existing.length > 0) {
      // Produto existe: adicione lote
      const productId = existing[0].id;
      await db.insert(productBatches).values({
        id: crypto.randomUUID(),
        productId,
        purchaseDate: new Date(),
        costPrice: parseFloat(costPrice),
        sellingPrice: parseFloat(salePrice),
        quantityReceived: currentQuantity || 0,
        quantityRemaining: currentQuantity || 0,
        xmlReference: 'Manual',
      });
      // Atualize totalEntry
      await db.update(products).set({
        totalEntry: existing[0].totalEntry + (currentQuantity || 0),
        lastPurchaseDate: new Date(),
      }).where(eq(products.id, productId));
      return NextResponse.json({ message: 'Lote adicionado ao produto existente' }, { status: 200 });
    } else {
      // Produto novo: crie produto + lote
      const productId = crypto.randomUUID();
      await db.insert(products).values({
        id: productId,
        internalCode,
        barcode: barcode || null,
        name,
        description: description || null,
        salePrice: parseFloat(salePrice),
        costPrice: parseFloat(costPrice),
        currentQuantity: currentQuantity || 0,
        totalEntry: currentQuantity || 0,
        totalExit: 0,
        lastPurchaseDate: new Date(),
        ncm: null,
        lowStockThreshold: lowStockThreshold || 5,
      });
      await db.insert(productBatches).values({
        id: crypto.randomUUID(),
        productId,
        purchaseDate: new Date(),
        costPrice: parseFloat(costPrice),
        sellingPrice: parseFloat(salePrice),
        quantityReceived: currentQuantity || 0,
        quantityRemaining: currentQuantity || 0,
        xmlReference: 'Manual',
      });
      return NextResponse.json({ id: productId, message: 'Produto e lote criados' }, { status: 201 });
    }
  } catch (error) {
    console.error('Erro ao adicionar produto/lote:', error);
    return NextResponse.json({ error: 'Erro ao adicionar produto/lote' }, { status: 500 });
  }
}

// PUT: Atualizar produto existente
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, internalCode, barcode, name, description, salePrice, costPrice, currentQuantity, lowStockThreshold } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID do produto é obrigatório' }, { status: 400 });
    }

    // Verificar se produto existe
    const existingProduct = await db.select().from(products).where(eq(products.id, id));
    if (existingProduct.length === 0) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
    }

    // Verificar se código interno já existe em outro produto
    const duplicate = await db.select().from(products).where(eq(products.internalCode, internalCode));
    if (duplicate.length > 0 && duplicate[0].id !== id) {
      return NextResponse.json({ error: 'Código interno já existe em outro produto' }, { status: 400 });
    }

    const updates = {
      internalCode,
      barcode: barcode || null,
      name,
      description: description || null,
      salePrice: parseFloat(salePrice),
      costPrice: parseFloat(costPrice),
      currentQuantity: currentQuantity !== undefined ? currentQuantity : existingProduct[0].currentQuantity,
      lowStockThreshold: lowStockThreshold || 5,
    };

    await db.update(products).set(updates).where(eq(products.id, id));
    const updated = await db.select().from(products).where(eq(products.id, id));
    const p = updated[0];
    // Retorna com preços como string
    return NextResponse.json({
      id: p.id,
      internalCode: p.internalCode,
      barcode: p.barcode,
      name: p.name,
      description: p.description,
      salePrice: parseFloat(p.salePrice).toFixed(2),
      costPrice: parseFloat(p.costPrice).toFixed(2),
      currentQuantity: p.currentQuantity,
      totalEntry: p.totalEntry,
      totalExit: p.totalExit,
      lastPurchaseDate: p.lastPurchaseDate ? p.lastPurchaseDate.toISOString().split('T')[0] : null,
      ncm: p.ncm,
      lowStockThreshold: p.lowStockThreshold,
    });
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    return NextResponse.json({ error: 'Erro ao atualizar produto' }, { status: 500 });
  }
}

// DELETE: Excluir produto
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const force = url.searchParams.get('force') === 'true';

    if (!id) {
      return NextResponse.json({ success: false, message: 'ID do produto é obrigatório' });
    }

    const product = await db.select().from(products).where(eq(products.id, id));
    if (product.length === 0) {
      return NextResponse.json({ success: false, message: 'Produto não encontrado' });
    }

    const hasMovements = product[0].totalEntry > 0 || product[0].totalExit > 0;

    if (hasMovements && !force) {
      return NextResponse.json({ success: false, canForce: true, message: 'Produto possui movimentações. Use force=true para excluir.' });
    }

    // Remova lotes associados
    await db.delete(productBatches).where(eq(productBatches.productId, id));
    await db.delete(products).where(eq(products.id, id));
    return NextResponse.json({ success: true, message: 'Produto e lotes excluídos com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir produto:', error);
    return NextResponse.json({ success: false, message: 'Erro ao excluir produto' });
  }
}
