'use client';

import { useState } from 'react';

interface PreviewItem {
  internalCode?: string;
  barcode?: string;
  name?: string;
  ncm?: string;
  cfop?: string;
  cst?: string;
  salePrice: number;
  quantity: number;
  editedSalePrice?: number;
  editedQuantity?: number;
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

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [editedItems, setEditedItems] = useState<{[key: number]: {salePrice: number; quantity: number}}>({});

  const handlePreview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/import/xml/preview', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        setResult({ success: false, message: error.error || 'Erro na prévia', results: { created: 0, updated: 0, errors: [], movements: [] } });
        return;
      }

      const data: PreviewResult = await response.json();
      setPreview(data);
      setEditedItems({}); // Resetar edições para nova prévia
      setResult(null);
    } catch {
      setResult({ success: false, message: 'Erro ao gerar prévia', results: { created: 0, updated: 0, errors: [], movements: [] } });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!preview) return;

    setImporting(true);
    try {
      // Aplicar as edições aos itens da prévia
      const editedPreview = {
        ...preview,
        previewItems: preview.previewItems.map((item, index) => ({
          ...item,
          salePrice: getEditedPrice(index, item.salePrice),
          quantity: getEditedQuantity(index, item.quantity),
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
      setResult(data);
      if (data.success) {
        setPreview(null);
        setFile(null);
      }
    } catch {
      setResult({ success: false, message: 'Erro ao confirmar importação', results: { created: 0, updated: 0, errors: [], movements: [] } });
    } finally {
      setImporting(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setEditedItems({});
  };

  const handlePriceChange = (index: number, value: string) => {
    const numValue = parseFloat(value) || 0;
    if (numValue >= 0) {
      setEditedItems(prev => ({
        ...prev,
        [index]: { ...prev[index], salePrice: numValue }
      }));
    }
  };

  const handleQuantityChange = (index: number, value: string) => {
    const numValue = parseInt(value) || 0;
    if (numValue >= 0) {
      setEditedItems(prev => ({
        ...prev,
        [index]: { ...prev[index], quantity: numValue }
      }));
    }
  };

  const getEditedPrice = (index: number, originalPrice: number) => {
    return editedItems[index]?.salePrice ?? originalPrice;
  };

  const getEditedQuantity = (index: number, originalQuantity: number) => {
    return editedItems[index]?.quantity ?? originalQuantity;
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Importar XML NF-e - TMR Auto Elétrica</h1>

      {!preview && (
        <form onSubmit={handlePreview} className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Selecione o arquivo XML
            </label>
            <input
              type="file"
              accept=".xml"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          <button
            type="submit"
            disabled={!file || loading}
            className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? 'Gerando prévia...' : 'Gerar Prévia'}
          </button>
        </form>
      )}

      {preview && (
        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Prévia da Importação</h2>
            <p><strong>Tipo de XML:</strong> {preview.xmlType}</p>
            <p><strong>Arquivo:</strong> {preview.fileName}</p>
            <p><strong>Total de itens:</strong> {preview.totalItems}</p>
          </div>

          <div className="bg-white border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
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
                {preview.previewItems.map((item, index) => (
                  <tr key={index} className="border-t">
                    <td className="px-4 py-2">{item.internalCode || item.barcode}</td>
                    <td className="px-4 py-2">{item.name}</td>
                    <td className="px-4 py-2">
                      <div className="flex items-center">
                        <span className="mr-2 text-gray-900">R$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={getEditedPrice(index, item.salePrice).toFixed(2)}
                          onChange={(e) => handlePriceChange(index, e.target.value)}
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
                        value={getEditedQuantity(index, item.quantity)}
                        onChange={(e) => handleQuantityChange(index, e.target.value)}
                        className="w-24 px-2 py-1 border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        item.action === 'create' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {item.action === 'create' ? 'Criar' : 'Atualizar'}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      {item.existing ? (
                        <span className="text-orange-600 text-sm">
                          Produto existente (estoque atual: {item.existing.currentQuantity || 0})
                        </span>
                      ) : (
                        <span className="text-green-600 text-sm">Novo produto</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleConfirmImport}
              disabled={importing}
              className="bg-green-500 text-white px-6 py-2 rounded disabled:opacity-50"
            >
              {importing ? 'Importando...' : 'Confirmar Importação'}
            </button>
            <button
              onClick={resetForm}
              className="bg-gray-500 text-white px-6 py-2 rounded"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {result && (
        <div className={`mt-6 p-4 border rounded ${result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          <h2 className="font-semibold mb-2">{result.success ? 'Importação Concluída' : 'Erro na Importação'}</h2>
          <p className="mb-2">{result.message}</p>
          {result.results && (
            <div className="text-sm">
              <p>Produtos criados: {result.results.created}</p>
              <p>Produtos atualizados: {result.results.updated}</p>
              {result.results.errors.length > 0 && (
                <div className="mt-2">
                  <p className="font-medium">Erros:</p>
                  <ul className="list-disc list-inside">
                    {result.results.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
