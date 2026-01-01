'use client';

import { useState, useEffect } from 'react';

interface Product {
  id: string;
  internalCode: string;
  barcode: string | null;
  name: string;
  description: string | null;
  salePrice: string;
  costPrice: string;
  currentQuantity: number;
  totalEntry: number;
  totalExit: number;
  lastPurchaseDate: string | null;
  ncm: string | null;
  lowStockThreshold: number;
  batches: Array<{
    id: string;
    purchaseDate: string;
    costPrice: string;
    sellingPrice: string;
    quantityReceived: number;
    quantityRemaining: number;
    xmlReference: string | null;
  }>;
}

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/products');
      
      if (!response.ok) {
        throw new Error('Erro ao buscar produtos');
      }
      
      const data = await response.json();
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return {
    products,
    loading,
    error,
    refetch: fetchProducts,
  };
};
