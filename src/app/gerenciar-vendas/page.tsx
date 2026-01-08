'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Modal } from '@/components/Modal';
import { LoadingState } from '@/components/Loading';
import { Animated } from '@/components/Animated';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast, { Toaster } from 'react-hot-toast';

interface Sale {
  id: string;
  productId: string;
  productName: string;
  productCode: string;
  quantity: number;
  price: string;
  date: string;
  userId: string | null;
  customerId: string | null;
  customerName: string | null;
  sellerSignature: string | null;
  sellerName: string | null;
  paymentMethod?: string;
  isCreditSale?: number;
  creditDueDate?: string | null;
  creditStatus?: 'pending' | 'partial' | 'paid';
  serviceOrderId?: string | null;
  serviceOrder?: {
    id: string;
    orderNumber: string;
    title: string;
    status: string;
    deviceType?: string | null;
    deviceBrand?: string | null;
    deviceModel?: string | null;
    problemDescription?: string | null;
    diagnosis?: string | null;
    solution?: string | null;
    createdAt?: string;
  } | null;
}

interface SalesOrder {
  id: string;
  orderNumber: string;
  customerId: string | null;
  customerName?: string;
  customerCpfCnpj?: string | null;
  subtotal: string;
  discount: string;
  total: string;
  paymentMethod: string;
  status: string;
  notes: string | null;
  createdAt: string;
  items?: SalesOrderItem[];
  sellerName?: string;
  sellerSignature?: string;
  // Campos de crediário
  isCreditSale?: number;
  creditDueDate?: string | null;
  creditStatus?: 'pending' | 'partial' | 'paid';
  // Vínculo com OS
  serviceOrderId?: string | null;
  serviceOrder?: {
    id: string;
    orderNumber: string;
    title: string;
    status: string;
    deviceType?: string | null;
    deviceBrand?: string | null;
    deviceModel?: string | null;
    problemDescription?: string | null;
    diagnosis?: string | null;
    solution?: string | null;
    createdAt?: string;
  } | null;
}

interface SalesOrderItem {
  id: string;
  productId: string;
  productName?: string;
  quantity: number;
  unitPrice: string;
  discount: string;
  total: string;
  sellType?: 'package' | 'unit';
  unitsSold?: number;
}

export default function GerenciarVendas() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'sales' | 'orders'>('orders');
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<SalesOrder | null>(null);
  const [showCancelSaleModal, setShowCancelSaleModal] = useState(false);
  const [saleToCancel, setSaleToCancel] = useState<Sale | null>(null);
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);
  const [orderDetails, setOrderDetails] = useState<SalesOrder | null>(null);
  const [updatingCreditStatus, setUpdatingCreditStatus] = useState(false);
  const [printSize, setPrintSize] = useState<'A4' | 'A5'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('printSize') as 'A4' | 'A5') || 'A5';
    }
    return 'A5';
  });

  // Salvar preferência de tamanho de impressão
  const handlePrintSizeChange = (size: 'A4' | 'A5') => {
    setPrintSize(size);
    if (typeof window !== 'undefined') {
      localStorage.setItem('printSize', size);
    }
  };

  const fetchSales = useCallback(async () => {
    try {
      const response = await fetch(`/api/sales?startDate=${startDate}&endDate=${endDate}`);
      if (response.ok) {
        const data = await response.json();
        setSales(data.sales || []);
      }
    } catch (error) {
      console.error('Erro ao buscar vendas:', error);
      toast.error('Erro ao carregar vendas');
    }
  }, [startDate, endDate]);

  const fetchSalesOrders = useCallback(async () => {
    try {
      const response = await fetch('/api/sales-orders');
      if (response.ok) {
        const data = await response.json();
        setSalesOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
      toast.error('Erro ao carregar pedidos');
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchSales(), fetchSalesOrders()]);
      setLoading(false);
    };
    loadData();
  }, [fetchSales, fetchSalesOrders]);

  const handleRefresh = async () => {
    setLoading(true);
    await Promise.all([fetchSales(), fetchSalesOrders()]);
    setLoading(false);
    toast.success('Dados atualizados!');
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: 'Dinheiro',
      credit_card: 'Cartão de Crédito',
      debit_card: 'Cartão de Débito',
      pix: 'PIX',
      boleto: 'Boleto',
      credit_store: 'Crediário/Fiado',
      other: 'Outro',
    };
    return labels[method] || method;
  };

  const getCreditStatusBadge = (status?: string) => {
    if (!status) return null;
    const styles: Record<string, string> = {
      paid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      partial: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      pending: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    };
    const labels: Record<string, string> = {
      paid: '✅ Pago',
      partial: '⚠️ Parcial',
      pending: '❌ Pendente',
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const updateCreditStatus = async (orderId: string, newStatus: 'pending' | 'partial' | 'paid') => {
    setUpdatingCreditStatus(true);
    try {
      const response = await fetch(`/api/sales-orders?id=${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creditStatus: newStatus }),
      });
      
      if (response.ok) {
        const result = await response.json();
        toast.success(result.message);
        // Atualizar a lista localmente
        setSalesOrders(prev => prev.map(order => 
          order.id === orderId ? { ...order, creditStatus: newStatus } : order
        ));
        // Atualizar o modal de detalhes se estiver aberto
        if (orderDetails?.id === orderId) {
          setOrderDetails(prev => prev ? { ...prev, creditStatus: newStatus } : null);
        }
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao atualizar status');
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status de pagamento');
    } finally {
      setUpdatingCreditStatus(false);
    }
  };

  const updateSaleCreditStatus = async (saleId: string, newStatus: 'pending' | 'partial' | 'paid') => {
    setUpdatingCreditStatus(true);
    try {
      const response = await fetch(`/api/sales?id=${saleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creditStatus: newStatus }),
      });
      
      if (response.ok) {
        const result = await response.json();
        toast.success(result.message);
        // Atualizar a lista localmente
        setSales(prev => prev.map(sale => 
          sale.id === saleId ? { ...sale, creditStatus: newStatus } : sale
        ));
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao atualizar status');
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status de pagamento');
    } finally {
      setUpdatingCreditStatus(false);
    }
  };

  const openOrderDetails = (order: SalesOrder) => {
    setOrderDetails(order);
    setShowOrderDetailsModal(true);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    };
    const labels: Record<string, string> = {
      completed: 'Concluída',
      pending: 'Pendente',
      cancelled: 'Cancelada',
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const handleCancelOrder = async () => {
    if (!orderToCancel) return;

    try {
      const response = await fetch(`/api/sales-orders?id=${orderToCancel.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Venda cancelada e excluída com sucesso');
        setSalesOrders(prev => prev.filter(order => order.id !== orderToCancel.id));
        setShowCancelModal(false);
        setOrderToCancel(null);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao cancelar venda');
      }
    } catch (error) {
      console.error('Erro ao cancelar venda:', error);
      toast.error('Erro ao cancelar venda');
    }
  };

  const openCancelModal = (order: SalesOrder) => {
    setOrderToCancel(order);
    setShowCancelModal(true);
  };

  const handleCancelSale = async () => {
    if (!saleToCancel) return;

    try {
      const response = await fetch(`/api/sales?id=${saleToCancel.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Venda cancelada e excluída com sucesso');
        setSales(prev => prev.filter(sale => sale.id !== saleToCancel.id));
        setShowCancelSaleModal(false);
        setSaleToCancel(null);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao cancelar venda');
      }
    } catch (error) {
      console.error('Erro ao cancelar venda:', error);
      toast.error('Erro ao cancelar venda');
    }
  };

  const openCancelSaleModal = (sale: Sale) => {
    setSaleToCancel(sale);
    setShowCancelSaleModal(true);
  };

  const printDeclaration = (type: 'sale' | 'order', data: Sale | SalesOrder, printSize: 'A4' | 'A5' = 'A5') => {
    const pageWidth = printSize === 'A5' ? '148mm' : '210mm';
    const pageHeight = printSize === 'A5' ? '210mm' : '297mm';
    const fontSize = printSize === 'A5' ? '8pt' : '10pt';
    const marginSize = printSize === 'A5' ? '6mm' : '10mm';

    let printContent = '';

    if (type === 'sale') {
      const sale = data as Sale;
      printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Declaração de Venda - ${sale.id}</title>
          <style>
            @page {
              size: ${pageWidth} ${pageHeight};
              margin: ${marginSize};
            }
            @media print {
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
                margin: 0;
                padding: 0;
              }
              * {
                -webkit-box-sizing: border-box;
                -moz-box-sizing: border-box;
                box-sizing: border-box;
              }
            }
            body {
              font-family: Arial, sans-serif;
              font-size: ${fontSize};
              line-height: 1.3;
              margin: 0;
              padding: 0;
              color: #000;
            }
            .header {
              text-align: center;
              margin-bottom: 10px;
              border-bottom: 1px solid #333;
              padding-bottom: 5px;
            }
            .header h1 {
              margin: 0 0 3px 0;
              font-size: 1.4em;
              font-weight: bold;
            }
            .header p {
              margin: 2px 0;
              color: #666;
              font-size: 0.9em;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin: 3px 0;
              font-size: 0.9em;
            }
            .section {
              margin: 8px 0;
            }
            .section-title {
              font-weight: bold;
              margin-bottom: 5px;
              padding: 3px 5px;
              background: #f0f0f0;
              font-size: 0.95em;
              border: 1px solid #ddd;
            }
            .total-row {
              font-weight: bold;
              font-size: 1.1em;
              background: #e8f5e9;
              border-top: 2px solid #333;
              padding: 5px;
              margin: 5px 0;
            }
            .footer {
              margin-top: 15px;
              text-align: center;
              font-size: 0.8em;
              color: #666;
            }
            .signatures-container {
              display: flex;
              justify-content: space-around;
              margin-top: 20px;
              page-break-inside: avoid;
            }
            .signature {
              border-top: 1px solid #333;
              padding-top: 3px;
              width: 45%;
              text-align: center;
              font-size: 0.8em;
            }
            .signature-name {
              font-size: 0.75em;
              margin-top: 2px;
              color: #333;
              font-weight: bold;
            }
            .break-inside-avoid {
              page-break-inside: avoid;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>DECLARAÇÃO DE VENDA</h1>
            <p>ID: ${sale.id}</p>
            <p>${new Date(sale.date).toLocaleString('pt-BR')}</p>
          </div>

          <div class="section break-inside-avoid">
            <div class="section-title">VENDEDOR</div>
            <div class="info-row"><span>Nome:</span><span>${sale.sellerName || 'Operador PDV'}</span></div>
          </div>

          <div class="section break-inside-avoid">
            <div class="section-title">CLIENTE</div>
            <div class="info-row"><span>Nome:</span><span>${sale.customerName || 'Cliente não definido'}</span></div>
          </div>

          <div class="section break-inside-avoid">
            <div class="section-title">PRODUTO</div>
            <div class="info-row"><span>Produto:</span><span>${sale.productName || 'N/A'}</span></div>
            <div class="info-row"><span>Código:</span><span>${sale.productCode || 'N/A'}</span></div>
            <div class="info-row"><span>Quantidade:</span><span>${sale.quantity}</span></div>
            <div class="info-row"><span>Preço Unitário:</span><span>R$ ${parseFloat(sale.price).toFixed(2)}</span></div>
            <div class="total-row"><span>TOTAL:</span><span>R$ ${(sale.quantity * parseFloat(sale.price)).toFixed(2)}</span></div>
          </div>

          <div class="signatures-container break-inside-avoid">
            <div class="signature">
              <div class="signature-name">${sale.sellerName || 'Operador PDV'}</div>
              Assinatura do Vendedor
            </div>
            <div class="signature">
              <div class="signature-name">${sale.customerName || 'Cliente não definido'}</div>
              Assinatura do Cliente
            </div>
          </div>

          <div class="footer">
            <p>Obrigado pela preferência!</p>
          </div>
        </body>
        </html>
      `;
    } else {
      const order = data as SalesOrder;
      printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Declaração de Venda - ${order.orderNumber}</title>
          <style>
            @page {
              size: ${pageWidth} ${pageHeight};
              margin: ${marginSize};
            }
            @media print {
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
                margin: 0;
                padding: 0;
              }
              * {
                -webkit-box-sizing: border-box;
                -moz-box-sizing: border-box;
                box-sizing: border-box;
              }
            }
            body {
              font-family: Arial, sans-serif;
              font-size: ${fontSize};
              line-height: 1.3;
              margin: 0;
              padding: 0;
              color: #000;
            }
            .header {
              text-align: center;
              margin-bottom: 10px;
              border-bottom: 1px solid #333;
              padding-bottom: 5px;
            }
            .header h1 {
              margin: 0 0 3px 0;
              font-size: 1.4em;
              font-weight: bold;
            }
            .header p {
              margin: 2px 0;
              color: #666;
              font-size: 0.9em;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin: 3px 0;
              font-size: 0.9em;
            }
            .section {
              margin: 8px 0;
            }
            .section-title {
              font-weight: bold;
              margin-bottom: 5px;
              padding: 3px 5px;
              background: #f0f0f0;
              font-size: 0.95em;
              border: 1px solid #ddd;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 5px 0;
              font-size: 0.85em;
            }
            th, td {
              padding: 4px 2px;
              text-align: left;
              border-bottom: 1px solid #ddd;
            }
            th {
              background: #f5f5f5;
              font-weight: bold;
              font-size: 0.8em;
            }
            .text-right { text-align: right; }
            .total-row {
              font-weight: bold;
              font-size: 1.1em;
              background: #e8f5e9;
              border-top: 2px solid #333;
            }
            .warranty-box {
              border: 1px solid #333;
              padding: 6px;
              margin: 8px 0;
              background: #fffde7;
              font-size: 0.8em;
            }
            .footer {
              margin-top: 15px;
              text-align: center;
              font-size: 0.8em;
              color: #666;
            }
            .signatures-container {
              display: flex;
              justify-content: space-around;
              margin-top: 20px;
              page-break-inside: avoid;
            }
            .signature {
              border-top: 1px solid #333;
              padding-top: 3px;
              width: 45%;
              text-align: center;
              font-size: 0.8em;
            }
            .signature-name {
              font-size: 0.75em;
              margin-top: 2px;
              color: #333;
              font-weight: bold;
            }
            .break-inside-avoid {
              page-break-inside: avoid;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>DECLARAÇÃO DE VENDA</h1>
            <p>Nº ${order.orderNumber}</p>
            <p>${new Date(order.createdAt).toLocaleString('pt-BR')}</p>
          </div>

          <div class="section break-inside-avoid">
            <div class="section-title">VENDEDOR</div>
            <div class="info-row"><span>Nome:</span><span>${order.sellerName || 'Operador PDV'}</span></div>
          </div>

          <div class="section break-inside-avoid">
            <div class="section-title">CLIENTE</div>
            <div class="info-row"><span>Nome:</span><span>${order.customerName || 'Consumidor Final'}</span></div>
            ${order.customerId ? `<div class="info-row"><span>ID Cliente:</span><span>${order.customerId}</span></div>` : ''}
          </div>

          <div class="section break-inside-avoid">
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
                ${order.items ? order.items.map(item => `
                  <tr>
                    <td style="max-width: 120px; word-wrap: break-word;">${item.productName || 'Produto'}</td>
                    <td class="text-right">${item.quantity}</td>
                    <td class="text-right">R$ ${parseFloat(item.unitPrice).toFixed(2)}</td>
                    <td class="text-right">R$ ${parseFloat(item.total).toFixed(2)}</td>
                  </tr>
                `).join('') : '<tr><td colspan="4">Itens não disponíveis</td></tr>'}
              </tbody>
            </table>
          </div>

          <div class="section break-inside-avoid">
            <div class="section-title">RESUMO</div>
            <div class="info-row"><span>Subtotal:</span><span>R$ ${parseFloat(order.subtotal).toFixed(2)}</span></div>
            ${parseFloat(order.discount) > 0 ? `<div class="info-row"><span>Desconto:</span><span>- R$ ${parseFloat(order.discount).toFixed(2)}</span></div>` : ''}
            <div class="info-row total-row"><span>TOTAL:</span><span>R$ ${parseFloat(order.total).toFixed(2)}</span></div>
            <div class="info-row"><span>Forma de Pagamento:</span><span>${getPaymentMethodLabel(order.paymentMethod)}</span></div>
            <div class="info-row"><span>Status:</span><span>${order.status === 'completed' ? 'Concluída' : order.status === 'pending' ? 'Pendente' : 'Cancelada'}</span></div>
          </div>

          ${order.notes ? `
            <div class="section break-inside-avoid">
              <div class="section-title">OBSERVAÇÕES</div>
              <p style="font-size: 0.85em; margin: 3px 0;">${order.notes}</p>
            </div>
          ` : ''}

          <div class="signatures-container break-inside-avoid">
            <div class="signature">
              <div class="signature-name">${order.sellerName || 'Operador PDV'}</div>
              Assinatura do Vendedor
            </div>
            <div class="signature">
              <div class="signature-name">${order.customerName || 'Consumidor Final'}</div>
              Assinatura do Cliente
            </div>
          </div>

          <div class="footer">
            <p>Obrigado pela preferência!</p>
          </div>
        </body>
        </html>
      `;
    }

    // Criar iframe oculto para impressão
    let iframe = document.getElementById('print-iframe') as HTMLIFrameElement;
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'print-iframe';
      iframe.style.position = 'absolute';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = 'none';
      iframe.style.visibility = 'hidden';
      document.body.appendChild(iframe);
    }

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(printContent);
      iframeDoc.close();

      // Aguardar o conteúdo carregar e imprimir
      setTimeout(() => {
        iframe.contentWindow?.print();
      }, 250);
    }
  };

  const printSaleDeclaration = (order: SalesOrder) => {
    printDeclaration('order', order, printSize);
  };

  const printSimpleSale = (sale: Sale) => {
    printDeclaration('sale', sale, printSize);
  };

  const printServiceOrder = (serviceOrder: SalesOrder['serviceOrder']) => {
    if (!serviceOrder) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Não foi possível abrir a janela de impressão');
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>OS #${serviceOrder.orderNumber}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #333;
            padding-bottom: 15px;
            margin-bottom: 20px;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            color: #333;
          }
          .header p {
            margin: 5px 0 0;
            color: #666;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 20px;
          }
          .info-box {
            border: 1px solid #ddd;
            padding: 10px;
            border-radius: 5px;
          }
          .info-box label {
            font-size: 11px;
            color: #666;
            display: block;
            margin-bottom: 3px;
          }
          .info-box span {
            font-weight: bold;
            font-size: 14px;
          }
          .section {
            margin-bottom: 20px;
          }
          .section h3 {
            font-size: 14px;
            background: #f5f5f5;
            padding: 8px;
            margin: 0 0 10px;
            border-left: 4px solid #333;
          }
          .section-content {
            padding: 0 10px;
          }
          .status-badge {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 15px;
            font-size: 12px;
            font-weight: bold;
          }
          .status-open { background: #e3f2fd; color: #1976d2; }
          .status-in_progress { background: #fff3e0; color: #f57c00; }
          .status-completed { background: #e8f5e9; color: #388e3c; }
          .status-cancelled { background: #ffebee; color: #d32f2f; }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 11px;
            color: #999;
            border-top: 1px dashed #ccc;
            padding-top: 15px;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>ORDEM DE SERVIÇO</h1>
          <p>Nº ${serviceOrder.orderNumber}</p>
        </div>

        <div class="info-grid">
          <div class="info-box">
            <label>Status</label>
            <span class="status-badge status-${serviceOrder.status}">
              ${serviceOrder.status === 'open' ? '🔵 Aberta' : ''}
              ${serviceOrder.status === 'in_progress' ? '🟡 Em Andamento' : ''}
              ${serviceOrder.status === 'completed' ? '🟢 Concluída' : ''}
              ${serviceOrder.status === 'cancelled' ? '🔴 Cancelada' : ''}
            </span>
          </div>
          <div class="info-box">
            <label>Data de Criação</label>
            <span>${serviceOrder.createdAt ? new Date(serviceOrder.createdAt).toLocaleDateString('pt-BR') : '-'}</span>
          </div>
        </div>

        ${serviceOrder.deviceType || serviceOrder.deviceBrand || serviceOrder.deviceModel ? `
        <div class="section">
          <h3>EQUIPAMENTO</h3>
          <div class="section-content">
            <div class="info-grid">
              ${serviceOrder.deviceType ? `
              <div class="info-box">
                <label>Tipo</label>
                <span>${serviceOrder.deviceType}</span>
              </div>` : ''}
              ${serviceOrder.deviceBrand ? `
              <div class="info-box">
                <label>Marca</label>
                <span>${serviceOrder.deviceBrand}</span>
              </div>` : ''}
              ${serviceOrder.deviceModel ? `
              <div class="info-box">
                <label>Modelo</label>
                <span>${serviceOrder.deviceModel}</span>
              </div>` : ''}
            </div>
          </div>
        </div>
        ` : ''}

        ${serviceOrder.problemDescription ? `
        <div class="section">
          <h3>PROBLEMA RELATADO</h3>
          <div class="section-content">
            <p>${serviceOrder.problemDescription}</p>
          </div>
        </div>
        ` : ''}

        ${serviceOrder.diagnosis ? `
        <div class="section">
          <h3>DIAGNÓSTICO</h3>
          <div class="section-content">
            <p>${serviceOrder.diagnosis}</p>
          </div>
        </div>
        ` : ''}

        ${serviceOrder.solution ? `
        <div class="section">
          <h3>SOLUÇÃO APLICADA</h3>
          <div class="section-content">
            <p>${serviceOrder.solution}</p>
          </div>
        </div>
        ` : ''}

        <div class="footer">
          <p>Documento gerado em ${new Date().toLocaleString('pt-BR')}</p>
        </div>

        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  if (loading) {
    return <LoadingState message="Carregando vendas..." />;
  }

  // Calcular totais
  const totalSales = sales.reduce((sum, s) => sum + (s.quantity * parseFloat(s.price)), 0);
  const totalOrders = salesOrders.reduce((sum, o) => sum + parseFloat(o.total), 0);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <Toaster position="top-right" />
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <Animated animation="fade-in">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Gerenciar Vendas</h1>
              <p className="text-muted-foreground">Visualize, gerencie e imprima suas vendas</p>
            </div>
            <Button onClick={handleRefresh} variant="secondary">
              🔄 Atualizar
            </Button>
          </div>
        </Animated>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Animated animation="slide-up" delay={0}>
            <Card className="bg-gradient-to-br from-blue-400 to-blue-500 border-none shadow-xl">
              <Card.Body>
                <p className="text-sm font-medium text-blue-50 mb-1">Total em Vendas Simples</p>
                <p className="text-3xl font-bold text-white">R$ {totalSales.toFixed(2)}</p>
                <p className="text-sm text-blue-100">{sales.length} vendas registradas</p>
              </Card.Body>
            </Card>
          </Animated>

          <Animated animation="slide-up" delay={100}>
            <Card className="bg-gradient-to-br from-emerald-400 to-emerald-500 border-none shadow-xl">
              <Card.Body>
                <p className="text-sm font-medium text-emerald-50 mb-1">Total em Pedidos</p>
                <p className="text-3xl font-bold text-white">R$ {totalOrders.toFixed(2)}</p>
                <p className="text-sm text-emerald-100">{salesOrders.length} pedidos</p>
              </Card.Body>
            </Card>
          </Animated>

          <Animated animation="slide-up" delay={200}>
            <Card className="bg-gradient-to-br from-purple-400 to-purple-500 border-none shadow-xl">
              <Card.Body>
                <p className="text-sm font-medium text-purple-50 mb-1">Total Geral</p>
                <p className="text-3xl font-bold text-white">R$ {(totalSales + totalOrders).toFixed(2)}</p>
                <p className="text-sm text-purple-100">{sales.length + salesOrders.length} transações</p>
              </Card.Body>
            </Card>
          </Animated>
        </div>

        {/* Filtros */}
        <Animated animation="slide-down" delay={300}>
          <Card className="mb-6 bg-level-1">
            <Card.Body>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Data Inicial</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Data Final</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Tamanho da Impressão</label>
                  <div className="flex gap-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={printSize === 'A5'}
                        onChange={() => handlePrintSizeChange('A5')}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">A5</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={printSize === 'A4'}
                        onChange={() => handlePrintSizeChange('A4')}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">A4</span>
                    </label>
                  </div>
                </div>
                <div className="flex items-end">
                  <Button onClick={handleRefresh} className="w-full">
                    Filtrar
                  </Button>
                </div>
                <div className="flex items-end gap-2">
                  <Button
                    variant={activeTab === 'orders' ? 'primary' : 'secondary'}
                    onClick={() => setActiveTab('orders')}
                    className="flex-1"
                  >
                    Pedidos
                  </Button>
                  <Button
                    variant={activeTab === 'sales' ? 'primary' : 'secondary'}
                    onClick={() => setActiveTab('sales')}
                    className="flex-1"
                  >
                    Vendas
                  </Button>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Animated>

        {/* Lista de Pedidos */}
        {activeTab === 'orders' && (
          <Animated animation="fade-in" delay={400}>
            <Card className="bg-level-1">
              <Card.Header>
                <h2 className="text-xl font-bold text-foreground">Pedidos de Venda (PDV)</h2>
              </Card.Header>
              <Card.Body>
                {salesOrders.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p className="text-lg">Nenhum pedido encontrado</p>
                    <p className="text-sm">Registre vendas pelo PDV para ver aqui</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4 font-semibold text-foreground">Nº Pedido</th>
                          <th className="text-left py-3 px-4 font-semibold text-foreground">Data</th>
                          <th className="text-left py-3 px-4 font-semibold text-foreground">Cliente</th>
                          <th className="text-left py-3 px-4 font-semibold text-foreground">Pagamento</th>
                          <th className="text-center py-3 px-4 font-semibold text-foreground">Status Pgto</th>
                          <th className="text-right py-3 px-4 font-semibold text-foreground">Total</th>
                          <th className="text-center py-3 px-4 font-semibold text-foreground">Status</th>
                          <th className="text-center py-3 px-4 font-semibold text-foreground">OS</th>
                          <th className="text-center py-3 px-4 font-semibold text-foreground">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {salesOrders.map((order) => (
                          <tr key={order.id} className="border-b border-border hover:bg-level-2 transition-colors">
                            <td className="py-3 px-4 font-medium text-foreground">{order.orderNumber}</td>
                            <td className="py-3 px-4 text-muted-foreground">
                              {new Date(order.createdAt).toLocaleString('pt-BR')}
                            </td>
                            <td className="py-3 px-4 text-muted-foreground">
                              {order.customerName || <span className="italic text-gray-400">Não informado</span>}
                            </td>
                            <td className="py-3 px-4 text-muted-foreground">
                              {getPaymentMethodLabel(order.paymentMethod)}
                              {order.isCreditSale && (
                                <span className="ml-1 text-amber-600 dark:text-amber-400" title="Venda a crediário">💳</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {order.isCreditSale ? (
                                <div className="flex flex-col items-center gap-1">
                                  {getCreditStatusBadge(order.creditStatus || 'pending')}
                                  {order.creditDueDate && (
                                    <span className="text-xs text-muted-foreground">
                                      Venc: {new Date(order.creditDueDate).toLocaleDateString('pt-BR')}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400">-</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right font-semibold text-foreground">
                              R$ {parseFloat(order.total).toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-center">{getStatusBadge(order.status)}</td>
                            <td className="py-3 px-4 text-center">
                              {order.serviceOrderId && order.serviceOrder ? (
                                <span className="text-blue-600 dark:text-blue-400 cursor-pointer" title={`OS #${order.serviceOrder.orderNumber}`}>
                                  🔧 #{order.serviceOrder.orderNumber}
                                </span>
                              ) : (
                                <span className="text-xs text-gray-400">-</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="flex gap-2 justify-center">
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => openOrderDetails(order)}
                                  title="Ver detalhes"
                                >
                                  👁️
                                </Button>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => printSaleDeclaration(order)}
                                >
                                  🖨️
                                </Button>
                                {order.status === 'pending' && (
                                  <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={() => openCancelModal(order)}
                                  >
                                    ❌
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Animated>
        )}

        {/* Lista de Vendas Simples */}
        {activeTab === 'sales' && (
          <Animated animation="fade-in" delay={400}>
            <Card className="bg-level-1">
              <Card.Header>
                <h2 className="text-xl font-bold text-foreground">Vendas Simples</h2>
              </Card.Header>
              <Card.Body>
                {sales.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p className="text-lg">Nenhuma venda encontrada</p>
                    <p className="text-sm">Registre vendas para ver aqui</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1100px]">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 px-1 font-semibold text-foreground text-xs whitespace-nowrap">Produto</th>
                          <th className="text-left py-2 px-1 font-semibold text-foreground text-xs whitespace-nowrap">Código</th>
                          <th className="text-center py-2 px-1 font-semibold text-foreground text-xs whitespace-nowrap">Qtd</th>
                          <th className="text-right py-2 px-1 font-semibold text-foreground text-xs whitespace-nowrap">Total</th>
                          <th className="text-left py-2 px-1 font-semibold text-foreground text-xs whitespace-nowrap">Data</th>
                          <th className="text-left py-2 px-1 font-semibold text-foreground text-xs whitespace-nowrap">Cliente</th>
                          <th className="text-left py-2 px-1 font-semibold text-foreground text-xs whitespace-nowrap">Pagamento</th>
                          <th className="text-center py-2 px-1 font-semibold text-foreground text-xs whitespace-nowrap">Status Pgto</th>
                          <th className="text-center py-2 px-1 font-semibold text-foreground text-xs whitespace-nowrap">OS</th>
                          <th className="text-center py-2 px-1 font-semibold text-foreground text-xs whitespace-nowrap">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sales.map((sale) => (
                          <tr key={sale.id} className="border-b border-border hover:bg-level-2 transition-colors">
                            <td className="py-2 px-1 font-medium text-foreground text-xs">{sale.productName || 'N/A'}</td>
                            <td className="py-2 px-1 text-muted-foreground text-xs">{sale.productCode || 'N/A'}</td>
                            <td className="py-2 px-1 text-center text-foreground text-xs">{sale.quantity}</td>
                            <td className="py-2 px-1 text-right font-semibold text-foreground text-xs">
                              R$ {(sale.quantity * parseFloat(sale.price)).toFixed(2)}
                            </td>
                            <td className="py-2 px-1 text-muted-foreground text-xs whitespace-nowrap">
                              {new Date(sale.date).toLocaleDateString('pt-BR')}
                            </td>
                            <td className="py-2 px-1 text-muted-foreground text-xs">{sale.customerName || 'Não definido'}</td>
                            <td className="py-2 px-1 text-muted-foreground text-xs">
                              {getPaymentMethodLabel(sale.paymentMethod || 'cash')}
                              {sale.isCreditSale ? (
                                <span className="ml-1 text-amber-600 dark:text-amber-400" title="Venda a crediário">💳</span>
                              ) : null}
                            </td>
                            <td className="py-2 px-1 text-center">
                              {sale.isCreditSale ? (
                                <div className="flex flex-col items-center gap-1">
                                  {getCreditStatusBadge(sale.creditStatus || 'pending')}
                                  <select
                                    value={sale.creditStatus || 'pending'}
                                    onChange={(e) => updateSaleCreditStatus(sale.id, e.target.value as 'pending' | 'partial' | 'paid')}
                                    disabled={updatingCreditStatus}
                                    className="text-xs px-1 py-0.5 border border-border rounded bg-background text-foreground"
                                  >
                                    <option value="pending">Pendente</option>
                                    <option value="partial">Parcial</option>
                                    <option value="paid">Pago</option>
                                  </select>
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400">-</span>
                              )}
                            </td>
                            <td className="py-2 px-1 text-center">
                              {sale.serviceOrderId && sale.serviceOrder ? (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => printServiceOrder(sale.serviceOrder)}
                                  title={`OS #${sale.serviceOrder.orderNumber}`}
                                >
                                  🔧 #{sale.serviceOrder.orderNumber}
                                </Button>
                              ) : (
                                <span className="text-xs text-gray-400">-</span>
                              )}
                            </td>
                            <td className="py-2 px-1 text-center">
                              <div className="flex gap-1 justify-center flex-wrap">
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => printSimpleSale(sale)}
                                  title="Imprimir"
                                >
                                  🖨️
                                </Button>
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() => openCancelSaleModal(sale)}
                                  title="Cancelar e Excluir"
                                >
                                  ❌
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Animated>
        )}
      </main>

      {/* Modal de Confirmação de Cancelamento de Pedido */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Confirmar Cancelamento"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Tem certeza que deseja cancelar e excluir esta venda?
          </p>
          {orderToCancel && (
            <div className="bg-level-2 p-3 rounded-lg">
              <p className="font-medium text-foreground">Pedido: {orderToCancel.orderNumber}</p>
              <p className="text-sm text-muted-foreground">
                Total: R$ {parseFloat(orderToCancel.total).toFixed(2)}
              </p>
            </div>
          )}
          <p className="text-sm text-red-600 dark:text-red-400">
            ⚠️ Esta ação não pode ser desfeita. O estoque será revertido.
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setShowCancelModal(false)} className="flex-1">
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleCancelOrder} className="flex-1">
              Confirmar Exclusão
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de Confirmação de Cancelamento de Venda Simples */}
      <Modal
        isOpen={showCancelSaleModal}
        onClose={() => setShowCancelSaleModal(false)}
        title="Confirmar Cancelamento"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Tem certeza que deseja cancelar e excluir esta venda?
          </p>
          {saleToCancel && (
            <div className="bg-level-2 p-3 rounded-lg">
              <p className="font-medium text-foreground">Produto: {saleToCancel.productName}</p>
              <p className="text-sm text-muted-foreground">
                Quantidade: {saleToCancel.quantity} | Total: R$ {(saleToCancel.quantity * parseFloat(saleToCancel.price)).toFixed(2)}
              </p>
              <p className="text-sm text-muted-foreground">
                Cliente: {saleToCancel.customerName || 'Não definido'}
              </p>
            </div>
          )}
          <p className="text-sm text-red-600 dark:text-red-400">
            ⚠️ Esta ação não pode ser desfeita. O estoque será revertido.
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setShowCancelSaleModal(false)} className="flex-1">
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleCancelSale} className="flex-1">
              Confirmar Exclusão
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de Detalhes do Pedido */}
      <Modal
        isOpen={showOrderDetailsModal}
        onClose={() => {
          setShowOrderDetailsModal(false);
          setOrderDetails(null);
        }}
        title={`Detalhes do Pedido ${orderDetails?.orderNumber || ''}`}
        size="lg"
      >
        {orderDetails && (
          <div className="space-y-6">
            {/* Informações Gerais */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-level-2 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Data</p>
                <p className="font-medium text-foreground">
                  {new Date(orderDetails.createdAt).toLocaleString('pt-BR')}
                </p>
              </div>
              <div className="bg-level-2 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Cliente</p>
                <p className="font-medium text-foreground">
                  {orderDetails.customerName || 'Não informado'}
                </p>
              </div>
              <div className="bg-level-2 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Pagamento</p>
                <p className="font-medium text-foreground">
                  {getPaymentMethodLabel(orderDetails.paymentMethod)}
                </p>
              </div>
              <div className="bg-level-2 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="font-bold text-lg text-primary">
                  R$ {parseFloat(orderDetails.total).toFixed(2)}
                </p>
              </div>
            </div>

            {/* Seção de Crediário */}
            {orderDetails.isCreditSale && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4">
                <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-3 flex items-center gap-2">
                  💳 Venda a Crediário/Fiado
                </h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-amber-700 dark:text-amber-300">Data de Vencimento</p>
                    <p className="font-medium text-amber-900 dark:text-amber-100">
                      {orderDetails.creditDueDate 
                        ? new Date(orderDetails.creditDueDate).toLocaleDateString('pt-BR')
                        : 'Não definida'
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-amber-700 dark:text-amber-300">Status Atual</p>
                    <div className="mt-1">
                      {getCreditStatusBadge(orderDetails.creditStatus || 'pending')}
                    </div>
                  </div>
                </div>
                <div className="border-t border-amber-200 dark:border-amber-700 pt-4">
                  <p className="text-sm text-amber-700 dark:text-amber-300 mb-2">Alterar Status de Pagamento:</p>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant={orderDetails.creditStatus === 'pending' ? 'primary' : 'secondary'}
                      size="sm"
                      onClick={() => updateCreditStatus(orderDetails.id, 'pending')}
                      disabled={updatingCreditStatus || orderDetails.creditStatus === 'pending'}
                    >
                      ❌ Pendente
                    </Button>
                    <Button
                      variant={orderDetails.creditStatus === 'partial' ? 'primary' : 'secondary'}
                      size="sm"
                      onClick={() => updateCreditStatus(orderDetails.id, 'partial')}
                      disabled={updatingCreditStatus || orderDetails.creditStatus === 'partial'}
                    >
                      ⚠️ Parcial
                    </Button>
                    <Button
                      variant={orderDetails.creditStatus === 'paid' ? 'primary' : 'secondary'}
                      size="sm"
                      onClick={() => updateCreditStatus(orderDetails.id, 'paid')}
                      disabled={updatingCreditStatus || orderDetails.creditStatus === 'paid'}
                    >
                      ✅ Pago
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Seção de OS Vinculada */}
            {orderDetails.serviceOrderId && orderDetails.serviceOrder && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-3 flex items-center gap-2">
                  🔧 Ordem de Serviço Vinculada
                </h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-blue-700 dark:text-blue-300">Número da OS</p>
                    <p className="font-medium text-blue-900 dark:text-blue-100">
                      #{orderDetails.serviceOrder.orderNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-700 dark:text-blue-300">Status</p>
                    <p className="font-medium text-blue-900 dark:text-blue-100 capitalize">
                      {orderDetails.serviceOrder.status === 'open' && '🔵 Aberta'}
                      {orderDetails.serviceOrder.status === 'in_progress' && '🟡 Em Andamento'}
                      {orderDetails.serviceOrder.status === 'completed' && '🟢 Concluída'}
                      {orderDetails.serviceOrder.status === 'cancelled' && '🔴 Cancelada'}
                    </p>
                  </div>
                  {orderDetails.serviceOrder.deviceType && (
                    <div>
                      <p className="text-sm text-blue-700 dark:text-blue-300">Equipamento</p>
                      <p className="font-medium text-blue-900 dark:text-blue-100">
                        {orderDetails.serviceOrder.deviceType}
                      </p>
                    </div>
                  )}
                  {orderDetails.serviceOrder.deviceBrand && (
                    <div>
                      <p className="text-sm text-blue-700 dark:text-blue-300">Marca/Modelo</p>
                      <p className="font-medium text-blue-900 dark:text-blue-100">
                        {orderDetails.serviceOrder.deviceBrand} {orderDetails.serviceOrder.deviceModel || ''}
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => printServiceOrder(orderDetails.serviceOrder!)}
                  >
                    🖨️ Imprimir OS
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => window.open(`/ordens-servico?os=${orderDetails.serviceOrder!.orderNumber}`, '_blank')}
                  >
                    🔗 Ver OS Completa
                  </Button>
                </div>
              </div>
            )}

            {/* Itens do Pedido */}
            {orderDetails.items && orderDetails.items.length > 0 && (
              <div>
                <h3 className="font-semibold text-foreground mb-3">Itens do Pedido</h3>
                <div className="bg-level-2 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 px-3">Produto</th>
                        <th className="text-center py-2 px-3">Qtd</th>
                        <th className="text-right py-2 px-3">Preço</th>
                        <th className="text-right py-2 px-3">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderDetails.items.map((item: any, index: number) => (
                        <tr key={index} className="border-b border-border last:border-0">
                          <td className="py-2 px-3">{item.productName || 'Produto'}</td>
                          <td className="py-2 px-3 text-center">{item.quantity}</td>
                          <td className="py-2 px-3 text-right">R$ {parseFloat(item.price).toFixed(2)}</td>
                          <td className="py-2 px-3 text-right font-medium">
                            R$ {(item.quantity * parseFloat(item.price)).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Ações */}
            <div className="flex gap-3 pt-4 border-t border-border">
              <Button
                variant="secondary"
                onClick={() => printSaleDeclaration(orderDetails)}
                className="flex-1"
              >
                🖨️ Imprimir Venda
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setShowOrderDetailsModal(false);
                  setOrderDetails(null);
                }}
                className="flex-1"
              >
                Fechar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
