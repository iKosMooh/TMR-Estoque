import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { financialTransactions, bankAccounts, customers, suppliers, financialCategories } from '@/lib/schema';
import { eq, like, and, desc, gte, lte, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type'); // income, expense, transfer
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const conditions = [];
    
    if (search) {
      conditions.push(like(financialTransactions.description, `%${search}%`));
    }

    if (type) {
      conditions.push(eq(financialTransactions.transactionType, type as 'income' | 'expense' | 'transfer'));
    }

    if (status) {
      conditions.push(eq(financialTransactions.status, status as 'pending' | 'paid' | 'overdue' | 'cancelled' | 'partially_paid'));
    }

    if (startDate) {
      conditions.push(gte(financialTransactions.dueDate, new Date(startDate).toISOString()));
    }

    if (endDate) {
      conditions.push(lte(financialTransactions.dueDate, new Date(endDate).toISOString()));
    }

    const transactions = await db
      .select({
        transaction: financialTransactions,
        bankAccount: bankAccounts,
        customer: customers,
        supplier: suppliers,
        category: financialCategories,
      })
      .from(financialTransactions)
      .leftJoin(bankAccounts, eq(financialTransactions.bankAccountId, bankAccounts.id))
      .leftJoin(customers, eq(financialTransactions.customerId, customers.id))
      .leftJoin(suppliers, eq(financialTransactions.supplierId, suppliers.id))
      .leftJoin(financialCategories, eq(financialTransactions.categoryId, financialCategories.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(financialTransactions.dueDate));

    // Calcular totais
    const [totals] = await db
      .select({
        totalIncome: sql<string>`COALESCE(SUM(CASE WHEN transaction_type = 'income' AND status = 'paid' THEN amount ELSE 0 END), 0)`,
        totalExpense: sql<string>`COALESCE(SUM(CASE WHEN transaction_type = 'expense' AND status = 'paid' THEN amount ELSE 0 END), 0)`,
        totalPending: sql<string>`COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0)`,
        totalOverdue: sql<string>`COALESCE(SUM(CASE WHEN status = 'overdue' THEN amount ELSE 0 END), 0)`,
      })
      .from(financialTransactions);

    return NextResponse.json({
      transactions,
      totals: {
        income: parseFloat(totals?.totalIncome || '0'),
        expense: parseFloat(totals?.totalExpense || '0'),
        pending: parseFloat(totals?.totalPending || '0'),
        overdue: parseFloat(totals?.totalOverdue || '0'),
        balance: parseFloat(totals?.totalIncome || '0') - parseFloat(totals?.totalExpense || '0'),
      },
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
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
      paymentMethod,
      notes 
    } = body;

    if (!transactionType || !description || !amount || !dueDate) {
      return NextResponse.json({ error: 'Tipo, descrição, valor e data de vencimento são obrigatórios' }, { status: 400 });
    }

    const id = uuidv4();
    const now = new Date().toISOString();
    
    // Determinar status inicial
    let status: 'pending' | 'paid' | 'overdue' = 'pending';
    if (paymentDate) {
      status = 'paid';
    } else if (new Date(dueDate) < new Date(now)) {
      status = 'overdue';
    }

    await db.insert(financialTransactions).values({
      id,
      transactionType,
      description,
      amount: amount.toString(),
      bankAccountId: bankAccountId || null,
      categoryId: categoryId || null,
      customerId: customerId || null,
      supplierId: supplierId || null,
      dueDate: new Date(dueDate).toISOString(),
      paymentDate: paymentDate ? new Date(paymentDate).toISOString() : null,
      status,
      paidAmount: paymentDate ? amount.toString() : '0',
      paymentMethod: paymentMethod || null,
      notes: notes || null,
      createdAt: now,
      updatedAt: now,
    });

    // Atualizar saldo da conta bancária se pago
    if (paymentDate && bankAccountId) {
      const multiplier = transactionType === 'income' ? 1 : -1;
      await db
        .update(bankAccounts)
        .set({
          balance: sql`${bankAccounts.balance} + ${multiplier * parseFloat(amount)}`,
          updatedAt: now,
        })
        .where(eq(bankAccounts.id, bankAccountId));
    }

    const [newTransaction] = await db
      .select()
      .from(financialTransactions)
      .where(eq(financialTransactions.id, id));

    return NextResponse.json(newTransaction, { status: 201 });
  } catch (error) {
    console.error('Error creating transaction:', error);
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
  }
}
