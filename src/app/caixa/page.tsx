'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Modal } from '@/components/Modal';

interface Product {
  id: string;
  internalCode: string;
  barcode: string | null;
  name: string;
  salePrice: string;
  currentQuantity: number;
}

interface Customer {
  id: string;
  name: string;
  cpfCnpj: string | null;
  phone: string | null;
  email: string | null;
}

interface CartItem {
  id: string;
  type: 'product' | 'labor';
  product?: Product;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface PosSession {
  id: string;
  openedAt: string;
  openingBalance: string;
  cashSales: string;
  cardSales: string;
  pixSales: string;
  otherSales: string;
  status: string;
}

interface SaleReceipt {
  orderNumber: string;
  date: string;
  customer: Customer | null;
  items: CartItem[];
  subtotal: number;
  discount: number;
  laborTotal: number;
  warrantyTotal: number;
  total: number;
  warrantyMonths: number;
  paymentMethod: string;
  notes: string;
}

export default function PDV() {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<'cash' | 'credit_card' | 'debit_card' | 'pix'>('cash');
  const [discount, setDiscount] = useState(0);
  const [receivedAmount, setReceivedAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [session, setSession] = useState<PosSession | null>(null);
  const [showOpenCashier, setShowOpenCashier] = useState(false);
  const [showCloseCashier, setShowCloseCashier] = useState(false);
  const [openingBalance, setOpeningBalance] = useState('0');
  const [closingBalance, setClosingBalance] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Estados para finalização
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [addWarranty, setAddWarranty] = useState(false);
  const [warrantyMonths, setWarrantyMonths] = useState(3);
  const [warrantyPrice, setWarrantyPrice] = useState(0);
  const [notes, setNotes] = useState('');
  
  const [showLaborModal, setShowLaborModal] = useState(false);
  const [laborDescription, setLaborDescription] = useState('');
  const [laborPrice, setLaborPrice] = useState('');
  
  // Estados para controle de preço com margem
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState('');
  const [editingMarkup, setEditingMarkup] = useState('');
  
  // Estados para recibo
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receipt, setReceipt] = useState<SaleReceipt | null>(null);
  const [printSize, setPrintSize] = useState<'A4' | 'A5'>('A5');
  
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Funções para calcular preço com margem
  const calculatePriceFromMarkup = (basePrice: number, markup: string): string => {
    const markupValue = parseFloat(markup) || 0;
    if (basePrice <= 0) return '';
    const finalPrice = basePrice * (1 + markupValue / 100);
    return finalPrice.toFixed(2);
  };

  const calculateMarkupFromPrices = (basePrice: number, finalPrice: string): string => {
    const final = parseFloat(finalPrice) || 0;
    if (basePrice <= 0 || final <= 0) return '';
    const markup = ((final - basePrice) / basePrice) * 100;
    return markup.toFixed(2);
  };

  const startEditingPrice = (item: CartItem) => {
    setEditingItemId(item.id);
    setEditingPrice(item.unitPrice.toFixed(2));
    setEditingMarkup('');
  };

  const handleEditingPriceChange = (value: string) => {
    setEditingPrice(value);
    const item = cart.find(i => i.id === editingItemId);
    if (item && item.product) {
      const markup = calculateMarkupFromPrices(parseFloat(item.product.salePrice), value);
      setEditingMarkup(markup);
    }
  };

  const handleEditingMarkupChange = (value: string) => {
    setEditingMarkup(value);
    const item = cart.find(i => i.id === editingItemId);
    if (item && item.product) {
      const price = calculatePriceFromMarkup(parseFloat(item.product.salePrice), value);
      setEditingPrice(price);
    }
  };

  const savePriceEdit = () => {
    if (editingItemId && editingPrice) {
      updatePrice(editingItemId, parseFloat(editingPrice));
      setEditingItemId(null);
      setEditingPrice('');
      setEditingMarkup('');
    }
  };

  const cancelPriceEdit = () => {
    setEditingItemId(null);
    setEditingPrice('');
    setEditingMarkup('');
  };

  // Carregar produtos
  const fetchProducts = useCallback(async () => {
    try {
      const response = await fetch('/api/products');
      if (response.ok) {
        const data = await response.json();
        setProducts(data.filter((p: Product) => p.currentQuantity > 0));
      }
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
    }
  }, []);

  // Carregar clientes
  const fetchCustomers = useCallback(async () => {
    try {
      const response = await fetch('/api/customers?active=true');
      if (response.ok) {
        const data = await response.json();
        setCustomers(data.customers || data || []);
      }
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
    }
  }, []);

  // Verificar sessão de caixa ativa
  const checkSession = useCallback(async () => {
    try {
      const response = await fetch('/api/pos/sessions?active=true');
      if (response.ok) {
        const data = await response.json();
        if (data.sessions && data.sessions.length > 0) {
          setSession(data.sessions[0]);
        } else {
          setShowOpenCashier(true);
        }
      }
    } catch (error) {
      console.error('Erro ao verificar sessão:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchCustomers();
    checkSession();
  }, [fetchProducts, fetchCustomers, checkSession]);

  // Foco no input de busca
  useEffect(() => {
    if (session && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [session]);

  // Filtrar produtos
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.internalCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.barcode && product.barcode.includes(searchTerm))
  );

  // Filtrar clientes
  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    (customer.cpfCnpj && customer.cpfCnpj.includes(customerSearch))
  );

  // Adicionar ao carrinho
  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.type === 'product' && item.product?.id === product.id);
    
    if (existingItem) {
      const currentQty = existingItem.quantity;
      
      if (currentQty >= product.currentQuantity) {
        toast.error('Quantidade máxima atingida');
        return;
      }
      
      setCart(cart.map(item => 
        item.id === existingItem.id 
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.unitPrice }
          : item
      ));
    } else {
      const unitPrice = parseFloat(product.salePrice);
      setCart([...cart, {
        id: crypto.randomUUID(),
        type: 'product',
        product,
        description: product.name,
        quantity: 1,
        unitPrice,
        total: unitPrice,
      }]);
    }
    
    setSearchTerm('');
    searchInputRef.current?.focus();
  };

  // Adicionar mão de obra
  const addLabor = () => {
    if (!laborDescription || !laborPrice) {
      toast.error('Preencha a descrição e o valor');
      return;
    }

    const newItem: CartItem = {
      id: crypto.randomUUID(),
      type: 'labor',
      description: laborDescription,
      quantity: 1,
      unitPrice: parseFloat(laborPrice),
      total: parseFloat(laborPrice),
    };

    setCart([...cart, newItem]);
    setLaborDescription('');
    setLaborPrice('');
    setShowLaborModal(false);
    toast.success('Mão de obra adicionada');
  };

  // Atualizar quantidade
  const updateQuantity = (id: string, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(id);
      return;
    }
    
    const item = cart.find(i => i.id === id);
    if (!item) return;
    
    if (item.type === 'product' && item.product && newQty > item.product.currentQuantity) {
      toast.error('Quantidade maior que o estoque disponível');
      return;
    }
    
    setCart(cart.map(i => 
      i.id === id 
        ? { ...i, quantity: newQty, total: newQty * i.unitPrice }
        : i
    ));
  };

  // Atualizar preço
  const updatePrice = (id: string, newPrice: number) => {
    setCart(cart.map(i => 
      i.id === id 
        ? { ...i, unitPrice: newPrice, total: i.quantity * newPrice }
        : i
    ));
  };

  // Remover do carrinho
  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  // Limpar carrinho
  const clearCart = () => {
    setCart([]);
    setDiscount(0);
    setReceivedAmount('');
    setSelectedCustomer(null);
    setAddWarranty(false);
    setWarrantyMonths(3);
    setWarrantyPrice(0);
    setNotes('');
    searchInputRef.current?.focus();
  };

  // Calcular totais
  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const laborTotal = cart.filter(i => i.type === 'labor').reduce((sum, i) => sum + i.total, 0);
  const productsTotal = cart.filter(i => i.type === 'product').reduce((sum, i) => sum + i.total, 0);
  const total = subtotal - discount + (addWarranty ? warrantyPrice : 0);
  const change = selectedPayment === 'cash' ? parseFloat(receivedAmount || '0') - total : 0;

  // Abrir modal de finalização
  const openFinishModal = () => {
    if (cart.length === 0) {
      toast.error('Adicione itens ao carrinho');
      return;
    }
    setShowFinishModal(true);
  };

  // Labels de pagamento
  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: 'Dinheiro',
      credit_card: 'Cartão de Crédito',
      debit_card: 'Cartão de Débito',
      pix: 'PIX',
    };
    return labels[method] || method;
  };

  // Processar venda
  const processSale = async () => {
    if (cart.length === 0) {
      toast.error('Adicione itens ao carrinho');
      return;
    }

    if (selectedPayment === 'cash' && parseFloat(receivedAmount || '0') < total) {
      toast.error('Valor recebido insuficiente');
      return;
    }

    setIsProcessing(true);
    try {
      const productItems = cart.filter(i => i.type === 'product');
      
      const response = await fetch('/api/sales-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          posSessionId: session?.id,
          customerId: selectedCustomer?.id,
          items: productItems.map(item => ({
            productId: item.product?.id,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
          laborItems: cart.filter(i => i.type === 'labor').map(item => ({
            description: item.description,
            price: item.unitPrice,
          })),
          discount,
          warrantyMonths: addWarranty ? warrantyMonths : 0,
          warrantyPrice: addWarranty ? warrantyPrice : 0,
          paymentMethod: selectedPayment,
          notes,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const orderNumber = data.orderNumber || `PDV${Date.now().toString().slice(-8)}`;
        
        const newReceipt: SaleReceipt = {
          orderNumber,
          date: new Date().toLocaleString('pt-BR'),
          customer: selectedCustomer,
          items: cart,
          subtotal,
          discount,
          laborTotal,
          warrantyTotal: addWarranty ? warrantyPrice : 0,
          total,
          warrantyMonths: addWarranty ? warrantyMonths : 0,
          paymentMethod: getPaymentMethodLabel(selectedPayment),
          notes,
        };

        setReceipt(newReceipt);
        setShowFinishModal(false);
        setShowReceiptModal(true);
        
        toast.success(`Venda ${orderNumber} realizada com sucesso!`);
        clearCart();
        fetchProducts();
        checkSession();
      } else {
        toast.error(data.error || 'Erro ao processar venda');
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao processar venda');
    } finally {
      setIsProcessing(false);
    }
  };

  // Imprimir recibo
  const printReceipt = () => {
    if (!receipt) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const pageWidth = printSize === 'A5' ? '148mm' : '210mm';
    const pageHeight = printSize === 'A5' ? '210mm' : '297mm';
    const fontSize = printSize === 'A5' ? '10pt' : '12pt';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Declaração de Venda - ${receipt.orderNumber}</title>
        <style>
          @page { size: ${pageWidth} ${pageHeight}; margin: 10mm; }
          body { font-family: Arial, sans-serif; font-size: ${fontSize}; margin: 0; padding: 15px; }
          .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
          .header h1 { margin: 0; font-size: 1.5em; }
          .header p { margin: 5px 0; color: #666; }
          .info-row { display: flex; justify-content: space-between; margin: 5px 0; }
          .section { margin: 15px 0; }
          .section-title { font-weight: bold; margin-bottom: 10px; padding: 5px; background: #f0f0f0; }
          table { width: 100%; border-collapse: collapse; margin: 10px 0; }
          th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background: #f5f5f5; }
          .text-right { text-align: right; }
          .total-row { font-weight: bold; font-size: 1.2em; background: #e8f5e9; }
          .warranty-box { border: 1px solid #333; padding: 10px; margin: 15px 0; background: #fffde7; }
          .footer { margin-top: 30px; text-align: center; font-size: 0.9em; color: #666; }
          .signature { margin-top: 40px; border-top: 1px solid #333; padding-top: 5px; width: 200px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>DECLARAÇÃO DE VENDA</h1>
          <p>Nº ${receipt.orderNumber}</p>
          <p>${receipt.date}</p>
        </div>

        ${receipt.customer ? `
          <div class="section">
            <div class="section-title">CLIENTE</div>
            <div class="info-row"><span>Nome:</span><span>${receipt.customer.name}</span></div>
            ${receipt.customer.cpfCnpj ? `<div class="info-row"><span>CPF/CNPJ:</span><span>${receipt.customer.cpfCnpj}</span></div>` : ''}
            ${receipt.customer.phone ? `<div class="info-row"><span>Telefone:</span><span>${receipt.customer.phone}</span></div>` : ''}
          </div>
        ` : ''}

        <div class="section">
          <div class="section-title">ITENS</div>
          <table>
            <thead>
              <tr>
                <th>Descrição</th>
                <th class="text-right">Qtd</th>
                <th class="text-right">Valor Unit.</th>
                <th class="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${receipt.items.map(item => `
                <tr>
                  <td>${item.description}${item.type === 'labor' ? ' (Mão de Obra)' : ''}</td>
                  <td class="text-right">${item.quantity}</td>
                  <td class="text-right">R$ ${item.unitPrice.toFixed(2)}</td>
                  <td class="text-right">R$ ${item.total.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="section">
          <div class="section-title">RESUMO</div>
          <div class="info-row"><span>Subtotal:</span><span>R$ ${receipt.subtotal.toFixed(2)}</span></div>
          ${receipt.discount > 0 ? `<div class="info-row"><span>Desconto:</span><span>- R$ ${receipt.discount.toFixed(2)}</span></div>` : ''}
          ${receipt.warrantyTotal > 0 ? `<div class="info-row"><span>Garantia (${receipt.warrantyMonths} meses):</span><span>R$ ${receipt.warrantyTotal.toFixed(2)}</span></div>` : ''}
          <div class="info-row total-row"><span>TOTAL:</span><span>R$ ${receipt.total.toFixed(2)}</span></div>
          <div class="info-row"><span>Forma de Pagamento:</span><span>${receipt.paymentMethod}</span></div>
        </div>

        ${receipt.warrantyMonths > 0 ? `
          <div class="warranty-box">
            <strong>⚠️ TERMO DE GARANTIA</strong><br>
            Este produto/serviço possui garantia de <strong>${receipt.warrantyMonths} meses</strong> 
            a partir da data de emissão deste documento.<br>
            A garantia cobre defeitos de fabricação e mão de obra, não incluindo mau uso ou danos externos.
          </div>
        ` : ''}

        ${receipt.notes ? `
          <div class="section">
            <div class="section-title">OBSERVAÇÕES</div>
            <p>${receipt.notes}</p>
          </div>
        ` : ''}

        <div class="footer">
          <div class="signature">
            Assinatura do Cliente
          </div>
          <p style="margin-top: 20px;">Obrigado pela preferência!</p>
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.print();
  };

  // Abrir caixa
  const openCashier = async () => {
    try {
      const response = await fetch('/api/pos/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'default-user',
          openingBalance: parseFloat(openingBalance) || 0,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Caixa aberto com sucesso!');
        setShowOpenCashier(false);
        checkSession();
      } else {
        toast.error(data.error || 'Erro ao abrir caixa');
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao abrir caixa');
    }
  };

  // Fechar caixa
  const closeCashier = async () => {
    if (!session) return;

    try {
      const response = await fetch(`/api/pos/sessions/${session.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          closingBalance: parseFloat(closingBalance) || 0,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Caixa fechado com sucesso!');
        setShowCloseCashier(false);
        setSession(null);
        setShowOpenCashier(true);
      } else {
        toast.error(data.error || 'Erro ao fechar caixa');
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao fechar caixa');
    }
  };

  // Calcular totais da sessão
  const sessionTotal = session ? 
    parseFloat(session.cashSales || '0') + 
    parseFloat(session.cardSales || '0') + 
    parseFloat(session.pixSales || '0') + 
    parseFloat(session.otherSales || '0') : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      <Toaster position="top-right" />

      {/* Header do PDV */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">PDV - Ponto de Venda</h1>
          {session && (
            <p className="text-sm text-muted-foreground">
              Caixa aberto às {new Date(session.openedAt).toLocaleTimeString('pt-BR')} | 
              Total: R$ {sessionTotal.toFixed(2)}
            </p>
          )}
        </div>
        {session && (
          <Button variant="secondary" onClick={() => setShowCloseCashier(true)}>
            Fechar Caixa
          </Button>
        )}
      </div>

      {/* Área principal */}
      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* Lista de Produtos */}
        <div className="flex-1 flex flex-col bg-level-1 rounded-lg shadow overflow-hidden">
          {/* Busca */}
          <div className="p-4 border-b border-border">
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por código, código de barras ou nome..."
              className="w-full px-4 py-3 text-lg border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={!session}
            />
          </div>

          {/* Grid de Produtos */}
          <div className="flex-1 p-4 overflow-y-auto">
            {searchTerm.length < 1 ? (
              <div className="text-center text-muted-foreground py-8">
                Digite pelo menos 1 caractere para buscar produtos
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                Nenhum produto encontrado
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {filteredProducts.slice(0, 20).map((product) => (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="p-4 bg-level-2 rounded-lg text-left hover:bg-primary/10 transition-colors border border-transparent hover:border-primary"
                  >
                    <div className="font-medium text-foreground truncate">
                      {product.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {product.internalCode}
                    </div>
                    <div className="mt-2 flex justify-between items-center">
                      <span className="text-lg font-bold text-primary">
                        R$ {parseFloat(product.salePrice).toFixed(2)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Estq: {product.currentQuantity}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Carrinho */}
        <div className="w-96 flex flex-col bg-level-1 rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b border-border flex justify-between items-center">
            <h2 className="text-lg font-semibold text-foreground">
              Carrinho ({cart.length})
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowLaborModal(true)}
                className="text-sm text-primary hover:text-primary/80"
              >
                + Mão de Obra
              </button>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-sm text-error hover:text-error/80"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>

          {/* Itens do Carrinho */}
          <div className="flex-1 overflow-y-auto p-2">
            {cart.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                Carrinho vazio
              </div>
            ) : (
              <div className="space-y-2">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-level-2 rounded-lg"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="font-medium text-foreground text-sm">
                            {item.description}
                          </div>
                          {item.type === 'labor' && (
                            <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded">MO</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">R$</span>
                          {editingItemId === item.id ? (
                            <div className="flex gap-1">
                              <input
                                type="number"
                                step="0.01"
                                value={editingPrice}
                                onChange={(e) => handleEditingPriceChange(e.target.value)}
                                className="w-16 px-1 py-0.5 text-xs border border-border rounded bg-background text-foreground"
                                autoFocus
                              />
                              <input
                                type="number"
                                step="0.01"
                                value={editingMarkup}
                                onChange={(e) => handleEditingMarkupChange(e.target.value)}
                                placeholder="%"
                                className="w-12 px-1 py-0.5 text-xs border border-border rounded bg-background text-foreground"
                              />
                              <button
                                onClick={savePriceEdit}
                                className="text-xs text-success hover:text-success/80"
                              >
                                ✓
                              </button>
                              <button
                                onClick={cancelPriceEdit}
                                className="text-xs text-error hover:text-error/80"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => startEditingPrice(item)}
                              className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                            >
                              {item.unitPrice.toFixed(2)}
                            </button>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-error hover:text-error/80 ml-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center bg-level-3 rounded text-foreground hover:bg-level-3/80"
                        >
                          -
                        </button>
                        <span className="w-8 text-center text-foreground">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center bg-level-3 rounded text-foreground hover:bg-level-3/80"
                        >
                          +
                        </button>
                      </div>
                      <span className="font-bold text-foreground">
                        R$ {item.total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Totais e Pagamento */}
          <div className="border-t border-border p-4 space-y-4">
            {/* Subtotal e Desconto */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Produtos:</span>
                <span>R$ {productsTotal.toFixed(2)}</span>
              </div>
              {laborTotal > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Mão de Obra:</span>
                  <span>R$ {laborTotal.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal:</span>
                <span>R$ {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Desconto:</span>
                <input
                  type="number"
                  value={discount || ''}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  className="w-24 px-2 py-1 text-right border border-border rounded bg-background text-foreground"
                  min="0"
                  max={subtotal}
                />
              </div>
              <div className="flex justify-between text-lg font-bold text-foreground pt-2 border-t border-border">
                <span>Total:</span>
                <span className="text-success">R$ {total.toFixed(2)}</span>
              </div>
            </div>

            {/* Forma de Pagamento */}
            <div className="grid grid-cols-4 gap-1">
              {[
                { value: 'cash', label: 'Dinheiro', icon: '💵' },
                { value: 'credit_card', label: 'Crédito', icon: '💳' },
                { value: 'debit_card', label: 'Débito', icon: '💳' },
                { value: 'pix', label: 'PIX', icon: '📱' },
              ].map((method) => (
                <button
                  key={method.value}
                  onClick={() => setSelectedPayment(method.value as typeof selectedPayment)}
                  className={`p-2 rounded text-xs text-center transition-colors ${
                    selectedPayment === method.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-level-2 text-foreground hover:bg-level-3'
                  }`}
                >
                  <div className="text-lg">{method.icon}</div>
                  <div>{method.label}</div>
                </button>
              ))}
            </div>

            {/* Valor Recebido (para dinheiro) */}
            {selectedPayment === 'cash' && (
              <div className="space-y-2">
                <Input
                  label="Valor Recebido"
                  type="number"
                  value={receivedAmount}
                  onChange={(e) => setReceivedAmount(e.target.value)}
                  min={total}
                  step="0.01"
                />
                {change > 0 && (
                  <div className="text-right text-success font-bold">
                    Troco: R$ {change.toFixed(2)}
                  </div>
                )}
              </div>
            )}

            {/* Botão Finalizar */}
            <Button
              onClick={openFinishModal}
              disabled={isProcessing || cart.length === 0 || !session}
              className="w-full py-4 text-lg"
            >
              {isProcessing ? 'Processando...' : `Finalizar Venda - R$ ${total.toFixed(2)}`}
            </Button>
          </div>
        </div>
      </div>

      {/* Modal de Mão de Obra */}
      <Modal
        isOpen={showLaborModal}
        onClose={() => setShowLaborModal(false)}
        title="Adicionar Mão de Obra"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Descrição do Serviço"
            value={laborDescription}
            onChange={(e) => setLaborDescription(e.target.value)}
            placeholder="Ex: Instalação de peça, troca de óleo..."
          />
          <Input
            label="Valor (R$)"
            type="number"
            step="0.01"
            value={laborPrice}
            onChange={(e) => setLaborPrice(e.target.value)}
            placeholder="0.00"
          />
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setShowLaborModal(false)} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={addLabor} className="flex-1">
              Adicionar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de Finalização */}
      <Modal
        isOpen={showFinishModal}
        onClose={() => setShowFinishModal(false)}
        title="Finalizar Venda"
        size="lg"
      >
        <div className="space-y-6">
          {/* Selecionar Cliente */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Cliente (opcional)
            </label>
            <Input
              placeholder="Buscar cliente por nome ou CPF/CNPJ..."
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
            />
            {customerSearch && filteredCustomers.length > 0 && (
              <div className="max-h-32 overflow-y-auto border border-border rounded-lg mt-2 bg-level-2">
                {filteredCustomers.map((customer) => (
                  <div
                    key={customer.id}
                    onClick={() => {
                      setSelectedCustomer(customer);
                      setCustomerSearch('');
                    }}
                    className="p-2 hover:bg-level-3 cursor-pointer border-b border-border last:border-b-0"
                  >
                    <span className="font-medium">{customer.name}</span>
                    {customer.cpfCnpj && <span className="text-sm text-muted-foreground ml-2">({customer.cpfCnpj})</span>}
                  </div>
                ))}
              </div>
            )}
            {selectedCustomer && (
              <div className="mt-2 p-2 bg-info/10 rounded-lg flex justify-between items-center">
                <span>{selectedCustomer.name}</span>
                <button onClick={() => setSelectedCustomer(null)} className="text-error">✕</button>
              </div>
            )}
          </div>

          {/* Garantia */}
          <div className="border border-border rounded-lg p-4 bg-level-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={addWarranty}
                onChange={(e) => setAddWarranty(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="font-medium text-foreground">Adicionar Garantia</span>
            </label>
            {addWarranty && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                <Input
                  label="Meses de Garantia"
                  type="number"
                  min="1"
                  value={warrantyMonths.toString()}
                  onChange={(e) => setWarrantyMonths(parseInt(e.target.value) || 1)}
                />
                <Input
                  label="Valor da Garantia (R$)"
                  type="number"
                  step="0.01"
                  value={warrantyPrice.toString()}
                  onChange={(e) => setWarrantyPrice(parseFloat(e.target.value) || 0)}
                />
              </div>
            )}
          </div>

          {/* Observações */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Observações</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              rows={3}
              placeholder="Observações sobre a venda..."
            />
          </div>

          {/* Resumo */}
          <div className="bg-level-2 rounded-lg p-4 space-y-2">
            <div className="flex justify-between"><span>Subtotal:</span><span>R$ {subtotal.toFixed(2)}</span></div>
            {discount > 0 && <div className="flex justify-between text-error"><span>Desconto:</span><span>- R$ {discount.toFixed(2)}</span></div>}
            {addWarranty && warrantyPrice > 0 && <div className="flex justify-between"><span>Garantia ({warrantyMonths} meses):</span><span>R$ {warrantyPrice.toFixed(2)}</span></div>}
            <div className="flex justify-between text-xl font-bold pt-2 border-t border-border">
              <span>Total:</span>
              <span className="text-success">R$ {total.toFixed(2)}</span>
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setShowFinishModal(false)} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={processSale} disabled={isProcessing} className="flex-1">
              {isProcessing ? 'Processando...' : 'Confirmar Venda'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de Recibo */}
      <Modal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        title="Venda Realizada!"
        size="md"
      >
        {receipt && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-4xl mb-2">✅</div>
              <h3 className="text-xl font-bold text-foreground">Venda #{receipt.orderNumber}</h3>
              <p className="text-muted-foreground">{receipt.date}</p>
              <p className="text-2xl font-bold text-success mt-2">R$ {receipt.total.toFixed(2)}</p>
            </div>

            <div className="border-t border-border pt-4">
              <label className="block text-sm font-medium text-foreground mb-2">
                Tamanho da Impressão
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={printSize === 'A5'}
                    onChange={() => setPrintSize('A5')}
                    className="w-4 h-4"
                  />
                  <span>A5 (Padrão)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={printSize === 'A4'}
                    onChange={() => setPrintSize('A4')}
                    className="w-4 h-4"
                  />
                  <span>A4</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setShowReceiptModal(false)} className="flex-1">
                Fechar
              </Button>
              <Button onClick={printReceipt} className="flex-1">
                🖨️ Imprimir Declaração
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Abrir Caixa */}
      <Modal
        isOpen={showOpenCashier}
        onClose={() => {}}
        title="Abrir Caixa"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Informe o valor em caixa para iniciar as operações.
          </p>
          <Input
            label="Valor Inicial (R$)"
            type="number"
            value={openingBalance}
            onChange={(e) => setOpeningBalance(e.target.value)}
            min="0"
            step="0.01"
          />
          <Button onClick={openCashier} className="w-full">
            Abrir Caixa
          </Button>
        </div>
      </Modal>

      {/* Modal Fechar Caixa */}
      <Modal
        isOpen={showCloseCashier}
        onClose={() => setShowCloseCashier(false)}
        title="Fechar Caixa"
        size="sm"
      >
        <div className="space-y-4">
          {session && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Abertura:</span>
                <span className="text-foreground">R$ {parseFloat(session.openingBalance).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vendas Dinheiro:</span>
                <span className="text-foreground">R$ {parseFloat(session.cashSales || '0').toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vendas Cartão:</span>
                <span className="text-foreground">R$ {parseFloat(session.cardSales || '0').toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vendas PIX:</span>
                <span className="text-foreground">R$ {parseFloat(session.pixSales || '0').toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold pt-2 border-t border-border">
                <span>Total Vendas:</span>
                <span>R$ {sessionTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-success">
                <span>Esperado em Caixa:</span>
                <span>R$ {(parseFloat(session.openingBalance) + parseFloat(session.cashSales || '0')).toFixed(2)}</span>
              </div>
            </div>
          )}
          <Input
            label="Valor em Caixa (R$)"
            type="number"
            value={closingBalance}
            onChange={(e) => setClosingBalance(e.target.value)}
            min="0"
            step="0.01"
          />
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setShowCloseCashier(false)} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={closeCashier} className="flex-1">
              Fechar Caixa
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
