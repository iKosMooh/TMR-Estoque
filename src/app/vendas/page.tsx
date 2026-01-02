'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';

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
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-foreground mb-6">Registro de Vendas</h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Lado esquerdo - Busca e adição de produtos */}
            <div>
              <Card className="bg-level-1 mb-6">
                <Card.Header>
                  <h2 className="text-lg font-medium text-card-foreground">Buscar Produto</h2>
                </Card.Header>
                <Card.Body>
                  <div>
                    <Input
                      type="text"
                      placeholder="Digite nome, código interno ou código de barras..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  {searchTerm && (
                    <div className="max-h-60 overflow-y-auto border border-border rounded-lg bg-level-2">
                      {filteredProducts.length === 0 ? (
                        <p className="p-4 text-muted-foreground text-center">Nenhum produto encontrado</p>
                      ) : (
                        filteredProducts.map((product) => (
                          <div
                            key={product.id}
                            onClick={() => {
                              setSelectedProduct(product);
                              setSearchTerm(product.name);
                            }}
                            className="p-3 hover:bg-level-3 cursor-pointer border-b border-border last:border-b-0 transition-colors"
                          >
                            <div className="font-medium text-foreground">{product.name}</div>
                            <div className="text-sm text-muted-foreground">
                              Código: {product.internalCode} | Estoque: {product.currentQuantity} |
                              Preço: R$ {parseFloat(product.salePrice).toFixed(2)}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {selectedProduct && (
                    <div className="bg-info/10 border border-info/20 p-4 rounded-lg">
                      <h3 className="font-medium text-info mb-2">Produto Selecionado:</h3>
                      <p className="text-foreground font-semibold">{selectedProduct.name}</p>
                      <p className="text-sm text-muted-foreground mb-3">
                        Preço: R$ {parseFloat(selectedProduct.salePrice).toFixed(2)} |
                        Estoque: {selectedProduct.currentQuantity}
                      </p>

                      <div className="flex items-center gap-3">
                        <Input
                          type="number"
                          min="1"
                          max={selectedProduct.currentQuantity}
                          value={quantity.toString()}
                          onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                          className="w-24"
                          label="Quantidade"
                        />
                        <div className="mt-6">
                          <Button
                            onClick={addToSale}
                            variant="success"
                          >
                            Adicionar
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </div>

            {/* Lado direito - Carrinho de vendas */}
            <div>
              <Card className="bg-level-1">
                <Card.Header>
                  <h2 className="text-lg font-medium text-card-foreground">Itens da Venda</h2>
                </Card.Header>
                <Card.Body>

                {saleItems.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Nenhum item adicionado</p>
                ) : (
                  <div className="space-y-3 mb-6">
                    {saleItems.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-level-2 hover:bg-level-3 rounded-lg border border-border transition-colors">
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{item.product.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Qtd: {item.quantity} × R$ {item.unitPrice.toFixed(2)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="font-semibold text-foreground">
                            R$ {item.total.toFixed(2)}
                          </span>
                          <button
                            onClick={() => removeFromSale(index)}
                            className="text-error hover:text-error/80 font-bold text-lg transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {saleItems.length > 0 && (
                  <div className="border-t border-border pt-4 mt-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-lg font-medium text-foreground">Total:</span>
                      <span className="text-2xl font-bold text-success">
                        R$ {getTotalSale().toFixed(2)}
                      </span>
                    </div>

                    <Button
                      onClick={processSale}
                      disabled={isProcessing}
                      variant="success"
                      className="w-full py-3"
                    >
                      {isProcessing ? 'Processando...' : 'Finalizar Venda'}
                    </Button>
                  </div>
                )}
                </Card.Body>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
