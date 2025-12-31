'use client';
import { useState } from 'react';

export default function SalesPage() {
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [sales, setSales] = useState([]);

  const declareSale = async () => {
    const totalPrice = quantity * unitPrice;
    await fetch('/api/sales', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity, unitPrice: unitPrice.toString(), totalPrice: totalPrice.toString() }),
      headers: { 'Content-Type': 'application/json' },
    });
    loadSales();
  };

  const cancelSale = async (id: string) => {
    await fetch('/api/sales', {
      method: 'PUT',
      body: JSON.stringify({ id, status: 'cancelled' }),
      headers: { 'Content-Type': 'application/json' },
    });
    loadSales();
  };

  const loadSales = async () => {
    const res = await fetch('/api/sales');
    const data = await res.json();
    setSales(data);
  };

  return (
    <div>
      <h1>Vendas</h1>
      <input placeholder="Product ID" value={productId} onChange={(e) => setProductId(e.target.value)} />
      <input type="number" placeholder="Quantity" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
      <input type="number" placeholder="Unit Price" value={unitPrice} onChange={(e) => setUnitPrice(Number(e.target.value))} />
      <button onClick={declareSale}>Declarar Venda</button>
      <ul>
        {sales.map((sale) => (
          <li key={sale.id}>
            {sale.productId} - {sale.quantity} - {sale.status}
            {sale.status === 'active' && <button onClick={() => cancelSale(sale.id)}>Cancelar</button>}
          </li>
        ))}
      </ul>
    </div>
  );
}