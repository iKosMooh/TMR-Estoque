'use client';

import { useState, useEffect, useCallback } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { SearchBar } from '@/components/SearchBar';
import { Button } from '@/components/Button';
import { LoadingState } from '@/components/Loading';
import { EmptyState } from '@/components/EmptyState';
import { Modal } from '@/components/Modal';
import { Input } from '@/components/Input';

interface Supplier {
  id: string;
  companyName: string;
  tradingName: string | null;
  cnpj: string | null;
  stateRegistration: string | null;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  contactName: string | null;
  addressStreet: string | null;
  addressNumber: string | null;
  addressComplement: string | null;
  addressNeighborhood: string | null;
  addressCity: string | null;
  addressState: string | null;
  addressZipcode: string | null;
  notes: string | null;
  paymentTerms: string | null;
  isActive: boolean;
  createdAt: string;
}

interface SupplierFormData {
  companyName: string;
  tradingName: string;
  cnpj: string;
  stateRegistration: string;
  email: string;
  phone: string;
  mobile: string;
  contactName: string;
  addressStreet: string;
  addressNumber: string;
  addressComplement: string;
  addressNeighborhood: string;
  addressCity: string;
  addressState: string;
  addressZipcode: string;
  notes: string;
  paymentTerms: string;
}

const emptyFormData: SupplierFormData = {
  companyName: '',
  tradingName: '',
  cnpj: '',
  stateRegistration: '',
  email: '',
  phone: '',
  mobile: '',
  contactName: '',
  addressStreet: '',
  addressNumber: '',
  addressComplement: '',
  addressNeighborhood: '',
  addressCity: '',
  addressState: '',
  addressZipcode: '',
  notes: '',
  paymentTerms: '',
};

export default function Fornecedores() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null);
  const [formData, setFormData] = useState<SupplierFormData>(emptyFormData);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchSuppliers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      const response = await fetch(`/api/suppliers?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setSuppliers(data.suppliers || []);
      } else {
        toast.error('Erro ao carregar fornecedores');
      }
    } catch (error) {
      console.error('Erro ao buscar fornecedores:', error);
      toast.error('Erro ao carregar fornecedores');
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const openNewSupplierModal = () => {
    setFormData(emptyFormData);
    setIsEditing(false);
    setEditingSupplierId(null);
    setIsModalOpen(true);
  };

  const openEditSupplierModal = (supplier: Supplier) => {
    setFormData({
      companyName: supplier.companyName,
      tradingName: supplier.tradingName || '',
      cnpj: supplier.cnpj || '',
      stateRegistration: supplier.stateRegistration || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      mobile: supplier.mobile || '',
      contactName: supplier.contactName || '',
      addressStreet: supplier.addressStreet || '',
      addressNumber: supplier.addressNumber || '',
      addressComplement: supplier.addressComplement || '',
      addressNeighborhood: supplier.addressNeighborhood || '',
      addressCity: supplier.addressCity || '',
      addressState: supplier.addressState || '',
      addressZipcode: supplier.addressZipcode || '',
      notes: supplier.notes || '',
      paymentTerms: supplier.paymentTerms || '',
    });
    setIsEditing(true);
    setEditingSupplierId(supplier.id);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData(emptyFormData);
    setIsEditing(false);
    setEditingSupplierId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.companyName.trim()) {
      toast.error('Razão Social é obrigatória');
      return;
    }

    setIsSaving(true);
    try {
      const url = isEditing ? `/api/suppliers/${editingSupplierId}` : '/api/suppliers';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(isEditing ? 'Fornecedor atualizado com sucesso!' : 'Fornecedor criado com sucesso!');
        closeModal();
        fetchSuppliers();
      } else {
        toast.error(data.error || 'Erro ao salvar fornecedor');
      }
    } catch (error) {
      console.error('Erro ao salvar fornecedor:', error);
      toast.error('Erro ao salvar fornecedor');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/suppliers/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Fornecedor excluído com sucesso!');
        setDeleteConfirmId(null);
        fetchSuppliers();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Erro ao excluir fornecedor');
      }
    } catch (error) {
      console.error('Erro ao excluir fornecedor:', error);
      toast.error('Erro ao excluir fornecedor');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatCnpj = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
      .slice(0, 18);
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d{1,4})$/, '$1-$2');
    } else {
      return numbers
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d{1,4})$/, '$1-$2');
    }
  };

  const formatCep = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{5})(\d{1,3})$/, '$1-$2').slice(0, 9);
  };

  const handleInputChange = (field: keyof SupplierFormData, value: string) => {
    let formattedValue = value;
    
    if (field === 'cnpj') {
      formattedValue = formatCnpj(value);
    } else if (field === 'phone' || field === 'mobile') {
      formattedValue = formatPhone(value);
    } else if (field === 'addressZipcode') {
      formattedValue = formatCep(value);
    }
    
    setFormData({ ...formData, [field]: formattedValue });
  };

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (supplier.tradingName && supplier.tradingName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (supplier.cnpj && supplier.cnpj.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (supplier.email && supplier.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Fornecedores
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie sua base de fornecedores
          </p>
        </div>
        <Button onClick={openNewSupplierModal}>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Novo Fornecedor
        </Button>
      </div>

      {/* Search */}
      <div className="max-w-md">
        <SearchBar
          placeholder="Buscar por nome, CNPJ ou email..."
          value={searchTerm}
          onChange={handleSearch}
        />
      </div>

      {/* Lista de Fornecedores */}
      {isLoading ? (
        <LoadingState message="Carregando fornecedores..." />
      ) : filteredSuppliers.length === 0 ? (
        <EmptyState
          title="Nenhum fornecedor encontrado"
          description={searchTerm ? 'Tente buscar por outros termos' : 'Comece cadastrando seu primeiro fornecedor'}
          icon={
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
          action={
            !searchTerm && (
              <Button onClick={openNewSupplierModal}>
                Cadastrar Fornecedor
              </Button>
            )
          }
        />
      ) : (
        <div className="bg-card border border-border shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-level-1">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Fornecedor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    CNPJ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Contato
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Cidade/UF
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Prazo de Pagamento
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {filteredSuppliers.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-level-1">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                            <span className="text-orange-500 font-medium text-sm">
                              {supplier.companyName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-foreground">
                            {supplier.tradingName || supplier.companyName}
                          </div>
                          {supplier.tradingName && (
                            <div className="text-sm text-muted-foreground">
                              {supplier.companyName}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {supplier.cnpj || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-foreground">
                        {supplier.contactName || '-'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {supplier.phone || supplier.mobile || supplier.email || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {supplier.addressCity && supplier.addressState
                        ? `${supplier.addressCity}/${supplier.addressState}`
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {supplier.paymentTerms || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openEditSupplierModal(supplier)}
                        className="text-primary hover:text-primary/80 mr-4"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(supplier.id)}
                        className="text-destructive hover:text-destructive/80"
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Cadastro/Edição */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={isEditing ? 'Editar Fornecedor' : 'Novo Fornecedor'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dados da Empresa */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Input
                label="Razão Social *"
                value={formData.companyName}
                onChange={(e) => handleInputChange('companyName', e.target.value)}
                required
              />
            </div>
            <div className="md:col-span-2">
              <Input
                label="Nome Fantasia"
                value={formData.tradingName}
                onChange={(e) => handleInputChange('tradingName', e.target.value)}
              />
            </div>
            <Input
              label="CNPJ"
              value={formData.cnpj}
              onChange={(e) => handleInputChange('cnpj', e.target.value)}
              placeholder="00.000.000/0000-00"
            />
            <Input
              label="Inscrição Estadual"
              value={formData.stateRegistration}
              onChange={(e) => handleInputChange('stateRegistration', e.target.value)}
            />
          </div>

          {/* Contato */}
          <div className="border-t border-border pt-4">
            <h3 className="text-sm font-medium text-foreground mb-4">Contato</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nome do Contato"
                value={formData.contactName}
                onChange={(e) => handleInputChange('contactName', e.target.value)}
              />
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
              />
              <Input
                label="Telefone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="(00) 0000-0000"
              />
              <Input
                label="Celular"
                value={formData.mobile}
                onChange={(e) => handleInputChange('mobile', e.target.value)}
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>

          {/* Endereço */}
          <div className="border-t border-border pt-4">
            <h3 className="text-sm font-medium text-foreground mb-4">Endereço</h3>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div className="md:col-span-2">
                <Input
                  label="CEP"
                  value={formData.addressZipcode}
                  onChange={(e) => handleInputChange('addressZipcode', e.target.value)}
                  placeholder="00000-000"
                />
              </div>
              <div className="md:col-span-4">
                <Input
                  label="Logradouro"
                  value={formData.addressStreet}
                  onChange={(e) => handleInputChange('addressStreet', e.target.value)}
                />
              </div>
              <div className="md:col-span-1">
                <Input
                  label="Número"
                  value={formData.addressNumber}
                  onChange={(e) => handleInputChange('addressNumber', e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <Input
                  label="Complemento"
                  value={formData.addressComplement}
                  onChange={(e) => handleInputChange('addressComplement', e.target.value)}
                />
              </div>
              <div className="md:col-span-3">
                <Input
                  label="Bairro"
                  value={formData.addressNeighborhood}
                  onChange={(e) => handleInputChange('addressNeighborhood', e.target.value)}
                />
              </div>
              <div className="md:col-span-4">
                <Input
                  label="Cidade"
                  value={formData.addressCity}
                  onChange={(e) => handleInputChange('addressCity', e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <Input
                  label="UF"
                  value={formData.addressState}
                  onChange={(e) => handleInputChange('addressState', e.target.value.toUpperCase().slice(0, 2))}
                  maxLength={2}
                />
              </div>
            </div>
          </div>

          {/* Informações Comerciais */}
          <div className="border-t border-border pt-4">
            <h3 className="text-sm font-medium text-foreground mb-4">Informações Comerciais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Prazo de Pagamento"
                value={formData.paymentTerms}
                onChange={(e) => handleInputChange('paymentTerms', e.target.value)}
                placeholder="Ex: 30/60/90 dias"
              />
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1">
                  Observações
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-border rounded-md shadow-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Salvando...' : isEditing ? 'Atualizar' : 'Cadastrar'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal de Confirmação de Exclusão */}
      <Modal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        title="Confirmar Exclusão"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Tem certeza que deseja excluir este fornecedor? Esta ação não pode ser desfeita.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeleteConfirmId(null)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              disabled={isDeleting}
            >
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
