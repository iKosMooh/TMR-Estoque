import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { suppliers } from '@/lib/schema';
import { eq } from 'drizzle-orm';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: Buscar fornecedor por ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    const supplier = await db
      .select()
      .from(suppliers)
      .where(eq(suppliers.id, id))
      .limit(1);

    if (supplier.length === 0) {
      return NextResponse.json({ error: 'Fornecedor não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ supplier: supplier[0] });
  } catch (error) {
    console.error('Erro ao buscar fornecedor:', error);
    return NextResponse.json({ error: 'Erro ao buscar fornecedor' }, { status: 500 });
  }
}

// PUT: Atualizar fornecedor
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const {
      companyName,
      tradingName,
      cnpj,
      stateRegistration,
      email,
      phone,
      mobile,
      contactName,
      addressStreet,
      addressNumber,
      addressComplement,
      addressNeighborhood,
      addressCity,
      addressState,
      addressZipcode,
      notes,
      paymentTerms,
    } = body;

    // Verificar se fornecedor existe
    const existing = await db
      .select()
      .from(suppliers)
      .where(eq(suppliers.id, id))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Fornecedor não encontrado' }, { status: 404 });
    }

    await db
      .update(suppliers)
      .set({
        companyName: companyName?.trim() || existing[0].companyName,
        tradingName: tradingName !== undefined ? tradingName?.trim() : existing[0].tradingName,
        cnpj: cnpj?.replace(/\D/g, '') || existing[0].cnpj,
        stateRegistration: stateRegistration !== undefined ? stateRegistration : existing[0].stateRegistration,
        email: email !== undefined ? email : existing[0].email,
        phone: phone?.replace(/\D/g, '') || existing[0].phone,
        mobile: mobile?.replace(/\D/g, '') || existing[0].mobile,
        contactName: contactName !== undefined ? contactName : existing[0].contactName,
        addressStreet: addressStreet !== undefined ? addressStreet : existing[0].addressStreet,
        addressNumber: addressNumber !== undefined ? addressNumber : existing[0].addressNumber,
        addressComplement: addressComplement !== undefined ? addressComplement : existing[0].addressComplement,
        addressNeighborhood: addressNeighborhood !== undefined ? addressNeighborhood : existing[0].addressNeighborhood,
        addressCity: addressCity !== undefined ? addressCity : existing[0].addressCity,
        addressState: addressState !== undefined ? addressState : existing[0].addressState,
        addressZipcode: addressZipcode?.replace(/\D/g, '') || existing[0].addressZipcode,
        notes: notes !== undefined ? notes : existing[0].notes,
        paymentTerms: paymentTerms !== undefined ? paymentTerms : existing[0].paymentTerms,
      })
      .where(eq(suppliers.id, id));

    return NextResponse.json({ message: 'Fornecedor atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar fornecedor:', error);
    return NextResponse.json({ error: 'Erro ao atualizar fornecedor' }, { status: 500 });
  }
}

// DELETE: Excluir fornecedor (soft delete)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Verificar se fornecedor existe
    const existing = await db
      .select()
      .from(suppliers)
      .where(eq(suppliers.id, id))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Fornecedor não encontrado' }, { status: 404 });
    }

    // Soft delete - apenas marca como inativo
    await db
      .update(suppliers)
      .set({ isActive: 0 })
      .where(eq(suppliers.id, id));

    return NextResponse.json({ message: 'Fornecedor excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir fornecedor:', error);
    return NextResponse.json({ error: 'Erro ao excluir fornecedor' }, { status: 500 });
  }
}
