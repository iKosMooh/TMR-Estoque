/**
 * Utilitários para cálculos fiscais - Reforma Tributária 2026
 * Implementa os cálculos de IBS (Imposto sobre Bens e Serviços) e CBS (Contribuição sobre Bens e Serviços)
 * 
 * Referência: Lei Complementar nº 214/2025
 * Nota Técnica 2025.002-RTC
 */

export interface TaxCalculationInput {
  // Valor base do serviço/produto
  baseValue: number;
  // Deduções permitidas (se houver)
  deductions?: number;
  // Alíquotas
  ibsRate: number; // Taxa IBS (ex: 0.25 para 25%)
  cbsRate: number; // Taxa CBS (ex: 0.08 para 8%)
  // Alíquotas anteriores (período de transição)
  icmsRate?: number;
  pisRate?: number;
  cofinsRate?: number;
}

export interface TaxCalculationResult {
  // Valores calculados
  baseCalculo: number;
  valorIbs: number;
  valorCbs: number;
  valorTotalImpostos: number;
  valorLiquido: number;
  
  // Impostos antigos (transição)
  valorIcms?: number;
  valorPis?: number;
  valorCofins?: number;
  valorImpostosAntigos?: number;
  
  // Detalhamento
  detalhamento: {
    aliquotaIbs: number;
    aliquotaCbs: number;
    aliquotaTotal: number;
  };
}

/**
 * Calcula os impostos IBS e CBS conforme a Reforma Tributária 2026
 * 
 * Fórmulas:
 * V_IBS = (V_servico - V_deducoes) × A_IBS
 * V_CBS = (V_servico - V_deducoes) × A_CBS
 * 
 * O cálculo é "por fora", ou seja, o imposto não compõe sua própria base de cálculo
 */
export function calculateTaxRTC(input: TaxCalculationInput): TaxCalculationResult {
  const {
    baseValue,
    deductions = 0,
    ibsRate,
    cbsRate,
    icmsRate = 0,
    pisRate = 0,
    cofinsRate = 0,
  } = input;

  // Base de cálculo = Valor base - Deduções
  const baseCalculo = Math.max(0, baseValue - deductions);

  // Cálculo IBS (Imposto sobre Bens e Serviços)
  const valorIbs = roundCurrency(baseCalculo * ibsRate);

  // Cálculo CBS (Contribuição sobre Bens e Serviços)
  const valorCbs = roundCurrency(baseCalculo * cbsRate);

  // Total de impostos novos
  const valorTotalImpostos = roundCurrency(valorIbs + valorCbs);

  // Valor líquido (base + impostos para cálculo por fora)
  const valorLiquido = roundCurrency(baseCalculo + valorTotalImpostos);

  // Impostos antigos (para período de transição)
  const valorIcms = roundCurrency(baseCalculo * icmsRate);
  const valorPis = roundCurrency(baseCalculo * pisRate);
  const valorCofins = roundCurrency(baseCalculo * cofinsRate);
  const valorImpostosAntigos = roundCurrency(valorIcms + valorPis + valorCofins);

  return {
    baseCalculo,
    valorIbs,
    valorCbs,
    valorTotalImpostos,
    valorLiquido,
    valorIcms,
    valorPis,
    valorCofins,
    valorImpostosAntigos,
    detalhamento: {
      aliquotaIbs: ibsRate * 100,
      aliquotaCbs: cbsRate * 100,
      aliquotaTotal: (ibsRate + cbsRate) * 100,
    },
  };
}

/**
 * Alíquotas padrão para 2026 (valores ilustrativos - consultar tabela oficial)
 */
export const DEFAULT_TAX_RATES_2026 = {
  // Alíquota IBS federal estimada
  IBS_RATE: 0.25,
  // Alíquota CBS federal estimada
  CBS_RATE: 0.08,
  // Total estimado
  TOTAL_RATE: 0.33,
  
  // Alíquotas anteriores (para transição)
  ICMS_DEFAULT: 0.18,
  PIS_DEFAULT: 0.0165,
  COFINS_DEFAULT: 0.076,
};

/**
 * Calcula o custo médio ponderado do estoque
 */
export function calculateWeightedAverageCost(
  currentStock: number,
  currentAvgCost: number,
  newQuantity: number,
  newUnitCost: number
): number {
  if (currentStock + newQuantity === 0) return 0;
  
  const totalValue = (currentStock * currentAvgCost) + (newQuantity * newUnitCost);
  const totalQuantity = currentStock + newQuantity;
  
  return roundCurrency(totalValue / totalQuantity);
}

/**
 * Calcula a margem de lucro
 */
export function calculateProfitMargin(salePrice: number, costPrice: number): number {
  if (salePrice === 0) return 0;
  return roundCurrency(((salePrice - costPrice) / salePrice) * 100);
}

/**
 * Calcula o markup
 */
export function calculateMarkup(salePrice: number, costPrice: number): number {
  if (costPrice === 0) return 0;
  return roundCurrency(((salePrice - costPrice) / costPrice) * 100);
}

/**
 * Arredonda para 2 casas decimais (padrão monetário)
 */
function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Valida CNPJ
 */
export function validateCNPJ(cnpj: string): boolean {
  // Remove caracteres não numéricos
  cnpj = cnpj.replace(/[^\d]/g, '');

  if (cnpj.length !== 14) return false;

  // Elimina CNPJs inválidos conhecidos
  if (/^(\d)\1+$/.test(cnpj)) return false;

  // Validação do primeiro dígito verificador
  let size = cnpj.length - 2;
  let numbers = cnpj.substring(0, size);
  const digits = cnpj.substring(size);
  let sum = 0;
  let pos = size - 7;

  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;

  // Validação do segundo dígito verificador
  size = size + 1;
  numbers = cnpj.substring(0, size);
  sum = 0;
  pos = size - 7;

  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) return false;

  return true;
}

/**
 * Valida CPF
 */
export function validateCPF(cpf: string): boolean {
  cpf = cpf.replace(/[^\d]/g, '');

  if (cpf.length !== 11) return false;
  if (/^(\d)\1+$/.test(cpf)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let result = (sum * 10) % 11;
  if (result === 10 || result === 11) result = 0;
  if (result !== parseInt(cpf.charAt(9))) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i);
  }
  result = (sum * 10) % 11;
  if (result === 10 || result === 11) result = 0;
  if (result !== parseInt(cpf.charAt(10))) return false;

  return true;
}

/**
 * Formata CNPJ
 */
export function formatCNPJ(cnpj: string): string {
  cnpj = cnpj.replace(/[^\d]/g, '');
  return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

/**
 * Formata CPF
 */
export function formatCPF(cpf: string): string {
  cpf = cpf.replace(/[^\d]/g, '');
  return cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
}

/**
 * Formata CEP
 */
export function formatCEP(cep: string): string {
  cep = cep.replace(/[^\d]/g, '');
  return cep.replace(/^(\d{5})(\d{3})$/, '$1-$2');
}

/**
 * Formata telefone
 */
export function formatPhone(phone: string): string {
  phone = phone.replace(/[^\d]/g, '');
  if (phone.length === 11) {
    return phone.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
  }
  return phone.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
}

/**
 * Gera número de venda com prefixo
 */
export function generateOrderNumber(prefix: string = 'VND'): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  
  return `${prefix}${year}${month}${day}${random}`;
}

/**
 * Calcula dias de garantia restantes
 */
export function calculateWarrantyDaysRemaining(warrantyExpiresAt: Date | null): number {
  if (!warrantyExpiresAt) return 0;
  
  const now = new Date();
  const diff = warrantyExpiresAt.getTime() - now.getTime();
  
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}
