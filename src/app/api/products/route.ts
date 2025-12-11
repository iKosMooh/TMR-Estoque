import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products, movements, alerts } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';

export async function GET() {
  try {
    const allProducts = await db
      .select()
      .from(products)
      .orderBy(desc(products.createdAt));

    return NextResponse.json(allProducts);
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      internalCode,
      barcode,
      name,
      description,
      salePrice,
      costPrice,
      currentQuantity = 0,
      lowStockThreshold = 5
    } = body;

    if (!name || !internalCode || !salePrice || !costPrice) {
      return NextResponse.json({ error: 'Campos obrigatórios não preenchidos' }, { status: 400 });
    }

    await db.insert(products).values({
      internalCode,
      barcode,
      name,
      description,
      salePrice: salePrice.toString(),
      costPrice: costPrice.toString(),
      currentQuantity,
      totalEntry: currentQuantity,
      lowStockThreshold,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Buscar o produto recém-criado
    const createdProduct = await db.select().from(products).where(eq(products.internalCode, internalCode)).limit(1);

    return NextResponse.json(createdProduct[0], { status: 201 });
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      internalCode,
      barcode,
      name,
      description,
      salePrice,
      costPrice,
      lowStockThreshold
    } = body;

    if (!id || !name || !internalCode || !salePrice || !costPrice) {
      return NextResponse.json({ error: 'Campos obrigatórios não preenchidos' }, { status: 400 });
    }

    await db.update(products)
      .set({
        internalCode,
        barcode,
        name,
        description,
        salePrice: salePrice.toString(),
        costPrice: costPrice.toString(),
        lowStockThreshold,
        updatedAt: new Date()
      })
      .where(eq(products.id, id));

    // Buscar o produto atualizado
    const updatedProduct = await db.select().from(products).where(eq(products.id, id)).limit(1);

    if (updatedProduct.length === 0) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
    }

    return NextResponse.json(updatedProduct[0]);
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID do produto não fornecido' }, { status: 400 });
    }

    // Verificar se o produto existe
    const existingProduct = await db.select().from(products).where(eq(products.id, id)).limit(1);
    if (existingProduct.length === 0) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
    }

    // Verificar se há movimentações associadas ao produto
    const productMovements = await db.select().from(movements).where(eq(movements.productId, id)).limit(1);

    if (productMovements.length > 0) {
      return NextResponse.json({
        error: 'Não é possível excluir o produto porque existem movimentações associadas. Para excluir este produto, primeiro remova todas as movimentações relacionadas.'
      }, { status: 400 });
    }

    // Verificar se há alertas associados ao produto
    const productAlerts = await db.select().from(alerts).where(eq(alerts.productId, id)).limit(1);

    if (productAlerts.length > 0) {
      // Se há alertas, excluí-los primeiro
      await db.delete(alerts).where(eq(alerts.productId, id));
    }

    // Agora excluir o produto
    await db.delete(products).where(eq(products.id, id));

    return NextResponse.json({ message: 'Produto excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir produto:', error);
    return NextResponse.json({ error: 'Erro interno do servidor ao excluir produto' }, { status: 500 });
  }
}