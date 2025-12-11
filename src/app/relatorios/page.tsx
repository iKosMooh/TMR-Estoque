'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

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

  useEffect(() => {
    fetchReports();
  }, [startDate, endDate]);

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/" className="text-xl font-bold text-gray-900">TMR Auto Elétrica</Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link href="/" className="border-transparent text-gray-900 hover:border-gray-300 hover:text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Dashboard
                </Link>
                <Link href="/estoque" className="border-transparent text-gray-900 hover:border-gray-300 hover:text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Estoque
                </Link>
                <Link href="/vendas" className="border-transparent text-gray-900 hover:border-gray-300 hover:text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Vendas
                </Link>
                <Link href="/relatorios" className="border-indigo-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Relatórios
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Relatórios</h1>
            <button
              onClick={exportToCSV}
              disabled={movements.length === 0}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Exportar CSV
            </button>
          </div>

          {/* Filtros de Data */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Filtros</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900">Data Inicial</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900">Data Final</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-gray-900"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-900 hover:bg-gray-50"
                >
                  Limpar Filtros
                </button>
              </div>
            </div>
          </div>

          {/* Abas */}
          <div className="mb-6">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-900 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                Visão Geral
              </button>
              <button
                onClick={() => setActiveTab('movements')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'movements'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-900 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                Movimentações
              </button>
              <button
                onClick={() => setActiveTab('products')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'products'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-900 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                Produtos
              </button>
            </nav>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-gray-900">Carregando relatórios...</p>
            </div>
          ) : (
            <>
              {/* Visão Geral */}
              {activeTab === 'overview' && stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-blue-500 rounded"></div>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-900 truncate">Total de Produtos</dt>
                            <dd className="text-lg font-medium text-gray-900">{stats.totalProducts || 0}</dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-green-500 rounded"></div>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-900 truncate">Itens em Estoque</dt>
                            <dd className="text-lg font-medium text-gray-900">{stats.totalStock || 0}</dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-purple-500 rounded"></div>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-900 truncate">Total de Vendas</dt>
                            <dd className="text-lg font-medium text-gray-900">{stats.totalSales || 0}</dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-yellow-500 rounded"></div>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-900 truncate">Receita Total</dt>
                            <dd className="text-lg font-medium text-gray-900">
                              {formatCurrency(stats.totalRevenue || 0)}
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Movimentações */}
              {activeTab === 'movements' && (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                  <ul className="divide-y divide-gray-200">
                    {movements.length === 0 ? (
                      <li className="px-6 py-12 text-center">
                        <p className="text-gray-900">Nenhuma movimentação encontrada no período.</p>
                      </li>
                    ) : (
                      movements.map((movement) => (
                        <li key={movement.id} className="px-6 py-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center">
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900">{movement.productName}</p>
                                  <p className="text-sm text-gray-900">
                                    {movement.productCode} • {movement.date} • {movement.reference}
                                  </p>
                                </div>
                                <div className="ml-4 flex flex-col items-end">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    movement.type === 'entrada'
                                      ? 'text-green-600 bg-green-100'
                                      : 'text-red-600 bg-red-100'
                                  }`}>
                                    {movement.type === 'entrada' ? 'Entrada' : 'Saída'}
                                  </span>
                                  <span className="text-sm text-gray-900 mt-1">
                                    Qtd: {movement.quantity} × {formatCurrency(parseFloat(movement.unitPrice))}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="ml-4 text-right">
                              <p className="text-sm font-medium text-gray-900">
                                {formatCurrency(movement.quantity * parseFloat(movement.unitPrice))}
                              </p>
                            </div>
                          </div>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              )}

              {/* Produtos Mais Vendidos */}
              {activeTab === 'products' && (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                  <ul className="divide-y divide-gray-200">
                    {topProducts.length === 0 ? (
                      <li className="px-6 py-12 text-center">
                        <p className="text-gray-900">Nenhuma venda encontrada no período.</p>
                      </li>
                    ) : (
                      topProducts.map((product, index) => (
                        <li key={product.productCode} className="px-6 py-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                {index + 1}
                              </div>
                              <div className="ml-4">
                                <p className="text-sm font-medium text-gray-900">{product.productName}</p>
                                <p className="text-sm text-gray-900">{product.productCode}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-8">
                              <div className="text-right">
                                <p className="text-sm text-gray-900">Quantidade Vendida</p>
                                <p className="text-lg font-medium text-gray-900">{product.totalSold}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-gray-900">Receita</p>
                                <p className="text-lg font-medium text-green-600">
                                  {formatCurrency(product.totalRevenue)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
