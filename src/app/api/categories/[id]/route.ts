import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { productCategories } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const [category] = await db
      .select()
      .from(productCategories)
      .where(eq(productCategories.id, id));

    if (!category) {
      return NextResponse.json({ error: 'Categoria não encontrada' }, { status: 404 });
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    return NextResponse.json({ error: 'Failed to fetch category' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { name, slug, description, parentId, imageUrl, sortOrder, isActive } = body;

    await db
      .update(productCategories)
      .set({
        name,
        slug,
        description: description || null,
        parentId: parentId || null,
        imageUrl: imageUrl || null,
        sortOrder: sortOrder || 0,
        isActive: isActive !== undefined ? isActive : 1,
        updatedAt: new Date(),
      })
      .where(eq(productCategories.id, id));

    const [updated] = await db
      .select()
      .from(productCategories)
      .where(eq(productCategories.id, id));

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await db
      .update(productCategories)
      .set({ isActive: 0, updatedAt: new Date() })
      .where(eq(productCategories.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
