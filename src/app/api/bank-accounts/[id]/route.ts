import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bankAccounts } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const [account] = await db
      .select()
      .from(bankAccounts)
      .where(eq(bankAccounts.id, id));

    if (!account) {
      return NextResponse.json({ error: 'Conta bancária não encontrada' }, { status: 404 });
    }

    return NextResponse.json(account);
  } catch (error) {
    console.error('Error fetching bank account:', error);
    return NextResponse.json({ error: 'Failed to fetch bank account' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { bankName, bankCode, agency, accountNumber, accountType, balance, isActive } = body;

    await db
      .update(bankAccounts)
      .set({
        bankName,
        bankCode: bankCode || null,
        agency: agency || null,
        accountNumber: accountNumber || null,
        accountType,
        balance: balance || '0',
        isActive: isActive !== undefined ? isActive : 1,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(bankAccounts.id, id));

    const [updated] = await db
      .select()
      .from(bankAccounts)
      .where(eq(bankAccounts.id, id));

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating bank account:', error);
    return NextResponse.json({ error: 'Failed to update bank account' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await db
      .update(bankAccounts)
      .set({ isActive: 0, updatedAt: new Date().toISOString() })
      .where(eq(bankAccounts.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting bank account:', error);
    return NextResponse.json({ error: 'Failed to delete bank account' }, { status: 500 });
  }
}
