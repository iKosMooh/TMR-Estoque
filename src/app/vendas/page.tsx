'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Modal } from '@/components/Modal';
import toast, { Toaster } from 'react-hot-toast';

interface Product {
  id: string;
  internalCode: string;
  barcode: string | null;
  name: string;
  salePrice: string;
  currentQuantity: number;
  lowStockThreshold: number;
}

interface Customer {
  id: string;
  name: string;
  cpfCnpj: string | null;
  phone: string | null;
  email: string | null;
}

interface ServiceOrder {
  id: string;
  orderNumber: string;
  title: string;
  status: string;
  customerName: string;
  customerId: string;
}

interface SaleItem {
  id: string;
  type: 'product' | 'labor' | 'warranty';
  product?: Product;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface SaleReceipt {
  orderNumber: string;
  date: string;
  customer: Customer | null;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  laborTotal: number;
  warrantyTotal: number;
  total: number;
  warrantyMonths: number;
  paymentMethod: string;
  notes: string;
}

export default function Vendas() {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [customPrice, setCustomPrice] = useState('');
  const [customMarkup, setCustomMarkup] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Estados para finalização
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedServiceOrder, setSelectedServiceOrder] = useState<ServiceOrder | null>(null);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit_card' | 'debit_card' | 'pix' | 'boleto'>('cash');
  const [addWarranty, setAddWarranty] = useState(false);
  const [warrantyMonths, setWarrantyMonths] = useState(3);
  const [warrantyPrice, setWarrantyPrice] = useState(0);
  const [notes, setNotes] = useState('');
  
  // Estados para mão de obra
  const [showLaborModal, setShowLaborModal] = useState(false);
  const [laborDescription, setLaborDescription] = useState('');
  const [laborPrice, setLaborPrice] = useState('');
  
  // Estados para recibo
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receipt, setReceipt] = useState<SaleReceipt | null>(null);
  const [printSize, setPrintSize] = useState<'A4' | 'A5'>('A5');
  
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Funções para calcular preço com margem
  const calculatePriceFromMarkup = (basePrice: string, markup: string): string => {
    const base = parseFloat(basePrice) || 0;
    const markupValue = parseFloat(markup) || 0;
    if (base <= 0) return '';
    const finalPrice = base * (1 + markupValue / 100);
    return finalPrice.toFixed(2);
  };

  const calculateMarkupFromPrices = (basePrice: string, finalPrice: string): string => {
    const base = parseFloat(basePrice) || 0;
    const final = parseFloat(finalPrice) || 0;
    if (base <= 0 || final <= 0) return '';
    const markup = ((final - base) / base) * 100;
    return markup.toFixed(2);
  };

  const handleCustomPriceChange = (value: string) => {
    setCustomPrice(value);
    // Recalcula a margem baseada no preço
    if (selectedProduct) {
      const markup = calculateMarkupFromPrices(selectedProduct.salePrice, value);
      setCustomMarkup(markup);
    }
  };

  const handleCustomMarkupChange = (value: string) => {
    setCustomMarkup(value);
    // Recalcula o preço baseado na margem
    if (selectedProduct) {
      const price = calculatePriceFromMarkup(selectedProduct.salePrice, value);
      setCustomPrice(price);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCustomers();
    fetchServiceOrders();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      if (response.ok) {
        const data = await response.json();
        setProducts(data.filter((p: Product) => p.currentQuantity > 0));
      }
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers?active=true');
      if (response.ok) {
        const data = await response.json();
        setCustomers(data.customers || data || []);
      }
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
    }
  };

  const fetchServiceOrders = async () => {
    try {
      // Buscar todas as OS (exceto canceladas e entregues)
      const response = await fetch('/api/service-orders');
      if (response.ok) {
        const data = await response.json();
        // Filtrar OS que podem ser vinculadas a vendas (todas exceto canceladas e entregues)
        const ordersForBilling = (data.orders || []).filter(
          (order: ServiceOrder) => order.status !== 'cancelled' && order.status !== 'delivered'
        );
        setServiceOrders(ordersForBilling);
      }
    } catch (error) {
      console.error('Erro ao buscar ordens de serviço:', error);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.internalCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.barcode && product.barcode.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    (customer.cpfCnpj && customer.cpfCnpj.includes(customerSearch)) ||
    (customer.phone && customer.phone.includes(customerSearch))
  );

  const filteredServiceOrders = serviceOrders.filter(order =>
    order.orderNumber.toLowerCase().includes(orderSearch.toLowerCase()) ||
    order.title.toLowerCase().includes(orderSearch.toLowerCase()) ||
    order.customerName.toLowerCase().includes(orderSearch.toLowerCase())
  );

  const addToSale = () => {
    if (!selectedProduct || quantity <= 0) return;

    if (quantity > selectedProduct.currentQuantity) {
      toast.error('Quantidade insuficiente em estoque!');
      return;
    }

    // Usa preço personalizado se definido, senão usa o preço base do produto
    const unitPrice = customPrice ? parseFloat(customPrice) : parseFloat(selectedProduct.salePrice);
    const total = unitPrice * quantity;

    const newItem: SaleItem = {
      id: crypto.randomUUID(),
      type: 'product',
      product: selectedProduct,
      description: selectedProduct.name,
      quantity,
      unitPrice,
      total,
    };

    setSaleItems([...saleItems, newItem]);
    setSelectedProduct(null);
    setQuantity(1);
    setCustomPrice('');
    setCustomMarkup('');
    setSearchTerm('');
    searchInputRef.current?.focus();
    toast.success('Produto adicionado');
  };

  const addLabor = () => {
    if (!laborDescription || !laborPrice) {
      toast.error('Preencha a descrição e o valor');
      return;
    }

    const newItem: SaleItem = {
      id: crypto.randomUUID(),
      type: 'labor',
      description: laborDescription,
      quantity: 1,
      unitPrice: parseFloat(laborPrice),
      total: parseFloat(laborPrice),
    };

    setSaleItems([...saleItems, newItem]);
    setLaborDescription('');
    setLaborPrice('');
    setShowLaborModal(false);
    toast.success('Mão de obra adicionada');
  };

  const updateItemPrice = (id: string, newPrice: number) => {
    setSaleItems(saleItems.map(item => {
      if (item.id === id) {
        return { ...item, unitPrice: newPrice, total: newPrice * item.quantity };
      }
      return item;
    }));
  };

  const updateItemQuantity = (id: string, newQty: number) => {
    if (newQty <= 0) {
      removeFromSale(id);
      return;
    }

    setSaleItems(saleItems.map(item => {
      if (item.id === id) {
        if (item.type === 'product' && item.product && newQty > item.product.currentQuantity) {
          toast.error('Quantidade maior que o estoque');
          return item;
        }
        return { ...item, quantity: newQty, total: item.unitPrice * newQty };
      }
      return item;
    }));
  };

  const removeFromSale = (id: string) => {
    setSaleItems(saleItems.filter(item => item.id !== id));
  };

  const getSubtotal = () => saleItems.reduce((sum, item) => sum + item.total, 0);
  const getLaborTotal = () => saleItems.filter(i => i.type === 'labor').reduce((sum, i) => sum + i.total, 0);
  const getProductsTotal = () => saleItems.filter(i => i.type === 'product').reduce((sum, i) => sum + i.total, 0);
  const getTotalWithExtras = () => getSubtotal() - discount + (addWarranty ? warrantyPrice : 0);

  const openFinishModal = () => {
    if (saleItems.length === 0) {
      toast.error('Adicione itens à venda');
      return;
    }
    setShowFinishModal(true);
  };

  const processSale = async () => {
    if (saleItems.length === 0) return;

    setIsProcessing(true);
    try {
      const productItems = saleItems.filter(i => i.type === 'product');
      
      const promises = productItems.map(item =>
        fetch('/api/sales', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: item.product?.id,
            quantitySold: item.quantity,
            unitPrice: item.unitPrice,
          }),
        })
      );

      const results = await Promise.all(promises);
      const failures = results.filter(r => !r.ok);

      if (failures.length === 0) {
        const orderNumber = `V${Date.now().toString().slice(-8)}`;
        
        const newReceipt: SaleReceipt = {
          orderNumber,
          date: new Date().toLocaleString('pt-BR'),
          customer: selectedCustomer,
          items: saleItems,
          subtotal: getSubtotal(),
          discount,
          laborTotal: getLaborTotal(),
          warrantyTotal: addWarranty ? warrantyPrice : 0,
          total: getTotalWithExtras(),
          warrantyMonths: addWarranty ? warrantyMonths : 0,
          paymentMethod: getPaymentMethodLabel(paymentMethod),
          notes,
        };

        setReceipt(newReceipt);
        setShowFinishModal(false);
        setShowReceiptModal(true);
        
        // Limpar após venda
        setSaleItems([]);
        setSelectedCustomer(null);
        setDiscount(0);
        setAddWarranty(false);
        setWarrantyMonths(3);
        setWarrantyPrice(0);
        setNotes('');
        fetchProducts();
        
        toast.success('Venda realizada com sucesso!');
      } else {
        toast.error('Erro ao processar algumas vendas. Verifique o estoque.');
      }
    } catch (error) {
      console.error('Erro ao processar venda:', error);
      toast.error('Erro ao processar venda.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: 'Dinheiro',
      credit_card: 'Cartão de Crédito',
      debit_card: 'Cartão de Débito',
      pix: 'PIX',
      boleto: 'Boleto',
    };
    return labels[method] || method;
  };

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

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <Toaster position="top-right" />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-foreground mb-6">Registro de Vendas</h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Lado esquerdo - Busca e adição */}
            <div className="space-y-4">
              {/* Buscar Produto */}
              <Card className="bg-level-1">
                <Card.Header>
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-medium text-card-foreground">Buscar Produto</h2>
                    <Button variant="secondary" size="sm" onClick={() => setShowLaborModal(true)}>
                      + Mão de Obra
                    </Button>
                  </div>
                </Card.Header>
                <Card.Body>
                  <Input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Digite nome, código interno ou código de barras..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />

                  {searchTerm && (
                    <div className="max-h-60 overflow-y-auto border border-border rounded-lg bg-level-2 mt-2">
                      {filteredProducts.length === 0 ? (
                        <p className="p-4 text-muted-foreground text-center">Nenhum produto encontrado</p>
                      ) : (
                        filteredProducts.map((product) => (
                          <div
                            key={product.id}
                            onClick={() => {
                              setSelectedProduct(product);
                              setCustomPrice(product.salePrice);
                              setCustomMarkup('');
                              setSearchTerm('');
                            }}
                            className="p-3 hover:bg-level-3 cursor-pointer border-b border-border last:border-b-0 transition-colors"
                          >
                            <div className="font-medium text-foreground">{product.name}</div>
                            <div className="text-sm text-muted-foreground">
                              Código: {product.internalCode} | Estoque: {product.currentQuantity} |
                              Preço: R$ {parseFloat(product.salePrice).toFixed(2)}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {selectedProduct && (
                    <div className="bg-info/10 border border-info/20 p-4 rounded-lg mt-4">
                      <h3 className="font-medium text-info mb-2">Produto Selecionado:</h3>
                      <p className="text-foreground font-semibold">{selectedProduct.name}</p>
                      <p className="text-sm text-muted-foreground mb-3">
                        Preço sugerido: R$ {parseFloat(selectedProduct.salePrice).toFixed(2)} |
                        Estoque: {selectedProduct.currentQuantity}
                      </p>

                      <div className="grid grid-cols-3 gap-3">
                        <Input
                          type="number"
                          min="1"
                          max={selectedProduct.currentQuantity}
                          value={quantity.toString()}
                          onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                          label="Quantidade"
                        />
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1">Preço Unitário</label>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="number"
                              step="0.01"
                              value={customPrice}
                              onChange={(e) => handleCustomPriceChange(e.target.value)}
                              placeholder={selectedProduct.salePrice}
                              className="px-3 py-2 border border-input rounded-md shadow-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                            />
                            <div className="relative">
                              <input
                                type="number"
                                step="0.01"
                                value={customMarkup}
                                onChange={(e) => handleCustomMarkupChange(e.target.value)}
                                placeholder="0.00"
                                className="w-full px-3 py-2 pr-8 border border-input rounded-md shadow-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                              />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Valor ou margem sobre o preço base
                          </p>
                        </div>
                        <div className="flex items-end">
                          <Button onClick={addToSale} variant="success" className="w-full">
                            Adicionar
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </div>

            {/* Lado direito - Carrinho */}
            <div>
              <Card className="bg-level-1">
                <Card.Header>
                  <h2 className="text-lg font-medium text-card-foreground">
                    Itens da Venda ({saleItems.length})
                  </h2>
                </Card.Header>
                <Card.Body>
                  {saleItems.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">Nenhum item adicionado</p>
                  ) : (
                    <div className="space-y-3 mb-6 max-h-[400px] overflow-y-auto">
                      {saleItems.map((item) => (
                        <div key={item.id} className="flex justify-between items-center p-3 bg-level-2 hover:bg-level-3 rounded-lg border border-border transition-colors">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-foreground">{item.description}</p>
                              {item.type === 'labor' && (
                                <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">Mão de Obra</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-sm text-muted-foreground">Qtd:</span>
                              <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value) || 1)}
                                className="w-16 px-2 py-1 text-sm border border-border rounded bg-background text-foreground"
                                min="1"
                              />
                              <span className="text-sm text-muted-foreground">×</span>
                              <span className="text-sm text-muted-foreground">R$</span>
                              <input
                                type="number"
                                step="0.01"
                                value={item.unitPrice.toFixed(2)}
                                onChange={(e) => updateItemPrice(item.id, parseFloat(e.target.value) || 0)}
                                className="w-24 px-2 py-1 text-sm border border-border rounded bg-background text-foreground"
                              />
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className="font-semibold text-foreground">
                              R$ {item.total.toFixed(2)}
                            </span>
                            <button
                              onClick={() => removeFromSale(item.id)}
                              className="text-error hover:text-error/80 font-bold text-lg transition-colors"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {saleItems.length > 0 && (
                    <div className="border-t border-border pt-4 mt-4">
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-muted-foreground">
                          <span>Produtos:</span>
                          <span>R$ {getProductsTotal().toFixed(2)}</span>
                        </div>
                        {getLaborTotal() > 0 && (
                          <div className="flex justify-between text-muted-foreground">
                            <span>Mão de Obra:</span>
                            <span>R$ {getLaborTotal().toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center text-lg font-bold text-foreground pt-2 border-t border-border">
                          <span>Subtotal:</span>
                          <span>R$ {getSubtotal().toFixed(2)}</span>
                        </div>
                      </div>

                      <Button
                        onClick={openFinishModal}
                        disabled={isProcessing}
                        variant="success"
                        className="w-full py-3"
                      >
                        Finalizar Venda
                      </Button>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </div>
          </div>
        </div>
      </main>
      {/* Modal de Mão de Obra */}
      <Modal
        isOpen={showLaborModal}
        onClose={() => setShowLaborModal(false)}
        title="Adicionar Mão de Obra"
        size="md"
      >
        <div className="bg-level-1 rounded-lg p-6 -m-6">
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
              placeholder="Buscar por nome, CPF/CNPJ ou telefone..."
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
                    <div className="font-medium">{customer.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {customer.cpfCnpj && <span>{customer.cpfCnpj}</span>}
                      {customer.cpfCnpj && customer.phone && <span> • </span>}
                      {customer.phone && <span>{customer.phone}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {customerSearch && filteredCustomers.length === 0 && (
              <div className="mt-2 p-3 text-center text-muted-foreground border border-border rounded-lg bg-level-2">
                Nenhum cliente encontrado
              </div>
            )}
            {selectedCustomer && (
              <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex justify-between items-center">
                <div>
                  <div className="font-medium text-foreground">{selectedCustomer.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {selectedCustomer.cpfCnpj || selectedCustomer.phone || selectedCustomer.email || 'Cliente selecionado'}
                  </div>
                </div>
                <button onClick={() => setSelectedCustomer(null)} className="text-error hover:text-error/80 text-xl">✕</button>
              </div>
            )}
          </div>

          {/* Vincular a Ordem de Serviço */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Vincular a Ordem de Serviço (opcional)
            </label>
            <Input
              placeholder="Buscar OS por número, título ou cliente..."
              value={orderSearch}
              onChange={(e) => setOrderSearch(e.target.value)}
            />
            {orderSearch && filteredServiceOrders.length > 0 && (
              <div className="max-h-32 overflow-y-auto border border-border rounded-lg mt-2 bg-level-2">
                {filteredServiceOrders.map((order) => (
                  <div
                    key={order.id}
                    onClick={() => {
                      setSelectedServiceOrder(order);
                      setOrderSearch('');
                      // Selecionar cliente da OS automaticamente
                      const orderCustomer = customers.find(c => c.id === order.customerId);
                      if (orderCustomer && !selectedCustomer) {
                        setSelectedCustomer(orderCustomer);
                      }
                    }}
                    className="p-2 hover:bg-level-3 cursor-pointer border-b border-border last:border-b-0"
                  >
                    <div className="font-medium">{order.orderNumber}</div>
                    <div className="text-sm text-muted-foreground">
                      {order.title} • {order.customerName}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {orderSearch && filteredServiceOrders.length === 0 && (
              <div className="mt-2 p-3 text-center text-muted-foreground border border-border rounded-lg bg-level-2">
                Nenhuma OS encontrada
              </div>
            )}
            {selectedServiceOrder && (
              <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex justify-between items-center">
                <div>
                  <div className="font-medium text-foreground">{selectedServiceOrder.orderNumber}</div>
                  <div className="text-sm text-muted-foreground">
                    {selectedServiceOrder.title} • {selectedServiceOrder.customerName}
                  </div>
                </div>
                <button onClick={() => setSelectedServiceOrder(null)} className="text-error hover:text-error/80 text-xl">✕</button>
              </div>
            )}
          </div>

          {/* Desconto */}
          <Input
            label="Desconto (R$)"
            type="number"
            step="0.01"
            value={discount.toString()}
            onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
            placeholder="0.00"
          />

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

          {/* Forma de Pagamento */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Forma de Pagamento</label>
            <div className="grid grid-cols-5 gap-2">
              {[
                { value: 'cash', label: 'Dinheiro', icon: '💵' },
                { value: 'credit_card', label: 'Crédito', icon: '💳' },
                { value: 'debit_card', label: 'Débito', icon: '💳' },
                { value: 'pix', label: 'PIX', icon: '📱' },
                { value: 'boleto', label: 'Boleto', icon: '📄' },
              ].map((method) => (
                <button
                  key={method.value}
                  type="button"
                  onClick={() => setPaymentMethod(method.value as typeof paymentMethod)}
                  className={`p-3 rounded-lg text-center transition-colors border ${
                    paymentMethod === method.value
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-level-1 border-border text-foreground hover:bg-level-2'
                  }`}
                >
                  <div className="text-xl">{method.icon}</div>
                  <div className="text-xs mt-1">{method.label}</div>
                </button>
              ))}
            </div>
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
            <div className="flex justify-between"><span>Subtotal:</span><span>R$ {getSubtotal().toFixed(2)}</span></div>
            {discount > 0 && <div className="flex justify-between text-error"><span>Desconto:</span><span>- R$ {discount.toFixed(2)}</span></div>}
            {addWarranty && warrantyPrice > 0 && <div className="flex justify-between"><span>Garantia ({warrantyMonths} meses):</span><span>R$ {warrantyPrice.toFixed(2)}</span></div>}
            <div className="flex justify-between text-xl font-bold pt-2 border-t border-border">
              <span>Total:</span>
              <span className="text-success">R$ {getTotalWithExtras().toFixed(2)}</span>
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
    </div>
  );
}
