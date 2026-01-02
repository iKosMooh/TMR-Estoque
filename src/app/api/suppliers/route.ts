import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { suppliers } from '@/lib/schema';
import { eq, and, like, or, desc } from 'drizzle-orm';

// Função de validação CNPJ
function validateCNPJ(cnpj: string): boolean {
  const cleaned = cnpj.replace(/\D/g, '');
  if (cleaned.length !== 14 || /^(\d)\1+$/.test(cleaned)) return false;
  
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += parseInt(cleaned[i]) * weights1[i];
  let digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (digit !== parseInt(cleaned[12])) return false;
  
  sum = 0;
  for (let i = 0; i < 13; i++) sum += parseInt(cleaned[i]) * weights2[i];
  digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  return digit === parseInt(cleaned[13]);
}

// GET: Listar todos os fornecedores
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const active = searchParams.get('active');
    
    let query = db.select().from(suppliers);
    
    const conditions = [];
    
    if (search) {
      conditions.push(
        or(
          like(suppliers.companyName, `%${search}%`),
          like(suppliers.tradingName, `%${search}%`),
          like(suppliers.cnpj, `%${search}%`),
          like(suppliers.email, `%${search}%`)
        )
      );
    }
    
    if (active === 'true') {
      conditions.push(eq(suppliers.isActive, 1));
    } else if (active === 'false') {
      conditions.push(eq(suppliers.isActive, 0));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query;
    }
    
    const supplierList = await query.orderBy(desc(suppliers.createdAt));
    
    return NextResponse.json({ suppliers: supplierList });
  } catch (error) {
    console.error('Erro ao listar fornecedores:', error);
    return NextResponse.json({ error: 'Erro ao listar fornecedores' }, { status: 500 });
  }
}

// POST: Criar novo fornecedor
export async function POST(request: NextRequest) {
  try {
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

    if (!companyName || !companyName.trim()) {
      return NextResponse.json({ error: 'Razão Social é obrigatória' }, { status: 400 });
    }

    // Validar CNPJ se fornecido
    if (cnpj) {
      const cleaned = cnpj.replace(/\D/g, '');
      if (cleaned.length > 0 && !validateCNPJ(cleaned)) {
        return NextResponse.json({ error: 'CNPJ inválido' }, { status: 400 });
      }
    }

    const id = crypto.randomUUID();

    await db.insert(suppliers).values({
      id,
      companyName: companyName.trim(),
      tradingName: tradingName?.trim() || null,
      cnpj: cnpj?.replace(/\D/g, '') || null,
      stateRegistration: stateRegistration || null,
      email: email || null,
      phone: phone?.replace(/\D/g, '') || null,
      mobile: mobile?.replace(/\D/g, '') || null,
      contactName: contactName || null,
      addressStreet: addressStreet || null,
      addressNumber: addressNumber || null,
      addressComplement: addressComplement || null,
      addressNeighborhood: addressNeighborhood || null,
      addressCity: addressCity || null,
      addressState: addressState || null,
      addressZipcode: addressZipcode?.replace(/\D/g, '') || null,
      notes: notes || null,
      paymentTerms: paymentTerms || null,
      isActive: 1,
    });

    return NextResponse.json({ id, message: 'Fornecedor criado com sucesso' }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar fornecedor:', error);
    return NextResponse.json({ error: 'Erro ao criar fornecedor' }, { status: 500 });
  }
}
