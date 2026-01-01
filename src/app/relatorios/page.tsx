'use client';

import { useState, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { LoadingState } from '@/components/Loading';
import { EmptyState } from '@/components/EmptyState';
import { 
  DocumentReportIcon, 
  PackageIcon, 
  CubeIcon, 
  TrendingUpIcon, 
  ShoppingCartIcon 
} from '@/components/Icons';

interface Movement {
  id: string;
  type: 'entrada' | 'saida';
  quantity: number;
  unitPrice: string;
  date: string;
  reference: string;
  productName: string;
  productCode: string;
}

interface Stats {
  totalProducts: number;
  totalStock: number;
  totalSales: number;
  totalRevenue: number;
}

interface TopProduct {
  productName: string;
  productCode: string;
  totalSold: number;
  totalRevenue: number;
}

export default function Relatorios() {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'movements' | 'products'>('overview');

  const fetchReports = async () => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(`/api/reports?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setMovements(data.movements || []);
        setStats(data.stats || null);
        setTopProducts(data.topProducts || []);
      }
    } catch (error) {
      console.error('Erro ao buscar relatórios:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  const exportToCSV = () => {
    if (movements.length === 0) return;

    const headers = ['Data', 'Tipo', 'Produto', 'Código', 'Quantidade', 'Preço Unitário', 'Total', 'Referência'];
    const csvData = movements.map(movement => [
      movement.date,
      movement.type === 'entrada' ? 'Entrada' : 'Saída',
      movement.productName,
      movement.productCode,
      movement.quantity,
      parseFloat(movement.unitPrice).toFixed(2),
      (movement.quantity * parseFloat(movement.unitPrice)).toFixed(2),
      movement.reference,
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getMovementTypeStatus = (type: 'entrada' | 'saida'): { text: string; color: string } => {
    if (type === 'entrada') return { text: 'Entrada', color: 'var(--state-success)' };
    return { text: 'Saída', color: 'var(--state-destructive)' };
  };

  return (
    <>
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center">
              <DocumentReportIcon className="w-8 h-8 mr-3 text-primary" aria-hidden={true} />
              Relatórios
            </h1>
            <p className="text-muted-foreground">Análise detalhada de movimentações e vendas</p>
          </div>
          <Button
            onClick={exportToCSV}
            disabled={movements.length === 0}
            variant="success"
          >
            Exportar CSV
          </Button>
        </div>

        {/* Filtros de Data */}
        <Card className="mb-6 bg-level-1">
          <Card.Header>
            <h2 className="text-lg font-medium text-foreground">Filtros</h2>
          </Card.Header>
          <Card.Body>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Data Inicial</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Data Final</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                  }}
                  variant="primary"
                  className="w-full "
                >
                  Limpar Filtros
                </Button>
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* Abas */}
        <div className="mb-6">
          <nav className="flex space-x-8" role="tablist">
            <button
              onClick={() => setActiveTab('overview')}
              role="tab"
              aria-selected={activeTab === 'overview'}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'overview'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              Visão Geral
            </button>
            <button
              onClick={() => setActiveTab('movements')}
              role="tab"
              aria-selected={activeTab === 'movements'}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'movements'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              Movimentações
            </button>
            <button
              onClick={() => setActiveTab('products')}
              role="tab"
              aria-selected={activeTab === 'products'}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'products'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              Produtos
            </button>
          </nav>
        </div>

        {loading ? (
          <LoadingState message="Carregando relatórios..." />
        ) : (
          <>
            {/* Visão Geral */}
            {activeTab === 'overview' && stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card className="bg-level-1">
                  <Card.Body>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Total de Produtos</p>
                        <p className="text-2xl font-bold text-foreground">{stats.totalProducts || 0}</p>
                      </div>
                      <PackageIcon className="w-12 h-12 text-primary" aria-hidden={true} />
                    </div>
                  </Card.Body>
                </Card>

                <Card className="bg-level-1">
                  <Card.Body>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Itens em Estoque</p>
                        <p className="text-2xl font-bold text-foreground">{stats.totalStock || 0}</p>
                      </div>
                      <CubeIcon className="w-12 h-12 text-success" aria-hidden={true} />
                    </div>
                  </Card.Body>
                </Card>

                <Card className="bg-level-1">
                  <Card.Body>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Total de Vendas</p>
                        <p className="text-2xl font-bold text-foreground">{stats.totalSales || 0}</p>
                      </div>
                      <ShoppingCartIcon className="w-12 h-12 text-secondary" aria-hidden={true} />
                    </div>
                  </Card.Body>
                </Card>

                <Card className="bg-level-1">
                  <Card.Body>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Receita Total</p>
                        <p className="text-2xl font-bold text-foreground">
                          {formatCurrency(stats.totalRevenue || 0)}
                        </p>
                      </div>
                      <TrendingUpIcon className="w-12 h-12 text-warning" aria-hidden={true} />
                    </div>
                  </Card.Body>
                </Card>
              </div>
            )}

            {/* Movimentações */}
            {activeTab === 'movements' && (
              <Card className="bg-level-1">
                <Card.Body>
                  {movements.length === 0 ? (
                    <EmptyState
                      title="Nenhuma movimentação encontrada"
                      message="Quando você realizar movimentações no período selecionado, elas aparecerão aqui."
                      icon={<DocumentReportIcon className="w-12 h-12 text-muted-foreground" />}
                    />
                  ) : (
                    <ul className="divide-y divide-border">
                      {movements.map((movement) => (
                        <li key={movement.id} className="py-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center">
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-foreground">{movement.productName}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {movement.productCode} • {movement.date} • {movement.reference}
                                  </p>
                                </div>
                                <div className="ml-4 flex flex-col items-end">
                                  {(() => {
                                    const movementStatus = getMovementTypeStatus(movement.type);
                                    return (
                                      <span
                                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white shadow-sm mb-1"
                                        style={{ backgroundColor: movementStatus.color }}
                                      >
                                        {movementStatus.text}
                                      </span>
                                    );
                                  })()}
                                  <span className="text-sm text-muted-foreground mt-1">
                                    Qtd: {movement.quantity} × {formatCurrency(parseFloat(movement.unitPrice))}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="ml-4 text-right">
                              <p className="text-sm font-medium text-foreground">
                                {formatCurrency(movement.quantity * parseFloat(movement.unitPrice))}
                              </p>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card.Body>
              </Card>
            )}

            {/* Produtos Mais Vendidos */}
            {activeTab === 'products' && (
              <Card className="bg-level-1">
                <Card.Header>
                  <div className="flex items-center">
                    <ShoppingCartIcon className="w-6 h-6 text-muted-foreground mr-2" aria-hidden={true} />
                    <h2 className="text-xl font-bold text-foreground">Produtos Mais Vendidos</h2>
                  </div>
                </Card.Header>
                <Card.Body>
                  {topProducts.length === 0 ? (
                    <EmptyState
                      title="Nenhuma venda encontrada"
                      message="Quando você realizar vendas no período selecionado, elas aparecerão aqui."
                      icon={<ShoppingCartIcon className="w-12 h-12 text-muted-foreground" />}
                    />
                  ) : (
                    <ul className="divide-y divide-border">
                      {topProducts.map((product, index) => (
                        <li key={product.productCode} className="py-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">
                                {index + 1}
                              </div>
                              <div className="ml-4">
                                <p className="text-sm font-medium text-foreground">{product.productName}</p>
                                <p className="text-sm text-muted-foreground">{product.productCode}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-8">
                              <div className="text-right">
                                <p className="text-sm text-muted-foreground">Quantidade Vendida</p>
                                <p className="text-lg font-medium text-foreground">{product.totalSold}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-muted-foreground">Receita</p>
                                <p className="text-lg font-medium text-success">
                                  {formatCurrency(product.totalRevenue)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card.Body>
              </Card>
            )}
          </>
        )}
      </main>
    </>
  );
}
