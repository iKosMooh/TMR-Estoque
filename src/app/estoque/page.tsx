'use client';

import { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
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
  observation?: string;
  // Campos para E-commerce
  sku?: string;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  categoryId?: string;
  brandName?: string;
  manufacturer?: string;
  shortDescription?: string;
  metaTitle?: string;
  metaDescription?: string;
  tags?: string;
  warrantyMonths?: number;
  // Campos para tipo de produto e unidades
  productType?: 'simple' | 'marketplace';
  unitType?: 'unit' | 'package';
  packageQuantity?: number;
  unitsPerPackage?: number;
  unitName?: string;
  packageName?: string;
  sellByUnit?: boolean;
  unitPrice?: string;
  markupPercentage?: string;
}

interface BatchFormData {
  id: string;
  costPrice: string;
  sellingPrice: string;
  quantityReceived: number;
  quantityRemaining: number;
  purchaseDate: string;
  observation?: string;
  unitsPerPackage?: number;
  packageQuantityReceived?: number;
  totalUnitsReceived?: number;
  unitsRemaining?: number;
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
  // Campos para unidades
  productType?: 'simple' | 'marketplace';
  unitType?: 'unit' | 'package';
  packageQuantity?: number;
  unitsPerPackage?: number;
  unitName?: string;
  packageName?: string;
  sellByUnit?: boolean;
  unitPrice?: string;
  qtdUnitsAvailable?: number;
  batches: Array<{
    id: string;
    purchaseDate: string;
    costPrice: string;
    sellingPrice: string;
    quantityReceived: number;
    quantityRemaining: number;
    xmlReference: string | null;
    observation: string | null;
    unitsPerPackage?: number;
    packageQuantityReceived?: number;
    totalUnitsReceived?: number;
    unitsRemaining?: number;
  }>;
}

interface PreviewItem {
  internalCode?: string;
  xmlCode?: string;
  barcode?: string;
  name?: string;
  ncm?: string;
  cfop?: string;
  cst?: string;
  salePrice: number;
  costPrice?: number;
  markupPercentage?: number;
  quantity: number;
  // Campos para unidades
  unitsPerPackage?: number;
  packageQuantity?: number;
  totalUnits?: number;
  unitPrice?: number;
  sellByUnit?: boolean;
  forceCreate?: boolean;
  existing: {
    id: string;
    name: string;
    currentQuantity?: number;
    internalCode: string;
    matchType: 'xmlCode' | 'barcode' | 'internalCode' | 'name';
    sellByUnit: boolean;
    unitsPerPackage: number;
    salePrice: number;
    costPrice: number;
    barcode: string | null;
  } | null;
  action: 'create' | 'update';
}

interface PreviewResult {
  xmlType: string;
  totalItems: number;
  previewItems: PreviewItem[];
  fileName: string;
  hasDuplicates?: boolean;
  duplicateProducts?: string[];
  duplicateMessage?: string;
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
  
  // Estados para filtros avançados
  const [showFilters, setShowFilters] = useState(false);
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterQuantityMin, setFilterQuantityMin] = useState('');
  const [filterQuantityMax, setFilterQuantityMax] = useState('');
  const [filterPriceMin, setFilterPriceMin] = useState('');
  const [filterPriceMax, setFilterPriceMax] = useState('');
  const [filterStockStatus, setFilterStockStatus] = useState<'all' | 'normal' | 'low' | 'out'>('all');
  const [filterProductType, setFilterProductType] = useState<'all' | 'simple' | 'marketplace'>('all');
  const [filterSellByUnit, setFilterSellByUnit] = useState<'all' | 'yes' | 'no'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'quantity' | 'price' | 'date'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Estados para paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [formType, setFormType] = useState<'simple' | 'ecommerce'>('simple');
  const [editFormType, setEditFormType] = useState<'simple' | 'marketplace'>('simple');
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<PreviewResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [editedImportItems, setEditedImportItems] = useState<{[key: number]: {
    salePrice: number; 
    quantity: number; 
    costPrice?: number; 
    markupPercentage?: number;
    unitsPerPackage?: number;
    sellByUnit?: boolean;
    unitPrice?: number;
    name?: string;
  }}>({});
  const [nameExistsCheck, setNameExistsCheck] = useState<{[key: number]: boolean}>({});
  // Estados para multiseleção
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>({
    internalCode: '',
    barcode: '',
    name: '',
    description: '',
    salePrice: '',
    costPrice: '',
    currentQuantity: 0,
    lowStockThreshold: 5,
    sku: '',
    weight: 0,
    length: 0,
    width: 0,
    height: 0,
    categoryId: '',
    brandName: '',
    manufacturer: '',
    shortDescription: '',
    metaTitle: '',
    metaDescription: '',
    tags: '',
    warrantyMonths: 0,
    observation: '',
    // Campos para unidades
    productType: 'simple',
    unitType: 'unit',
    packageQuantity: 1,
    unitsPerPackage: 1,
    unitName: 'Unidade',
    packageName: 'Caixa',
    sellByUnit: false,
    unitPrice: '',
    markupPercentage: '',
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
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [existingProduct, setExistingProduct] = useState<{id: string; name: string} | null>(null);
  const [showDuplicatesConfirmModal, setShowDuplicatesConfirmModal] = useState(false);
  const [duplicateAction, setDuplicateAction] = useState<{[key: number]: 'addBatch' | 'createNew' | 'skip'}>({});
  const [markupPercentage, setMarkupPercentage] = useState<string>('');
  // Estado para margem de lucro global na importação
  const [globalMarkup, setGlobalMarkup] = useState<string>('');
  // Estado para margem de lucro no modal de edição
  const [editMarkupPercentage, setEditMarkupPercentage] = useState<string>('');
  // Estados para Excel
  const [showExcelImportModal, setShowExcelImportModal] = useState(false);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [importingExcel, setImportingExcel] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  // Funções para calcular preço de venda com base no custo e margem
  const calculateSalePriceFromMarkup = (costPrice: string, markup: string): string => {
    const cost = parseFloat(costPrice) || 0;
    const markupValue = parseFloat(markup) || 0;
    if (cost <= 0) return '';
    const salePrice = cost * (1 + markupValue / 100);
    return salePrice.toFixed(2);
  };

  const calculateMarkupFromPrices = (costPrice: string, salePrice: string): string => {
    const cost = parseFloat(costPrice) || 0;
    const sale = parseFloat(salePrice) || 0;
    if (cost <= 0 || sale <= 0) return '';
    const markup = ((sale - cost) / cost) * 100;
    return markup.toFixed(2);
  };

  // Função para atualizar preço de venda baseado na margem no modal de edição
  const updateSalePriceFromMarkup = (costPrice: string, markup: string) => {
    const newSalePrice = calculateSalePriceFromMarkup(costPrice, markup);
    setFormData(prev => ({ ...prev, salePrice: newSalePrice }));
  };

  // Função para atualizar margem baseada nos preços no modal de edição
  const updateMarkupFromPrices = (costPrice: string, salePrice: string) => {
    const newMarkup = calculateMarkupFromPrices(costPrice, salePrice);
    setEditMarkupPercentage(newMarkup);
    setFormData(prev => ({ ...prev, markupPercentage: newMarkup }));
  };

  // Funções para multiseleção
  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(filteredProducts.map(p => p.id)));
    }
    setSelectAll(!selectAll);
  };

  const goToLabelsWithSelected = () => {
    if (selectedProducts.size === 0) {
      toast.error('Selecione pelo menos um produto');
      return;
    }
    // Salvar seleção no localStorage e navegar para etiquetas
    const selectedIds = Array.from(selectedProducts);
    localStorage.setItem('selectedProductsForLabels', JSON.stringify(selectedIds));
    window.location.href = '/etiquetas?fromSelection=true';
  };

  const handleCostPriceChange = (value: string) => {
    setFormData({ ...formData, costPrice: value });
    // Se tiver margem definida, recalcula o preço de venda
    if (markupPercentage && parseFloat(markupPercentage) > 0) {
      const newSalePrice = calculateSalePriceFromMarkup(value, markupPercentage);
      if (newSalePrice) {
        setFormData(prev => ({ ...prev, costPrice: value, salePrice: newSalePrice }));
      }
    }
  };

  const handleSalePriceChange = (value: string) => {
    setFormData({ ...formData, salePrice: value });
    // Recalcula a margem baseada no novo preço
    const newMarkup = calculateMarkupFromPrices(formData.costPrice, value);
    setMarkupPercentage(newMarkup);
  };

  const handleMarkupChange = (value: string) => {
    setMarkupPercentage(value);
    // Recalcula o preço de venda com base na margem
    const newSalePrice = calculateSalePriceFromMarkup(formData.costPrice, value);
    if (newSalePrice) {
      setFormData({ ...formData, salePrice: newSalePrice });
    }
  };

  // Funções para Excel
  const handleExportExcel = async () => {
    setExportingExcel(true);
    try {
      const response = await fetch('/api/stock/excel');
      if (!response.ok) {
        throw new Error('Erro ao exportar');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `estoque_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Estoque exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast.error('Erro ao exportar estoque');
    } finally {
      setExportingExcel(false);
    }
  };

  const handleImportExcel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!excelFile) return;

    setImportingExcel(true);
    const formDataExcel = new FormData();
    formDataExcel.append('file', excelFile);

    try {
      const response = await fetch('/api/stock/excel', {
        method: 'POST',
        body: formDataExcel,
      });

      const result = await response.json();
      if (result.success) {
        toast.success(result.message);
        setShowExcelImportModal(false);
        setExcelFile(null);
        fetchProducts();
      } else {
        toast.error(result.error || 'Erro ao importar');
      }
    } catch (error) {
      console.error('Erro ao importar:', error);
      toast.error('Erro ao importar estoque');
    } finally {
      setImportingExcel(false);
    }
  };

  // Funções para gerenciar margem na importação de XML
  const applyGlobalMarkupToImport = () => {
    if (!importPreview || !globalMarkup) return;
    
    const markupValue = parseFloat(globalMarkup) || 0;
    const newEditedItems: typeof editedImportItems = {};
    
    importPreview.previewItems.forEach((item, index) => {
      const costPrice = editedImportItems[index]?.costPrice ?? item.costPrice ?? item.salePrice;
      const salePrice = costPrice * (1 + markupValue / 100);
      newEditedItems[index] = {
        ...editedImportItems[index],
        costPrice: costPrice,
        salePrice: salePrice,
        markupPercentage: markupValue,
        quantity: editedImportItems[index]?.quantity ?? item.quantity,
      };
    });
    
    setEditedImportItems(newEditedItems);
    toast.success(`Margem de ${markupValue}% aplicada a todos os itens`);
  };

  const handleImportCostPriceChange = (index: number, value: string) => {
    const numValue = parseFloat(value) || 0;
    const currentItem = editedImportItems[index] || {};
    const markup = currentItem.markupPercentage || 0;
    const salePrice = numValue * (1 + markup / 100);
    
    setEditedImportItems(prev => ({
      ...prev,
      [index]: { 
        ...prev[index], 
        costPrice: numValue,
        salePrice: salePrice,
      }
    }));
  };

  const handleImportMarkupChange = (index: number, value: string) => {
    const markupValue = parseFloat(value) || 0;
    const item = importPreview?.previewItems[index];
    const costPrice = editedImportItems[index]?.costPrice ?? item?.costPrice ?? item?.salePrice ?? 0;
    const salePrice = costPrice * (1 + markupValue / 100);
    
    setEditedImportItems(prev => ({
      ...prev,
      [index]: { 
        ...prev[index], 
        markupPercentage: markupValue,
        salePrice: salePrice,
      }
    }));
  };

  // Funções para gerenciar unidades na importação
  const handleImportUnitsPerPackageChange = (index: number, value: string) => {
    const numValue = parseInt(value) || 1;
    setEditedImportItems(prev => ({
      ...prev,
      [index]: { ...prev[index], unitsPerPackage: numValue }
    }));
  };

  const handleImportSellByUnitChange = (index: number, value: boolean) => {
    setEditedImportItems(prev => ({
      ...prev,
      [index]: { ...prev[index], sellByUnit: value }
    }));
  };

  const handleImportUnitPriceChange = (index: number, value: string) => {
    const numValue = parseFloat(value) || 0;
    setEditedImportItems(prev => ({
      ...prev,
      [index]: { ...prev[index], unitPrice: numValue }
    }));
  };

  const handleImportNameChange = async (index: number, value: string) => {
    setEditedImportItems(prev => ({
      ...prev,
      [index]: { ...prev[index], name: value }
    }));

    // Verificar se o nome já existe (exceto se for o produto existente atual)
    const item = importPreview?.previewItems[index];
    const excludeId = item?.existing?.id;
    const exists = await checkNameExists(value, excludeId);
    setNameExistsCheck(prev => ({
      ...prev,
      [index]: exists
    }));
  };

  // Função para verificar se um nome já existe no estoque (excluindo o produto atual se for edição)
  const checkNameExists = async (name: string, excludeProductId?: string) => {
    if (!name.trim()) return false;
    try {
      const response = await fetch(`/api/products?name=${encodeURIComponent(name)}`);
      if (response.ok) {
        const products = await response.json();
        return products.some((p: any) => p.name.toLowerCase() === name.toLowerCase() && p.id !== excludeProductId);
      }
    } catch (error) {
      console.error('Erro ao verificar nome:', error);
    }
    return false;
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  // Atualizar seleção quando filtro muda
  useEffect(() => {
    setSelectAll(false);
  }, [searchTerm]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
    }
  };

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
      // Primeiro, verificar se o produto já existe
      const checkResponse = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...formData, checkOnly: true }),
      });

      const checkResult = await checkResponse.json();
      
      if (checkResult.exists) {
        // Produto já existe, mostrar modal para confirmar adição como lote
        setExistingProduct({ id: checkResult.product.id, name: checkResult.product.name });
        setShowDuplicateModal(true);
        return;
      }

      // Produto não existe, adicionar normalmente
      await submitProduct();
    } catch (error) {
      console.error('Erro ao adicionar produto:', error);
      toast.error('Erro ao adicionar produto');
    }
  };

  const submitProduct = async () => {
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.isNewBatch) {
          toast.success(`Novo lote adicionado ao produto "${result.productName}"!`);
        } else {
          toast.success('Produto adicionado com sucesso!');
        }
        setShowAddProductModal(false);
        setShowDuplicateModal(false);
        setExistingProduct(null);
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

  const handleConfirmDuplicate = async () => {
    await submitProduct();
  };

  const handleCancelDuplicate = () => {
    setShowDuplicateModal(false);
    setExistingProduct(null);
  };

  // Funções de edição/exclusão de produtos
  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setEditFormType(product.productType || 'simple');

    // Calcular margem de lucro atual se houver preço de custo e venda
    const costPrice = parseFloat(product.costPrice);
    const salePrice = parseFloat(product.salePrice);
    const currentMarkup = costPrice > 0 ? ((salePrice - costPrice) / costPrice * 100).toFixed(1) : '';

    setFormData({
      internalCode: product.internalCode,
      barcode: product.barcode || '',
      name: product.name,
      description: product.description || '',
      salePrice: product.salePrice,
      costPrice: product.costPrice,
      currentQuantity: product.currentQuantity,
      lowStockThreshold: product.lowStockThreshold,
      // Campos para unidades
      productType: product.productType || 'simple',
      unitType: product.unitType || 'unit',
      packageQuantity: product.packageQuantity || 1,
      unitsPerPackage: product.unitsPerPackage || 1,
      unitName: product.unitName || 'Unidade',
      packageName: product.packageName || 'Caixa',
      sellByUnit: product.sellByUnit || false,
      unitPrice: product.unitPrice || '',
      markupPercentage: currentMarkup,
    });
    setEditMarkupPercentage(currentMarkup);
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
      lowStockThreshold: 5,
      observation: '',
      productType: 'simple',
      unitType: 'unit',
      packageQuantity: 1,
      unitsPerPackage: 1,
      unitName: 'Unidade',
      packageName: 'Caixa',
      sellByUnit: false,
      unitPrice: '',
    });
    setMarkupPercentage('');
    setEditFormType('simple');
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
      observation: batch.observation || '',
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
      setNameExistsCheck({}); // Resetar verificações de nome
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
        previewItems: importPreview.previewItems
          .map((item, index) => {
            const action = duplicateAction[index] ?? (item.existing ? 'addBatch' : 'createNew');
            
            // Pular itens marcados como 'skip'
            if (action === 'skip') return null;
            
            return {
              ...item,
              name: editedImportItems[index]?.name ?? item.name,
              salePrice: getEditedImportPrice(index, item.salePrice),
              costPrice: editedImportItems[index]?.costPrice ?? item.costPrice ?? item.salePrice,
              quantity: getEditedImportQuantity(index, item.quantity),
              markupPercentage: editedImportItems[index]?.markupPercentage ?? 0,
              // Campos de unidades - herdar do produto existente se for addBatch
              unitsPerPackage: action === 'addBatch' && item.existing 
                ? item.existing.unitsPerPackage 
                : editedImportItems[index]?.unitsPerPackage ?? 1,
              sellByUnit: action === 'addBatch' && item.existing 
                ? item.existing.sellByUnit 
                : editedImportItems[index]?.sellByUnit ?? false,
              unitPrice: editedImportItems[index]?.unitPrice ?? 0,
              // Definir ação baseada na escolha do usuário
              action: action === 'addBatch' ? 'update' : 'create',
              forceCreate: action === 'createNew' && item.existing ? true : false,
            };
          })
          .filter(item => item !== null) // Remover itens pulados
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
        setGlobalMarkup('');
        setDuplicateAction({});
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
    setGlobalMarkup('');
    setDuplicateAction({});
    setNameExistsCheck({});
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

  // Função de filtragem avançada
  const filteredProducts = products.filter(product => {
    // Filtro de busca por texto
    const matchesSearch = 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.internalCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.barcode && product.barcode.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (!matchesSearch) return false;
    
    // Filtro por data de última compra
    if (filterDateFrom && product.lastPurchaseDate) {
      if (product.lastPurchaseDate < filterDateFrom) return false;
    }
    if (filterDateTo && product.lastPurchaseDate) {
      if (product.lastPurchaseDate > filterDateTo) return false;
    }
    
    // Filtro por quantidade
    if (filterQuantityMin) {
      const min = parseInt(filterQuantityMin);
      if (!isNaN(min) && product.currentQuantity < min) return false;
    }
    if (filterQuantityMax) {
      const max = parseInt(filterQuantityMax);
      if (!isNaN(max) && product.currentQuantity > max) return false;
    }
    
    // Filtro por preço de venda
    if (filterPriceMin) {
      const min = parseFloat(filterPriceMin);
      if (!isNaN(min) && parseFloat(product.salePrice) < min) return false;
    }
    if (filterPriceMax) {
      const max = parseFloat(filterPriceMax);
      if (!isNaN(max) && parseFloat(product.salePrice) > max) return false;
    }
    
    // Filtro por status de estoque
    if (filterStockStatus !== 'all') {
      const status = getStockStatus(product.currentQuantity, product.lowStockThreshold);
      if (filterStockStatus === 'normal' && status.text !== 'Normal') return false;
      if (filterStockStatus === 'low' && status.text !== 'Baixo') return false;
      if (filterStockStatus === 'out' && status.text !== 'Esgotado') return false;
    }
    
    // Filtro por tipo de produto
    if (filterProductType !== 'all') {
      const productType = product.productType || 'simple';
      if (productType !== filterProductType) return false;
    }
    
    // Filtro por venda por unidade
    if (filterSellByUnit !== 'all') {
      const sellByUnit = product.sellByUnit || false;
      if (filterSellByUnit === 'yes' && !sellByUnit) return false;
      if (filterSellByUnit === 'no' && sellByUnit) return false;
    }
    
    return true;
  });

  // Ordenação
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'quantity':
        comparison = a.currentQuantity - b.currentQuantity;
        break;
      case 'price':
        comparison = parseFloat(a.salePrice) - parseFloat(b.salePrice);
        break;
      case 'date':
        const dateA = a.lastPurchaseDate || '';
        const dateB = b.lastPurchaseDate || '';
        comparison = dateA.localeCompare(dateB);
        break;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // Paginação
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = sortedProducts.slice(startIndex, endIndex);

  // Resetar página quando filtros mudam
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterDateFrom, filterDateTo, filterQuantityMin, filterQuantityMax, filterPriceMin, filterPriceMax, filterStockStatus, filterProductType, filterSellByUnit, sortBy, sortOrder, itemsPerPage]);

  // Função para gerar páginas a mostrar na paginação
  const getVisiblePages = () => {
    const pages = [];
    const delta = 2; // Quantas páginas mostrar ao redor da atual

    for (let i = Math.max(1, currentPage - delta); i <= Math.min(totalPages, currentPage + delta); i++) {
      pages.push(i);
    }

    return pages;
  };

  const visiblePages = getVisiblePages();

  // Limpar todos os filtros
  const clearAllFilters = () => {
    setSearchTerm('');
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterQuantityMin('');
    setFilterQuantityMax('');
    setFilterPriceMin('');
    setFilterPriceMax('');
    setFilterStockStatus('all');
    setFilterProductType('all');
    setFilterSellByUnit('all');
    setSortBy('name');
    setSortOrder('asc');
  };

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
                onClick={handleExportExcel}
                disabled={exportingExcel}
                className="px-6 py-2.5 text-white font-semibold rounded-lg bg-gradient-to-r from-green-600 to-lime-600 hover:from-green-500 hover:to-lime-500 shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95 disabled:opacity-50"
                aria-label="Exportar estoque para Excel"
              >
                {exportingExcel ? '⏳ Exportando...' : '📊 Exportar Excel'}
              </button>
              <button
                onClick={() => setShowExcelImportModal(true)}
                className="px-6 py-2.5 text-white font-semibold rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95"
                aria-label="Importar estoque de Excel"
              >
                📥 Importar Excel
              </button>
              <button
                onClick={() => setShowAddProductModal(true)}
                className="px-6 py-2.5 text-white font-semibold rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-600 shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95"
                aria-label="Adicionar novo produto"
              >
                ➕ Adicionar Produto
              </button>
              {selectedProducts.size > 0 && (
                <button
                  onClick={goToLabelsWithSelected}
                  className="px-6 py-2.5 text-white font-semibold rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95"
                  aria-label="Gerar etiquetas dos produtos selecionados"
                >
                  🏷️ Gerar Etiquetas ({selectedProducts.size})
                </button>
              )}
            </div>
          </div>

          {/* Barra de Pesquisa e Seleção */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex-1">
              <SearchBar
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Buscar por nome, código interno ou código de barras..."
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2 rounded-lg border transition-colors flex items-center gap-2 ${showFilters ? 'bg-primary text-white border-primary' : 'bg-level-2 border-border hover:bg-level-3'}`}
              >
                🔍 Filtros {showFilters ? '▲' : '▼'}
              </button>
              <label className="flex items-center gap-2 cursor-pointer bg-level-2 px-4 py-2 rounded-lg border border-border hover:bg-level-3 transition-colors">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-border"
                />
                <span className="text-sm font-medium text-foreground">
                  Selecionar todos ({sortedProducts.length})
                </span>
              </label>
            </div>
          </div>

          {/* Painel de Filtros Avançados */}
          {showFilters && (
            <div className="mb-6 p-6 bg-level-2 rounded-lg border border-border">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-foreground">Filtros Avançados</h3>
                <button
                  onClick={clearAllFilters}
                  className="text-sm text-primary hover:underline"
                >
                  Limpar Filtros
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {/* Filtro por Data */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-muted-foreground block">Data Última Compra</label>
                  <div className="space-y-2">
                    <input
                      type="date"
                      value={filterDateFrom}
                      onChange={(e) => setFilterDateFrom(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg"
                      placeholder="De"
                    />
                    <input
                      type="date"
                      value={filterDateTo}
                      onChange={(e) => setFilterDateTo(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg"
                      placeholder="Até"
                    />
                  </div>
                </div>

                {/* Filtro por Quantidade */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-muted-foreground block">Quantidade em Estoque</label>
                  <div className="space-y-2">
                    <input
                      type="number"
                      value={filterQuantityMin}
                      onChange={(e) => setFilterQuantityMin(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg"
                      placeholder="Mínimo"
                      min="0"
                    />
                    <input
                      type="number"
                      value={filterQuantityMax}
                      onChange={(e) => setFilterQuantityMax(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg"
                      placeholder="Máximo"
                      min="0"
                    />
                  </div>
                </div>

                {/* Filtro por Preço */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-muted-foreground block">Preço de Venda (R$)</label>
                  <div className="space-y-2">
                    <input
                      type="number"
                      value={filterPriceMin}
                      onChange={(e) => setFilterPriceMin(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg"
                      placeholder="Mínimo"
                      min="0"
                      step="0.01"
                    />
                    <input
                      type="number"
                      value={filterPriceMax}
                      onChange={(e) => setFilterPriceMax(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg"
                      placeholder="Máximo"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                {/* Filtro por Status de Estoque */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-muted-foreground block">Status do Estoque</label>
                  <select
                    value={filterStockStatus}
                    onChange={(e) => setFilterStockStatus(e.target.value as 'all' | 'normal' | 'low' | 'out')}
                    className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg"
                  >
                    <option value="all">Todos</option>
                    <option value="normal">✅ Normal</option>
                    <option value="low">⚠️ Baixo</option>
                    <option value="out">❌ Esgotado</option>
                  </select>
                </div>

                {/* Filtro por Tipo de Produto */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-muted-foreground block">Tipo de Produto</label>
                  <select
                    value={filterProductType}
                    onChange={(e) => setFilterProductType(e.target.value as 'all' | 'simple' | 'marketplace')}
                    className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg"
                  >
                    <option value="all">Todos</option>
                    <option value="simple">Simples</option>
                    <option value="marketplace">Marketplace</option>
                  </select>
                </div>

                {/* Filtro por Venda por Unidade */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-muted-foreground block">Venda por Unidade</label>
                  <select
                    value={filterSellByUnit}
                    onChange={(e) => setFilterSellByUnit(e.target.value as 'all' | 'yes' | 'no')}
                    className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg"
                  >
                    <option value="all">Todos</option>
                    <option value="yes">Sim</option>
                    <option value="no">Não</option>
                  </select>
                </div>

                {/* Itens por Página */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-muted-foreground block">Itens por Página</label>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(parseInt(e.target.value))}
                    className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg"
                  >
                    <option value={10}>10 itens</option>
                    <option value={25}>25 itens</option>
                    <option value={50}>50 itens</option>
                    <option value={100}>100 itens</option>
                    <option value={250}>250 itens</option>
                  </select>
                </div>
              </div>

              {/* Resumo dos filtros ativos */}
              <div className="mt-6 pt-4 border-t border-border">
                <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                  <span>Exibindo {paginatedProducts.length} de {sortedProducts.length} produtos</span>
                  {sortedProducts.length !== products.length && (
                    <span className="text-primary">({products.length} total no sistema)</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Controles de Paginação - Topo */}
          {!loading && sortedProducts.length > 0 && (
            <div className="mb-4 flex flex-col sm:flex-row justify-between items-center gap-4 p-3 bg-level-2 rounded-lg border border-border">
              <div className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages} • {sortedProducts.length} produtos
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Ordenar por</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'name' | 'quantity' | 'price' | 'date')}
                    className="px-3 py-1 text-sm bg-background border border-border rounded"
                  >
                    <option value="name">Nome</option>
                    <option value="quantity">Quantidade</option>
                    <option value="price">Preço</option>
                    <option value="date">Data</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="px-2 py-1 bg-background border border-border rounded hover:bg-level-3 transition-colors"
                    title={sortOrder === 'asc' ? 'Ordem Crescente' : 'Ordem Decrescente'}
                  >
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="px-2 py-1 text-sm bg-background border border-border rounded hover:bg-level-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Primeira página"
                  >
                    ⏮
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-2 py-1 text-sm bg-background border border-border rounded hover:bg-level-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Página anterior"
                  >
                    ◀
                  </button>

                  {/* Páginas visíveis */}
                  {visiblePages.map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 text-sm border rounded ${
                        page === currentPage
                          ? 'bg-primary text-white border-primary'
                          : 'bg-background border-border hover:bg-level-3'
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-2 py-1 text-sm bg-background border border-border rounded hover:bg-level-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Próxima página"
                  >
                    ▶
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="px-2 py-1 text-sm bg-background border border-border rounded hover:bg-level-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Última página"
                  >
                    ⏭
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Lista de Produtos */}
          {loading ? (
            <LoadingState message="Carregando produtos..." />
          ) : (
            <div className="bg-level-1 shadow-lg overflow-hidden sm:rounded-lg">
              <ul className="divide-y divide-border" role="list">
                {sortedProducts.length === 0 ? (
                  <li className="px-6 py-12 text-center">
                    <EmptyState
                      title="Nenhum produto encontrado"
                      description={searchTerm ? 'Tente ajustar os filtros de busca ou adicione novos produtos.' : 'Comece adicionando seu primeiro produto ao estoque.'}
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
                  paginatedProducts.map((product) => {
                    const stockStatus = getStockStatus(product.currentQuantity, product.lowStockThreshold);
                    const isExpanded = expandedProduct === product.id;
                    const isSelected = selectedProducts.has(product.id);
                    return (
                      <li key={product.id} className={`px-3 py-3 bg-level-2 hover:bg-level-3 hover:scale-[1.02] transition-all duration-200 rounded-lg cursor-pointer ${isSelected ? 'ring-2 ring-primary' : ''}`}>
                        <div className="bg-card rounded-md p-4">
                          <div className="flex items-center justify-between">
                            {/* Checkbox de seleção */}
                            <div className="mr-4" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleProductSelection(product.id)}
                                className="w-5 h-5 rounded border-border cursor-pointer"
                              />
                            </div>
                            <div className="flex-1" onClick={() => toggleProductDetails(product.id)}>
                              <div className="flex items-center">
                                <div className="flex-1">
                                  <h3 className="text-lg font-semibold text-foreground cursor-pointer hover:text-primary transition-colors">
                                    {product.name} {isExpanded ? '▼' : '▶'}
                                    {product.sellByUnit && (
                                      <span className="ml-2 text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 px-2 py-0.5 rounded-full">
                                        Vende por unidade
                                      </span>
                                    )}
                                    {product.productType === 'marketplace' && (
                                      <span className="ml-2 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-0.5 rounded-full">
                                        Marketplace
                                      </span>
                                    )}
                                  </h3>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    Código: {product.internalCode}
                                    {product.barcode && ` | Barras: ${product.barcode}`}
                                  </p>
                                  {product.description && (
                                    <p className="text-sm text-muted-foreground mt-2">{product.description}</p>
                                  )}
                                  {product.sellByUnit && product.unitsPerPackage && product.unitsPerPackage > 1 && (
                                    <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">
                                      📦 {product.packageQuantity || 1} {product.packageName || 'Caixa'}(s) × {product.unitsPerPackage} {product.unitName || 'Unidade'}(s) = {(product.packageQuantity || 1) * product.unitsPerPackage} unidades disponíveis
                                    </p>
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
                                  {product.sellByUnit && product.unitPrice && (
                                    <span className="text-xs text-purple-600 dark:text-purple-400">
                                      Un: R$ {parseFloat(product.unitPrice).toFixed(2)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          {isExpanded && product.batches.length > 0 && (
                              <div className="mt-4 bg-level-3 p-4 rounded-lg">
                                <h4 className="text-sm font-semibold text-foreground mb-3">Lotes:</h4>
                                <div className="space-y-2">
                                  {product.batches.map((batch) => (
                                    <div key={batch.id} className="bg-level-2 p-3 rounded-md hover:bg-level-3 transition-colors">
                                      <div className="flex items-center justify-between">
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
                                      {batch.observation && (
                                        <div className="mt-2 text-sm text-muted-foreground bg-level-1 p-2 rounded">
                                          <span className="font-medium">📝 Obs:</span> {batch.observation}
                                        </div>
                                      )}
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
                      </li>
                    );
                  })
                )}
              </ul>

              {/* Controles de Paginação Inferior */}
              {sortedProducts.length > 0 && (
                <div className="bg-muted px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-b-lg border-t border-border">
                  <div className="text-sm text-muted-foreground">
                    Mostrando <span className="font-medium text-foreground">{startIndex + 1}</span> a{' '}
                    <span className="font-medium text-foreground">{Math.min(endIndex, sortedProducts.length)}</span> de{' '}
                    <span className="font-medium text-foreground">{sortedProducts.length}</span> produtos
                    {sortedProducts.length !== products.length && (
                      <span className="text-muted-foreground"> (filtrado de {products.length} total)</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="px-2 py-1 text-sm border border-border rounded bg-card hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Primeira página"
                    >
                      ⏮
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-2 py-1 text-sm border border-border rounded bg-card hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Página anterior"
                    >
                      ◀
                    </button>

                    {/* Páginas visíveis */}
                    {visiblePages.map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1 text-sm border rounded ${
                          page === currentPage
                            ? 'bg-primary text-white border-primary'
                            : 'bg-card border-border hover:bg-accent'
                        }`}
                      >
                        {page}
                      </button>
                    ))}

                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-2 py-1 text-sm border border-border rounded bg-card hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Próxima página"
                    >
                      ▶
                    </button>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="px-2 py-1 text-sm border border-border rounded bg-card hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Última página"
                    >
                      ⏭
                    </button>
                  </div>
                </div>
              )}
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
          <div className="relative bg-level-1 top-10 mx-auto p-5 border border-border w-[95%] max-w-6xl shadow-lg rounded-lg bg-card">
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

                  {/* Margem Global */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
                    <h5 className="text-sm font-semibold text-blue-700 dark:text-black-300 mb-3">📊 Aplicar Margem de Lucro Global</h5>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <label className="block text-xs text-blue-600 dark:text-black-400 mb-1">Margem (%)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={globalMarkup}
                          onChange={(e) => setGlobalMarkup(e.target.value)}
                          className="w-full px-3 py-2 border border-blue-300 dark:border-blue-700 rounded bg-white dark:bg-blue-900/30 text-card-foreground focus:ring-2 focus:ring-blue-500"
                          placeholder="Ex: 30 para 30%"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={applyGlobalMarkupToImport}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 transition-colors mt-5"
                      >
                        Aplicar a Todos
                      </button>
                    </div>
                    <p className="text-xs text-blue-600 dark:text-black-400 mt-2">
                      💡 O preço de custo será o valor do XML e o preço de venda será calculado com a margem
                    </p>
                  </div>

                  {/* Aviso de duplicatas */}
                  {importPreview.hasDuplicates && (
                    <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 p-4 rounded-lg">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">⚠️</span>
                        <div>
                          <h5 className="font-semibold text-orange-800 dark:text-black-200">
                            Produtos já existentes detectados
                          </h5>
                          <p className="text-sm text-orange-700 dark:text-black-300 mt-1">
                            {importPreview.duplicateProducts?.length} produto(s) já existem no estoque. 
                            Por padrão serão importados como <strong>novos lotes</strong>.
                            Use a coluna &quot;Ação&quot; para escolher o que fazer com cada um.
                          </p>
                          <p className="text-xs text-orange-600 dark:text-black-400 mt-2">
                            💡 Linhas laranjas = produto existente | &quot;+ Lote&quot; adiciona estoque | &quot;Criar Novo&quot; cria produto separado
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-card border border-border rounded-lg overflow-hidden max-h-[500px] overflow-auto">
                    <table className="min-w-full w-max">
                      <thead className="bg-muted sticky top-0 z-10">
                        <tr>
                          <th className="px-2 py-2 text-left text-card-foreground font-medium text-xs min-w-[80px]">Código</th>
                          <th className="px-2 py-2 text-left text-card-foreground font-medium text-xs min-w-[150px]">Nome</th>
                          <th className="px-2 py-2 text-left text-card-foreground font-medium text-xs min-w-[90px]">Custo (R$)</th>
                          <th className="px-2 py-2 text-left text-card-foreground font-medium text-xs min-w-[80px]">Margem (%)</th>
                          <th className="px-2 py-2 text-left text-card-foreground font-medium text-xs min-w-[90px]">Venda (R$)</th>
                          <th className="px-2 py-2 text-left text-card-foreground font-medium text-xs min-w-[60px]">Qtd</th>
                          <th className="px-2 py-2 text-left text-card-foreground font-medium text-xs min-w-[60px]">Un/Cx</th>
                          <th className="px-2 py-2 text-center text-card-foreground font-medium text-xs min-w-[80px]">Vende Un?</th>
                          <th className="px-2 py-2 text-left text-card-foreground font-medium text-xs min-w-[70px]">Status</th>
                          <th className="px-2 py-2 text-left text-card-foreground font-medium text-xs min-w-[110px]">Ação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importPreview.previewItems.map((item, index) => {
                          const costPrice = editedImportItems[index]?.costPrice ?? item.costPrice ?? item.salePrice;
                          const salePrice = getEditedImportPrice(index, item.salePrice);
                          const markup = editedImportItems[index]?.markupPercentage ?? (costPrice > 0 ? ((salePrice - costPrice) / costPrice * 100) : 0);
                          // Puxar unitsPerPackage e sellByUnit do produto existente se houver
                          const unitsPerPackage = editedImportItems[index]?.unitsPerPackage ?? item.existing?.unitsPerPackage ?? 1;
                          const sellByUnit = editedImportItems[index]?.sellByUnit ?? item.existing?.sellByUnit ?? false;
                          const editedName = editedImportItems[index]?.name ?? item.name;
                          const action = duplicateAction[index] ?? (item.existing ? 'addBatch' : 'createNew');
                          const isExisting = !!item.existing;
                          
                          return (
                          <tr 
                            key={index} 
                            className={`border-t border-border ${
                              isExisting 
                                ? 'bg-orange-50 dark:bg-orange-900/30 hover:bg-orange-100 dark:hover:bg-orange-900/40' 
                                : 'hover:bg-muted/50'
                            }`}
                          >
                            <td className="px-2 py-2 text-card-foreground text-xs">
                              {item.internalCode || item.barcode}
                              {isExisting && item.existing?.matchType && (
                                <span className="block text-[10px] text-orange-600 dark:text-orange-400">
                                  ({item.existing.matchType === 'xmlCode' ? 'Cód XML' : 
                                    item.existing.matchType === 'barcode' ? 'EAN' :
                                    item.existing.matchType === 'internalCode' ? 'Cód Int' : 'Nome'})
                                </span>
                              )}
                            </td>
                            <td className="px-2 py-2 text-card-foreground text-xs max-w-[120px]">
                              <div className="relative">
                                <input
                                  type="text"
                                  value={editedName}
                                  onChange={(e) => handleImportNameChange(index, e.target.value)}
                                  className={`w-full px-1 py-1 border rounded text-xs text-card-foreground focus:ring-1 focus:ring-ring ${
                                    nameExistsCheck[index] 
                                      ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/30' 
                                      : isExisting 
                                        ? 'border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/30' 
                                        : 'border-input bg-background'
                                  }`}
                                  placeholder="Nome do produto"
                                  title={editedName}
                                />
                                {nameExistsCheck[index] && (
                                  <span className="absolute right-1 top-1 text-red-500 text-xs">⚠️</span>
                                )}
                              </div>
                              {isExisting && item.existing?.name !== editedName && (
                                <span className="text-[10px] text-orange-600 dark:text-orange-400 truncate block" title={`Existente: ${item.existing?.name}`}>
                                  → {item.existing?.name?.substring(0, 20)}...
                                </span>
                              )}
                              {nameExistsCheck[index] && (
                                <span className="text-[10px] text-red-600 dark:text-red-400 truncate block">
                                  Nome já existe no estoque
                                </span>
                              )}
                            </td>
                            {/* Preço de Custo */}
                            <td className="px-2 py-2">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={costPrice.toFixed(2)}
                                onChange={(e) => handleImportCostPriceChange(index, e.target.value)}
                                className={`w-20 px-1 py-1 border rounded text-xs text-card-foreground focus:ring-1 focus:ring-ring ${
                                  isExisting ? 'border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/30' : 'border-input bg-background'
                                }`}
                                placeholder="0.00"
                              />
                            </td>
                            {/* Margem */}
                            <td className="px-2 py-2">
                              <input
                                type="number"
                                step="0.01"
                                value={markup.toFixed(1)}
                                onChange={(e) => handleImportMarkupChange(index, e.target.value)}
                                className="w-16 px-1 py-1 border border-blue-300 dark:border-blue-700 rounded text-xs text-card-foreground bg-blue-50 dark:bg-blue-900/30 focus:ring-1 focus:ring-blue-500"
                                placeholder="0"
                              />
                            </td>
                            {/* Preço de Venda */}
                            <td className="px-2 py-2">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={salePrice.toFixed(2)}
                                onChange={(e) => handleImportPriceChange(index, e.target.value)}
                                className="w-20 px-1 py-1 border border-green-300 dark:border-green-700 rounded text-xs text-card-foreground bg-green-50 dark:bg-green-900/30 focus:ring-1 focus:ring-green-500"
                                placeholder="0.00"
                              />
                            </td>
                            {/* Quantidade */}
                            <td className="px-2 py-2">
                              <input
                                type="number"
                                min="0"
                                step="1"
                                value={getEditedImportQuantity(index, item.quantity)}
                                onChange={(e) => handleImportQuantityChange(index, e.target.value)}
                                className={`w-14 px-1 py-1 border rounded text-xs text-card-foreground focus:ring-1 focus:ring-ring ${
                                  isExisting ? 'border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/30' : 'border-input bg-background'
                                }`}
                                placeholder="0"
                              />
                            </td>
                            {/* Unidades por Caixa */}
                            <td className="px-2 py-2">
                              <input
                                type="number"
                                min="1"
                                step="1"
                                value={unitsPerPackage}
                                onChange={(e) => handleImportUnitsPerPackageChange(index, e.target.value)}
                                className={`w-12 px-1 py-1 border rounded text-xs text-card-foreground focus:ring-1 focus:ring-ring ${
                                  isExisting ? 'border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/30' : 'border-input bg-background'
                                }`}
                                placeholder="1"
                                disabled={isExisting && action === 'addBatch'}
                                title={isExisting && action === 'addBatch' ? 'Herdado do produto existente' : ''}
                              />
                            </td>
                            {/* Vende por Unidade */}
                            <td className="px-2 py-2 text-center">
                              <input
                                type="checkbox"
                                checked={sellByUnit}
                                onChange={(e) => handleImportSellByUnitChange(index, e.target.checked)}
                                className="w-4 h-4 rounded border-border cursor-pointer"
                                disabled={isExisting && action === 'addBatch'}
                                title={isExisting && action === 'addBatch' ? 'Herdado do produto existente' : ''}
                              />
                            </td>
                            {/* Status */}
                            <td className="px-2 py-2">
                              {isExisting ? (
                                <div className="flex flex-col">
                                  <span className="text-orange-700 dark:text-orange-300 text-xs font-medium">
                                    📦 Existe
                                  </span>
                                  <span className="text-[10px] text-orange-600 dark:text-orange-400">
                                    Est: {item.existing?.currentQuantity || 0}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-green-700 dark:text-green-300 text-xs font-medium">✨ Novo</span>
                              )}
                            </td>
                            {/* Ação */}
                            <td className="px-2 py-2">
                              {isExisting ? (
                                <select
                                  value={action}
                                  onChange={(e) => setDuplicateAction(prev => ({
                                    ...prev,
                                    [index]: e.target.value as 'addBatch' | 'createNew' | 'skip'
                                  }))}
                                  className="w-24 px-1 py-1 border border-orange-300 dark:border-orange-700 rounded text-xs text-card-foreground bg-orange-50 dark:bg-orange-900/30 focus:ring-1 focus:ring-orange-500"
                                >
                                  <option value="addBatch">+ Lote</option>
                                  <option value="createNew">Criar Novo</option>
                                  <option value="skip">Pular</option>
                                </select>
                              ) : (
                                <span className="text-xs text-muted-foreground">Criar</span>
                              )}
                            </td>
                          </tr>
                        )})}
                      </tbody>
                    </table>
                  </div>

                  {/* Legenda */}
                  <div className="bg-muted/50 p-3 rounded-lg text-xs text-muted-foreground">
                    <p className="font-medium mb-1">📝 Legenda:</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      <span><strong>Custo:</strong> Preço de compra (NF-e)</span>
                      <span><strong>Margem:</strong> % de lucro sobre o custo</span>
                      <span><strong>Venda:</strong> Preço final de venda</span>
                      <span><strong>Un/Cx:</strong> Unidades por caixa</span>
                      <span><strong>+ Lote:</strong> Adiciona ao produto existente</span>
                      <span><strong>Criar Novo:</strong> Cria produto separado</span>
                    </div>
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

      {/* Modal de Produto Duplicado */}
      {showDuplicateModal && existingProduct && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border border-border w-11/12 max-w-md shadow-lg rounded-lg bg-card">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-card-foreground flex items-center gap-2">
                  <span className="text-2xl">⚠️</span> Produto já existe
                </h3>
                <button
                  onClick={handleCancelDuplicate}
                  className="text-card-foreground hover:text-muted-foreground"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-4">
                <p className="text-card-foreground">
                  O produto <strong>&quot;{existingProduct.name}&quot;</strong> já está cadastrado no sistema.
                </p>
                <p className="text-muted-foreground mt-2 text-sm">
                  Se continuar, um <strong>novo lote</strong> será adicionado a este produto com a quantidade e preços informados.
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleCancelDuplicate}
                  className="px-4 py-2 border border-border rounded-md text-card-foreground hover:bg-accent transition-colors"
                >
                  ❌ Cancelar
                </button>
                <button
                  onClick={handleConfirmDuplicate}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-md hover:from-amber-400 hover:to-orange-400 transition-all shadow-md"
                >
                  ✅ Adicionar como Lote
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

              {/* Seletor de Tipo de Formulário */}
              <div className="mb-6 p-4 bg-accent/50 rounded-lg border border-border">
                <label className="block text-sm font-medium text-foreground mb-3">Tipo de Produto</label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setFormType('simple')}
                    className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                      formType === 'simple'
                        ? 'border-primary bg-primary/10 text-primary font-semibold'
                        : 'border-border bg-background text-muted-foreground hover:border-primary/50'
                    }`}
                  >
                    <div className="text-lg mb-1">📦</div>
                    <div className="font-medium">Simples</div>
                    <div className="text-xs mt-1">Cadastro básico de produtos</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormType('ecommerce')}
                    className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                      formType === 'ecommerce'
                        ? 'border-primary bg-primary/10 text-primary font-semibold'
                        : 'border-border bg-background text-muted-foreground hover:border-primary/50'
                    }`}
                  >
                    <div className="text-lg mb-1">🛒</div>
                    <div className="font-medium">E-commerce</div>
                    <div className="text-xs mt-1">Com SKU, peso, dimensões, etc</div>
                  </button>
                </div>
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
                  <label className="block text-sm font-medium text-foreground">Preço de Custo</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.costPrice}
                    onChange={(e) => handleCostPriceChange(e.target.value)}
                    className="mt-1 block w-full bg-background border border-input rounded-md shadow-sm px-3 py-2 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-2">Preço de Venda</label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Valor (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.salePrice}
                        onChange={(e) => handleSalePriceChange(e.target.value)}
                        className="block w-full bg-background border border-input rounded-md shadow-sm px-3 py-2 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                        placeholder="0.00"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Margem (%)</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          value={markupPercentage}
                          onChange={(e) => handleMarkupChange(e.target.value)}
                          className="block w-full bg-background border border-input rounded-md shadow-sm px-3 py-2 pr-8 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                          placeholder="0.00"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                      </div>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Altere o valor ou a margem - o outro será calculado automaticamente
                  </p>
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
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-foreground">Observação do Lote</label>
                  <textarea
                    value={formData.observation || ''}
                    onChange={(e) => setFormData({ ...formData, observation: e.target.value })}
                    className="mt-1 block w-full bg-background border border-input rounded-md shadow-sm px-3 py-2 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                    rows={2}
                    placeholder="Observações sobre este lote (ex: fornecedor, condições, etc.)"
                  />
                </div>

                {/* Campos Adicionais para E-commerce */}
                {formType === 'ecommerce' && (
                  <>
                    <div className="md:col-span-2 mt-4 pt-4 border-t border-border">
                      <h4 className="text-md font-semibold text-foreground mb-4">📦 Informações de E-commerce</h4>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground">SKU</label>
                      <input
                        type="text"
                        value={formData.sku || ''}
                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                        className="mt-1 block w-full bg-background border border-input rounded-md shadow-sm px-3 py-2 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                        placeholder="SKU único do produto"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground">Categoria</label>
                      <select
                        value={formData.categoryId || ''}
                        onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                        className="mt-1 block w-full bg-background border border-input rounded-md shadow-sm px-3 py-2 text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                      >
                        <option value="">Selecione uma categoria</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground">Marca</label>
                      <input
                        type="text"
                        value={formData.brandName || ''}
                        onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                        className="mt-1 block w-full bg-background border border-input rounded-md shadow-sm px-3 py-2 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                        placeholder="Nome da marca"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground">Fabricante</label>
                      <input
                        type="text"
                        value={formData.manufacturer || ''}
                        onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                        className="mt-1 block w-full bg-background border border-input rounded-md shadow-sm px-3 py-2 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                        placeholder="Nome do fabricante"
                      />
                    </div>

                    <div className="md:col-span-2 mt-4 pt-4 border-t border-border">
                      <h4 className="text-md font-semibold text-foreground mb-4">📐 Dimensões e Peso</h4>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground">Peso (kg)</label>
                      <input
                        type="number"
                        step="0.001"
                        value={formData.weight || ''}
                        onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) || 0 })}
                        className="mt-1 block w-full bg-background border border-input rounded-md shadow-sm px-3 py-2 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                        placeholder="0.000"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground">Comprimento (cm)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.length || ''}
                        onChange={(e) => setFormData({ ...formData, length: parseFloat(e.target.value) || 0 })}
                        className="mt-1 block w-full bg-background border border-input rounded-md shadow-sm px-3 py-2 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground">Largura (cm)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.width || ''}
                        onChange={(e) => setFormData({ ...formData, width: parseFloat(e.target.value) || 0 })}
                        className="mt-1 block w-full bg-background border border-input rounded-md shadow-sm px-3 py-2 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground">Altura (cm)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.height || ''}
                        onChange={(e) => setFormData({ ...formData, height: parseFloat(e.target.value) || 0 })}
                        className="mt-1 block w-full bg-background border border-input rounded-md shadow-sm px-3 py-2 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>

                    <div className="md:col-span-2 mt-4 pt-4 border-t border-border">
                      <h4 className="text-md font-semibold text-foreground mb-4">📝 Informações de Marketing</h4>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-foreground">Descrição Curta</label>
                      <textarea
                        value={formData.shortDescription || ''}
                        onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                        className="mt-1 block w-full bg-background border border-input rounded-md shadow-sm px-3 py-2 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                        rows={2}
                        placeholder="Breve resumo do produto para listagens"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground">Meta Title (SEO)</label>
                      <input
                        type="text"
                        value={formData.metaTitle || ''}
                        onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                        className="mt-1 block w-full bg-background border border-input rounded-md shadow-sm px-3 py-2 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                        placeholder="Título para SEO"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground">Tags</label>
                      <input
                        type="text"
                        value={formData.tags || ''}
                        onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                        className="mt-1 block w-full bg-background border border-input rounded-md shadow-sm px-3 py-2 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                        placeholder="tag1, tag2, tag3"
                      />
                      <p className="mt-1 text-xs text-muted-foreground">Separe as tags por vírgula</p>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-foreground">Meta Description (SEO)</label>
                      <textarea
                        value={formData.metaDescription || ''}
                        onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                        className="mt-1 block w-full bg-background border border-input rounded-md shadow-sm px-3 py-2 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                        rows={2}
                        placeholder="Descrição para motores de busca (máx 160 caracteres)"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground">Garantia (meses)</label>
                      <input
                        type="number"
                        value={formData.warrantyMonths || ''}
                        onChange={(e) => setFormData({ ...formData, warrantyMonths: parseInt(e.target.value) || 0 })}
                        className="mt-1 block w-full bg-background border border-input rounded-md shadow-sm px-3 py-2 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                        placeholder="12"
                      />
                    </div>
                  </>
                )}

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
          <div className="relative bg-level-1 top-20 mx-auto p-5 border border-border w-11/12 max-w-3xl shadow-lg rounded-lg bg-[hsl(var(--card))] text-[hsl(var(--card-foreground))]">
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

              {/* Seletor de Tipo de Produto */}
              <div className="mb-6 p-4 bg-accent/50 rounded-lg border border-border">
                <label className="block text-sm font-medium text-foreground mb-3">Tipo de Produto</label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setEditFormType('simple');
                      setFormData({ ...formData, productType: 'simple' });
                    }}
                    className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                      editFormType === 'simple'
                        ? 'border-primary bg-primary/10 text-primary font-semibold'
                        : 'border-border bg-background text-muted-foreground hover:border-primary/50'
                    }`}
                  >
                    <div className="text-lg mb-1">📦</div>
                    <div className="font-medium">Simples</div>
                    <div className="text-xs mt-1">Venda local/balcão</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditFormType('marketplace');
                      setFormData({ ...formData, productType: 'marketplace' });
                    }}
                    className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                      editFormType === 'marketplace'
                        ? 'border-primary bg-primary/10 text-primary font-semibold'
                        : 'border-border bg-background text-muted-foreground hover:border-primary/50'
                    }`}
                  >
                    <div className="text-lg mb-1">🛒</div>
                    <div className="font-medium">Marketplace</div>
                    <div className="text-xs mt-1">Vendas online</div>
                  </button>
                </div>
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
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-3">💰 Preços e Margem de Lucro</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div>
                      <label className="block text-sm font-medium text-black-700 dark:text-black-300 mb-1">Preço de Custo (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.costPrice}
                        onChange={(e) => {
                          const newCostPrice = e.target.value;
                          setFormData({ ...formData, costPrice: newCostPrice });
                          if (editMarkupPercentage) {
                            updateSalePriceFromMarkup(newCostPrice, editMarkupPercentage);
                          }
                        }}
                        className="w-full px-3 py-2 bg-background border border-blue-300 dark:border-blue-700 rounded text-foreground focus:ring-2 focus:ring-blue-500"
                        placeholder="0.00"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black-700 dark:text-black-300 mb-1">Margem de Lucro (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={editMarkupPercentage}
                        onChange={(e) => {
                          const newMarkup = e.target.value;
                          setEditMarkupPercentage(newMarkup);
                          setFormData({ ...formData, markupPercentage: newMarkup });
                          updateSalePriceFromMarkup(formData.costPrice, newMarkup);
                        }}
                        className="w-full px-3 py-2 bg-background border border-blue-300 dark:border-blue-700 rounded text-foreground focus:ring-2 focus:ring-blue-500"
                        placeholder="30.0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black-700 dark:text-black-300 mb-1">Preço de Venda (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.salePrice}
                        onChange={(e) => {
                          const newSalePrice = e.target.value;
                          setFormData({ ...formData, salePrice: newSalePrice });
                          updateMarkupFromPrices(formData.costPrice, newSalePrice);
                        }}
                        className="w-full px-3 py-2 bg-background border border-blue-300 dark:border-blue-700 rounded text-foreground focus:ring-2 focus:ring-blue-500"
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-black-600 dark:text-black-400">
                    💡 Altere o preço de custo ou margem para recalcular automaticamente o preço de venda
                  </p>
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

                {/* Seção de Unidades/Embalagens */}
                <div className="md:col-span-2 mt-4 pt-4 border-t border-border">
                  <h4 className="text-md font-semibold text-foreground mb-4">📦 Configuração de Unidades</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Configure como o produto é vendido. Ex: Uma caixa com 10 lâmpadas pode ser vendida como caixa inteira ou por unidade.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground">Nome da Embalagem</label>
                  <input
                    type="text"
                    value={formData.packageName || 'Caixa'}
                    onChange={(e) => setFormData({ ...formData, packageName: e.target.value })}
                    className="mt-1 block w-full bg-background border border-input rounded-md shadow-sm px-3 py-2 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                    placeholder="Ex: Caixa, Pacote, Fardo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground">Nome da Unidade</label>
                  <input
                    type="text"
                    value={formData.unitName || 'Unidade'}
                    onChange={(e) => setFormData({ ...formData, unitName: e.target.value })}
                    className="mt-1 block w-full bg-background border border-input rounded-md shadow-sm px-3 py-2 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                    placeholder="Ex: Unidade, Peça, Item"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground">Unidades por Embalagem</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.unitsPerPackage || 1}
                    onChange={(e) => setFormData({ ...formData, unitsPerPackage: parseInt(e.target.value) || 1 })}
                    className="mt-1 block w-full bg-background border border-input rounded-md shadow-sm px-3 py-2 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                    placeholder="1"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">Quantas unidades vêm em cada embalagem</p>
                </div>

                <div className="flex flex-col justify-center">
                  <label className="flex items-center gap-3 cursor-pointer p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <input
                      type="checkbox"
                      checked={formData.sellByUnit || false}
                      onChange={(e) => setFormData({ ...formData, sellByUnit: e.target.checked })}
                      className="w-5 h-5 rounded border-blue-300 text-gray-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="font-medium text-blue-700 dark:text-black-300">Vender por Unidade</span>
                      <p className="text-xs text-blue-600 dark:text-black-400">Permite vender itens individuais da embalagem</p>
                    </div>
                  </label>
                </div>

                {formData.sellByUnit && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-foreground">Preço por Unidade (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.unitPrice || ''}
                      onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                      className="mt-1 block w-full bg-background border border-blue-300 dark:border-blue-700 rounded-md shadow-sm px-3 py-2 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      placeholder="0.00"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      💡 Preço mínimo sugerido: R$ {formData.salePrice && formData.unitsPerPackage ? (parseFloat(formData.salePrice) / (formData.unitsPerPackage || 1)).toFixed(2) : '0.00'} por unidade
                    </p>
                  </div>
                )}

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

      {/* Modal de Edição de Lote */}
      {showBatchModal && editingBatch && (
        <div className="fixed inset-0 bg-background backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative bg-level-1 top-20 mx-auto p-5 border border-border w-11/12 max-w-lg shadow-lg rounded-lg bg-[hsl(var(--card))] text-[hsl(var(--card-foreground))]">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-foreground">Editar Lote</h3>
                <button
                  onClick={cancelBatchEdit}
                  className="text-foreground hover:text-muted-foreground"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>

              <form onSubmit={handleUpdateBatch} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground">Data de Compra</label>
                  <input
                    type="date"
                    value={editingBatch.purchaseDate}
                    onChange={(e) => setEditingBatch({ ...editingBatch, purchaseDate: e.target.value })}
                    className="mt-1 block w-full bg-background border border-input rounded-md shadow-sm px-3 py-2 text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground">Preço de Custo</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingBatch.costPrice}
                    onChange={(e) => setEditingBatch({ ...editingBatch, costPrice: e.target.value })}
                    className="mt-1 block w-full bg-background border border-input rounded-md shadow-sm px-3 py-2 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground">Preço de Venda</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingBatch.sellingPrice}
                    onChange={(e) => setEditingBatch({ ...editingBatch, sellingPrice: e.target.value })}
                    className="mt-1 block w-full bg-background border border-input rounded-md shadow-sm px-3 py-2 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground">Quantidade Recebida</label>
                  <input
                    type="number"
                    value={editingBatch.quantityReceived}
                    onChange={(e) => setEditingBatch({ ...editingBatch, quantityReceived: parseInt(e.target.value) || 0 })}
                    className="mt-1 block w-full bg-background border border-input rounded-md shadow-sm px-3 py-2 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                    required
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground">Quantidade Restante</label>
                  <input
                    type="number"
                    value={editingBatch.quantityRemaining}
                    onChange={(e) => setEditingBatch({ ...editingBatch, quantityRemaining: parseInt(e.target.value) || 0 })}
                    className="mt-1 block w-full bg-background border border-input rounded-md shadow-sm px-3 py-2 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                    required
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground">Observação do Lote</label>
                  <textarea
                    value={editingBatch.observation || ''}
                    onChange={(e) => setEditingBatch({ ...editingBatch, observation: e.target.value })}
                    className="mt-1 block w-full bg-background border border-input rounded-md shadow-sm px-3 py-2 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                    rows={3}
                    placeholder="Observações sobre este lote (ex: fornecedor, condições, etc.)"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={cancelBatchEdit}
                    className="px-6 py-2.5 text-gray-700 font-semibold rounded-lg bg-white hover:bg-gray-50 border-2 border-gray-300 hover:border-gray-400 shadow-md hover:shadow-lg transition-all duration-200 active:scale-95"
                  >
                    ❌ Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 text-white font-semibold rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-600 shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95"
                  >
                    💾 Atualizar Lote
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Importação Excel */}
      {showExcelImportModal && (
        <div className="fixed inset-0 bg-background backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative bg-level-1 top-20 mx-auto p-5 border border-border w-11/12 max-w-lg shadow-lg rounded-lg bg-card">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-card-foreground">Importar Estoque do Excel</h3>
                <button
                  onClick={() => {
                    setShowExcelImportModal(false);
                    setExcelFile(null);
                  }}
                  className="text-card-foreground hover:text-muted-foreground"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg mb-4">
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">📋 Instruções</h4>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• Use o mesmo formato exportado pelo sistema</li>
                  <li>• O arquivo deve ter colunas: Código Interno, Nome, Preço de Custo, Preço de Venda, etc.</li>
                  <li>• Produtos existentes serão atualizados, novos serão criados</li>
                </ul>
              </div>

              <form onSubmit={handleImportExcel} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-2">
                    Selecione o arquivo Excel (.xlsx)
                  </label>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => setExcelFile(e.target.files?.[0] || null)}
                    className="block w-full text-sm text-card-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowExcelImportModal(false);
                      setExcelFile(null);
                    }}
                    className="px-4 py-2 border border-border rounded-md text-card-foreground hover:bg-accent"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={!excelFile || importingExcel}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
                  >
                    {importingExcel ? 'Importando...' : 'Importar'}
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
