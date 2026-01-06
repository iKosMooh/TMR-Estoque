import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { warehouses } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const [warehouse] = await db
      .select()
      .from(warehouses)
      .where(eq(warehouses.id, id));

    if (!warehouse) {
      return NextResponse.json({ error: 'Depósito não encontrado' }, { status: 404 });
    }

    return NextResponse.json(warehouse);
  } catch (error) {
    console.error('Error fetching warehouse:', error);
    return NextResponse.json({ error: 'Failed to fetch warehouse' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { name, code, description, addressStreet, addressNumber, addressCity, addressState, isMain, isActive } = body;
    const now = new Date().toISOString();

    // Se for definido como principal, desmarcar os outros
    if (isMain) {
      await db
        .update(warehouses)
        .set({ isMain: 0, updatedAt: now })
        .where(eq(warehouses.isMain, 1));
    }

    await db
      .update(warehouses)
      .set({
        name,
        code: code || null,
        description: description || null,
        addressStreet: addressStreet || null,
        addressNumber: addressNumber || null,
        addressCity: addressCity || null,
        addressState: addressState || null,
        isMain: isMain ? 1 : 0,
        isActive: isActive !== undefined ? isActive : 1,
        updatedAt: now,
      })
      .where(eq(warehouses.id, id));

    const [updated] = await db
      .select()
      .from(warehouses)
      .where(eq(warehouses.id, id));

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating warehouse:', error);
    return NextResponse.json({ error: 'Failed to update warehouse' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await db
      .update(warehouses)
      .set({ isActive: 0, updatedAt: new Date().toISOString() })
      .where(eq(warehouses.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting warehouse:', error);
    return NextResponse.json({ error: 'Failed to delete warehouse' }, { status: 500 });
  }
}
