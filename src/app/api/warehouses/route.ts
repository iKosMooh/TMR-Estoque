import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { warehouses } from '@/lib/schema';
import { eq, like, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const activeOnly = searchParams.get('activeOnly') !== 'false';

    const conditions = [];
    
    if (search) {
      conditions.push(like(warehouses.name, `%${search}%`));
    }

    if (activeOnly) {
      conditions.push(eq(warehouses.isActive, 1));
    }

    const warehouseList = await db
      .select()
      .from(warehouses)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(warehouses.name);

    return NextResponse.json(warehouseList);
  } catch (error) {
    console.error('Error fetching warehouses:', error);
    return NextResponse.json({ error: 'Failed to fetch warehouses' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { name, code, description, addressStreet, addressNumber, addressCity, addressState, isMain } = body;

    if (!name) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
    }

    const id = uuidv4();
    const now = new Date();

    // Se for definido como principal, desmarcar os outros
    if (isMain) {
      await db
        .update(warehouses)
        .set({ isMain: 0, updatedAt: now })
        .where(eq(warehouses.isMain, 1));
    }

    await db.insert(warehouses).values({
      id,
      name,
      code: code || null,
      description: description || null,
      addressStreet: addressStreet || null,
      addressNumber: addressNumber || null,
      addressCity: addressCity || null,
      addressState: addressState || null,
      isMain: isMain ? 1 : 0,
      isActive: 1,
      createdAt: now,
      updatedAt: now,
    });

    const [newWarehouse] = await db
      .select()
      .from(warehouses)
      .where(eq(warehouses.id, id));

    return NextResponse.json(newWarehouse, { status: 201 });
  } catch (error) {
    console.error('Error creating warehouse:', error);
    return NextResponse.json({ error: 'Failed to create warehouse' }, { status: 500 });
  }
}
