'use client';

import { useEffect, useState } from 'react';

const ReportsPage = () => {
  const [movements, setMovements] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [movementsRes, productsRes] = await Promise.all([
          fetch('/api/movements'),
          fetch('/api/products')
        ]);

        const movementsData = await movementsRes.json();
        const productsData = await productsRes.json();

        setMovements(movementsData);
        setProducts(productsData);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      }
    };

    loadData();
  }, []);

  return (
    <div>
      <h1>Relatórios</h1>
      <h2>Movimentos</h2>
      <pre>{JSON.stringify(movements, null, 2)}</pre>
      <h2>Produtos</h2>
      <pre>{JSON.stringify(products, null, 2)}</pre>
    </div>
  );
};

export default ReportsPage;