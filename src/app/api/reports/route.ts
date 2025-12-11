import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { movements, products } from '@/lib/db/schema';
import { eq, sql, desc, and, gte, lte } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Filtros de data
    let dateFilter = undefined;
    if (startDate && endDate) {
      dateFilter = and(
        gte(movements.date, new Date(startDate)),
        lte(movements.date, new Date(endDate))
      );
    }

    // Buscar movimentos
    const movementsData = await db
      .select({
        id: movements.id,
        type: movements.type,
        quantity: movements.quantity,
        unitPrice: movements.unitPrice,
        date: movements.date,
        reference: movements.reference,
        productName: products.name,
        productCode: products.internalCode,
      })
      .from(movements)
      .innerJoin(products, eq(movements.productId, products.id))
      .where(dateFilter)
      .orderBy(desc(movements.date));

    // Estatísticas gerais
    const stats = await db
      .select({
        totalProducts: sql<number>`count(distinct ${products.id})`,
        totalStock: sql<number>`sum(${products.currentQuantity})`,
        totalSales: sql<number>`sum(case when ${movements.type} = 'saida' then ${movements.quantity} else 0 end)`,
        totalRevenue: sql<number>`sum(case when ${movements.type} = 'saida' then ${movements.quantity} * cast(${movements.unitPrice} as decimal) else 0 end)`,
      })
      .from(products)
      .leftJoin(movements, eq(products.id, movements.productId))
      .where(dateFilter);

    // Produtos mais vendidos
    const topProducts = await db
      .select({
        productName: products.name,
        productCode: products.internalCode,
        totalSold: sql<number>`sum(${movements.quantity})`,
        totalRevenue: sql<number>`sum(${movements.quantity} * cast(${movements.unitPrice} as decimal))`,
      })
      .from(movements)
      .innerJoin(products, eq(movements.productId, products.id))
      .where(and(eq(movements.type, 'saida'), dateFilter))
      .groupBy(products.id, products.name, products.internalCode)
      .orderBy(desc(sql`sum(${movements.quantity})`))
      .limit(10);

    return NextResponse.json({
      movements: movementsData,
      stats: stats[0],
      topProducts,
    });
  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}