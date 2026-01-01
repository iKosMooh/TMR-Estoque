'use client';

import { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { Navigation } from '@/components/Navigation';
import { SearchBar } from '@/components/SearchBar';
import { Button } from '@/components/Button';
import { LoadingState } from '@/components/Loading';
import { EmptyState } from '@/components/EmptyState';
import { Modal } from '@/components/Modal';

interface ProductFormData {
  internalCode: string;
  barcode: string;
  name: string;
  description: string;
  salePrice: string;
  costPrice: string;
  currentQuantity: number;
  lowStockThreshold: number;
}

interface BatchFormData {
  id: string;
  costPrice: string;
  sellingPrice: string;
  quantityReceived: number;
  quantityRemaining: number;
  purchaseDate: string;
}

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

interface PreviewItem {
  internalCode?: string;
  barcode?: string;
  name?: string;
  ncm?: string;
  cfop?: string;
  cst?: string;
  salePrice: number;
  quantity: number;
  existing: {
    id: string;
    currentQuantity?: number;
  } | null;
  action: 'create' | 'update';
}

interface PreviewResult {
  xmlType: string;
  totalItems: number;
  previewItems: PreviewItem[];
  fileName: string;
}

interface ImportResult {
  success: boolean;
  message: string;
  results: {
    created: number;
    updated: number;
    errors: string[];
    movements: {
      id: string;
      type: string;
      quantity: number;
      date: string;
    }[];
  };
}

export default function Estoque() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<PreviewResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [editedImportItems, setEditedImportItems] = useState<{[key: number]: {salePrice: number; quantity: number}}>({});
  const [formData, setFormData] = useState<ProductFormData>({
    internalCode: '',
    barcode: '',
    name: '',
    description: '',
    salePrice: '',
    costPrice: '',
    currentQuantity: 0,
    lowStockThreshold: 5
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const [editingBatch, setEditingBatch] = useState<BatchFormData | null>(null);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showDeleteBatchModal, setShowDeleteBatchModal] = useState(false);
  const [batchToDelete, setBatchToDelete] = useState<string | null>(null);
  const [productIdForBatchDelete, setProductIdForBatchDelete] = useState<string | null>(null);
  const [deleteProductAfterBatch, setDeleteProductAfterBatch] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      toast.error('Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('Produto adicionado com sucesso!');
        setShowAddProductModal(false);
        resetForm();
        fetchProducts();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao adicionar produto');
      }
    } catch (error) {
      console.error('Erro ao adicionar produto:', error);
      toast.error('Erro ao adicionar produto');
    }
  };

  // Funções de edição/exclusão de produtos
  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      internalCode: product.internalCode,
      barcode: product.barcode || '',
      name: product.name,
      description: product.description || '',
      salePrice: product.salePrice,
      costPrice: product.costPrice,
      currentQuantity: product.currentQuantity,
      lowStockThreshold: product.lowStockThreshold
    });
    setShowEditProductModal(true);
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      const response = await fetch('/api/products', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingProduct.id,
          ...formData
        }),
      });

      if (response.ok) {
        toast.success('Produto atualizado com sucesso!');
        setEditingProduct(null);
        setShowEditProductModal(false);
        resetForm();
        fetchProducts();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao atualizar produto');
      }
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      toast.error('Erro ao atualizar produto');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      const response = await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
      const result = await response.json();
      if (result.success) {
        toast.success(result.message);
        fetchProducts();
      } else if (result.canForce) {
        setProductToDelete(id);
        setShowDeleteModal(true);
      } else {
        toast.error(result.message || 'Erro ao excluir produto');
      }
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      toast.error('Erro ao excluir produto');
    }
  };

  const confirmDelete = async (force: boolean) => {
    if (!force) {
      alert('Não é possível apagar só o produto com movimentações relacionadas.');
      return;
    }
    try {
      const response = await fetch(`/api/products?id=${productToDelete}&force=true`, { method: 'DELETE' });
      const result = await response.json();
      if (result.success) {
        toast.success(result.message);
        setShowDeleteModal(false);
        fetchProducts();
      } else {
        toast.error(result.message || 'Erro ao excluir produto');
      }
    } catch (error) {
      console.error('Erro ao confirmar exclusão:', error);
      toast.error('Erro ao confirmar exclusão');
    }
  };

  const resetForm = () => {
    setFormData({
      internalCode: '',
      barcode: '',
      name: '',
      description: '',
      salePrice: '',
      costPrice: '',
      currentQuantity: 0,
      lowStockThreshold: 5
    });
  };

  const cancelEdit = () => {
    setEditingProduct(null);
    setShowEditProductModal(false);
    resetForm();
  };

  const cancelAdd = () => {
    setShowAddProductModal(false);
    resetForm();
  };

  const handleEditBatch = (batch: Product['batches'][0]) => {
    setEditingBatch({
      id: batch.id,
      costPrice: batch.costPrice,
      sellingPrice: batch.sellingPrice,
      quantityReceived: batch.quantityReceived,
      quantityRemaining: batch.quantityRemaining,
      purchaseDate: batch.purchaseDate,
    });
    setShowBatchModal(true);
  };

  const handleUpdateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBatch) return;

    try {
      const response = await fetch('/api/batches', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingBatch),
      });

      if (response.ok) {
        toast.success('Lote atualizado com sucesso!');
        setShowBatchModal(false);
        setEditingBatch(null);
        fetchProducts();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao atualizar lote');
      }
    } catch (error) {
      console.error('Erro ao atualizar lote:', error);
      toast.error('Erro ao atualizar lote');
    }
  };

  const cancelBatchEdit = () => {
    setShowBatchModal(false);
    setEditingBatch(null);
  };

  const handleDeleteBatch = (batchId: string, productId: string) => {
    // Encontra o produto para verificar se tem mais lotes
    const product = products.find(p => p.id === productId);
    const willDeleteProduct = product ? product.batches.length === 1 : false;

    setBatchToDelete(batchId);
    setProductIdForBatchDelete(productId);
    setDeleteProductAfterBatch(willDeleteProduct);
    setShowDeleteBatchModal(true);
  };

  const executeDeleteBatch = async () => {
    if (!batchToDelete || !productIdForBatchDelete) return;

    try {
      // Primeiro, excluir o lote
      const batchResponse = await fetch(`/api/batches/${batchToDelete}`, {
        method: 'DELETE',
      });

      if (!batchResponse.ok) {
        const error = await batchResponse.json();
        toast.error(error.error || 'Erro ao excluir lote');
        return;
      }

      // Se é o último lote do produto, perguntar sobre excluir o produto
      if (deleteProductAfterBatch) {
        const productResponse = await fetch(`/api/products/${productIdForBatchDelete}`, {
          method: 'DELETE',
        });

        if (productResponse.ok) {
          toast.success('Lote e produto excluídos com sucesso!');
        } else {
          toast.success('Lote excluído com sucesso, mas houve erro ao excluir o produto');
        }
      } else {
        toast.success('Lote excluído com sucesso!');
      }

      // Recarregar produtos
      fetchProducts();
      setShowDeleteBatchModal(false);
      setBatchToDelete(null);
      setProductIdForBatchDelete(null);
      setDeleteProductAfterBatch(false);

    } catch (error) {
      console.error('Erro ao excluir lote:', error);
      toast.error('Erro ao excluir lote');
    }
  };

  const cancelDeleteBatch = () => {
    setShowDeleteBatchModal(false);
    setBatchToDelete(null);
    setProductIdForBatchDelete(null);
    setDeleteProductAfterBatch(false);
  };

  const handleImportPreview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) return;

    setImporting(true);
    const formData = new FormData();
    formData.append('file', importFile);

    try {
      const response = await fetch('/api/import/xml/preview', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || 'Erro na prévia');
        return;
      }

      const data: PreviewResult = await response.json();
      setImportPreview(data);
      setEditedImportItems({}); // Resetar edições para nova prévia
    } catch (error) {
      console.error('Erro ao gerar prévia:', error);
      toast.error('Erro ao gerar prévia');
    } finally {
      setImporting(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!importPreview) return;

    setImporting(true);
    try {
      // Aplicar as edições aos itens da prévia
      const editedPreview = {
        ...importPreview,
        previewItems: importPreview.previewItems.map((item, index) => ({
          ...item,
          salePrice: getEditedImportPrice(index, item.salePrice),
          quantity: getEditedImportQuantity(index, item.quantity),
        }))
      };

      const response = await fetch('/api/import/xml/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedPreview),
      });

      const data: ImportResult = await response.json();
      setImportPreview(null);
      if (data.success) {
        toast.success(data.message);
        setShowImportModal(false);
        setImportPreview(null);
        setImportFile(null);
        setEditedImportItems({});
        fetchProducts();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Erro ao confirmar importação:', error);
      toast.error('Erro ao confirmar importação');
    } finally {
      setImporting(false);
    }
  };

  const resetImport = () => {
    setImportFile(null);
    setImportPreview(null);
    setEditedImportItems({});
  };

  const handleImportPriceChange = (index: number, value: string) => {
    const numValue = parseFloat(value) || 0;
    if (numValue >= 0) {
      setEditedImportItems(prev => ({
        ...prev,
        [index]: { ...prev[index], salePrice: numValue }
      }));
    }
  };

  const handleImportQuantityChange = (index: number, value: string) => {
    const numValue = parseInt(value) || 0;
    if (numValue >= 0) {
      setEditedImportItems(prev => ({
        ...prev,
        [index]: { ...prev[index], quantity: numValue }
      }));
    }
  };

  const getEditedImportPrice = (index: number, originalPrice: number) => {
    return editedImportItems[index]?.salePrice ?? originalPrice;
  };

  const getEditedImportQuantity = (index: number, originalQuantity: number) => {
    return editedImportItems[index]?.quantity ?? originalQuantity;
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.internalCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.barcode && product.barcode.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStockStatus = (quantity: number, threshold: number): { text: string; variant: 'success' | 'warning' | 'danger'; color: string } => {
    if (quantity === 0) return { text: 'Esgotado', variant: 'danger', color: '#dc2626' }; // vermelho
    if (quantity <= threshold) return { text: 'Baixo', variant: 'warning', color: '#d97706' }; // amarelo/laranja
    return { text: 'Normal', variant: 'success', color: '#16a34a' }; // verde
  };

  const toggleProductDetails = (productId: string) => {
    setExpandedProduct(expandedProduct === productId ? null : productId);
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <Navigation />

      <main id="main-content" className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
            <h1 className="text-4xl font-bold text-foreground">Gerenciamento de Estoque</h1>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowImportModal(true)}
                className="px-6 py-2.5 text-white font-semibold rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-600 shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95"
                aria-label="Importar arquivo XML de nota fiscal"
              >
                📄 Importar XML
              </button>
              <button
                onClick={() => setShowAddProductModal(true)}
                className="px-6 py-2.5 text-white font-semibold rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-600 shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95"
                aria-label="Adicionar novo produto"
              >
                ➕ Adicionar Produto
              </button>
            </div>
          </div>

          {/* Barra de Pesquisa */}
          <div className="mb-6">
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Buscar por nome, código interno ou código de barras..."
            />
          </div>

          {/* Lista de Produtos */}
          {loading ? (
            <LoadingState message="Carregando produtos..." />
          ) : (
            <div className="bg-level-1 shadow-lg overflow-hidden sm:rounded-lg">
              <ul className="divide-y divide-border" role="list">
                {filteredProducts.length === 0 ? (
                  <li className="px-6 py-12 text-center">
                    <EmptyState
                      title="Nenhum produto encontrado"
                      description={searchTerm ? 'Tente ajustar os termos de busca ou adicione novos produtos.' : 'Comece adicionando seu primeiro produto ao estoque.'}
                      action={
                        !searchTerm && (
                          <Button onClick={() => setShowAddProductModal(true)} variant="primary">
                            Adicionar Primeiro Produto
                          </Button>
                        )
                      }
                    />
                  </li>
                ) : (
                  filteredProducts.map((product) => {
                    const stockStatus = getStockStatus(product.currentQuantity, product.lowStockThreshold);
                    const isExpanded = expandedProduct === product.id;
                    return (
                      <li key={product.id} className="px-3 py-3 bg-level-2 hover:bg-level-3 hover:scale-[1.02] transition-all duration-200 rounded-lg cursor-pointer" onClick={() => toggleProductDetails(product.id)}>
                        <div className="bg-card rounded-md p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center">
                                <div className="flex-1">
                                  <h3 className="text-lg font-semibold text-foreground cursor-pointer hover:text-primary transition-colors" onClick={() => toggleProductDetails(product.id)}>
                                    {product.name} {isExpanded ? '▼' : '▶'}
                                  </h3>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    Código: {product.internalCode}
                                    {product.barcode && ` | Barras: ${product.barcode}`}
                                  </p>
                                  {product.description && (
                                    <p className="text-sm text-muted-foreground mt-2">{product.description}</p>
                                  )}
                                </div>
                                <div className="ml-4 flex flex-col items-end space-y-1">
                                  <span
                                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white shadow-sm"
                                    style={{ backgroundColor: stockStatus.color }}
                                  >
                                    {stockStatus.text}
                                  </span>
                                  <span className="text-sm font-semibold text-foreground">
                                    Qtd: {product.currentQuantity}
                                  </span>
                                </div>
                              </div>
                            {isExpanded && product.batches.length > 0 && (
                              <div className="mt-4 bg-level-3 p-4 rounded-lg">
                                <h4 className="text-sm font-semibold text-foreground mb-3">Lotes:</h4>
                                <div className="space-y-2">
                                  {product.batches.map((batch) => (
                                    <div key={batch.id} className="flex items-center justify-between bg-level-2 p-3 rounded-md hover:bg-level-3 transition-colors">
                                      <div className="text-sm text-muted-foreground">
                                        <span className="font-medium">Data:</span> {batch.purchaseDate} | 
                                        <span className="font-medium"> Custo:</span> R$ {parseFloat(batch.costPrice).toFixed(2)} | 
                                        <span className="font-medium"> Venda:</span> R$ {parseFloat(batch.sellingPrice).toFixed(2)} | 
                                        <span className="font-medium"> Qtd Recebida:</span> {batch.quantityReceived} | 
                                        <span className="font-medium"> Restante:</span> {batch.quantityRemaining}
                                      </div>
                                      <div className="flex space-x-2">
                                        <button
                                          onClick={() => handleEditBatch(batch)}
                                          className="px-4 py-1.5 text-white font-semibold text-sm rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-600 shadow-md hover:shadow-lg transition-all duration-200 active:scale-95"
                                        >
                                          ✏️ Editar Lote
                                        </button>
                                        <button
                                          onClick={() => handleDeleteBatch(batch.id, product.id)}
                                          className="px-4 py-1.5 text-white font-semibold text-sm rounded-lg bg-gradient-to-r from-red-700 to-pink-700 hover:from-red-600 hover:to-pink-600 shadow-md hover:shadow-lg transition-all duration-200 active:scale-95"
                                        >
                                          🗑️ Excluir Lote
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {isExpanded && product.batches.length === 0 && (
                              <div className="mt-4 bg-level-1 p-4 rounded-lg">
                                <p className="text-sm text-muted-foreground">Nenhum lote disponível para este produto.</p>
                              </div>
                            )}
                            <div className="mt-2">
                              <div className="flex space-x-4 text-sm text-muted-foreground font-medium">
                                <span>Custo: R$ {parseFloat(product.costPrice).toFixed(2)}</span>
                                <span>Venda: R$ {parseFloat(product.salePrice).toFixed(2)}</span>
                                <span>Entradas: {product.totalEntry}</span>
                                <span>Saídas: {product.totalExit}</span>
                              </div>
                              {isExpanded && (
                                <div className="flex justify-end space-x-2 mt-3">
                                  <button
                                    onClick={() => handleEditProduct(product)}
                                    className="px-3 py-1 text-white font-semibold text-sm rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-600 shadow-md hover:shadow-lg transition-all duration-200 active:scale-95"
                                    title="Editar produto"
                                  >
                                    Editar Item
                                  </button>
                                  <button
                                    onClick={() => handleDeleteProduct(product.id)}
                                    className="px-3 py-1 text-white font-semibold text-sm rounded-lg bg-gradient-to-r from-red-700 to-pink-700 hover:from-red-600 hover:to-pink-600 shadow-md hover:shadow-lg transition-all duration-200 active:scale-95"
                                    title="Excluir produto"
                                  >
                                    Excluir Item
                                  </button>
                                </div>
                              )}
                            </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })
                )}
              </ul>
            </div>
          )}

          {/* Estatísticas */}
          {!loading && (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-card border border-border rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 border-2 border-blue-500 rounded flex items-center justify-center">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-muted-foreground truncate">Total de Produtos</dt>
                      <dd className="text-2xl font-bold text-foreground">{products.length}</dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 border-2 border-green-500 rounded flex items-center justify-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-muted-foreground truncate">Em Estoque</dt>
                      <dd className="text-2xl font-bold text-foreground">
                        {products.reduce((sum, p) => sum + p.currentQuantity, 0)}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 border-2 border-yellow-500 rounded flex items-center justify-center">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-muted-foreground truncate">Estoque Baixo</dt>
                      <dd className="text-2xl font-bold text-foreground">
                        {products.filter(p => p.currentQuantity > 0 && p.currentQuantity <= p.lowStockThreshold).length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 border-2 border-red-500 rounded flex items-center justify-center">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-muted-foreground truncate">Esgotados</dt>
                      <dd className="text-2xl font-bold text-foreground">
                        {products.filter(p => p.currentQuantity === 0).length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modal de Importação */}
      {showImportModal && (
        <div className="fixed inset-0 bg-background backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative bg-level-1 top-20 mx-auto p-5 border border-border w-11/12 max-w-4xl shadow-lg rounded-lg bg-card">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-card-foreground">Importar XML NF-e</h3>
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    resetImport();
                  }}
                  className="text-card-foreground hover:text-muted-foreground"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>

              {!importPreview && (
                <form onSubmit={handleImportPreview} className=" space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-card-foreground mb-2">
                      Selecione o arquivo XML
                    </label>
                    <input
                      type="file"
                      accept=".xml"
                      onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                      className="block w-full text-sm text-card-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                      required
                    />
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowImportModal(false);
                        resetImport();
                      }}
                      className="px-4 py-2 border border-border rounded-md text-card-foreground hover:bg-accent"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={!importFile || importing}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
                    >
                      {importing ? 'Gerando prévia...' : 'Gerar Prévia'}
                    </button>
                  </div>
                </form>
              )}

              {importPreview && (
                <div className="space-y-6">
                  <div className="bg-accent p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-card-foreground mb-2">Prévia da Importação</h4>
                    <p className="text-card-foreground"><strong className="text-card-foreground">Tipo de XML:</strong> {importPreview.xmlType}</p>
                    <p className="text-card-foreground"><strong className="text-card-foreground">Arquivo:</strong> {importPreview.fileName}</p>
                    <p className="text-card-foreground"><strong className="text-card-foreground">Total de itens:</strong> {importPreview.totalItems}</p>
                  </div>

                  <div className="bg-card border border-border rounded-lg overflow-hidden max-h-96 overflow-y-auto">
                    <table className="w-full">
                      <thead className="bg-muted sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left text-card-foreground font-medium">Código</th>
                          <th className="px-4 py-2 text-left text-card-foreground font-medium">Nome</th>
                          <th className="px-4 py-2 text-left text-card-foreground font-medium">Preço</th>
                          <th className="px-4 py-2 text-left text-card-foreground font-medium">Quantidade</th>
                          <th className="px-4 py-2 text-left text-card-foreground font-medium">Ação</th>
                          <th className="px-4 py-2 text-left text-card-foreground font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importPreview.previewItems.map((item, index) => (
                          <tr key={index} className="border-t border-border">
                            <td className="px-4 py-2 text-card-foreground">{item.internalCode || item.barcode}</td>
                            <td className="px-4 py-2 text-card-foreground">{item.name}</td>
                            <td className="px-4 py-2">
                              <div className="flex items-center">
                                <span className="mr-2 text-card-foreground">R$</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={getEditedImportPrice(index, item.salePrice).toFixed(2)}
                                  onChange={(e) => handleImportPriceChange(index, e.target.value)}
                                  className="w-28 px-2 py-1 border border-input rounded text-sm text-card-foreground bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                                  placeholder="0.00"
                                />
                              </div>
                            </td>
                            <td className="px-4 py-2">
                              <input
                                type="number"
                                min="0"
                                step="1"
                                value={getEditedImportQuantity(index, item.quantity)}
                                onChange={(e) => handleImportQuantityChange(index, e.target.value)}
                                className="w-24 px-2 py-1 border border-input rounded text-sm text-card-foreground bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                                placeholder="0"
                              />
                            </td>
                            <td className="px-4 py-2">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                item.action === 'create' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                              }`}>
                                {item.action === 'create' ? 'Criar' : 'Atualizar'}
                              </span>
                            </td>
                            <td className="px-4 py-2">
                              {item.existing ? (
                                <span className="text-orange-700 dark:text-orange-300 text-sm font-medium">
                                  Produto existente (estoque atual: {item.existing.currentQuantity || 0})
                                </span>
                              ) : (
                                <span className="text-green-700 dark:text-green-300 text-sm font-medium">Novo produto</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setImportPreview(null)}
                      className="px-4 py-2 border border-border rounded-md text-card-foreground hover:bg-accent"
                    >
                      Voltar
                    </button>
                    <button
                      onClick={handleConfirmImport}
                      disabled={importing}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
                    >
                      {importing ? 'Importando...' : 'Confirmar Importação'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição de Lote */}
      {showBatchModal && editingBatch && (
        <div className="fixed inset-0 bg-background backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border border-border w-11/12 max-w-2xl shadow-lg rounded-lg bg-card">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-card-foreground">Editar Lote</h3>
                <button
                  onClick={cancelBatchEdit}
                  className="text-card-foreground hover:text-muted-foreground"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>

              <form onSubmit={handleUpdateBatch} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-card-foreground">Data de Compra</label>
                    <input
                      type="date"
                      value={editingBatch.purchaseDate}
                      onChange={(e) => setEditingBatch({ ...editingBatch, purchaseDate: e.target.value })}
                      className="mt-1 block w-full border border-input rounded-md shadow-sm bg-background text-card-foreground focus:ring-2 focus:ring-ring focus:border-ring"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-card-foreground">Preço de Custo</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingBatch.costPrice}
                      onChange={(e) => setEditingBatch({ ...editingBatch, costPrice: e.target.value })}
                      className="mt-1 block w-full border border-input rounded-md shadow-sm bg-background text-card-foreground focus:ring-2 focus:ring-ring focus:border-ring"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-card-foreground">Preço de Venda</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingBatch.sellingPrice}
                      onChange={(e) => setEditingBatch({ ...editingBatch, sellingPrice: e.target.value })}
                      className="mt-1 block w-full border border-input rounded-md shadow-sm bg-background text-card-foreground focus:ring-2 focus:ring-ring focus:border-ring"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-card-foreground">Quantidade Recebida</label>
                    <input
                      type="number"
                      value={editingBatch.quantityReceived}
                      onChange={(e) => setEditingBatch({ ...editingBatch, quantityReceived: parseInt(e.target.value) || 0 })}
                      className="mt-1 block w-full border border-input rounded-md shadow-sm bg-background text-card-foreground focus:ring-2 focus:ring-ring focus:border-ring"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-card-foreground">Quantidade Restante</label>
                    <input
                      type="number"
                      value={editingBatch.quantityRemaining}
                      onChange={(e) => setEditingBatch({ ...editingBatch, quantityRemaining: parseInt(e.target.value) || 0 })}
                      className="mt-1 block w-full border border-input rounded-md shadow-sm bg-background text-card-foreground focus:ring-2 focus:ring-ring focus:border-ring"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={cancelBatchEdit}
                    className="px-4 py-2 border border-border rounded-md text-card-foreground hover:bg-accent"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                  >
                    Atualizar Lote
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Exclusão */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-background backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border border-border w-11/12 max-w-md shadow-lg rounded-lg bg-card">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-card-foreground">Excluir Produto</h3>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="text-card-foreground hover:text-muted-foreground"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>

              <p className="text-card-foreground mb-4">
                Este produto possui movimentações relacionadas. O que deseja fazer?
              </p>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => confirmDelete(false)}
                  className="px-4 py-2 border border-border rounded-md text-card-foreground hover:bg-accent"
                >
                  Apagar só o produto
                </button>
                <button
                  onClick={() => confirmDelete(true)}
                  className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90"
                >
                  Apagar produto e movimentações
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Exclusão de Lote */}
      <Modal
        isOpen={showDeleteBatchModal}
        onClose={cancelDeleteBatch}
        title="Confirmar Exclusão de Lote"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-card-foreground mb-2">
                Tem certeza que deseja excluir este lote?
              </h3>
              <p className="text-muted-foreground mb-4">
                Esta ação não pode ser desfeita. O lote será removido permanentemente do sistema.
              </p>

              {deleteProductAfterBatch && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-4">
                  <div className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-destructive mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <h4 className="font-medium text-destructive mb-1">
                        Este é o último lote do produto
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Ao excluir este lote, o produto também será removido do sistema.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-border">
            <button
              onClick={cancelDeleteBatch}
              className="px-4 py-2 border border-border rounded-md text-card-foreground hover:bg-accent transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={executeDeleteBatch}
              className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors"
            >
              {deleteProductAfterBatch ? 'Excluir Lote e Produto' : 'Excluir Lote'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal de Adição de Produto */}
      {showAddProductModal && (
        <div className="fixed inset-0 bg-background backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative bg-level-1 top-20 mx-auto p-5 border border-border w-11/12 max-w-2xl shadow-lg rounded-lg bg-[hsl(var(--card))] text-[hsl(var(--card-foreground))]">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-foreground">Adicionar Novo Produto</h3>
                <button
                  onClick={cancelAdd}
                  className="text-foreground hover:text-muted-foreground"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>

              <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground">Nome do Produto</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full bg-background border border-input rounded-md shadow-sm px-3 py-2 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground">Código Interno</label>
                  <input
                    type="text"
                    value={formData.internalCode}
                    onChange={(e) => setFormData({ ...formData, internalCode: e.target.value })}
                    className="mt-1 block w-full bg-background border border-input rounded-md shadow-sm px-3 py-2 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground">Código de Barras</label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="mt-1 block w-full bg-background border border-input rounded-md shadow-sm px-3 py-2 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground">Preço de Venda</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.salePrice}
                    onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                    className="mt-1 block w-full bg-background border border-input rounded-md shadow-sm px-3 py-2 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground">Preço de Custo</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                    className="mt-1 block w-full bg-background border border-input rounded-md shadow-sm px-3 py-2 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground">Quantidade Inicial</label>
                  <input
                    type="number"
                    value={formData.currentQuantity}
                    onChange={(e) => setFormData({ ...formData, currentQuantity: parseInt(e.target.value) || 0 })}
                    className="mt-1 block w-full bg-background border border-input rounded-md shadow-sm px-3 py-2 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground">Limite Estoque Baixo</label>
                  <input
                    type="number"
                    value={formData.lowStockThreshold}
                    onChange={(e) => setFormData({ ...formData, lowStockThreshold: parseInt(e.target.value) || 5 })}
                    className="mt-1 block w-full bg-background border border-input rounded-md shadow-sm px-3 py-2 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                    min="0"
                    placeholder="5"
                  />
                  <p className="mt-1 text-sm text-muted-foreground">Quantidade mínima para alertar estoque baixo (padrão: 5)</p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-foreground">Descrição</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="mt-1 block w-full bg-background border border-input rounded-md shadow-sm px-3 py-2 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                    rows={3}
                  />
                </div>
                <div className="md:col-span-2 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={cancelAdd}
                    className="px-6 py-2.5 text-gray-700 font-semibold rounded-lg bg-white hover:bg-gray-50 border-2 border-gray-300 hover:border-gray-400 shadow-md hover:shadow-lg transition-all duration-200 active:scale-95"
                  >
                    ❌ Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 text-white font-semibold rounded-lg bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-600 shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95"
                  >
                    💾 Salvar Produto
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição de Produto */}
      {showEditProductModal && editingProduct && (
        <div className="fixed inset-0 bg-background backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative bg-level-1 top-20 mx-auto p-5 border border-border w-11/12 max-w-2xl shadow-lg rounded-lg bg-[hsl(var(--card))] text-[hsl(var(--card-foreground))]">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-foreground">Editar Produto</h3>
                <button
                  onClick={cancelEdit}
                  className="text-foreground hover:text-muted-foreground"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>

              <form onSubmit={handleUpdateProduct} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground">Nome do Produto</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full bg-background border border-input rounded-md shadow-sm px-3 py-2 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground">Código Interno</label>
                  <input
                    type="text"
                    value={formData.internalCode}
                    onChange={(e) => setFormData({ ...formData, internalCode: e.target.value })}
                    className="mt-1 block w-full bg-background border border-input rounded-md shadow-sm px-3 py-2 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground">Código de Barras</label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="mt-1 block w-full bg-background border border-input rounded-md shadow-sm px-3 py-2 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground">Preço de Venda</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.salePrice}
                    onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                    className="mt-1 block w-full bg-background border border-input rounded-md shadow-sm px-3 py-2 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground">Preço de Custo</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                    className="mt-1 block w-full bg-background border border-input rounded-md shadow-sm px-3 py-2 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground">Quantidade Atual</label>
                  <input
                    type="number"
                    value={formData.currentQuantity}
                    onChange={(e) => setFormData({ ...formData, currentQuantity: parseInt(e.target.value) || 0 })}
                    className="mt-1 block w-full bg-background border border-input rounded-md shadow-sm px-3 py-2 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground">Limite Estoque Baixo</label>
                  <input
                    type="number"
                    value={formData.lowStockThreshold}
                    onChange={(e) => setFormData({ ...formData, lowStockThreshold: parseInt(e.target.value) || 5 })}
                    className="mt-1 block w-full bg-background border border-input rounded-md shadow-sm px-3 py-2 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                    min="0"
                    placeholder="5"
                  />
                  <p className="mt-1 text-sm text-muted-foreground">Quantidade mínima para alertar estoque baixo (padrão: 5)</p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-foreground">Descrição</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="mt-1 block w-full bg-background border border-input rounded-md shadow-sm px-3 py-2 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                    rows={3}
                  />
                </div>
                <div className="md:col-span-2 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="px-6 py-2.5 text-gray-700 font-semibold rounded-lg bg-white hover:bg-gray-50 border-2 border-gray-300 hover:border-gray-400 shadow-md hover:shadow-lg transition-all duration-200 active:scale-95"
                  >
                    ❌ Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 text-white font-semibold rounded-lg bg-gradient-to-r from-emerald-400 to-green-500 hover:from-emerald-500 hover:to-green-600 shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95"
                  >
                    💾 Atualizar Produto
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'hsl(var(--card))',
            color: 'hsl(var(--card-foreground))',
            border: '1px solid hsl(var(--border))',
            zIndex: 9999,
          },
        }}
        containerStyle={{
          top: 80,
          zIndex: 50,
        }}
      />
    </div>
  );
}
