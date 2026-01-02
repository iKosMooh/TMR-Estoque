import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { customers } from '@/lib/schema';
import { eq } from 'drizzle-orm';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: Buscar cliente por ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    const customer = await db
      .select()
      .from(customers)
      .where(eq(customers.id, id))
      .limit(1);

    if (customer.length === 0) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ customer: customer[0] });
  } catch (error) {
    console.error('Erro ao buscar cliente:', error);
    return NextResponse.json({ error: 'Erro ao buscar cliente' }, { status: 500 });
  }
}

// PUT: Atualizar cliente
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const {
      type,
      name,
      cpfCnpj,
      email,
      phone,
      mobile,
      addressStreet,
      addressNumber,
      addressComplement,
      addressNeighborhood,
      addressCity,
      addressState,
      addressZipcode,
      notes,
      creditLimit,
    } = body;

    // Verificar se cliente existe
    const existing = await db
      .select()
      .from(customers)
      .where(eq(customers.id, id))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    await db
      .update(customers)
      .set({
        type: type || existing[0].type,
        name: name?.trim() || existing[0].name,
        cpfCnpj: cpfCnpj?.replace(/\D/g, '') || existing[0].cpfCnpj,
        email: email !== undefined ? email : existing[0].email,
        phone: phone?.replace(/\D/g, '') || existing[0].phone,
        mobile: mobile?.replace(/\D/g, '') || existing[0].mobile,
        addressStreet: addressStreet !== undefined ? addressStreet : existing[0].addressStreet,
        addressNumber: addressNumber !== undefined ? addressNumber : existing[0].addressNumber,
        addressComplement: addressComplement !== undefined ? addressComplement : existing[0].addressComplement,
        addressNeighborhood: addressNeighborhood !== undefined ? addressNeighborhood : existing[0].addressNeighborhood,
        addressCity: addressCity !== undefined ? addressCity : existing[0].addressCity,
        addressState: addressState !== undefined ? addressState : existing[0].addressState,
        addressZipcode: addressZipcode?.replace(/\D/g, '') || existing[0].addressZipcode,
        notes: notes !== undefined ? notes : existing[0].notes,
        creditLimit: creditLimit !== undefined ? creditLimit?.toString() : existing[0].creditLimit,
      })
      .where(eq(customers.id, id));

    return NextResponse.json({ message: 'Cliente atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);
    return NextResponse.json({ error: 'Erro ao atualizar cliente' }, { status: 500 });
  }
}

// DELETE: Excluir cliente (soft delete)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Verificar se cliente existe
    const existing = await db
      .select()
      .from(customers)
      .where(eq(customers.id, id))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    // Soft delete - apenas marca como inativo
    await db
      .update(customers)
      .set({ isActive: 0 })
      .where(eq(customers.id, id));

    return NextResponse.json({ message: 'Cliente excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir cliente:', error);
    return NextResponse.json({ error: 'Erro ao excluir cliente' }, { status: 500 });
  }
}
