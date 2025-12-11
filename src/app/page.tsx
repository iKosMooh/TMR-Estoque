'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DashboardStats {
  totalProducts: number;
  totalStock: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  totalSales: number;
  todaySales: number;
}

interface MovementData {
  date: string;
  entradas: number;
  saidas: number;
  total: number;
}

interface CategoryData {
  name: string;
  value: number;
  color: string;
  [key: string]: any;
}

export default function Home() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalStock: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0,
    totalSales: 0,
    todaySales: 0
  });
  const [movementData, setMovementData] = useState<MovementData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [showCharts, setShowCharts] = useState(true);
  const [showPieChart, setShowPieChart] = useState(true);
  const [showBarChart, setShowBarChart] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [startDate, endDate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Buscar produtos para estatísticas básicas
      const productsResponse = await fetch('/api/products');
      const products = productsResponse.ok ? await productsResponse.json() : [];

      // Buscar dados de relatórios para gráficos
      const reportsResponse = await fetch(`/api/reports?startDate=${startDate}&endDate=${endDate}`);
      const reportsData = reportsResponse.ok ? await reportsResponse.json() : { movements: [], stats: {} };

      // Calcular estatísticas
      const totalProducts = products.length;
      const totalStock = products.reduce((sum: number, p: any) => sum + p.currentQuantity, 0);
      const lowStockProducts = products.filter((p: any) => p.currentQuantity > 0 && p.currentQuantity <= (p.lowStockThreshold || 5)).length;
      const outOfStockProducts = products.filter((p: any) => p.currentQuantity === 0).length;

      // Calcular vendas totais e de hoje
      const today = format(new Date(), 'yyyy-MM-dd');
      const todayMovements = reportsData.movements?.filter((m: any) => m.date === today && m.type === 'saida') || [];
      const todaySales = todayMovements.reduce((sum: number, m: any) => sum + (parseFloat(m.unitPrice) * m.quantity), 0);

      setStats({
        totalProducts,
        totalStock,
        lowStockProducts,
        outOfStockProducts,
        totalSales: reportsData.stats?.totalSales || 0,
        todaySales
      });

      // Processar dados para gráficos
      processChartData(reportsData.movements || []);

    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const processChartData = (movements: any[]) => {
    // Processar dados de movimentos por data
    const dateMap = new Map<string, { entradas: number; saidas: number }>();

    movements.forEach(movement => {
      const date = movement.date;
      if (!dateMap.has(date)) {
        dateMap.set(date, { entradas: 0, saidas: 0 });
      }

      const value = parseFloat(movement.unitPrice) * movement.quantity;
      if (movement.type === 'entrada') {
        dateMap.get(date)!.entradas += value;
      } else if (movement.type === 'saida') {
        dateMap.get(date)!.saidas += value;
      }
    });

    const movementChartData: MovementData[] = Array.from(dateMap.entries())
      .map(([date, values]) => ({
        date: format(new Date(date), 'dd/MM', { locale: ptBR }),
        entradas: values.entradas,
        saidas: values.saidas,
        total: values.entradas + values.saidas
      }))
      .sort((a, b) => new Date(a.date.split('/').reverse().join('-')).getTime() - new Date(b.date.split('/').reverse().join('-')).getTime());

    setMovementData(movementChartData);

    // Processar dados para gráfico de pizza (categorias de produtos)
    const categoryMap = new Map<string, number>();
    movements.forEach(movement => {
      if (movement.type === 'saida') {
        const category = movement.product?.name?.substring(0, 20) || 'Outros';
        const value = parseFloat(movement.unitPrice) * movement.quantity;
        categoryMap.set(category, (categoryMap.get(category) || 0) + value);
      }
    });

    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#ff0000', '#0000ff', '#ffff00'];
    const categoryChartData: CategoryData[] = Array.from(categoryMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8) // Top 8 categorias
      .map(([name, value], index) => ({
        name,
        value,
        color: colors[index % colors.length]
      }));

    setCategoryData(categoryChartData);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-900">TMR Auto Elétrica</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link href="/" className="border-indigo-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Dashboard
                </Link>
                <Link href="/estoque" className="border-transparent text-gray-900 hover:border-gray-300 hover:text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Estoque
                </Link>
                <Link href="/vendas" className="border-transparent text-gray-900 hover:border-gray-300 hover:text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Vendas
                </Link>
                <Link href="/relatorios" className="border-transparent text-gray-900 hover:border-gray-300 hover:text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Relatórios
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded"></div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-900 truncate">Estoque Total</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.totalStock}</dd>
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
                      <dt className="text-sm font-medium text-gray-900 truncate">Vendas Hoje</dt>
                      <dd className="text-lg font-medium text-gray-900">R$ {stats.todaySales.toFixed(2)}</dd>
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
                      <dt className="text-sm font-medium text-gray-900 truncate">Produtos Baixo Estoque</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.lowStockProducts}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-red-500 rounded"></div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-900 truncate">Produtos Esgotados</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.outOfStockProducts}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Controles de Filtros e Gráficos */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">Análises e Gráficos</h2>
              <button
                onClick={() => setShowCharts(!showCharts)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                {showCharts ? 'Ocultar Gráficos' : 'Mostrar Gráficos'}
              </button>
            </div>

            {/* Filtros de Data */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Data Inicial</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Data Final</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="flex items-end space-x-2">
                <button
                  onClick={() => setShowPieChart(!showPieChart)}
                  className={`px-3 py-2 rounded text-sm ${showPieChart ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-900'}`}
                >
                  {showPieChart ? 'Ocultar Pizza' : 'Mostrar Pizza'}
                </button>
                <button
                  onClick={() => setShowBarChart(!showBarChart)}
                  className={`px-3 py-2 rounded text-sm ${showBarChart ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-900'}`}
                >
                  {showBarChart ? 'Ocultar Barras' : 'Mostrar Barras'}
                </button>
              </div>
            </div>

            {showCharts && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Gráfico de Pizza - Vendas por Categoria */}
                {showPieChart && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-md font-medium text-gray-900 mb-4">Vendas por Produto (Top 8)</h3>
                    {loading ? (
                      <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                      </div>
                    ) : categoryData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={categoryData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {categoryData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Valor']} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex justify-center items-center h-64 text-gray-900">
                        Nenhum dado disponível para o período selecionado
                      </div>
                    )}
                  </div>
                )}

                {/* Gráfico de Barras - Movimentos por Data */}
                {showBarChart && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-md font-medium text-gray-900 mb-4">Entradas vs Saídas por Data</h3>
                    {loading ? (
                      <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                      </div>
                    ) : movementData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={movementData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip formatter={(value: number) => [`R$ ${value.toFixed(2)}`, '']} />
                          <Legend />
                          <Bar dataKey="entradas" fill="#82ca9d" name="Entradas" />
                          <Bar dataKey="saidas" fill="#8884d8" name="Saídas" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex justify-center items-center h-64 text-gray-900">
                        Nenhum movimento encontrado no período selecionado
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Ações Rápidas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/estoque" className="bg-green-500 text-white px-4 py-2 rounded text-center hover:bg-green-600">
                Gerenciar Estoque
              </Link>
              <Link href="/vendas" className="bg-purple-500 text-white px-4 py-2 rounded text-center hover:bg-purple-600">
                Registrar Venda
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
