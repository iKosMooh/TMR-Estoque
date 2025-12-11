'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Product {
  id: string;
  internalCode: string;
  barcode: string | null;
  name: string;
  salePrice: string;
  currentQuantity: number;
  lowStockThreshold: number;
}

interface SaleItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  total: number;
}

export default function Vendas() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      if (response.ok) {
        const data = await response.json();
        setProducts(data.filter((p: Product) => p.currentQuantity > 0));
      }
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.internalCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.barcode && product.barcode.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const addToSale = () => {
    if (!selectedProduct || quantity <= 0) return;

    if (quantity > selectedProduct.currentQuantity) {
      alert('Quantidade insuficiente em estoque!');
      return;
    }

    const unitPrice = parseFloat(selectedProduct.salePrice);
    const total = unitPrice * quantity;

    const newItem: SaleItem = {
      product: selectedProduct,
      quantity,
      unitPrice,
      total,
    };

    setSaleItems([...saleItems, newItem]);
    setSelectedProduct(null);
    setQuantity(1);
    setSearchTerm('');
  };

  const removeFromSale = (index: number) => {
    setSaleItems(saleItems.filter((_, i) => i !== index));
  };

  const getTotalSale = () => {
    return saleItems.reduce((sum, item) => sum + item.total, 0);
  };

  const processSale = async () => {
    if (saleItems.length === 0) return;

    setIsProcessing(true);
    try {
      const promises = saleItems.map(item =>
        fetch('/api/sales', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            productId: item.product.id,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          }),
        })
      );

      const results = await Promise.all(promises);
      const failures = results.filter(r => !r.ok);

      if (failures.length === 0) {
        alert('Venda realizada com sucesso!');
        setSaleItems([]);
        fetchProducts(); // Recarregar produtos para atualizar quantidades
      } else {
        alert('Erro ao processar algumas vendas. Verifique o estoque.');
      }
    } catch (error) {
      console.error('Erro ao processar venda:', error);
      alert('Erro ao processar venda.');
    } finally {
      setIsProcessing(false);
    }
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
                <Link href="/vendas" className="border-indigo-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
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

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Registro de Vendas</h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Lado esquerdo - Busca e adição de produtos */}
            <div>
              <div className="bg-white shadow rounded-lg p-6 mb-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Buscar Produto</h2>

                <div className="space-y-4">
                  <div>
                    <input
                      type="text"
                      placeholder="Digite nome, código interno ou código de barras..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  {searchTerm && (
                    <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md">
                      {filteredProducts.length === 0 ? (
                        <p className="p-4 text-gray-900 text-center">Nenhum produto encontrado</p>
                      ) : (
                        filteredProducts.map((product) => (
                          <div
                            key={product.id}
                            onClick={() => {
                              setSelectedProduct(product);
                              setSearchTerm(product.name);
                            }}
                            className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                          >
                            <div className="font-medium text-gray-900">{product.name}</div>
                            <div className="text-sm text-gray-900">
                              Código: {product.internalCode} | Estoque: {product.currentQuantity} |
                              Preço: R$ {parseFloat(product.salePrice).toFixed(2)}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {selectedProduct && (
                    <div className="bg-blue-50 p-4 rounded-md">
                      <h3 className="font-medium text-blue-900">Produto Selecionado:</h3>
                      <p className="text-blue-800">{selectedProduct.name}</p>
                      <p className="text-sm text-blue-600">
                        Preço: R$ {parseFloat(selectedProduct.salePrice).toFixed(2)} |
                        Estoque: {selectedProduct.currentQuantity}
                      </p>

                      <div className="mt-3 flex items-center space-x-2">
                        <label className="text-sm font-medium text-blue-900">Quantidade:</label>
                        <input
                          type="number"
                          min="1"
                          max={selectedProduct.currentQuantity}
                          value={quantity}
                          onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                          className="w-20 px-2 py-1 border border-blue-300 rounded text-center"
                        />
                        <button
                          onClick={addToSale}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                        >
                          Adicionar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Lado direito - Carrinho de vendas */}
            <div>
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Itens da Venda</h2>

                {saleItems.length === 0 ? (
                  <p className="text-gray-900 text-center py-8">Nenhum item adicionado</p>
                ) : (
                  <div className="space-y-3 mb-6">
                    {saleItems.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{item.product.name}</p>
                          <p className="text-sm text-gray-900">
                            Qtd: {item.quantity} × R$ {item.unitPrice.toFixed(2)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900">
                            R$ {item.total.toFixed(2)}
                          </span>
                          <button
                            onClick={() => removeFromSale(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {saleItems.length > 0 && (
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-lg font-medium text-gray-900">Total:</span>
                      <span className="text-2xl font-bold text-green-600">
                        R$ {getTotalSale().toFixed(2)}
                      </span>
                    </div>

                    <button
                      onClick={processSale}
                      disabled={isProcessing}
                      className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      {isProcessing ? 'Processando...' : 'Finalizar Venda'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
