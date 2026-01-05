'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import JsBarcode from 'jsbarcode';

interface Product {
  id: string;
  internalCode: string;
  barcode: string | null;
  name: string;
  salePrice: string;
  costPrice: string;
}

// Constantes de folha A4 (em mm)
const A4_WIDTH = 210;
const A4_HEIGHT = 297;

// Modelos de etiqueta A4 (em mm)
// labelWidth/labelHeight = dimensões da ETIQUETA
// marginTop/marginLeft/marginRight/marginBottom = margens da FOLHA
// spacingX/spacingY = espaçamento entre etiquetas
const labelTemplates = {
  'ca4348-a4348': {
    name: 'CA4348 / Pimaco A4348 - 96 por folha',
    description: '6 colunas x 16 linhas - Etiqueta: 31mm x 17mm',
    cols: 6,
    rows: 16,
    labelWidth: 31,
    labelHeight: 17,
    marginTop: 10.6,
    marginLeft: 8.5,
    marginRight: 8.5,
    marginBottom: 10.6,
    spacingX: 3.3,
    spacingY: 0,
  },
  'pimaco-6080': {
    name: 'Pimaco 6080 - 10 por folha',
    description: '2 colunas x 5 linhas - Etiqueta: 101,6mm x 50,8mm',
    cols: 2,
    rows: 5,
    labelWidth: 101.6,
    labelHeight: 50.8,
    marginTop: 12.7,
    marginLeft: 4.7,
    marginRight: 4.7,
    marginBottom: 12.7,
    spacingX: 2.5,
    spacingY: 0,
  },
  'pimaco-6181': {
    name: 'Pimaco 6181 - 20 por folha',
    description: '4 colunas x 5 linhas - Etiqueta: 50,8mm x 25,4mm',
    cols: 4,
    rows: 5,
    labelWidth: 50.8,
    labelHeight: 25.4,
    marginTop: 21.2,
    marginLeft: 4.7,
    marginRight: 4.7,
    marginBottom: 21.2,
    spacingX: 0,
    spacingY: 0,
  },
  'pimaco-6082': {
    name: 'Pimaco 6082 - 14 por folha',
    description: '2 colunas x 7 linhas - Etiqueta: 101,6mm x 33,9mm',
    cols: 2,
    rows: 7,
    labelWidth: 101.6,
    labelHeight: 33.9,
    marginTop: 12.7,
    marginLeft: 4.7,
    marginRight: 4.7,
    marginBottom: 12.7,
    spacingX: 2.5,
    spacingY: 0,
  },
  'pimaco-6083': {
    name: 'Pimaco 6083 - 21 por folha',
    description: '3 colunas x 7 linhas - Etiqueta: 63,5mm x 38,1mm',
    cols: 3,
    rows: 7,
    labelWidth: 63.5,
    labelHeight: 38.1,
    marginTop: 12.7,
    marginLeft: 8,
    marginRight: 8,
    marginBottom: 12.7,
    spacingX: 2.5,
    spacingY: 0,
  },
  'pimaco-6184': {
    name: 'Pimaco 6184 - 65 por folha',
    description: '5 colunas x 13 linhas - Etiqueta: 38,1mm x 21,2mm',
    cols: 5,
    rows: 13,
    labelWidth: 38.1,
    labelHeight: 21.2,
    marginTop: 12.7,
    marginLeft: 8,
    marginRight: 8,
    marginBottom: 12.7,
    spacingX: 2.5,
    spacingY: 0,
  },
  'pimaco-6287': {
    name: 'Pimaco 6287 - 33 por folha',
    description: '3 colunas x 11 linhas - Etiqueta: 66,7mm x 25,4mm',
    cols: 3,
    rows: 11,
    labelWidth: 66.7,
    labelHeight: 25.4,
    marginTop: 12.7,
    marginLeft: 4.2,
    marginRight: 4.2,
    marginBottom: 12.7,
    spacingX: 2,
    spacingY: 0,
  },
  'custom': {
    name: 'Personalizado',
    description: 'Configure suas próprias dimensões',
    cols: 3,
    rows: 7,
    labelWidth: 63.5,
    labelHeight: 38.1,
    marginTop: 12.7,
    marginLeft: 8,
    marginRight: 8,
    marginBottom: 12.7,
    spacingX: 2.5,
    spacingY: 0,
  },
};

type TemplateKey = keyof typeof labelTemplates;

interface LabelItem {
  product: Product;
  quantity: number;
}

export default function EtiquetasPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateKey>('ca4348-a4348');
  const [customTemplate, setCustomTemplate] = useState(labelTemplates['custom']);
  const [labelItems, setLabelItems] = useState<LabelItem[]>([]);
  const [showPrice, setShowPrice] = useState(true);
  const [showBarcode, setShowBarcode] = useState(true);
  const [showCode, setShowCode] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [previewMode, setPreviewMode] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const fetchProducts = useCallback(async () => {
    try {
      const response = await fetch('/api/products');
      if (!response.ok) throw new Error('Erro ao carregar produtos');
      const data = await response.json();
      setProducts(data || []);
      setFilteredProducts(data || []);
    } catch {
      toast.error('Erro ao carregar produtos');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Detectar clique fora do container de busca para fechar o dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsSearchFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredProducts(products);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredProducts(
        products.filter(
          (p) =>
            p.name.toLowerCase().includes(term) ||
            p.internalCode.toLowerCase().includes(term) ||
            (p.barcode && p.barcode.toLowerCase().includes(term))
        )
      );
    }
  }, [searchTerm, products]);

  const getTemplate = () => {
    if (selectedTemplate === 'custom') {
      return customTemplate;
    }
    return labelTemplates[selectedTemplate];
  };

  const addProduct = (product: Product) => {
    const existing = labelItems.find((item) => item.product.id === product.id);
    if (existing) {
      setLabelItems(
        labelItems.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    } else {
      setLabelItems([...labelItems, { product, quantity: 1 }]);
    }
    setSearchTerm('');
    setIsSearchFocused(false);
    toast.success(`${product.name} adicionado`);
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setLabelItems(labelItems.filter((item) => item.product.id !== productId));
    } else {
      setLabelItems(
        labelItems.map((item) =>
          item.product.id === productId ? { ...item, quantity } : item
        )
      );
    }
  };

  const removeProduct = (productId: string) => {
    setLabelItems(labelItems.filter((item) => item.product.id !== productId));
  };

  const getTotalLabels = () => {
    return labelItems.reduce((sum, item) => sum + item.quantity, 0);
  };

  const generateLabelsArray = () => {
    const labels: Product[] = [];
    labelItems.forEach((item) => {
      for (let i = 0; i < item.quantity; i++) {
        labels.push(item.product);
      }
    });
    return labels;
  };

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);
  };

  const generateBarcode = (code: string): string => {
    // Cria um canvas temporário para gerar o código de barras
    const canvas = document.createElement('canvas');
    try {
      JsBarcode(canvas, code, {
        format: 'CODE128',
        width: 1.5,
        height: 30,
        displayValue: false,
        margin: 0,
      });
      return canvas.toDataURL('image/png');
    } catch {
      return '';
    }
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) {
      toast.error('Não foi possível abrir a janela de impressão');
      return;
    }

    const template = getTemplate();
    const labels = generateLabelsArray();
    const labelsPerPage = template.cols * template.rows;
    const pages = Math.ceil(labels.length / labelsPerPage);

    let pagesHtml = '';
    for (let page = 0; page < pages; page++) {
      const startIdx = page * labelsPerPage;
      const pageLabels = labels.slice(startIdx, startIdx + labelsPerPage);
      
      pagesHtml += `
        <div class="page" style="
          width: 210mm;
          height: 297mm;
          box-sizing: border-box;
          display: flex;
          justify-content: center;
          page-break-after: ${page < pages - 1 ? 'always' : 'auto'};
        ">
          <div style="
            padding-top: ${template.marginTop}mm;
            display: grid;
            grid-template-columns: repeat(${template.cols}, ${template.labelWidth}mm);
            grid-template-rows: repeat(${template.rows}, ${template.labelHeight}mm);
            gap: ${template.spacingY}mm ${template.spacingX}mm;
            align-content: start;
          ">
          ${pageLabels.map((product, idx) => {
            const barcodeValue = product.barcode || product.internalCode;
            const barcodeImg = showBarcode ? generateBarcode(barcodeValue) : '';
            
            return `
              <div class="label" style="
                width: ${template.labelWidth}mm;
                height: ${template.labelHeight}mm;
                box-sizing: border-box;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                overflow: hidden;
                padding: 1mm;
                font-family: Arial, sans-serif;
              ">
                <div style="font-weight: bold; font-size: ${template.labelHeight < 30 ? '7' : '9'}pt; text-align: center; overflow: hidden; width: 100%; max-height: ${template.labelHeight < 30 ? '10' : '14'}mm; line-height: 1.1;">
                  ${product.name.length > 40 ? product.name.substring(0, 40) + '...' : product.name}
                </div>
                ${showCode ? `<div style="font-size: ${template.labelHeight < 30 ? '6' : '8'}pt; color: #666;">${product.internalCode}</div>` : ''}
                ${showBarcode && barcodeImg ? `<img src="${barcodeImg}" style="max-width: ${template.labelWidth - 4}mm; max-height: ${template.labelHeight < 30 ? '8' : '12'}mm; margin: 1mm 0;" />` : ''}
                ${showBarcode ? `<div style="font-size: ${template.labelHeight < 30 ? '6' : '7'}pt; letter-spacing: 0.5px;">${barcodeValue}</div>` : ''}
                ${showPrice ? `<div style="font-weight: bold; font-size: ${template.labelHeight < 30 ? '8' : '11'}pt; margin-top: 1mm;">${formatCurrency(product.salePrice)}</div>` : ''}
              </div>
            `;
          }).join('')}
          </div>
        </div>
      `;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Impressão de Etiquetas</title>
          <style>
            @media print {
              body { margin: 0; padding: 0; }
              .page { page-break-after: always; }
              .page:last-child { page-break-after: auto; }
            }
            body {
              margin: 0;
              padding: 0;
              font-family: Arial, sans-serif;
            }
            * { box-sizing: border-box; }
          </style>
        </head>
        <body>
          ${pagesHtml}
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); };
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Impressão de Etiquetas</h1>
          <p className="text-muted-foreground">Crie e imprima etiquetas com código de barras para seus produtos</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Painel Esquerdo - Configuração e Seleção */}
          <div className="space-y-6">
            {/* Modelo de Etiqueta */}
            <div className="bg-card border border-border rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Modelo de Etiqueta</h2>
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value as TemplateKey)}
                className="w-full px-3 py-2 bg-background border border-border text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {Object.entries(labelTemplates).map(([key, template]) => (
                  <option key={key} value={key}>
                    {template.name}
                  </option>
                ))}
              </select>
              <p className="text-sm text-muted-foreground mt-2">{getTemplate().description}</p>

              {selectedTemplate === 'custom' && (
                <div className="mt-4 space-y-4">
                  {/* Dimensões da Etiqueta */}
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-2">Dimensões da Etiqueta</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-muted-foreground">Largura (mm)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={customTemplate.labelWidth}
                          onChange={(e) => setCustomTemplate({ ...customTemplate, labelWidth: parseFloat(e.target.value) || 10 })}
                          className="w-full px-2 py-1 bg-background border border-border rounded text-sm text-foreground"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-muted-foreground">Altura (mm)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={customTemplate.labelHeight}
                          onChange={(e) => setCustomTemplate({ ...customTemplate, labelHeight: parseFloat(e.target.value) || 10 })}
                          className="w-full px-2 py-1 bg-background border border-border rounded text-sm text-foreground"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Layout da Folha */}
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-2">Layout da Folha (A4)</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-muted-foreground">Colunas</label>
                        <input
                          type="number"
                          value={customTemplate.cols}
                          onChange={(e) => setCustomTemplate({ ...customTemplate, cols: parseInt(e.target.value) || 1 })}
                          className="w-full px-2 py-1 bg-background border border-border rounded text-sm text-foreground"
                          min="1"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-muted-foreground">Linhas</label>
                        <input
                          type="number"
                          value={customTemplate.rows}
                          onChange={(e) => setCustomTemplate({ ...customTemplate, rows: parseInt(e.target.value) || 1 })}
                          className="w-full px-2 py-1 bg-background border border-border rounded text-sm text-foreground"
                          min="1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Margens da Folha */}
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-2">Margens da Folha (mm)</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-muted-foreground">Superior</label>
                        <input
                          type="number"
                          step="0.1"
                          value={customTemplate.marginTop}
                          onChange={(e) => setCustomTemplate({ ...customTemplate, marginTop: parseFloat(e.target.value) || 0 })}
                          className="w-full px-2 py-1 bg-background border border-border rounded text-sm text-foreground"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-muted-foreground">Esquerda</label>
                        <input
                          type="number"
                          step="0.1"
                          value={customTemplate.marginLeft}
                          onChange={(e) => setCustomTemplate({ ...customTemplate, marginLeft: parseFloat(e.target.value) || 0 })}
                          className="w-full px-2 py-1 bg-background border border-border rounded text-sm text-foreground"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-muted-foreground">Direita</label>
                        <input
                          type="number"
                          step="0.1"
                          value={customTemplate.marginRight}
                          onChange={(e) => setCustomTemplate({ ...customTemplate, marginRight: parseFloat(e.target.value) || 0 })}
                          className="w-full px-2 py-1 bg-background border border-border rounded text-sm text-foreground"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-muted-foreground">Inferior</label>
                        <input
                          type="number"
                          step="0.1"
                          value={customTemplate.marginBottom}
                          onChange={(e) => setCustomTemplate({ ...customTemplate, marginBottom: parseFloat(e.target.value) || 0 })}
                          className="w-full px-2 py-1 bg-background border border-border rounded text-sm text-foreground"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Espaçamento entre Etiquetas */}
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-2">Espaçamento entre Etiquetas (mm)</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-muted-foreground">Horizontal</label>
                        <input
                          type="number"
                          step="0.1"
                          value={customTemplate.spacingX}
                          onChange={(e) => setCustomTemplate({ ...customTemplate, spacingX: parseFloat(e.target.value) || 0 })}
                          className="w-full px-2 py-1 bg-background border border-border rounded text-sm text-foreground"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-muted-foreground">Vertical</label>
                        <input
                          type="number"
                          step="0.1"
                          value={customTemplate.spacingY}
                          onChange={(e) => setCustomTemplate({ ...customTemplate, spacingY: parseFloat(e.target.value) || 0 })}
                          className="w-full px-2 py-1 bg-background border border-border rounded text-sm text-foreground"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Info calculada */}
                  <div className="p-3 bg-level-1 rounded-lg text-xs text-muted-foreground">
                    <div className="font-medium text-foreground mb-1">Informações Calculadas:</div>
                    <div>{customTemplate.cols * customTemplate.rows} etiquetas por folha</div>
                    <div>Etiqueta: {customTemplate.labelWidth}mm x {customTemplate.labelHeight}mm</div>
                    <div>Folha A4: 210mm x 297mm</div>
                  </div>
                </div>
              )}

              {/* Opções de Exibição */}
              <div className="mt-4 space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={showBarcode}
                    onChange={(e) => setShowBarcode(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">Exibir código de barras</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={showPrice}
                    onChange={(e) => setShowPrice(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">Exibir preço</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={showCode}
                    onChange={(e) => setShowCode(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">Exibir código interno</span>
                </label>
              </div>
            </div>

            {/* Busca de Produtos */}
            <div className="bg-card border border-border rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Adicionar Produtos</h2>
              
              {/* Campo de busca com dropdown */}
              <div className="relative" ref={searchContainerRef}>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  placeholder="Buscar por nome, código interno ou código de barras..."
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                
                {/* Dropdown de resultados - só mostra quando em foco */}
                {isSearchFocused && searchTerm.length >= 1 && (
                    <div className="absolute top-full left-0 right-0 border border-border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto" style={{ backgroundColor: 'var(--card)' }}>
                    {filteredProducts.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground">
                        Nenhum produto encontrado para &quot;{searchTerm}&quot;
                      </div>
                    ) : (
                      filteredProducts.slice(0, 10).map((product) => (
                        <div
                          key={product.id}
                          onClick={() => addProduct(product)}
                          className="flex items-center justify-between p-3 border-b border-border last:border-b-0 hover:bg-level-1 cursor-pointer"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-foreground truncate">{product.name}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              Cód: {product.internalCode}
                              {product.barcode && ` | Barras: ${product.barcode}`}
                            </div>
                            <div className="text-sm font-semibold text-green-600">
                              {formatCurrency(product.salePrice)}
                            </div>
                          </div>
                          <button
                            className="ml-2 px-3 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90 text-sm flex-shrink-0"
                          >
                            Adicionar
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Indicador quando não há produtos carregados */}
              {products.length === 0 && !isLoading && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="text-yellow-800 text-sm">
                    <strong>Atenção:</strong> Nenhum produto encontrado no sistema. 
                    Você precisa cadastrar produtos primeiro na página de <a href="/estoque" className="underline hover:text-yellow-900">Estoque</a>.
                  </div>
                </div>
              )}

              {/* Indicador para começar a busca */}
              {products.length > 0 && searchTerm.length === 0 && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-blue-800 text-sm">
                    Digite para buscar produtos ({products.length} produtos disponíveis)
                  </div>
                </div>
              )}
            </div>
            <div className="bg-card border border-border rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-foreground">Produtos Selecionados</h2>
                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                  {getTotalLabels()} etiquetas
                </span>
              </div>

              {labelItems.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  Nenhum produto selecionado.
                  <br />
                  Use a busca acima para adicionar produtos.
                </div>
              ) : (
                <div className="space-y-3">
                  {labelItems.map((item) => (
                    <div
                      key={item.product.id}
                      className="flex items-center justify-between p-3 bg-level-1 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-sm text-foreground">{item.product.name}</div>
                        <div className="text-xs text-muted-foreground">{item.product.internalCode}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center bg-level-2 rounded hover:bg-level-3 text-foreground"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.product.id, parseInt(e.target.value) || 0)}
                          className="w-16 text-center border border-border rounded py-1 bg-background text-foreground"
                          min="0"
                        />
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center bg-level-2 rounded hover:bg-level-3 text-foreground"
                        >
                          +
                        </button>
                        <button
                          onClick={() => removeProduct(item.product.id)}
                          className="ml-2 text-destructive hover:text-destructive/80"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {labelItems.length > 0 && (
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => setPreviewMode(!previewMode)}
                    className="flex-1 px-4 py-2 bg-level-2 text-foreground rounded-lg hover:bg-level-3"
                  >
                    {previewMode ? 'Ocultar Prévia' : 'Visualizar'}
                  </button>
                  <button
                    onClick={handlePrint}
                    className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Imprimir
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Painel Direito - Prévia */}
          <div className="bg-card border border-border rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Pré-visualização</h2>
            
            {!previewMode && labelItems.length === 0 ? (
              <div className="flex items-center justify-center h-96 border-2 border-dashed border-border rounded-lg">
                <div className="text-center text-muted-foreground">
                  <svg className="mx-auto h-12 w-12 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <p className="mt-2">Adicione produtos para visualizar as etiquetas</p>
                </div>
              </div>
            ) : (
              <div ref={printRef} className="border rounded-lg overflow-hidden">
                {/* Preview da folha A4 */}
                <div
                  className="bg-white relative mx-auto"
                  style={{
                    width: '210mm',
                    minHeight: '297mm',
                    transform: 'scale(0.35)',
                    transformOrigin: 'top left',
                    marginBottom: '-65%',
                  }}
                >
                  <div
                    style={{
                      paddingTop: `${getTemplate().marginTop}mm`,
                      paddingLeft: `${getTemplate().marginLeft}mm`,
                      display: 'grid',
                      gridTemplateColumns: `repeat(${getTemplate().cols}, ${getTemplate().labelWidth}mm)`,
                      gridTemplateRows: `repeat(${getTemplate().rows}, ${getTemplate().labelHeight}mm)`,
                      gap: `${getTemplate().spacingY}mm ${getTemplate().spacingX}mm`,
                      alignContent: 'start',
                    }}
                  >
                    {generateLabelsArray()
                      .slice(0, getTemplate().cols * getTemplate().rows)
                      .map((product, idx) => {
                        const barcodeValue = product.barcode || product.internalCode;
                        return (
                          <div
                            key={`${product.id}-${idx}`}
                            className="border border-gray-300 flex flex-col justify-center items-center overflow-hidden"
                            style={{
                              width: `${getTemplate().labelWidth}mm`,
                              height: `${getTemplate().labelHeight}mm`,
                              padding: '1mm',
                              fontSize: getTemplate().labelHeight < 30 ? '7pt' : '9pt',
                            }}
                          >
                            <div className="font-bold text-center overflow-hidden" style={{ maxHeight: getTemplate().labelHeight < 30 ? '10mm' : '14mm', lineHeight: 1.1 }}>
                              {product.name.length > 40 ? product.name.substring(0, 40) + '...' : product.name}
                            </div>
                            {showCode && (
                              <div className="text-gray-600" style={{ fontSize: getTemplate().labelHeight < 30 ? '6pt' : '8pt' }}>
                                {product.internalCode}
                              </div>
                            )}
                            {showBarcode && (
                              <>
                                <svg
                                  id={`barcode-preview-${idx}`}
                                  ref={(el) => {
                                    if (el) {
                                      try {
                                        JsBarcode(el, barcodeValue, {
                                          format: 'CODE128',
                                          width: 1,
                                          height: getTemplate().labelHeight < 30 ? 15 : 25,
                                          displayValue: false,
                                          margin: 0,
                                        });
                                      } catch {
                                        // Ignora erros de código de barras inválido
                                      }
                                    }
                                  }}
                                  style={{
                                    maxWidth: `${getTemplate().labelWidth - 4}mm`,
                                    margin: '1mm 0',
                                  }}
                                />
                                <div style={{ fontSize: getTemplate().labelHeight < 30 ? '6pt' : '7pt', letterSpacing: '0.5px' }}>
                                  {barcodeValue}
                                </div>
                              </>
                            )}
                            {showPrice && (
                              <div className="font-bold" style={{ fontSize: getTemplate().labelHeight < 30 ? '8pt' : '11pt', marginTop: '1mm' }}>
                                {formatCurrency(product.salePrice)}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Info da página */}
                <div className="bg-level-1 p-3 text-center text-sm text-muted-foreground">
                  {getTotalLabels()} etiquetas em {Math.ceil(getTotalLabels() / (getTemplate().cols * getTemplate().rows))} página(s)
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
