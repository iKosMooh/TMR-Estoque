'use client';

import { useEffect, useState } from 'react';
import { fetchChartsData } from '@/lib/api'; // Ajuste o caminho conforme necessário

export default function DashboardPage() {
  const [topSales, setTopSales] = useState([]);
  const [entriesVsExits, setEntriesVsExits] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      const res = await fetch('/api/dashboard');
      const data = await res.json();
      setTopSales(data.topSales || []);
      setEntriesVsExits(data.entriesVsExits || []);
    };
    loadData();
  }, []);

  return (
    <div>
      <h1>Dashboard</h1>
      {topSales.length === 0 && <p>Nenhum dado disponível</p>}
      {/* Renderizar gráfico de vendas com dados de topSales */}
      {entriesVsExits.length === 0 && <p>Nenhum movimento encontrado</p>}
      {/* Renderizar gráfico de entradas/saídas com dados de entriesVsExits */}
    </div>
  );
}