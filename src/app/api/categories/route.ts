import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { productCategories } from '@/lib/schema';
import { eq, like, and, isNull } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const parentId = searchParams.get('parentId');

    const conditions = [];
    
    if (search) {
      conditions.push(like(productCategories.name, `%${search}%`));
    }

    if (parentId === 'root') {
      conditions.push(isNull(productCategories.parentId));
    } else if (parentId) {
      conditions.push(eq(productCategories.parentId, parentId));
    }

    const categories = await db
      .select()
      .from(productCategories)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(productCategories.sortOrder, productCategories.name);

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { name, slug, description, parentId, imageUrl, sortOrder } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: 'Nome e slug são obrigatórios' }, { status: 400 });
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    await db.insert(productCategories).values({
      id,
      name,
      slug,
      description: description || null,
      parentId: parentId || null,
      imageUrl: imageUrl || null,
      sortOrder: sortOrder || 0,
      isActive: 1,
      createdAt: now,
      updatedAt: now,
    });

    const [newCategory] = await db
      .select()
      .from(productCategories)
      .where(eq(productCategories.id, id));

    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
