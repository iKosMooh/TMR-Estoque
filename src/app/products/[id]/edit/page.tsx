'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR, { mutate } from 'swr';
import { fetcher } from '@/lib/fetcher';

export default function EditProduct({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: product, error } = useSWR(`/api/products/${params.id}`, fetcher);

  const [quantity, setQuantity] = useState(product?.currentQuantity || 0);

  if (error) return <div>Falha ao carregar produto</div>;
  if (!product) return <div>Carregando...</div>;

  const handleSave = async () => {
    await fetch(`/api/products`, {
      method: 'PUT',
      body: JSON.stringify({ id: params.id, quantity }),
      headers: { 'Content-Type': 'application/json' },
    });
    mutate(`/api/products/${params.id}`);
    router.push('/products');
  };

  return (
    <div>
      <h1>Editar Produto</h1>
      <div>
        <label>
          Nome:
          <input type="text" value={product.name} readOnly />
        </label>
      </div>
      <div>
        <label>
          Quantidade:
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
          />
        </label>
      </div>
      <button onClick={handleSave}>Salvar</button>
      <button onClick={() => router.push('/products')}>Cancelar</button>
    </div>
  );
}