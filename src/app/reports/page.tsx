'use client';

import { useEffect, useState } from 'react';

const ReportsPage = () => {
  const [movements, setMovements] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    loadMovements();
    loadProducts();
  }, []);

  const loadMovements = async () => {
    const res = await fetch('/api/movements'); // Garantir que API retorne dados
    const data = await res.json();
    setMovements(data);
  };

  const loadProducts = async () => {
    const res = await fetch('/api/products'); // Garantir que API retorne dados
    const data = await res.json();
    setProducts(data);
  };

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