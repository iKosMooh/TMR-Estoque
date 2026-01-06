import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bankAccounts } from '@/lib/schema';
import { eq, like, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const activeOnly = searchParams.get('activeOnly') !== 'false';

    const conditions = [];
    
    if (search) {
      conditions.push(like(bankAccounts.bankName, `%${search}%`));
    }

    if (activeOnly) {
      conditions.push(eq(bankAccounts.isActive, 1));
    }

    const accounts = await db
      .select()
      .from(bankAccounts)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(bankAccounts.bankName);

    return NextResponse.json(accounts);
  } catch (error) {
    console.error('Error fetching bank accounts:', error);
    return NextResponse.json({ error: 'Failed to fetch bank accounts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { bankName, bankCode, agency, accountNumber, accountType, balance } = body;

    if (!bankName || !accountType) {
      return NextResponse.json({ error: 'Nome do banco e tipo de conta são obrigatórios' }, { status: 400 });
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    await db.insert(bankAccounts).values({
      id,
      bankName,
      bankCode: bankCode || null,
      agency: agency || null,
      accountNumber: accountNumber || null,
      accountType,
      balance: balance || '0',
      isActive: 1,
      createdAt: now,
      updatedAt: now,
    });

    const [newAccount] = await db
      .select()
      .from(bankAccounts)
      .where(eq(bankAccounts.id, id));

    return NextResponse.json(newAccount, { status: 201 });
  } catch (error) {
    console.error('Error creating bank account:', error);
    return NextResponse.json({ error: 'Failed to create bank account' }, { status: 500 });
  }
}
