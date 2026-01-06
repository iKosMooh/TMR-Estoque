import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { financialTransactions, bankAccounts } from '@/lib/schema';
import { eq, sql } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const [transaction] = await db
      .select()
      .from(financialTransactions)
      .where(eq(financialTransactions.id, id));

    if (!transaction) {
      return NextResponse.json({ error: 'Transação não encontrada' }, { status: 404 });
    }

    return NextResponse.json(transaction);
  } catch (error) {
    console.error('Error fetching transaction:', error);
    return NextResponse.json({ error: 'Failed to fetch transaction' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { 
      transactionType, 
      description, 
      amount, 
      bankAccountId, 
      categoryId, 
      customerId, 
      supplierId, 
      dueDate, 
      paymentDate,
      status,
      paidAmount,
      paymentMethod,
      notes 
    } = body;

    const now = new Date().toISOString();

    // Buscar transação atual para calcular diferença
    const [currentTransaction] = await db
      .select()
      .from(financialTransactions)
      .where(eq(financialTransactions.id, id));

    if (!currentTransaction) {
      return NextResponse.json({ error: 'Transação não encontrada' }, { status: 404 });
    }

    // Determinar novo status
    let newStatus = status;
    if (!newStatus) {
      if (paymentDate || (paidAmount && parseFloat(paidAmount) >= parseFloat(amount))) {
        newStatus = 'paid';
      } else if (paidAmount && parseFloat(paidAmount) > 0) {
        newStatus = 'partially_paid';
      } else if (new Date(dueDate) < new Date(now)) {
        newStatus = 'overdue';
      } else {
        newStatus = 'pending';
      }
    }

    await db
      .update(financialTransactions)
      .set({
        transactionType,
        description,
        amount: amount.toString(),
        bankAccountId: bankAccountId || null,
        categoryId: categoryId || null,
        customerId: customerId || null,
        supplierId: supplierId || null,
        dueDate: new Date(dueDate).toISOString(),
        paymentDate: paymentDate ? new Date(paymentDate).toISOString() : null,
        status: newStatus,
        paidAmount: paidAmount ? paidAmount.toString() : '0',
        paymentMethod: paymentMethod || null,
        notes: notes || null,
        updatedAt: now,
      })
      .where(eq(financialTransactions.id, id));

    const [updated] = await db
      .select()
      .from(financialTransactions)
      .where(eq(financialTransactions.id, id));

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating transaction:', error);
    return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Buscar transação para reverter saldo se necessário
    const [transaction] = await db
      .select()
      .from(financialTransactions)
      .where(eq(financialTransactions.id, id));

    if (transaction && transaction.status === 'paid' && transaction.bankAccountId) {
      // Reverter o saldo da conta
      const multiplier = transaction.transactionType === 'income' ? -1 : 1;
      await db
        .update(bankAccounts)
        .set({
          balance: sql`${bankAccounts.balance} + ${multiplier * parseFloat(transaction.paidAmount || '0')}`,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(bankAccounts.id, transaction.bankAccountId));
    }

    await db
      .update(financialTransactions)
      .set({ status: 'cancelled', updatedAt: new Date().toISOString() })
      .where(eq(financialTransactions.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 });
  }
}
