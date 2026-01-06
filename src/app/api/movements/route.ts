import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { movements } from '../../../lib/schema';
import { sql, gte, lte, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let whereClause = undefined;
    if (startDate && endDate) {
      whereClause = and(gte(movements.data, startDate), lte(movements.data, endDate));
    }

    // Agrupar por data, somar entradas e saídas
    const result = await db
      .select({
        date: sql<string>`DATE(${movements.data})`,
        tipo: movements.tipo,
        total: sql<number>`SUM(${movements.quantidade})`,
      })
      .from(movements)
      .where(whereClause)
      .groupBy(sql`DATE(${movements.data})`, movements.tipo)
      .orderBy(sql`DATE(${movements.data})`);

    // Transformar em formato para chart: { date, entradas, saidas }
    const aggregated: { [date: string]: { entradas: number; saidas: number } } = {};
    result.forEach(row => {
      if (!aggregated[row.date]) {
        aggregated[row.date] = { entradas: 0, saidas: 0 };
      }
      if (row.tipo === 'entrada') {
        aggregated[row.date].entradas = row.total;
      } else if (row.tipo === 'saida') {
        aggregated[row.date].saidas = row.total;
      }
    });

    const data = Object.entries(aggregated).map(([date, values]) => ({
      date,
      entradas: values.entradas,
      saidas: values.saidas,
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro ao buscar movimentos:', error);
    return NextResponse.json({ error: 'Erro ao buscar movimentos' }, { status: 500 });
  }
}
