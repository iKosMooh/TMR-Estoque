import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { products, productBatches, sales, customers } from '../../../lib/schema';
import { eq, desc, asc, and, gte, lte, sql } from 'drizzle-orm';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/auth';
import { randomUUID } from 'crypto';

// GET - Listar vendas
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    let query = db
      .select({
        id: sales.id,
        productId: sales.productId,
        productName: products.name,
        productCode: products.codigoInterno,
        quantity: sales.quantity,
        price: sales.price,
        date: sales.date,
        userId: sales.userId,
        customerId: sales.customerId,
        customerName: sql<string>`COALESCE(${customers.name}, 'Cliente não definido')`,
        sellerSignature: sales.sellerSignature,
        sellerName: sales.sellerName,
      })
      .from(sales)
      .leftJoin(products, eq(sales.productId, products.id))
      .leftJoin(customers, sql`${sales.customerId} COLLATE utf8mb4_unicode_ci = ${customers.id} COLLATE utf8mb4_unicode_ci`);
    
    // Aplicar filtros de data
    const conditions = [];
    if (startDate) {
      conditions.push(gte(sales.date, startDate));
    }
    if (endDate) {
      conditions.push(lte(sales.date, endDate + ' 23:59:59'));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query;
    }
    
    const salesData = await query.orderBy(desc(sales.date));
    
    return NextResponse.json({ sales: salesData });
  } catch (error) {
    console.error('Erro ao listar vendas:', error);
    return NextResponse.json({ error: 'Erro ao listar vendas' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // @ts-ignore - Tipos do next-auth conflitantes, funciona em runtime
    const session = await getServerSession(authOptions);
    // @ts-ignore
    const userId = session?.user?.id as string | undefined;
    // @ts-ignore
    const userName = session?.user?.name as string | undefined;
    // @ts-ignore
    const userEmail = session?.user?.email as string | undefined;
    
    // Permitir venda mesmo sem autenticação (PDV pode não ter sessão)
    // O userId será opcional

    const { productId, quantitySold, unitPrice, customerId } = await request.json();
    if (!productId || !quantitySold || quantitySold <= 0 || !unitPrice) {
      return NextResponse.json({ error: 'ID do produto, quantidade válida e preço unitário obrigatórios' }, { status: 400 });
    }

    // Busque lotes ordenados por data (PEPS - mais antigo primeiro)
    const batches = await db
      .select()
      .from(productBatches)
      .where(eq(productBatches.productId, productId))
      .orderBy(asc(productBatches.purchaseDate));

    // Verificar estoque total disponível
    const totalStock = batches.reduce((sum: number, batch) => sum + batch.quantityRemaining, 0);
    if (totalStock < quantitySold) {
      return NextResponse.json({ 
        error: `Estoque insuficiente. Disponível: ${totalStock} unidades, solicitado: ${quantitySold}` 
      }, { status: 400 });
    }

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
      movements.push({ id: batch.id, type: 'exit', quantity: deduct, date: new Date().toISOString().slice(0, 19).replace('T', ' ') });
      remainingToSell -= deduct;
    }

    // Atualize qtdSaidaTotal no produto
    const product = await db.select().from(products).where(eq(products.id, productId));
    await db
      .update(products)
      .set({
        qtdSaidaTotal: (product[0].qtdSaidaTotal || 0) + quantitySold,
      })
      .where(eq(products.id, productId));

    // Registre a venda com assinatura do vendedor
    const saleId = randomUUID();
    await db.insert(sales).values({
      id: saleId,
      productId,
      quantity: quantitySold,
      price: unitPrice,
      date: new Date().toISOString().slice(0, 19).replace('T', ' '),
      userId: userId || null,
      customerId: customerId || null,
      sellerSignature: userId ? `${userName || 'N/A'} (${userEmail || 'N/A'})` : 'Venda PDV',
      sellerName: userName || 'Operador PDV',
    });

    return NextResponse.json({
      success: true,
      message: `Venda realizada: ${quantitySold} unidades`,
      movements,
      saleId,
    });
  } catch (error) {
    console.error('Erro na venda:', error);
    return NextResponse.json({ error: 'Erro na venda' }, { status: 500 });
  }
}

// DELETE - Cancelar/excluir venda simples
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const saleId = searchParams.get('id');
    
    if (!saleId) {
      return NextResponse.json({ error: 'ID da venda obrigatório' }, { status: 400 });
    }

    // Buscar a venda
    const sale = await db
      .select()
      .from(sales)
      .where(eq(sales.id, saleId))
      .limit(1);

    if (sale.length === 0) {
      return NextResponse.json({ error: 'Venda não encontrada' }, { status: 404 });
    }

    const saleData = sale[0];

    // Reverter estoque - buscar lotes do produto
    const batches = await db
      .select()
      .from(productBatches)
      .where(eq(productBatches.productId, saleData.productId))
      .orderBy(asc(productBatches.purchaseDate));

    let remainingToReturn = saleData.quantity;

    // Devolver ao lote mais antigo primeiro
    for (const batch of batches) {
      if (remainingToReturn <= 0) break;
      const addBack = Math.min(remainingToReturn, saleData.quantity);
      await db
        .update(productBatches)
        .set({
          quantityRemaining: batch.quantityRemaining + addBack,
        })
        .where(eq(productBatches.id, batch.id));
      remainingToReturn -= addBack;
    }

    // Atualizar qtdSaidaTotal no produto
    const product = await db.select().from(products).where(eq(products.id, saleData.productId));
    if (product.length > 0) {
      await db
        .update(products)
        .set({
          qtdSaidaTotal: Math.max(0, (product[0].qtdSaidaTotal || 0) - saleData.quantity),
        })
        .where(eq(products.id, saleData.productId));
    }

    // Deletar a venda
    await db.delete(sales).where(eq(sales.id, saleId));

    return NextResponse.json({ message: 'Venda cancelada e excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao cancelar venda:', error);
    return NextResponse.json({ error: 'Erro ao cancelar venda' }, { status: 500 });
  }
}