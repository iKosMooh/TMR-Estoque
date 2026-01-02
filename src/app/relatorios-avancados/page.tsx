'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { LoadingState } from '@/components/Loading';
import { Animated } from '@/components/Animated';
import { 
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { DocumentReportIcon, TrendingUpIcon, TrendingDownIcon } from '@/components/Icons';

interface Movement {
  date: string;
  entradas: number;
  saidas: number;
  saldo: number;
}

export default function AdvancedReports() {
  const [loading, setLoading] = useState(true);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    fetchMovements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const fetchMovements = async () => {
    setLoading(true);
    try {
      const endDate = new Date();
      const startDate = new Date();
      
      switch (period) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
      }

      const response = await fetch(`/api/reports?startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}`);
      if (response.ok) {
        const data = await response.json();
        
        // Agrupar movimentações por data
        const movementsByDate = new Map<string, { entradas: number; saidas: number }>();
        
        data.movements.forEach((mov: { date: string; type: string; quantity: number }) => {
          const date = mov.date;
          const current = movementsByDate.get(date) || { entradas: 0, saidas: 0 };
          
          if (mov.type === 'entrada') {
            current.entradas += mov.quantity;
          } else {
            current.saidas += mov.quantity;
          }
          
          movementsByDate.set(date, current);
        });

        // Converter para array e calcular saldo
        let saldo = 0;
        const chartData: Movement[] = Array.from(movementsByDate.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, values]) => {
            saldo += values.entradas - values.saidas;
            return {
              date: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
              entradas: values.entradas,
              saidas: values.saidas,
              saldo,
            };
          });

        setMovements(chartData);
      }
    } catch (error) {
      console.error('Erro ao buscar movimentações:', error);
    } finally {
      setLoading(false);
    }
  };

  const totals = movements.reduce(
    (acc, mov) => ({
      entradas: acc.entradas + mov.entradas,
      saidas: acc.saidas + mov.saidas,
    }),
    { entradas: 0, saidas: 0 }
  );

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Animated animation="fade-in">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center">
              <DocumentReportIcon className="w-8 h-8 mr-3 text-blue-600 dark:text-blue-400" aria-hidden={true} />
              Relatórios Avançados
            </h1>
            <p className="text-gray-600 dark:text-gray-400">Análise detalhada de movimentações ao longo do tempo</p>
          </div>
        </Animated>

        {/* Filtros de Período */}
        <Animated animation="slide-down" delay={100}>
          <Card className="mb-6">
            <Card.Body>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Período:</span>
                <div className="flex gap-2">
                  <Button
                    variant={period === '7d' ? 'primary' : 'secondary'}
                    onClick={() => setPeriod('7d')}
                    size="sm"
                  >
                    7 Dias
                  </Button>
                  <Button
                    variant={period === '30d' ? 'primary' : 'secondary'}
                    onClick={() => setPeriod('30d')}
                    size="sm"
                  >
                    30 Dias
                  </Button>
                  <Button
                    variant={period === '90d' ? 'primary' : 'secondary'}
                    onClick={() => setPeriod('90d')}
                    size="sm"
                  >
                    90 Dias
                  </Button>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Animated>

        {loading ? (
          <LoadingState message="Carregando relatórios..." />
        ) : (
          <>
            {/* Cards de Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Animated animation="slide-up" delay={0}>
                <Card>
                  <Card.Body>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total de Entradas</p>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">{totals.entradas}</p>
                      </div>
                      <TrendingUpIcon className="w-12 h-12 text-green-500" aria-hidden={true} />
                    </div>
                  </Card.Body>
                </Card>
              </Animated>

              <Animated animation="slide-up" delay={100}>
                <Card>
                  <Card.Body>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total de Saídas</p>
                        <p className="text-2xl font-bold text-red-600 dark:text-red-400">{totals.saidas}</p>
                      </div>
                      <TrendingDownIcon className="w-12 h-12 text-red-500" aria-hidden={true} />
                    </div>
                  </Card.Body>
                </Card>
              </Animated>

              <Animated animation="slide-up" delay={200}>
                <Card>
                  <Card.Body>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Saldo Líquido</p>
                        <p className={`text-2xl font-bold ${totals.entradas - totals.saidas >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {totals.entradas - totals.saidas}
                        </p>
                      </div>
                      <DocumentReportIcon className="w-12 h-12 text-blue-500" aria-hidden={true} />
                    </div>
                  </Card.Body>
                </Card>
              </Animated>
            </div>

            {/* Gráfico de Linha - Movimentações ao Longo do Tempo */}
            <Animated animation="scale" delay={300}>
              <Card className="mb-8">
                <Card.Header>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Movimentações ao Longo do Tempo</h2>
                </Card.Header>
                <Card.Body>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={movements}>
                      <CartesianGrid strokeDasharray="3 3" className="dark:stroke-gray-700" />
                      <XAxis dataKey="date" className="dark:fill-gray-400" />
                      <YAxis className="dark:fill-gray-400" />
                      <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} />
                      <Legend />
                      <Line type="monotone" dataKey="entradas" stroke="#10b981" name="Entradas" strokeWidth={2} />
                      <Line type="monotone" dataKey="saidas" stroke="#ef4444" name="Saídas" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </Card.Body>
              </Card>
            </Animated>

            {/* Gráfico de Área - Saldo Acumulado */}
            <Animated animation="scale" delay={400}>
              <Card>
                <Card.Header>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Saldo Acumulado</h2>
                </Card.Header>
                <Card.Body>
                  <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={movements}>
                      <CartesianGrid strokeDasharray="3 3" className="dark:stroke-gray-700" />
                      <XAxis dataKey="date" className="dark:fill-gray-400" />
                      <YAxis className="dark:fill-gray-400" />
                      <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} />
                      <Legend />
                      <Area type="monotone" dataKey="saldo" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} name="Saldo" />
                    </AreaChart>
                  </ResponsiveContainer>
                </Card.Body>
              </Card>
            </Animated>
          </>
        )}
      </main>
  );
}
