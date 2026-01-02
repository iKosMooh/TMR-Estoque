import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { posSessions, salesOrders } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Obter detalhes de uma sessão
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const session = await db
      .select()
      .from(posSessions)
      .where(eq(posSessions.id, id))
      .limit(1);

    if (session.length === 0) {
      return NextResponse.json({ error: 'Sessão não encontrada' }, { status: 404 });
    }

    // Buscar vendas desta sessão
    const sales = await db
      .select()
      .from(salesOrders)
      .where(eq(salesOrders.posSessionId, id))
      .orderBy(desc(salesOrders.createdAt));

    return NextResponse.json({
      session: session[0],
      sales,
    });
  } catch (error) {
    console.error('Erro ao buscar sessão:', error);
    return NextResponse.json({ error: 'Erro ao buscar sessão' }, { status: 500 });
  }
}

// PUT - Fechar caixa
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { closingBalance, notes } = body;

    // Verificar se a sessão existe e está aberta
    const session = await db
      .select()
      .from(posSessions)
      .where(eq(posSessions.id, id))
      .limit(1);

    if (session.length === 0) {
      return NextResponse.json({ error: 'Sessão não encontrada' }, { status: 404 });
    }

    if (session[0].status !== 'open') {
      return NextResponse.json({ error: 'Esta sessão já está fechada' }, { status: 400 });
    }

    const now = new Date();
    const totalSales = 
      parseFloat(session[0].cashSales || '0') + 
      parseFloat(session[0].cardSales || '0') + 
      parseFloat(session[0].pixSales || '0') + 
      parseFloat(session[0].otherSales || '0');

    await db
      .update(posSessions)
      .set({
        closedAt: now,
        closingBalance: closingBalance?.toString() || null,
        totalSales: totalSales.toString(),
        status: 'closed',
        notes: notes || session[0].notes,
      })
      .where(eq(posSessions.id, id));

    return NextResponse.json({
      message: 'Caixa fechado com sucesso',
      closedAt: now.toISOString(),
      totalSales,
    });
  } catch (error) {
    console.error('Erro ao fechar caixa:', error);
    return NextResponse.json({ error: 'Erro ao fechar caixa' }, { status: 500 });
  }
}
