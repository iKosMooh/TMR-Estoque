'use client';

import { useEffect } from 'react';
import { useNotifications } from '@/contexts/NotificationContext';

interface Product {
  name: string;
  currentQuantity: number;
  lowStockThreshold?: number;
}

export const useStockAlerts = (products: Product[]) => {
  const { addNotification } = useNotifications();

  useEffect(() => {
    if (!products || products.length === 0) return;

    // Verificar produtos com estoque baixo
    const lowStockProducts = products.filter(
      (p) => p.currentQuantity <= (p.lowStockThreshold || 5)
    );

    // Adicionar notificações para produtos com estoque baixo
    lowStockProducts.forEach((product) => {
      if (product.currentQuantity === 0) {
        addNotification({
          title: 'Estoque Zerado!',
          message: `O produto "${product.name}" está sem estoque.`,
          type: 'error',
        });
      } else {
        addNotification({
          title: 'Estoque Baixo',
          message: `O produto "${product.name}" está com apenas ${product.currentQuantity} unidades.`,
          type: 'warning',
        });
      }
    });
  }, [products, addNotification]);
};

export const useProductUpdates = () => {
  const { addNotification } = useNotifications();

  const notifyProductAdded = (productName: string) => {
    addNotification({
      title: 'Produto Adicionado',
      message: `"${productName}" foi adicionado ao estoque com sucesso.`,
      type: 'success',
    });
  };

  const notifyProductUpdated = (productName: string) => {
    addNotification({
      title: 'Produto Atualizado',
      message: `"${productName}" foi atualizado com sucesso.`,
      type: 'success',
    });
  };

  const notifyStockMovement = (productName: string, type: 'entrada' | 'saida', quantity: number) => {
    addNotification({
      title: type === 'entrada' ? 'Entrada Registrada' : 'Saída Registrada',
      message: `${type === 'entrada' ? 'Adicionado' : 'Removido'} ${quantity} unidades de "${productName}".`,
      type: 'info',
    });
  };

  return {
    notifyProductAdded,
    notifyProductUpdated,
    notifyStockMovement,
  };
};
