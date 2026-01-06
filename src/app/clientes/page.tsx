'use client';

import { useState, useEffect, useCallback } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { SearchBar } from '@/components/SearchBar';
import { Button } from '@/components/Button';
import { LoadingState } from '@/components/Loading';
import { EmptyState } from '@/components/EmptyState';
import { Modal } from '@/components/Modal';
import { Input } from '@/components/Input';

interface Customer {
  id: string;
  type: 'pf' | 'pj';
  name: string;
  cpfCnpj: string | null;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  addressStreet: string | null;
  addressNumber: string | null;
  addressComplement: string | null;
  addressNeighborhood: string | null;
  addressCity: string | null;
  addressState: string | null;
  addressZipcode: string | null;
  notes: string | null;
  creditLimit: string | null;
  isActive: boolean;
  createdAt: string;
}

interface CustomerFormData {
  type: 'pf' | 'pj';
  name: string;
  cpfCnpj: string;
  email: string;
  phone: string;
  mobile: string;
  addressStreet: string;
  addressNumber: string;
  addressComplement: string;
  addressNeighborhood: string;
  addressCity: string;
  addressState: string;
  addressZipcode: string;
  notes: string;
  creditLimit: string;
}

const emptyFormData: CustomerFormData = {
  type: 'pf',
  name: '',
  cpfCnpj: '',
  email: '',
  phone: '',
  mobile: '',
  addressStreet: '',
  addressNumber: '',
  addressComplement: '',
  addressNeighborhood: '',
  addressCity: '',
  addressState: '',
  addressZipcode: '',
  notes: '',
  creditLimit: '',
};

export default function Clientes() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CustomerFormData>(emptyFormData);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      const response = await fetch(`/api/customers?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setCustomers(data.customers || []);
      } else {
        toast.error('Erro ao carregar clientes');
      }
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      toast.error('Erro ao carregar clientes');
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const openNewCustomerModal = () => {
    setFormData(emptyFormData);
    setIsEditing(false);
    setEditingCustomerId(null);
    setIsModalOpen(true);
  };

  const openEditCustomerModal = (customer: Customer) => {
    setFormData({
      type: customer.type,
      name: customer.name,
      cpfCnpj: customer.cpfCnpj || '',
      email: customer.email || '',
      phone: customer.phone || '',
      mobile: customer.mobile || '',
      addressStreet: customer.addressStreet || '',
      addressNumber: customer.addressNumber || '',
      addressComplement: customer.addressComplement || '',
      addressNeighborhood: customer.addressNeighborhood || '',
      addressCity: customer.addressCity || '',
      addressState: customer.addressState || '',
      addressZipcode: customer.addressZipcode || '',
      notes: customer.notes || '',
      creditLimit: customer.creditLimit || '',
    });
    setIsEditing(true);
    setEditingCustomerId(customer.id);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData(emptyFormData);
    setIsEditing(false);
    setEditingCustomerId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    setIsSaving(true);
    try {
      const url = isEditing ? `/api/customers/${editingCustomerId}` : '/api/customers';
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
        toast.success(isEditing ? 'Cliente atualizado com sucesso!' : 'Cliente criado com sucesso!');
        closeModal();
        fetchCustomers();
      } else {
        toast.error(data.error || 'Erro ao salvar cliente');
      }
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      toast.error('Erro ao salvar cliente');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/customers/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Cliente excluído com sucesso!');
        setDeleteConfirmId(null);
        fetchCustomers();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Erro ao excluir cliente');
      }
    } catch (error) {
      console.error('Erro ao excluir cliente:', error);
      toast.error('Erro ao excluir cliente');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatCpfCnpj = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (formData.type === 'pf') {
      // CPF: 000.000.000-00
      return numbers
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
        .slice(0, 14);
    } else {
      // CNPJ: 00.000.000/0000-00
      return numbers
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
        .slice(0, 18);
    }
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

  const handleInputChange = (field: keyof CustomerFormData, value: string) => {
    let formattedValue = value;
    
    if (field === 'cpfCnpj') {
      formattedValue = formatCpfCnpj(value);
    } else if (field === 'phone' || field === 'mobile') {
      formattedValue = formatPhone(value);
    } else if (field === 'addressZipcode') {
      formattedValue = formatCep(value);
    }
    
    setFormData({ ...formData, [field]: formattedValue });
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.cpfCnpj && customer.cpfCnpj.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Clientes
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie sua base de clientes
          </p>
        </div>
        <Button onClick={openNewCustomerModal}>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Novo Cliente
        </Button>
      </div>

      {/* Search */}
      <div className="max-w-md">
        <SearchBar
          placeholder="Buscar por nome, CPF/CNPJ ou email..."
          value={searchTerm}
          onChange={handleSearch}
        />
      </div>

      {/* Lista de Clientes */}
      {isLoading ? (
        <LoadingState message="Carregando clientes..." />
      ) : filteredCustomers.length === 0 ? (
        <EmptyState
          title="Nenhum cliente encontrado"
          description={searchTerm ? 'Tente buscar por outros termos' : 'Comece cadastrando seu primeiro cliente'}
          icon={
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
          action={
            !searchTerm && (
              <Button onClick={openNewCustomerModal}>
                Cadastrar Cliente
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
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    CPF/CNPJ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Contato
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Cidade/UF
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-level-1">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-primary font-medium text-sm">
                              {customer.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-foreground">
                            {customer.name}
                          </div>
                          {customer.email && (
                            <div className="text-sm text-muted-foreground">
                              {customer.email}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        customer.type === 'pf' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                          : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
                      }`}>
                        {customer.type === 'pf' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {customer.cpfCnpj || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {customer.phone || customer.mobile || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {customer.addressCity && customer.addressState
                        ? `${customer.addressCity}/${customer.addressState}`
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openEditCustomerModal(customer)}
                        className="text-primary hover:text-primary/80 mr-4"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(customer.id)}
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
        title={isEditing ? 'Editar Cliente' : 'Novo Cliente'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tipo de Cliente */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Tipo de Cliente
            </label>
            <div className="flex gap-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="type"
                  value="pf"
                  checked={formData.type === 'pf'}
                  onChange={(e) => {
                    setFormData({ ...formData, type: e.target.value as 'pf' | 'pj', cpfCnpj: '' });
                  }}
                  className="form-radio h-4 w-4 text-primary"
                />
                <span className="ml-2 text-sm text-foreground">Pessoa Física</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="type"
                  value="pj"
                  checked={formData.type === 'pj'}
                  onChange={(e) => {
                    setFormData({ ...formData, type: e.target.value as 'pf' | 'pj', cpfCnpj: '' });
                  }}
                  className="form-radio h-4 w-4 text-primary"
                />
                <span className="ml-2 text-sm text-foreground">Pessoa Jurídica</span>
              </label>
            </div>
          </div>

          {/* Dados Básicos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Input
                label={formData.type === 'pf' ? 'Nome Completo *' : 'Razão Social *'}
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder={formData.type === 'pf' ? 'Ex: João da Silva' : 'Ex: Empresa Ltda'}
                required
              />
            </div>
            <Input
              label={formData.type === 'pf' ? 'CPF' : 'CNPJ'}
              value={formData.cpfCnpj}
              onChange={(e) => handleInputChange('cpfCnpj', e.target.value)}
              placeholder={formData.type === 'pf' ? '000.000.000-00' : '00.000.000/0000-00'}
            />
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="exemplo@email.com"
            />
          </div>

          {/* Contato */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  placeholder="Rua, Avenida, etc."
                />
              </div>
              <div className="md:col-span-1">
                <Input
                  label="Número"
                  value={formData.addressNumber}
                  onChange={(e) => handleInputChange('addressNumber', e.target.value)}
                  placeholder="123"
                />
              </div>
              <div className="md:col-span-2">
                <Input
                  label="Complemento"
                  value={formData.addressComplement}
                  onChange={(e) => handleInputChange('addressComplement', e.target.value)}
                  placeholder="Apto, Sala, Bloco..."
                />
              </div>
              <div className="md:col-span-3">
                <Input
                  label="Bairro"
                  value={formData.addressNeighborhood}
                  onChange={(e) => handleInputChange('addressNeighborhood', e.target.value)}
                  placeholder="Nome do bairro"
                />
              </div>
              <div className="md:col-span-4">
                <Input
                  label="Cidade"
                  value={formData.addressCity}
                  onChange={(e) => handleInputChange('addressCity', e.target.value)}
                  placeholder="Nome da cidade"
                />
              </div>
              <div className="md:col-span-2">
                <Input
                  label="UF"
                  value={formData.addressState}
                  onChange={(e) => handleInputChange('addressState', e.target.value.toUpperCase().slice(0, 2))}
                  maxLength={2}
                  placeholder="SP"
                />
              </div>
            </div>
          </div>

          {/* Informações Adicionais */}
          <div className="border-t border-border pt-4">
            <h3 className="text-sm font-medium text-foreground mb-4">Informações Adicionais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Limite de Crédito (R$)"
                type="number"
                step="0.01"
                min="0"
                value={formData.creditLimit}
                onChange={(e) => handleInputChange('creditLimit', e.target.value)}
                placeholder="0,00"
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
                  placeholder="Observações gerais sobre o cliente..."
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
            Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.
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
