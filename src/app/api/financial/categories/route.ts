import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { financialCategories } from '@/lib/schema';
import { eq, like, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type'); // income, expense
    const activeOnly = searchParams.get('activeOnly') !== 'false';

    const conditions = [];
    
    if (search) {
      conditions.push(like(financialCategories.name, `%${search}%`));
    }

    if (type) {
      conditions.push(eq(financialCategories.type, type as 'income' | 'expense'));
    }

    if (activeOnly) {
      conditions.push(eq(financialCategories.isActive, 1));
    }

    const categories = await db
      .select()
      .from(financialCategories)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(financialCategories.type, financialCategories.name);

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching financial categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { name, type, parentId } = body;

    if (!name || !type) {
      return NextResponse.json({ error: 'Nome e tipo são obrigatórios' }, { status: 400 });
    }

    const id = uuidv4();
    const now = new Date();

    await db.insert(financialCategories).values({
      id,
      name,
      type,
      parentId: parentId || null,
      isActive: 1,
      createdAt: now,
    });

    const [newCategory] = await db
      .select()
      .from(financialCategories)
      .where(eq(financialCategories.id, id));

    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    console.error('Error creating financial category:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
