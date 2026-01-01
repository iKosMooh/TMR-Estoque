'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';

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
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
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
        setShowAddForm(false);
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

  const handleDeleteBatch = async (batchId: string) => {
    if (!confirm('Tem certeza que deseja excluir este lote? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      const response = await fetch(`/api/batches/${batchId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Lote excluído com sucesso!');
        fetchProducts();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao excluir lote');
      }
    } catch (error) {
      console.error('Erro ao excluir lote:', error);
      toast.error('Erro ao excluir lote');
    }
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

  const getStockStatus = (quantity: number, threshold: number) => {
    if (quantity === 0) return { text: 'Esgotado', color: 'text-red-600 bg-red-100' };
    if (quantity <= threshold) return { text: 'Baixo', color: 'text-yellow-600 bg-yellow-100' };
    return { text: 'Normal', color: 'text-green-600 bg-green-100' };
  };

  const toggleProductDetails = (productId: string) => {
    setExpandedProduct(expandedProduct === productId ? null : productId);
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
                <Link href="/estoque" className="border-indigo-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Estoque
                </Link>
                <Link href="/vendas" className="border-transparent text-gray-900 hover:border-gray-300 hover:text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
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
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Gerenciamento de Estoque</h1>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowImportModal(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                Importar XML
              </button>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                {showAddForm ? 'Cancelar' : 'Adicionar Produto'}
              </button>
            </div>
          </div>

          {/* Barra de Pesquisa */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Buscar por nome, código interno ou código de barras..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Formulário de Adição/Edição */}
          {(showAddForm || editingProduct) && (
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                {editingProduct ? 'Editar Produto' : 'Adicionar Novo Produto'}
              </h2>
              <form onSubmit={editingProduct ? handleUpdateProduct : handleAddProduct} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900">Nome do Produto</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900">Código Interno</label>
                  <input
                    type="text"
                    value={formData.internalCode}
                    onChange={(e) => setFormData({ ...formData, internalCode: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900">Código de Barras</label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900">Preço de Venda</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.salePrice}
                    onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900">Preço de Custo</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900">{editingProduct ? 'Quantidade Atual' : 'Quantidade Inicial'}</label>
                  <input
                    type="number"
                    value={formData.currentQuantity}
                    onChange={(e) => setFormData({ ...formData, currentQuantity: parseInt(e.target.value) || 0 })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900">Limite Estoque Baixo</label>
                  <input
                    type="number"
                    value={formData.lowStockThreshold}
                    onChange={(e) => setFormData({ ...formData, lowStockThreshold: parseInt(e.target.value) || 5 })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    min="0"
                    placeholder="5"
                  />
                  <p className="mt-1 text-sm text-gray-600">Quantidade mínima para alertar estoque baixo (padrão: 5)</p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-900">Descrição</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    rows={3}
                  />
                </div>
                <div className="md:col-span-2 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={editingProduct ? cancelEdit : () => setShowAddForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-900 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {editingProduct ? 'Atualizar Produto' : 'Salvar Produto'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Lista de Produtos */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-gray-900">Carregando produtos...</p>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {filteredProducts.length === 0 ? (
                  <li className="px-6 py-12 text-center">
                    <p className="text-gray-900">Nenhum produto encontrado.</p>
                    {searchTerm && (
                      <p className="text-sm text-gray-900 mt-1">
                        Tente ajustar os termos de busca.
                      </p>
                    )}
                  </li>
                ) : (
                  filteredProducts.map((product) => {
                    const stockStatus = getStockStatus(product.currentQuantity, product.lowStockThreshold);
                    const isExpanded = expandedProduct === product.id;
                    return (
                      <li key={product.id} className="px-6 py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center">
                              <div className="flex-1">
                                <h3 className="text-lg font-medium text-gray-900 cursor-pointer" onClick={() => toggleProductDetails(product.id)}>
                                  {product.name} {isExpanded ? '▼' : '▶'}
                                </h3>
                                <p className="text-sm text-gray-900">
                                  Código: {product.internalCode}
                                  {product.barcode && ` | Barras: ${product.barcode}`}
                                </p>
                                {product.description && (
                                  <p className="text-sm text-gray-900 mt-1">{product.description}</p>
                                )}
                              </div>
                              <div className="ml-4 flex flex-col items-end space-y-1">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stockStatus.color}`}>
                                  {stockStatus.text}
                                </span>
                                <span className="text-sm text-gray-900">
                                  Qtd: {product.currentQuantity}
                                </span>
                              </div>
                            </div>
                            {isExpanded && product.batches.length > 0 && (
                              <div className="mt-4 bg-gray-50 p-4 rounded">
                                <h4 className="text-sm font-medium text-gray-900 mb-3">Lotes:</h4>
                                <div className="space-y-2">
                                  {product.batches.map((batch) => (
                                    <div key={batch.id} className="flex items-center justify-between bg-white p-3 rounded border border-gray-200">
                                      <div className="text-sm text-gray-700">
                                        <span className="font-medium">Data:</span> {batch.purchaseDate} | 
                                        <span className="font-medium"> Custo:</span> R$ {parseFloat(batch.costPrice).toFixed(2)} | 
                                        <span className="font-medium"> Venda:</span> R$ {parseFloat(batch.sellingPrice).toFixed(2)} | 
                                        <span className="font-medium"> Qtd Recebida:</span> {batch.quantityReceived} | 
                                        <span className="font-medium"> Restante:</span> {batch.quantityRemaining}
                                      </div>
                                      <div className="flex space-x-2">
                                        <button
                                          onClick={() => handleEditBatch(batch)}
                                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                                        >
                                          Editar
                                        </button>
                                        <button
                                          onClick={() => handleDeleteBatch(batch.id)}
                                          className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                                        >
                                          Excluir
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {isExpanded && product.batches.length === 0 && (
                              <div className="mt-4 bg-gray-50 p-4 rounded">
                                <p className="text-sm text-gray-500">Nenhum lote disponível para este produto.</p>
                              </div>
                            )}
                            <div className="mt-2 flex items-center justify-between">
                              <div className="flex space-x-4 text-sm text-gray-900">
                                <span>Custo: R$ {parseFloat(product.costPrice).toFixed(2)}</span>
                                <span>Venda: R$ {parseFloat(product.salePrice).toFixed(2)}</span>
                                <span>Entradas: {product.totalEntry}</span>
                                <span>Saídas: {product.totalExit}</span>
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleEditProduct(product)}
                                  className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                                >
                                  Editar
                                </button>
                                <button
                                  onClick={() => handleDeleteProduct(product.id)}
                                  className="text-red-600 hover:text-red-900 text-sm font-medium"
                                >
                                  Excluir
                                </button>
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
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-500 rounded"></div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-900 truncate">Total de Produtos</dt>
                        <dd className="text-lg font-medium text-gray-900">{products.length}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-500 rounded"></div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-900 truncate">Em Estoque</dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {products.reduce((sum, p) => sum + p.currentQuantity, 0)}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-yellow-500 rounded"></div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-900 truncate">Estoque Baixo</dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {products.filter(p => p.currentQuantity > 0 && p.currentQuantity <= p.lowStockThreshold).length}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-red-500 rounded"></div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-900 truncate">Esgotados</dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {products.filter(p => p.currentQuantity === 0).length}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Importação */}
      {showImportModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Importar XML NF-e</h3>
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    resetImport();
                  }}
                  className="text-gray-900 hover:text-gray-900"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>

              {!importPreview && (
                <form onSubmit={handleImportPreview} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Selecione o arquivo XML
                    </label>
                    <input
                      type="file"
                      accept=".xml"
                      onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                      className="block w-full text-sm text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
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
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-900 hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={!importFile || importing}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {importing ? 'Gerando prévia...' : 'Gerar Prévia'}
                    </button>
                  </div>
                </form>
              )}

              {importPreview && (
                <div className="space-y-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Prévia da Importação</h4>
                    <p className="text-gray-900"><strong className="text-gray-900">Tipo de XML:</strong> {importPreview.xmlType}</p>
                    <p className="text-gray-900"><strong className="text-gray-900">Arquivo:</strong> {importPreview.fileName}</p>
                    <p className="text-gray-900"><strong className="text-gray-900">Total de itens:</strong> {importPreview.totalItems}</p>
                  </div>

                  <div className="bg-white border rounded-lg overflow-hidden max-h-96 overflow-y-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left text-gray-900 font-medium">Código</th>
                          <th className="px-4 py-2 text-left text-gray-900 font-medium">Nome</th>
                          <th className="px-4 py-2 text-left text-gray-900 font-medium">Preço</th>
                          <th className="px-4 py-2 text-left text-gray-900 font-medium">Quantidade</th>
                          <th className="px-4 py-2 text-left text-gray-900 font-medium">Ação</th>
                          <th className="px-4 py-2 text-left text-gray-900 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importPreview.previewItems.map((item, index) => (
                          <tr key={index} className="border-t">
                            <td className="px-4 py-2 text-gray-900">{item.internalCode || item.barcode}</td>
                            <td className="px-4 py-2 text-gray-900">{item.name}</td>
                            <td className="px-4 py-2">
                              <div className="flex items-center">
                                <span className="mr-2 text-gray-900">R$</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={getEditedImportPrice(index, item.salePrice).toFixed(2)}
                                  onChange={(e) => handleImportPriceChange(index, e.target.value)}
                                  className="w-28 px-2 py-1 border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                                className="w-24 px-2 py-1 border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="0"
                              />
                            </td>
                            <td className="px-4 py-2">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                item.action === 'create' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                              }`}>
                                {item.action === 'create' ? 'Criar' : 'Atualizar'}
                              </span>
                            </td>
                            <td className="px-4 py-2">
                              {item.existing ? (
                                <span className="text-orange-700 text-sm font-medium">
                                  Produto existente (estoque atual: {item.existing.currentQuantity || 0})
                                </span>
                              ) : (
                                <span className="text-green-700 text-sm font-medium">Novo produto</span>
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
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-900 hover:bg-gray-50"
                    >
                      Voltar
                    </button>
                    <button
                      onClick={handleConfirmImport}
                      disabled={importing}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
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
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Editar Lote</h3>
                <button
                  onClick={cancelBatchEdit}
                  className="text-gray-900 hover:text-gray-700"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>

              <form onSubmit={handleUpdateBatch} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900">Data de Compra</label>
                    <input
                      type="date"
                      value={editingBatch.purchaseDate}
                      onChange={(e) => setEditingBatch({ ...editingBatch, purchaseDate: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900">Preço de Custo</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingBatch.costPrice}
                      onChange={(e) => setEditingBatch({ ...editingBatch, costPrice: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900">Preço de Venda</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingBatch.sellingPrice}
                      onChange={(e) => setEditingBatch({ ...editingBatch, sellingPrice: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900">Quantidade Recebida</label>
                    <input
                      type="number"
                      value={editingBatch.quantityReceived}
                      onChange={(e) => setEditingBatch({ ...editingBatch, quantityReceived: parseInt(e.target.value) || 0 })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900">Quantidade Restante</label>
                    <input
                      type="number"
                      value={editingBatch.quantityRemaining}
                      onChange={(e) => setEditingBatch({ ...editingBatch, quantityRemaining: parseInt(e.target.value) || 0 })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={cancelBatchEdit}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-900 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
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
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Excluir Produto</h3>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="text-gray-900 hover:text-gray-900"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>

              <p className="text-gray-900 mb-4">
                Este produto possui movimentações relacionadas. O que deseja fazer?
              </p>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => confirmDelete(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-900 hover:bg-gray-50"
                >
                  Apagar só o produto
                </button>
                <button
                  onClick={() => confirmDelete(true)}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Apagar produto e movimentações
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Toaster position="top-right" />
    </div>
  );
}
