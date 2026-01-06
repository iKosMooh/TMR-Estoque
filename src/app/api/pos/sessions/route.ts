import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { posSessions } from '@/lib/schema';
import { eq, and, desc } from 'drizzle-orm';

// GET - Listar sessões de caixa ou obter sessão ativa
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';
    const userId = searchParams.get('userId');
    
    let query = db.select().from(posSessions);
    
    const conditions = [];
    
    if (activeOnly) {
      conditions.push(eq(posSessions.status, 'open'));
    }
    
    if (userId) {
      conditions.push(eq(posSessions.userId, userId));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query;
    }
    
    const sessions = await query.orderBy(desc(posSessions.openedAt));
    
    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('Erro ao buscar sessões:', error);
    return NextResponse.json({ error: 'Erro ao buscar sessões de caixa' }, { status: 500 });
  }
}

// POST - Abrir nova sessão de caixa
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, openingBalance = 0, notes } = body;

    if (!userId) {
      return NextResponse.json({ error: 'ID do usuário é obrigatório' }, { status: 400 });
    }

    // Verificar se já existe uma sessão aberta para este usuário
    const existingSession = await db
      .select()
      .from(posSessions)
      .where(and(eq(posSessions.userId, userId), eq(posSessions.status, 'open')))
      .limit(1);

    if (existingSession.length > 0) {
      return NextResponse.json({ error: 'Já existe uma sessão de caixa aberta para este usuário' }, { status: 400 });
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await db.insert(posSessions).values({
      id,
      userId,
      openedAt: now,
      openingBalance: openingBalance.toString(),
      cashSales: '0',
      cardSales: '0',
      pixSales: '0',
      otherSales: '0',
      totalSales: '0',
      status: 'open',
      notes: notes || null,
    });

    return NextResponse.json({
      id,
      message: 'Caixa aberto com sucesso',
      openedAt: now,
      openingBalance,
    });
  } catch (error) {
    console.error('Erro ao abrir caixa:', error);
    return NextResponse.json({ error: 'Erro ao abrir caixa' }, { status: 500 });
  }
}
