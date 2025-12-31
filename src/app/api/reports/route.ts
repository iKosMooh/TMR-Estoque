import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../lib/db'; // Caminho relativo ajustado
import { movements, products } from '../../../lib/schema'; // Caminho relativo ajustado
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
        gte(movements.data, new Date(startDate)),
        lte(movements.data, new Date(endDate))
      );
    }

    // Buscar movimentos
    const movementsData = await db
      .select({
        id: movements.id,
        type: movements.tipo, // Ajustado de 'type' para 'tipo'
        quantity: movements.quantidade, // Ajustado de 'quantity' para 'quantidade'
        unitPrice: movements.precoUnitario, // Ajustado de 'unitPrice' para 'precoUnitario'
        date: sql<string>`DATE(${movements.data})`,
        reference: movements.referencia,
        productName: products.name,
        productCode: products.internalCode,
      })
      .from(movements)
      .innerJoin(products, eq(movements.produtoId, products.id)) // Ajustado de 'productId' para 'produtoId'
      .where(dateFilter)
      .orderBy(desc(movements.data));

    // Estatísticas gerais
    const stats = await db
      .select({
        totalProducts: sql<number>`count(distinct ${products.id})`,
        totalStock: sql<number>`sum(${products.currentQuantity})`,
        totalSales: sql<number>`sum(case when ${movements.tipo} = 'saida' then ${movements.quantidade} else 0 end)`, // Ajustado de 'type' para 'tipo', 'quantity' para 'quantidade'
        totalRevenue: sql<number>`sum(case when ${movements.tipo} = 'saida' then ${movements.quantidade} * cast(${movements.precoUnitario} as decimal) else 0 end)`, // Ajustado de 'type' para 'tipo', 'quantity' para 'quantidade', 'unitPrice' para 'precoUnitario'
      })
      .from(products)
      .leftJoin(movements, eq(products.id, movements.produtoId)) // Ajustado de 'productId' para 'produtoId'
      .where(dateFilter);

    // Produtos mais vendidos
    const topProducts = await db
      .select({
        productName: products.name,
        productCode: products.internalCode,
        totalSold: sql<number>`sum(${movements.quantidade})`, // Ajustado de 'quantity' para 'quantidade'
        totalRevenue: sql<number>`sum(${movements.quantidade} * cast(${movements.precoUnitario} as decimal))`, // Ajustado de 'quantity' para 'quantidade', 'unitPrice' para 'precoUnitario'
      })
      .from(movements)
      .innerJoin(products, eq(movements.produtoId, products.id)) // Ajustado de 'productId' para 'produtoId'
      .where(and(eq(movements.tipo, 'saida'), dateFilter)) // Ajustado de 'type' para 'tipo'
      .groupBy(products.id, products.name, products.internalCode)
      .orderBy(desc(sql`sum(${movements.quantidade})`)) // Ajustado de 'quantity' para 'quantidade'
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