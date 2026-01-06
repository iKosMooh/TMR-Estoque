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
  currentQuantity: number;
}

// Constantes de folha A4 (em mm)
const A4_WIDTH = 210;
const A4_HEIGHT = 297;

// Constantes de folha Carta/Letter (em mm)
const LETTER_WIDTH = 216;
const LETTER_HEIGHT = 279;

// Função para obter dimensões da página
const getPageSize = (pageSize: 'A4' | 'letter') => {
  if (pageSize === 'letter') {
    return { width: LETTER_WIDTH, height: LETTER_HEIGHT };
  }
  return { width: A4_WIDTH, height: A4_HEIGHT };
};

// Modelos de etiqueta (em mm)
// pageSize: 'A4' ou 'letter' (Carta)
// labelWidth/labelHeight = dimensões da ETIQUETA
// spacingX/spacingY = espaçamento entre etiquetas
// Margens são calculadas automaticamente para centralizar
const labelTemplates = {
  'ca4348-a4348': {
    name: 'CA4348 / Pimaco A4348 - 96 por folha',
    description: '6 colunas x 16 linhas - Etiqueta: 31mm x 17mm - Folha A4',
    pageSize: 'A4' as const,
    cols: 6,
    rows: 16,
    labelWidth: 31,
    labelHeight: 17,
    spacingX: 3.3,
    spacingY: 0,
  },
  'pimaco-6080': {
    name: 'Pimaco 6080 - 10 por folha',
    description: '2 colunas x 5 linhas - Etiqueta: 101,6mm x 50,8mm - Folha Carta',
    pageSize: 'letter' as const,
    cols: 2,
    rows: 5,
    labelWidth: 101.6,
    labelHeight: 50.8,
    spacingX: 2.5,
    spacingY: 0,
  },
  'pimaco-6181': {
    name: 'Pimaco 6181 - 20 por folha',
    description: '4 colunas x 5 linhas - Etiqueta: 50,8mm x 25,4mm - Folha Carta',
    pageSize: 'letter' as const,
    cols: 4,
    rows: 5,
    labelWidth: 50.8,
    labelHeight: 25.4,
    spacingX: 0,
    spacingY: 0,
  },
  'pimaco-6082': {
    name: 'Pimaco 6082 - 14 por folha',
    description: '2 colunas x 7 linhas - Etiqueta: 101,6mm x 33,9mm - Folha Carta',
    pageSize: 'letter' as const,
    cols: 2,
    rows: 7,
    labelWidth: 101.6,
    labelHeight: 33.9,
    spacingX: 2.5,
    spacingY: 0,
  },
  'pimaco-6083': {
    name: 'Pimaco 6083 - 21 por folha',
    description: '3 colunas x 7 linhas - Etiqueta: 63,5mm x 38,1mm - Folha Carta',
    pageSize: 'letter' as const,
    cols: 3,
    rows: 7,
    labelWidth: 63.5,
    labelHeight: 38.1,
    spacingX: 2.5,
    spacingY: 0,
  },
  'pimaco-6184': {
    name: 'Pimaco 6184 - 65 por folha',
    description: '5 colunas x 13 linhas - Etiqueta: 38,1mm x 21,2mm - Folha Carta',
    pageSize: 'letter' as const,
    cols: 5,
    rows: 13,
    labelWidth: 38.1,
    labelHeight: 21.2,
    spacingX: 2.5,
    spacingY: 0,
  },
  'pimaco-6287': {
    name: 'Pimaco 6287 - 33 por folha',
    description: '3 colunas x 11 linhas - Etiqueta: 66,7mm x 25,4mm - Folha Carta',
    pageSize: 'letter' as const,
    cols: 3,
    rows: 11,
    labelWidth: 66.7,
    labelHeight: 25.4,
    spacingX: 2,
    spacingY: 0,
  },
  'custom': {
    name: 'Personalizado',
    description: 'Configure suas próprias dimensões',
    pageSize: 'A4' as const,
    cols: 3,
    rows: 7,
    labelWidth: 63.5,
    labelHeight: 38.1,
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
  const [customTemplate, setCustomTemplate] = useState<{
    name: string;
    description: string;
    pageSize: 'A4' | 'letter';
    cols: number;
    rows: number;
    labelWidth: number;
    labelHeight: number;
    spacingX: number;
    spacingY: number;
  }>({
    name: 'Personalizado',
    description: 'Configure suas próprias dimensões',
    pageSize: 'A4',
    cols: 3,
    rows: 7,
    labelWidth: 63.5,
    labelHeight: 38.1,
    spacingX: 2.5,
    spacingY: 0,
  });
  const [labelItems, setLabelItems] = useState<LabelItem[]>([]);
  const [showPrice, setShowPrice] = useState(true);
  const [showBarcode, setShowBarcode] = useState(true);
  const [showCode, setShowCode] = useState(true);
  const [boldName, setBoldName] = useState(true);
  const [boldCode, setBoldCode] = useState(false);
  const [boldBarcode, setBoldBarcode] = useState(false);
  const [boldPrice, setBoldPrice] = useState(true);
  const [fontSizeName, setFontSizeName] = useState(9);
  const [fontSizeCode, setFontSizeCode] = useState(8);
  const [fontSizeBarcode, setFontSizeBarcode] = useState(7);
  const [fontSizePrice, setFontSizePrice] = useState(11);
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

  // Carregar produtos selecionados do localStorage (vindos da página de estoque)
  useEffect(() => {
    const selectedProductsJson = localStorage.getItem('selectedProductsForLabels');
    if (selectedProductsJson && products.length > 0) {
      try {
        const selectedIds: string[] = JSON.parse(selectedProductsJson);
        const selectedProducts = products.filter(p => selectedIds.includes(p.id));
        
        if (selectedProducts.length > 0) {
          const newLabelItems = selectedProducts.map(product => ({
            product,
            quantity: Math.max(1, product.currentQuantity), // Usar quantidade em estoque, mínimo 1
          }));
          setLabelItems(newLabelItems);
          const totalLabels = newLabelItems.reduce((sum, item) => sum + item.quantity, 0);
          toast.success(`${selectedProducts.length} produto(s) adicionado(s) - ${totalLabels} etiqueta(s) gerada(s)`);
        }
        
        // Limpar localStorage após carregar
        localStorage.removeItem('selectedProductsForLabels');
      } catch {
        console.error('Erro ao processar produtos selecionados');
      }
    }
  }, [products]);

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

    if (isSearchFocused) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSearchFocused]);

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

  const calculateCenteredMargins = () => {
    const template = getTemplate();
    const page = getPageSize(template.pageSize);
    const totalWidth = template.cols * template.labelWidth + (template.cols - 1) * template.spacingX;
    const totalHeight = template.rows * template.labelHeight + (template.rows - 1) * template.spacingY;
    
    return {
      marginLeft: (page.width - totalWidth) / 2,
      marginTop: (page.height - totalHeight) / 2,
      marginRight: (page.width - totalWidth) / 2,
      marginBottom: (page.height - totalHeight) / 2,
      pageWidth: page.width,
      pageHeight: page.height,
      pageSize: template.pageSize,
    };
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
    const margins = calculateCenteredMargins();
    const labels = generateLabelsArray();
    const labelsPerPage = template.cols * template.rows;
    const pages = Math.ceil(labels.length / labelsPerPage);

    let pagesHtml = '';
    for (let page = 0; page < pages; page++) {
      const startIdx = page * labelsPerPage;
      const pageLabels = labels.slice(startIdx, startIdx + labelsPerPage);
      
      pagesHtml += `
        <div class="page">
          <div class="label-grid">
          ${pageLabels.map((product, idx) => {
            const barcodeValue = product.barcode || product.internalCode;
            const barcodeImg = showBarcode ? generateBarcode(barcodeValue) : '';
            
            return `
              <div class="label">
                <div class="label-name">
                  ${product.name.length > 40 ? product.name.substring(0, 40) + '...' : product.name}
                </div>
                ${showCode ? `<div class="label-code">${product.internalCode}</div>` : ''}
                ${showBarcode && barcodeImg ? `<img class="label-barcode" src="${barcodeImg}" />` : ''}
                ${showBarcode ? `<div class="label-barcode-text">${barcodeValue}</div>` : ''}
                ${showPrice ? `<div class="label-price">${formatCurrency(product.salePrice)}</div>` : ''}
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
            /* Reset e configurações base */
            * { 
              box-sizing: border-box; 
              margin: 0; 
              padding: 0; 
            }
            
            html, body {
              width: ${margins.pageWidth}mm;
              margin: 0;
              padding: 0;
              font-family: Arial, sans-serif;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            
            /* Configurações de impressão */
            @page {
              size: ${margins.pageSize === 'letter' ? 'letter' : 'A4'} portrait;
              margin: 0;
            }
            
            @media print {
              html, body {
                width: ${margins.pageWidth}mm;
                height: ${margins.pageHeight}mm;
              }
              
              .page {
                page-break-after: always;
                page-break-inside: avoid;
              }
              
              .page:last-child {
                page-break-after: auto;
              }
              
              .label {
                page-break-inside: avoid;
              }
              
              /* Remover elementos não imprimíveis */
              .no-print {
                display: none !important;
              }
            }
            
            @media screen {
              body {
                background: #f0f0f0;
                padding: 20px;
              }
              
              .page {
                background: white;
                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                margin-bottom: 20px;
              }
            }
            
            .page {
              width: ${margins.pageWidth}mm;
              height: ${margins.pageHeight}mm;
              position: relative;
              overflow: hidden;
            }
            
            .label-grid {
              position: absolute;
              top: ${margins.marginTop}mm;
              left: ${margins.marginLeft}mm;
              display: grid;
              grid-template-columns: repeat(${template.cols}, ${template.labelWidth}mm);
              gap: ${template.spacingY}mm ${template.spacingX}mm;
            }
            
            .label {
              width: ${template.labelWidth}mm;
              height: ${template.labelHeight}mm;
              display: flex;
              flex-direction: column;
              align-items: center;
              padding: 1mm;
              font-family: Arial, sans-serif;
              box-sizing: border-box;
              overflow: hidden;
            }
            
            .label-name {
              font-weight: ${boldName ? 'bold' : 'normal'} !important;
              font-size: ${fontSizeName}pt !important;
              text-align: center;
              overflow: hidden;
              width: 100%;
              max-height: ${Math.min(template.labelHeight * 0.4, 12)}mm;
              line-height: 1.1;
              color: ${boldName ? '#000' : '#000'};
              margin-bottom: 1mm;
              flex-shrink: 0;
            }
            
            .label-code {
              font-weight: ${boldCode ? 'bold' : 'normal'} !important;
              font-size: ${fontSizeCode}pt !important;
              color: ${boldCode ? '#000' : '#666'};
              margin-bottom: 1mm;
              flex-shrink: 0;
            }
            
            .label-barcode {
              max-width: ${template.labelWidth - 4}mm;
              max-height: ${Math.min(template.labelHeight * 0.25, 10)}mm;
              margin: 1mm 0;
              flex-shrink: 0;
            }
            
            .label-barcode-text {
              font-weight: ${boldBarcode ? 'bold' : 'normal'} !important;
              font-size: ${fontSizeBarcode}pt !important;
              letter-spacing: 0.5px;
              color: ${boldBarcode ? '#000' : '#666'};
              margin-bottom: 1mm;
              flex-shrink: 0;
            }
            
            .label-price {
              font-weight: ${boldPrice ? 'bold' : 'normal'} !important;
              font-size: ${fontSizePrice}pt !important;
              margin-top: 1mm;
              color: ${boldPrice ? '#000' : '#000'};
              flex-shrink: 0;
            }
            
            /* Instruções de impressão */
            .print-instructions {
              position: fixed;
              top: 10px;
              right: 10px;
              background: #fff3cd;
              border: 1px solid #ffc107;
              padding: 15px;
              border-radius: 8px;
              max-width: 300px;
              font-size: 12px;
              z-index: 1000;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            
            .print-instructions h3 {
              margin-bottom: 10px;
              color: #856404;
            }
            
            .print-instructions ul {
              margin-left: 15px;
              color: #856404;
            }
            
            .print-instructions li {
              margin-bottom: 5px;
            }
            
            .print-button {
              display: block;
              width: 100%;
              margin-top: 10px;
              padding: 10px;
              background: #28a745;
              color: white;
              border: none;
              border-radius: 5px;
              cursor: pointer;
              font-size: 14px;
            }
            
            .print-button:hover {
              background: #218838;
            }
          </style>
        </head>
        <body>
          <!-- Instruções de impressão (só aparecem na tela) -->
          <div class="print-instructions no-print">
            <h3>📋 Configurações de Impressão</h3>
            <ul>
              <li><strong>Margens:</strong> Mínimas ou Nenhuma</li>
              <li><strong>Escala:</strong> 100% (sem ajuste)</li>
              <li><strong>Tamanho:</strong> ${margins.pageSize === 'letter' ? 'Carta (Letter)' : 'A4'}</li>
              <li><strong>Orientação:</strong> Retrato</li>
              <li><strong>Cores de fundo:</strong> Ativado (se houver)</li>
            </ul>
            <p style="margin-top: 10px; padding: 8px; background: #d4edda; border-radius: 4px; color: #155724;">
              <strong>⚠️ Importante:</strong> Configure sua impressora para <strong>${margins.pageSize === 'letter' ? 'Carta' : 'A4'}</strong>
            </p>
            <button class="print-button" onclick="window.print()">
              🖨️ Imprimir Etiquetas
            </button>
          </div>
          
          ${pagesHtml}
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

                  {/* Tamanho da Folha */}
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-2">Tamanho da Folha</h4>
                    <select
                      value={customTemplate.pageSize}
                      onChange={(e) => setCustomTemplate({ ...customTemplate, pageSize: e.target.value as 'A4' | 'letter' })}
                      className="w-full px-2 py-1 bg-background border border-border rounded text-sm text-foreground"
                    >
                      <option value="A4">A4 (210mm x 297mm)</option>
                      <option value="letter">Carta (216mm x 279mm)</option>
                    </select>
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
                    <div>Folha: {customTemplate.pageSize === 'letter' ? 'Carta (216mm x 279mm)' : 'A4 (210mm x 297mm)'}</div>
                    <div>Margens automáticas (centralizado)</div>
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

              {/* Opções de Formatação */}
              <div className="mt-4 space-y-2">
                <h4 className="text-sm font-medium text-foreground">Formatação (Negrito)</h4>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={boldName}
                    onChange={(e) => setBoldName(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">Nome do produto</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={boldCode}
                    onChange={(e) => setBoldCode(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">Código interno</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={boldBarcode}
                    onChange={(e) => setBoldBarcode(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">Texto do código de barras</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={boldPrice}
                    onChange={(e) => setBoldPrice(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">Preço</span>
                </label>
              </div>

              {/* Tamanhos de Fonte */}
              <div className="mt-4 space-y-3">
                <h4 className="text-sm font-medium text-foreground">Tamanhos de Fonte (pt)</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Nome do produto</label>
                    <input
                      type="number"
                      min="6"
                      max="20"
                      step="0.5"
                      value={fontSizeName}
                      onChange={(e) => setFontSizeName(parseFloat(e.target.value) || 9)}
                      className="w-full px-2 py-1 bg-background border border-border rounded text-sm text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Código interno</label>
                    <input
                      type="number"
                      min="6"
                      max="20"
                      step="0.5"
                      value={fontSizeCode}
                      onChange={(e) => setFontSizeCode(parseFloat(e.target.value) || 8)}
                      className="w-full px-2 py-1 bg-background border border-border rounded text-sm text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Texto do código</label>
                    <input
                      type="number"
                      min="6"
                      max="20"
                      step="0.5"
                      value={fontSizeBarcode}
                      onChange={(e) => setFontSizeBarcode(parseFloat(e.target.value) || 7)}
                      className="w-full px-2 py-1 bg-background border border-border rounded text-sm text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Preço</label>
                    <input
                      type="number"
                      min="6"
                      max="20"
                      step="0.5"
                      value={fontSizePrice}
                      onChange={(e) => setFontSizePrice(parseFloat(e.target.value) || 11)}
                      className="w-full px-2 py-1 bg-background border border-border rounded text-sm text-foreground"
                    />
                  </div>
                </div>
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
                      {/* Header com botão fechar */}
                      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-level-1">
                        <span className="text-sm font-medium text-foreground">
                          {filteredProducts.length} resultado{filteredProducts.length !== 1 ? 's' : ''} encontrado{filteredProducts.length !== 1 ? 's' : ''}
                        </span>
                        <button
                          onClick={() => setIsSearchFocused(false)}
                          className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-level-2"
                          title="Fechar busca"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      
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
                          onChange={(e) => {
                            const newValue = parseInt(e.target.value) || 1;
                            if (newValue > 0) {
                              updateQuantity(item.product.id, newValue);
                            }
                          }}
                          className="w-16 text-center border border-border rounded py-1 bg-background text-foreground"
                          min="1"
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
          <div className="bg-card border border-border rounded-lg shadow p-6 flex flex-col">
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
              <div ref={printRef} className="flex-1 border rounded-lg overflow-hidden bg-gray-300 flex flex-col">
                {/* Preview da folha A4 - escala para caber na tela */}
                <div className="flex-1 flex items-start justify-center p-2 overflow-hidden">
                  <div
                    className="bg-white shadow-lg origin-top"
                    style={{
                      width: `${calculateCenteredMargins().pageWidth}mm`,
                      height: `${calculateCenteredMargins().pageHeight}mm`,
                      transform: 'scale(0.38)',
                      transformOrigin: 'top center',
                      flexShrink: 0,
                    }}
                  >
                  <div
                    style={{
                      position: 'absolute',
                      top: `${calculateCenteredMargins().marginTop}mm`,
                      left: `${calculateCenteredMargins().marginLeft}mm`,
                      display: 'grid',
                      gridTemplateColumns: `repeat(${getTemplate().cols}, ${getTemplate().labelWidth}mm)`,
                      gap: `${getTemplate().spacingY}mm ${getTemplate().spacingX}mm`,
                    }}
                  >
                    {generateLabelsArray()
                      .slice(0, getTemplate().cols * getTemplate().rows)
                      .map((product, idx) => {
                        const barcodeValue = product.barcode || product.internalCode;
                        return (
                          <div
                            key={`${product.id}-${idx}`}
                            className="border border-gray-300 flex flex-col items-center overflow-hidden bg-white"
                            style={{
                              width: `${getTemplate().labelWidth}mm`,
                              height: `${getTemplate().labelHeight}mm`,
                              padding: '1mm',
                              fontSize: getTemplate().labelHeight < 30 ? '7pt' : '9pt',
                              boxSizing: 'border-box',
                            }}
                          >
                            <div className={`text-center overflow-hidden ${boldName ? 'font-bold' : ''}`} style={{ maxHeight: `${Math.min(getTemplate().labelHeight * 0.4, 12)}mm`, lineHeight: 1.1, fontSize: `${fontSizeName}pt`, marginBottom: '1mm', flexShrink: 0 }}>
                              {product.name.length > 40 ? product.name.substring(0, 40) + '...' : product.name}
                            </div>
                            {showCode && (
                              <div className={`${boldCode ? 'font-bold text-black' : 'text-gray-600'}`} style={{ fontSize: `${fontSizeCode}pt`, marginBottom: '1mm', flexShrink: 0 }}>
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
                                    maxHeight: `${Math.min(getTemplate().labelHeight * 0.25, 10)}mm`,
                                    margin: '1mm 0',
                                    flexShrink: 0,
                                  }}
                                />
                                <div className={`${boldBarcode ? 'font-bold text-black' : 'text-gray-600'}`} style={{ fontSize: `${fontSizeBarcode}pt`, letterSpacing: '0.5px', marginBottom: '1mm', flexShrink: 0 }}>
                                  {barcodeValue}
                                </div>
                              </>
                            )}
                            {showPrice && (
                              <div className={`${boldPrice ? 'font-bold' : ''}`} style={{ fontSize: `${fontSizePrice}pt`, marginTop: '1mm', flexShrink: 0 }}>
                                {formatCurrency(product.salePrice)}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                  </div>
                </div>

                {/* Info da página */}
                <div className="bg-level-1 p-2 text-center text-sm text-muted-foreground border-t border-border">
                  {getTotalLabels()} etiquetas em {Math.ceil(getTotalLabels() / (getTemplate().cols * getTemplate().rows))} página(s) • Modelo: {getTemplate().name}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
