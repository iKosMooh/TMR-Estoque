'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface Warehouse {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  addressStreet: string | null;
  addressNumber: string | null;
  addressCity: string | null;
  addressState: string | null;
  isMain: number;
  isActive: number;
}

export default function DepositosPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    addressStreet: '',
    addressNumber: '',
    addressCity: '',
    addressState: '',
    isMain: false,
  });

  useEffect(() => {
    fetchWarehouses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const fetchWarehouses = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      params.append('activeOnly', 'true');
      
      const res = await fetch(`/api/warehouses?${params}`);
      const data = await res.json();
      setWarehouses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching warehouses:', error);
      toast.error('Erro ao carregar depósitos');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      addressStreet: '',
      addressNumber: '',
      addressCity: '',
      addressState: '',
      isMain: false,
    });
    setEditingWarehouse(null);
  };

  const openModal = (warehouse?: Warehouse) => {
    if (warehouse) {
      setEditingWarehouse(warehouse);
      setFormData({
        name: warehouse.name,
        code: warehouse.code || '',
        description: warehouse.description || '',
        addressStreet: warehouse.addressStreet || '',
        addressNumber: warehouse.addressNumber || '',
        addressCity: warehouse.addressCity || '',
        addressState: warehouse.addressState || '',
        isMain: warehouse.isMain === 1,
      });
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingWarehouse 
        ? `/api/warehouses/${editingWarehouse.id}` 
        : '/api/warehouses';
      
      const method = editingWarehouse ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erro ao salvar');
      }

      toast.success(editingWarehouse ? 'Depósito atualizado!' : 'Depósito criado!');
      setIsModalOpen(false);
      resetForm();
      fetchWarehouses();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este depósito?')) return;
    
    try {
      const res = await fetch(`/api/warehouses/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erro ao excluir');
      
      toast.success('Depósito excluído!');
      fetchWarehouses();
    } catch {
      toast.error('Erro ao excluir depósito');
    }
  };

  const estados = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Depósitos / Armazéns</h1>
            <p className="text-gray-600">Gerencie seus locais de armazenamento</p>
          </div>
          <button
            onClick={() => openModal()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Novo Depósito
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Buscar depósitos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : warehouses.length === 0 ? (
            <div className="col-span-full p-8 text-center text-gray-500 bg-white rounded-lg shadow">
              Nenhum depósito encontrado
            </div>
          ) : (
            warehouses.map((warehouse) => (
              <div key={warehouse.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-gray-900">{warehouse.name}</h3>
                      {warehouse.isMain === 1 && (
                        <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                          Principal
                        </span>
                      )}
                    </div>
                    {warehouse.code && (
                      <p className="text-sm text-gray-500">Código: {warehouse.code}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${warehouse.isActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span className="text-xs text-gray-500">{warehouse.isActive ? 'Ativo' : 'Inativo'}</span>
                  </div>
                </div>

                {warehouse.description && (
                  <p className="text-sm text-gray-600 mb-4">{warehouse.description}</p>
                )}

                {(warehouse.addressStreet || warehouse.addressCity) && (
                  <div className="text-sm text-gray-500 mb-4">
                    <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {warehouse.addressStreet && `${warehouse.addressStreet}, ${warehouse.addressNumber || 's/n'}`}
                    {warehouse.addressCity && ` - ${warehouse.addressCity}`}
                    {warehouse.addressState && `/${warehouse.addressState}`}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <button
                    onClick={() => openModal(warehouse)}
                    className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(warehouse.id)}
                    className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">
                {editingWarehouse ? 'Editar Depósito' : 'Novo Depósito'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isMain}
                        onChange={(e) => setFormData(prev => ({ ...prev, isMain: e.target.checked }))}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm font-medium text-gray-700">Depósito Principal</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Endereço</h3>
                  
                  <div className="grid grid-cols-4 gap-4">
                    <div className="col-span-3">
                      <label className="block text-sm text-gray-600 mb-1">Rua</label>
                      <input
                        type="text"
                        value={formData.addressStreet}
                        onChange={(e) => setFormData(prev => ({ ...prev, addressStreet: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Nº</label>
                      <input
                        type="text"
                        value={formData.addressNumber}
                        onChange={(e) => setFormData(prev => ({ ...prev, addressNumber: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm text-gray-600 mb-1">Cidade</label>
                      <input
                        type="text"
                        value={formData.addressCity}
                        onChange={(e) => setFormData(prev => ({ ...prev, addressCity: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm text-gray-600 mb-1">Estado</label>
                      <select
                        value={formData.addressState}
                        onChange={(e) => setFormData(prev => ({ ...prev, addressState: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Selecione...</option>
                        {estados.map(uf => (
                          <option key={uf} value={uf}>{uf}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => { setIsModalOpen(false); resetForm(); }}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {editingWarehouse ? 'Salvar' : 'Criar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
